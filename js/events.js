// --- Event Data Management ---
function getEvents() {
  return JSON.parse(localStorage.getItem("reware_events") || "[]");
}
function saveEvents(events) {
  localStorage.setItem("reware_events", JSON.stringify(events));
}
function getEventParticipants() {
  return JSON.parse(localStorage.getItem("reware_event_participants") || "[]");
}
function saveEventParticipants(participants) {
  localStorage.setItem(
    "reware_event_participants",
    JSON.stringify(participants)
  );
}

// --- Organizer Form Submission ---
document.addEventListener("DOMContentLoaded", function () {
  const eventForm = document.getElementById("eventForm");
  const eventSuccessMsg = document.getElementById("eventSuccessMsg");
  if (eventForm) {
    eventForm.onsubmit = function (e) {
      e.preventDefault();
      const event = {
        id: Date.now() + "_" + Math.random().toString(36).slice(2),
        name: document.getElementById("eventName").value.trim(),
        organizerName: document.getElementById("organizerName").value.trim(),
        organizerEmail: document.getElementById("organizerEmail").value.trim(),
        organizerPhone: document.getElementById("organizerPhone").value.trim(),
        organizerType: document.getElementById("organizerType").value,
        location: document.getElementById("eventLocation").value.trim(),
        startDate: document.getElementById("startDate").value,
        endDate: document.getElementById("endDate").value,
        time: document.getElementById("eventTime").value,
        regDeadline: document.getElementById("regDeadline").value,
        description: document.getElementById("eventDescription").value.trim(),
        clothesNeeded: Array.from(
          document.querySelectorAll(
            '.checkbox-group input[type="checkbox"]:checked'
          )
        ).map((cb) => cb.value),
        poster: "",
        createdAt: new Date().toISOString(),
      };
      // Handle poster upload
      const posterInput = document.getElementById("eventPoster");
      if (posterInput && posterInput.files && posterInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (ev) {
          event.poster = ev.target.result;
          saveEventAndRender(event);
        };
        reader.readAsDataURL(posterInput.files[0]);
      } else {
        saveEventAndRender(event);
      }
      function saveEventAndRender(event) {
        let events = getEvents();
        events.unshift(event);
        saveEvents(events);
        eventForm.reset();
        eventSuccessMsg.textContent =
          "✅ Event submitted successfully for review!";
        eventSuccessMsg.style.display = "block";
        setTimeout(() => (eventSuccessMsg.style.display = "none"), 3000);
        renderEvents();
        renderOrganizerDashboard();
      }
    };
  }
  renderEvents();
  renderOrganizerDashboard();
});

// --- Render Events ---
function renderEvents() {
  const eventsList = document.getElementById("eventsList");
  if (!eventsList) return;
  let events = getEvents();
  eventsList.innerHTML = "";
  if (!events.length) {
    eventsList.innerHTML =
      '<div style="text-align:center;color:#888;">No events yet. Be the first to launch one!</div>';
    return;
  }
  events.forEach((event) => {
    eventsList.innerHTML += eventCardHTML(event);
  });
  addEventCardListeners();
}

function eventCardHTML(event) {
  return `<div class="event-card">
    ${
      event.poster
        ? `<img src="${event.poster}" class="event-poster" alt="Event Poster">`
        : ""
    }
    <div class="event-title">${event.name}</div>
    <div class="event-meta">By ${event.organizerName} (${
    event.organizerType
  })</div>
    <div class="event-meta">${formatEventDates(
      event.startDate,
      event.endDate
    )} | ${event.time}</div>
    <div class="event-meta"><span style="color:#e91e63;">📍</span> ${
      event.location
    }</div>
    <div class="event-desc">${event.description}</div>
    <div class="clothes-needed">Needed: ${event.clothesNeeded
      .map((c) => `<span>${clothesIcon(c)} ${c}</span>`)
      .join(", ")}</div>
    <div class="event-actions">
      <button class="event-btn green" data-action="join" data-id="${
        event.id
      }">Join This Event</button>
      <button class="event-btn pink" data-action="contact" data-email="${
        event.organizerEmail
      }">Contact Organizer</button>
    </div>
  </div>`;
}
function clothesIcon(type) {
  if (type === "Children") return "👶";
  if (type === "Adult") return "👕";
  if (type === "Winter") return "🧥";
  if (type === "Daily Wear") return "👚";
  return "🧦";
}
function formatEventDates(start, end) {
  if (start === end) return start;
  return `${start} - ${end}`;
}

function addEventCardListeners() {
  document.querySelectorAll('.event-btn[data-action="join"]').forEach((btn) => {
    btn.onclick = function () {
      const eventId = btn.getAttribute("data-id");
      handleJoinEvent(eventId);
    };
  });
  document
    .querySelectorAll('.event-btn[data-action="contact"]')
    .forEach((btn) => {
      btn.onclick = function () {
        const email = btn.getAttribute("data-email");
        window.location.href = `mailto:${email}`;
      };
    });
}

// --- User Participation ---
function handleJoinEvent(eventId) {
  const user = JSON.parse(localStorage.getItem("loggedInUser") || "null");
  if (!user) {
    alert("You must be logged in to join an event.");
    window.location.href = "login.html";
    return;
  }
  let participants = getEventParticipants();
  let already = participants.find(
    (p) => p.eventId === eventId && p.email === user.email
  );
  if (already) {
    alert("You have already joined this event!");
    return;
  }
  let pledge = prompt(
    "How many clothes do you pledge to donate at this event?"
  );
  if (!pledge || isNaN(pledge) || pledge < 1) {
    alert("Please enter a valid number of clothes.");
    return;
  }
  participants.push({
    eventId,
    email: user.email,
    name: user.name,
    pledge: Number(pledge),
    joinedAt: new Date().toISOString(),
  });
  saveEventParticipants(participants);
  // Add badge and points for attending
  addEventAttendanceBadgeAndPoints(user.email);
  alert("You have joined this event! Thank you for your participation.");
}
function addEventAttendanceBadgeAndPoints(email) {
  let users = JSON.parse(localStorage.getItem("users") || "[]");
  let user = users.find((u) => u.email === email);
  if (!user) return;
  user.eventAttendance = (user.eventAttendance || 0) + 1;
  user.points = (user.points || 0) + 10;
  // Award badge if attended 3+ events
  if (user.eventAttendance === 3) {
    user.badges = user.badges || [];
    if (!user.badges.includes("Event Enthusiast"))
      user.badges.push("Event Enthusiast");
  }
  localStorage.setItem("users", JSON.stringify(users));
}

// --- Organizer Dashboard ---
function renderOrganizerDashboard() {
  const user = JSON.parse(localStorage.getItem("loggedInUser") || "null");
  const dash = document.getElementById("organizerDashboard");
  const yourEventsList = document.getElementById("yourEventsList");
  if (!dash || !yourEventsList) return;
  if (!user) {
    dash.style.display = "none";
    return;
  }
  let events = getEvents().filter((e) => e.organizerEmail === user.email);
  if (!events.length) {
    dash.style.display = "none";
    return;
  }
  dash.style.display = "block";
  yourEventsList.innerHTML = "";
  events.forEach((event) => {
    let participants = getEventParticipants().filter(
      (p) => p.eventId === event.id
    );
    yourEventsList.innerHTML += `<div class="event-card">
      ${
        event.poster
          ? `<img src="${event.poster}" class="event-poster" alt="Event Poster">`
          : ""
      }
      <div class="event-title">${event.name}</div>
      <div class="event-meta">${formatEventDates(
        event.startDate,
        event.endDate
      )} | ${event.time}</div>
      <div class="event-meta"><span style="color:#e91e63;">📍</span> ${
        event.location
      }</div>
      <div class="event-desc">${event.description}</div>
      <div class="event-meta">Registered Participants: <b>${
        participants.length
      }</b></div>
      <div class="event-actions">
        <button class="event-btn pink" onclick="deleteEvent('${
          event.id
        }')">Delete</button>
      </div>
    </div>`;
  });
}
function deleteEvent(eventId) {
  if (!confirm("Are you sure you want to delete this event?")) return;
  let events = getEvents().filter((e) => e.id !== eventId);
  saveEvents(events);
  renderEvents();
  renderOrganizerDashboard();
}
