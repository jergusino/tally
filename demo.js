// Demo phone on the home page. Needs script.js loaded first ($, reduceMotion).
/* ---------- the demo phone ---------- */

const MIN_PER_SWIPE = 0.165;               // 86 swipes is about 14 minutes
const RAMP = [240, 170, 114, 80, 50];      // swipes (after grace) until the veil is fully closed, by speed 1..5
const CAPTIONS = [
  ["@nightloop", "one more video"], ["@dailyfeed", "wait for the end"], ["@loopcafe", "part 2 is better"],
  ["@softscroll", "you will not guess"], ["@latefeed", "just one more"], ["@endlessly", "this one loops"],
];

const state = { on: true, swipes: 0, today: 128, mode: "both", speed: 3, grace: 0, slide: 0, busy: false, hinted: true };

const feed = $("feed");
const overlay = $("overlay");
const numEl = $("num");
const minsEl = $("mins");
const veil = $("veil-fx");
const rings = $("rings");
const hint = $("hint");

function makeSlide(i) {
  const el = document.createElement("div");
  el.className = "slide";
  const [who, text] = CAPTIONS[i % CAPTIONS.length];
  // The rail (like, comment, share) lives inside each slide so it scrolls with the caption.
  el.innerHTML = `<div class="cap"><b></b><span></span></div><div class="rail" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.4 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/></svg><svg viewBox="0 0 24 24"><path d="M20.5 12a8.3 8.3 0 0 1-12.2 7.3L3.5 20.5l1.2-4.4A8.3 8.3 0 1 1 20.5 12z"/></svg><svg viewBox="0 0 24 24"><path d="M21.5 3 10.5 14M21.5 3l-6.8 18-4.2-7.5L3 9.3z"/></svg></div>`;
  el.querySelector("b").textContent = who;
  el.querySelector("span").textContent = text;
  return el;
}

function colorFor(n) {
  if (n >= 80) return ["var(--n-red)", ""];
  if (n >= 30) return ["var(--n-amber)", ""];
  return ["var(--n-white)", ""];
}

// Largest activities that fit today's minutes. Nothing under 10 minutes. Rough round numbers.
const ACTS = [[30, "30-minute walk", "30-minute walks"], [20, "20-minute book chapter", "20-minute book chapters"], [15, "15-minute language lesson", "15-minute language lessons"], [10, "10-minute stretch", "10-minute stretches"]];
function suggest(m) {
  if (m < 10) return "";
  const a = ACTS.find((x) => m >= x[0]);
  const n = Math.floor(m / a[0]);
  return `About ${n} ${n === 1 ? a[1] : a[2]}`;
}

function render() {
  const n = state.swipes;
  const shown = state.on && n > state.grace;
  const [color, glow] = colorFor(n);
  const mins = Math.round(n * MIN_PER_SWIPE);

  overlay.classList.toggle("hidden", !shown);
  overlay.dataset.mode = state.mode;
  overlay.style.setProperty("--c", color);
  overlay.dataset.tone = n >= 30 ? "hot" : "white";
  overlay.style.setProperty("--glow", glow);
  overlay.style.setProperty("--nz", (31 + 14 * Math.min(n / 150, 1)).toFixed(2));
  numEl.textContent = n;
  minsEl.textContent = `${mins} min`;

  // The veil starts with the number, very faint, and closes in with each swipe until the speed's ramp is used up.
  const p = shown ? Math.min((n - state.grace) / RAMP[state.speed - 1], 1) : 0;
  veil.style.setProperty("--hole", (100 - 80 * p).toFixed(2));
  veil.style.setProperty("--a", (0.95 * Math.min(1, p * 1.25)).toFixed(3));

  document.querySelectorAll("[data-today]").forEach((el) => { el.textContent = state.today.toLocaleString("en-US"); });
  document.querySelectorAll("[data-wcap]").forEach((el) => { el.textContent = state.on ? "swipes today" : "paused"; });
  document.querySelectorAll(".widget").forEach((el) => el.classList.toggle("off", !state.on));
  const tmins = Math.round(state.today * MIN_PER_SWIPE);
  document.querySelectorAll("[data-mins]").forEach((el) => { el.textContent = tmins; });
  // Same maths as the app's PayMath: ms * rate / 36,000,000 cents, rate 5.259 EUR/h (Slovak minimum wage 2026, gross).
  const cents = Math.floor((tmins * 60000 * 5259 + 18000000) / 36000000);
  document.querySelectorAll("[data-money]").forEach((el) => { el.textContent = `EUR ${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`; });
  document.querySelectorAll("[data-line]").forEach((el) => { el.textContent = suggest(tmins); });
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


// Plays 10 swipes as one continuous ease-out motion over about 2 seconds. The feed moves in a single
// smooth stroke and the count and veil move with it. Runs once, when the phone first comes on screen.
// Skipped for reduced motion (the Swipe button still works).
const AUTO_SWIPES = 10;
const AUTO_MS = 2000;
let autoPlayed = false;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function playTenSwipes() {
  if (autoPlayed || reduceMotion || state.busy) return;
  autoPlayed = true;
  state.busy = true; // manual swipes are ignored until the run ends
  hint.classList.add("gone");
  state.hinted = false;

  // Lay the next slides out below the current one, with no transitions: one frame moves them all.
  const current = feed.lastElementChild;
  const start = state.slide;
  const ahead = [];
  for (let i = 1; i <= AUTO_SWIPES; i++) {
    const el = makeSlide(start + i);
    el.style.transition = "none";
    el.style.transform = `translateY(${i * 100}%)`;
    feed.append(el);
    ahead.push(el);
  }
  if (current) current.style.transition = "none";

  const t0 = performance.now();
  const swipes0 = state.swipes;
  const today0 = state.today;
  let shown = 0; // whole swipes passed so far

  const frame = (now) => {
    const t = Math.min((now - t0) / AUTO_MS, 1);
    const offset = easeOutCubic(t) * AUTO_SWIPES; // distance travelled, in slides
    if (current) current.style.transform = `translateY(${-offset * 100}%)`;
    ahead.forEach((el, i) => { el.style.transform = `translateY(${(i + 1 - offset) * 100}%)`; });

    const passed = Math.floor(offset + 1e-9);
    if (passed !== shown && state.on) {
      shown = passed;
      state.swipes = swipes0 + passed;
      state.today = today0 + passed;
      if (state.swipes % 50 === 0 && !reduceMotion) {
        rings.classList.remove("pulse");
        void rings.offsetWidth;
        rings.classList.add("pulse");
      }
      if (state.swipes % 10 === 0) $("live").textContent = `${state.swipes} swipes counted`;
      render();
    }

    if (t < 1) { requestAnimationFrame(frame); return; }

    // Done: keep only the new current slide, back at its resting position.
    if (current) current.remove();
    ahead.slice(0, -1).forEach((el) => el.remove());
    const last = ahead[ahead.length - 1];
    last.style.transition = "";
    last.style.transform = "";
    state.slide = start + AUTO_SWIPES;
    state.busy = false;
    render();
  };
  requestAnimationFrame(frame);
}
if ("IntersectionObserver" in window) {
  const demoIo = new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting) { obs.disconnect(); playTenSwipes(); }
  }, { threshold: 0.6 });
  demoIo.observe($("screen"));
} else {
  playTenSwipes();
}

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
const speedEl = $("speed");
const fillSpeed = () => speedEl.style.setProperty("--p", `${((speedEl.value - 1) / 4) * 100}%`);
speedEl.addEventListener("input", () => { state.speed = Number(speedEl.value); fillSpeed(); render(); });
fillSpeed();

render();
