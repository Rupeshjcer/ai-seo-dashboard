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

function analyzeContent() {
    const text = document.getElementById('editor').innerText.trim();
    const keyword = document.getElementById('targetKeyword').value.trim();
    const btn = document.getElementById('analyzeContentBtn');
    
    if (!text) {
        showNotification("Please enter some content to analyze.", "warning");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Analyzing...';

    // Basic client-side analysis simulation
    setTimeout(() => {
        const words = text.split(/\s+/).length;
        let score = 50; // Base score
        let kwDensity = 0;
        
        let kwStatus = 'fail';
        let wordStatus = words > 500 ? 'pass' : 'fail';
        
        if (words > 500) score += 20;
        else if (words > 200) score += 10;

        if (keyword) {
            const regex = new RegExp(keyword, "gi");
            const matches = text.match(regex);
            const count = matches ? matches.length : 0;
            kwDensity = ((count / words) * 100).toFixed(1);
            
            if (kwDensity > 0.5 && kwDensity < 3.0) {
                kwStatus = 'pass';
                score += 30;
            } else if (kwDensity > 0) {
                kwStatus = 'warning';
                score += 10;
            }
        }

        // Update UI
        updateScoreMeter(score);
        updateChecklist(kwStatus, wordStatus, kwDensity, words);
        
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-magic"></i> Re-Analyze Content';
        showNotification("Content analysis complete", "success");
    }, 1000);
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

function updateChecklist(kwStatus, wordStatus, kwDensity, words) {
    const list = document.querySelector('#optimizationResults ul');
    list.innerHTML = '';

    const checkIcon = '<i class="bi bi-check-circle-fill text-success me-2"></i>';
    const warnIcon = '<i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>';
    const failIcon = '<i class="bi bi-x-circle-fill text-danger me-2"></i>';

    const items = [
        { 
            status: kwStatus, 
            text: `Target Keyword Density: <span class="fw-bold">${kwDensity}%</span> (Target 1-3%)` 
        },
        { 
            status: wordStatus, 
            text: `Word Count: <span class="fw-bold">${words}</span> (Target > 500)` 
        },
        { 
            status: 'pass', // Mock
            text: `Readability Score: <span class="fw-bold text-success">Good (8th Grade)</span>` 
        },
        { 
            status: 'warning', // Mock
            text: `Missing H2 subheadings containing target keyword` 
        }
    ];

    items.forEach(item => {
        let icon = item.status === 'pass' ? checkIcon : (item.status === 'warning' ? warnIcon : failIcon);
        list.innerHTML += `<li class="list-group-item bg-transparent text-light px-0 border-secondary">${icon} ${item.text}</li>`;
    });
    
    document.querySelector('#optimizationResults .text-center').remove(); // Remove instruction text
}
