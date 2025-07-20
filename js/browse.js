const clothesGrid = document.getElementById("clothesGrid");
const modal = document.getElementById("modal");
const modalDetails = document.getElementById("modalDetails");
const closeBtn = document.querySelector(".close-btn");

// Filtering
const filterBar = document.getElementById("filterBar");
const filterName = document.getElementById("filterName");
const filterCategory = document.getElementById("filterCategory");
const filterSize = document.getElementById("filterSize");
const filterCondition = document.getElementById("filterCondition");
const filterLocation = document.getElementById("filterLocation");

let allDonations = [];
let currentUser = null;
let currentUserUid = null;

// Check authentication state
window.auth.onAuthStateChanged(function (firebaseUser) {
  console.log("Auth state changed in browse page:", firebaseUser);
  if (firebaseUser) {
    currentUser = firebaseUser;
    currentUserUid = firebaseUser.uid;
    console.log("User logged in:", currentUserUid);
  } else {
    console.log("No user logged in");
    currentUser = null;
    currentUserUid = null;
  }
});

function loadDonations() {
  if (!window.db) {
    console.error("Firebase database not available");
    allDonations = [];
    return;
  }

  const donationsRef = window.db.ref("donations");

  donationsRef
    .once("value")
    .then(function (snapshot) {
      allDonations = [];

      if (snapshot.exists()) {
        const donationPromises = [];

        snapshot.forEach(function (childSnapshot) {
          const donationData = childSnapshot.val();
          donationData.key = childSnapshot.key; // Add Firebase key for reference

          // Create a promise to fetch user profile for this donation
          const userProfilePromise = fetchUserLocation(donationData.donorUid)
            .then((location) => {
              donationData.userLocation = location;
              return donationData;
            })
            .catch((error) => {
              console.error(
                `Error fetching location for donation ${donationData.key}:`,
                error
              );
              donationData.userLocation = "Location not available";
              return donationData;
            });

          donationPromises.push(userProfilePromise);
        });

        // Wait for all user profile fetches to complete
        Promise.all(donationPromises)
          .then(function (donationsWithLocation) {
            allDonations = donationsWithLocation;
            console.log(
              "Donations loaded from Firebase with user locations:",
              allDonations.length
            );
            renderClothes();
          })
          .catch(function (error) {
            console.error("Error loading donations with user profiles:", error);
            allDonations = [];
            renderClothes();
          });
      } else {
        console.log("No donations found in Firebase");
        renderClothes();
      }
    })
    .catch(function (error) {
      console.error("Error loading donations:", error);
      allDonations = [];
      renderClothes();
    });
}

// Helper function to fetch user location from user profile
function fetchUserLocation(userId) {
  if (!userId || !window.db) {
    return Promise.resolve("Location not available");
  }

  const userRef = window.db.ref(`users/${userId}`);

  return userRef
    .once("value")
    .then(function (snapshot) {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        // Check multiple possible location fields in user profile
        const location =
          userData.location ||
          userData.address ||
          userData.city ||
          userData.state ||
          "";
        return location || "Location not available";
      } else {
        console.log(`User profile not found for userId: ${userId}`);
        return "Location not available";
      }
    })
    .catch(function (error) {
      console.error(`Error fetching user profile for userId ${userId}:`, error);
      return "Location not available";
    });
}

function filterDonations() {
  console.log("Filtering donations with:", {
    name: filterName.value,
    category: filterCategory.value,
    size: filterSize.value,
    condition: filterCondition.value,
    location: filterLocation.value,
  });

  let filtered = allDonations.filter((item) => {
    // Cloth Name
    if (
      filterName.value &&
      !item.name.toLowerCase().includes(filterName.value.toLowerCase())
    )
      return false;
    // Category
    if (filterCategory.value && item.category !== filterCategory.value)
      return false;
    // Size
    if (
      filterSize.value &&
      item.size.toLowerCase() !== filterSize.value.toLowerCase()
    )
      return false;
    // Condition - handle both old and new condition formats
    if (filterCondition.value) {
      const itemCondition = item.condition || "";
      // Check if the condition starts with the filter value (for old format with descriptions)
      const conditionMatches =
        itemCondition
          .toLowerCase()
          .startsWith(filterCondition.value.toLowerCase()) ||
        itemCondition === filterCondition.value;
      if (!conditionMatches) {
        return false;
      }
    }
    // Location - check if location exists and matches filter
    if (filterLocation.value) {
      const itemLocation = item.userLocation || "";
      const filterValue = filterLocation.value.trim().toLowerCase();
      const locationValue = itemLocation.trim().toLowerCase();

      console.log(
        `Location filter: "${filterValue}" vs item location: "${locationValue}"`
      );

      if (!locationValue.includes(filterValue)) {
        console.log(`Location filter failed for item: ${item.name}`);
        return false;
      }
      console.log(`Location filter passed for item: ${item.name}`);
    }
    return true;
  });

  console.log(
    `Filtered ${filtered.length} items from ${allDonations.length} total items`
  );

  // Log location filter summary if location filter is active
  if (filterLocation.value) {
    const locationMatches = filtered.filter((item) => {
      const itemLocation = item.userLocation || "";
      return itemLocation
        .toLowerCase()
        .includes(filterLocation.value.toLowerCase());
    });
    console.log(
      `Location filter "${filterLocation.value}" matched ${locationMatches.length} items`
    );
  }

  return filtered;
}

function renderClothes() {
  clothesGrid.innerHTML = "";
  let filtered = filterDonations();

  // Check if any filters are applied
  const hasFilters =
    filterName.value ||
    filterCategory.value ||
    filterSize.value ||
    filterCondition.value ||
    filterLocation.value;

  if (!filtered.length) {
    if (hasFilters) {
      clothesGrid.innerHTML =
        '<p style="text-align:center;font-size:1.2rem;color:#8b4513;padding:2rem;">No items found matching your filters. Try adjusting your search criteria.</p>';
    } else {
      clothesGrid.innerHTML =
        '<p style="text-align:center;font-size:1.2rem;">No clothes available yet. Be the first to donate!</p>';
    }
    return;
  }
  filtered.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "cloth-card fadeIn";
    // Use the fetched user location
    const itemLocation = item.userLocation || "Location not available";

    card.innerHTML = `
      <img src="${
        item.imgData || "assets/images/placeholder.png"
      }" class="cloth-img" alt="Cloth Image">
      <div class="cloth-info">
        <h3>${item.name}</h3>
        <div class="meta">Category: ${item.category}</div>
        <div class="meta">Size: ${item.size}</div>
        <div class="meta">Condition: ${item.condition}</div>
        <div class="meta">Location: ${itemLocation}</div>
        <div class="meta">Donated: ${new Date(
          item.donatedAt
        ).toLocaleDateString()}</div>
      </div>
    `;
    card.addEventListener("click", () => showModal(item));
    clothesGrid.appendChild(card);
  });
}

function showModal(item) {
  // Only show Request button if user is logged in and not the donor
  let showRequestBtn = false;
  if (
    currentUser &&
    currentUser.email &&
    item.donorEmail &&
    currentUser.email.trim().toLowerCase() !==
      item.donorEmail.trim().toLowerCase()
  ) {
    showRequestBtn = true;
  }

  // Use the fetched user location for modal
  const modalItemLocation = item.userLocation || "Location not available";

  modalDetails.innerHTML = `
    <div class="modal-left">
      <div class="modal-section">
        <div class="section-title">Cloth Info</div>
        <h2>${item.name}</h2>
        <p><b>Category:</b> ${item.category}</p>
        <p><b>Condition:</b> ${item.condition}</p>
        <p><b>Size:</b> ${item.size}</p>
        <p><b>Location:</b> ${modalItemLocation}</p>
        <p><b>Donated:</b> ${new Date(item.donatedAt).toLocaleDateString()}</p>
      </div>
    </div>
    <div class="modal-divider"></div>
    <div class="modal-right">
      <img src="${
        item.imgData || "assets/images/placeholder.png"
      }" alt="Cloth Image">
      ${
        showRequestBtn
          ? '<button id="requestClothBtn" class="main-btn" style="margin-top:1.5rem;width:100%;">Request Cloth</button>'
          : ""
      }
    </div>
  `;
  modal.style.display = "flex";
  modal.querySelector(".modal-content").classList.add("fadeIn");

  // Add handler for Request button
  if (showRequestBtn) {
    const requestBtn = document.getElementById("requestClothBtn");
    requestBtn.onclick = function () {
      requestCloth(item);
    };
  }
}

function requestCloth(item) {
  if (!currentUser || !currentUserUid) {
    alert("You must be logged in to request clothes.");
    return;
  }

  if (!window.db) {
    alert("Database connection error. Please refresh the page.");
    return;
  }

  // Check if already requested
  const requestsRef = window.db.ref("requests");
  const clothId = item.key; // Use Firebase key as unique identifier

  requestsRef
    .orderByChild("clothId")
    .equalTo(clothId)
    .once("value")
    .then(function (snapshot) {
      const alreadyRequested =
        snapshot.exists() &&
        Object.values(snapshot.val()).some(
          (request) => request.receiverUid === currentUserUid
        );

      if (alreadyRequested) {
        alert("You have already requested this cloth.");
        return;
      }

      // Get current user's profile data and donor's profile data
      const userProfileRef = window.db.ref(`users/${currentUserUid}`);
      const donorProfileRef = window.db.ref(`users/${item.donorUid}`);

      // Fetch both user profiles
      Promise.all([userProfileRef.once("value"), donorProfileRef.once("value")])
        .then(function ([userSnapshot, donorSnapshot]) {
          const userData = userSnapshot.val() || {};
          const donorData = donorSnapshot.val() || {};

          // Create request with additional user information
          const request = {
            clothId: clothId,
            clothName: item.name,
            clothImgData: item.imgData,
            clothSize: item.size,
            clothCategory: item.category,
            clothCondition: item.condition,
            donorUid: item.donorUid,
            donorEmail: item.donorEmail,
            donorName:
              donorData.displayName || donorData.name || item.donorEmail,
            donorLocation:
              donorData.location || donorData.address || "Not provided",
            receiverUid: currentUserUid,
            receiverEmail: currentUser.email,
            receiverName: currentUser.displayName || currentUser.email,
            receiverPhone: userData.phone || "Not provided",
            receiverLocation:
              userData.location || userData.address || "Not provided",
            timestamp: new Date().toISOString(),
            status: "pending",
          };

          // Save request to Firebase
          const newRequestRef = requestsRef.push();
          newRequestRef
            .set(request)
            .then(function () {
              alert("Your request has been sent to the donor!");
              modal.style.display = "none";
            })
            .catch(function (error) {
              console.error("Error saving request:", error);
              alert("Error sending request. Please try again.");
            });
        })
        .catch(function (error) {
          console.error("Error fetching user profiles:", error);

          // Fallback: create request without additional user data
          const request = {
            clothId: clothId,
            clothName: item.name,
            clothImgData: item.imgData,
            clothSize: item.size,
            clothCategory: item.category,
            clothCondition: item.condition,
            donorUid: item.donorUid,
            donorEmail: item.donorEmail,
            donorName: item.donorEmail,
            donorLocation: "Not provided",
            receiverUid: currentUserUid,
            receiverEmail: currentUser.email,
            receiverName: currentUser.displayName || currentUser.email,
            receiverPhone: "Not provided",
            receiverLocation: "Not provided",
            timestamp: new Date().toISOString(),
            status: "pending",
          };

          // Save request to Firebase
          const newRequestRef = requestsRef.push();
          newRequestRef
            .set(request)
            .then(function () {
              alert("Your request has been sent to the donor!");
              modal.style.display = "none";
            })
            .catch(function (error) {
              console.error("Error saving request:", error);
              alert("Error sending request. Please try again.");
            });
        });
    })
    .catch(function (error) {
      console.error("Error checking existing requests:", error);
      alert("Error checking request status. Please try again.");
    });
}

closeBtn.onclick = function () {
  modal.style.display = "none";
  modal.querySelector(".modal-content").classList.remove("fadeIn");
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
    modal.querySelector(".modal-content").classList.remove("fadeIn");
  }
};

[
  filterName,
  filterCategory,
  filterSize,
  filterCondition,
  filterLocation,
].forEach((input) => {
  input.addEventListener("input", renderClothes);
  input.addEventListener("change", renderClothes);
});

// Initialize page
window.addEventListener("DOMContentLoaded", () => {
  console.log("Browse page loaded");
  loadDonations();
});

// Listen for real-time updates
if (window.db) {
  const donationsRef = window.db.ref("donations");
  donationsRef.on("value", function (snapshot) {
    console.log("Donations updated in real-time");
    loadDonations();
  });
}
