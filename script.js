// Cloudflare Worker jergusino-mail (code: jergusino.github.io/tools/mail-worker). Sends through Brevo; double opt-in.
const ENDPOINT = "https://api.jergusino.com/subscribe";
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
        list: "tally-wishlist",
        consent: "on",
        source: location.host + location.pathname,
        website: form.elements.namedItem("website").value, // honeypot, must stay empty
      });
      const res = await fetch(ENDPOINT, { method: "POST", body });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "server");

      form.reset();
      say("Almost done. Check your inbox (and spam) and click the link to confirm.");
      submitBtn.textContent = "Check your inbox";
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


// Nav and footer links scroll smoothly to their section (the waitlist button has its own handler above).
document.querySelectorAll('a[href^="#"]:not(.pill-link)').forEach((a) => {
  a.addEventListener("click", (ev) => {
    const t = document.getElementById(a.getAttribute("href").slice(1));
    if (!t) return;
    ev.preventDefault();
    t.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", a.getAttribute("href"));
  });
});
// Mobile menu: full-screen link list under the bar, like openai.com.
const menuBtn = document.getElementById("menu-btn");
const menu = document.getElementById("menu");
function setMenu(open) {
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  menu.hidden = !open;
  document.documentElement.classList.toggle("menu-open", open);
}
menuBtn.addEventListener("click", () => setMenu(menu.hidden));
menu.addEventListener("click", (ev) => { if (ev.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
window.matchMedia("(min-width: 901px)").addEventListener("change", (m) => { if (m.matches) setMenu(false); });

// Highlight the nav link for the section on screen.
if ("IntersectionObserver" in window) {
  const links = [...document.querySelectorAll(".nav-links a")];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) links.forEach((l) => l.classList.toggle("current", l.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  links.forEach((l) => { const t = document.getElementById(l.getAttribute("href").slice(1)); if (t) io.observe(t); });
}

/* ---------- results charts: MADE-UP illustration data, labelled as such on the page ---------- */
(function initResults() {
  const plot = $("line-plot");
  if (!plot) return;
  const base = [408, 415, 411, 419, 412, 416, 409, 413];
  const withT = [410, 372, 331, 298, 271, 252, 238, 229];
  const H = 300, L = 40, R = 16, T = 16, B = 32, MAX = 450;
  let W = 640;
  const x = (i) => L + (i * (W - L - R)) / 7;
  const y = (v) => T + (1 - v / MAX) * (H - T - B);
  const path = (a) => a.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");

  const tb = $("line-table").tBodies[0];
  base.forEach((b, i) => { const tr = tb.insertRow(); [i + 1, b, withT[i]].forEach((v) => (tr.insertCell().textContent = v)); });

  let hov, tip, el;
  const draw = () => {
    W = Math.max(280, Math.round(plot.clientWidth || 640)); // 1 svg unit = 1 css px, so text stays 12px
    let svg = "";
    for (const g of [0, 150, 300, 450]) svg += `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(g)}" y2="${y(g)}"/><text x="${L - 8}" y="${y(g) + 4}" text-anchor="end">${g}</text>`;
    for (let i = 0; i < 8; i++) svg += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${i + 1}</text>`;
    svg += `<path class="ln-base" d="${path(base)}"/><path class="ln-with" d="${path(withT)}"/>`;
    svg += `<text class="lab" x="${x(7)}" y="${y(base[7]) - 10}" text-anchor="end">Before Tally</text><text class="lab" x="${x(7)}" y="${y(withT[7]) + 22}" text-anchor="end" style="fill:var(--c-with)">With Tally</text>`;
    svg += `<g id="hov" style="display:none"><line class="cross" y1="${T}" y2="${H - B}"/><circle class="dot-b" r="5"/><circle class="dot" r="5"/></g>`;
    plot.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Line chart. Swipes per day stay near 410 before Tally and fall from 410 in week 1 to 229 in week 8 with Tally. Made-up data.">${svg}</svg><div class="tip" hidden></div>`;
    el = plot.querySelector("svg"); hov = plot.querySelector("#hov"); tip = plot.querySelector(".tip");
  };
  const show = (i) => {
    hov.style.display = "";
    const cross = hov.querySelector(".cross");
    cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i));
    const [db, dw] = hov.querySelectorAll("circle");
    db.setAttribute("cx", x(i)); db.setAttribute("cy", y(base[i]));
    dw.setAttribute("cx", x(i)); dw.setAttribute("cy", y(withT[i]));
    tip.innerHTML = `<b>Week ${i + 1}</b><br>Before Tally: ${base[i]}<br>With Tally: ${withT[i]}`;
    tip.hidden = false;
    tip.style.left = Math.min(Math.max(x(i), 70), W - 70) + "px";
    tip.style.top = y(withT[i]) - 12 + "px";
  };
  const hide = () => { hov.style.display = "none"; tip.hidden = true; };
  const move = (ev) => {
    const r = el.getBoundingClientRect();
    show(Math.min(7, Math.max(0, Math.round((((ev.clientX - r.left) - L) / (W - L - R)) * 7))));
  };
  draw();
  plot.addEventListener("pointermove", move);
  plot.addEventListener("pointerdown", move);
  plot.addEventListener("pointerleave", hide);
  let lastW = W;
  window.addEventListener("resize", () => { if (Math.abs(plot.clientWidth - lastW) > 4) { draw(); lastW = W; } });

  const bars = [["Short video", 52], ["Photo feed", 46], ["Social feed", 41], ["News", 33], ["Browser", 24]];
  const list = $("bar-list");
  bars.forEach(([n, v]) => {
    const li = document.createElement("li");
    li.className = "bar-row";
    li.title = `${n}: -${v}% swipes`;
    li.innerHTML = `<div class="bar-top"><span>${n}</span><span>-${v}%</span></div><div class="bar-track"><div class="bar-fill" data-w="${v}"></div></div>`;
    list.append(li);
  });
  const fills = [...list.querySelectorAll(".bar-fill")];
  const grow = () => fills.forEach((f) => (f.style.width = f.dataset.w * (100 / 60) + "%"));
  if (reduceMotion || !("IntersectionObserver" in window)) grow();
  else new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { grow(); o.disconnect(); } }, { threshold: 0.3 }).observe(list);
})();

// Scroll reveal: sections fade up once, the first time they come into view. Off for reduced motion.
if (!reduceMotion) {
  document.documentElement.classList.add("js");
  // A section counts as seen once its top is within the top 92% of the window. This also
  // catches sections a long jump (nav link, end key) skipped past, which an observer would miss.
  let pending = [...document.querySelectorAll(".feat, .results, .gal, .widgets, .never, .cta, .privacy")];
  pending.forEach((el) => el.classList.add("reveal"));
  let queued = false;
  const checkReveal = () => {
    queued = false;
    pending = pending.filter((el) => {
      if (el.getBoundingClientRect().top < innerHeight * 0.92) { el.classList.add("shown"); return false; }
      return true;
    });
  };
  const queueCheck = () => { if (!queued) { queued = true; requestAnimationFrame(checkReveal); } };
  window.addEventListener("scroll", queueCheck, { passive: true });
  window.addEventListener("resize", queueCheck);
  checkReveal();
}
