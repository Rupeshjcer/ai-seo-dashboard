/**
 * AI SEO Growth Dashboard - Recommendations JS
 */

let recommendations = [];
let selectedRecommendation = null;

document.addEventListener('DOMContentLoaded', () => {
    loadRecommendations();

    // Tab filtering
    const tabs = document.querySelectorAll('#recTabs .nav-link');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(t => {
                t.classList.remove('active', 'bg-primary', 'text-white');
                if(!t.classList.contains('active')) t.classList.add('text-muted');
            });
            e.target.classList.add('active', 'bg-primary', 'text-white');
            e.target.classList.remove('text-muted');
            
            renderRecs(e.target.dataset.filter);
        });
    });

    document.getElementById('generateBtn').addEventListener('click', function() {
        this.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Generating...';
        this.disabled = true;
        loadRecommendations(this);
    });

    document.getElementById('resolveBtn').addEventListener('click', () => updateRecommendation('resolved'));
    document.getElementById('ignoreBtn').addEventListener('click', () => updateRecommendation('ignored'));
    document.getElementById('clearStatesBtn').addEventListener('click', () => {
        localStorage.removeItem('seoRecommendationStates');
        loadRecommendations();
        showNotification('Cleared recommendations are visible again.', 'success');
    });
});

async function loadRecommendations(button) {
    if (button) button.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Loading...';
    try {
        const response = await fetch('http://127.0.0.1:5000/recommendations');
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Could not load recommendations');
        recommendations = result.data;
        const hidden = JSON.parse(localStorage.getItem('seoRecommendationStates') || '{}');
        recommendations = recommendations.filter(rec => !hidden[recommendationKey(rec)]);
        updatePriorityCounts();
        renderRecs('all');
        if (button) showNotification("Recommendations updated from your latest audit.", "success");
    } catch (error) {
        showNotification(error.message, "danger");
    } finally {
        if (button) {
            button.innerHTML = '<i class="bi bi-magic me-1"></i> Generate New';
            button.disabled = false;
        }
    }
}

function recommendationKey(rec) {
    return `${rec.title}|${rec.urls.join('|')}`;
}

function updatePriorityCounts() {
    const count = priority => recommendations.filter(rec => rec.priority === priority).length;
    document.getElementById('highCount').textContent = `${count('high')} High Priority`;
    document.getElementById('mediumCount').textContent = `${count('med')} Medium`;
    document.getElementById('lowCount').textContent = `${count('low')} Low`;
}

function updateRecommendation(state) {
    if (!selectedRecommendation) return;
    const states = JSON.parse(localStorage.getItem('seoRecommendationStates') || '{}');
    states[recommendationKey(selectedRecommendation)] = state;
    localStorage.setItem('seoRecommendationStates', JSON.stringify(states));
    recommendations = recommendations.filter(rec => rec !== selectedRecommendation);
    selectedRecommendation = null;
    document.getElementById('emptyDetail').classList.remove('d-none');
    document.getElementById('contentDetail').classList.add('d-none');
    updatePriorityCounts();
    renderRecs('all');
    showNotification(state === 'resolved' ? 'Recommendation marked as resolved.' : 'Recommendation ignored.', 'success');
}

function renderRecs(filter) {
    const container = document.getElementById('recommendationsContainer');
    container.innerHTML = '';
    
    let filtered = recommendations;
    if(filter !== 'all') {
        filtered = recommendations.filter(r => r.category === filter);
    }

    if(filtered.length === 0) {
        container.innerHTML = `<div class="text-center text-muted p-4">
            <i class="bi bi-check2-circle text-success fs-2"></i>
            <p class="mt-3 mb-1">No active recommendations</p>
            <small>Run another website audit or use "Show Cleared" to restore completed items.</small>
        </div>`;
        return;
    }

    filtered.forEach(rec => {
        const pClass = rec.priority === 'high' ? 'priority-high' : (rec.priority === 'med' ? 'priority-med' : 'priority-low');
        const badgeColor = rec.priority === 'high' ? 'danger' : (rec.priority === 'med' ? 'warning' : 'info');
        const icon = rec.category === 'technical' ? 'bi-gear' : (rec.category === 'content' ? 'bi-file-text' : 'bi-link');

        const div = document.createElement('div');
        div.className = `rec-item p-3 mb-3 rounded glass-card ${pClass}`;
        div.style.backgroundColor = 'rgba(255,255,255,0.02)';
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="d-flex gap-3">
                    <i class="bi ${icon} text-muted mt-1 fs-5"></i>
                    <div>
                        <h6 class="mb-1">${rec.title}</h6>
                        <p class="text-muted small mb-0 text-truncate" style="max-width: 400px;">${rec.desc}</p>
                    </div>
                </div>
                <span class="badge bg-${badgeColor} bg-opacity-10 text-${badgeColor === 'warning' || badgeColor === 'info' ? 'light' : badgeColor} border border-${badgeColor}">${rec.priority.toUpperCase()}</span>
            </div>
        `;
        
        div.addEventListener('click', () => showDetail(rec));
        container.appendChild(div);
    });
}

function showDetail(rec) {
    selectedRecommendation = rec;
    document.getElementById('emptyDetail').classList.add('d-none');
    document.getElementById('contentDetail').classList.remove('d-none');
    
    document.getElementById('detailTitle').innerText = rec.title;
    document.getElementById('detailDesc').innerText = rec.desc;
    document.getElementById('detailAction').innerText = rec.action;
    
    const badge = document.getElementById('detailBadge');
    badge.className = `badge bg-${rec.priority === 'high' ? 'danger' : (rec.priority === 'med' ? 'warning' : 'info')} mb-2`;
    badge.innerText = `${rec.priority.toUpperCase()} PRIORITY`;
    
    const urlList = document.getElementById('detailUrls');
    urlList.innerHTML = rec.urls.map(u => `<li class="list-group-item bg-transparent text-primary px-0 border-secondary border-bottom">${u}</li>`).join('');
}
