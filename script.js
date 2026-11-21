// Paste the Apps Script web-app URL here (see README.md). Empty = the form says it is not connected yet.
const ENDPOINT = "https://script.google.com/macros/s/AKfycbz3rvslATTPCq9-Za0mbvlLJ-l6hu33g--UHXFxjE063qJ_HsKOjUPJyWK_YEN8iCrp/exec";

const TARGET_SWIPES = 86;
const TARGET_MINUTES = 14;
const COUNT_MS = 1600;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const swipesEl = document.getElementById("swipes");
const countEl = document.getElementById("count");
const phoneCountEl = document.getElementById("phone-count");
const phoneMinutesEl = document.getElementById("phone-minutes");

// Promo colour climb, as in the reference reel: black, yellow at 50, orange at 86, red at 100.
function colorFor(n) {
  if (n >= 100) return "#ff3a37";
  if (n >= 86) return "#f26b1d";
  if (n >= 50) return "#ffc600";
  return "#0a0a0a";
}

function render(n) {
  const minutes = Math.round((n * TARGET_MINUTES) / TARGET_SWIPES);
  swipesEl.textContent = n;
  countEl.style.color = colorFor(n);
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
