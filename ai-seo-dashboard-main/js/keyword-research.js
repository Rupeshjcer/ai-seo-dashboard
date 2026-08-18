/**
 * AI SEO Growth Dashboard - Keyword Research JS
 */

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchKeywordBtn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
});

function performSearch() {
    const kwInput = document.getElementById('keywordInput').value.trim();
    if (!kwInput) {
        showNotification("Please enter a seed keyword", "warning");
        return;
    }

    const btn = document.getElementById('searchKeywordBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    // Simulate API delay
    setTimeout(() => {
        generateMockData(kwInput);
        document.getElementById('resultsSection').classList.remove('d-none');
        
        btn.disabled = false;
        btn.innerHTML = 'Analyze';
        showNotification("Keywords analyzed successfully", "success");
    }, 1200);
}

function generateMockData(seed) {
    // Generate some random variations based on the seed
    const tbody = document.getElementById('keywordTableBody');
    tbody.innerHTML = '';

    const suffixes = [" software", " tools", " for small business", " pricing", " vs alternatives", " guide", " free"];
    const prefixes = ["best ", "how to use ", "cheap ", "what is "];
    
    let keywords = [seed];
    
    // Add variations
    for(let i=0; i<3; i++) keywords.push(seed + suffixes[i]);
    for(let i=0; i<2; i++) keywords.push(prefixes[i] + seed);
    
    // Sort logic placeholder (just rendering them)
    keywords.forEach((kw, index) => {
        const vol = Math.floor(Math.random() * 50000) + 1000;
        const kd = Math.floor(Math.random() * 80) + 10;
        const cpc = (Math.random() * 10).toFixed(2);
        
        // Random intent
        const intents = [
            { id: 'I', label: 'Informational', class: 'intent-info' },
            { id: 'N', label: 'Navigational', class: 'intent-nav' },
            { id: 'C', label: 'Commercial', class: 'intent-comm' },
            { id: 'T', label: 'Transactional', class: 'intent-trans' }
        ];
        const intent = intents[Math.floor(Math.random() * intents.length)];

        // Generate tiny SVG sparkline for trend
        const sparkline = generateSparkline();

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-medium text-primary"><i class="bi bi-search me-2 text-muted"></i> ${kw}</td>
            <td><span class="intent-badge ${intent.class}" title="${intent.label}">${intent.id}</span></td>
            <td>${vol.toLocaleString()}</td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <span>${kd}</span>
                    <div class="progress" style="width: 50px; height: 6px; background: rgba(255,255,255,0.1);">
                        <div class="progress-bar ${kd > 60 ? 'bg-danger' : (kd > 30 ? 'bg-warning' : 'bg-success')}" style="width: ${kd}%"></div>
                    </div>
                </div>
            </td>
            <td>$${cpc}</td>
            <td>
                <img src="${sparkline}" alt="trend" style="height: 25px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Update main stats based on seed
    document.getElementById('volVal').innerText = (Math.random() * 50).toFixed(1) + 'K';
    document.getElementById('kdVal').innerText = Math.floor(Math.random() * 50 + 30) + '%';
    document.getElementById('cpcVal').innerText = '$' + (Math.random() * 5 + 1).toFixed(2);
}

function generateSparkline() {
    // Generates a simple SVG sparkline data URI
    const pts = [];
    let y = 15;
    for(let i=0; i<10; i++) {
        y += (Math.random() * 10 - 5);
        y = Math.max(2, Math.min(28, y));
        pts.push(`${i*10},${y}`);
    }
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const color = isDark ? '#4F46E5' : '#4F46E5';
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="30" viewBox="0 0 90 30">
        <polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(svg);
}
