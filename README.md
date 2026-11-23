# Tally: site

One static page for the Tally Android app. It shows the app with a playable demo and has a waitlist form. Emails go to the "Subscribers" tab of the "Newsletter signups" Google Sheet.

Live at https://jergusino.github.io/tally/ (GitHub Pages, branch `main`, folder `/`).

## Files

- `index.html`, `styles.css`, `script.js`: the page. No build step.
- `fonts/inter-latin-var.woff2`: Inter (variable), self-hosted, Latin only.
- `images/logo.svg`: eye and wordmark from the Tally logo. `images/favicon.png`: tab icon.
- `apps-script/Code.gs`: the endpoint that writes signups to the sheet. It runs in Google Apps Script, not on GitHub.

## What is on the page

- The demo phone: drag the screen up or down (or use Swipe, or Space on the focused screen). Each swipe counts, the number goes white, amber, red, and the veil closes in. A ring pulse fires every 50th swipe.
- Settings you can change on the page: overlay style (Both, Swipes, Time), veil speed (1 to 5), grace swipes (0 to 20), and the eye switch for Tally on or off.
- Live widgets (2x2 and 2x1) share the same on/off switch. Today's total keeps counting when you reset the session count. The starting total of 128 is demo data.
- Two waitlist forms (top and bottom) use the same handler in `script.js`.
- The phone is drawn in CSS and is a generic Android-style frame. The feed is abstract shapes and filler captions, not a real app.

## Setup

### 1. Deploy the endpoint (once)

1. Open the sheet "Newsletter signups" in Google Drive.
2. Extensions > Apps Script. Delete the default code and paste the contents of `apps-script/Code.gs`. Save.
3. Deploy > New deployment > type "Web app". Execute as: Me. Who has access: Anyone.
4. Authorize the script, then copy the web-app URL (ends in `/exec`).

After changing `Code.gs`: Deploy > Manage deployments > edit > New version. The URL stays the same.

### 2. Connect the page

Paste the URL into `ENDPOINT` at the top of `script.js`. Commit and push.

### 3. Turn on GitHub Pages (once)

Repo Settings > Pages > Source: "Deploy from a branch" > Branch: `main`, folder `/ (root)` > Save.

### 4. Test

Submit your own email with the box ticked. A new row should appear in the Subscribers tab with List = `tally-wishlist`. Submit the same address again: the page says you are already on the waitlist and no second row is added.

## Notes

- Signups are single opt-in. Rows get a blank "Confirmed" value, like the existing font-tool and palette-pack rows. The portfolio privacy page says unconfirmed signups are deleted after 48 hours. That rule does not apply here yet, so either add a confirmation step or update that page before launch.
- The page loads nothing from other servers: no outside fonts, no analytics, no cookies.
- Copy is in English. The app's interface language is still open.
- The sheet list name stays `tally-wishlist` so older rows still match.
