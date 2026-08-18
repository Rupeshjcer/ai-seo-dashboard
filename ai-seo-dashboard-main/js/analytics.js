/**
 * AI SEO Growth Dashboard - Analytics JS
 */

document.addEventListener('DOMContentLoaded', () => {
    renderCharts();
    
    document.getElementById('timeRange').addEventListener('change', function() {
        // Mock updating data based on time range
        const days = parseInt(this.value);
        updateData(days);
    });
});

function renderCharts() {
    if (typeof ChartFactory === 'undefined') return;

    // Line Chart
    const labels = Array.from({length: 30}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Generate organic looking data
    let base = 500;
    const clicks = Array.from({length: 30}, () => {
        base = base + (Math.random() * 100 - 40);
        return Math.floor(base);
    });

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
    showNotification(`Loading data for the last ${days} days...`, "info");
    
    // Update chart with new data array length
    const chart = Chart.getChart('trafficChart');
    if (chart) {
        const labels = Array.from({length: days}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - ((days-1) - i));
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        let base = 500;
        const clicks = Array.from({length: days}, () => {
            base = base + (Math.random() * 100 - 40);
            return Math.floor(base);
        });

        chart.data.labels = labels;
        chart.data.datasets[0].data = clicks;
        chart.update();
    }
}
