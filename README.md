# Tally: site

One static page for the Tally Android app. It shows the app with a playable demo and has a waitlist form. Emails go to the `jergusino-mail` Cloudflare Worker at `https://api.jergusino.com/subscribe` (code and setup: `tools/mail-worker/` in the jergusino.github.io repo). It sends mail through Brevo from noreply@jergusino.com and stores signups in its D1 database.

Live at https://jergusino.github.io/tally/ (GitHub Pages, branch `main`, folder `/`).

## Files

- `index.html`, `styles.css`, `script.js` (forms, nav), `demo.js` (the demo phone): one page with sections #number, #veil, #widgets and #settings. The nav scrolls smoothly to them. No build step.
- `fonts/inter-latin-var.woff2`: Inter (variable), self-hosted, Latin only.
- `images/number.webp`, `veil.webp`, `apps.webp`: graphics of the app screens, drawn from the UI (not photos of a phone). `apps.webp` shows the current Home and Settings. Each has a `-for-dark.webp` twin (light screens, silver frames) that the page swaps in under `prefers-color-scheme: dark`. Screens are always the opposite of the page colour, the demo phone included (see the end of `styles.css`). The images are drawn with a script, not photographed.
- `images/logo.svg`: eye and wordmark from the Tally logo. `images/favicon.png`: tab icon.

## What is on the page

- The demo phone: drag the screen up or down (or use Swipe, or Space on the focused screen). Each swipe counts, the number goes white, amber, red, and the veil closes in. A ring pulse fires every 50th swipe.
- Settings you can change on the page: overlay style (Both, Swipes, Time), veil speed (1 to 5), grace swipes (0 to 20), and the eye switch for Tally on or off.
- Live widgets (2x2 and 2x1) share the same on/off switch. Today's total keeps counting when you reset the session count. The starting total of 128 is demo data.
- Two waitlist forms (top and bottom) use the same handler in `script.js`.
- The phone is drawn in CSS and is a generic Android-style frame. The feed is abstract shapes and filler captions, not a real app.

## Setup

### 1. Endpoint

`ENDPOINT` in `script.js` is the Worker. The form posts `list=tally-wishlist`, `consent=on` and the honeypot `website`.

### 2. Turn on GitHub Pages (once)

Repo Settings > Pages > Source: "Deploy from a branch" > Branch: `main`, folder `/ (root)` > Save.

### 3. Test

Submit your own email with the box ticked. A confirm mail arrives; after the click the address is on the `tally-wishlist` list.

## Notes

- Signups are double opt-in; unconfirmed ones are deleted after 48 hours.
- The Worker's confirm mail for Tally is in Slovak while this page is English.
- The page loads nothing from other servers: no outside fonts, no analytics, no cookies.
- Copy is in English. The app's interface language is still open.
