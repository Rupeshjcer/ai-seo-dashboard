/**
 * AI SEO Growth Dashboard - Keyword Research JS
 */

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchKeywordBtn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
});

async function performSearch() {
    const kwInput = document.getElementById('keywordInput').value.trim();
    if (!kwInput) {
        showNotification("Please enter a seed keyword", "warning");
        return;
    }

    const btn = document.getElementById('searchKeywordBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    try {
        const response = await fetch('http://127.0.0.1:5000/keyword-research', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword: kwInput })
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Keyword research failed');
        renderKeywordResults(result.data);
        document.getElementById('resultsSection').classList.remove('d-none');
        showNotification("Keywords analyzed successfully", "success");
    } catch (error) {
        showNotification(error.message, "danger");
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Analyze';
    }
}

function renderKeywordResults(data) {
    // Generate some random variations based on the seed
    const tbody = document.getElementById('keywordTableBody');
    tbody.innerHTML = '';

    data.keywords.forEach(row => {
        const intent = { I: ['Informational', 'intent-info'], N: ['Navigational', 'intent-nav'], C: ['Commercial', 'intent-comm'], T: ['Transactional', 'intent-trans'] }[row.intent] || ['Informational', 'intent-info'];
        const sparkline = generateSparkline(row.trend);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-medium text-primary"><i class="bi bi-search me-2 text-muted"></i> ${row.keyword}</td>
            <td><span class="intent-badge ${intent[1]}" title="${intent[0]}">${row.intent}</span></td>
            <td>${row.volume.toLocaleString()}</td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <span>${row.difficulty}</span>
                    <div class="progress" style="width: 50px; height: 6px; background: rgba(255,255,255,0.1);">
                        <div class="progress-bar ${row.difficulty > 60 ? 'bg-danger' : (row.difficulty > 30 ? 'bg-warning' : 'bg-success')}" style="width: ${row.difficulty}%"></div>
                    </div>
                </div>
            </td>
            <td>$${row.cpc.toFixed(2)}</td>
            <td>
                <img src="${sparkline}" alt="trend" style="height: 25px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('volVal').innerText = Math.round(data.summary.volume / 1000) + 'K';
    document.getElementById('kdVal').innerText = data.summary.difficulty + '%';
    document.getElementById('cpcVal').innerText = '$' + data.summary.cpc.toFixed(2);
}

function generateSparkline(values) {
    // Generates a simple SVG sparkline data URI
    const pts = [];
    values.forEach((value, index) => pts.push(`${index * 12},${30 - value}`));
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const color = isDark ? '#4F46E5' : '#4F46E5';
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="30" viewBox="0 0 90 30">
        <polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(svg);
}
