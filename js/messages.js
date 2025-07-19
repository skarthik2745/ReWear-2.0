// Messages page logic for ReWear
const messagesList = document.getElementById("messagesList");
const receivedTab = document.getElementById("receivedTab");
const sentTab = document.getElementById("sentTab");

let currentUser = null;
let currentUserUid = null;
let currentTab = "received";

// Check authentication state
window.auth.onAuthStateChanged(function (firebaseUser) {
  console.log("Auth state changed in messages page:", firebaseUser);
  if (firebaseUser) {
    currentUser = firebaseUser;
    currentUserUid = firebaseUser.uid;
    console.log("User logged in:", currentUserUid);
    loadMessages();
    setupRealtimeListeners();
  } else {
    console.log("No user logged in");
    currentUser = null;
    currentUserUid = null;
    messagesList.innerHTML =
      '<p style="color:red;">You must be logged in to view your messages.</p>';
  }
});

function renderReceivedMessages() {
  if (!currentUserUid || !window.db) {
    messagesList.innerHTML =
      '<p style="text-align:center;font-size:1.1rem;">Loading...</p>';
    return;
  }

  messagesList.innerHTML =
    '<p style="text-align:center;font-size:1.1rem;">Loading requests...</p>';

  // Get requests where current user is the donor
  const requestsRef = window.db.ref("requests");

  requestsRef
    .orderByChild("donorUid")
    .equalTo(currentUserUid)
    .once("value")
    .then(function (snapshot) {
      messagesList.innerHTML = "";

      if (!snapshot.exists()) {
        messagesList.innerHTML =
          '<p style="text-align:center;font-size:1.1rem;">No requests received yet.</p>';
        return;
      }

      const requests = [];
      snapshot.forEach(function (childSnapshot) {
        const request = childSnapshot.val();
        request.requestId = childSnapshot.key;

        // Skip requests that are hidden from this user's view
        if (!request[`hiddenFrom_${currentUserUid}`]) {
          requests.push(request);
        }
      });

      // Sort by timestamp (newest first)
      requests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      requests.forEach((request) => {
        const card = document.createElement("div");
        card.className = "message-card fadeIn";

        let statusSection = "";
        let additionalInfo = "";

        if (request.status === "pending") {
          statusSection = `
            <button class="main-btn accept-btn" style="background:#22c55e;color:#fff;margin-right:8px;">✅ Accept</button>
            <button class="main-btn decline-btn" style="background:#ef4444;color:#fff;">❌ Decline</button>
          `;
          additionalInfo = `<div class="meta" style="color:#2563eb;font-weight:600;margin-top:8px;">${request.receiverName} has requested this cloth.</div>`;
        } else if (request.status === "accepted") {
          statusSection = `
            <button class="main-btn accept-btn" style="background:#22c55e;color:#fff;margin-right:8px;" disabled>✅ Accepted</button>
            <button class="main-btn decline-btn" style="background:#ef4444;color:#fff;">❌ Decline</button>
            <button class="main-btn complete-btn" style="background:#059669;color:#fff;margin-left:8px;">🟢 Donation Exchange Successful</button>
          `;
          additionalInfo = `<div class="meta" style="color:#22c55e;font-weight:600;margin-top:8px;">Request accepted. You may contact ${request.receiverName} to arrange pickup.</div>`;
        } else if (request.status === "declined") {
          statusSection = `<span style="color:#ef4444;font-weight:600;">❌ Declined</span>`;
          if (request.declineReason) {
            additionalInfo = `<div class="meta" style="color:#ef4444;margin-top:8px;">Reason: ${request.declineReason}</div>`;
          }
        } else if (request.status === "completed") {
          statusSection = `<span style="color:#059669;font-weight:600;">✅ Completed</span>`;
          additionalInfo = `<div class="meta" style="color:#059669;margin-top:8px;">Donation exchange completed successfully!</div>`;
        }

        // Add X button for declined or completed requests
        let closeBtn = "";
        if (request.status === "declined" || request.status === "completed") {
          closeBtn = `<button class="close-x-btn" title="Remove" style="position:absolute;top:10px;right:14px;background:none;border:none;font-size:1.3em;color:#ef4444;cursor:pointer;">&times;</button>`;
        }

        card.style.position = "relative";
        card.innerHTML = `
      <div style="display:flex;align-items:center;gap:1.5rem;">
        <img src="${request.clothImgData || "assets/images/placeholder.png"}" 
                 class="cloth-img" alt="Cloth Image" 
                 style="max-width:80px;max-height:80px;border-radius:1rem;box-shadow:0 2px 8px rgba(59,130,246,0.10);">
        <div style="flex:1;">
              <h3>${request.clothName}</h3>
              <div class="meta">Category: ${request.clothCategory}</div>
              <div class="meta">Size: ${request.clothSize}</div>
              <div class="meta">Condition: ${request.clothCondition}</div>
        </div>
      </div>
      <div class="meta" style="margin-top:0.5rem;">Requested by: <b>${
        request.receiverName
      }</b></div>
      <div class="meta">Email: ${request.receiverEmail}</div>
      <div class="meta">Phone: ${request.receiverPhone || "Not provided"}</div>
      <div class="meta">Location: ${
        request.receiverLocation || "Not provided"
      }</div>
      <div class="meta">Requested at: ${new Date(
        request.timestamp
      ).toLocaleString()}</div>
          ${additionalInfo}
          <div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">${statusSection}</div>
          ${closeBtn}
    `;

        // Add event listeners for buttons
        if (request.status === "pending" || request.status === "accepted") {
          // Accept button
          const acceptBtn = card.querySelector(".accept-btn");
          if (acceptBtn && !acceptBtn.disabled) {
            acceptBtn.onclick = function () {
              acceptRequest(request.requestId);
            };
          }

          // Decline button
          const declineBtn = card.querySelector(".decline-btn");
          if (declineBtn) {
            declineBtn.onclick = function () {
              showDeclineReasonModal(request.requestId, request.clothName);
            };
          }

          // Complete button (only for accepted requests)
          if (request.status === "accepted") {
            const completeBtn = card.querySelector(".complete-btn");
            if (completeBtn) {
              completeBtn.onclick = function () {
                completeDonation(request);
              };
            }
          }
        }

        // Add event listener for close button
        if (
          (request.status === "declined" || request.status === "completed") &&
          card.querySelector(".close-x-btn")
        ) {
          card.querySelector(".close-x-btn").onclick = function () {
            if (
              confirm(
                "Are you sure you want to remove this message from your view?"
              )
            ) {
              hideRequestFromView(request.requestId);
            }
          };
        }

        messagesList.appendChild(card);
      });
    })
    .catch(function (error) {
      console.error("Error loading received messages:", error);
      messagesList.innerHTML =
        '<p style="text-align:center;color:red;font-size:1.1rem;">Error loading requests. Please refresh the page.</p>';
    });
}

function renderSentMessages() {
  if (!currentUserUid || !window.db) {
    messagesList.innerHTML =
      '<p style="text-align:center;font-size:1.1rem;">Loading...</p>';
    return;
  }

  messagesList.innerHTML =
    '<p style="text-align:center;font-size:1.1rem;">Loading your requests...</p>';

  // Get requests where current user is the receiver
  const requestsRef = window.db.ref("requests");

  requestsRef
    .orderByChild("receiverUid")
    .equalTo(currentUserUid)
    .once("value")
    .then(function (snapshot) {
      messagesList.innerHTML = "";

      if (!snapshot.exists()) {
        messagesList.innerHTML =
          '<p style="text-align:center;font-size:1.1rem;">No requests sent yet.</p>';
        return;
      }

      const requests = [];
      snapshot.forEach(function (childSnapshot) {
        const request = childSnapshot.val();
        request.requestId = childSnapshot.key;

        // Skip requests that are hidden from this user's view
        if (!request[`hiddenFrom_${currentUserUid}`]) {
          requests.push(request);
        }
      });

      // Sort by timestamp (newest first)
      requests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Process requests and fetch donor data if needed
      processRequestsWithDonorData(requests);
    })
    .catch(function (error) {
      console.error("Error loading sent messages:", error);
      messagesList.innerHTML =
        '<p style="text-align:center;color:red;font-size:1.1rem;">Error loading your requests. Please refresh the page.</p>';
    });
}

function processRequestsWithDonorData(requests) {
  if (requests.length === 0) {
    messagesList.innerHTML =
      '<p style="text-align:center;font-size:1.1rem;">No requests sent yet.</p>';
    return;
  }

  // Group requests by donor to minimize database calls
  const donorIds = [
    ...new Set(requests.map((req) => req.donorUid).filter(Boolean)),
  ];

  if (donorIds.length === 0) {
    // No donor IDs, render with existing data
    requests.forEach((request) => {
      renderSentMessageCard(request);
    });
    return;
  }

  // Fetch donor data for all unique donors
  const donorPromises = donorIds.map((donorId) =>
    window.db.ref(`users/${donorId}`).once("value")
  );

  Promise.all(donorPromises)
    .then(function (donorSnapshots) {
      const donorDataMap = {};
      donorSnapshots.forEach((snapshot, index) => {
        const donorId = donorIds[index];
        donorDataMap[donorId] = snapshot.val() || {};
      });

      // Render each request with enhanced donor data
      requests.forEach((request) => {
        const donorData = donorDataMap[request.donorUid] || {};

        // Enhance request with donor data if not already present
        if (
          !request.donorLocation ||
          request.donorLocation === "Not provided"
        ) {
          request.donorLocation =
            donorData.location || donorData.address || "Not provided";
        }
        if (!request.donorName || request.donorName === request.donorEmail) {
          request.donorName =
            donorData.displayName || donorData.name || request.donorEmail;
        }

        renderSentMessageCard(request);
      });
    })
    .catch(function (error) {
      console.error("Error fetching donor data:", error);
      // Fallback: render with existing data
      requests.forEach((request) => {
        renderSentMessageCard(request);
      });
    });
}

function renderSentMessageCard(request) {
  const card = document.createElement("div");
  card.className = "message-card fadeIn";

  let statusMsg = "";
  let closeBtn = "";
  let cardStyle = "";

  if (request.status === "pending") {
    statusMsg = `You requested <b>${request.clothName}</b> donated by <b>${request.donorEmail}</b>.`;
    cardStyle = "border-left: 4px solid #f59e0b;";
  } else if (request.status === "accepted") {
    statusMsg = `Your request for <b>${request.clothName}</b> has been <span style='color:#22c55e;font-weight:600;'>accepted</span> by <b>${request.donorEmail}</b>. They may contact you soon to arrange pickup.`;
    cardStyle = "border-left: 4px solid #22c55e;";
  } else if (request.status === "declined") {
    statusMsg = `Your request for <b>${request.clothName}</b> was declined by <b>${request.donorEmail}</b>.`;
    if (request.declineReason) {
      statusMsg += `<br><span style='color:#ef4444;font-size:0.9em;'>Reason: ${request.declineReason}</span>`;
    }
    cardStyle = "border-left: 4px solid #ef4444;";
    closeBtn = `<button class="close-x-btn" title="Remove" style="position:absolute;top:10px;right:14px;background:none;border:none;font-size:1.3em;color:#ef4444;cursor:pointer;">&times;</button>`;
  } else if (request.status === "completed") {
    statusMsg = `Donation marked as completed by <b>${request.donorEmail}</b>. Thank you for using the platform!`;
    cardStyle = "border-left: 4px solid #059669;";
  }

  // Add X button for declined or completed requests
  if (request.status === "declined" || request.status === "completed") {
    closeBtn = `<button class="close-x-btn" title="Remove" style="position:absolute;top:10px;right:14px;background:none;border:none;font-size:1.3em;color:#ef4444;cursor:pointer;">&times;</button>`;
  }

  card.style.cssText = cardStyle + "position:relative;";
  card.innerHTML = `
      <div style="display:flex;align-items:center;gap:1.5rem;position:relative;">
      <img src="${request.clothImgData || "assets/images/placeholder.png"}" 
           class="cloth-img" alt="Cloth Image" 
           style="max-width:80px;max-height:80px;border-radius:1rem;box-shadow:0 2px 8px rgba(59,130,246,0.10);">
        <div style="flex:1;">
          <div class="meta">${statusMsg}</div>
        <div class="meta">Donor: <b>${
          request.donorName || request.donorEmail
        }</b></div>
        <div class="meta">Email: ${request.donorEmail}</div>
        <div class="meta">Location: ${
          request.donorLocation || "Not provided"
        }</div>
          <div class="meta">Requested at: ${new Date(
            request.timestamp
          ).toLocaleString()}</div>
        </div>
        ${closeBtn}
      </div>
    `;

  // X close button for declined or completed requests
  if (
    (request.status === "declined" || request.status === "completed") &&
    card.querySelector(".close-x-btn")
  ) {
    card.querySelector(".close-x-btn").onclick = function () {
      if (
        confirm("Are you sure you want to remove this message from your view?")
      ) {
        hideRequestFromView(request.requestId);
      }
    };
  }

  messagesList.appendChild(card);
}

function loadMessages() {
  if (!currentUserUid) {
    messagesList.innerHTML =
      '<p style="color:red;">You must be logged in to view your messages.</p>';
    return;
  }
  if (currentTab === "received") {
    renderReceivedMessages();
  } else {
    renderSentMessages();
  }
}

receivedTab.onclick = function () {
  currentTab = "received";
  receivedTab.style.background = "#2563eb";
  receivedTab.style.color = "#fff";
  sentTab.style.background = "#f59e42";
  sentTab.style.color = "#fff";
  loadMessages();
};
sentTab.onclick = function () {
  currentTab = "sent";
  sentTab.style.background = "#2563eb";
  sentTab.style.color = "#fff";
  receivedTab.style.background = "#f59e42";
  receivedTab.style.color = "#fff";
  loadMessages();
};

// Helper functions for request handling

function acceptRequest(requestId) {
  if (!window.db) {
    alert("Database connection error. Please refresh the page.");
    return;
  }

  const requestRef = window.db.ref(`requests/${requestId}`);
  requestRef
    .update({
      status: "accepted",
      acceptedAt: new Date().toISOString(),
    })
    .then(function () {
      console.log("Request accepted successfully");
      loadMessages();
    })
    .catch(function (error) {
      console.error("Error accepting request:", error);
      alert("Error accepting request. Please try again.");
    });
}

let currentDeclineRequestId = null;

function showDeclineReasonModal(requestId, clothName) {
  currentDeclineRequestId = requestId;

  const modal = document.getElementById("declineModal");
  const modalText = document.getElementById("declineModalText");
  const reasonInput = document.getElementById("declineReasonInput");

  modalText.textContent = `Please provide a reason for declining the request for "${clothName}":`;
  reasonInput.value = "";

  modal.style.display = "flex";
  modal.querySelector(".modal-content").classList.add("fadeIn");

  // Focus on the textarea
  setTimeout(() => {
    reasonInput.focus();
  }, 100);
}

// Modal event handlers
document.addEventListener("DOMContentLoaded", function () {
  const declineModal = document.getElementById("declineModal");
  const closeDeclineModal = document.getElementById("closeDeclineModal");
  const cancelDeclineBtn = document.getElementById("cancelDeclineBtn");
  const submitDeclineBtn = document.getElementById("submitDeclineBtn");
  const reasonInput = document.getElementById("declineReasonInput");

  function closeModal() {
    declineModal.style.display = "none";
    declineModal.querySelector(".modal-content").classList.remove("fadeIn");
    currentDeclineRequestId = null;
  }

  closeDeclineModal.onclick = closeModal;
  cancelDeclineBtn.onclick = closeModal;

  // Close modal when clicking outside
  window.onclick = function (event) {
    if (event.target === declineModal) {
      closeModal();
    }
  };

  // Submit decline reason
  submitDeclineBtn.onclick = function () {
    const reason = reasonInput.value.trim();

    if (reason === "") {
      alert("Please provide a reason for declining.");
      return;
    }

    if (currentDeclineRequestId) {
      declineRequest(currentDeclineRequestId, reason);
      closeModal();
    }
  };

  // Allow Enter key to submit
  reasonInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && event.ctrlKey) {
      submitDeclineBtn.click();
    }
  });
});

function declineRequest(requestId, reason) {
  if (!window.db) {
    alert("Database connection error. Please refresh the page.");
    return;
  }

  const requestRef = window.db.ref(`requests/${requestId}`);
  requestRef
    .update({
      status: "declined",
      declineReason: reason,
      declinedAt: new Date().toISOString(),
    })
    .then(function () {
      console.log("Request declined successfully");
      loadMessages();
    })
    .catch(function (error) {
      console.error("Error declining request:", error);
      alert("Error declining request. Please try again.");
    });
}

function completeDonation(request) {
  if (!window.db) {
    alert("Database connection error. Please refresh the page.");
    return;
  }

  if (
    !confirm(
      `Are you sure you want to mark the donation of "${request.clothName}" as completed? This will remove the item from the database.`
    )
  ) {
    return;
  }

  // Update request status to completed
  const requestRef = window.db.ref(`requests/${request.requestId}`);
  requestRef
    .update({
      status: "completed",
      completedAt: new Date().toISOString(),
    })
    .then(function () {
      console.log("Request marked as completed");

      // Delete the cloth from user's donated clothes
      const userDonationsRef = window.db.ref(
        `users/${request.donorUid}/donatedClothes`
      );
      userDonationsRef
        .orderByChild("name")
        .equalTo(request.clothName)
        .once("value")
        .then(function (snapshot) {
          if (snapshot.exists()) {
            snapshot.forEach(function (childSnapshot) {
              const cloth = childSnapshot.val();
              if (
                cloth.size === request.clothSize &&
                cloth.category === request.clothCategory
              ) {
                childSnapshot.ref.remove();
              }
            });
          }
        });

      // Delete the cloth from general donations
      const donationsRef = window.db.ref("donations");
      donationsRef
        .orderByChild("name")
        .equalTo(request.clothName)
        .once("value")
        .then(function (snapshot) {
          if (snapshot.exists()) {
            snapshot.forEach(function (childSnapshot) {
              const cloth = childSnapshot.val();
              if (
                cloth.donorUid === request.donorUid &&
                cloth.size === request.clothSize &&
                cloth.category === request.clothCategory
              ) {
                childSnapshot.ref.remove();
              }
            });
          }
        });

      alert("Donation marked as complete. Thank you for making a difference!");
      loadMessages();
    })
    .catch(function (error) {
      console.error("Error completing donation:", error);
      alert("Error completing donation. Please try again.");
    });
}

function hideRequestFromView(requestId) {
  if (!window.db) {
    alert("Database connection error. Please refresh the page.");
    return;
  }

  // Add a flag to hide this request from the current user's view
  const requestRef = window.db.ref(`requests/${requestId}`);
  requestRef
    .update({
      [`hiddenFrom_${currentUserUid}`]: true,
      hiddenAt: new Date().toISOString(),
    })
    .then(function () {
      console.log("Request hidden from view successfully");
      loadMessages();
    })
    .catch(function (error) {
      console.error("Error hiding request:", error);
      alert("Error hiding request. Please try again.");
    });
}

function deleteRequest(requestId) {
  if (!window.db) {
    alert("Database connection error. Please refresh the page.");
    return;
  }

  if (
    !confirm("Are you sure you want to remove this request from your messages?")
  ) {
    return;
  }

  const requestRef = window.db.ref(`requests/${requestId}`);
  requestRef
    .remove()
    .then(function () {
      console.log("Request deleted successfully");
      loadMessages();
    })
    .catch(function (error) {
      console.error("Error deleting request:", error);
      alert("Error deleting request. Please try again.");
    });
}

// Set up real-time listeners for updates
function setupRealtimeListeners() {
  if (!window.db || !currentUserUid) return;

  const requestsRef = window.db.ref("requests");

  // Listen for changes in requests where user is donor
  requestsRef
    .orderByChild("donorUid")
    .equalTo(currentUserUid)
    .on("value", function () {
      if (currentTab === "received") {
        loadMessages();
      }
    });

  // Listen for changes in requests where user is receiver
  requestsRef
    .orderByChild("receiverUid")
    .equalTo(currentUserUid)
    .on("value", function () {
      if (currentTab === "sent") {
        loadMessages();
      }
    });
}

// Initialize page
window.addEventListener("DOMContentLoaded", function () {
  console.log("Messages page loaded");

  // Set up real-time listeners when user is authenticated
  if (currentUserUid) {
    setupRealtimeListeners();
  }
});

// Update loadMessages function
function loadMessages() {
  if (!currentUserUid) {
    messagesList.innerHTML =
      '<p style="color:red;">You must be logged in to view your messages.</p>';
    return;
  }

  if (currentTab === "received") {
    renderReceivedMessages();
  } else {
    renderSentMessages();
  }
}

// Tab switching
receivedTab.onclick = function () {
  currentTab = "received";
  receivedTab.style.background = "#2563eb";
  receivedTab.style.color = "#fff";
  sentTab.style.background = "#f59e42";
  sentTab.style.color = "#fff";
  loadMessages();
};

sentTab.onclick = function () {
  currentTab = "sent";
  sentTab.style.background = "#2563eb";
  sentTab.style.color = "#fff";
  receivedTab.style.background = "#f59e42";
  receivedTab.style.color = "#fff";
  loadMessages();
};
