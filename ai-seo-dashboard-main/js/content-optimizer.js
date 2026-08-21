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
        updateChecklist(result.data.checks);
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

function updateChecklist(checks) {
    const list = document.querySelector('#optimizationResults ul');
    list.innerHTML = '';

    const checkIcon = '<i class="bi bi-check-circle-fill text-success me-2"></i>';
    const warnIcon = '<i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>';
    const failIcon = '<i class="bi bi-x-circle-fill text-danger me-2"></i>';

    checks.forEach(item => {
        let icon = item.status === 'pass' ? checkIcon : (item.status === 'warning' ? warnIcon : failIcon);
        list.innerHTML += `<li class="list-group-item bg-transparent text-light px-0 border-secondary">${icon} ${item.text}</li>`;
    });
    
    document.querySelector('#optimizationResults .text-center').remove(); // Remove instruction text
}
