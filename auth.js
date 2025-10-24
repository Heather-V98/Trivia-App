
// --- DOM elements ---
const signInBtn = document.getElementById("signInBtn");
const registerBtn = document.getElementById("registerBtn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

// --- Event Listeners ---
if (signInBtn) signInBtn.addEventListener("click", handleSignIn);
if (registerBtn) registerBtn.addEventListener("click", handleRegister);

// --- Sign In ---
function handleSignIn() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  const storedUser = JSON.parse(localStorage.getItem(username));

  if (storedUser && storedUser.password === password) {
    localStorage.setItem("currentUser", username);
    alert(`Welcome back, ${username}!`);
    // ✅ Go to setup page to choose quiz options
    window.location.href = "setup.html";
  } else {
    alert("Invalid username or password.");
  }
}

// --- Register ---
function handleRegister() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  if (localStorage.getItem(username)) {
    alert("That username already exists. Please choose another.");
    return;
  }

  // Save user
  localStorage.setItem(username, JSON.stringify({ username, password }));
  localStorage.setItem("currentUser", username);
  alert(`Account created! Welcome, ${username}.`);
  // ✅ Go straight to setup page
  window.location.href = "setup.html";
}

// --- Redirect Guard ---
// If user is already logged in, skip login page
document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("currentUser");
  if (currentUser) {
    // ✅ Send logged-in users to setup directly
    window.location.href = "setup.html";
  }
});

  