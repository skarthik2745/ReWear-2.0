// Profile info
// Removed legacy localStorage-based authentication check. Use only Firebase Auth.
const profilePic = document.getElementById("profilePic");
const profilePicInput = document.getElementById("profilePicInput");
const editPicBtn = document.getElementById("editPicBtn");
const profileForm = document.getElementById("profileForm");
const nameInput = document.getElementById("profileName");
const emailInput = document.getElementById("profileEmail");
const phoneInput = document.getElementById("profilePhone");
const addressInput = document.getElementById("profileAddress");
const removePicBtn = document.getElementById("removePicBtn");
const dobInput = document.getElementById("profileDob");
const userClothesGrid = document.getElementById("userClothesGrid");

// Edit modal elements - declare at the top level
let editClothModal = null;
let closeEditModal = null;
let editClothForm = null;
let editClothName = null;
let editClothCategory = null;
let editClothCondition = null;
let editClothSize = null;
let editClothImg = null;
let editClothImgPreview = null;
let editClothImgData = "";
let editClothIdx = null;
let editClothOriginalKey = null;

// Initialize edit modal elements
function initializeEditModal() {
  console.log("=== INITIALIZING EDIT MODAL ===");

  // Get all modal elements
  editClothModal = document.getElementById("editClothModal");
  closeEditModal = document.getElementById("closeEditModal");
  editClothForm = document.getElementById("editClothForm");
  editClothName = document.getElementById("editClothName");
  editClothCategory = document.getElementById("editClothCategory");
  editClothCondition = document.getElementById("editClothCondition");
  editClothSize = document.getElementById("editClothSize");
  editClothImg = document.getElementById("editClothImg");
  editClothImgPreview = document.getElementById("editClothImgPreview");

  console.log("Element detection results:");
  console.log("- editClothModal:", editClothModal);
  console.log("- closeEditModal:", closeEditModal);
  console.log("- editClothForm:", editClothForm);
  console.log("- editClothName:", editClothName);
  console.log("- editClothCategory:", editClothCategory);
  console.log("- editClothCondition:", editClothCondition);
  console.log("- editClothSize:", editClothSize);
  console.log("- editClothImg:", editClothImg);
  console.log("- editClothImgPreview:", editClothImgPreview);

  // Check if all elements exist
  const elements = {
    editClothModal,
    closeEditModal,
    editClothForm,
    editClothName,
    editClothCategory,
    editClothCondition,
    editClothSize,
    editClothImg,
    editClothImgPreview,
  };

  let allElementsFound = true;
  for (const [name, element] of Object.entries(elements)) {
    if (!element) {
      console.error(`${name} element not found!`);
      allElementsFound = false;
    } else {
      console.log(`${name} found successfully`);
    }
  }

  if (allElementsFound) {
    console.log("All edit modal elements found, setting up event listeners...");
    setupEditModalEvents();
  } else {
    console.error("Some edit modal elements are missing!");
    console.error("This might be because the modal HTML is not loaded yet.");

    // Try to find the modal in the DOM
    const modalInDOM = document.querySelector("#editClothModal");
    console.log("Modal found in DOM:", modalInDOM);

    if (modalInDOM) {
      console.log("Modal HTML exists in DOM, trying to re-initialize...");
      // Wait a bit and try again
      setTimeout(() => {
        console.log("Retrying initialization after delay...");
        initializeEditModal();
      }, 100);
    } else {
      console.error("Modal HTML does not exist in DOM!");
    }
  }

  console.log("=== END INITIALIZING EDIT MODAL ===");
}

// Setup edit modal event listeners
function setupEditModalEvents() {
  console.log("Setting up edit modal event listeners...");

  // Close modal when clicking the X button
  if (closeEditModal) {
    closeEditModal.onclick = function () {
      console.log("Close button clicked");
      hideEditModal();
    };
  }

  // Close modal when clicking outside
  window.onclick = function (event) {
    if (event.target == editClothModal) {
      console.log("Clicked outside modal, closing...");
      hideEditModal();
    }
  };

  // Handle image file input
  if (editClothImg) {
    editClothImg.onchange = function () {
      console.log("Image file selected");
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (ev) {
          if (editClothImgPreview) {
            editClothImgPreview.src = ev.target.result;
            editClothImgData = ev.target.result;
            console.log("Image preview updated");
          }
        };
        reader.readAsDataURL(file);
      }
    };
  }

  // Handle form submission
  if (editClothForm) {
    editClothForm.onsubmit = function (e) {
      e.preventDefault();
      console.log("Edit form submitted");

      if (!editClothOriginalKey || !currentUserUid) {
        showNotification("Error: Missing cloth or user information.", "error");
        return;
      }

      if (!window.db) {
        showNotification(
          "Database connection error. Please refresh the page.",
          "error"
        );
        return;
      }

      // Prepare updated cloth data
      const updatedClothData = {
        name: editClothName ? editClothName.value.trim() : "",
        category: editClothCategory ? editClothCategory.value : "",
        condition: editClothCondition ? editClothCondition.value : "",
        size: editClothSize ? editClothSize.value.trim() : "",
        imgData: editClothImgData,
        lastUpdated: new Date().toISOString(),
      };

      // Validate required fields
      if (
        !updatedClothData.name ||
        !updatedClothData.category ||
        !updatedClothData.condition ||
        !updatedClothData.size
      ) {
        showNotification("Please fill in all required fields.", "error");
        return;
      }

      // Show loading state
      const submitBtn = editClothForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Saving...";
      submitBtn.disabled = true;

      console.log("Updating cloth data:", updatedClothData);
      console.log("Cloth key:", editClothOriginalKey);
      console.log("User UID:", currentUserUid);

      // Update in both locations using Firebase Realtime Database
      const userDonationRef = window.db.ref(
        `users/${currentUserUid}/donatedClothes/${editClothOriginalKey}`
      );
      const generalDonationRef = window.db.ref(
        `donations/${editClothOriginalKey}`
      );

      Promise.all([
        userDonationRef.update(updatedClothData),
        generalDonationRef.update(updatedClothData),
      ])
        .then(function () {
          console.log("Cloth updated successfully in both locations");
          showNotification("Cloth details updated successfully! 🎉", "success");
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          hideEditModal();
          loadUserClothes(); // Reload the list to show updated data
        })
        .catch(function (error) {
          console.error("Error updating cloth:", error);
          showNotification("Error updating cloth. Please try again.", "error");
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    };
  }

  console.log("Edit modal event listeners set up successfully");
}

// Function to show the edit modal
function showEditModal() {
  if (editClothModal) {
    // Remove any existing inline styles that might interfere
    editClothModal.removeAttribute("style");

    // Add the show class
    editClothModal.classList.add("show");

    // Force a reflow
    editClothModal.offsetHeight;

    console.log("Modal displayed successfully");
    console.log("Modal classes:", editClothModal.className);
    console.log(
      "Modal computed display:",
      window.getComputedStyle(editClothModal).display
    );
    console.log(
      "Modal computed visibility:",
      window.getComputedStyle(editClothModal).visibility
    );
    console.log(
      "Modal computed opacity:",
      window.getComputedStyle(editClothModal).opacity
    );
  } else {
    console.error("editClothModal is null!");
  }
}

// Function to hide the edit modal
function hideEditModal() {
  if (editClothModal) {
    editClothModal.classList.remove("show");
    console.log("Modal hidden");
  }
}

// Function to open edit modal with cloth data
function openEditModal(item, idx) {
  console.log("Opening edit modal for:", item.name);

  // Ensure modal elements are initialized
  if (!editClothModal) {
    console.log("Modal not found, initializing...");
    initializeEditModal();
  }

  editClothIdx = idx;
  editClothOriginalKey = item.key;

  // Populate form fields
  try {
    if (editClothName) {
      editClothName.value = item.name || "";
    }

    if (editClothCategory) {
      editClothCategory.value = item.category || "";
    }

    if (editClothCondition) {
      editClothCondition.value = item.condition || "";
    }

    if (editClothSize) {
      editClothSize.value = item.size || "";
    }

    if (editClothImgPreview) {
      const imageSrc = item.imgData || "assets/images/placeholder.png";
      editClothImgPreview.src = imageSrc;
      editClothImgData = item.imgData || "";
    }
  } catch (error) {
    console.error("Error populating form fields:", error);
  }

  // Show the modal
  showEditModal();
}

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  console.log("Profile page loaded");

  // Check if user is already logged in
  if (window.auth.currentUser) {
    console.log("User already logged in:", window.auth.currentUser.uid);
    currentUser = window.auth.currentUser;
    currentUserUid = currentUser.uid;
  } else {
    console.log("No user currently logged in");
  }

  // Check if userClothesGrid exists
  if (!userClothesGrid) {
    console.error(
      "userClothesGrid element not found! Check if the element exists in profile.html"
    );
  }

  // Initialize edit modal elements
  initializeEditModal();

  // Also try to initialize after a short delay as backup
  setTimeout(() => {
    console.log("Backup initialization after delay...");
    if (!editClothModal) {
      console.log("Modal still not found, retrying...");
      initializeEditModal();
    }
  }, 500);
});

const defaultAvatarSVG =
  'data:image/svg+xml;utf8,<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="60" fill="%23e5e7eb"/><ellipse cx="60" cy="54" rx="26" ry="24" fill="%23cbd5e1"/><ellipse cx="60" cy="100" rx="38" ry="20" fill="%23cbd5e1"/></svg>';
function setProfilePicSrc(src) {
  if (!src || src === "" || src === "assets/images/avatar-placeholder.png") {
    profilePic.src = defaultAvatarSVG;
  } else {
    profilePic.src = src;
    profilePic.onerror = () => {
      profilePic.src = defaultAvatarSVG;
    };
  }
}
function getProfilePicSrc() {
  return user.profilePic && user.profilePic !== ""
    ? user.profilePic
    : defaultAvatarSVG;
}

// Global variable to store current user data
let currentUserData = null;
let currentUserUid = null;

// Fetch and display user details from Firebase
window.auth.onAuthStateChanged(function (firebaseUser) {
  console.log("Auth state changed:", firebaseUser);
  if (firebaseUser) {
    // Get user UID
    currentUserUid = firebaseUser.uid;
    console.log("User UID:", currentUserUid);

    // Test Firebase connection
    if (!window.db) {
      console.error("Firebase database not initialized");
      showNotification(
        "Database connection error. Please refresh the page.",
        "error"
      );
      return;
    }

    console.log("Firebase database is available");

    // Fetch user details from Realtime Database
    const userRef = window.db.ref("users/" + currentUserUid);
    console.log("Fetching user data from:", "users/" + currentUserUid);

    userRef
      .once("value")
      .then(function (snapshot) {
        var userData = snapshot.val();
        console.log("User data from Firebase:", userData);

        if (userData) {
          currentUserData = userData;
          // Populate form fields
          if (nameInput) nameInput.value = userData.name || "";
          if (emailInput) emailInput.value = userData.email || "";
          if (phoneInput) phoneInput.value = userData.phone || "";
          if (addressInput) addressInput.value = userData.address || "";
          if (dobInput) dobInput.value = userData.dob || "";
          setProfilePicSrc(userData.profilePic || "");
          console.log("User data loaded successfully");
        } else {
          console.log("No user data found for UID:", currentUserUid);
          showNotification(
            "No user data found. Please contact support.",
            "error"
          );
        }

        // Load user's donated clothes after user data is loaded
        loadUserClothes();

        // Load user's badges
        loadUserBadges();

        // Set up real-time listener for badge updates
        const userDonationsRef = window.db.ref(
          `users/${currentUserUid}/donatedClothes`
        );
        userDonationsRef.on("child_added", function () {
          console.log("New donation added, refreshing badges...");
          refreshUserBadges();
        });

        userDonationsRef.on("child_removed", function () {
          console.log("Donation removed, refreshing badges...");
          refreshUserBadges();
        });
      })
      .catch(function (error) {
        console.error("Error fetching user data:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        showNotification(
          "Error loading user data. Please refresh the page.",
          "error"
        );
      });
  } else {
    console.log("No user logged in");
    // Clear form fields
    if (nameInput) nameInput.value = "";
    if (emailInput) emailInput.value = "";
    if (phoneInput) phoneInput.value = "";
    if (addressInput) addressInput.value = "";
    if (dobInput) dobInput.value = "";
    setProfilePicSrc("");
    currentUserData = null;
    currentUserUid = null;

    // Show login required message for donated clothes
    loadUserClothes();
  }
});

// Profile form submission - save to Firebase
if (profileForm) {
  profileForm.onsubmit = function (e) {
    e.preventDefault();
    console.log("Profile form submitted");

    if (!currentUserUid) {
      console.error("No currentUserUid found");
      showNotification(
        "You must be logged in to update your profile.",
        "error"
      );
      return;
    }

    console.log("Current user UID:", currentUserUid);

    // Basic validation
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();
    const dob = dobInput ? dobInput.value : "";

    console.log("Form data:", { name, email, phone, address, dob });

    if (!name || !email || !phone || !address) {
      showNotification("Please fill in all required fields.", "error");
      return;
    }

    if (phone.length < 10) {
      showNotification("Phone number must be at least 10 digits.", "error");
      return;
    }

    // Show loading state
    const submitBtn = profileForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Saving...";
    submitBtn.disabled = true;

    const updatedData = {
      name: name,
      email: email,
      phone: phone,
      address: address,
      dob: dob,
      profilePic:
        currentUserData && currentUserData.profilePic
          ? currentUserData.profilePic
          : "",
      lastUpdated: new Date().toISOString(),
    };

    // Remove any undefined values from updatedData
    Object.keys(updatedData).forEach((key) => {
      if (updatedData[key] === undefined) {
        updatedData[key] = "";
      }
    });

    console.log("Data to update:", updatedData);
    console.log("Firebase reference:", "users/" + currentUserUid);

    // Check if Firebase is available
    if (!window.db) {
      console.error("Firebase database not available");
      showNotification(
        "Database connection error. Please refresh the page.",
        "error"
      );
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      return;
    }

    // Update Firebase with better error handling
    const userRef = window.db.ref("users/" + currentUserUid);

    userRef
      .update(updatedData)
      .then(function () {
        console.log("Profile updated successfully in Firebase");
        currentUserData = updatedData;
        showNotification("Profile updated successfully! 🎉", "success");
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      })
      .catch(function (error) {
        console.error("Error updating profile in Firebase:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);

        // Try alternative method if update fails
        console.log("Trying alternative set method...");
        userRef
          .set(updatedData)
          .then(function () {
            console.log("Profile updated successfully using set method");
            currentUserData = updatedData;
            showNotification("Profile updated successfully! 🎉", "success");
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          })
          .catch(function (setError) {
            console.error("Alternative method also failed:", setError);
            showNotification(
              "Error updating profile. Please check your connection and try again.",
              "error"
            );
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          });
      });
  };
}

// Modern notification system
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((notification) => notification.remove());

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;

  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${
      type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"
    };
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;

  // Add animation styles
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .notification-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .notification-close {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .notification-close:hover {
      opacity: 0.8;
    }
  `;
  document.head.appendChild(style);

  // Add to page
  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Profile picture handling
if (editPicBtn) {
  editPicBtn.onclick = () => profilePicInput && profilePicInput.click();
}

if (profilePicInput) {
  profilePicInput.onchange = function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (ev) {
        if (profilePic) profilePic.src = ev.target.result;
        if (currentUserUid) {
          // Update profile picture in Firebase
          window.db
            .ref("users/" + currentUserUid + "/profilePic")
            .set(ev.target.result)
            .then(function () {
              if (currentUserData)
                currentUserData.profilePic = ev.target.result;
            })
            .catch(function (error) {
              console.error("Error updating profile picture:", error);
            });
        }
      };
      reader.readAsDataURL(file);
    }
  };
}

if (removePicBtn) {
  removePicBtn.onclick = function () {
    setProfilePicSrc("");
    if (currentUserUid) {
      // Remove profile picture from Firebase
      window.db
        .ref("users/" + currentUserUid + "/profilePic")
        .remove()
        .then(function () {
          if (currentUserData) currentUserData.profilePic = "";
        })
        .catch(function (error) {
          console.error("Error removing profile picture:", error);
        });
    }
  };
}

function loadUserClothes() {
  console.log("loadUserClothes called - currentUserUid:", currentUserUid);

  if (!currentUserUid) {
    console.log("No currentUserUid found, showing login required message");
    if (userClothesGrid) {
      userClothesGrid.innerHTML = `
        <div class="empty-state">
          <div class="icon">👤</div>
          <h4>Please Log In</h4>
          <p>Please log in to view your donations.</p>
        </div>
      `;
    }
    return;
  }

  if (!window.db) {
    console.error("Firebase database not available");
    if (userClothesGrid) {
      userClothesGrid.innerHTML = `
        <div class="empty-state">
          <div class="icon">⚠️</div>
          <h4>Connection Error</h4>
          <p>Database connection error. Please refresh the page.</p>
        </div>
      `;
    }
    return;
  }

  // Show loading state
  if (userClothesGrid) {
    userClothesGrid.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <h4>Loading Your Donations...</h4>
        <p>Fetching your donated clothes from the database.</p>
      </div>
    `;
  }

  // Load user's donated clothes from Firebase
  const userDonationsRef = window.db.ref(
    `users/${currentUserUid}/donatedClothes`
  );
  console.log(
    "Fetching donations from:",
    `users/${currentUserUid}/donatedClothes`
  );

  userDonationsRef
    .once("value")
    .then(function (snapshot) {
      const donatedClothes = [];

      if (snapshot.exists()) {
        snapshot.forEach(function (childSnapshot) {
          const clothData = childSnapshot.val();
          clothData.key = childSnapshot.key; // Add the Firebase key for reference
          console.log("Individual cloth data:", clothData);
          donatedClothes.push(clothData);
        });
      }

      console.log("User's donated clothes loaded:", donatedClothes);
      console.log("Number of clothes found:", donatedClothes.length);

      if (userClothesGrid) {
        userClothesGrid.innerHTML = "";

        if (!donatedClothes.length) {
          userClothesGrid.innerHTML = `
            <div class="empty-state">
              <div class="icon">🛍️</div>
              <h4>No Donations Yet</h4>
              <p>Start donating clothes to help others and see them here!</p>
            </div>
          `;
          return;
        }

        donatedClothes.forEach((item, idx) => {
          const card = document.createElement("div");
          card.className = "cloth-card fadeIn";

          // Format the donation date
          const donationDate = new Date(item.donatedAt || new Date());
          const formattedDate = donationDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

          // Ensure all required fields have fallback values
          const clothName = item.name || "Unnamed Cloth";
          const clothCategory = item.category || "Unknown";
          const clothSize = item.size || "Unknown";
          const clothCondition = item.condition || "Unknown";
          const clothImage = item.imgData || "assets/images/placeholder.png";

          card.innerHTML = `
            <img src="${clothImage}" class="cloth-img" alt="Cloth Image" onerror="this.src='assets/images/placeholder.png'">
      <div class="cloth-info">
              <h3>${clothName}</h3>
              <div class="cloth-meta">
                <div class="meta-item">
                  <span class="icon">🧥</span>
                  <span class="label">Type:</span>
                  <span class="value">${clothCategory}</span>
                </div>
                <div class="meta-item">
                  <span class="icon">📏</span>
                  <span class="label">Size:</span>
                  <span class="value">${clothSize}</span>
                </div>
                <div class="meta-item">
                  <span class="icon">🧼</span>
                  <span class="label">Condition:</span>
                  <span class="value">${clothCondition}</span>
                </div>
              </div>
              <div class="donation-date">
                📅 Donated on ${formattedDate}
              </div>
              <div class="cloth-actions">
                <button class="main-btn edit-btn" title="Edit this cloth">✏️ Edit</button>
                <button class="main-btn delete-btn" title="Delete this cloth">🗑️ Delete</button>
      </div>
      </div>
    `;

          card.querySelector(".edit-btn").onclick = function (e) {
            console.log("Edit button clicked for:", item.name);

            e.preventDefault();
            e.stopPropagation();

            // Ensure modal is initialized
            if (!editClothModal) {
              console.log("Initializing modal...");
              initializeEditModal();

              // Wait a bit for initialization to complete
              setTimeout(() => {
                openEditModal(item, idx);
              }, 100);
            } else {
              openEditModal(item, idx);
            }
          };

          card.querySelector(".delete-btn").onclick = function (e) {
            e.stopPropagation();
            if (
              confirm("Are you sure you want to permanently delete this cloth?")
            ) {
              deleteDonatedCloth(item.key);
            }
          };

          userClothesGrid.appendChild(card);
        });
      }
    })
    .catch(function (error) {
      console.error("Error loading user's donated clothes:", error);
      console.error("Error details:", {
        currentUserUid: currentUserUid,
        errorCode: error.code,
        errorMessage: error.message,
      });
      if (userClothesGrid) {
        userClothesGrid.innerHTML = `
          <div class="empty-state">
            <div class="icon">❌</div>
            <h4>Error Loading Donations</h4>
            <p>Error loading donations. Please refresh the page.</p>
          </div>
        `;
      }
    });
}

// Function to delete a donated cloth from both locations
function deleteDonatedCloth(clothKey) {
  if (!currentUserUid || !clothKey) {
    showNotification("Error: Missing user or cloth information.", "error");
    return;
  }

  if (!window.db) {
    showNotification(
      "Database connection error. Please refresh the page.",
      "error"
    );
    return;
  }

  // Show loading state
  showNotification("Deleting cloth...", "info");

  // Delete from user's donatedClothes subcollection
  const userDonationRef = window.db.ref(
    `users/${currentUserUid}/donatedClothes/${clothKey}`
  );

  // Delete from general donations collection
  const generalDonationRef = window.db.ref(`donations/${clothKey}`);

  Promise.all([userDonationRef.remove(), generalDonationRef.remove()])
    .then(function () {
      console.log("Cloth deleted successfully from both locations");
      showNotification("Cloth deleted successfully! 🗑️", "success");
      loadUserClothes(); // Reload the list
    })
    .catch(function (error) {
      console.error("Error deleting cloth:", error);
      showNotification("Error deleting cloth. Please try again.", "error");
    });
}
// User clothes will be loaded when auth state changes

const style = document.createElement("style");
style.innerHTML = `
  .main-btn, .edit-btn, .delete-btn, #editPicBtn, #removePicBtn {
    transition: background-color 0.3s ease, color 0.3s ease !important;
    animation: none !important;
  }
`;
document.head.appendChild(style);

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

// Function to load and display user badges
function loadUserBadges() {
  console.log("Loading user badges...");

  const userBadgesGrid = document.getElementById("userBadgesGrid");
  if (!userBadgesGrid) {
    console.error("User badges grid not found");
    return;
  }

  // Show loading state
  userBadgesGrid.innerHTML = `
    <div class="loading-state" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
      <div class="loading-spinner"></div>
      <h4>Loading Your Badges...</h4>
      <p>Calculating badges based on your completed donations.</p>
    </div>
  `;

  // Get current user's email to match with completed requests
  const currentUserRef = window.db.ref(`users/${currentUserUid}`);

  currentUserRef
    .once("value")
    .then(function (userSnapshot) {
      if (!userSnapshot.exists()) {
        console.error("Current user not found");
        userBadgesGrid.innerHTML = `
          <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
            <div class="icon">❌</div>
            <h4>Error Loading Badges</h4>
            <p>User profile not found. Please refresh the page.</p>
          </div>
        `;
        return;
      }

      const userData = userSnapshot.val();
      const userEmail = userData.email;

      if (!userEmail) {
        console.error("User email not found");
        userBadgesGrid.innerHTML = `
          <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
            <div class="icon">❌</div>
            <h4>Error Loading Badges</h4>
            <p>User email not found. Please refresh the page.</p>
          </div>
        `;
        return;
      }

      console.log("Current user email:", userEmail);

      // Get completed requests for this user (as donor)
      const requestsRef = window.db.ref("requests");

      return requestsRef.once("value").then(function (requestsSnapshot) {
        let completedDonationCount = 0;

        if (requestsSnapshot.exists()) {
          requestsSnapshot.forEach(function (requestSnapshot) {
            const request = requestSnapshot.val();

            // Count only completed requests where this user is the donor
            if (
              request.status === "completed" &&
              request.donorEmail === userEmail
            ) {
              completedDonationCount++;
              console.log("Found completed donation:", request.clothName);
            }
          });
        }

        console.log("User completed donation count:", completedDonationCount);

        // Calculate which badges the user has earned
        const earnedBadges = BADGE_LEVELS.filter(
          (badge) => completedDonationCount >= badge.count
        );
        const nextBadge = BADGE_LEVELS.find(
          (badge) => completedDonationCount < badge.count
        );

        console.log("Earned badges:", earnedBadges);
        console.log("Next badge to earn:", nextBadge);

        // Render all badges
        userBadgesGrid.innerHTML = "";

        BADGE_LEVELS.forEach((badge, index) => {
          const isEarned = completedDonationCount >= badge.count;
          const progress = Math.min(
            (completedDonationCount / badge.count) * 100,
            100
          );

          const badgeCard = document.createElement("div");
          badgeCard.className = `badge-card ${
            isEarned ? "earned" : "not-earned"
          }`;

          badgeCard.innerHTML = `
          <div class="badge-tooltip">
            ${badge.name}: Donated ${badge.count} cloth${
            badge.count > 1 ? "es" : ""
          }
            ${
              !isEarned
                ? `<br>You need ${
                    badge.count - completedDonationCount
                  } more donation${
                    badge.count - completedDonationCount > 1 ? "s" : ""
                  }`
                : ""
            }
          </div>
          <div class="badge-icon">${badge.icon}</div>
          <div class="badge-name">${badge.name}</div>
          <div class="badge-condition">Donated ${badge.count} cloth${
            badge.count > 1 ? "es" : ""
          }</div>
          ${
            !isEarned
              ? `
            <div class="badge-progress">
              <div class="badge-progress-bar" style="width: ${progress}%"></div>
            </div>
          `
              : ""
          }
        `;

          userBadgesGrid.appendChild(badgeCard);
        });

        // Show summary if user has earned badges
        if (earnedBadges.length > 0) {
          const summaryDiv = document.createElement("div");
          summaryDiv.style.cssText = `
          grid-column: 1 / -1;
          text-align: center;
          margin-bottom: 1rem;
          padding: 1rem;
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          border-radius: 12px;
          border: 2px solid #059669;
        `;
          summaryDiv.innerHTML = `
          <h4 style="color: #065f46; margin: 0 0 0.5rem 0; font-size: 1.1rem;">
            🎉 You've earned ${earnedBadges.length} badge${
            earnedBadges.length > 1 ? "s" : ""
          }!
          </h4>
          <p style="color: #065f46; margin: 0; font-size: 0.9rem;">
            Total completed donations: ${completedDonationCount} cloth${
            completedDonationCount > 1 ? "es" : ""
          }
            ${
              nextBadge
                ? `<br>Next badge: ${nextBadge.name} (${
                    nextBadge.count - completedDonationCount
                  } more donation${
                    nextBadge.count - completedDonationCount > 1 ? "s" : ""
                  } needed)`
                : ""
            }
          </p>
        `;
          userBadgesGrid.insertBefore(summaryDiv, userBadgesGrid.firstChild);
        }
      });
    })
    .catch(function (error) {
      console.error("Error loading user badges:", error);
      userBadgesGrid.innerHTML = `
      <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
        <div class="icon">❌</div>
        <h4>Error Loading Badges</h4>
        <p>Error loading badges. Please refresh the page.</p>
      </div>
    `;
    });
}

// Function to refresh badges when donations change
function refreshUserBadges() {
  if (currentUserUid) {
    loadUserBadges();
  }
}
