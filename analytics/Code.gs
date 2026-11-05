const SHEET_PROPERTY = "A1_TRACKING_SHEET_ID";
const EMAIL_PROPERTY = "A1_NOTIFY_EMAIL";
const SECRET_PROPERTY = "A1_HASH_SECRET";

function setup() {
  const properties = PropertiesService.getScriptProperties();
  const recipient = properties.getProperty(EMAIL_PROPERTY);
  if (!recipient || !recipient.includes("@")) {
    throw new Error("Set the private script property A1_NOTIFY_EMAIL before running setup.");
  }

  let spreadsheetId = properties.getProperty(SHEET_PROPERTY);
  let spreadsheet;
  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create("A1 FAMILY MEDIA — Private User Analytics");
    properties.setProperty(SHEET_PROPERTY, spreadsheet.getId());
  }

  ensureSheet(spreadsheet, "Visitors", ["First seen (UTC)", "Hashed browser ID"]);
  ensureSheet(spreadsheet, "Downloaders", ["First download click (UTC)", "Hashed browser ID"]);
  ensureSheet(spreadsheet, "Installations", ["First launch (UTC)", "Hashed installation ID"]);
  if (!properties.getProperty(SECRET_PROPERTY)) {
    properties.setProperty(SECRET_PROPERTY, Utilities.getUuid() + Utilities.getUuid());
  }
  return spreadsheet.getUrl();
}

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || "");
  const id = String((e && e.parameter && e.parameter.id) || "");
  if (!["visit", "download"].includes(action)) return output({ ok: false, error: "Unsupported action" });
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(id)) return output({ ok: false, error: "Invalid identifier" });

  try {
    const result = recordUnique(action === "visit" ? "Visitors" : "Downloaders", id);
    if (result.isNew && action === "download") {
      notify("New A1 FAMILY MEDIA downloader", "A new browser identifier clicked the official APK download link for the first time.\n\nUnique downloaders: " + result.count);
    }
    return output({ ok: true, isNew: result.isNew });
  } catch (error) {
    return output({ ok: false, error: String(error) });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (payload.action !== "install") return output({ ok: false, error: "Unsupported action" });
    const id = String(payload.id || "");
    if (!/^[A-Za-z0-9_-]{20,100}$/.test(id)) return output({ ok: false, error: "Invalid identifier" });
    const result = recordUnique("Installations", id);
    if (result.isNew) {
      notify("New A1 FAMILY MEDIA installation", "A new installation has opened A1 FAMILY MEDIA for the first time.\n\nUnique recorded installations: " + result.count);
    }
    return output({ ok: true, isNew: result.isNew });
  } catch (error) {
    return output({ ok: false, error: String(error) });
  }
}

function recordUnique(sheetName, rawId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const properties = PropertiesService.getScriptProperties();
    const spreadsheetId = properties.getProperty(SHEET_PROPERTY);
    const secret = properties.getProperty(SECRET_PROPERTY);
    if (!spreadsheetId || !secret) throw new Error("Run setup() before deploying the web app.");

    const digest = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      secret + ":" + rawId,
      Utilities.Charset.UTF_8
    );
    const hashedId = digest.map(function (byte) {
      const value = (byte + 256) % 256;
      return ("0" + value.toString(16)).slice(-2);
    }).join("");

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const found = sheet.getRange(2, 2, lastRow - 1, 1)
        .createTextFinder(hashedId).matchEntireCell(true).findNext();
      if (found) return { isNew: false, count: lastRow - 1 };
    }
    sheet.appendRow([new Date(), hashedId]);
    return { isNew: true, count: sheet.getLastRow() - 1 };
  } finally {
    lock.releaseLock();
  }
}

function ensureSheet(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
}

function notify(subject, body) {
  const recipient = PropertiesService.getScriptProperties().getProperty(EMAIL_PROPERTY);
  if (!recipient) throw new Error("Notification recipient is not configured.");
  MailApp.sendEmail({ to: recipient, subject: subject, body: body });
}

function output(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
