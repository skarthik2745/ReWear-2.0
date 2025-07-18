// Populate number of clothes dropdown
const numClothesSelect = document.getElementById("numClothes");
for (let i = 1; i <= 15; i++) {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = i;
  numClothesSelect.appendChild(opt);
}

const clothesDetailsDiv = document.getElementById("clothesDetails");
const donorInfoDiv = document.getElementById("donorInfo"); // will be null now
const submitBtn = document.querySelector('button[type="submit"]');
const successMsg = document.getElementById("successMsg");

let currentClothes = [];

numClothesSelect.addEventListener("change", function () {
  clothesDetailsDiv.innerHTML = "";
  currentClothes = [];
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
      <div class="form-group"><label>Name</label><input type="text" name="clothName${i}" required></div>
      <div class="form-group"><label>Category</label>
        <select name="clothCategory${i}" required>
          <option value="">Select</option>
          <option>Male</option><option>Female</option><option>Kids</option><option>Others</option>
        </select>
      </div>
      <div class="form-group"><label>Condition</label>
        <select name="clothCondition${i}" required>
          <option value="">Select</option>
          <option>Excellent (Freshly Washed, Almost New)</option>
          <option>Good (Gently Used, No Damage)</option>
          <option>Usable (Minor Fading or Shrink)</option>
          <option>Repairable (Needs Stitching or Small Fix)</option>
          <option>Vintage (Old but Classic)</option>
        </select>
      </div>
      <div class="form-group"><label>Size</label><input type="text" name="clothSize${i}" required placeholder="S, M, L, XL, etc."></div>
      <div class="form-group"><label>Upload Image</label><input type="file" accept="image/*" name="clothImg${i}" required><img class="img-preview" style="display:none;max-width:100px;margin-top:8px;border-radius:1rem;box-shadow:0 2px 8px rgba(59,130,246,0.10);" /></div>
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

// Handle form submission
const donationForm = document.getElementById("donationForm");
donationForm.addEventListener("submit", function (e) {
  e.preventDefault();
  // Check if user is logged in
  const user = JSON.parse(localStorage.getItem("loggedInUser") || "null");
  if (!user) {
    alert("You must be logged in to donate.");
    window.location.href = "login.html";
    return;
  }
  const num = parseInt(numClothesSelect.value);
  if (!num) return;
  let clothesArr = [];
  for (let i = 0; i < num; i++) {
    const name = donationForm[`clothName${i}`].value.trim();
    const category = donationForm[`clothCategory${i}`].value;
    const condition = donationForm[`clothCondition${i}`].value;
    const size = donationForm[`clothSize${i}`].value.trim();
    const imgInput = donationForm[`clothImg${i}`];
    let imgData = "";
    if (imgInput.files[0]) {
      imgData = imgInput.parentElement.querySelector(".img-preview").src;
    }
    clothesArr.push({ name, category, condition, size, imgData });
  }
  // Donor info from logged-in user
  const donor = {
    name: user.name,
    email: (user.email || "").trim().toLowerCase(),
    phone: user.phone,
    address: user.address,
  };
  // Save to localStorage
  let allDonations = JSON.parse(
    localStorage.getItem("reware_donations") || "[]"
  );
  clothesArr.forEach((item) => {
    item.donor = donor;
    item.donatedBy = donor.email; // Add reliable user identifier
    allDonations.push(item);
  });
  localStorage.setItem("reware_donations", JSON.stringify(allDonations));
  // Fire a custom event for other tabs/pages to refresh
  window.dispatchEvent(new Event("reware_donations_updated"));
  // Success message
  successMsg.textContent = "Thanks for donating! 🎉 Clothes have been added.";
  donationForm.reset();
  clothesDetailsDiv.innerHTML = "";
  submitBtn.style.display = "none";
  setTimeout(() => {
    successMsg.textContent = "";
  }, 4000);
});
