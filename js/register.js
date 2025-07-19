const form = document.getElementById("registerForm");
const msg = document.getElementById("registerMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const dob = document.getElementById("dob").value;
  const password = document.getElementById("password").value;

  // Basic validation
  if (!name || !email || !phone || !address || !dob || !password) {
    msg.style.color = "#d32f2f";
    msg.textContent = "Please fill in all fields.";
    return;
  }
  if (password.length < 6) {
    msg.style.color = "#d32f2f";
    msg.textContent = "Password must be at least 6 characters.";
    return;
  }
  if (!/^\d{10,15}$/.test(phone)) {
    msg.style.color = "#d32f2f";
    msg.textContent = "Phone number must be 10-15 digits.";
    return;
  }

  msg.style.color = "#333";
  msg.textContent = "Registering...";

  try {
    // Create user in Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password
    );
    const user = userCredential.user;

    // Store all registration info in Realtime Database
    await db.ref("users/" + user.uid).set({
      name,
      email,
      phone,
      address,
      dob,
    });

    msg.style.color = "#388e3c";
    msg.textContent = "Registration successful! Redirecting to login...";
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  } catch (error) {
    msg.style.color = "#d32f2f";
    msg.textContent = error.message;
  }
});
