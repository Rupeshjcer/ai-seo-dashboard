/**
 * AI SEO Growth Dashboard - SEO Analysis JS
 * Renders historical SEO trend charts and metrics breakdown from audit history.
 */

document.addEventListener('DOMContentLoaded', () => {
    loadHistoricalData();

    const projectSelect = document.getElementById('projectSelect');
    if (projectSelect) {
        projectSelect.addEventListener('change', () => {
            loadHistoricalData();
        });
    }
});

async function loadHistoricalData() {
    try {
        const response = await fetchAPI('/history');
        const data = response.success ? response.data : [];

        if (data.length === 0) {
            showNotification("Run a website audit to build SEO history.", "info");
            renderPlaceholderCharts();
            return;
        }

        // Reverse so oldest is on the left
        const sorted = [...data].reverse();
        renderCharts(sorted);
        updateScoreCards(sorted);

    } catch (error) {
        console.error("Failed to load historical data", error);
        showNotification("Failed to load analytics data. Is the backend running?", "danger");
        renderPlaceholderCharts();
    }
}

function updateScoreCards(data) {
    if (!data || data.length === 0) return;

    // Calculate averages
    const avgSeo = Math.round(data.reduce((sum, d) => sum + (d.seo_score || 0), 0) / data.length);
    const avgHealth = Math.round(data.reduce((sum, d) => sum + (d.health_score || 0), 0) / data.length);
    const avgContent = Math.round(data.reduce((sum, d) => sum + (d.content_score || 0), 0) / data.length);

    // Compare last two entries for trend
    const latest = data[data.length - 1];
    const previous = data.length > 1 ? data[data.length - 2] : null;

    const seoDiff = previous ? (latest.seo_score - previous.seo_score) : 0;
    const healthDiff = previous ? (latest.health_score - previous.health_score) : 0;

    const updateCard = (id, scoreId, value, diff) => {
        const scoreEl = document.getElementById(scoreId);
        if (scoreEl) {
            scoreEl.style.setProperty('--score', value);
            scoreEl.querySelector('.score-value').textContent = value;
        }
        const trendEl = document.getElementById(id);
        if (trendEl && diff !== 0) {
            const cls = diff > 0 ? 'text-success' : 'text-danger';
            const icon = diff > 0 ? 'bi-arrow-up' : 'bi-arrow-down';
            trendEl.innerHTML = `<i class="bi ${icon}"></i> ${diff > 0 ? '+' : ''}${diff} pts`;
            trendEl.className = trendEl.className.replace(/text-\w+/, '') + ' ' + cls;
        }
    };

    updateCard('seoTrend', 'seoMeter', avgSeo, seoDiff);
    updateCard('healthTrend', 'healthMeter', avgHealth, healthDiff);
}

function renderCharts(data) {
    if (typeof ChartFactory === 'undefined') return;

    const labels = data.map(d => {
        const date = new Date(d.date || d.created_at);
        return isNaN(date) ? d.date : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const seoScores = data.map(d => d.seo_score || 0);
    const contentScores = data.map(d => d.content_score || 0);
    const healthScores = data.map(d => d.health_score || 0);

    // Destroy existing charts to avoid duplicates
    ['breakdownChart'].forEach(id => {
        const existing = Chart.getChart(id);
        if (existing) existing.destroy();
    });

    // Bar Chart - Latest metrics breakdown
    const latestIdx = data.length - 1;
    ChartFactory.createBarChart('breakdownChart',
        ['SEO Score', 'Content', 'Health Score'],
        [seoScores[latestIdx], contentScores[latestIdx], healthScores[latestIdx]],
        'Latest Audit Metrics'
    );
}

/**
 * Render placeholder charts when no history data is available.
 */
function renderPlaceholderCharts() {
    if (typeof ChartFactory === 'undefined' || typeof Chart === 'undefined') return;

    ['breakdownChart'].forEach(id => {
        const existing = Chart.getChart(id);
        if (existing) existing.destroy();
    });

    ChartFactory.createBarChart('breakdownChart',
        ['SEO Score', 'Content', 'Health Score', 'Performance', 'Accessibility'],
        [82, 78, 91, 88, 92],
        'Sample Metrics'
    );
}
