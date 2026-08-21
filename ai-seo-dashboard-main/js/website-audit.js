/**
 * AI SEO Growth Dashboard - Website Audit Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const auditForm = document.getElementById('auditForm');
    
    if(auditForm) {
        auditForm.addEventListener('submit', (event) => {
            event.preventDefault();
            runAudit();
        });
    }
    if(analyzeBtn) {
        analyzeBtn.addEventListener('click', runAudit);
    }
});

async function runAudit() {
    const urlInput = document.getElementById('websiteURL');
    let url = urlInput.value.trim();
    
    if (!url) {
        showNotification("Please enter a valid URL", "warning");
        return;
    }

    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try {
        new URL(url);
    } catch {
        showNotification("Please enter a valid website URL", "warning");
        return;
    }
    urlInput.value = url;

    const analyzeBtn = document.getElementById('analyzeBtn');
    const scanProgress = document.getElementById('scanProgress');
    const auditResults = document.getElementById('auditResults');
    const progressBar = document.getElementById('scanProgressBar');
    const statusText = document.getElementById('scanStatusText');

    // UI Updates - Show Loading
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Running...';
    auditResults.classList.add('d-none');
    scanProgress.classList.remove('d-none');
    
    let progress = 10;
    const progressInterval = setInterval(() => {
        progress += 10;
        if(progress > 90) progress = 90;
        progressBar.style.width = `${progress}%`;
        
        if(progress > 30) statusText.innerText = "Analyzing Content Structure...";
        if(progress > 60) statusText.innerText = "Checking site health...";
    }, 800);

    try {
        const response = await fetchAPI('/analyze', {
            method: 'POST',
            body: JSON.stringify({ url: url })
        });
        
        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        statusText.innerText = "Complete!";

        scanProgress.classList.add('d-none');
        if (response.success) {
            auditResults.classList.remove('d-none');
            try {
                renderAuditResults(response.data);
                showNotification("Analysis complete!", "success");
            } catch (renderError) {
                console.error('Audit results rendering failed:', renderError);
                document.getElementById('detailedResultsGrid').innerHTML = '<div class="col-12"><div class="alert alert-warning">The audit completed, but some result details could not be displayed. Please refresh and try again.</div></div>';
                showNotification("Audit completed with display warnings.", "warning");
            }
        } else {
            auditResults.classList.add('d-none');
            showNotification(response.message || "Failed to analyze website", "danger");
        }
    } catch (error) {
        clearInterval(progressInterval);
        scanProgress.classList.add('d-none');
        auditResults.classList.remove('d-none');
        document.getElementById('detailedResultsGrid').innerHTML = `<div class="col-12"><div class="alert alert-danger">Audit could not be completed: ${error.message || 'Unable to reach the audit service.'}</div></div>`;
        showNotification(error.message || "Could not connect to the audit server.", "danger");
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<i class="bi bi-search"></i> Run Audit';
    }
}

function renderAuditResults(data) {
    // 1. Update Main Scores
    updateMeter('seoScoreMeter', 'seoScoreVal', data.seo_score);
    
    document.getElementById('contentScoreVal').innerHTML = `<span class="counter-value" data-target="${data.content_score}">${data.content_score}</span>`;
    document.getElementById('contentScoreLabel').innerHTML = getStatusLabel(data.content_score);
    
    document.getElementById('healthScoreVal').innerHTML = `<span class="counter-value" data-target="${data.health_score}">${data.health_score}</span>`;
    document.getElementById('healthScoreLabel').innerHTML = getStatusLabel(data.health_score);
    
    // 2. Generate Detailed Cards
    const grid = document.getElementById('detailedResultsGrid');
    const checks = data.checks;
    
    const cardsData = [
        {
            title: "Meta Tags", icon: "bi-tags", 
            status: checks.title_present && checks.meta_present ? "pass" : "warning",
            content: `
                <div class="small mb-1 text-muted">Title: ${checks.title_present ? '<span class="text-success">Found</span>' : '<span class="text-danger">Missing</span>'}</div>
                <div class="small text-muted text-truncate" title="${data.title}">"${data.title || 'N/A'}"</div>
                <hr class="border-secondary my-2">
                <div class="small mb-1 text-muted">Description: ${checks.meta_present ? '<span class="text-success">Found</span>' : '<span class="text-warning">Missing</span>'}</div>
            `
        },
        {
            title: "Heading Structure", icon: "bi-type-h1", 
            status: checks.h1_present ? "pass" : "fail",
            content: `
                <div class="d-flex justify-content-between mb-2"><span>H1 Tags</span> <span class="badge bg-${data.h1_count===1 ? 'success' : (data.h1_count>1 ? 'warning' : 'danger')}">${data.h1_count}</span></div>
                <div class="d-flex justify-content-between mb-2"><span>H2 Tags</span> <span class="badge bg-secondary">${data.h2_count}</span></div>
                <div class="d-flex justify-content-between"><span>H3 Tags</span> <span class="badge bg-secondary">${data.h3_count}</span></div>
            `
        },
        {
            title: "Image Optimization", icon: "bi-image", 
            status: data.image_count === data.images_with_alt && data.image_count > 0 ? "pass" : (data.image_count===0 ? "warning" : "fail"),
            content: `
                <div class="display-6 fw-bold text-center my-2 text-primary">${data.image_count}</div>
                <div class="text-center text-muted small">Total Images</div>
                <div class="mt-3 small text-center ${data.images_with_alt < data.image_count ? 'text-warning' : 'text-success'}">
                    ${data.images_with_alt} have alt attributes
                </div>
            `
        },
        {
            title: "Links Structure", icon: "bi-link", 
            status: data.internal_links > 0 && data.external_links > 0 ? "pass" : "warning",
            content: `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span><i class="bi bi-box-arrow-in-right me-2 text-info"></i>Internal</span>
                    <span class="fs-5 fw-bold">${data.internal_links}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-box-arrow-up-right me-2 text-warning"></i>External</span>
                    <span class="fs-5 fw-bold">${data.external_links}</span>
                </div>
            `
        },
        {
            title: "Security & Tech", icon: "bi-shield-check", 
            status: checks.is_https ? "pass" : "fail",
            content: `
                <div class="d-flex justify-content-between mb-2">
                    <span>HTTPS Status</span>
                    ${checks.is_https ? '<span class="status-badge status-success">Secure</span>' : '<span class="status-badge status-danger">Insecure</span>'}
                </div>
                <div class="d-flex justify-content-between mb-2">
                    <span>Mobile Viewport</span>
                    ${checks.has_viewport ? '<i class="bi bi-check-circle-fill text-success"></i>' : '<i class="bi bi-x-circle-fill text-danger"></i>'}
                </div>
                <div class="d-flex justify-content-between">
                    <span>Word Count</span>
                    <span class="fw-bold">${data.word_count}</span>
                </div>
            `
        }
    ];

    grid.innerHTML = cardsData.map((card, i) => {
        let statusIcon = card.status === 'pass' ? '<i class="bi bi-check-circle-fill text-success fs-5"></i>' :
                         card.status === 'warning' ? '<i class="bi bi-exclamation-triangle-fill text-warning fs-5"></i>' :
                         '<i class="bi bi-x-circle-fill text-danger fs-5"></i>';
                         
        return `
        <div class="col-xl-4 col-md-6">
            <div class="glass-card h-100 fade-in-up delay-${(i%5)*100}">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div class="d-flex align-items-center gap-2">
                        <div class="p-2 rounded bg-opacity-10 bg-primary text-primary">
                            <i class="bi ${card.icon}"></i>
                        </div>
                        <h5 class="mb-0 fs-6 fw-semibold">${card.title}</h5>
                    </div>
                    ${statusIcon}
                </div>
                <div>${card.content}</div>
            </div>
        </div>
        `;
    }).join('');

    // 3. Render Recommendations
    const recsList = document.getElementById('recommendationsList');
    recsList.innerHTML = '';
    
    if (data.recommendations && data.recommendations.length > 0) {
        data.recommendations.forEach(rec => {
            let icon = "bi-lightbulb";
            let color = "primary";
            
            if(rec.toLowerCase().includes("add") || rec.toLowerCase().includes("missing")) {
                icon = "bi-exclamation-circle";
                color = "warning";
            }
            if(rec.toLowerCase().includes("error") || rec.toLowerCase().includes("critical")) {
                icon = "bi-x-octagon";
                color = "danger";
            }
            if(rec.toLowerCase().includes("great")) {
                icon = "bi-check-all";
                color = "success";
            }

            recsList.innerHTML += `
                <div class="insight-item mb-3 p-3 rounded" style="background: var(--${color}-light); border: 1px solid rgba(var(--${color}-rgb), 0.2);">
                    <div class="d-flex gap-3">
                        <i class="bi ${icon} text-${color} fs-4 mt-1"></i>
                        <div>
                            <p class="mb-0 text-muted">${rec}</p>
                        </div>
                    </div>
                </div>
            `;
        });
    }
}

function updateMeter(meterId, valId, score) {
    const meter = document.getElementById(meterId);
    const valObj = document.getElementById(valId);
    
    // Update color class
    meter.className = 'score-meter';
    if(score >= 80) meter.classList.add('excellent');
    else if(score >= 60) meter.classList.add('good');
    else if(score >= 40) meter.classList.add('average');
    else meter.classList.add('poor');
    
    // Animate CSS variable for conic-gradient
    meter.style.setProperty('--score', 0);
    setTimeout(() => {
        meter.style.transition = 'all 1.5s ease-out';
        meter.style.setProperty('--score', score);
    }, 100);

    // Set value
    valObj.innerHTML = `<span class="counter-value" data-target="${score}">${score}</span>`;
}

function getStatusLabel(score) {
    if (score >= 80) return '<span class="text-success"><i class="bi bi-arrow-up-short"></i> Excellent</span>';
    if (score >= 60) return '<span class="text-info"><i class="bi bi-dash"></i> Good</span>';
    if (score >= 40) return '<span class="text-warning"><i class="bi bi-exclamation"></i> Needs Work</span>';
    return '<span class="text-danger"><i class="bi bi-x"></i> Poor</span>';
}
