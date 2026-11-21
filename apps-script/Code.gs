/**
 * Wishlist endpoint for the Tally site (jergusino.github.io/tally).
 * Writes one row per signup into the "Subscribers" tab of the "Newsletter signups" sheet.
 *
 * Setup (once): see README.md. After changing this file: Deploy > Manage deployments >
 * edit > New version (the URL stays the same).
 */
var SHEET_ID = '16P0d7loImDomWPG9GpTgpHCfdGbLckaXOaiameCl6PE';
var TAB = 'Subscribers';
var CONSENT = 'Agreed to receive an email when Tally is available';
var SOURCE = 'jergusino.github.io/tally';
var LIST = 'tally-wishlist';

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.website) return out_({ ok: true });                 // honeypot: pretend success
    var email = clean_(p.email, 160).toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return out_({ ok: false, error: 'bad email' });
    if (p.consent !== 'on') return out_({ ok: false, error: 'no consent' });

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(TAB);
      var last = sheet.getLastRow();
      if (last > 1) {
        // Columns: A Confirmed, B Email, C Consent, D Signed up, E Source, F List
        var rows = sheet.getRange(2, 1, last - 1, 6).getValues();
        for (var i = 0; i < rows.length; i++) {
          if (String(rows[i][1]).trim().toLowerCase() === email && String(rows[i][5]).trim() === LIST) {
            return out_({ ok: true, duplicate: true });
          }
        }
      }
      var now = Utilities.formatDate(new Date(), 'Europe/Bratislava', 'd.M.yyyy H:mm:ss');
      sheet.appendRow(['', email, CONSENT, now, SOURCE, LIST]);
    } finally {
      lock.releaseLock();
    }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: 'server' });
  }
}

function doGet() { return out_({ ok: true, info: 'tally wishlist endpoint' }); }

// strip control chars, trim, cap length
function clean_(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001F]/g, ' ').trim().slice(0, max); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
