/**
 * AI SEO Growth Dashboard - Recommendations JS
 */

const mockRecs = [
    {
        id: 1,
        title: "Fix 404 Errors on 3 Pages",
        desc: "Dead links frustrate users and waste search engine crawl budget. Immediate action required.",
        category: "technical",
        priority: "high",
        urls: ["/old-product-page", "/about-us-old", "/blog/deleted-post"],
        action: "Set up 301 redirects from these URLs to the most relevant active pages on your site."
    },
    {
        id: 2,
        title: "Update Content for 'AI Dashboard'",
        desc: "Your main competitor just updated their page for this keyword and pushed you to #3.",
        category: "content",
        priority: "high",
        urls: ["/features/ai-dashboard"],
        action: "Add a new FAQ section and update statistics to 2024 to refresh the content."
    },
    {
        id: 3,
        title: "Missing Alt Text on 12 Images",
        desc: "Images without alt text hurt accessibility and image search rankings.",
        category: "technical",
        priority: "med",
        urls: ["/blog/10-seo-tips (5 images)", "/pricing (7 images)"],
        action: "Review the listed pages and add descriptive alt tags containing secondary keywords."
    },
    {
        id: 4,
        title: "Toxic Backlink Detected",
        desc: "A high-spam-score domain linked to your homepage recently.",
        category: "links",
        priority: "high",
        urls: ["spam-directory-xyz.com -> /"],
        action: "Monitor for a few days. If more appear, generate a disavow file and submit to Google."
    },
    {
        id: 5,
        title: "Optimize Meta Description",
        desc: "The meta description for your contact page is too short (under 50 chars).",
        category: "content",
        priority: "low",
        urls: ["/contact"],
        action: "Expand the description to ~150 characters. Include a clear call to action."
    }
];

document.addEventListener('DOMContentLoaded', () => {
    renderRecs('all');

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
        setTimeout(() => {
            this.innerHTML = '<i class="bi bi-magic me-1"></i> Generate New';
            this.disabled = false;
            showNotification("AI has analyzed your latest data. Recommendations updated.", "success");
        }, 1500);
    });
});

function renderRecs(filter) {
    const container = document.getElementById('recommendationsContainer');
    container.innerHTML = '';
    
    let filtered = mockRecs;
    if(filter !== 'all') {
        filtered = mockRecs.filter(r => r.category === filter);
    }

    if(filtered.length === 0) {
        container.innerHTML = '<div class="text-center text-muted p-4">No recommendations in this category.</div>';
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
