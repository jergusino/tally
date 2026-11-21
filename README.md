# Tally: wishlist site

One static page for the Tally Android app. Visitors join a wishlist with their email. Emails go to the "Subscribers" tab of the "Newsletter signups" Google Sheet.

Live at https://jergusino.github.io/tally/ once GitHub Pages is on (step 3).

## Files

- `index.html`, `styles.css`, `script.js`: the page.
- `apps-script/Code.gs`: the endpoint that writes signups to the sheet. It runs in Google Apps Script, not on GitHub.
- `favicon.svg`: tab icon.
- The phone mockup in the hero is drawn in CSS: a Reels-style UI on a black screen, with the Tally overlay centred on it.
- `images/phone-back.png`: the back of the phone mockup, cropped from the supplied hardware photo with rounded corners.

## Setup

### 1. Deploy the endpoint (once, about 3 minutes)

1. Open the sheet "Newsletter signups" in Google Drive.
2. Extensions > Apps Script. Delete the default code and paste the contents of `apps-script/Code.gs`. Save.
3. Deploy > New deployment > type "Web app".
   - Execute as: Me
   - Who has access: Anyone
4. Click Deploy, authorize the script when Google asks, then copy the web-app URL (it ends in `/exec`).

### 2. Connect the page

Paste the URL into `ENDPOINT` at the top of `script.js`. Commit and push. Until this is set, the form shows "not connected yet" and saves nothing.

### 3. Turn on GitHub Pages (once)

Repo Settings > Pages > Build and deployment > Source: "Deploy from a branch" > Branch: `main`, folder `/ (root)` > Save.

### 4. Test

Submit your own email with the box ticked. A new row should appear in the Subscribers tab with List = `tally-wishlist`. Submit the same address again: the page says you are already on the list and no second row is added.

## Notes

- Signups are single opt-in. Rows get a blank "Confirmed" value, the same as the existing font-tool and palette-pack rows. The portfolio privacy page says unconfirmed signups are deleted after 48 hours. That rule does not apply here yet, so either add a confirmation step or update that page before launch.
- The page loads nothing from other servers: no fonts, no analytics, no cookies.
- Copy is in English. The app's interface language is still open.
