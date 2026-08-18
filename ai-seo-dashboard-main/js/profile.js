/**
 * AI SEO Growth Dashboard - Profile JS
 */

document.addEventListener('DOMContentLoaded', () => {
    // Populate profile from localStorage
    const fullname = localStorage.getItem("fullname") || "Admin User";
    
    document.getElementById('profileName').innerText = fullname;
    document.getElementById('editName').value = fullname;
    
    // Initials
    const initials = fullname.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('largeAvatar').childNodes[0].nodeValue = initials;

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

    // Save Profile
    document.getElementById('saveProfileBtn').addEventListener('click', function() {
        const btn = this;
        const newName = document.getElementById('editName').value.trim();
        
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
        
        setTimeout(() => {
            if(newName) {
                localStorage.setItem("fullname", newName);
                document.getElementById('profileName').innerText = newName;
                document.getElementById('userNameDisplay').innerText = newName;
                
                const initials = newName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                document.getElementById('largeAvatar').childNodes[0].nodeValue = initials;
                
                // Update navbar avatar
                const navAvatar = document.querySelector('.user-avatar');
                if(navAvatar) navAvatar.innerText = initials;
            }
            
            btn.disabled = false;
            btn.innerHTML = 'Save Changes';
            showNotification("Profile updated successfully!", "success");
        }, 800);
    });
});
