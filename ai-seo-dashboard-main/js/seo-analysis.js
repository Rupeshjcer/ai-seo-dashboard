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
        
        let data = [];
        if (response.success && response.data.length > 0) {
            data = response.data;
        } else {
            // Mock data if backend is empty
            data = [
                { date: new Date(Date.now() - 0).toISOString(), seo_score: 82, content_score: 75, health_score: 91 },
                { date: new Date(Date.now() - 86400000*7).toISOString(), seo_score: 78, content_score: 72, health_score: 85 },
                { date: new Date(Date.now() - 86400000*14).toISOString(), seo_score: 75, content_score: 70, health_score: 82 },
                { date: new Date(Date.now() - 86400000*21).toISOString(), seo_score: 70, content_score: 65, health_score: 75 },
                { date: new Date(Date.now() - 86400000*28).toISOString(), seo_score: 65, content_score: 60, health_score: 68 }
            ];
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
