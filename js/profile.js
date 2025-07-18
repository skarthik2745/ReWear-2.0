// Profile info
const user = JSON.parse(localStorage.getItem("loggedInUser") || "null");
if (!user) {
  alert("You must be logged in to view your profile.");
  window.location.href = "login.html";
}
const profilePic = document.getElementById("profilePic");
const profilePicInput = document.getElementById("profilePicInput");
const editPicBtn = document.getElementById("editPicBtn");
const profileForm = document.getElementById("profileForm");
const nameInput = document.getElementById("profileName");
const emailInput = document.getElementById("profileEmail");
const phoneInput = document.getElementById("profilePhone");
const addressInput = document.getElementById("profileAddress");
const removePicBtn = document.getElementById("removePicBtn");

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

function loadProfile() {
  nameInput.value = user.name;
  emailInput.value = user.email;
  phoneInput.value = user.phone;
  addressInput.value = user.address;
  setProfilePicSrc(user.profilePic);
}
loadProfile();

if (editPicBtn) {
  editPicBtn.onclick = () => profilePicInput && profilePicInput.click();
}
if (profilePicInput) {
  profilePicInput.onchange = function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (ev) {
        profilePic.src = ev.target.result;
        user.profilePic = ev.target.result;
        localStorage.setItem("loggedInUser", JSON.stringify(user));
        let users = JSON.parse(localStorage.getItem("users") || "[]");
        users = users.map((u) =>
          u.email === user.email ? { ...u, profilePic: ev.target.result } : u
        );
        localStorage.setItem("users", JSON.stringify(users));
      };
      reader.readAsDataURL(file);
    }
  };
}
if (profileForm) {
  profileForm.onsubmit = function (e) {
    e.preventDefault();
    user.name = nameInput.value.trim();
    user.email = emailInput.value.trim();
    user.phone = phoneInput.value.trim();
    user.address = addressInput.value.trim();
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    let users = JSON.parse(localStorage.getItem("users") || "[]");
    users = users.map((u) => (u.email === user.email ? { ...u, ...user } : u));
    localStorage.setItem("users", JSON.stringify(users));
    alert("Profile updated!");
  };
}
if (removePicBtn) {
  removePicBtn.onclick = function () {
    setProfilePicSrc("");
    user.profilePic = "";
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    let users = JSON.parse(localStorage.getItem("users") || "[]");
    users = users.map((u) =>
      u.email === user.email ? { ...u, profilePic: "" } : u
    );
    localStorage.setItem("users", JSON.stringify(users));
  };
}

const userClothesGrid = document.getElementById("userClothesGrid");
let editClothIdx = null;
let editClothOriginalKey = null;
const editClothModal = document.getElementById("editClothModal");
const closeEditModal = document.getElementById("closeEditModal");
const editClothForm = document.getElementById("editClothForm");
const editClothName = document.getElementById("editClothName");
const editClothCategory = document.getElementById("editClothCategory");
const editClothCondition = document.getElementById("editClothCondition");
const editClothSize = document.getElementById("editClothSize");
const editClothImg = document.getElementById("editClothImg");
const editClothImgPreview = document.getElementById("editClothImgPreview");
let editClothImgData = "";
function openEditModal(item, idx) {
  editClothIdx = idx;
  editClothOriginalKey = {
    email: item.donor.email,
    name: item.name,
    size: item.size,
  };
  editClothName.value = item.name;
  editClothCategory.value = item.category;
  editClothCondition.value = item.condition;
  editClothSize.value = item.size;
  editClothImgPreview.src = item.imgData || "assets/images/placeholder.png";
  editClothImgData = item.imgData || "";
  editClothModal.style.display = "flex";
}
closeEditModal.onclick = function () {
  editClothModal.style.display = "none";
};
window.onclick = function (event) {
  if (event.target == editClothModal) {
    editClothModal.style.display = "none";
  }
};
editClothImg.onchange = function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (ev) {
      editClothImgPreview.src = ev.target.result;
      editClothImgData = ev.target.result;
    };
    reader.readAsDataURL(file);
  }
};
editClothForm.onsubmit = function (e) {
  e.preventDefault();
  let all = JSON.parse(localStorage.getItem("reware_donations") || "[]");
  let idxAll = all.findIndex(
    (x) =>
      x.donor &&
      x.donor.email === editClothOriginalKey.email &&
      x.name === editClothOriginalKey.name &&
      x.size === editClothOriginalKey.size
  );
  if (idxAll !== -1) {
    all[idxAll].name = editClothName.value.trim();
    all[idxAll].category = editClothCategory.value;
    all[idxAll].condition = editClothCondition.value;
    all[idxAll].size = editClothSize.value.trim();
    all[idxAll].imgData = editClothImgData;
    localStorage.setItem("reware_donations", JSON.stringify(all));
    window.dispatchEvent(new Event("reware_donations_updated"));
  }
  editClothModal.style.display = "none";
  loadUserClothes();
};

function loadUserClothes() {
  let all = JSON.parse(localStorage.getItem("reware_donations") || "[]");
  let userEmail = (user.email || "").trim().toLowerCase();
  let mine = all.filter(
    (item) =>
      item.donor &&
      typeof item.donor.email === "string" &&
      item.donor.email.trim().toLowerCase() === userEmail
  );
  userClothesGrid.innerHTML = "";
  if (!mine.length) {
    userClothesGrid.innerHTML =
      '<p style="text-align:center;font-size:1.1rem;">No donations yet.</p>';
    return;
  }
  mine.forEach((item, idx) => {
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
      <div style="margin-top:8px;display:flex;gap:8px;">
        <button class="main-btn edit-btn">Edit</button>
        <button class="main-btn delete-btn" style="background:#ef4444;">Delete</button>
      </div>
    `;
    card.querySelector(".edit-btn").onclick = function () {
      openEditModal(item, idx);
    };
    card.querySelector(".delete-btn").onclick = function () {
      if (confirm("Are you sure you want to permanently delete this cloth?")) {
        let all = JSON.parse(localStorage.getItem("reware_donations") || "[]");
        all = all.filter(
          (x) =>
            !(
              x.donor &&
              typeof x.donor.email === "string" &&
              x.donor.email.trim().toLowerCase() === userEmail &&
              x.name === item.name &&
              x.size === item.size
            )
        );
        localStorage.setItem("reware_donations", JSON.stringify(all));
        window.dispatchEvent(new Event("reware_donations_updated"));
        loadUserClothes();
      }
    };
    userClothesGrid.appendChild(card);
  });
}
window.addEventListener("reware_donations_updated", loadUserClothes);
loadUserClothes();

const style = document.createElement("style");
style.innerHTML = `
  .main-btn, .edit-btn, .delete-btn, #editPicBtn, #removePicBtn {
    transition: background-color 0.3s ease, color 0.3s ease !important;
    animation: none !important;
  }
`;
document.head.appendChild(style);
