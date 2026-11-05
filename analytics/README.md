# Private A1 FAMILY MEDIA analytics setup

This project uses Google Apps Script, Google Sheets and Gmail/MailApp. It has no paid service dependency. The Apps Script source contains no notification email address or credentials.

## What it counts

- **Unique website visitors:** one per browser profile, using a random first-party browser ID.
- **Unique APK downloaders:** one per browser profile that clicks the official APK download link, regardless of repeat clicks from that same browser profile.
- **First app launches:** one per app installation ID stored locally by Android.

This is privacy-conscious approximate uniqueness, not identity verification. A person using another browser, clearing browser storage, using another device, or reinstalling the app can be counted again. Multiple people sharing one browser profile may be counted as one. No IP-address fingerprinting is used. The server stores only a salted hash of each random identifier.

## One-time private setup

1. Open https://script.google.com/ while signed in to the Google account you want to use for private analytics.
2. Create a new standalone Apps Script project.
3. Replace the starter code with the contents of `Code.gs` from this folder.
4. Open **Project Settings → Script Properties → Add script property**:
   - Property: `A1_NOTIFY_EMAIL`
   - Value: your private notification email address.
5. Save, return to the editor, select `setup`, and click **Run**. Approve the Google Sheets and email permissions. The function creates a private spreadsheet and a private random hashing secret. Keep the spreadsheet private.
6. Select **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Deploy and copy the Web app URL ending in `/exec`.

Do not paste your email address or any Google credentials into this public repository. The web app URL is an endpoint, not a password; it can be configured in the site and app after deployment.

## Activation status

The analytics backend is prepared here, but tracking is not active until the web app is deployed and its URL is configured in both the website and Android build. Email alerts also depend on Google account MailApp quotas and Google's authorization policies.
