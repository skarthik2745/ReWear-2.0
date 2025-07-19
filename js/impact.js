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

  // Get all completed requests from the requests collection
  const requestsRef = window.db.ref("requests");

  requestsRef
    .orderByChild("status")
    .equalTo("completed")
    .once("value")
    .then(function (requestsSnapshot) {
      console.log("Completed requests snapshot:", requestsSnapshot.val());

      // Group completed requests by donor
      const completedDonationsByUser = {};

      if (requestsSnapshot.exists()) {
        requestsSnapshot.forEach(function (requestSnapshot) {
          const request = requestSnapshot.val();
          const donorEmail = request.donorEmail;

          if (donorEmail) {
            if (!completedDonationsByUser[donorEmail]) {
              completedDonationsByUser[donorEmail] = {
                count: 0,
                completedRequests: [],
                donorName: request.donorName || "Anonymous User",
              };
            }
            completedDonationsByUser[donorEmail].count++;
            completedDonationsByUser[donorEmail].completedRequests.push(
              request
            );
          }
        });
      }

      console.log(
        "Completed donations grouped by user:",
        completedDonationsByUser
      );

      // Get all users to match with completed donations
      const usersRef = window.db.ref("users");

      return usersRef.once("value").then(function (usersSnapshot) {
        const users = [];

        if (usersSnapshot.exists()) {
          usersSnapshot.forEach(function (userSnapshot) {
            const userData = userSnapshot.val();
            const userEmail = userData.email;

            if (userEmail && completedDonationsByUser[userEmail]) {
              // User has completed donations
              const completedData = completedDonationsByUser[userEmail];
              users.push({
                userId: userSnapshot.key,
                name:
                  userData.name || completedData.donorName || "Anonymous User",
                email: userEmail,
                donatedCount: completedData.count,
                completedDonations: completedData.count,
                profilePic: userData.profilePic || null,
                lastUpdated: userData.lastUpdated || null,
                completedRequests: completedData.completedRequests,
              });
            }
          });
        }

        // Also include users who have completed donations but might not be in users collection
        Object.keys(completedDonationsByUser).forEach((donorEmail) => {
          const existingUser = users.find((user) => user.email === donorEmail);
          if (!existingUser) {
            const completedData = completedDonationsByUser[donorEmail];
            users.push({
              userId: null,
              name: completedData.donorName || "Anonymous User",
              email: donorEmail,
              donatedCount: completedData.count,
              completedDonations: completedData.count,
              profilePic: null,
              lastUpdated: null,
              completedRequests: completedData.completedRequests,
            });
          }
        });

        return users;
      });
    })
    .then(function (users) {
      console.log("Users with completed donations:", users);

      // Filter out users with no completed donations and calculate badges
      leaderboardData = users
        .filter((user) => user.completedDonations > 0)
        .map((user) => {
          const badges = BADGE_LEVELS.filter(
            (badge) => user.completedDonations >= badge.count
          );
          const topBadge = badges.length > 0 ? badges[badges.length - 1] : null;
          const points = user.completedDonations * 5; // 5 points per completed donation

          return {
            ...user,
            badges: badges,
            topBadge: topBadge,
            points: points,
          };
        });

      // Sort by completed donations count (descending)
      leaderboardData.sort(
        (a, b) => b.completedDonations - a.completedDonations
      );

      // Take top 10
      leaderboardData = leaderboardData.slice(0, 10);

      console.log("Top 10 donors with completed donations:", leaderboardData);

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

  // Listen for changes in the requests collection (for completed donations)
  const requestsRef = window.db.ref("requests");

  requestsRef.on("child_added", function (snapshot) {
    const request = snapshot.val();
    if (request.status === "completed") {
      console.log("New completed donation added, refreshing leaderboard...");
      loadLeaderboardData();
    }
  });

  requestsRef.on("child_changed", function (snapshot) {
    const request = snapshot.val();
    if (request.status === "completed") {
      console.log("Donation marked as completed, refreshing leaderboard...");
      loadLeaderboardData();
    }
  });

  requestsRef.on("child_removed", function (snapshot) {
    console.log("Request removed, refreshing leaderboard...");
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
        <span class="donations-number">${user.completedDonations}</span>
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

  // Check requests collection for completed donations
  const requestsRef = window.db.ref("requests");
  requestsRef
    .orderByChild("status")
    .equalTo("completed")
    .once("value")
    .then(function (snapshot) {
      console.log("Completed requests collection:", snapshot.val());
      console.log("Number of completed donations:", snapshot.numChildren());
    })
    .catch(function (error) {
      console.error("Error reading completed requests:", error);
    });

  // Check all requests collection
  requestsRef
    .once("value")
    .then(function (snapshot) {
      console.log("All requests collection:", snapshot.val());
      console.log("Total number of requests:", snapshot.numChildren());
    })
    .catch(function (error) {
      console.error("Error reading all requests:", error);
    });

  // Check users collection
  const usersRef = window.db.ref("users");
  usersRef
    .once("value")
    .then(function (snapshot) {
      console.log("Users collection:", snapshot.val());
      console.log("Number of users:", snapshot.numChildren());
    })
    .catch(function (error) {
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
