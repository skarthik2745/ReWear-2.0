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

// --- Impact Board Logic ---
const BADGE_LEVELS = [
  { name: "First Step", count: 1, icon: "🧢" },
  { name: "Kind Contributor", count: 5, icon: "👕" },
  { name: "Active Helper", count: 10, icon: "👚" },
  { name: "Giving Heart", count: 15, icon: "🧥" },
  { name: "Hope Bringer", count: 20, icon: "👗" },
  { name: "Wardrobe Warrior", count: 30, icon: "👖" },
  { name: "Style Saver", count: 40, icon: "👔" },
  { name: "Closet Hero", count: 50, icon: "🧦" },
  { name: "Donation Champion", count: 75, icon: "🧤" },
  { name: "Fashion Philanthropist", count: 100, icon: "👟" },
  { name: "Trend Setter", count: 125, icon: "🧣" },
  { name: "ReWear Rockstar", count: 150, icon: "🎽" },
  { name: "Green Giver", count: 200, icon: "🌱" },
  { name: "Sharing Star", count: 250, icon: "🌟" },
  { name: "Cloth Guardian", count: 300, icon: "🛡" },
  { name: "Soul Stylist", count: 350, icon: "💖" },
  { name: "Joy Spreader", count: 400, icon: "🌈" },
  { name: "Impact Icon", count: 450, icon: "🥇" },
  { name: "World Changer", count: 500, icon: "🌍" },
  { name: "Legacy Legend", count: 1000, icon: "🏆" },
];

function getUserStats() {
  // Aggregate donations by user (by email)
  let donations = JSON.parse(localStorage.getItem("reware_donations") || "[]");
  let users = JSON.parse(localStorage.getItem("users") || "[]");
  let stats = {};
  donations.forEach((item) => {
    let email = item.donor && item.donor.email ? item.donor.email : null;
    if (!email) return;
    if (!stats[email]) {
      let user = users.find((u) => u.email === email);
      stats[email] = {
        name: user ? user.name : email,
        email,
        totalDonations: 0,
        points: 0,
        badges: [],
        profilePic: user && user.profilePic ? user.profilePic : null,
      };
    }
    stats[email].totalDonations += 1;
    stats[email].points += 5;
  });
  // Assign badges
  Object.values(stats).forEach((user) => {
    user.badges = BADGE_LEVELS.filter((b) => user.totalDonations >= b.count);
    user.topBadge = user.badges.length
      ? user.badges[user.badges.length - 1]
      : null;
  });
  return Object.values(stats);
}

function renderLeaderboard() {
  const table = document.getElementById("leaderboardTable");
  if (!table) return;
  let stats = getUserStats();
  stats.sort((a, b) => b.points - a.points);
  let top10 = stats.slice(0, 10);
  let tbody = table.querySelector("tbody");
  tbody.innerHTML = "";
  top10.forEach((user, idx) => {
    let rankIcon = "";
    if (idx === 0) rankIcon = "🥇";
    else if (idx === 1) rankIcon = "🥈";
    else if (idx === 2) rankIcon = "🥉";
    tbody.innerHTML += `<tr>
      <td>${rankIcon || idx + 1}</td>
      <td>${user.name}</td>
      <td>${user.points}</td>
      <td>${user.totalDonations}</td>
      <td class="badge-cell">${
        user.topBadge
          ? `${user.topBadge.icon} <span style='font-size:0.95em;'>${user.topBadge.name}</span>`
          : "-"
      }</td>
    </tr>`;
  });
}

function renderBadgesList() {
  const list = document.getElementById("badgesList");
  if (!list) return;
  list.innerHTML = "";
  BADGE_LEVELS.forEach((badge) => {
    list.innerHTML += `<div class="badge-card">
      <span class="badge-icon">${badge.icon}</span>
      <span class="badge-name">${badge.name}</span>
      <span class="badge-condition">Donated ${badge.count} cloth${
      badge.count > 1 ? "es" : ""
    }</span>
    </div>`;
  });
}

if (window.location.pathname.endsWith("impact.html")) {
  document.addEventListener("DOMContentLoaded", function () {
    renderLeaderboard();
    renderBadgesList();
  });
}
