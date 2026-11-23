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

/* ---------- the demo phone ---------- */

const MIN_PER_SWIPE = 0.165;               // 86 swipes is about 14 minutes
const RAMP = [240, 170, 114, 80, 50];      // swipes (after grace) until the veil is fully closed, by speed 1..5
const CAPTIONS = [
  ["@nightloop", "one more video"], ["@dailyfeed", "wait for the end"], ["@loopcafe", "part 2 is better"],
  ["@softscroll", "you will not guess"], ["@latefeed", "just one more"], ["@endlessly", "this one loops"],
];
const HUES = [212, 268, 330, 18, 160, 42, 290, 190];

const state = { on: true, swipes: 0, today: 128, mode: "both", speed: 3, grace: 0, slide: 0, busy: false, hinted: true };

const feed = $("feed");
const overlay = $("overlay");
const numEl = $("num");
const minsEl = $("mins");
const veil = $("veil");
const rings = $("rings");
const hint = $("hint");

function makeSlide(i) {
  const el = document.createElement("div");
  el.className = "slide";
  const [who, text] = CAPTIONS[i % CAPTIONS.length];
  el.style.setProperty("--h", HUES[i % HUES.length]);
  el.style.setProperty("--x1", `${(i * 37) % 40 - 10}%`);
  el.style.setProperty("--x2", `${(i * 23) % 30 - 8}%`);
  el.innerHTML = `<div class="cap"><b></b><span></span></div>`;
  el.querySelector("b").textContent = who;
  el.querySelector("span").textContent = text;
  return el;
}

function colorFor(n) {
  if (n >= 80) return ["#ff312e", "rgba(255, 49, 46, .55)"];
  if (n >= 30) return ["#ffb020", "rgba(255, 176, 32, .5)"];
  return ["#fffffa", "rgba(255, 255, 250, .28)"];
}

function render() {
  const n = state.swipes;
  const shown = state.on && n > state.grace;
  const [color, glow] = colorFor(n);
  const mins = Math.round(n * MIN_PER_SWIPE);

  overlay.classList.toggle("hidden", !shown);
  overlay.dataset.mode = state.mode;
  overlay.style.setProperty("--c", color);
  overlay.style.setProperty("--glow", glow);
  overlay.style.setProperty("--nz", (31 + 14 * Math.min(n / 150, 1)).toFixed(2));
  numEl.textContent = n;
  minsEl.textContent = `${mins} min`;

  // The veil starts with the number, very faint, and closes in with each swipe until the speed's ramp is used up.
  const p = shown ? Math.min((n - state.grace) / RAMP[state.speed - 1], 1) : 0;
  veil.style.setProperty("--hole", (100 - 80 * p).toFixed(2));
  veil.style.setProperty("--a", (0.95 * Math.min(1, p * 1.25)).toFixed(3));
  $("readout").textContent = state.on ? `Veil ${Math.round(p * 100)}%` : "Counting is paused";
  $("master-text").textContent = state.on ? "Tally is on" : "Tally is off";

  document.querySelectorAll("[data-today]").forEach((el) => { el.textContent = state.today.toLocaleString("en-US"); });
  document.querySelectorAll("[data-wcap]").forEach((el) => { el.textContent = state.on ? "swipes today" : "paused"; });
  document.querySelectorAll(".widget").forEach((el) => el.classList.toggle("off", !state.on));
  document.querySelectorAll(".eye").forEach((el) => {
    el.setAttribute("aria-checked", String(state.on));
    el.setAttribute("aria-label", state.on ? "Tally on" : "Tally off");
  });
}

// One swipe is one scroll event: it counts (when Tally is on) and the feed moves to the next video.
function swipe(dir = 1) {
  if (state.busy) return;
  state.busy = true;
  setTimeout(() => { state.busy = false; }, reduceMotion ? 0 : 260);

  const old = feed.lastElementChild;
  state.slide += 1;
  const next = makeSlide(state.slide);
  next.classList.add(dir > 0 ? "from-below" : "from-above");
  feed.append(next);
  void next.offsetWidth;
  next.classList.remove("from-below", "from-above");
  if (old) {
    old.style.transform = `translateY(${dir > 0 ? -100 : 100}%)`;
    setTimeout(() => old.remove(), reduceMotion ? 0 : 380);
  }

  if (state.hinted) { state.hinted = false; hint.classList.add("gone"); }

  if (state.on) {
    state.swipes += 1;
    state.today += 1;
    if (state.swipes % 50 === 0 && !reduceMotion) {
      rings.classList.remove("pulse");
      void rings.offsetWidth;
      rings.classList.add("pulse");
    }
    if (state.swipes % 10 === 0) $("live").textContent = `${state.swipes} swipes counted`;
  }
  render();
}

feed.append(makeSlide(0));

// Drag or touch the screen to swipe. Page scrolling stays normal everywhere outside the phone.
const screen = $("screen");
let startY = null;
screen.addEventListener("pointerdown", (ev) => { startY = ev.clientY; });
screen.addEventListener("pointerup", (ev) => {
  if (startY === null) return;
  const dy = ev.clientY - startY;
  startY = null;
  if (Math.abs(dy) > 36) swipe(dy < 0 ? 1 : -1);
});
screen.addEventListener("pointercancel", () => { startY = null; });
screen.addEventListener("keydown", (ev) => {
  if (ev.key === " " || ev.key === "Enter" || ev.key === "ArrowUp") { ev.preventDefault(); swipe(1); }
  else if (ev.key === "ArrowDown") { ev.preventDefault(); swipe(-1); }
});

$("swipe").addEventListener("click", () => swipe(1));
$("reset").addEventListener("click", () => {
  // Today's total keeps going. Only the session count starts again, as it does after a break in the real app.
  state.swipes = 0;
  $("live").textContent = "Count reset";
  render();
});

// Every eye switch (under the phone and on the widgets) is the same master switch.
document.querySelectorAll(".eye").forEach((el) => {
  el.addEventListener("click", () => { state.on = !state.on; render(); });
});

document.querySelectorAll("[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.mode = btn.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    render();
  });
});
$("speed").addEventListener("input", (ev) => { state.speed = Number(ev.target.value); render(); });
const graceVal = $("grace-val");
function setGrace(v) {
  state.grace = Math.max(0, Math.min(20, v));
  graceVal.textContent = state.grace;
  render();
}
$("grace-down").addEventListener("click", () => setGrace(state.grace - 1));
$("grace-up").addEventListener("click", () => setGrace(state.grace + 1));

// 24 hour bar for the time window: 21:00 to 06:00, wrapping midnight.
const clock = $("clock");
for (let h = 0; h < 24; h++) {
  const cell = document.createElement("span");
  if (h >= 21 || h < 6) cell.className = "on";
  clock.append(cell);
}

render();
