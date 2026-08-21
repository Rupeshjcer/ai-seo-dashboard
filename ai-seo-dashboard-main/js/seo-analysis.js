/**
 * AI SEO Growth Dashboard - SEO Analysis JS
 */

document.addEventListener('DOMContentLoaded', () => {
    loadHistoricalData();
    
    const projectSelect = document.getElementById('projectSelect');
    if(projectSelect) {
        projectSelect.addEventListener('change', () => {
            // Trigger animation or reloading logic here
            loadHistoricalData();
        });
    }
});

async function loadHistoricalData() {
    try {
        // We fetch the history from the existing backend
        const response = await fetchAPI('/history');
        
        const data = response.success ? response.data : [];
        if (data.length === 0) {
            showNotification("Run a website audit to build SEO history.", "info");
            return;
        }

        renderCharts(data.reverse()); // Reverse to show oldest to newest left to right
        
    } catch (error) {
        console.error("Failed to load historical data", error);
        showNotification("Failed to load analytics data", "danger");
    }
}

function renderCharts(data) {
    if (typeof ChartFactory === 'undefined') return;

    const labels = data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const seoScores = data.map(d => d.seo_score);
    const contentScores = data.map(d => d.content_score);
    const healthScores = data.map(d => d.health_score);

    // Destroy existing charts if any (to prevent overlap on reload)
    const existingHist = Chart.getChart("historicalChart");
    if(existingHist) existingHist.destroy();
    
    const existingBreak = Chart.getChart("breakdownChart");
    if(existingBreak) existingBreak.destroy();

    // Line Chart
    ChartFactory.createTrendChart('historicalChart', labels, [
        { label: 'Overall SEO', data: seoScores, color: '#4F46E5' },
        { label: 'Content Score', data: contentScores, color: '#06B6D4' },
        { label: 'Technical Health', data: healthScores, color: '#22C55E' }
    ]);

    // Bar Chart
    ChartFactory.createBarChart('breakdownChart', 
        ['SEO Score', 'Content', 'Health', 'Performance', 'Accessibility'],
        [seoScores[seoScores.length-1], contentScores[contentScores.length-1], healthScores[healthScores.length-1], 88, 92],
        'Latest Metrics'
    );
}
