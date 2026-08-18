/**
 * AI SEO Growth Dashboard - Shared Chart Configuration
 * Manages Chart.js and ApexCharts themes to match the glassmorphism dark/light UI
 */

// ==========================================
// Chart.js Global Defaults
// ==========================================
const getChartColors = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    return {
        textColor: isDark ? '#94A3B8' : '#64748B', // text-secondary
        gridColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)',
        tooltipBg: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        tooltipText: isDark ? '#F8FAFC' : '#0F172A',
        primary: '#4F46E5',
        secondary: '#7C3AED',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        accent: '#06B6D4'
    };
};

function applyChartJsDefaults() {
    if (typeof Chart === 'undefined') return;

    const colors = getChartColors();

    Chart.defaults.color = colors.textColor;
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    // Tooltip Defaults
    Chart.defaults.plugins.tooltip.backgroundColor = colors.tooltipBg;
    Chart.defaults.plugins.tooltip.titleColor = colors.tooltipText;
    Chart.defaults.plugins.tooltip.bodyColor = colors.tooltipText;
    Chart.defaults.plugins.tooltip.borderColor = colors.gridColor;
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.displayColors = true;

    // Grid Defaults
    Chart.defaults.scale.grid.color = colors.gridColor;
    Chart.defaults.scale.grid.borderColor = colors.gridColor;
    
    // Animation Defaults
    Chart.defaults.animation.duration = 1000;
    Chart.defaults.animation.easing = 'easeOutQuart';
}

// Apply on load
applyChartJsDefaults();

// Listen for theme changes to update charts
window.addEventListener('themeChanged', () => {
    applyChartJsDefaults();
    
    // If there are any active Chart.js instances on the page, update them
    if (typeof Chart !== 'undefined') {
        Object.values(Chart.instances).forEach(chart => {
            chart.update();
        });
    }
});

// ==========================================
// Chart Factory Functions (Reusable)
// ==========================================

const ChartFactory = {
    
    /**
     * Creates a glowing line chart (good for traffic/trends)
     */
    createTrendChart: function(canvasId, labels, dataSets) {
        const ctx = document.getElementById(canvasId);
        if(!ctx) return null;

        const colors = getChartColors();
        
        // Map datasets to add styling
        const styledDatasets = dataSets.map((ds, index) => {
            const baseColor = ds.color || (index === 0 ? colors.primary : index === 1 ? colors.accent : colors.success);
            
            // Create gradient
            const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, `${baseColor}66`); // 40% opacity
            gradient.addColorStop(1, `${baseColor}00`); // 0% opacity

            return {
                label: ds.label,
                data: ds.data,
                borderColor: baseColor,
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: baseColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4 // Smooth curves
            };
        });

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: styledDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: { usePointStyle: true, boxWidth: 8 }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        border: { display: false }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false,
                }
            }
        });
    },

    /**
     * Creates a Doughnut chart (good for scores/distribution)
     */
    createScoreDoughnut: function(canvasId, label, value, colorType = 'primary') {
        const ctx = document.getElementById(canvasId);
        if(!ctx) return null;

        const colors = getChartColors();
        const mainColor = colors[colorType] || colors.primary;
        const trackColor = document.documentElement.getAttribute('data-theme') === 'dark' 
            ? 'rgba(255,255,255,0.05)' 
            : 'rgba(0,0,0,0.05)';

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [label, 'Remaining'],
                datasets: [{
                    data: [value, 100 - value],
                    backgroundColor: [mainColor, trackColor],
                    borderWidth: 0,
                    borderRadius: [10, 0],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '80%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        filter: function(tooltipItem) {
                            return tooltipItem.dataIndex === 0; // Only show tooltip for actual value
                        }
                    }
                }
            },
            plugins: [{
                // Plugin to draw text in center
                id: 'textCenter',
                beforeDraw: function(chart) {
                    var width = chart.width,
                        height = chart.height,
                        ctx = chart.ctx;

                    ctx.restore();
                    var fontSize = (height / 114).toFixed(2);
                    ctx.font = "bold " + fontSize + "em Inter";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = colors.textColor;

                    var text = chart.data.datasets[0].data[0] + "%",
                        textX = Math.round((width - ctx.measureText(text).width) / 2),
                        textY = height / 2;

                    ctx.fillText(text, textX, textY);
                    ctx.save();
                }
            }]
        });
    },

    /**
     * Creates a Bar chart (good for metrics comparison)
     */
    createBarChart: function(canvasId, labels, data, labelName) {
        const ctx = document.getElementById(canvasId);
        if(!ctx) return null;
        
        const colors = getChartColors();

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: labelName,
                    data: data,
                    backgroundColor: [
                        colors.primary,
                        colors.secondary,
                        colors.accent,
                        colors.success,
                        colors.warning
                    ],
                    borderRadius: 6,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { 
                        beginAtZero: true,
                        border: { display: false }
                    }
                }
            }
        });
    }
};
