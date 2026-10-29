/**
 * AI SEO Growth Dashboard - Core Theme JS
 * Handles Dark Mode, Sidebar, Animations, and Shared Utilities
 */

function initAll() {
    checkAuth();
    initTheme();
    initSidebar();
    initScrollAnimations();
    initCounters();
    initLogout();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
} else {
    initAll();
}

// ==========================================
// Authentication & Logout
// ==========================================
function checkAuth() {
    const userId = localStorage.getItem('user_id');
    const fullname = localStorage.getItem('fullname');
    
    if (!userId || !fullname) {
        window.location.href = 'login.html';
        return;
    }

    // Set dynamic user name (replaces hardcoded placeholder)
    const nameDisplays = document.querySelectorAll('#userNameDisplay, #userNameGreeting, #profileName');
    nameDisplays.forEach(el => {
        el.textContent = fullname;
    });

    // Update avatar initials
    const avatars = document.querySelectorAll('.user-avatar');
    const initials = fullname.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
    avatars.forEach(el => {
        el.textContent = initials;
    });
}

function initLogout() {
    // Select all logout buttons in case there are multiple (e.g. mobile vs desktop sidebar)
    const logoutBtns = document.querySelectorAll('#logoutBtn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Clear all session data, tokens, and local storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Redirect to login page
            window.location.replace('login.html'); // replace prevents navigating back
        });
    });
}

// ==========================================
// Theme Management (Dark/Light Mode)
// ==========================================
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const htmlTag = document.documentElement;
    
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Default to saved, then system preference, then dark
    const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    htmlTag.setAttribute('data-theme', currentTheme);
    updateThemeSwitch(currentTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = htmlTag.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            htmlTag.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeSwitch(newTheme);
            
            // Dispatch event for charts to update colors
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
        });
    }
}

function updateThemeSwitch(theme) {
    const icon = document.querySelector('#themeToggle .theme-switch__icon');
    const label = document.querySelector('#themeToggle .theme-switch__label');
    if (!icon) return;
    
    if (theme === 'dark') {
        icon.className = 'bi bi-moon-stars-fill theme-switch__icon';
        if (label) label.textContent = 'Dark';
    } else {
        icon.className = 'bi bi-sun-fill theme-switch__icon';
        if (label) label.textContent = 'Light';
    }
}

// ==========================================
// Sidebar Management
// ==========================================
function initSidebar() {
    const mobileToggle = document.getElementById('mobileSidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 992 && 
                !sidebar.contains(e.target) && 
                !mobileToggle.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        });
    }

    // Set active link based on current URL
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('.sidebar-link').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ==========================================
// Scroll Animations (Intersection Observer)
// ==========================================
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                // Optional: remove observer after animation triggers
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Elements to animate
    document.querySelectorAll('.glass-card, .stat-card, .animate-on-scroll').forEach(el => {
        // Only observe if it doesn't already have the class (e.g. added server-side)
        if(!el.classList.contains('fade-in-up')) {
            el.style.opacity = '0'; // Hide initially
            observer.observe(el);
        }
    });
}

// ==========================================
// Animated Counters
// ==========================================
function initCounters() {
    const counters = document.querySelectorAll('.counter-value');
    
    const observerOptions = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                runThemeCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        observer.observe(counter);
    });
}

function runThemeCounter(el) {
    if (!el) return;
    const raw = el.getAttribute('data-target') ?? el.innerText;
    const target = parseFloat(raw);
    if (isNaN(target) || target <= 0) return;
    const duration = 1500;
    const fps = 60;
    const increment = target / (duration / (1000 / fps));
    let current = 0;
    
    const isDecimal = target % 1 !== 0;
    const isPercent = (el.innerText || '').includes('%');

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            clearInterval(timer);
            current = target;
        }
        
        let displayValue = isDecimal ? current.toFixed(1) : Math.floor(current);
        if(isPercent) displayValue += '%';
        
        el.innerText = displayValue;
    }, 1000 / fps);
}

// ==========================================
// API Helper (Shared Fetch wrapper)
// ==========================================
const API_BASE = 'http://127.0.0.1:5000';

async function fetchAPI(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutMs = options.timeout || 25000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            signal: controller.signal,
            ...options
        });
        
        clearTimeout(timeoutId);
        
        let data = null;
        try {
            data = await response.json();
        } catch (e) {
            data = null;
        }

        if (!response.ok) {
            const errorMsg = (data && data.message) ? data.message : `HTTP error! status: ${response.status}`;
            throw new Error(errorMsg);
        }
        
        return data || {};
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please check if the backend service is running.');
        }
        console.error('API Fetch Error:', error);
        throw error;
    }
}

// ==========================================
// UI Helpers (Skeletons, Notifications)
// ==========================================
function toggleSkeleton(containerId, isLoading) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (isLoading) {
        // Keep original content hidden, show skeletons
        container.setAttribute('data-original-html', container.innerHTML);
        container.innerHTML = `
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-chart mt-4"></div>
        `;
    } else {
        // Restore content
        const originalHtml = container.getAttribute('data-original-html');
        if(originalHtml) {
            container.innerHTML = originalHtml;
        }
    }
}

function showNotification(message, type = 'info') {
    // Basic toast implementation
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3 shadow-lg`;
    toast.style.zIndex = '9999';
    toast.style.minWidth = '250px';
    
    // Map type to icon
    let icon = 'info-circle';
    if(type === 'success') icon = 'check-circle';
    if(type === 'warning') icon = 'exclamation-triangle';
    if(type === 'danger') icon = 'x-circle';

    toast.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi bi-${icon}-fill me-2 fs-5"></i>
            <div>${message}</div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 150);
    }, 5000);
}
