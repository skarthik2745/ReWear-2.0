document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const loginInput = document
    .getElementById("loginEmail")
    .value.trim()
    .toLowerCase();
  const password = document.getElementById("loginPassword").value;
  let users = JSON.parse(localStorage.getItem("users") || "[]");
  const user = users.find(
    (u) =>
      (u.email === loginInput || u.name.toLowerCase() === loginInput) &&
      u.password === password
  );
  if (!user) {
    alert("Invalid credentials. Please try again.");
    return;
  }
  localStorage.setItem("loggedInUser", JSON.stringify(user));
  window.location.href = "index.html";
});
