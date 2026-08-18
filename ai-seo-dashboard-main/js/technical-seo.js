/**
 * AI SEO Growth Dashboard - Technical SEO JS
 */

document.addEventListener('DOMContentLoaded', () => {
    renderTechGrid();
    
    document.getElementById('rescanBtn').addEventListener('click', function() {
        this.disabled = true;
        this.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Scanning...';
        
        setTimeout(() => {
            // Randomize errors slightly
            document.getElementById('errorsVal').innerText = Math.floor(Math.random() * 5);
            document.getElementById('warningsVal').innerText = Math.floor(Math.random() * 20) + 5;
            
            this.disabled = false;
            this.innerHTML = '<i class="bi bi-arrow-repeat me-1"></i> Rescan';
            showNotification("Site crawl complete. Data updated.", "success");
        }, 2000);
    });
});

function renderTechGrid() {
    const grid = document.getElementById('techGrid');
    
    const categories = [
        {
            title: "Crawlability & Indexability", icon: "bi-spider",
            items: [
                { name: "Robots.txt", status: "pass", msg: "Valid and found" },
                { name: "XML Sitemap", status: "pass", msg: "Found 3 sitemaps" },
                { name: "Noindex Pages", status: "warning", msg: "42 pages blocked" },
                { name: "404 Errors", status: "fail", msg: "3 dead links found" }
            ]
        },
        {
            title: "Core Web Vitals", icon: "bi-lightning-charge",
            items: [
                { name: "LCP (Largest Contentful Paint)", status: "warning", msg: "2.8s (Needs Improvement)" },
                { name: "FID (First Input Delay)", status: "pass", msg: "42ms (Good)" },
                { name: "CLS (Cumulative Layout Shift)", status: "pass", msg: "0.05 (Good)" },
                { name: "Mobile Usability", status: "pass", msg: "Mobile friendly" }
            ]
        },
        {
            title: "Structure & Tags", icon: "bi-code-slash",
            items: [
                { name: "Canonical Tags", status: "pass", msg: "Configured correctly" },
                { name: "Hreflang Tags", status: "warning", msg: "Missing on some language variants" },
                { name: "Duplicate Content", status: "fail", msg: "2 exact duplicate pages found" },
                { name: "Schema.org / Structured Data", status: "pass", msg: "Valid Article schema" }
            ]
        }
    ];

    grid.innerHTML = categories.map((cat, i) => {
        const listHtml = cat.items.map(item => {
            const icon = item.status === 'pass' ? '<i class="bi bi-check-circle-fill text-success"></i>' :
                         item.status === 'warning' ? '<i class="bi bi-exclamation-triangle-fill text-warning"></i>' :
                         '<i class="bi bi-x-circle-fill text-danger"></i>';
            return `
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-secondary">
                    <div class="d-flex align-items-center gap-2">
                        ${icon} <span class="${item.status==='fail'?'fw-bold text-danger':''}">${item.name}</span>
                    </div>
                    <span class="text-muted small text-end">${item.msg}</span>
                </div>
            `;
        }).join('');

        return `
        <div class="col-lg-4">
            <div class="glass-card h-100 fade-in-up delay-${(i%3)*100}">
                <div class="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom border-secondary">
                    <div class="p-2 rounded bg-opacity-10 bg-primary text-primary">
                        <i class="bi ${cat.icon}"></i>
                    </div>
                    <h4 class="mb-0 fs-5 fw-semibold">${cat.title}</h4>
                </div>
                <div>${listHtml}</div>
                <button class="btn btn-outline btn-sm w-100 mt-4">View All Details</button>
            </div>
        </div>
        `;
    }).join('');
}
