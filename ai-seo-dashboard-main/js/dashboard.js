/**
 * AI SEO Growth Dashboard - Overview Dashboard JS
 * Strictly data-driven: derives all statistics, meters, tables, breakdown cards,
 * severity issues, and trend charts from real persisted audits in SQLite.
 */

let dashboardTrendChartInstance = null;
let lastLoadedTimestamp = 0;
let isDashboardLoading = false;

document.addEventListener('DOMContentLoaded', () => {
    initDashboardEvents();
    setLoadingState();
    loadDashboard();
});

/** Initialize form submissions, retries, and cross-tab sync */
function initDashboardEvents() {
    // Quick Audit Form directly on Dashboard
    const auditForm = document.getElementById('dashboardAuditForm');
    if (auditForm) {
        auditForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleDashboardAudit();
        });
    }

    // Retry Button on error banner
    const retryBtn = document.getElementById('dashboardRetryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            setLoadingState();
            loadDashboard();
        });
    }

    // Auto-refresh when user returns to tab after completing audit elsewhere
    window.addEventListener('focus', () => {
        const lastUpdated = localStorage.getItem('latest_audit_updated');
        if (lastUpdated && Number(lastUpdated) > lastLoadedTimestamp) {
            loadDashboard();
        }
    });

    // Cross-tab storage sync
    window.addEventListener('storage', (e) => {
        if (e.key === 'latest_audit_updated') {
            loadDashboard();
        }
    });
}

/** Show a loading indicator on all stat cards while fetching */
function setLoadingState() {
    ['averageSeo', 'auditCount', 'averageContent', 'averageHealth'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = '…';
            el.style.opacity = '0.5';
        }
    });
}

/** Set a card to — for unavailable/null scores */
function setUnavailable(element) {
    if (!element) return;
    element.style.opacity = '1';
    element.textContent = '—';
}

/** Animate a numeric counter from 0 → target */
function animateCounter(element, target) {
    if (!element) return;
    const num = Number(target);
    if (isNaN(num) || num < 0) {
        element.style.opacity = '1';
        element.textContent = isNaN(num) ? '—' : '0';
        return;
    }
    if (num === 0) {
        element.style.opacity = '1';
        element.textContent = '0';
        return;
    }
    element.style.opacity = '1';
    element.textContent = '0';
    let current = 0;
    const step = Math.max(1, Math.ceil(num / 30));
    const interval = setInterval(() => {
        current = Math.min(current + step, num);
        element.textContent = current;
        if (current >= num) clearInterval(interval);
    }, 25);
}

/** Display an error banner instead of a blank screen */
function showErrorBanner(message) {
    const banner = document.getElementById('dashboardErrorBanner');
    const msgEl = document.getElementById('dashboardErrorMessage');
    if (banner && msgEl) {
        msgEl.textContent = message || 'Unable to connect to the backend database.';
        banner.classList.remove('d-none');
        banner.classList.add('d-flex');
    }
}

function hideErrorBanner() {
    const banner = document.getElementById('dashboardErrorBanner');
    if (banner) {
        banner.classList.add('d-none');
        banner.classList.remove('d-flex');
    }
}

/** Show clean empty error state */
function setErrorState(errorMessage) {
    showErrorBanner(errorMessage);
    ['averageSeo', 'averageContent', 'averageHealth'].forEach(id => {
        setUnavailable(document.getElementById(id));
    });
    const countEl = document.getElementById('auditCount');
    if (countEl) {
        countEl.style.opacity = '1';
        countEl.textContent = '0';
    }
    const emptyStateEl = document.getElementById('emptyDashboardState');
    const activeContentEl = document.getElementById('activeDashboardContent');
    if (emptyStateEl) emptyStateEl.classList.remove('d-none');
    if (activeContentEl) activeContentEl.classList.add('d-none');
}

/** Main dashboard loader */
async function loadDashboard() {
    if (isDashboardLoading) return;
    isDashboardLoading = true;
    hideErrorBanner();

    const userId = localStorage.getItem('user_id');
    const emptyStateEl = document.getElementById('emptyDashboardState');
    const activeContentEl = document.getElementById('activeDashboardContent');

    // If unauthenticated: display zero/empty state
    if (!userId || userId === 'null' || userId === 'undefined') {
        const auditEl = document.getElementById('auditCount');
        if (auditEl) auditEl.textContent = '0';
        ['averageSeo', 'averageContent', 'averageHealth'].forEach(id => {
            setUnavailable(document.getElementById(id));
        });
        if (emptyStateEl) emptyStateEl.classList.remove('d-none');
        if (activeContentEl) activeContentEl.classList.add('d-none');
        isDashboardLoading = false;
        return;
    }

    try {
        // 1. Fetch real dashboard stats from backend
        const statsData = await fetchAPI(`/stats?user_id=${encodeURIComponent(userId)}`, { timeout: 15000 });
        
        if (!statsData.success) throw new Error(statsData.message || 'Stats could not be loaded.');

        const stats = statsData.data || {};
        const count = stats.audit_count ?? 0;

        // Update Audits Run card
        const auditEl = document.getElementById('auditCount');
        if (auditEl) {
            if (count === 0) {
                auditEl.textContent = '0';
                auditEl.style.opacity = '1';
            } else {
                animateCounter(auditEl, count);
            }
        }

        // Update 3 Score Cards
        const scoreFields = [
            { id: 'averageSeo',     key: 'average_seo' },
            { id: 'averageContent', key: 'average_content' },
            { id: 'averageHealth',  key: 'average_health' }
        ];

        scoreFields.forEach(({ id, key }) => {
            const el = document.getElementById(id);
            const val = stats[key];
            if (val === null || val === undefined || count === 0) {
                setUnavailable(el);
            } else {
                animateCounter(el, val);
            }
        });

        // 2. Manage Empty State vs Active Dashboard Content
        if (count === 0) {
            if (emptyStateEl) emptyStateEl.classList.remove('d-none');
            if (activeContentEl) activeContentEl.classList.add('d-none');
            lastLoadedTimestamp = Date.now();
            isDashboardLoading = false;
            return;
        }

        if (emptyStateEl) emptyStateEl.classList.add('d-none');
        if (activeContentEl) activeContentEl.classList.remove('d-none');

        // 3. Populate Active Dashboard with Genuine Data in Parallel
        await Promise.allSettled([
            loadLatestAuditData(userId),
            loadRecentAuditsAndChart(userId),
            loadAiActionItems(userId)
        ]);

        lastLoadedTimestamp = Date.now();

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        setErrorState(error.message || 'Could not load saved dashboard data. Please verify your backend server.');
    } finally {
        isDashboardLoading = false;
    }
}

/** Quick Audit directly from the Dashboard */
async function handleDashboardAudit() {
    const input = document.getElementById('dashboardAuditUrl');
    const submitBtn = document.getElementById('dashboardAuditBtn');
    const progressContainer = document.getElementById('dashboardAuditProgress');
    const progressBar = document.getElementById('dashboardAuditProgressBar');
    const statusText = document.getElementById('dashboardAuditStatusText');
    const percentText = document.getElementById('dashboardAuditPercent');

    if (!input) return;
    let url = input.value.trim();

    if (!url) {
        if (typeof showNotification === 'function') {
            showNotification('Please enter a valid website URL.', 'warning');
        }
        return;
    }

    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try {
        new URL(url);
    } catch {
        if (typeof showNotification === 'function') {
            showNotification('Please enter a valid URL (e.g. https://example.com)', 'warning');
        }
        return;
    }
    input.value = url;

    const userId = localStorage.getItem('user_id');
    if (!userId || userId === 'null' || userId === 'undefined') {
        if (typeof showNotification === 'function') {
            showNotification('Please sign in to run and save website audits.', 'warning');
        }
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    // UI Loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Auditing...';
    }
    if (progressContainer) progressContainer.classList.remove('d-none');
    
    let progress = 15;
    const progressInterval = setInterval(() => {
        progress = Math.min(progress + 15, 90);
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (percentText) percentText.textContent = `${progress}%`;
        if (statusText) {
            if (progress >= 70) statusText.innerHTML = '<span class="spinner-border spinner-border-sm me-2 text-primary"></span>Evaluating page health and performance...';
            else if (progress >= 40) statusText.innerHTML = '<span class="spinner-border spinner-border-sm me-2 text-primary"></span>Inspecting meta tags, headings, and links...';
        }
    }, 700);

    try {
        const response = await fetchAPI('/analyze', {
            method: 'POST',
            body: JSON.stringify({ url: url, user_id: userId }),
            timeout: 30000
        });

        clearInterval(progressInterval);
        if (progressBar) progressBar.style.width = '100%';
        if (percentText) percentText.textContent = '100%';

        if (response.success) {
            localStorage.setItem('latest_audit_updated', Date.now().toString());
            if (typeof showNotification === 'function') {
                showNotification(`Audit complete for ${url}! Dashboard updated.`, 'success');
            }
            input.value = '';
            
            // Automatically refresh the dashboard without manual reload
            await loadDashboard();
        } else {
            throw new Error(response.message || 'Audit could not be completed.');
        }

    } catch (err) {
        clearInterval(progressInterval);
        console.error('Audit failed:', err);
        if (typeof showNotification === 'function') {
            showNotification(err.message || 'Failed to complete audit.', 'danger');
        }
    } finally {
        clearInterval(progressInterval);
        if (progressContainer) progressContainer.classList.add('d-none');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-lightning-charge me-1"></i> Run Audit';
        }
    }
}

/** Load Latest Audit: Overview Card, Detailed Breakdown, and Issues Grouped by Severity */
async function loadLatestAuditData(userId) {
    try {
        const json = await fetchAPI(`/latest-audit?user_id=${encodeURIComponent(userId)}`, { timeout: 15000 });
        if (!json.success || !json.data) return;

        const audit = json.data;
        const checks = audit.checks || {};

        // 1. Overview Card
        const urlEl = document.getElementById('latestAuditUrl');
        if (urlEl) urlEl.textContent = audit.url || '—';

        const dateEl = document.getElementById('latestAuditDate');
        if (dateEl) {
            if (audit.created_at) {
                const dt = new Date(audit.created_at);
                dateEl.textContent = isNaN(dt) ? audit.created_at : `Audited on ${dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
            } else {
                dateEl.textContent = 'Latest completed audit';
            }
        }

        const meter = document.getElementById('latestScoreMeter');
        const scoreVal = document.getElementById('latestScoreVal');
        const seoScore = audit.seo_score ?? 0;
        
        if (meter) {
            meter.style.setProperty('--score', seoScore);
            meter.className = 'score-meter';
            if (seoScore >= 80) meter.classList.add('good');
        }
        if (scoreVal) scoreVal.textContent = seoScore;

        const contentEl = document.getElementById('latestContentScore');
        if (contentEl) contentEl.textContent = audit.content_score != null ? `${audit.content_score}/100` : '—';

        const healthEl = document.getElementById('latestHealthScore');
        if (healthEl) healthEl.textContent = audit.health_score != null ? `${audit.health_score}/100` : '—';

        const wordEl = document.getElementById('latestWordCount');
        if (wordEl) wordEl.textContent = audit.word_count != null ? `${audit.word_count.toLocaleString()} words` : '—';

        // 2. Detailed Breakdown Cards (Redesigned with Standard Structure)
        // Title Tag
        const titleStatus = document.getElementById('latestTitleStatus');
        const titleSnippet = document.getElementById('latestTitleSnippet');
        const titleLength = document.getElementById('latestTitleLength');
        const titleBar = document.getElementById('latestTitleBar');
        const hasTitle = Boolean(checks.title_present && audit.title);
        const tLen = (audit.title || '').length;

        if (titleSnippet) {
            titleSnippet.textContent = audit.title || 'No title tag found';
            titleSnippet.setAttribute('title', audit.title || 'No title tag found');
        }
        if (titleLength) {
            titleLength.textContent = tLen > 0 ? `${tLen} characters ${tLen >= 50 && tLen <= 60 ? '(Optimal)' : ''}` : '0 characters';
        }
        if (titleBar) {
            const pct = Math.min(100, Math.max(5, Math.round((tLen / 80) * 100)));
            titleBar.style.width = `${pct}%`;
            titleBar.style.background = (tLen >= 45 && tLen <= 65) ? '#22C55E' : (tLen > 0 ? '#F59E0B' : '#EF4444');
        }
        if (titleStatus) {
            if (hasTitle && tLen >= 40 && tLen <= 70) {
                titleStatus.className = 'mb-status-pill mb-pill-good';
                titleStatus.textContent = 'Good';
            } else if (!hasTitle) {
                titleStatus.className = 'mb-status-pill mb-pill-danger';
                titleStatus.textContent = 'Needs work';
            } else {
                titleStatus.className = 'mb-status-pill mb-pill-warning';
                titleStatus.textContent = 'Needs work';
            }
        }

        // Meta Description
        const metaStatus = document.getElementById('latestMetaStatus');
        const metaSnippet = document.getElementById('latestMetaSnippet');
        const metaLength = document.getElementById('latestMetaLength');
        const metaBar = document.getElementById('latestMetaBar');
        const hasMeta = Boolean(checks.meta_present && audit.meta_description);
        const mLen = (audit.meta_description || '').length;

        if (metaSnippet) {
            metaSnippet.textContent = audit.meta_description || 'No meta description found';
            metaSnippet.setAttribute('title', audit.meta_description || 'No meta description found');
        }
        if (metaLength) {
            metaLength.textContent = mLen > 0 ? `${mLen} characters ${mLen >= 120 && mLen <= 160 ? '(Optimal)' : ''}` : '0 characters';
        }
        if (metaBar) {
            const mPct = Math.min(100, Math.max(5, Math.round((mLen / 200) * 100)));
            metaBar.style.width = `${mPct}%`;
            metaBar.style.background = (mLen >= 120 && mLen <= 160) ? '#22C55E' : '#F59E0B';
        }
        if (metaStatus) {
            if (hasMeta && mLen >= 120 && mLen <= 160) {
                metaStatus.className = 'mb-status-pill mb-pill-good';
                metaStatus.textContent = 'Good';
            } else if (hasMeta && mLen > 160 && mLen <= 180) {
                metaStatus.className = 'mb-status-pill mb-pill-warning';
                metaStatus.textContent = 'Slightly long';
            } else if (!hasMeta) {
                metaStatus.className = 'mb-status-pill mb-pill-danger';
                metaStatus.textContent = 'Needs work';
            } else {
                metaStatus.className = 'mb-status-pill mb-pill-warning';
                metaStatus.textContent = 'Needs work';
            }
        }

        // Headings Hierarchy
        const h1Badge = document.getElementById('latestH1Badge');
        const h1Count = document.getElementById('latestH1Count');
        const h2Count = document.getElementById('latestH2Count');
        const h3Count = document.getElementById('latestH3Count');
        const headingSummary = document.getElementById('latestHeadingSummary');
        const countH1 = audit.h1_count ?? 0;
        const countH2 = audit.h2_count ?? 0;

        if (h1Count) {
            h1Count.textContent = audit.h1_count != null ? audit.h1_count : 'N/A';
            if (countH1 > 1 || countH1 === 0) {
                h1Count.classList.add('mb-stat-warn');
            } else {
                h1Count.classList.remove('mb-stat-warn');
            }
        }
        if (h2Count) {
            h2Count.textContent = audit.h2_count != null ? audit.h2_count : 'N/A';
            if (countH2 === 0) {
                h2Count.classList.add('mb-stat-warn');
            } else {
                h2Count.classList.remove('mb-stat-warn');
            }
        }
        if (h3Count) {
            h3Count.textContent = audit.h3_count != null ? audit.h3_count : 'N/A';
        }

        if (h1Badge) {
            if (countH1 === 1) {
                h1Badge.className = 'mb-status-pill mb-pill-good';
                h1Badge.textContent = 'Good';
            } else if (countH1 === 0) {
                h1Badge.className = 'mb-status-pill mb-pill-danger';
                h1Badge.textContent = 'Needs work';
            } else {
                h1Badge.className = 'mb-status-pill mb-pill-warning';
                h1Badge.textContent = 'Needs work';
            }
        }
        if (headingSummary) {
            headingSummary.textContent = countH1 > 1 
                ? `${countH1} H1 tags: use only one` 
                : (countH1 === 0 ? 'Missing primary H1 tag' : '1 H1 tag (Optimal hierarchy)');
        }

        // Images & ALT Tags
        const altBadge = document.getElementById('latestAltBadge');
        const imgTotal = document.getElementById('latestImageTotal');
        const altRatio = document.getElementById('latestAltRatio');
        const altBarGood = document.getElementById('latestAltBarGood');
        const altBarWarn = document.getElementById('latestAltBarWarn');
        const altWithCount = document.getElementById('latestAltWithCount');
        const altMissingCount = document.getElementById('latestAltMissingCount');
        const totalImgs = audit.image_count ?? 0;
        const withAlt = audit.images_with_alt ?? 0;
        const missingAlt = Math.max(0, totalImgs - withAlt);

        if (imgTotal) imgTotal.textContent = totalImgs;
        if (altBarGood && altBarWarn) {
            if (totalImgs > 0) {
                const goodPct = Math.round((withAlt / totalImgs) * 100);
                altBarGood.style.width = `${goodPct}%`;
                altBarWarn.style.width = `${100 - goodPct}%`;
            } else {
                altBarGood.style.width = '100%';
                altBarWarn.style.width = '0%';
            }
        }
        if (altWithCount) altWithCount.textContent = `${withAlt} with ALT`;
        if (altMissingCount) altMissingCount.textContent = `${missingAlt} missing`;
        if (altRatio) {
            altRatio.textContent = totalImgs > 0 
                ? `${withAlt} with ALT / ${missingAlt} missing` 
                : 'No images detected';
        }
        if (altBadge) {
            if (totalImgs === 0) {
                altBadge.className = 'mb-status-pill mb-pill-info';
                altBadge.textContent = 'Info';
            } else if (missingAlt === 0) {
                altBadge.className = 'mb-status-pill mb-pill-good';
                altBadge.textContent = 'Good';
            } else {
                altBadge.className = 'mb-status-pill mb-pill-warning';
                altBadge.textContent = 'Needs work';
            }
        }

        // Link Architecture
        const internalEl = document.getElementById('latestInternalCount');
        const externalEl = document.getElementById('latestExternalCount');
        const linksTotal = document.getElementById('latestLinksTotal');
        const linksBadge = document.getElementById('latestLinksBadge');
        const intLinks = audit.internal_links ?? 0;
        const extLinks = audit.external_links ?? 0;

        if (internalEl) internalEl.textContent = audit.internal_links != null ? audit.internal_links : 'N/A';
        if (externalEl) externalEl.textContent = audit.external_links != null ? audit.external_links : 'N/A';
        if (linksTotal) {
            linksTotal.textContent = `${(intLinks + extLinks).toLocaleString()} total links detected`;
        }
        if (linksBadge) {
            if (intLinks >= 3) {
                linksBadge.className = 'mb-status-pill mb-pill-good';
                linksBadge.textContent = 'Good';
            } else if (intLinks === 0) {
                linksBadge.className = 'mb-status-pill mb-pill-warning';
                linksBadge.textContent = 'Needs work';
            } else {
                linksBadge.className = 'mb-status-pill mb-pill-info';
                linksBadge.textContent = 'Info';
            }
        }

        // Technical Health & Mobile
        const httpsBadge = document.getElementById('latestHttpsBadge');
        const viewportText = document.getElementById('latestViewportText');
        const wordNumber = document.getElementById('latestWordCountNumber');
        const httpsStatusText = document.getElementById('latestHttpsStatusText');
        const wordSummary = document.getElementById('latestWordCountSummary');
        const isHttps = Boolean(checks.is_https);
        const hasViewport = Boolean(checks.has_viewport);
        const wordCount = audit.word_count ?? 0;

        if (viewportText) {
            viewportText.innerHTML = hasViewport 
                ? '<i class="bi bi-check-circle-fill text-success"></i> <span>Mobile-friendly</span>' 
                : '<i class="bi bi-x-circle-fill text-danger"></i> <span>No Viewport Meta</span>';
        }
        if (wordNumber) {
            wordNumber.textContent = wordCount.toLocaleString();
        }
        if (httpsStatusText) {
            httpsStatusText.innerHTML = isHttps 
                ? '<i class="bi bi-lock-fill text-success me-1"></i>HTTPS Active' 
                : '<i class="bi bi-unlock-fill text-danger me-1"></i>Insecure HTTP';
        }
        if (wordSummary) {
            wordSummary.innerHTML = `<span>${isHttps ? '<i class="bi bi-lock-fill text-success me-1"></i>HTTPS Active' : '<i class="bi bi-unlock-fill text-danger me-1"></i>HTTP'}</span><span>${hasViewport ? 'Responsive Viewport' : 'Missing Viewport'}</span>`;
        }
        if (httpsBadge) {
            if (isHttps && hasViewport) {
                httpsBadge.className = 'mb-status-pill mb-pill-good';
                httpsBadge.textContent = 'Good';
            } else if (!isHttps) {
                httpsBadge.className = 'mb-status-pill mb-pill-danger';
                httpsBadge.textContent = 'Needs work';
            } else {
                httpsBadge.className = 'mb-status-pill mb-pill-warning';
                httpsBadge.textContent = 'Needs work';
            }
        }

        // 3. Render SEO Issues Grouped by Severity (Requirement 2)
        renderSeoIssuesBySeverity(audit);

    } catch (err) {
        console.error('Failed to load latest audit details:', err);
    }
}

/** Group crawl issues into Critical, Warning, and Informational / Passed */
function renderSeoIssuesBySeverity(audit) {
    const container = document.getElementById('seoIssuesContainer');
    const criticalPill = document.getElementById('criticalIssuesBadge');
    const warningPill = document.getElementById('warningIssuesBadge');
    const passedPill = document.getElementById('passedIssuesBadge');
    if (!container) return;

    const checks = audit.checks || {};
    const critical = [];
    const warnings = [];
    const passed = [];

    // Evaluate Critical
    if (!checks.title_present) {
        critical.push({
            title: 'Missing Title Tag',
            desc: 'The page has no <title> tag, preventing search engines from displaying a clickable headline.',
            fix: 'Fix: add a unique, descriptive <title> tag between 50–60 characters in <head>'
        });
    }
    if (!checks.h1_present || (audit.h1_count ?? 0) === 0) {
        critical.push({
            title: 'Missing Primary H1 Tag',
            desc: 'No <h1> tag was found. H1 signals the core subject of the page to search crawlers.',
            fix: 'Fix: add a single <h1> heading clearly describing the primary page topic'
        });
    }
    if (!checks.is_https) {
        critical.push({
            title: 'Insecure Connection (No HTTPS)',
            desc: 'The website is served over HTTP instead of HTTPS, triggering browser security warnings.',
            fix: 'Fix: install an SSL/TLS certificate and configure 301 redirects to HTTPS'
        });
    }

    // Evaluate Warnings
    if (!checks.meta_present) {
        warnings.push({
            title: 'Missing Meta Description',
            desc: 'No meta description detected. Search engines will auto-generate snippets which may lower CTR.',
            fix: 'Fix: add a compelling meta description tag between 150–160 characters in <head>'
        });
    }
    const totalImgs = audit.image_count ?? 0;
    const withAlt = audit.images_with_alt ?? 0;
    const missingAlt = Math.max(0, totalImgs - withAlt);
    if (missingAlt > 0) {
        warnings.push({
            title: `${missingAlt} Image(s) Missing ALT Text`,
            desc: 'Images lack alternative text, which reduces accessibility and image search traffic.',
            fix: 'Fix: add descriptive alt attributes to all <img> tags'
        });
    }
    if ((audit.word_count ?? 0) < 300) {
        warnings.push({
            title: `Low Word Count (${audit.word_count ?? 0} words)`,
            desc: 'Page contains under 300 words. Search engines may consider this thin content.',
            fix: 'Fix: expand page body content to at least 300 words with topical depth'
        });
    }
    if ((audit.internal_links ?? 0) === 0) {
        warnings.push({
            title: 'No Internal Links Found',
            desc: 'Zero internal links detected. Internal linking is crucial for PageRank distribution.',
            fix: 'Fix: add contextual internal links pointing to relevant pages and resources'
        });
    }
    if ((audit.h1_count ?? 0) > 1) {
        warnings.push({
            title: `Multiple H1 Tags Detected (${audit.h1_count})`,
            desc: 'Best practice recommends exactly one H1 per page to prevent topic dilution.',
            fix: 'Fix: keep one H1 and demote the others to H2'
        });
    }

    // Evaluate Passed
    if (checks.is_https) {
        passed.push({
            title: 'HTTPS Encryption Active',
            desc: 'Valid SSL configuration ensures secure visitor connections.'
        });
    }
    if (checks.has_viewport) {
        passed.push({
            title: 'Mobile Viewport Configured',
            desc: 'Viewport meta tag is active for responsive mobile rendering.'
        });
    }
    if (checks.title_present && audit.title) {
        passed.push({
            title: 'Title Tag Present',
            desc: `Configured headline: "${audit.title}"`
        });
    }
    if ((audit.h1_count ?? 0) === 1) {
        passed.push({
            title: 'Single H1 Heading Present',
            desc: 'Proper heading structure facilitates search engine page comprehension.'
        });
    }
    if ((audit.word_count ?? 0) >= 500) {
        passed.push({
            title: 'Substantial Content Length',
            desc: `${audit.word_count} words provides strong keyword and topical coverage.`
        });
    }

    // Update severity pill buttons with real counts
    if (criticalPill) {
        const textSpan = criticalPill.querySelector('.issue-pill-text');
        if (textSpan) textSpan.textContent = `${critical.length} Critical`;
        else criticalPill.innerHTML = `<span class="issue-pill-dot"></span><span class="issue-pill-text">${critical.length} Critical</span>`;
    }
    if (warningPill) {
        const textSpan = warningPill.querySelector('.issue-pill-text');
        if (textSpan) textSpan.textContent = `${warnings.length} Warnings`;
        else warningPill.innerHTML = `<span class="issue-pill-dot"></span><span class="issue-pill-text">${warnings.length} Warnings</span>`;
    }
    if (passedPill) {
        const textSpan = passedPill.querySelector('.issue-pill-text');
        if (textSpan) textSpan.textContent = `${passed.length} Passed`;
        else passedPill.innerHTML = `<span class="issue-pill-dot"></span><span class="issue-pill-text">${passed.length} Passed</span>`;
    }

    function renderRow(item, severity, iconClass, badgeText) {
        return `
            <div class="issue-row issue-row-${severity}">
                <div class="issue-icon-wrap">
                    <i class="bi ${iconClass}"></i>
                </div>
                <div class="issue-content-wrap">
                    <div class="issue-title">${escapeHtml(item.title)}</div>
                    <div class="issue-desc">${escapeHtml(item.desc)}</div>
                    ${item.fix ? `<div class="issue-fix">${escapeHtml(item.fix)}</div>` : ''}
                </div>
                <div class="issue-badge-wrap">
                    <span class="issue-severity-badge issue-badge-${severity}">${badgeText}</span>
                </div>
            </div>
        `;
    }

    let groupsHtml = '';

    // Critical group (hidden if 0 items)
    if (critical.length > 0) {
        const criticalRows = critical.map(item => renderRow(item, 'critical', 'bi-x-circle-fill', 'CRITICAL')).join('');
        groupsHtml += `
            <div class="issue-group" id="group-critical" data-severity="critical">
                <div class="issue-group-header critical-group-header">
                    <span>Critical (${critical.length})</span>
                </div>
                <div class="issue-group-items">
                    ${criticalRows}
                </div>
            </div>
        `;
    }

    // Warnings group (hidden if 0 items, stays expanded)
    if (warnings.length > 0) {
        const warningRows = warnings.map(item => renderRow(item, 'warning', 'bi-exclamation-triangle-fill', 'WARNING')).join('');
        groupsHtml += `
            <div class="issue-group" id="group-warning" data-severity="warning">
                <div class="issue-group-header warning-group-header">
                    <span>Warnings (${warnings.length})</span>
                </div>
                <div class="issue-group-items">
                    ${warningRows}
                </div>
            </div>
        `;
    }

    // Passed group (hidden if 0 items, collapsible and collapsed by default)
    if (passed.length > 0) {
        const passedRows = passed.map(item => renderRow(item, 'passed', 'bi-check-circle-fill', 'PASSED')).join('');
        groupsHtml += `
            <div class="issue-group" id="group-passed" data-severity="passed">
                <div class="issue-group-header passed-group-header">
                    <span>Passed (${passed.length})</span>
                </div>
                <button type="button" class="passed-toggle-btn" id="passedToggleBtn" aria-expanded="false" aria-controls="passedCollapsible">
                    <i class="bi bi-chevron-down" id="passedToggleIcon"></i>
                    <span id="passedToggleText">Show ${passed.length} passed checks</span>
                </button>
                <div class="passed-collapsible-wrapper collapsed" id="passedCollapsible">
                    <div class="issue-group-items">
                        ${passedRows}
                    </div>
                </div>
            </div>
        `;
    }

    if (!groupsHtml) {
        groupsHtml = '<div class="text-center text-muted py-4 small">All audit checks evaluated without issue.</div>';
    }

    container.innerHTML = groupsHtml;

    // Attach Collapsible toggle for Passed checks
    const passedToggleBtn = document.getElementById('passedToggleBtn');
    const passedCollapsible = document.getElementById('passedCollapsible');
    const passedToggleIcon = document.getElementById('passedToggleIcon');
    const passedToggleText = document.getElementById('passedToggleText');

    if (passedToggleBtn && passedCollapsible) {
        passedToggleBtn.addEventListener('click', () => {
            const isCurrentlyCollapsed = passedCollapsible.classList.contains('collapsed');
            if (isCurrentlyCollapsed) {
                passedCollapsible.classList.remove('collapsed');
                passedCollapsible.classList.add('expanded');
                passedToggleBtn.setAttribute('aria-expanded', 'true');
                if (passedToggleIcon) passedToggleIcon.className = 'bi bi-chevron-up';
                if (passedToggleText) passedToggleText.textContent = `Hide ${passed.length} passed checks`;
            } else {
                passedCollapsible.classList.remove('expanded');
                passedCollapsible.classList.add('collapsed');
                passedToggleBtn.setAttribute('aria-expanded', 'false');
                if (passedToggleIcon) passedToggleIcon.className = 'bi bi-chevron-down';
                if (passedToggleText) passedToggleText.textContent = `Show ${passed.length} passed checks`;
            }
        });
    }

    // Interactive clickable severity filters
    let currentFilter = null;

    function setFilter(selectedSeverity) {
        if (currentFilter === selectedSeverity) {
            currentFilter = null; // Toggle off to show all
        } else {
            currentFilter = selectedSeverity;
        }

        [
            { el: criticalPill, sev: 'critical' },
            { el: warningPill, sev: 'warning' },
            { el: passedPill, sev: 'passed' }
        ].forEach(({ el, sev }) => {
            if (!el) return;
            const isActive = currentFilter === sev;
            el.classList.toggle('active', isActive);
            el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        const allGroups = container.querySelectorAll('.issue-group');
        allGroups.forEach(grp => {
            const grpSev = grp.getAttribute('data-severity');
            if (!currentFilter || currentFilter === grpSev) {
                grp.classList.remove('d-none');
                // Auto-expand passed checks if explicitly filtered
                if (currentFilter === 'passed' && grpSev === 'passed' && passedCollapsible) {
                    passedCollapsible.classList.remove('collapsed');
                    passedCollapsible.classList.add('expanded');
                    if (passedToggleBtn) passedToggleBtn.setAttribute('aria-expanded', 'true');
                    if (passedToggleIcon) passedToggleIcon.className = 'bi bi-chevron-up';
                    if (passedToggleText) passedToggleText.textContent = `Hide ${passed.length} passed checks`;
                }
            } else {
                grp.classList.add('d-none');
            }
        });
    }

    if (criticalPill) criticalPill.onclick = () => setFilter('critical');
    if (warningPill) warningPill.onclick = () => setFilter('warning');
    if (passedPill) passedPill.onclick = () => setFilter('passed');
}

/** Load Recent Audits Table & Trend Chart */
async function loadRecentAuditsAndChart(userId) {
    try {
        const json = await fetchAPI(`/history?user_id=${encodeURIComponent(userId)}`, { timeout: 15000 });
        const history = (json.success && Array.isArray(json.data)) ? json.data : [];

        const tbody = document.getElementById('recentAuditsBody');
        if (tbody) {
            if (history.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No audit records found.</td></tr>';
            } else {
                tbody.innerHTML = history.map(item => {
                    const score = item.seo_score ?? 0;
                    const badgeClass = score >= 80 ? 'bg-success-subtle text-success border border-success-subtle' :
                                       score >= 50 ? 'bg-warning-subtle text-warning border border-warning-subtle' :
                                                     'bg-danger-subtle text-danger border border-danger-subtle';
                    
                    const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

                    return `
                        <tr>
                            <td class="text-truncate" style="max-width: 200px;">
                                <i class="bi bi-globe me-2 text-primary"></i>
                                <span class="fw-medium">${escapeHtml(item.url)}</span>
                            </td>
                            <td class="text-muted small">${dateStr}</td>
                            <td><span class="badge ${badgeClass} px-2 py-1">${score}/100</span></td>
                            <td class="text-info fw-medium">${item.content_score ?? '—'}</td>
                            <td class="text-success fw-medium">${item.health_score ?? '—'}</td>
                            <td>
                                <a href="website-audit.html" class="btn btn-outline-primary btn-sm py-0 px-2" style="font-size: 0.8rem;">
                                    View
                                </a>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        // Render Trend Chart with real historical data
        renderDashboardTrendChart(history);

    } catch (err) {
        console.error('Failed to load recent audits or chart:', err);
    }
}

/** Render performance trend chart using ChartFactory */
function renderDashboardTrendChart(history) {
    const canvas = document.getElementById('dashboardTrendChart');
    if (!canvas || typeof ChartFactory === 'undefined') return;

    if (dashboardTrendChartInstance) {
        dashboardTrendChartInstance.destroy();
        dashboardTrendChartInstance = null;
    }

    if (!history || history.length === 0) return;

    // Oldest on the left, newest on the right
    const sorted = [...history].reverse();
    const labels = sorted.map((d, index) => {
        if (d.date) {
            const dt = new Date(d.date);
            return isNaN(dt) ? `Audit #${index + 1}` : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return `Audit #${index + 1}`;
    });

    const seoScores = sorted.map(d => d.seo_score ?? 0);
    const contentScores = sorted.map(d => d.content_score ?? 0);
    const healthScores = sorted.map(d => d.health_score ?? 0);

    dashboardTrendChartInstance = ChartFactory.createTrendChart('dashboardTrendChart', labels, [
        { label: 'SEO Score', data: seoScores, color: '#4F46E5' },
        { label: 'Content Score', data: contentScores, color: '#06B6D4' },
        { label: 'Health Score', data: healthScores, color: '#22C55E' }
    ]);
}

/** Load AI Action items from genuine latest recommendations */
async function loadAiActionItems(userId) {
    const container = document.getElementById('dashboardAiInsightsList');
    const badge = document.getElementById('aiTasksBadge');
    if (!container) return;

    try {
        const json = await fetchAPI(`/recommendations?user_id=${encodeURIComponent(userId)}`, { timeout: 15000 });

        if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-3 small">
                    <i class="bi bi-check2-circle text-success fs-3 d-block mb-2"></i>
                    All core audit checks passed! No urgent issues detected.
                </div>
            `;
            if (badge) badge.textContent = '0 Tasks';
            return;
        }

        const items = json.data;
        if (badge) badge.textContent = `${items.length} Tasks`;

        // Render top 3 recommendations
        container.innerHTML = items.slice(0, 3).map(rec => {
            const isHigh = rec.priority === 'high';
            const isMed = rec.priority === 'med';
            const borderColor = isHigh ? 'rgba(239, 68, 68, 0.25)' : (isMed ? 'rgba(245, 158, 11, 0.25)' : 'rgba(79, 70, 229, 0.25)');
            const bgColor = isHigh ? 'rgba(239, 68, 68, 0.05)' : (isMed ? 'rgba(245, 158, 11, 0.05)' : 'rgba(79, 70, 229, 0.05)');
            const iconColor = isHigh ? 'text-danger' : (isMed ? 'text-warning' : 'text-primary');
            const icon = isHigh ? 'bi-exclamation-octagon' : (rec.category === 'technical' ? 'bi-gear' : 'bi-magic');

            return `
                <div class="insight-item mb-2 p-3 rounded" style="background: ${bgColor}; border: 1px solid ${borderColor};">
                    <div class="d-flex gap-3 align-items-start">
                        <i class="bi ${icon} ${iconColor} fs-5 mt-1"></i>
                        <div>
                            <div class="d-flex align-items-center gap-2 mb-1">
                                <h6 class="mb-0 fw-semibold fs-6">${escapeHtml(rec.title || 'SEO Recommendation')}</h6>
                                <span class="badge ${isHigh ? 'bg-danger' : 'bg-warning text-dark'} py-0 px-2 small">${rec.priority ? rec.priority.toUpperCase() : 'TASK'}</span>
                            </div>
                            <p class="mb-0 text-muted small">${escapeHtml(rec.action || rec.desc || '')}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Failed to load AI action items:', err);
        container.innerHTML = '<div class="text-center text-muted py-3 small">Recommendations will generate upon your next completed audit.</div>';
    }
}

/** Utility: Escape HTML */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}