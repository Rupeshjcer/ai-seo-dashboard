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

// Register Logic
document.getElementById("registerBtn").addEventListener("click", async function () {
    const fullname = document.getElementById("fullname").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const btn = this;

    if (fullname === "" || email === "" || password === "") {
        alert("Please fill all fields.");
        return;
    }

    // Show loading state
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Creating Account...';
    btn.disabled = true;

    try {
        const response = await fetch("http://127.0.0.1:5000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ fullname, email, password })
        });

        const result = await response.json();

        if (result.success) {
            // Success animation
            btn.innerHTML = '<i class="bi bi-check2-circle me-2"></i>Account Created!';
            btn.classList.add('bg-success');
            
            setTimeout(() => {
                alert("Registration successful! Please login.");
                window.location.href = "login.html";
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
        document.getElementById('registerBtn').click();
    }
});