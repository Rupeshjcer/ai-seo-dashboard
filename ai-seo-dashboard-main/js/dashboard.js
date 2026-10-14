/**
 * AI SEO Growth Dashboard - Overview Dashboard JS
 */

document.addEventListener('DOMContentLoaded', () => {


    // Initialize Charts
    
    // Load Data
    loadDashboardStats();
    
});

async function loadDashboardStats() {
    try {
        const response = await fetch('http://127.0.0.1:5000/stats');
        const result = await response.json();
        if (!result.success) return;

        const stats = result.data;
        const values = {
            averageSeo: stats.average_seo,
            auditCount: stats.audit_count,
            averageContent: stats.average_content,
            averageHealth: stats.average_health
        };

        Object.entries(values).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (!element) return;
            element.dataset.target = value;
            element.textContent = value;
        });
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

