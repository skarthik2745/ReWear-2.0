// Events page logic for ReWear
let currentUser = null;
let currentUserUid = null;
let currentEventId = null;
let imagePreviewInitialized = false;

// Check authentication state
window.auth.onAuthStateChanged(function (firebaseUser) {
  console.log("Auth state changed in events page:", firebaseUser);
  if (firebaseUser) {
    currentUser = firebaseUser;
    currentUserUid = firebaseUser.uid;
    console.log("User logged in:", currentUserUid);
    loadEvents();
    setupRealtimeListeners();
  } else {
    console.log("No user logged in");
    currentUser = null;
    currentUserUid = null;
    document.getElementById("eventsList").innerHTML =
      '<p style="color:red;">You must be logged in to view events.</p>';
  }
});

// Event Form Submission
document.addEventListener("DOMContentLoaded", function () {
  const eventForm = document.getElementById("eventForm");
  const eventSuccessMsg = document.getElementById("eventSuccessMsg");

  if (eventForm) {
    eventForm.onsubmit = function (e) {
      e.preventDefault();

      if (!currentUserUid) {
        alert("You must be logged in to create an event.");
        return;
      }

      // Show loading state
      const submitBtn = eventForm.querySelector(".event-submit-btn");
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Creating Event...";
      submitBtn.disabled = true;

      // Get form data
      const eventData = {
        eventName: document.getElementById("eventName").value.trim(),
        organizerName: document.getElementById("organizerName").value.trim(),
        organizerEmail: document.getElementById("organizerEmail").value.trim(),
        organizerPhone: document.getElementById("organizerPhone").value.trim(),
        typeOfOrganizer: document.getElementById("organizerType").value,
        location: document.getElementById("eventLocation").value.trim(),
        startDate: document.getElementById("startDate").value,
        endDate: document.getElementById("endDate").value,
        time: document.getElementById("eventTime").value,
        registrationDeadline: document.getElementById("regDeadline").value,
        description: document.getElementById("eventDescription").value.trim(),
        clothTypes: Array.from(
          document.querySelectorAll(
            '.checkbox-group input[type="checkbox"]:checked'
          )
        ).map((cb) => cb.value),
        createdAt: new Date().toISOString(),
        createdBy: currentUserUid,
      };

      // Validate required fields (endDate and time are now optional)
      if (
        !eventData.eventName ||
        !eventData.organizerName ||
        !eventData.organizerEmail ||
        !eventData.typeOfOrganizer ||
        !eventData.location ||
        !eventData.startDate ||
        !eventData.registrationDeadline ||
        !eventData.description ||
        eventData.clothTypes.length === 0
      ) {
        alert("Please fill in all required fields.");
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      // Handle file uploads
      const posterFile = document.getElementById("eventPoster").files[0];
      const proofFile = document.getElementById("proofImage").files[0];

      uploadEventWithFiles(eventData, posterFile, proofFile)
        .then(() => {
          // Reset button state
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        })
        .catch((error) => {
          console.error("Error in form submission:", error);
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    };
  }

  // Participation form submission
  const participationForm = document.getElementById("participationForm");
  if (participationForm) {
    participationForm.onsubmit = function (e) {
      e.preventDefault();

      if (!currentUserUid || !currentEventId) {
        alert("Error: User not logged in or event not selected.");
        return;
      }

      const participationData = {
        name: document.getElementById("participantName").value,
        email: document.getElementById("participantEmail").value,
        phone: document.getElementById("participantPhone").value,
        location: document.getElementById("participantLocation").value,
        numOfClothes: parseInt(document.getElementById("numOfClothes").value),
        clothDetails: document.getElementById("clothDetails").value.trim(),
        participatedAt: new Date().toISOString(),
      };

      if (!participationData.numOfClothes || !participationData.clothDetails) {
        alert("Please fill in all required fields.");
        return;
      }

      // Handle cloth images upload
      const clothImageFiles = document.getElementById("clothImages").files;
      uploadParticipationWithImages(participationData, clothImageFiles);
    };
  }

  loadEvents();

  // Add image preview functionality for multiple file uploads (only once)
  if (!imagePreviewInitialized) {
    const clothImagesInput = document.getElementById("clothImages");
    if (clothImagesInput) {
      console.log("Found clothImages input, setting up preview functionality");

      clothImagesInput.addEventListener("change", function (e) {
        const files = e.target.files;
        const previewDiv = document.getElementById("imagePreview");

        console.log(
          `Selected ${files.length} files:`,
          Array.from(files).map((f) => f.name)
        );

        if (!previewDiv) {
          console.error("Image preview div not found!");
          return;
        }

        if (files.length > 0) {
          previewDiv.innerHTML = "";
          previewDiv.style.display = "block";

          console.log("Processing files for preview...");
          Array.from(files).forEach((file, index) => {
            console.log(`Processing file ${index + 1}: ${file.name}`);
            const reader = new FileReader();
            reader.onload = function (e) {
              const img = document.createElement("img");
              img.src = e.target.result;
              img.style.width = "80px";
              img.style.height = "80px";
              img.style.objectFit = "cover";
              img.style.margin = "5px";
              img.style.borderRadius = "5px";
              img.style.border = "2px solid #ddd";
              img.title = file.name;
              previewDiv.appendChild(img);
              console.log(`Added preview for ${file.name}`);
            };
            reader.onerror = function (error) {
              console.error(`Error reading file ${file.name}:`, error);
            };
            reader.readAsDataURL(file);
          });
        } else {
          previewDiv.style.display = "none";
          console.log("No files selected, hiding preview");
        }
      });

      imagePreviewInitialized = true;
    } else {
      console.error("clothImages input not found!");
    }
  }
});

// Upload event with files
async function uploadEventWithFiles(eventData, posterFile, proofFile) {
  try {
    console.log("Starting event upload...");

    // First, create the event in database without files
    const eventId = window.db.ref("events").push().key;
    console.log("Generated event ID:", eventId);

    let posterUrl = "";
    let proofImageUrl = "";

    // Handle poster file - use base64 as primary method to avoid CORS
    if (posterFile) {
      console.log("Processing poster file...");
      try {
        // Convert to base64 immediately to avoid CORS issues
        posterUrl = await fileToBase64(posterFile);
        console.log("Poster converted to base64 successfully");

        // Optionally try Firebase Storage in background (don't wait for it)
        try {
          const posterRef = window.storage.ref(`events/${eventId}/poster.jpg`);
          posterRef
            .put(posterFile)
            .then((snapshot) => {
              snapshot.ref.getDownloadURL().then((url) => {
                console.log(
                  "Firebase Storage upload successful for poster:",
                  url
                );
                // Update the event with Firebase URL if successful
                window.db.ref(`events/${eventId}/posterUrl`).set(url);
              });
            })
            .catch((error) => {
              console.log(
                "Firebase Storage upload failed for poster (using base64):",
                error.message
              );
            });
        } catch (firebaseError) {
          console.log(
            "Firebase Storage not available for poster (using base64)"
          );
        }
      } catch (error) {
        console.error("Error processing poster file:", error);
        posterUrl = "";
      }
    }

    // Handle proof image file - use base64 as primary method to avoid CORS
    if (proofFile) {
      console.log("Processing proof file...");
      try {
        // Convert to base64 immediately to avoid CORS issues
        proofImageUrl = await fileToBase64(proofFile);
        console.log("Proof image converted to base64 successfully");

        // Optionally try Firebase Storage in background (don't wait for it)
        try {
          const proofRef = window.storage.ref(`events/${eventId}/proof.jpg`);
          proofRef
            .put(proofFile)
            .then((snapshot) => {
              snapshot.ref.getDownloadURL().then((url) => {
                console.log(
                  "Firebase Storage upload successful for proof:",
                  url
                );
                // Update the event with Firebase URL if successful
                window.db.ref(`events/${eventId}/proofImageUrl`).set(url);
              });
            })
            .catch((error) => {
              console.log(
                "Firebase Storage upload failed for proof (using base64):",
                error.message
              );
            });
        } catch (firebaseError) {
          console.log(
            "Firebase Storage not available for proof (using base64)"
          );
        }
      } catch (error) {
        console.error("Error processing proof file:", error);
        proofImageUrl = "";
      }
    }

    // Save event data to Firebase (always works, even if file uploads fail)
    console.log("Saving event data to database...");
    const eventRef = window.db.ref(`events/${eventId}`);
    await eventRef.set({
      eventId: eventId,
      eventName: eventData.eventName,
      organizerName: eventData.organizerName,
      organizerEmail: eventData.organizerEmail,
      organizerPhone: eventData.organizerPhone,
      typeOfOrganizer: eventData.typeOfOrganizer,
      location: eventData.location,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      time: eventData.time,
      registrationDeadline: eventData.registrationDeadline,
      description: eventData.description,
      clothTypes: eventData.clothTypes,
      posterUrl: posterUrl,
      proofImageUrl: proofImageUrl,
      createdAt: eventData.createdAt,
      createdBy: eventData.createdBy,
    });

    // Show success message
    const eventSuccessMsg = document.getElementById("eventSuccessMsg");
    if (posterUrl || proofImageUrl) {
      eventSuccessMsg.textContent =
        "✅ Event created successfully! Images stored locally.";
    } else {
      eventSuccessMsg.textContent = "✅ Event created successfully!";
    }
    eventSuccessMsg.style.display = "block";
    setTimeout(() => {
      eventSuccessMsg.style.display = "none";
    }, 3000);

    // Reset form
    document.getElementById("eventForm").reset();

    console.log("Event created successfully:", eventId);
  } catch (error) {
    console.error("Error creating event:", error);
    alert("Error creating event. Please try again. Error: " + error.message);
    throw error;
  }
}

// Upload participation with images
async function uploadParticipationWithImages(
  participationData,
  clothImageFiles
) {
  try {
    const imageUrls = [];

    // Upload cloth images if provided
    if (clothImageFiles && clothImageFiles.length > 0) {
      console.log("Processing cloth images...");
      const imagePromises = Array.from(clothImageFiles).map(
        async (file, index) => {
          try {
            // Convert to base64 immediately to avoid CORS issues
            const base64Url = await fileToBase64(file);
            console.log(`Image ${index} converted to base64 successfully`);

            // Optionally try Firebase Storage in background (don't wait for it)
            try {
              const imageRef = window.storage.ref(
                `events/${currentEventId}/participants/${currentUserUid}/cloth_${index}.jpg`
              );
              imageRef
                .put(file)
                .then((snapshot) => {
                  snapshot.ref.getDownloadURL().then((url) => {
                    console.log(
                      `Firebase Storage upload successful for image ${index}:`,
                      url
                    );
                    // Update the participation with Firebase URL if successful
                    window.db
                      .ref(
                        `events/${currentEventId}/participants/${currentUserUid}/imageUrls/${index}`
                      )
                      .set(url);
                  });
                })
                .catch((error) => {
                  console.log(
                    `Firebase Storage upload failed for image ${index} (using base64):`,
                    error.message
                  );
                });
            } catch (firebaseError) {
              console.log(
                `Firebase Storage not available for image ${index} (using base64)`
              );
            }

            return base64Url;
          } catch (error) {
            console.error(`Error processing image ${index}:`, error);
            return null;
          }
        }
      );

      const results = await Promise.all(imagePromises);
      imageUrls.push(...results.filter((url) => url !== null));
    }

    // Save participation data to Firebase
    console.log("Saving participation data...");
    const participationRef = window.db.ref(
      `events/${currentEventId}/participants/${currentUserUid}`
    );
    await participationRef.set({
      ...participationData,
      imageUrls: imageUrls,
    });

    // Close modal and show success message
    closeParticipationModal();
    alert(
      "✅ Participation submitted successfully! Thank you for your contribution."
    );

    console.log("Participation submitted successfully");
  } catch (error) {
    console.error("Error submitting participation:", error);
    alert(
      "Error submitting participation. Please try again. Error: " +
        error.message
    );
  }
}

// Load and render events
function loadEvents() {
  if (!window.db) {
    document.getElementById("eventsList").innerHTML =
      '<p style="color:red;">Database connection error. Please refresh the page.</p>';
    return;
  }

  document.getElementById("eventsList").innerHTML =
    '<div class="loading">Loading events...</div>';

  const eventsRef = window.db.ref("events");
  eventsRef
    .once("value")
    .then(function (snapshot) {
      const events = [];
      snapshot.forEach(function (childSnapshot) {
        const event = childSnapshot.val();
        events.push(event);
      });

      // Sort by creation date (newest first)
      events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      renderEvents(events);
      renderOrganizerDashboard(events);
    })
    .catch(function (error) {
      console.error("Error loading events:", error);
      document.getElementById("eventsList").innerHTML =
        '<p style="color:red;">Error loading events. Please refresh the page.</p>';
    });
}

// Render events list
function renderEvents(events) {
  const eventsList = document.getElementById("eventsList");

  if (!events || events.length === 0) {
    eventsList.innerHTML =
      '<div style="text-align:center;color:#fff;font-size:1.1rem;padding:2rem;">No events yet. Be the first to launch one!</div>';
    return;
  }

  eventsList.innerHTML = "";

  events.forEach((event) => {
    const card = document.createElement("div");
    card.className = "event-card fadeIn";

    const clothTypesHtml = event.clothTypes
      .map((type) => {
        const icon = getClothTypeIcon(type);
        return `<span>${icon} ${type}</span>`;
      })
      .join(", ");

    card.innerHTML = `
      <div class="event-content">
        <div class="event-title">${event.eventName}</div>
        <div class="event-field"><span class="event-label">Organizer Name:</span> <span class="event-value">${
          event.organizerName
        }</span></div>
        <div class="event-field"><span class="event-label">Organizer Email:</span> <span class="event-value">${
          event.organizerEmail
        }</span></div>
        <div class="event-field"><span class="event-label">Organizer Phone:</span> <span class="event-value">${
          event.organizerPhone
        }</span></div>
        <div class="event-field"><span class="event-label">Location:</span> <span class="event-value">${
          event.location
        }</span></div>
        <div class="event-field"><span class="event-label">Type of Organizer:</span> <span class="event-value">${
          event.typeOfOrganizer
        }</span></div>
        <div class="event-field"><span class="event-label">Start Date:</span> <span class="event-value">${formatDate(
          event.startDate
        )}</span></div>
        <div class="event-field"><span class="event-label">End Date:</span> <span class="event-value">${
          event.endDate ? formatDate(event.endDate) : "Not Specified"
        }</span></div>
        <div class="event-field"><span class="event-label">Time:</span> <span class="event-value">${
          event.time ? event.time : "Not Specified"
        }</span></div>
        <div class="event-field"><span class="event-label">Registration Deadline:</span> <span class="event-value event-deadline">${formatDate(
          event.registrationDeadline
        )}</span></div>
        <div class="event-section-heading">Event Description</div>
        <div class="event-desc">${event.description}</div>
        <div class="event-section-heading">Types of Clothes Needed</div>
        <div class="clothes-needed-badges">${event.clothTypes
          .map(
            (type) =>
              `<span class='clothes-badge clothes-badge-${type
                .replace(/\s+/g, "")
                .toLowerCase()}'>${type}</span>`
          )
          .join(" ")}</div>
        <div class="event-actions">
          <button class="event-btn green" onclick="participateInEvent('${
            event.eventId
          }')">💚 I Want to Participate</button>
          <button class="event-btn pink" onclick="contactOrganizer('${
            event.organizerEmail
          }')">📧 Contact Organizer</button>
        </div>
      </div>
      ${
        event.posterUrl
          ? `<img src="${event.posterUrl}" class="event-poster" alt="Event Poster">`
          : ""
      }
    `;

    eventsList.appendChild(card);
  });
}

// Render organizer dashboard
function renderOrganizerDashboard(events) {
  if (!currentUserUid) return;

  const userEvents = events.filter(
    (event) => event.createdBy === currentUserUid
  );
  const dashboard = document.getElementById("organizerDashboard");
  const yourEventsList = document.getElementById("yourEventsList");

  if (!userEvents.length) {
    dashboard.style.display = "none";
    return;
  }

  dashboard.style.display = "block";
  yourEventsList.innerHTML = "";

  userEvents.forEach((event) => {
    const card = document.createElement("div");
    card.className = "event-card fadeIn";

    const clothTypesHtml = event.clothTypes
      .map((type) => {
        const icon = getClothTypeIcon(type);
        return `<span>${icon} ${type}</span>`;
      })
      .join(", ");

    card.innerHTML = `
      <div class="event-content">
        <div class="event-title">${event.eventName}</div>
        <div class="event-field"><span class="event-label">Organizer Name:</span> <span class="event-value">${
          event.organizerName
        }</span></div>
        <div class="event-field"><span class="event-label">Organizer Email:</span> <span class="event-value">${
          event.organizerEmail
        }</span></div>
        <div class="event-field"><span class="event-label">Organizer Phone:</span> <span class="event-value">${
          event.organizerPhone
        }</span></div>
        <div class="event-field"><span class="event-label">Location:</span> <span class="event-value">${
          event.location
        }</span></div>
        <div class="event-field"><span class="event-label">Type of Organizer:</span> <span class="event-value">${
          event.typeOfOrganizer
        }</span></div>
        <div class="event-field"><span class="event-label">Start Date:</span> <span class="event-value">${formatDate(
          event.startDate
        )}</span></div>
        <div class="event-field"><span class="event-label">End Date:</span> <span class="event-value">${
          event.endDate ? formatDate(event.endDate) : "Not Specified"
        }</span></div>
        <div class="event-field"><span class="event-label">Time:</span> <span class="event-value">${
          event.time ? event.time : "Not Specified"
        }</span></div>
        <div class="event-field"><span class="event-label">Registration Deadline:</span> <span class="event-value event-deadline">${formatDate(
          event.registrationDeadline
        )}</span></div>
        <div class="event-section-heading">Event Description</div>
        <div class="event-desc">${event.description}</div>
        <div class="event-section-heading">Types of Clothes Needed</div>
        <div class="clothes-needed-badges">${event.clothTypes
          .map(
            (type) =>
              `<span class='clothes-badge clothes-badge-${type
                .replace(/\s+/g, "")
                .toLowerCase()}'>${type}</span>`
          )
          .join(" ")}</div>
        <div class="event-actions">
          <button class="event-btn green" onclick="viewParticipants('${
            event.eventId
          }')">👥 View Participants</button>
          <button class="event-btn pink" onclick="deleteEvent('${
            event.eventId
          }')">🗑️ Delete Event</button>
        </div>
      </div>
      ${
        event.posterUrl
          ? `<img src="${event.posterUrl}" class="event-poster" alt="Event Poster">`
          : ""
      }
    `;

    yourEventsList.appendChild(card);
  });
}

// Participate in event
function participateInEvent(eventId) {
  if (!currentUserUid) {
    alert("You must be logged in to participate in an event.");
    return;
  }

  currentEventId = eventId;

  // Get current user data
  const userRef = window.db.ref(`users/${currentUserUid}`);
  userRef
    .once("value")
    .then(function (snapshot) {
      const userData = snapshot.val();
      if (!userData) {
        alert("User data not found. Please update your profile first.");
        return;
      }

      // Fill the participation form with user data
      document.getElementById("participantName").value =
        userData.displayName || userData.name || "";
      document.getElementById("participantEmail").value = userData.email || "";
      document.getElementById("participantPhone").value = userData.phone || "";
      document.getElementById("participantLocation").value =
        userData.location || userData.address || "";

      // Show modal
      document.getElementById("participationModal").style.display = "flex";

      // Clear any existing image preview
      const previewDiv = document.getElementById("imagePreview");
      if (previewDiv) {
        previewDiv.innerHTML = "";
        previewDiv.style.display = "none";
      }
    })
    .catch(function (error) {
      console.error("Error fetching user data:", error);
      alert("Error loading user data. Please try again.");
    });
}

// Close participation modal
function closeParticipationModal() {
  document.getElementById("participationModal").style.display = "none";
  currentEventId = null;
  document.getElementById("participationForm").reset();

  // Clear image preview
  const previewDiv = document.getElementById("imagePreview");
  if (previewDiv) {
    previewDiv.innerHTML = "";
    previewDiv.style.display = "none";
  }
}

// Contact organizer
function contactOrganizer(email) {
  window.location.href = `mailto:${email}`;
}

// View participants modal
function viewParticipants(eventId) {
  if (!currentUserUid) {
    alert("You must be logged in to view participants.");
    return;
  }

  // Show loading state
  const modal = document.getElementById("participantsModal");
  const modalContent = document.getElementById("participantsModalContent");
  modal.style.display = "flex";
  modalContent.innerHTML = '<div class="loading">Loading participants...</div>';

  // Fetch participants data
  const participantsRef = window.db.ref(`events/${eventId}/participants`);
  participantsRef
    .once("value")
    .then(function (snapshot) {
      const participants = [];
      snapshot.forEach(function (childSnapshot) {
        const participant = childSnapshot.val();
        participant.id = childSnapshot.key;
        participants.push(participant);
      });

      // Get event details for the modal title
      const eventRef = window.db.ref(`events/${eventId}`);
      return eventRef.once("value").then(function (eventSnapshot) {
        const eventData = eventSnapshot.val();
        return { participants, eventData };
      });
    })
    .then(function (data) {
      renderParticipantsModal(data.participants, data.eventData);
    })
    .catch(function (error) {
      console.error("Error fetching participants:", error);
      modalContent.innerHTML =
        '<div class="error-message">Error loading participants. Please try again.</div>';
    });
}

// Render participants modal
function renderParticipantsModal(participants, eventData) {
  const modalContent = document.getElementById("participantsModalContent");

  if (!participants || participants.length === 0) {
    modalContent.innerHTML = `
    <div class="participants-header">
      <h3>Participants for ${eventData.eventName}</h3>
      <div class="participant-count">👥 ${participants.length} participant${
      participants.length !== 1 ? "s" : ""
    }</div>
      <button class="close-modal" onclick="closeParticipantsModal()">❌</button>
    </div>
    <div class="no-participants">
      <div class="no-participants-icon">👥</div>
      <h4>No participants registered yet</h4>
      <p>This event hasn't received any participation submissions yet.</p>
    </div>
  `;
    return;
  }

  const participantsHtml = participants
    .map((participant) => {
      const imagesHtml =
        participant.imageUrls && participant.imageUrls.length > 0
          ? `
        <div class="participant-images">
          <span class="images-label">🖼️ Uploaded Images:</span>
          <div class="images-scroll">
            ${participant.imageUrls
              .map(
                (imageUrl, index) => `
              <img src="${imageUrl}" 
                   alt="Cloth image ${index + 1}" 
                   class="participant-image"
                   onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg2MFY2MEgyMFYyMFoiIGZpbGw9IiNEN0Q3RDciLz4KPHBhdGggZD0iTTI1IDI1SDM1VjM1SDI1VjI1WiIgZmlsbD0iI0M3QzdDNyIvPgo8cGF0aCBkPSJNMzUgMjVINjVWMzVIMzVWMjVaIiBmaWxsPSIjQzdDN0M3Ii8+CjxwYXRoIGQ9Ik0yNSA0MEg2NVY1MEgyNVY0MFoiIGZpbGw9IiNDN0M3QzciLz4KPC9zdmc+'"
                   title="Cloth image ${index + 1}">
            `
              )
              .join("")}
          </div>
        </div>
      `
          : "";

      return `
      <div class="participant-card">
        <div class="participant-header">
          <div class="participant-name">👤 ${participant.name}</div>
          <div class="participant-location">📍 ${participant.location}</div>
        </div>
        <div class="participant-details">
          <div class="participant-contact">
            <span class="contact-item">📧 ${participant.email}</span>
            <span class="contact-item">📱 ${participant.phone}</span>
          </div>
          <div class="participant-clothes">
            <span class="clothes-label">🧵 Cloth Details:</span>
            <span class="clothes-text">${participant.clothDetails}</span>
            <span class="clothes-count">(${participant.numOfClothes} items)</span>
          </div>
          ${imagesHtml}
        </div>
      </div>
    `;
    })
    .join("");

  modalContent.innerHTML = `
    <div class="participants-header">
      <h3>Participants for ${eventData.eventName}</h3>
      <div class="participant-count">👥 ${participants.length} participant${
    participants.length !== 1 ? "s" : ""
  }</div>
      <button class="close-modal" onclick="closeParticipantsModal()">❌</button>
    </div>
    <div class="participants-list">
      ${participantsHtml}
    </div>
  `;
}

// Close participants modal
function closeParticipantsModal() {
  document.getElementById("participantsModal").style.display = "none";
}

// Delete event
function deleteEvent(eventId) {
  if (
    !confirm(
      "Are you sure you want to delete this event? This action cannot be undone."
    )
  ) {
    return;
  }

  const eventRef = window.db.ref(`events/${eventId}`);
  eventRef
    .remove()
    .then(function () {
      console.log("Event deleted successfully");
      loadEvents();
    })
    .catch(function (error) {
      console.error("Error deleting event:", error);
      alert("Error deleting event. Please try again.");
    });
}

// Helper functions
function getClothTypeIcon(type) {
  const icons = {
    Children: "👶",
    Adult: "👕",
    "Baby Clothes": "👶",
    Winter: "🧥",
    "Daily Wear": "👔",
    Sportswear: "🧘",
    "Traditional Wear": "👚",
    "Scarves and Shawls": "🧣",
    Footwear: "👞",
    Accessories: "🧤",
    Other: "🧺",
  };
  return icons[type] || "🧺";
}

function formatEventDates(start, end) {
  if (!end || end === "") {
    return formatDate(start);
  }
  if (start === end) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Set up real-time listeners
function setupRealtimeListeners() {
  if (!window.db || !currentUserUid) return;

  const eventsRef = window.db.ref("events");
  eventsRef.on("value", function () {
    loadEvents();
  });
}

// Initialize Firebase Storage
if (typeof firebase !== "undefined") {
  window.storage = firebase.storage();
}

// Helper function to convert file to base64 (fallback for CORS issues)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}
