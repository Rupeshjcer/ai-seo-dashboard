/**
 * AI SEO Growth Dashboard - Help JS
 */

document.addEventListener('DOMContentLoaded', () => {
    // Simple search interaction for the help page
    const searchInput = document.querySelector('.search-input');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim() !== '') {
                showNotification(`Searching documentation for "${this.value}"...`, "info");
                // In a real app, this would redirect to a search results page or filter the current view
                
                setTimeout(() => {
                    this.value = '';
                }, 1000);
            }
        });
    }
});
