(() => {
  "use strict";
  // Set this to the deployed Apps Script /exec URL after private setup.
  const ENDPOINT = "";
  const STORAGE_KEY = "a1-family-media-browser-id";

  function getBrowserId() {
    try {
      let id = localStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = (window.crypto && crypto.randomUUID)
          ? crypto.randomUUID()
          : "a1-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        localStorage.setItem(STORAGE_KEY, id);
      }
      return id;
    } catch (_) {
      // Do not fingerprint users when browser storage is unavailable.
      return null;
    }
  }

  function record(action) {
    if (!ENDPOINT) return;
    const id = getBrowserId();
    if (!id) return;
    const beacon = new Image();
    beacon.referrerPolicy = "no-referrer";
    beacon.src = ENDPOINT + "?action=" + encodeURIComponent(action) + "&id=" + encodeURIComponent(id) + "&t=" + Date.now();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => record("visit"), { once: true });
  } else {
    record("visit");
  }

  document.addEventListener("click", event => {
    const link = event.target && event.target.closest
      ? event.target.closest('a[href*="app-release.apk"]')
      : null;
    if (link) record("download");
  });
})();
