// Impact Board - Firebase Implementation
// Badge levels based on donation count
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

// Global variables
let leaderboardData = [];
let isInitialized = false;

// Initialize the impact board
function initializeImpactBoard() {
  console.log("Initializing Impact Board...");

  if (!window.db) {
    console.error("Firebase database not available");
    showLoadingState("Database connection error. Please refresh the page.");
    return;
  }

  // Load leaderboard data
  loadLeaderboardData();

  // Set up real-time listener for updates
  setupRealtimeListener();

  // Render badges list
  renderBadgesList();

  isInitialized = true;
}

// Load leaderboard data from Firebase
function loadLeaderboardData() {
  console.log("Loading leaderboard data from Firebase...");
  showLoadingState("Loading leaderboard data...");

  // First, get all donations from the general donations collection
  const donationsRef = window.db.ref("donations");

  donationsRef
    .once("value")
    .then(function (donationsSnapshot) {
      console.log("Donations snapshot:", donationsSnapshot.val());

      // Group donations by donor UID
      const donationsByUser = {};

      if (donationsSnapshot.exists()) {
        donationsSnapshot.forEach(function (donationSnapshot) {
          const donation = donationSnapshot.val();
          const donorUid = donation.donorUid;

          if (donorUid) {
            if (!donationsByUser[donorUid]) {
              donationsByUser[donorUid] = {
                count: 0,
                donations: [],
              };
            }
            donationsByUser[donorUid].count++;
            donationsByUser[donorUid].donations.push(donation);
          }
        });
      }

      console.log("Donations grouped by user:", donationsByUser);

      // Now get user details for each donor
      const usersRef = window.db.ref("users");
      const userPromises = Object.keys(donationsByUser).map((donorUid) => {
        return usersRef
          .child(donorUid)
          .once("value")
          .then(function (userSnapshot) {
            if (userSnapshot.exists()) {
              const userData = userSnapshot.val();
              return {
                userId: donorUid,
                name: userData.name || "Anonymous User",
                email: userData.email || donation.donorEmail || "",
                donatedCount: donationsByUser[donorUid].count,
                profilePic: userData.profilePic || null,
                lastUpdated: userData.lastUpdated || null,
                donations: donationsByUser[donorUid].donations,
              };
            } else {
              // User not found, but we have donations
              const firstDonation = donationsByUser[donorUid].donations[0];
              return {
                userId: donorUid,
                name: "Anonymous User",
                email: firstDonation.donorEmail || "",
                donatedCount: donationsByUser[donorUid].count,
                profilePic: null,
                lastUpdated: null,
                donations: donationsByUser[donorUid].donations,
              };
            }
          });
      });

      return Promise.all(userPromises);
    })
    .then(function (users) {
      console.log("Users with donations:", users);

      // Filter out users with no donations and calculate badges
      leaderboardData = users
        .filter((user) => user.donatedCount > 0)
        .map((user) => {
          const badges = BADGE_LEVELS.filter(
            (badge) => user.donatedCount >= badge.count
          );
          const topBadge = badges.length > 0 ? badges[badges.length - 1] : null;
          const points = user.donatedCount * 5; // 5 points per donation

          return {
            ...user,
            badges: badges,
            topBadge: topBadge,
            points: points,
          };
        });

      // Sort by donation count (descending)
      leaderboardData.sort((a, b) => b.donatedCount - a.donatedCount);

      // Take top 10
      leaderboardData = leaderboardData.slice(0, 10);

      console.log("Top 10 donors:", leaderboardData);

      // Render the leaderboard
      renderLeaderboard();

      hideLoadingState();
    })
    .catch(function (error) {
      console.error("Error loading leaderboard data:", error);
      showLoadingState(
        "Error loading leaderboard data. Please refresh the page."
      );
    });
}

// Set up real-time listener for database changes
function setupRealtimeListener() {
  console.log("Setting up real-time listener...");

  // Listen for changes in the donations collection
  const donationsRef = window.db.ref("donations");

  donationsRef.on("child_added", function (snapshot) {
    console.log("New donation added, refreshing leaderboard...");
    loadLeaderboardData();
  });

  donationsRef.on("child_changed", function (snapshot) {
    console.log("Donation updated, refreshing leaderboard...");
    loadLeaderboardData();
  });

  donationsRef.on("child_removed", function (snapshot) {
    console.log("Donation removed, refreshing leaderboard...");
    loadLeaderboardData();
  });

  // Also listen for user profile changes
  const usersRef = window.db.ref("users");

  usersRef.on("child_changed", function (snapshot) {
    console.log("User profile changed, refreshing leaderboard...");
    loadLeaderboardData();
  });
}

// Render the leaderboard table
function renderLeaderboard() {
  const table = document.getElementById("leaderboardTable");
  if (!table) {
    console.error("Leaderboard table not found");
    return;
  }

  const tbody = table.querySelector("tbody");
  if (!tbody) {
    console.error("Leaderboard table body not found");
    return;
  }

  tbody.innerHTML = "";

  if (leaderboardData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2rem; color: #6b7280;">
          <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">📊</div>
          <div>No donations yet</div>
          <div style="font-size: 0.9rem; margin-top: 0.5rem;">Be the first to donate and appear on the leaderboard!</div>
        </td>
      </tr>
    `;
    return;
  }

  leaderboardData.forEach((user, index) => {
    const rank = index + 1;
    let rankIcon = "";

    if (rank === 1) rankIcon = "🥇";
    else if (rank === 2) rankIcon = "🥈";
    else if (rank === 3) rankIcon = "🥉";

    const row = document.createElement("tr");
    row.className = "leaderboard-row";
    row.innerHTML = `
      <td class="rank-cell">
        <span class="rank-number">${rankIcon || rank}</span>
      </td>
      <td class="user-cell">
        <div class="user-info">
          ${
            user.profilePic
              ? `<img src="${user.profilePic}" alt="${user.name}" class="user-avatar" onerror="this.style.display='none'">`
              : ""
          }
          <div class="user-details">
            <div class="user-name">${user.name}</div>
            <div class="user-email">${user.email}</div>
          </div>
        </div>
      </td>
      <td class="points-cell">
        <span class="points-number">${user.points}</span>
      </td>
      <td class="donations-cell">
        <span class="donations-number">${user.donatedCount}</span>
      </td>
      <td class="badge-cell">
        ${
          user.topBadge
            ? `<div class="badge-display">
            <span class="badge-icon">${user.topBadge.icon}</span>
            <span class="badge-name">${user.topBadge.name}</span>
          </div>`
            : '<span class="no-badge">-</span>'
        }
      </td>
    `;

    tbody.appendChild(row);
  });
}

// Render the badges list
function renderBadgesList() {
  const list = document.getElementById("badgesList");
  if (!list) {
    console.error("Badges list not found");
    return;
  }

  list.innerHTML = "";

  BADGE_LEVELS.forEach((badge) => {
    const badgeCard = document.createElement("div");
    badgeCard.className = "badge-card";
    badgeCard.innerHTML = `
      <div class="badge-icon">${badge.icon}</div>
      <div class="badge-info">
        <div class="badge-name">${badge.name}</div>
        <div class="badge-condition">Donated ${badge.count} cloth${
      badge.count > 1 ? "es" : ""
    }</div>
      </div>
    `;

    list.appendChild(badgeCard);
  });
}

// Show loading state
function showLoadingState(message = "Loading...") {
  const table = document.getElementById("leaderboardTable");
  if (!table) return;

  const tbody = table.querySelector("tbody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="5" style="text-align: center; padding: 2rem; color: #6b7280;">
        <div class="loading-spinner"></div>
        <div style="margin-top: 1rem;">${message}</div>
      </div>
    </tr>
  `;
}

// Hide loading state
function hideLoadingState() {
  // Loading state will be replaced when renderLeaderboard is called
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("Impact Board page loaded");

  // Check if Firebase is available
  if (typeof window.db === "undefined") {
    console.error("Firebase not initialized");
    showLoadingState("Firebase not initialized. Please refresh the page.");
    return;
  }

  // Initialize the impact board
  initializeImpactBoard();

  // Set up logout functionality
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      if (window.auth) {
        window.auth
          .signOut()
          .then(function () {
            console.log("User signed out successfully");
            window.location.href = "login.html";
          })
          .catch(function (error) {
            console.error("Error signing out:", error);
            window.location.href = "login.html";
          });
      } else {
        window.location.href = "login.html";
      }
    });
  }
});

// Debug function to show current database state
function debugDatabaseState() {
  console.log("=== DEBUG: Current Database State ===");
  
  // Check donations collection
  const donationsRef = window.db.ref("donations");
  donationsRef.once("value")
    .then(function(snapshot) {
      console.log("Donations collection:", snapshot.val());
      console.log("Number of donations:", snapshot.numChildren());
    })
    .catch(function(error) {
      console.error("Error reading donations:", error);
    });
  
  // Check users collection
  const usersRef = window.db.ref("users");
  usersRef.once("value")
    .then(function(snapshot) {
      console.log("Users collection:", snapshot.val());
      console.log("Number of users:", snapshot.numChildren());
    })
    .catch(function(error) {
      console.error("Error reading users:", error);
    });
}

// Export functions for testing
window.impactBoard = {
  initializeImpactBoard,
  loadLeaderboardData,
  renderLeaderboard,
  renderBadgesList,
  debugDatabaseState,
  BADGE_LEVELS,
};
