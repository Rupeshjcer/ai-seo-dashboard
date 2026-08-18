/**
 * AI SEO Growth Dashboard - Overview Dashboard JS
 */

document.addEventListener('DOMContentLoaded', () => {
    // Session check
    const fullname = localStorage.getItem("fullname") || "Admin";
    const nameDisplays = document.querySelectorAll("#userNameDisplay, #userNameGreeting");
    nameDisplays.forEach(el => {
        if(el) el.textContent = fullname;
    });

    // Initialize Charts
    initDashboardCharts();
    
    // Load Data
    loadRecentAudits();
    
    // Logout Handler
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }
});

function initDashboardCharts() {
    // Traffic Trend Chart
    const labels = Array.from({length: 14}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Mock Data
    const trafficData = [12, 14, 13, 16, 18, 17, 20, 21, 23, 22, 25, 24, 28, 30];
    const scoreData = [72, 72, 74, 74, 75, 75, 78, 78, 80, 80, 82, 82, 85, 86];

    // Assuming ChartFactory is loaded from charts-config.js
    if (typeof ChartFactory !== 'undefined') {
        ChartFactory.createTrendChart('trafficTrendChart', labels, [
            { label: 'Organic Traffic (k)', data: trafficData },
            { label: 'Avg SEO Score', data: scoreData, color: '#10B981' } // Green for score
        ]);
    }
}

async function loadRecentAudits() {
    try {
        // Try fetching from real backend first
        const response = await fetch("http://127.0.0.1:5000/history").catch(() => null);
        let data = [];
        
        if (response && response.ok) {
            const result = await response.json();
            if (result.success) data = result.data.slice(0, 5);
        }
        
        // Fallback mock data if backend fails or empty
        if (data.length === 0) {
            data = [
                { url: "example.com", date: new Date().toISOString(), seo_score: 85, health_score: 90 },
                { url: "myportfolio.dev", date: new Date(Date.now() - 86400000).toISOString(), seo_score: 72, health_score: 65 },
                { url: "shop-store.io", date: new Date(Date.now() - 172800000).toISOString(), seo_score: 94, health_score: 98 },
            ];
        }

        renderAuditsTable(data);
    } catch (error) {
        console.error("Error loading audits:", error);
        document.getElementById('recentAuditsTable').querySelector('tbody').innerHTML = 
            `<tr><td colspan="5" class="text-center text-danger">Failed to load data.</td></tr>`;
    }
}

function renderAuditsTable(audits) {
    const tbody = document.getElementById('recentAuditsTable').querySelector('tbody');
    tbody.innerHTML = '';
    
    if (!audits || audits.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No recent audits found.</td></tr>`;
        return;
    }

    audits.forEach(audit => {
        const date = new Date(audit.date).toLocaleDateString();
        
        // Determine status and badge
        let statusClass = 'success';
        let issues = Math.floor(Math.random() * 5); // Mock issues
        if (audit.seo_score < 60) { statusClass = 'danger'; issues += 10; }
        else if (audit.seo_score < 80) { statusClass = 'warning'; issues += 4; }

        const scoreBadge = `<span class="status-badge status-${statusClass}">${audit.seo_score}/100</span>`;
        const issueBadge = issues === 0 
            ? `<span class="badge bg-success">0</span>` 
            : `<span class="badge bg-${statusClass === 'danger' ? 'danger' : 'warning'}">${issues}</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-globe text-muted"></i>
                    <span class="fw-medium">${audit.url}</span>
                </div>
            </td>
            <td class="text-muted">${date}</td>
            <td>${scoreBadge}</td>
            <td>${issueBadge}</td>
            <td>
                <a href="website-audit.html" class="btn btn-outline btn-sm py-1 px-2">
                    View <i class="bi bi-chevron-right fs-7"></i>
                </a>
            </td>
        `;
        tbody.appendChild(tr);
    });
}