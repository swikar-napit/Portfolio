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