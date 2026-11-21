// Paste the Apps Script web-app URL here (see README.md). Empty = the form says it is not connected yet.
const ENDPOINT = "https://script.google.com/macros/s/AKfycbz3rvslATTPCq9-Za0mbvlLJ-l6hu33g--UHXFxjE063qJ_HsKOjUPJyWK_YEN8iCrp/exec";

const TARGET_SWIPES = 86;
const TARGET_MINUTES = 14;
const COUNT_MS = 1600;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const swipesEl = document.getElementById("swipes");
const phoneCountEl = document.getElementById("phone-count");
const phoneMinutesEl = document.getElementById("phone-minutes");

function render(n) {
  const minutes = Math.round((n * TARGET_MINUTES) / TARGET_SWIPES);
  swipesEl.textContent = n;
  // The phone overlay mirrors the stage number, as in the reference reel.
  phoneCountEl.textContent = n;
  phoneMinutesEl.textContent = `${minutes} min`;
}

// One load-time count-up through the colour climb. Reduced motion gets the final value straight away.
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  render(TARGET_SWIPES);
} else {
  const start = performance.now();
  const frame = (now) => {
    const p = Math.min((now - start) / COUNT_MS, 1);
    render(Math.round(TARGET_SWIPES * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// The colour climb plays once, when it scrolls into view.
const climbEl = document.querySelector(".climb");
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      climbEl.classList.add("in");
      io.disconnect();
    }
  }, { threshold: 0.4 });
  io.observe(climbEl);
} else {
  climbEl.classList.add("in");
}

const form = document.getElementById("wishlist");
const emailEl = document.getElementById("email");
const consentEl = document.getElementById("consent");
const submitBtn = document.getElementById("submit");
const statusEl = document.getElementById("status");

function say(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

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
    say("The wishlist is not connected yet. Try again later.", true);
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
      ? "You are already on the list."
      : "You are on the list. We will email you when Tally is ready.");
    submitBtn.textContent = "Joined";
  } catch (err) {
    say("Could not save your email. Try again in a minute.", true);
    submitBtn.disabled = false;
    submitBtn.textContent = "Join";
  }
});

// PC only: the phone leans a little toward the pointer. Touch and reduced motion skip this.
const canTilt = window.matchMedia("(hover: hover) and (pointer: fine)").matches
  && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (canTilt) {
  const phoneEl = document.querySelector(".phone");
  window.addEventListener("pointermove", (ev) => {
    const x = (ev.clientX / window.innerWidth) * 2 - 1;   // -1 left .. 1 right
    const y = (ev.clientY / window.innerHeight) * 2 - 1;  // -1 top .. 1 bottom
    phoneEl.style.setProperty("--tx", x.toFixed(3));
    phoneEl.style.setProperty("--ty", y.toFixed(3));
  }, { passive: true });
}

// Nav button: if the signup is already on screen, highlight the field instead of scrolling to it.
const navJoin = document.querySelector(".pill-link");
const fieldWrap = document.querySelector(".pill-field");
navJoin.addEventListener("click", (ev) => {
  const r = emailEl.getBoundingClientRect();
  const onScreen = r.bottom > 0 && r.top < window.innerHeight;
  if (!onScreen) return; // off screen: let the link scroll down to the form
  ev.preventDefault();
  emailEl.focus({ preventScroll: true });
  fieldWrap.classList.remove("flash");
  void fieldWrap.offsetWidth; // restart the animation if clicked twice
  fieldWrap.classList.add("flash");
});
fieldWrap.addEventListener("animationend", () => fieldWrap.classList.remove("flash"));
