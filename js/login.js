const form = document.getElementById("loginForm");
const msg = document.getElementById("loginMsg");

function isEmail(input) {
  // Simple email validation
  return /.+@.+\..+/.test(input);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const loginInput = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // Basic validation
  if (!loginInput || !password) {
    msg.style.color = "#d32f2f";
    msg.textContent = "Please enter your email/full name and password.";
    return;
  }
  if (password.length < 6) {
    msg.style.color = "#d32f2f";
    msg.textContent = "Password must be at least 6 characters.";
    return;
  }

  msg.style.color = "#333";
  msg.textContent = "Logging in...";

  let emailToUse = loginInput;

  if (!isEmail(loginInput)) {
    // Lookup by full name in database
    try {
      const snapshot = await db.ref("users").get();
      if (snapshot.exists()) {
        let found = false;
        snapshot.forEach((childSnap) => {
          const user = childSnap.val();
          if (
            user.name &&
            user.name.toLowerCase() === loginInput.toLowerCase()
          ) {
            emailToUse = user.email;
            found = true;
          }
        });
        if (!found) {
          msg.style.color = "#d32f2f";
          msg.textContent = "No user found with that name.";
          return;
        }
      } else {
        msg.style.color = "#d32f2f";
        msg.textContent = "No users found.";
        return;
      }
    } catch (err) {
      msg.style.color = "#d32f2f";
      msg.textContent = "Error looking up user.";
      return;
    }
  }

  try {
    await auth.signInWithEmailAndPassword(emailToUse, password);
    msg.style.color = "#388e3c";
    msg.textContent = "Login successful! Redirecting...";
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } catch (error) {
    msg.style.color = "#d32f2f";
    msg.textContent = "Invalid login credentials.";
  }
});
