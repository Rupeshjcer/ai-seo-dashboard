/**
 * AI SEO Growth Dashboard - Core Theme JS
 * Handles Dark Mode, Sidebar, Animations, and Shared Utilities
 */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    initScrollAnimations();
    initCounters();
});

// ==========================================
// Theme Management (Dark/Light Mode)
// ==========================================
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const htmlTag = document.documentElement;
    
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Default to dark mode if nothing saved
    const currentTheme = savedTheme || (prefersDark ? 'dark' : 'dark');
    
    htmlTag.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = htmlTag.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            htmlTag.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
            
            // Dispatch event for charts to update colors
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
        });
    }
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (!icon) return;
    
    if (theme === 'dark') {
        icon.className = 'bi bi-sun-fill';
        icon.style.color = '#F59E0B'; // Sun color
    } else {
        icon.className = 'bi bi-moon-stars-fill';
        icon.style.color = '#4F46E5'; // Moon color
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
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        observer.observe(counter);
    });
}

function animateCounter(el) {
    const target = parseFloat(el.getAttribute('data-target') || el.innerText);
    const duration = 2000; // 2 seconds
    const fps = 60;
    const increment = target / (duration / (1000 / fps));
    let current = 0;
    
    // Check if it's a decimal number or percentage
    const isDecimal = target % 1 !== 0;
    const isPercent = el.innerText.includes('%');

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
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
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
