document.addEventListener('DOMContentLoaded', async () => {
    let fullname = localStorage.getItem('fullname');
    const userId = localStorage.getItem('user_id');

    function updatePills(name) {
        if (!name) return;
        const namePills = document.querySelectorAll('.user-name-text, #userNamePill, #userNameDisplay, #userNameGreeting');
        namePills.forEach(el => {
            el.textContent = name;
        });

        const initial = name.trim().charAt(0).toUpperCase();
        const avatarPills = document.querySelectorAll('.user-avatar-purple, #userAvatarPill, .user-avatar');
        avatarPills.forEach(el => {
            el.textContent = initial;
        });
    }

    if (fullname) {
        updatePills(fullname);
    }

    // Synchronize with database if userId exists
    if (userId) {
        try {
            const res = await fetch(`http://127.0.0.1:5000/profile?user_id=${userId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.fullname) {
                    localStorage.setItem('fullname', data.fullname);
                    if (data.email) {
                        localStorage.setItem('email', data.email);
                    }
                    updatePills(data.fullname);
                }
            }
        } catch (e) {
            // Fallback to local session storage
        }
    }
});
