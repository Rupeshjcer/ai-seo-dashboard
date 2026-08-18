/**
 * AI SEO Growth Dashboard - Settings JS
 */

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('saveSettingsBtn').addEventListener('click', function() {
        const btn = this;
        const originalText = btn.innerHTML;
        
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
        
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = originalText;
            showNotification("Settings saved successfully!", "success");
        }, 800);
    });
    
    // Auto-update tab styling
    const triggerTabList = document.querySelectorAll('.list-group-item[data-bs-toggle="list"]');
    triggerTabList.forEach(triggerEl => {
      triggerEl.addEventListener('click', function (event) {
        event.preventDefault();
        
        // Remove active class from all
        triggerTabList.forEach(el => {
            el.classList.remove('active', 'border-primary', 'text-primary');
            el.classList.add('border-secondary', 'text-light');
        });
        
        // Add active styling to clicked
        this.classList.remove('border-secondary', 'text-light');
        this.classList.add('active', 'border-primary', 'text-primary');
        
        const tabTrigger = new bootstrap.Tab(this);
        tabTrigger.show();
      });
    });
});
