// Toggle Password Visibility
function togglePassword() {
    const passwordInput = document.getElementById("password");
    const eyeIcon = document.getElementById("eyeIcon");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        eyeIcon.classList.remove("bi-eye");
        eyeIcon.classList.add("bi-eye-slash");
    } else {
        passwordInput.type = "password";
        eyeIcon.classList.remove("bi-eye-slash");
        eyeIcon.classList.add("bi-eye");
    }
}

// Login Logic
document.getElementById("loginBtn").addEventListener("click", async function () {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("password").value;
    const btn = this;

    if (email === "" || password === "") {
        alert("Please enter both email and password.");
        return;
    }

    // Show loading state
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Signing in...';
    btn.disabled = true;

    try {
        const response = await fetch("http://127.0.0.1:5000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem("user_id", result.user_id);
            localStorage.setItem("fullname", result.fullname);
            // Optional: store auth token if implemented later
            
            // Success animation
            btn.innerHTML = '<i class="bi bi-check2-circle me-2"></i>Success!';
            btn.classList.add('bg-success');
            
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 800);
        } else {
            alert(result.message);
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    } catch (error) {
        console.error(error);
        alert("Cannot connect to server. Ensure Flask backend is running.");
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
});

// Add 'Enter' key support
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('loginBtn').click();
    }
});