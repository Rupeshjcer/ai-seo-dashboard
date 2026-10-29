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
    const userId = localStorage.getItem('user_id');
    const url = (userId && userId !== 'null' && userId !== 'undefined')
        ? `http://127.0.0.1:5000/analytics?user_id=${encodeURIComponent(userId)}`
        : 'http://127.0.0.1:5000/analytics';
    try {
        const response = await fetch(url);
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error('Analytics could not be loaded');
        analyticsHistory = result.data || [];
        renderCharts(analyticsHistory);
    } catch (error) {
        renderCharts([]);
    }
}

function renderCharts(history) {
    if (typeof ChartFactory === 'undefined') return;

    if (history.length === 0) {
        showNotification('Run a website audit to populate analytics.', 'info');
        return;
    }

    // Line Chart — real audit history
    const labels = history.map(row => new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const clicks = history.map(row => row.audits);

    ChartFactory.createTrendChart('trafficChart', labels, [
        { label: 'Audits per Day', data: clicks }
    ]);

    // Device Chart — no real device breakdown data available; show empty state
    const ctx = document.getElementById('deviceChart');
    if (ctx) {
        ctx.style.display = 'none';
        const parent = ctx.parentElement;
        if (!parent.querySelector('.no-device-data')) {
            const msg = document.createElement('div');
            msg.className = 'no-device-data text-center text-muted py-4 small';
            msg.innerHTML = '<i class="bi bi-pie-chart fs-3 d-block mb-2"></i>Device breakdown data not available.';
            parent.appendChild(msg);
        }
    }

    // Top Pages table — built from real audit history
    const tbody = document.getElementById('topPagesBody');
    if (tbody && history.length > 0) {
        tbody.innerHTML = history.slice(0, 5).map(row => {
            const url = row.url || row.date || 'Unknown';
            const auditCount = row.audits || 1;
            const avgSeo = Math.round(row.seo_score || 0);
            return `<tr>
                <td class="text-primary text-truncate" style="max-width: 150px;" title="${url}">${url}</td>
                <td>${auditCount}</td>
                <td>${avgSeo}</td>
            </tr>`;
        }).join('');
    }
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
