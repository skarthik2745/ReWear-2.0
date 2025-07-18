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

function loadDonations() {
  allDonations = JSON.parse(localStorage.getItem("reware_donations") || "[]");
}

function filterDonations() {
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
    // Condition
    if (filterCondition.value && item.condition !== filterCondition.value)
      return false;
    // Location (address)
    if (
      filterLocation.value &&
      (!item.donor ||
        !item.donor.address
          .toLowerCase()
          .includes(filterLocation.value.toLowerCase()))
    )
      return false;
    return true;
  });
  return filtered;
}

function renderClothes() {
  clothesGrid.innerHTML = "";
  let filtered = filterDonations();
  if (!filtered.length) {
    clothesGrid.innerHTML =
      '<p style="text-align:center;font-size:1.2rem;">No clothes available yet. Be the first to donate!</p>';
    return;
  }
  filtered.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "cloth-card fadeIn";
    card.innerHTML = `
      <img src="${
        item.imgData || "assets/images/placeholder.png"
      }" class="cloth-img" alt="Cloth Image">
      <div class="cloth-info">
        <h3>${item.name}</h3>
        <div class="meta">Category: ${item.category}</div>
        <div class="meta">Size: ${item.size}</div>
        <div class="meta">Condition: ${item.condition}</div>
      </div>
    `;
    card.addEventListener("click", () => showModal(item));
    clothesGrid.appendChild(card);
  });
}

function showModal(item) {
  // Get logged-in user
  const user = JSON.parse(localStorage.getItem("loggedInUser") || "null");
  // Only show Request button if user is logged in and not the donor
  let showRequestBtn = false;
  if (
    user &&
    user.email &&
    item.donor &&
    item.donor.email &&
    user.email.trim().toLowerCase() !== item.donor.email.trim().toLowerCase()
  ) {
    showRequestBtn = true;
  }
  modalDetails.innerHTML = `
    <div class="modal-left">
      <div class="modal-section">
        <div class="section-title">Cloth Info</div>
        <h2>${item.name}</h2>
        <p><b>Category:</b> ${item.category}</p>
        <p><b>Condition:</b> ${item.condition}</p>
        <p><b>Size:</b> ${item.size}</p>
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
      // Prevent duplicate requests
      let messages = JSON.parse(
        localStorage.getItem("reware_messages") || "[]"
      );
      const alreadyRequested = messages.some(
        (msg) =>
          msg.clothId ===
            item.name + "_" + item.size + "_" + item.donor.email &&
          msg.receiver &&
          msg.receiver.email === user.email
      );
      if (alreadyRequested) {
        alert("You have already requested this cloth.");
        return;
      }
      // Build message
      const message = {
        id: Date.now() + "_" + Math.random().toString(36).slice(2),
        donorEmail: item.donor.email,
        receiver: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
        },
        cloth: {
          name: item.name,
          imgData: item.imgData,
          size: item.size,
          category: item.category,
          condition: item.condition,
        },
        clothId: item.name + "_" + item.size + "_" + item.donor.email,
        timestamp: new Date().toISOString(),
        status: "pending",
      };
      messages.push(message);
      localStorage.setItem("reware_messages", JSON.stringify(messages));
      alert("Your request has been sent to the donor!");
      modal.style.display = "none";
    };
  }
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

window.addEventListener("DOMContentLoaded", () => {
  loadDonations();
  renderClothes();
});
window.addEventListener("reware_donations_updated", () => {
  loadDonations();
  renderClothes();
});
