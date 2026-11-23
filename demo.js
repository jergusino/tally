// Demo phone on the home page. Needs script.js loaded first ($, reduceMotion).
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
const veil = $("veil-fx");
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
  const tmins = Math.round(state.today * MIN_PER_SWIPE);
  document.querySelectorAll("[data-mins]").forEach((el) => { el.textContent = tmins; });
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
const speedEl = $("speed");
const fillSpeed = () => speedEl.style.setProperty("--p", `${((speedEl.value - 1) / 4) * 100}%`);
speedEl.addEventListener("input", () => { state.speed = Number(speedEl.value); fillSpeed(); render(); });
fillSpeed();
const graceVal = $("grace-val");
function setGrace(v) {
  state.grace = Math.max(0, Math.min(20, v));
  graceVal.textContent = state.grace;
  render();
}
$("grace-down").addEventListener("click", () => setGrace(state.grace - 1));
$("grace-up").addEventListener("click", () => setGrace(state.grace + 1));

render();
