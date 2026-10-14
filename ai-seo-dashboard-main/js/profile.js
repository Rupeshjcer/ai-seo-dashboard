/**
 * AI SEO Growth Dashboard - Profile JS
 */

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem("user_id");
    let fullname = localStorage.getItem("fullname") || "";
    let email = localStorage.getItem("email") || "";

    function renderProfile(name, mail) {
        const profileNameEl = document.getElementById('profileName');
        if (profileNameEl) profileNameEl.innerText = name || '';

        const editNameEl = document.getElementById('editName');
        if (editNameEl) {
            editNameEl.value = name || '';
            if (name) editNameEl.placeholder = name;
        }

        const profileEmailEl = document.getElementById('profileEmail');
        if (profileEmailEl) profileEmailEl.innerText = mail || '';

        const editEmailEl = document.getElementById('editEmail');
        if (editEmailEl) {
            editEmailEl.value = mail || '';
            if (mail) editEmailEl.placeholder = mail;
        }

        const largeAvatarEl = document.getElementById('largeAvatar');
        if (largeAvatarEl) {
            const initials = (name || '').trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase() || (name || '').trim().charAt(0).toUpperCase();
            largeAvatarEl.textContent = initials;
        }

        if (name) {
            const namePills = document.querySelectorAll('.user-name-text, #userNamePill, #userNameDisplay, #userNameGreeting');
            namePills.forEach(el => { el.textContent = name; });

            const firstInitial = name.trim().charAt(0).toUpperCase();
            const avatarPills = document.querySelectorAll('.user-avatar-purple, #userAvatarPill, .user-avatar');
            avatarPills.forEach(el => { el.textContent = firstInitial; });
        }
    }

    // 1. Initial display from active session
    if (fullname || email) {
        renderProfile(fullname, email);
    }

    // 2. Fetch fresh user details from database via backend API
    if (userId) {
        try {
            const res = await fetch(`http://127.0.0.1:5000/profile?user_id=${userId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    if (data.fullname) {
                        fullname = data.fullname;
                        localStorage.setItem("fullname", fullname);
                    }
                    if (data.email) {
                        email = data.email;
                        localStorage.setItem("email", email);
                    }
                    renderProfile(fullname, email);
                }
            }
        } catch (err) {
            console.warn("Could not retrieve profile from backend:", err);
        }
    }

    // Tab Styling
    const triggerTabList = document.querySelectorAll('#profileTabs .nav-link');
    triggerTabList.forEach(triggerEl => {
        triggerEl.addEventListener('click', function (event) {
            event.preventDefault();
            
            triggerTabList.forEach(el => {
                el.classList.remove('active', 'text-primary', 'border-bottom', 'border-primary', 'border-2');
                el.classList.add('text-muted');
            });
            
            this.classList.remove('text-muted');
            this.classList.add('active', 'text-primary', 'border-bottom', 'border-primary', 'border-2');
            
            const tabTrigger = new bootstrap.Tab(this);
            tabTrigger.show();
        });
    });

    // Save Profile (Personal Info)
    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async function() {
            const btn = this;
            const newName = document.getElementById('editName').value.trim();

            if (!newName) {
                if (typeof showNotification === 'function') {
                    showNotification("Please enter a valid full name.", "warning");
                } else {
                    alert("Please enter a valid full name.");
                }
                return;
            }

            const originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

            try {
                if (userId) {
                    const response = await fetch("http://127.0.0.1:5000/update_profile", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ user_id: userId, fullname: newName })
                    });
                    const res = await response.json();
                    if (!res.success) {
                        throw new Error(res.message || "Failed to update profile");
                    }
                }

                localStorage.setItem("fullname", newName);
                fullname = newName;
                renderProfile(newName, email);

                if (typeof showNotification === 'function') {
                    showNotification("Profile updated successfully!", "success");
                } else {
                    alert("Profile updated successfully!");
                }
            } catch (err) {
                console.error(err);
                if (typeof showNotification === 'function') {
                    showNotification(err.message || "Failed to save profile changes.", "danger");
                } else {
                    alert(err.message || "Failed to save profile changes.");
                }
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        });
    }

    // Change Password (Security Tab)
    const updatePwdBtn = document.getElementById('updatePasswordBtn');
    if (updatePwdBtn) {
        updatePwdBtn.addEventListener('click', async function() {
            const btn = this;
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!currentPassword) {
                if (typeof showNotification === 'function') {
                    showNotification("Please enter your current password.", "warning");
                } else {
                    alert("Please enter your current password.");
                }
                document.getElementById('currentPassword').focus();
                return;
            }

            if (!newPassword) {
                if (typeof showNotification === 'function') {
                    showNotification("Please enter a new password.", "warning");
                } else {
                    alert("Please enter a new password.");
                }
                document.getElementById('newPassword').focus();
                return;
            }

            if (newPassword.length < 4) {
                if (typeof showNotification === 'function') {
                    showNotification("New password must be at least 4 characters long.", "warning");
                } else {
                    alert("New password must be at least 4 characters long.");
                }
                document.getElementById('newPassword').focus();
                return;
            }

            if (newPassword !== confirmPassword) {
                if (typeof showNotification === 'function') {
                    showNotification("New password and confirmation do not match.", "warning");
                } else {
                    alert("New password and confirmation do not match.");
                }
                document.getElementById('confirmPassword').focus();
                return;
            }

            if (currentPassword === newPassword) {
                if (typeof showNotification === 'function') {
                    showNotification("New password must be different from current password.", "warning");
                } else {
                    alert("New password must be different from current password.");
                }
                document.getElementById('newPassword').focus();
                return;
            }

            const originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';

            try {
                const response = await fetch("http://127.0.0.1:5000/change_password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: userId,
                        current_password: currentPassword,
                        new_password: newPassword,
                        confirm_password: confirmPassword
                    })
                });

                const res = await response.json();
                if (!res.success) {
                    throw new Error(res.message || "Failed to update password");
                }

                // Clear password fields on success
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';

                if (typeof showNotification === 'function') {
                    showNotification(res.message || "Password updated successfully!", "success");
                } else {
                    alert(res.message || "Password updated successfully!");
                }
            } catch (err) {
                console.error(err);
                if (typeof showNotification === 'function') {
                    showNotification(err.message || "Failed to update password.", "danger");
                } else {
                    alert(err.message || "Failed to update password.");
                }
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        });
    }

    // Support Enter key submission in password form
    const pwdForm = document.getElementById('changePasswordForm');
    if (pwdForm) {
        pwdForm.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('updatePasswordBtn')?.click();
            }
        });
    }
});
