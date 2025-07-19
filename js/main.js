// Smooth scroll for navbar
const navLinks = document.querySelectorAll(".nav-link");
navLinks.forEach((link) => {
  link.addEventListener("click", function (e) {
    if (this.hash) {
      e.preventDefault();
      document.querySelector(this.hash).scrollIntoView({ behavior: "smooth" });
    }
  });
});

// Animate counters
function animateCounter(id, target, decimals = 0) {
  const el = document.getElementById(id);
  if (!el) return;
  let count = 0;
  const step = Math.max(1, Math.ceil(target / 60));
  const interval = setInterval(() => {
    count += step;
    if (count >= target) {
      el.textContent = decimals ? target.toFixed(decimals) : target;
      clearInterval(interval);
    } else {
      el.textContent = decimals ? count.toFixed(decimals) : count;
    }
  }, 18);
}
window.addEventListener("DOMContentLoaded", () => {
  animateCounter("impactCount", 528);
  animateCounter("familyCount", 120);
  animateCounter("wasteCount", 1.2, 1);
  animateOnScroll();
  initTestimonialsCarousel();
  loadFeaturedClothes();
  // Personalized greeting and nav
  const user = JSON.parse(localStorage.getItem("loggedInUser") || "null");
  const greeting = document.getElementById("greetingTitle");
  const mainNav = document.getElementById("mainNavLinks");
  const userNav = document.getElementById("userNavLinks");
  const heroBtns = document.getElementById("mainHeroBtns");
  if (user && greeting && userNav && mainNav) {
    greeting.innerHTML = `Welcome back, <b>${user.name}</b> 👋`;
    userNav.style.display = "";
    mainNav.style.display = "none";
    if (heroBtns) heroBtns.style.display = "";
  } else {
    if (userNav) userNav.style.display = "none";
    if (mainNav) mainNav.style.display = "";
    if (greeting)
      greeting.innerHTML = 'Welcome to <span class="brand">ReWear</span>';
    if (heroBtns) heroBtns.style.display = "";
  }
  // Logout logic
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = function (e) {
      e.preventDefault();
      localStorage.removeItem("loggedInUser");
      window.location.href = "login.html";
    };
  }
});

// Animate on scroll
function animateOnScroll() {
  const animEls = document.querySelectorAll(".animate");
  animEls.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 60) {
      el.classList.add("visible");
    }
  });
}
window.addEventListener("scroll", animateOnScroll);

// Testimonials carousel
function initTestimonialsCarousel() {
  const cards = document.querySelectorAll(".testimonial-card");
  let idx = 0;
  function show(idxToShow) {
    cards.forEach(
      (c, i) => (c.style.display = i === idxToShow ? "flex" : "none")
    );
  }
  show(idx);
  document.getElementById("prevTestimonial").onclick = () => {
    idx = (idx - 1 + cards.length) % cards.length;
    show(idx);
  };
  document.getElementById("nextTestimonial").onclick = () => {
    idx = (idx + 1) % cards.length;
    show(idx);
  };
}

// Featured clothes mini-gallery
function loadFeaturedClothes() {
  const gallery = document.getElementById("featuredClothes");
  if (!gallery) return;
  let all = JSON.parse(localStorage.getItem("reware_donations") || "[]");
  if (!all.length) {
    for (let i = 0; i < 3; i++) {
      gallery.innerHTML += `<div class='gallery-card'><img src='https://via.placeholder.com/120x90?text=Cloth' alt='Cloth'><div>No items yet</div></div>`;
    }
    return;
  }
  // Shuffle and pick 3-4
  all = all.sort(() => 0.5 - Math.random()).slice(0, 4);
  all.forEach((item) => {
    gallery.innerHTML += `<div class='gallery-card'>
      <img src='${
        item.imgData || "https://via.placeholder.com/120x90?text=Cloth"
      }' alt='${item.name}'>
      <div><b>${item.name}</b></div>
      <div>${item.category}, ${item.size}</div>
      <div style='font-size:0.95em;color:#3b82f6;'>${item.condition}</div>
    </div>`;
  });
}

// Impact Board functionality moved to js/impact.js for Firebase implementation
