// Global variables
let currentUser = null;
let currentUserUid = null;

// DOM elements
const numClothesSelect = document.getElementById("numClothes");
const clothesDetailsDiv = document.getElementById("clothesDetails");
const submitBtn = document.querySelector('button[type="submit"]');
const successMsg = document.getElementById("successMsg");

// Initialize the number of clothes dropdown
function initializeNumClothesDropdown() {
  if (!numClothesSelect) return;

  // Clear existing options except the first one
  numClothesSelect.innerHTML = '<option value="">Select</option>';

  // Add options from 1 to 15
  for (let i = 1; i <= 15; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    numClothesSelect.appendChild(option);
  }
}

// Generate dynamic form fields based on selected number
numClothesSelect.addEventListener("change", function () {
  clothesDetailsDiv.innerHTML = "";
  const count = parseInt(this.value);

  if (!count) {
    submitBtn.style.display = "none";
    return;
  }

  for (let i = 0; i < count; i++) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "card";
    itemDiv.style.marginBottom = "1.5rem";
    itemDiv.innerHTML = `
      <h3>Cloth #${i + 1}</h3>
      <div class="form-group">
        <label>Name</label>
        <input type="text" name="clothName${i}" required placeholder="Enter cloth name">
      </div>
      <div class="form-group">
        <label>Category</label>
        <select name="clothCategory${i}" required>
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Kids">Kids</option>
          <option value="Others">Others</option>
        </select>
      </div>
      <div class="form-group">
        <label>Condition</label>
        <select name="clothCondition${i}" required>
          <option value="">Select</option>
          <option value="Excellent">Excellent (Freshly Washed, Almost New)</option>
          <option value="Good">Good (Gently Used, No Damage)</option>
          <option value="Usable">Usable (Minor Fading or Shrink)</option>
          <option value="Repairable">Repairable (Needs Stitching or Small Fix)</option>
          <option value="Vintage">Vintage (Old but Classic)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Size</label>
        <input type="text" name="clothSize${i}" required placeholder="S, M, L, XL, etc.">
      </div>
      <div class="form-group">
        <label>Upload Image</label>
        <input type="file" accept="image/*" name="clothImg${i}" required>
        <img class="img-preview" style="display:none;max-width:100px;margin-top:8px;border-radius:1rem;box-shadow:0 2px 8px rgba(59,130,246,0.10);" />
      </div>
    `;
    clothesDetailsDiv.appendChild(itemDiv);
  }

  submitBtn.style.display = "";

  // Add image preview listeners
  document.querySelectorAll('input[type="file"]').forEach((input, idx) => {
    input.addEventListener("change", function (e) {
      const file = e.target.files[0];
      const preview = input.parentElement.querySelector(".img-preview");
      if (file) {
        const reader = new FileReader();
        reader.onload = function (ev) {
          preview.src = ev.target.result;
          preview.style.display = "block";
        };
        reader.readAsDataURL(file);
      } else {
        preview.style.display = "none";
      }
    });
  });
});

// Check authentication state
window.auth.onAuthStateChanged(function (firebaseUser) {
  console.log("Auth state changed in donate page:", firebaseUser);
  if (firebaseUser) {
    currentUser = firebaseUser;
    currentUserUid = firebaseUser.uid;
    console.log("User logged in:", currentUserUid);
  } else {
    console.log("No user logged in");
    currentUser = null;
    currentUserUid = null;
    // Redirect to login if not authenticated
    window.location.href = "login.html";
  }
});

// Handle form submission
const donationForm = document.getElementById("donationForm");
donationForm.addEventListener("submit", function (e) {
  e.preventDefault();

  // Check if user is logged in
  if (!currentUserUid) {
    showNotification("You must be logged in to donate.", "error");
    window.location.href = "login.html";
    return;
  }

  const num = parseInt(numClothesSelect.value);
  if (!num) {
    showNotification("Please select the number of clothes to donate.", "error");
    return;
  }

  // Show loading state
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Saving Donation...";
  submitBtn.disabled = true;

  // Collect all clothes data
  let clothesArr = [];
  let hasErrors = false;

  for (let i = 0; i < num; i++) {
    const name = donationForm[`clothName${i}`].value.trim();
    const category = donationForm[`clothCategory${i}`].value;
    const condition = donationForm[`clothCondition${i}`].value;
    const size = donationForm[`clothSize${i}`].value.trim();
    const imgInput = donationForm[`clothImg${i}`];

    // Validation
    if (!name || !category || !condition || !size) {
      showNotification(
        `Please fill in all fields for Cloth #${i + 1}`,
        "error"
      );
      hasErrors = true;
      break;
    }

    let imgData = "";
    if (imgInput.files[0]) {
      const preview = imgInput.parentElement.querySelector(".img-preview");
      imgData = preview.src;
    } else {
      showNotification(`Please upload an image for Cloth #${i + 1}`, "error");
      hasErrors = true;
      break;
    }

    clothesArr.push({
      name,
      category,
      condition,
      size,
      imgData,
      donatedAt: new Date().toISOString(),
      donorUid: currentUserUid,
      donorEmail: currentUser.email,
    });
  }

  if (hasErrors) {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    return;
  }

  // Save to Firebase
  saveDonationsToFirebase(clothesArr, originalText);
});

// Save donations to Firebase
function saveDonationsToFirebase(clothesArr, originalText) {
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

  const donationsRef = window.db.ref("donations");
  const userDonationsRef = window.db.ref(
    `users/${currentUserUid}/donatedClothes`
  );
  let savedCount = 0;
  let totalCount = clothesArr.length;

  clothesArr.forEach((item, index) => {
    // Create a unique key for each donation
    const newDonationRef = donationsRef.push();
    const donationKey = newDonationRef.key;

    // Save to general donations collection
    const generalDonationPromise = newDonationRef.set(item);

    // Save to user's donatedClothes subcollection
    const userDonationPromise = userDonationsRef.child(donationKey).set(item);

    // Wait for both operations to complete
    Promise.all([generalDonationPromise, userDonationPromise])
      .then(function () {
        console.log(
          `Donation ${index + 1} saved successfully to both locations`
        );
        savedCount++;

        if (savedCount === totalCount) {
          // All donations saved successfully
          console.log("All donations saved successfully to both locations");
          showNotification(
            `Thanks for donating! 🎉 ${totalCount} clothes have been added to your profile and the general collection.`,
            "success"
          );

          // Reset form
          donationForm.reset();
          clothesDetailsDiv.innerHTML = "";
          submitBtn.style.display = "none";
          numClothesSelect.value = "";

          // Reset button
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;

          // Trigger confetti if available
          if (typeof confetti === "function") {
            confetti({
              particleCount: 180,
              spread: 120,
              origin: { x: 0.5, y: 0.5 },
              startVelocity: 55,
              gravity: 0.9,
              scalar: 1.1,
              ticks: 90,
              zIndex: 9999,
              colors: [
                "#ff6f91",
                "#6fcf97",
                "#56ccf2",
                "#f2c94c",
                "#bb6bd9",
                "#eb5757",
                "#f2994a",
              ],
            });
            setTimeout(() => confetti.reset(), 1800);
          }
        }
      })
      .catch(function (error) {
        console.error("Error saving donation:", error);
        console.error("Error details:", {
          generalDonation: error.generalDonation,
          userDonation: error.userDonation,
        });
        showNotification("Error saving donation. Please try again.", "error");
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      });
  });
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

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  console.log("Donate page loaded");
  initializeNumClothesDropdown();

  // Check if user is already logged in
  if (window.auth.currentUser) {
    currentUser = window.auth.currentUser;
    currentUserUid = currentUser.uid;
    console.log("User already logged in:", currentUserUid);
  }
});
