/**
 * AI SEO Growth Dashboard - Analytics JS
 */

let analyticsHistory = [];

document.addEventListener('DOMContentLoaded', () => {
    loadAnalytics();
    
    document.getElementById('timeRange').addEventListener('change', function() {
        const days = parseInt(this.value);
        updateData(days);
    });
});

async function loadAnalytics() {
    try {
        const response = await fetch('http://127.0.0.1:5000/analytics');
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error('Analytics could not be loaded');
        analyticsHistory = result.data;
        renderCharts(analyticsHistory);
    } catch (error) {
        showNotification(error.message, 'danger');
    }
}

function renderCharts(history) {
    if (typeof ChartFactory === 'undefined') return;

    if (history.length === 0) {
        showNotification('Run a website audit to populate analytics.', 'info');
        return;
    }

    // Line Chart
    const labels = history.map(row => new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const clicks = history.map(row => row.audits);

    ChartFactory.createTrendChart('trafficChart', labels, [
        { label: 'Organic Clicks', data: clicks }
    ]);

    // Device Chart
    const colors = getChartColors();
    const ctx = document.getElementById('deviceChart');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Mobile', 'Desktop', 'Tablet'],
            datasets: [{
                data: [58, 35, 7],
                backgroundColor: [colors.primary, colors.secondary, colors.accent],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}

function updateData(days) {
    showNotification(`Showing the last ${days} days of saved audit data.`, "info");
    
    const chart = Chart.getChart('trafficChart');
    if (chart) {
        const cutoff = Date.now() - days * 86400000;
        const filtered = analyticsHistory.filter(row => new Date(row.date).getTime() >= cutoff);
        chart.data.labels = filtered.map(row => new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        chart.data.datasets[0].data = filtered.map(row => row.audits);
        chart.update();
    }
}
