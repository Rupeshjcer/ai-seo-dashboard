/**
 * AI SEO Growth Dashboard - Competitor Analysis JS
 */

document.addEventListener('DOMContentLoaded', () => {
    const compareBtn = document.getElementById('compareBtn');
    
    if (compareBtn) {
        compareBtn.addEventListener('click', performComparison);
    }
});

function performComparison() {
    const myDomain = document.getElementById('myDomain').value.trim();
    const compDomain = document.getElementById('compDomain').value.trim();
    
    if (!myDomain || !compDomain) {
        showNotification("Please enter both domains to compare.", "warning");
        return;
    }

    const btn = document.getElementById('compareBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    // Simulate API delay
    setTimeout(() => {
        generateMockComparison(myDomain, compDomain);
        document.getElementById('resultsSection').classList.remove('d-none');
        
        btn.disabled = false;
        btn.innerHTML = 'Compare';
        showNotification("Comparison complete!", "success");
    }, 1500);
}

function generateMockComparison(myD, compD) {
    document.getElementById('myDomainLabel').innerText = myD;
    document.getElementById('compDomainLabel').innerText = compD;

    // Generate random competitor stats that are usually higher or lower
    const multiplier = (Math.random() * 1.5) + 0.5; // 0.5x to 2x

    const compAs = Math.floor(42 * multiplier);
    const compTraffic = (24.5 * multiplier).toFixed(1);
    const compKw = Math.floor(1240 * multiplier);
    const compBl = Math.floor(850 * (multiplier * 1.2));
    const gap = Math.floor(compKw * 0.4);

    // Update UI
    animateValue('compAs', compAs);
    document.getElementById('compTraffic').innerText = compTraffic + 'K';
    document.getElementById('compKw').innerText = compKw.toLocaleString();
    document.getElementById('compBl').innerText = compBl.toLocaleString();
    animateValue('gapCount', gap);

    // Generate Gap List
    const gapList = document.getElementById('gapList');
    gapList.innerHTML = '';
    const gapWords = ["dashboard templates", "admin panel ui", "seo tools free", "website analyzer", "backlink checker"];
    
    gapWords.forEach(kw => {
        const vol = Math.floor(Math.random() * 5000) + 500;
        const pos = Math.floor(Math.random() * 10) + 1;
        gapList.innerHTML += `
            <li class="list-group-item bg-transparent px-0 border-secondary d-flex justify-content-between align-items-center">
                <div>
                    <i class="bi bi-search text-muted me-2"></i>
                    <span class="text-primary">${kw}</span>
                </div>
                <div class="text-end">
                    <span class="badge bg-secondary me-2">Vol: ${vol}</span>
                    <span class="badge bg-info text-dark">Pos: #${pos}</span>
                </div>
            </li>
        `;
    });

    renderRadarChart(myD, compD, multiplier);
}

function renderRadarChart(myD, compD, mult) {
    const ctx = document.getElementById('radarChart');
    if(!ctx) return;
    
    const existing = Chart.getChart('radarChart');
    if(existing) existing.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94A3B8' : '#64748B';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Authority', 'Traffic', 'Keywords', 'Backlinks', 'Content Quality'],
            datasets: [
                {
                    label: myD,
                    data: [65, 59, 75, 50, 85],
                    fill: true,
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderColor: '#4F46E5',
                    pointBackgroundColor: '#4F46E5',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#4F46E5'
                },
                {
                    label: compD,
                    data: [65*mult, 59*mult, 75*mult, 50*mult, 80],
                    fill: true,
                    backgroundColor: 'rgba(6, 182, 212, 0.2)',
                    borderColor: '#06B6D4',
                    pointBackgroundColor: '#06B6D4',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#06B6D4'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: gridColor },
                    grid: { color: gridColor },
                    pointLabels: { color: textColor, font: { size: 12 } },
                    ticks: { display: false }
                }
            },
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function animateValue(id, end) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const duration = 1000;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * end);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}
