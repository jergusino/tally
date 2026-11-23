// Apps Script web-app URL that saves signups to the sheet (see README.md).
const ENDPOINT = "https://script.google.com/macros/s/AKfycbz3rvslATTPCq9-Za0mbvlLJ-l6hu33g--UHXFxjE063qJ_HsKOjUPJyWK_YEN8iCrp/exec";
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const $ = (id) => document.getElementById(id);

/* ---------- waitlist forms (hero and bottom share one handler) ---------- */

function initForm(form) {
  const emailEl = form.elements.namedItem("email");
  const consentEl = form.elements.namedItem("consent");
  const submitBtn = form.querySelector("button[type=submit]");
  const statusEl = form.querySelector(".status");
  const label = submitBtn.textContent;

  const say = (text, isError = false) => {
    statusEl.textContent = text;
    statusEl.classList.toggle("error", isError);
  };

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    say("");

    const email = emailEl.value.trim();
    if (!EMAIL_RE.test(email)) {
      say("That email does not look right. Check it and try again.", true);
      emailEl.focus();
      return;
    }
    if (!consentEl.checked) {
      say("Tick the box so we can email you.", true);
      consentEl.focus();
      return;
    }
    if (!ENDPOINT) {
      say("The waitlist is not connected yet. Try again later.", true);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    try {
      const body = new URLSearchParams({
        email,
        consent: "on",
        website: form.elements.namedItem("website").value, // honeypot, must stay empty
      });
      const res = await fetch(ENDPOINT, { method: "POST", body });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "server");

      form.reset();
      say(data.duplicate
        ? "You are already on the waitlist."
        : "You are on the waitlist. We will email you when Tally is ready.");
      submitBtn.textContent = "Joined";
    } catch (err) {
      say("Could not save your email. Try again in a minute.", true);
      submitBtn.disabled = false;
      submitBtn.textContent = label;
    }
  });
}
document.querySelectorAll(".wishlist-form").forEach(initForm);

// Header button: focus the first email field, scrolling to it only if it is off screen.
const firstField = document.querySelector(".pill-field");
document.querySelector(".pill-link").addEventListener("click", (ev) => {
  ev.preventDefault();
  const input = firstField.querySelector("input");
  const r = firstField.getBoundingClientRect();
  if (r.bottom < 0 || r.top > window.innerHeight) firstField.scrollIntoView({ block: "center" });
  input.focus({ preventScroll: true });
  firstField.classList.remove("flash");
  void firstField.offsetWidth; // restart the animation if clicked twice
  firstField.classList.add("flash");
});
firstField.addEventListener("animationend", () => firstField.classList.remove("flash"));

// 24 hour bar for the time window: 21:00 to 06:00, wrapping midnight.
const clock = $("clock");
if (clock) for (let h = 0; h < 24; h++) {
  const cell = document.createElement("span");
  if (h >= 21 || h < 6) cell.className = "on";
  clock.append(cell);
}

