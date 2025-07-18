// Messages page logic for ReWear
const messagesList = document.getElementById("messagesList");
const user = JSON.parse(localStorage.getItem("loggedInUser") || "null");

const receivedTab = document.getElementById("receivedTab");
const sentTab = document.getElementById("sentTab");

let currentTab = "received";

function renderReceivedMessages() {
  let messages = JSON.parse(localStorage.getItem("reware_messages") || "[]");
  let myMessages = messages.filter(
    (msg) =>
      msg.donorEmail &&
      msg.donorEmail.trim().toLowerCase() === user.email.trim().toLowerCase()
  );
  messagesList.innerHTML = "";
  if (!myMessages.length) {
    messagesList.innerHTML =
      '<p style="text-align:center;font-size:1.1rem;">No requests received yet.</p>';
    return;
  }
  myMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  myMessages.forEach((msg, idx) => {
    const card = document.createElement("div");
    card.className = "message-card fadeIn";
    let statusSection = "";
    if (msg.status === "pending") {
      statusSection = `
        <button class="main-btn accept-btn" style="background:#22c55e;color:#fff;">Accept</button>
        <button class="main-btn decline-btn" style="background:#ef4444;">Decline</button>
      `;
    } else if (msg.status === "accepted") {
      statusSection = `<button class="main-btn donated-btn" style="background:#2563eb;color:#fff;">Cloth Successfully Donated</button>`;
    } else if (msg.status === "declined") {
      statusSection = `<span style="color:#ef4444;font-weight:600;">Declined</span>`;
    }
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:1.5rem;">
        <img src="${
          msg.cloth.imgData || "assets/images/placeholder.png"
        }" class="cloth-img" alt="Cloth Image" style="max-width:80px;max-height:80px;border-radius:1rem;box-shadow:0 2px 8px rgba(59,130,246,0.10);">
        <div style="flex:1;">
          <h3>${msg.cloth.name}</h3>
          <div class="meta">Category: ${msg.cloth.category}</div>
          <div class="meta">Size: ${msg.cloth.size}</div>
          <div class="meta">Condition: ${msg.cloth.condition}</div>
        </div>
      </div>
      <div class="meta" style="margin-top:0.5rem;">Requested by: <b>${
        msg.receiver.name
      }</b> (${msg.receiver.email}, ${msg.receiver.phone})</div>
      <div class="meta">Location: ${msg.receiver.address}</div>
      <div class="meta">Requested at: ${new Date(
        msg.timestamp
      ).toLocaleString()}</div>
      <div style="margin-top:8px;display:flex;gap:8px;align-items:center;">${statusSection}</div>
      <div class="notify-msg" style="margin-top:8px;font-size:0.98em;color:#2563eb;"></div>
    `;
    // Accept button
    if (msg.status === "pending") {
      card.querySelector(".accept-btn").onclick = function () {
        let messages = JSON.parse(
          localStorage.getItem("reware_messages") || "[]"
        );
        let idxMsg = messages.findIndex((m) => m.id === msg.id);
        if (idxMsg !== -1) {
          messages[idxMsg].status = "accepted";
          localStorage.setItem("reware_messages", JSON.stringify(messages));
          // Notify receiver (store notification in localStorage)
          let notifs = JSON.parse(
            localStorage.getItem("reware_notifications") || "[]"
          );
          notifs.push({
            to: msg.receiver.email,
            message: `Your request for '${msg.cloth.name}' has been accepted by ${user.name}. The donor will contact you soon.`,
            timestamp: new Date().toISOString(),
            type: "accepted",
          });
          localStorage.setItem("reware_notifications", JSON.stringify(notifs));
          loadMessages();
        }
      };
      // Decline button
      card.querySelector(".decline-btn").onclick = function () {
        let messages = JSON.parse(
          localStorage.getItem("reware_messages") || "[]"
        );
        let idxMsg = messages.findIndex((m) => m.id === msg.id);
        if (idxMsg !== -1) {
          messages[idxMsg].status = "declined";
          localStorage.setItem("reware_messages", JSON.stringify(messages));
          // Notify receiver (store notification in localStorage)
          let notifs = JSON.parse(
            localStorage.getItem("reware_notifications") || "[]"
          );
          notifs.push({
            to: msg.receiver.email,
            message: `Your request for '${msg.cloth.name}' was declined by ${user.name}.`,
            timestamp: new Date().toISOString(),
            type: "declined",
          });
          localStorage.setItem("reware_notifications", JSON.stringify(notifs));
          // Remove from donor's view immediately
          messages.splice(idxMsg, 1);
          localStorage.setItem("reware_messages", JSON.stringify(messages));
          loadMessages();
        }
      };
    }
    // Donated button
    if (msg.status === "accepted") {
      card.querySelector(".donated-btn").onclick = function () {
        // Remove cloth from Browse (reware_donations)
        let allDonations = JSON.parse(
          localStorage.getItem("reware_donations") || "[]"
        );
        allDonations = allDonations.filter(
          (item) =>
            !(
              item.donor &&
              item.donor.email === msg.donorEmail &&
              item.name === msg.cloth.name &&
              item.size === msg.cloth.size
            )
        );
        localStorage.setItem("reware_donations", JSON.stringify(allDonations));
        window.dispatchEvent(new Event("reware_donations_updated"));
        // Remove message
        let messages = JSON.parse(
          localStorage.getItem("reware_messages") || "[]"
        );
        messages = messages.filter((m) => m.id !== msg.id);
        localStorage.setItem("reware_messages", JSON.stringify(messages));
        // Optionally show a toast
        alert(
          "Donation marked as complete. Thank you for making a difference!"
        );
        loadMessages();
      };
    }
    messagesList.appendChild(card);
  });
}

function renderSentMessages() {
  let messages = JSON.parse(localStorage.getItem("reware_messages") || "[]");
  let mySent = messages.filter(
    (msg) =>
      msg.receiver &&
      msg.receiver.email &&
      msg.receiver.email.trim().toLowerCase() ===
        user.email.trim().toLowerCase()
  );
  messagesList.innerHTML = "";
  if (!mySent.length) {
    messagesList.innerHTML =
      '<p style="text-align:center;font-size:1.1rem;">No requests sent yet.</p>';
    return;
  }
  mySent.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  mySent.forEach((msg, idx) => {
    const card = document.createElement("div");
    card.className = "message-card fadeIn";
    let statusMsg = "";
    let closeBtn = "";
    if (msg.status === "pending") {
      statusMsg = `You requested <b>${msg.cloth.name}</b> donated by <b>${
        msg.donorName || msg.donorEmail
      }</b>.`;
    } else if (msg.status === "accepted") {
      statusMsg = `Your request for <b>${
        msg.cloth.name
      }</b> has been <span style='color:#22c55e;font-weight:600;'>accepted</span> by <b>${
        msg.donorName || msg.donorEmail
      }</b>. The donor will contact you shortly.`;
    } else if (msg.status === "declined") {
      statusMsg = `Your request for <b>${
        msg.cloth.name
      }</b> has been <span style='color:#ef4444;font-weight:600;'>declined</span> by <b>${
        msg.donorName || msg.donorEmail
      }</b>. You may try requesting other cloths.`;
      closeBtn = `<button class="close-x-btn" title="Remove" style="position:absolute;top:10px;right:14px;background:none;border:none;font-size:1.3em;color:#ef4444;cursor:pointer;">&times;</button>`;
    }
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:1.5rem;position:relative;">
        <img src="${
          msg.cloth.imgData || "assets/images/placeholder.png"
        }" class="cloth-img" alt="Cloth Image" style="max-width:80px;max-height:80px;border-radius:1rem;box-shadow:0 2px 8px rgba(59,130,246,0.10);">
        <div style="flex:1;">
          <div class="meta">${statusMsg}</div>
          <div class="meta">Requested at: ${new Date(
            msg.timestamp
          ).toLocaleString()}</div>
        </div>
        ${closeBtn}
      </div>
    `;
    // X close button for declined
    if (msg.status === "declined" && card.querySelector(".close-x-btn")) {
      card.querySelector(".close-x-btn").onclick = function () {
        let messages = JSON.parse(
          localStorage.getItem("reware_messages") || "[]"
        );
        messages = messages.filter((m) => m.id !== msg.id);
        localStorage.setItem("reware_messages", JSON.stringify(messages));
        renderSentMessages();
      };
    }
    messagesList.appendChild(card);
  });
}

function loadMessages() {
  if (!user) {
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

window.addEventListener("DOMContentLoaded", loadMessages);
window.addEventListener("reware_messages_updated", loadMessages);
