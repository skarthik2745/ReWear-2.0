document
  .getElementById("registerForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const email = document
      .getElementById("regEmail")
      .value.trim()
      .toLowerCase();
    const phone = document.getElementById("regPhone").value.trim();
    const address = document.getElementById("regAddress").value.trim();
    const dob = document.getElementById("regDob").value;
    const password = document.getElementById("regPassword").value;

    let users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.some((u) => u.email === email)) {
      alert("An account with this email already exists.");
      return;
    }
    users.push({ name, email, phone, address, dob, password });
    localStorage.setItem("users", JSON.stringify(users));
    alert("Registration successful! Please login.");
    window.location.href = "login.html";
  });
