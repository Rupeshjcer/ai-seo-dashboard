/**
 * AI SEO Growth Dashboard - SEO Analysis JS
 * Renders historical SEO trend charts, latest metrics breakdown, and audit log.
 */

document.addEventListener('DOMContentLoaded', () => {
    loadHistoricalData();

    // Re-fetch when user returns to this tab
    window.addEventListener('focus', () => {
        loadHistoricalData();
    });

    // Re-fetch when an audit completes in another tab or page
    window.addEventListener('storage', (e) => {
        if (e.key === 'latest_audit_updated' || e.key === 'user_id') {
            loadHistoricalData();
        }
    });
});

async function loadHistoricalData() {
    let userId = localStorage.getItem('user_id');
    if (userId === 'null' || userId === 'undefined') {
        userId = null;
    }

    try {
        const endpoint = userId ? `/history?user_id=${encodeURIComponent(userId)}` : '/history';
        const response = await fetchAPI(endpoint);
        let data = (response && response.success && Array.isArray(response.data)) ? response.data : [];

        // If specific user has no audits yet, try general history fallback
        if (data.length === 0 && userId) {
            const fallbackRes = await fetchAPI('/history');
            if (fallbackRes && fallbackRes.success && Array.isArray(fallbackRes.data)) {
                data = fallbackRes.data;
            }
        }

        if (data.length === 0) {
            renderPlaceholderCharts();
            renderEmptyHistoryTable();
            return;
        }

        // Reverse so chronological order (oldest to newest) is displayed on trend charts
        const sorted = [...data].reverse();
        renderCharts(sorted);
        updateScoreCards(sorted);
        renderAuditTable(data); // display newest first in table

    } catch (error) {
        console.error("Failed to load historical data:", error);
        renderPlaceholderCharts();
        renderEmptyHistoryTable();
    }
}

function getScoreClass(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
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
    const contentDiff = previous ? (latest.content_score - previous.content_score) : 0;

    // Animates a score meter from 0 → target value and sets score class
    const animateMeter = (scoreEl, target, displayText = null) => {
        if (!scoreEl) return;
        const valueEl = scoreEl.querySelector('.score-value');
        scoreEl.className = 'score-meter mx-auto mb-3 ' + getScoreClass(target);
        scoreEl.style.setProperty('--score', 0);

        if (target <= 0) {
            scoreEl.style.setProperty('--score', 0);
            if (valueEl) valueEl.textContent = displayText !== null ? displayText : '0';
            return;
        }

        let current = 0;
        const step = Math.max(1, Math.ceil(target / 25));
        const interval = setInterval(() => {
            current = Math.min(current + step, target);
            scoreEl.style.setProperty('--score', current);
            if (valueEl) valueEl.textContent = displayText !== null ? displayText : current;
            if (current >= target) clearInterval(interval);
        }, 20);
    };

    const updateCard = (id, scoreId, value, diff, hasPrevious) => {
        animateMeter(document.getElementById(scoreId), value);
        const trendEl = document.getElementById(id);
        if (trendEl) {
            if (diff !== 0) {
                const cls = diff > 0 ? 'text-success' : 'text-danger';
                const icon = diff > 0 ? 'bi-arrow-up' : 'bi-arrow-down';
                trendEl.innerHTML = `<i class="bi ${icon}"></i> ${diff > 0 ? '+' : ''}${diff} pts`;
                trendEl.className = trendEl.className.replace(/text-\w+/, '') + ' ' + cls;
            } else if (hasPrevious) {
                trendEl.innerHTML = `<i class="bi bi-dash me-1"></i><span class="text-secondary">Steady</span>`;
                trendEl.className = 'small';
            } else {
                trendEl.innerHTML = `<i class="bi bi-check-circle-fill text-success me-1"></i><span class="text-secondary">Latest audit</span>`;
                trendEl.className = 'small';
            }
        }
    };

    updateCard('seoTrend', 'seoMeter', avgSeo, seoDiff, !!previous);
    updateCard('healthTrend', 'healthMeter', avgHealth, healthDiff, !!previous);
    updateCard('contentTrend', 'contentMeter', avgContent, contentDiff, !!previous);

    // Total Audits meter & value
    const totalEl = document.getElementById('totalAuditsVal');
    if (totalEl) totalEl.textContent = data.length;

    const totalMeter = document.getElementById('totalAuditsMeter');
    if (totalMeter) {
        animateMeter(totalMeter, Math.min(data.length * 20, 100), data.length);
    }

    const totalSub = document.getElementById('totalAuditsSub');
    if (totalSub) {
        totalSub.innerHTML = `<i class="bi bi-database-check text-success"></i> ${data.length} saved record${data.length > 1 ? 's' : ''}`;
    }

    const badge = document.getElementById('historyBadge');
    if (badge) {
        badge.textContent = `${data.length} Audit${data.length > 1 ? 's' : ''} Recorded`;
    }
}

function renderCharts(data) {
    if (typeof ChartFactory === 'undefined' || typeof Chart === 'undefined') return;

    const labels = data.map((d, i) => {
        if (!d.date && !d.created_at) return `Audit #${i + 1}`;
        const date = new Date(d.date || d.created_at);
        if (isNaN(date)) return d.date || `Audit #${i + 1}`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    });

    const seoScores = data.map(d => d.seo_score || 0);
    const contentScores = data.map(d => d.content_score || 0);
    const healthScores = data.map(d => d.health_score || 0);

    // Destroy existing charts to prevent canvas re-use errors
    ['historicalChart', 'breakdownChart'].forEach(id => {
        const existing = Chart.getChart(id);
        if (existing) existing.destroy();
    });

    // 1. Line Chart: Historical trend over time
    if (document.getElementById('historicalChart')) {
        ChartFactory.createTrendChart('historicalChart', labels, [
            { label: 'Overall SEO', data: seoScores, color: '#4F46E5' },
            { label: 'Content Score', data: contentScores, color: '#06B6D4' },
            { label: 'Technical Health', data: healthScores, color: '#22C55E' }
        ]);
    }

    // 2. Bar Chart: Latest metrics breakdown
    const latest = data[data.length - 1];
    if (document.getElementById('breakdownChart')) {
        ChartFactory.createBarChart('breakdownChart',
            ['SEO Score', 'Technical Health', 'Content Quality'],
            [latest.seo_score || 0, latest.health_score || 0, latest.content_score || 0],
            latest.url ? `Latest: ${latest.url}` : 'Latest Audit Metrics'
        );
    }
}

function renderAuditTable(data) {
    const tbody = document.getElementById('auditHistoryTableBody');
    if (!tbody) return;

    if (!data || data.length === 0) {
        renderEmptyHistoryTable();
        return;
    }

    tbody.innerHTML = data.map(row => {
        const dateStr = row.date ? new Date(row.date).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'Just now';

        const seoBadge = `<span class="badge ${getBadgeClass(row.seo_score)}">${row.seo_score || 0}</span>`;
        const healthBadge = `<span class="badge ${getBadgeClass(row.health_score)}">${row.health_score || 0}</span>`;
        const contentBadge = `<span class="badge ${getBadgeClass(row.content_score)}">${row.content_score || 0}</span>`;

        const displayUrl = (row.url || '—').replace(/^https?:\/\//i, '').replace(/\/$/, '');

        return `
            <tr>
                <td>
                    <div class="fw-medium text-truncate" style="max-width: 170px;" title="${row.url || ''}">
                        <i class="bi bi-globe2 me-1 text-primary"></i>${displayUrl}
                    </div>
                </td>
                <td class="text-center">${seoBadge}</td>
                <td class="text-center">${healthBadge}</td>
                <td class="text-center">${contentBadge}</td>
                <td class="text-end text-muted small">${dateStr}</td>
            </tr>
        `;
    }).join('');
}

function getBadgeClass(score) {
    if (score >= 80) return 'bg-success-subtle text-success border border-success-subtle';
    if (score >= 60) return 'bg-info-subtle text-info border border-info-subtle';
    if (score >= 40) return 'bg-warning-subtle text-warning border border-warning-subtle';
    return 'bg-danger-subtle text-danger border border-danger-subtle';
}

function renderEmptyHistoryTable() {
    const tbody = document.getElementById('auditHistoryTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    <i class="bi bi-search mb-2 d-block fs-4 opacity-50"></i>
                    No audits found. <a href="website-audit.html" class="text-primary text-decoration-none">Run your first audit</a> to see trends!
                </td>
            </tr>
        `;
    }
}

/**
 * Render placeholder charts when no history data is available.
 */
function renderPlaceholderCharts() {
    if (typeof ChartFactory === 'undefined' || typeof Chart === 'undefined') return;

    ['historicalChart', 'breakdownChart'].forEach(id => {
        const existing = Chart.getChart(id);
        if (existing) existing.destroy();
    });

    if (document.getElementById('breakdownChart')) {
        ChartFactory.createBarChart('breakdownChart',
            ['SEO Score', 'Technical Health', 'Content Quality'],
            [0, 0, 0],
            'No audit data yet'
        );
    }
}
