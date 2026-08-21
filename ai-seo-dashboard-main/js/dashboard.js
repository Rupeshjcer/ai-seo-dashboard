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
    loadDashboardChart();
    
    // Load Data
    loadDashboardStats();
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

async function loadDashboardChart() {
    if (typeof ChartFactory !== 'undefined') {
        try {
            const response = await fetch('http://127.0.0.1:5000/analytics');
            const result = await response.json();
            const history = result.success ? result.data : [];
            const labels = history.map(row => new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            const auditData = history.map(row => row.audits);
            const scoreData = history.map(row => row.seo_score);

            if (history.length === 0) return;
        ChartFactory.createTrendChart('trafficTrendChart', labels, [
                { label: 'Audits', data: auditData },
                { label: 'Avg SEO Score', data: scoreData, color: '#10B981' }
            ]);
        } catch (error) {
            console.error('Error loading dashboard chart:', error);
        }
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
        const issues = audit.seo_score < 60 ? 3 : (audit.seo_score < 80 ? 1 : 0);
        if (audit.seo_score < 60) statusClass = 'danger';
        else if (audit.seo_score < 80) statusClass = 'warning';

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