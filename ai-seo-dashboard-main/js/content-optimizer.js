/**
 * AI SEO Growth Dashboard - Content Optimizer JS
 */

document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    const analyzeBtn = document.getElementById('analyzeContentBtn');
    
    // Live Word Count
    if (editor) {
        editor.addEventListener('input', () => {
            const text = editor.innerText.trim();
            const words = text ? text.split(/\s+/).length : 0;
            document.getElementById('wordCountDisplay').innerText = `${words} words`;
        });
    }

    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeContent);
    }

    const genTitleBtn = document.getElementById('generateTitleBtn');
    if (genTitleBtn) {
        genTitleBtn.addEventListener('click', generateTitleIdeas);
    }

    const genMetaBtn = document.getElementById('generateMetaBtn');
    if (genMetaBtn) {
        genMetaBtn.addEventListener('click', generateMetaDescription);
    }
});

async function analyzeContent() {
    const text = document.getElementById('editor').innerText.trim();
    const keyword = document.getElementById('targetKeyword').value.trim();
    const btn = document.getElementById('analyzeContentBtn');
    
    if (!text) {
        showNotification("Please enter some content to analyze.", "warning");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Analyzing...';

    try {
        const response = await fetch('http://127.0.0.1:5000/content-optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text, keyword })
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Content analysis failed');
        updateScoreMeter(result.data.score);
        showNotification("Content analysis complete", "success");
    } catch (error) {
        showNotification(error.message, "danger");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-magic"></i> Re-Analyze Content';
    }
}

function updateScoreMeter(score) {
    const meter = document.getElementById('contentScoreMeter');
    const val = document.getElementById('contentScoreVal');
    
    meter.className = 'score-meter mx-auto';
    if(score >= 80) meter.classList.add('excellent');
    else if(score >= 60) meter.classList.add('good');
    else if(score >= 40) meter.classList.add('average');
    else meter.classList.add('poor');
    
    meter.style.setProperty('--score', score);
    
    // Simple count up
    let curr = 0;
    const interval = setInterval(() => {
        curr += Math.ceil(score / 20);
        if(curr >= score) { curr = score; clearInterval(interval); }
        val.innerText = curr;
    }, 50);
}

async function generateTitleIdeas() {
    const text = document.getElementById('editor').innerText.trim();
    const keyword = document.getElementById('targetKeyword').value.trim();
    const btn = document.getElementById('generateTitleBtn');

    if (!keyword) {
        showNotification("Please enter a target keyword first.", "warning");
        return;
    }
    if (!text) {
        showNotification("Please enter some content first.", "warning");
        return;
    }

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>✨ Generating title ideas...';

    try {
        const response = await fetch('http://127.0.0.1:5000/generate-title-ideas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text, keyword })
        });
        const result = await response.json();
        
        if (!response.ok || !result.success) throw new Error(result.message || 'Unable to generate suggestions right now. Please try again.');

        // Build Modal Content
        let html = '<div class="list-group list-group-flush">';
        result.titles.forEach((title, index) => {
            html += `
            <div class="list-group-item bg-transparent border-secondary py-3 d-flex justify-content-between align-items-center gap-3">
                <div class="fw-medium text-body fs-5"><span class="badge bg-primary rounded-pill me-2 fs-6 shadow-sm">${index + 1}</span> ${title}</div>
                <button class="btn btn-primary text-nowrap shadow-sm px-4" onclick="copyToClipboard('${title.replace(/'/g, "\\'")}')"><i class="bi bi-clipboard me-1"></i> Use</button>
            </div>`;
        });
        html += '</div>';

        document.getElementById('aiResultsModalLabel').innerText = 'Generated Title Ideas';
        document.getElementById('aiResultsBody').innerHTML = html;
        
        const modal = new bootstrap.Modal(document.getElementById('aiResultsModal'));
        modal.show();
        
    } catch (error) {
        showNotification(error.message, "danger");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

async function generateMetaDescription() {
    const text = document.getElementById('editor').innerText.trim();
    const keyword = document.getElementById('targetKeyword').value.trim();
    const btn = document.getElementById('generateMetaBtn');

    if (!keyword) {
        showNotification("Please enter a target keyword first.", "warning");
        return;
    }
    if (!text) {
        showNotification("Please enter some content first.", "warning");
        return;
    }

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>✨ Writing meta descriptions...';

    try {
        const response = await fetch('http://127.0.0.1:5000/generate-meta-description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text, keyword })
        });
        const result = await response.json();
        
        if (!response.ok || !result.success) throw new Error(result.message || 'Unable to generate suggestions right now. Please try again.');

        // Build Modal Content
        let html = '<div class="d-flex flex-column gap-3">';
        result.descriptions.forEach((desc, index) => {
            html += `
            <div class="card border-secondary shadow-sm" style="background: var(--bg-secondary);">
                <div class="card-body p-4">
                    <h6 class="card-subtitle mb-3 text-primary fw-bold"><i class="bi bi-lightbulb-fill me-1"></i> Option ${index + 1}</h6>
                    <p class="card-text text-body fs-5 lh-base">"${desc.text}"</p>
                    <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top border-secondary-subtle">
                        <span class="badge bg-secondary-subtle text-secondary fs-6"><i class="bi bi-fonts me-1"></i> ${desc.character_count} chars</span>
                        <button class="btn btn-primary shadow-sm px-4" onclick="copyToClipboard('${desc.text.replace(/'/g, "\\'")}')"><i class="bi bi-clipboard me-1"></i> Use</button>
                    </div>
                </div>
            </div>`;
        });
        html += '</div>';

        document.getElementById('aiResultsModalLabel').innerText = 'Generated Meta Descriptions';
        document.getElementById('aiResultsBody').innerHTML = html;
        
        const modal = new bootstrap.Modal(document.getElementById('aiResultsModal'));
        modal.show();
        
    } catch (error) {
        showNotification(error.message, "danger");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification("Copied to clipboard successfully.", "success");
    }).catch(err => {
        showNotification("Failed to copy text.", "danger");
    });
}
