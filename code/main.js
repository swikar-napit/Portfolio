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
      if (link.getAttribute("href") === "#" + current) {
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
  link.addEventListener('click', () => {
    document.querySelector('.nav').classList.remove('open');
    document.getElementById('hamburger').classList.remove('active');
  });
});

function toggleDesc(id, btn) {
  const panel = document.getElementById(id);
  panel.classList.toggle('open');
  btn.classList.toggle('open');
}