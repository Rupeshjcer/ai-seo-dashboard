/**
 * AI SEO Growth Dashboard - Keyword Research JS
 * Uses the backend /keyword-research API with DataForSEO
 */

let lastKeywords = [];

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchKeywordBtn');
    const keywordInput = document.getElementById('keywordInput');

    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    if (keywordInput) {
        keywordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }

    // Wire up CSV export button
    const exportBtn = document.querySelector('[data-action="export-csv"]');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCSV);
    }
});

async function performSearch() {
    const kwInput = document.getElementById('keywordInput').value.trim();
    const market = document.getElementById('marketSelect')?.value || 'in'; // Default to India if not specified

    if (!kwInput) {
        showNotification("Please enter a seed keyword", "warning");
        return;
    }

    const btn = document.getElementById('searchKeywordBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Fetching...';

    document.getElementById('resultsSection').classList.add('d-none');

    try {
        const backendRes = await fetch('http://127.0.0.1:5000/keyword-research', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword: kwInput, market })
        });

        const backendData = await backendRes.json();
        if (!backendRes.ok || !backendData.success) {
            throw new Error(backendData.message || 'No suggestions found.');
        }

        const suggestions = backendData.data.keywords;
        lastKeywords = suggestions;

        renderKeywordResults(suggestions, backendData.data.summary || null);
        document.getElementById('resultsSection').classList.remove('d-none');

        if (backendData.data.source === 'dataforseo') {
            showNotification("Keywords analyzed with DataForSEO metrics!", "success");
        } else {
            showNotification("Keywords analyzed with live search volume & CPC metrics!", "success");
        }

    } catch (error) {
        console.error(error);
        showNotification(error.message || "An error occurred. Is the backend running?", "danger");
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Analyze';
    }
}

function renderKeywordResults(keywords, summary) {
    const tbody = document.getElementById('keywordTableBody');
    tbody.innerHTML = '';

    const intentMap = {
        I: ['Informational', 'intent-info'],
        N: ['Navigational', 'intent-nav'],
        C: ['Commercial', 'intent-comm'],
        T: ['Transactional', 'intent-trans']
    };

    function formatNumber(num) {
        if (num == null) return 'N/A';
        if (num >= 10000) return Math.round(num / 1000) + 'K';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toLocaleString();
    }

    keywords.forEach(row => {
        const intent = intentMap[row.intent] || intentMap['I'];

        const volumeCell = row.volume != null
            ? row.volume.toLocaleString()
            : '<span class="text-muted small">N/A</span>';
            
        const cpcCell = row.cpc != null
            ? `$${row.cpc.toFixed(2)}`
            : '<span class="text-muted small">N/A</span>';

        let difficultyCell = '<span class="text-muted small">N/A</span>';
        if (row.difficulty != null) {
            const diffColor = row.difficulty > 60 ? 'bg-danger' : (row.difficulty > 30 ? 'bg-warning' : 'bg-success');
            difficultyCell = `
                <div class="d-flex align-items-center gap-2">
                    <span class="fw-medium">${row.difficulty}%</span>
                    <div class="progress flex-grow-1" style="max-width: 60px; height: 6px; background: rgba(15, 23, 42, 0.1);">
                        <div class="progress-bar ${diffColor}" style="width: ${row.difficulty}%"></div>
                    </div>
                </div>`;
        }
        
        let competitionCell = '<span class="text-muted small">N/A</span>';
        if (row.competition_level != null) {
            const compText = row.competition_level.toUpperCase();
            const compColor = compText === 'HIGH' ? 'danger' : (compText === 'MEDIUM' ? 'warning' : 'success');
            competitionCell = `<span class="badge bg-${compColor}-subtle text-${compColor} border border-${compColor}-subtle">${compText}</span>`;
        } else if (row.competition != null) {
            const compVal = row.competition;
            const compColor = compVal > 0.66 ? 'danger' : (compVal > 0.33 ? 'warning' : 'success');
            const text = compVal > 0.66 ? 'HIGH' : (compVal > 0.33 ? 'MEDIUM' : 'LOW');
            competitionCell = `<span class="badge bg-${compColor}-subtle text-${compColor} border border-${compColor}-subtle">${text}</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-medium"><i class="bi bi-search me-2 text-muted"></i>${row.keyword}</td>
            <td><span class="intent-badge ${intent[1]}" title="${intent[0]}">${row.intent}</span></td>
            <td>${volumeCell}</td>
            <td>${cpcCell}</td>
            <td>${competitionCell}</td>
            <td>${difficultyCell}</td>
        `;
        tbody.appendChild(tr);
    });

    if (summary) {
        document.getElementById('volVal').innerText = formatNumber(summary.volume);
        document.getElementById('kdVal').innerText = summary.difficulty != null
            ? (summary.difficulty + '%') : 'N/A';
        document.getElementById('cpcVal').innerText = summary.cpc != null
            ? ('$' + summary.cpc.toFixed(2)) : 'N/A';

        const kdTextEl = document.getElementById('kdTextVal');
        if (kdTextEl && summary.difficulty != null) {
            if (summary.difficulty > 70) { kdTextEl.innerText = 'Hard'; kdTextEl.className = 'small text-danger fw-semibold'; }
            else if (summary.difficulty > 30) { kdTextEl.innerText = 'Medium'; kdTextEl.className = 'small text-warning fw-semibold'; }
            else { kdTextEl.innerText = 'Easy'; kdTextEl.className = 'small text-success fw-semibold'; }
        } else if (kdTextEl) {
            kdTextEl.innerText = '-';
        }
    } else {
        ['volVal', 'kdVal', 'cpcVal'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = 'N/A';
        });
        const kdTextEl = document.getElementById('kdTextVal');
        if (kdTextEl) kdTextEl.innerText = '-';
    }
}

function exportToCSV() {
    if (!lastKeywords.length) {
        showNotification("No keyword data to export. Run a search first.", "warning");
        return;
    }
    const intentLabels = { I: 'Informational', N: 'Navigational', C: 'Commercial', T: 'Transactional' };
    const rows = [
        ['Keyword', 'Intent', 'Volume', 'CPC', 'Competition', 'Difficulty'],
        ...lastKeywords.map(k => [
            `"${k.keyword}"`,
            intentLabels[k.intent] || k.intent,
            k.volume ?? 'N/A',
            k.cpc != null ? `$${k.cpc.toFixed(2)}` : 'N/A',
            k.competition_level ?? 'N/A',
            k.difficulty ?? 'N/A'
        ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords_${document.getElementById('keywordInput').value.trim().replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("Keywords exported to CSV!", "success");
}
