function handleEmail(e) {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!isMobile) {
    e.preventDefault();
    window.open('https://mail.google.com/mail/?view=cm&to=napit.swikar1@gmail.com', '_blank');
  }
  // On mobile: do nothing, let the default mailto: open the mail app
}

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, null, window.location.pathname);
  }
  if (id === 'contacts') {
    const form = document.getElementById('contactForm');
    if (form) setTimeout(() => form.classList.add('show'), 250);
  }
}

// Scrollspy functionality for navigation
document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll(".nav ul a");

  const updateActiveLink = () => {
    let current = "";

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (window.scrollY >= sectionTop - 200) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("data-section") === current) {
        link.classList.add("active");
      }
    });
  };

  window.addEventListener("scroll", updateActiveLink);
  updateActiveLink(); // Initialize on page load

  // Typewriter effect for home section
  const roles = ["Flutist", "Web Developer", "Cybersecurity Enthusiast", "CSIT Student"];
  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const typingElement = document.querySelector(".type");

  function typeEffect() {
    const current = roles[roleIndex];
    typingElement.innerHTML = "I am a " + current.substring(0, charIndex) + '<span class="cursor"></span>';

    if (!isDeleting && charIndex < current.length) {
      charIndex++;
    } else if (isDeleting && charIndex > 0) {
      charIndex--;
    } else {
      isDeleting = !isDeleting;
      if (!isDeleting) roleIndex = (roleIndex + 1) % roles.length;
    }
    setTimeout(typeEffect, isDeleting ? 120 : 120);
  }

  if (typingElement) {
    typeEffect();
  }
});
function toggleMenu() {
  const nav = document.querySelector('.nav');
  const hamburger = document.getElementById('hamburger');
  nav.classList.toggle('open');
  hamburger.classList.toggle('active');
}

document.querySelectorAll('.nav ul a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('.nav').classList.remove('open');
    document.getElementById('hamburger').classList.remove('active');

    const section = link.getAttribute('data-section');
    if (section) scrollToSection(section);
  });
});

function toggleDesc(id, btn) {
  const panel = document.getElementById(id);
  panel.classList.toggle('open');
  btn.classList.toggle('open');
}

window.addEventListener("load", () => {
  history.replaceState(null, null, window.location.pathname);
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, 0);
});

// ---- Live GitHub stats (About > Stats) ----
const GH_USERNAME = "swikar-napit";

function animateCount(el, target) {
  if (!el || isNaN(target)) return;
  const start = parseInt(el.textContent.replace(/\D/g, ""), 10) || 0;
  const duration = 900;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(start + (target - start) * eased);
    el.textContent = value;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

async function loadGithubStats() {
  const statusEl = document.getElementById("gh-stats-status");
  const commitsEl = document.getElementById("stat-commits");
  const reposEl = document.getElementById("stat-repos");
  const projectsEl = document.getElementById("stat-projects");

  // Projects count = number of Featured Project cards actually on this page.
  // No GitHub call needed — it stays in sync automatically whenever you
  // add or remove a .proj-card in the Project section.
  const projectCount = document.querySelectorAll(".projects-container .proj-card").length;
  if (projectCount > 0) animateCount(projectsEl, projectCount);

  try {
    // Live public repo count
    const userRes = await fetch(`https://api.github.com/users/${GH_USERNAME}`);
    if (userRes.ok) {
      const userData = await userRes.json();
      if (typeof userData.public_repos === "number") {
        animateCount(reposEl, userData.public_repos);
      }
    }

    // Live contribution count (used as "commits" proxy — counts commits,
    // issues, PRs, and reviews from the last 12 months, same data GitHub's
    // own contribution graph is built from)
    const contribRes = await fetch(`https://github-contributions-api.jogruber.de/v4/${GH_USERNAME}?y=last`);
    if (contribRes.ok) {
      const contribData = await contribRes.json();
      const total = contribData?.total?.lastYear ?? contribData?.total?.[new Date().getFullYear()];
      if (typeof total === "number") {
        animateCount(commitsEl, total);
      }
    }

    if (statusEl) statusEl.classList.remove("offline");
  } catch (err) {
    console.warn("GitHub stats fetch failed, showing fallback numbers:", err);
    if (statusEl) {
      statusEl.classList.add("offline");
      const textEl = statusEl.querySelector(".gh-stats-text");
      if (textEl) textEl.textContent = "offline";
    }
  }
}

document.addEventListener("DOMContentLoaded", loadGithubStats);

// ---- Contact modal open/close ----
function openContactModal() {
  const overlay = document.getElementById("ctModalOverlay");
  if (!overlay) return;
  overlay.classList.add("show");
  document.body.classList.add("modal-open");
  setTimeout(() => document.getElementById("ct-name")?.focus(), 300);
}

function closeContactModal() {
  const overlay = document.getElementById("ctModalOverlay");
  const form = document.getElementById("contactForm");
  const statusEl = document.getElementById("ctFormStatus");
  if (!overlay) return;
  overlay.classList.remove("show");
  document.body.classList.remove("modal-open");
  setTimeout(() => {
    form?.reset();
    if (statusEl) {
      statusEl.textContent = "";
      statusEl.className = "ct-form-status";
    }
  }, 300);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeContactModal();
});

// ---- Contact form (Formspree) ----
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const submitBtn = document.getElementById("ctFormSubmit");
  const submitText = submitBtn?.querySelector(".ct-form-submit-text");
  const statusEl = document.getElementById("ctFormStatus");

  const fields = {
    name: { input: document.getElementById("ct-name"), error: document.getElementById("ct-name-error") },
    email: { input: document.getElementById("ct-email"), error: document.getElementById("ct-email-error") },
    subject: { input: document.getElementById("ct-subject"), error: document.getElementById("ct-subject-error") },
    message: { input: document.getElementById("ct-message"), error: document.getElementById("ct-message-error") }
  };

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setFieldError(field, msg) {
    field.input.classList.toggle("invalid", !!msg);
    if (field.error) field.error.textContent = msg || "";
  }

  function validateForm() {
    let valid = true;

    const name = fields.name.input.value.trim();
    if (!name) {
      setFieldError(fields.name, "Name is required.");
      valid = false;
    } else if (name.length < 2) {
      setFieldError(fields.name, "Enter your full name.");
      valid = false;
    } else {
      setFieldError(fields.name, "");
    }

    const email = fields.email.input.value.trim();
    if (!email) {
      setFieldError(fields.email, "Email is required.");
      valid = false;
    } else if (!EMAIL_RE.test(email)) {
      setFieldError(fields.email, "Please enter a valid email address.");
      valid = false;
    } else {
      setFieldError(fields.email, "");
    }

    const subject = fields.subject.input.value.trim();
    if (!subject) {
      setFieldError(fields.subject, "Subject is required.");
      valid = false;
    } else {
      setFieldError(fields.subject, "");
    }

    const message = fields.message.input.value.trim();
    if (!message) {
      setFieldError(fields.message, "Message is required.");
      valid = false;
    } else if (message.length < 10) {
      setFieldError(fields.message, "Message is too short.");
      valid = false;
    } else {
      setFieldError(fields.message, "");
    }

    return valid;
  }

  // Clear a field's error as the person fixes it
  Object.values(fields).forEach(f => {
    f.input.addEventListener("input", () => setFieldError(f, ""));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Honeypot: real users never fill this hidden field. If it has a value, it's a bot — drop silently.
    const honeypot = form.querySelector('input[name="_gotcha"]');
    if (honeypot && honeypot.value) {
      form.reset();
      return;
    }

    if (!validateForm()) {
      statusEl.textContent = "✗ Please fix the highlighted fields.";
      statusEl.className = "ct-form-status error";
      return;
    }

    submitBtn.disabled = true;
    if (submitText) submitText.textContent = "Sending...";
    statusEl.textContent = "";
    statusEl.className = "ct-form-status";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      });

      if (response.ok) {
        form.reset();
        statusEl.textContent = "✓ Message sent — I'll get back to you within 24 hours.";
        statusEl.classList.add("success");
        setTimeout(closeContactModal, 1800);
      } else {
        const data = await response.json().catch(() => null);
        const msg = data?.errors?.map(err => err.message).join(", ") || "Something went wrong. Please try again.";
        statusEl.textContent = "✗ " + msg;
        statusEl.classList.add("error");
      }
    } catch (err) {
      statusEl.textContent = "✗ Network error — please try again or email me directly.";
      statusEl.classList.add("error");
    } finally {
      submitBtn.disabled = false;
      if (submitText) submitText.textContent = "Send Message";
    }
  });
});