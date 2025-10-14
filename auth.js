document.getElementById("signInBtn").addEventListener("click", () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
  
    const storedUser = JSON.parse(localStorage.getItem(username));
  
    if (storedUser && storedUser.password === password) {
      localStorage.setItem("currentUser", username);
      Swal.fire("Welcome back!", "Get ready to race!", "success").then(() => {
        window.location.href = "quiz.html";
      });
    } else {
      Swal.fire("Error", "Invalid credentials", "error");
    }
  });
  
  document.getElementById("registerBtn").addEventListener("click", () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
  
    if (localStorage.getItem(username)) {
      Swal.fire("Oops", "User already exists!", "warning");
    } else if (username && password) {
      localStorage.setItem(username, JSON.stringify({ username, password }));
      Swal.fire("Success", "Account created!", "success");
    } else {
      Swal.fire("Error", "Please fill out all fields", "error");
    }
  });
  