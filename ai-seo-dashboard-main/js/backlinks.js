/**
 * AI SEO Growth Dashboard - Backlinks JS
 */

document.addEventListener('DOMContentLoaded', () => {
    renderCharts();
    renderTable();
    
    document.getElementById('refreshBtn').addEventListener('click', function() {
        this.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        setTimeout(() => {
            this.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
            showNotification("Data refreshed successfully", "success");
        }, 1000);
    });
});

function renderCharts() {
    if (typeof ChartFactory === 'undefined') return;

    // Trend Chart (Bar chart for New vs Lost)
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const newLinks = [120, 150, 90, 200, 180, 142];
    const lostLinks = [-40, -30, -50, -20, -10, -3];

    const ctx = document.getElementById('backlinksTrendChart');
    const colors = getChartColors();
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'New Backlinks',
                    data: newLinks,
                    backgroundColor: colors.success,
                    borderRadius: 4
                },
                {
                    label: 'Lost Backlinks',
                    data: lostLinks,
                    backgroundColor: colors.danger,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, border: { display: false } }
            },
            plugins: { legend: { position: 'top', align: 'end' } }
        }
    });

    // Attributes Chart (Doughnut)
    ChartFactory.createScoreDoughnut('attributesChart', 'Follow', 68, 'primary');
}

function renderTable() {
    const tbody = document.getElementById('backlinksTableBody');
    tbody.innerHTML = '';
    
    const mockData = [
        { as: 65, src: 'https://techblog.com/seo-tools-2024', target: '/', anchor: 'AI dashboard', follow: true },
        { as: 42, src: 'https://startup-directory.io/profile/ai-seo', target: '/', anchor: 'https://example.com', follow: false },
        { as: 88, src: 'https://news-outlet.org/marketing-trends', target: '/blog/ai-marketing', anchor: 'marketing automation', follow: true },
        { as: 12, src: 'http://spammy-directory.xyz/link-1234', target: '/', anchor: 'click here', follow: true, toxic: true },
        { as: 55, src: 'https://forum.webmaster.com/t/dashboard-help', target: '/docs', anchor: 'this documentation', follow: false }
    ];
    
    mockData.forEach(row => {
        let typeBadge = row.follow 
            ? '<span class="badge bg-primary bg-opacity-10 text-primary border border-primary">Follow</span>' 
            : '<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary">Nofollow</span>';
            
        let asBadge = row.toxic 
            ? `<span class="badge bg-danger rounded-pill px-3 py-2 fs-6">${row.as}</span>`
            : `<span class="badge bg-success bg-opacity-10 text-success border border-success rounded-pill px-3 py-2 fs-6">${row.as}</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="text-center">${asBadge}</td>
            <td>
                <div class="text-truncate" style="max-width: 200px;" title="${row.src}">
                    ${row.toxic ? '<i class="bi bi-bug-fill text-danger me-1" title="High Toxicity"></i>' : ''}
                    <a href="#" class="text-decoration-none">${row.src}</a>
                </div>
            </td>
            <td class="text-muted">${row.target}</td>
            <td class="fst-italic text-secondary">"${row.anchor}"</td>
            <td>${typeBadge}</td>
        `;
        tbody.appendChild(tr);
    });
}
