/* ============================================
   BABYMONSTER HUB — Main JavaScript
   Handles: data loading, filtering, navigation
   ============================================ */

const ITEMS_PER_PAGE = 10;
let allNews = [];
let displayedCount = 0;
let currentFilter = 'all';

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    loadNewsData();
    setupNavigation();
    setupFilters();
    startCountdown();
    setupGalleryFilters();
});

// === LOAD NEWS DATA ===
async function loadNewsData() {
    try {
        const response = await fetch('data/news.json');
        if (!response.ok) throw new Error('Failed to load news data');
        const data = await response.json();

        allNews = data.articles || [];
        const quickUpdates = data.quick_updates || [];
        const trending = data.trending || '';
        const lastUpdated = data.last_updated || '';
        const gallery = data.gallery || [];

        // Update trending banner
        if (trending) {
            document.getElementById('trending-text').textContent = trending;
        }

        // Update last updated
        if (lastUpdated) {
            document.getElementById('last-updated').textContent = `Updated: ${formatDate(lastUpdated)}`;
        }

        // Update article count
        document.getElementById('stat-articles').textContent = allNews.length;

        // Render news
        renderNews();

        // Render quick updates
        renderQuickUpdates(quickUpdates);

        // Render gallery
        renderGallery(gallery);

    } catch (err) {
        console.error('Error loading news:', err);
        document.getElementById('news-container').innerHTML = `
            <div class="loading-spinner">
                <p>Could not load latest updates. Please try again later.</p>
            </div>
        `;
    }
}

// === RENDER NEWS CARDS ===
function renderNews() {
    const container = document.getElementById('news-container');
    const filtered = currentFilter === 'all'
        ? allNews
        : allNews.filter(a => a.source.toLowerCase().includes(currentFilter));

    if (filtered.length === 0) {
        container.innerHTML = `<div class="loading-spinner"><p>No updates found for this filter.</p></div>`;
        document.getElementById('load-more').style.display = 'none';
        return;
    }

    const toShow = filtered.slice(0, displayedCount + ITEMS_PER_PAGE);
    displayedCount = toShow.length;

    let html = '<div class="news-cards">';
    for (const article of toShow) {
        html += buildNewsCard(article);
    }
    html += '</div>';

    container.innerHTML = html;

    // Show/hide load more
    const loadMoreBtn = document.getElementById('load-more');
    if (displayedCount < filtered.length) {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.onclick = () => {
            renderNews();
        };
    } else {
        loadMoreBtn.style.display = 'none';
    }
}

function buildNewsCard(article) {
    const badgeClass = `badge-${article.source.toLowerCase().replace(/[\s\/]/g, '').replace('x', 'twitter')}`;
    const imageHtml = article.image
        ? `<img src="${escapeHtml(article.image)}" alt="${escapeHtml(article.title)}" loading="lazy">`
        : `<img src="images/bm-logo.jpg" alt="BABYMONSTER" loading="lazy" style="object-fit:contain;padding:30px;background:#f5f5f5;">`;

    const memberTags = (article.members || ['Group']).map(m =>
        `<span class="member-tag">${escapeHtml(m)}</span>`
    ).join('');

    const linkText = getLinkText(article.source);

    return `
        <article class="news-card" data-source="${escapeHtml(article.source.toLowerCase())}">
            <div class="card-image">
                <span class="source-badge ${badgeClass}">${escapeHtml(article.source)}</span>
                ${imageHtml}
            </div>
            <div class="card-body">
                <div class="card-meta">
                    <span>${escapeHtml(article.date || '')}</span>
                    <span>&bull;</span>
                    ${memberTags}
                </div>
                <h3>${escapeHtml(article.title)}</h3>
                <p>${escapeHtml(article.summary)}</p>
                ${article.url ? `<a href="${escapeHtml(article.url)}" target="_blank" rel="noopener" class="read-more">${linkText} &rarr;</a>` : ''}
            </div>
        </article>
    `;
}

function getLinkText(source) {
    const s = source.toLowerCase();
    if (s.includes('youtube')) return 'Watch on YouTube';
    if (s.includes('instagram')) return 'View on Instagram';
    if (s.includes('twitter') || s.includes('x')) return 'View on X';
    if (s.includes('tiktok')) return 'Watch on TikTok';
    if (s.includes('weverse')) return 'View on Weverse';
    if (s.includes('facebook')) return 'View on Facebook';
    return 'Read More';
}

// === RENDER QUICK UPDATES ===
function renderQuickUpdates(updates) {
    const container = document.getElementById('quick-updates');
    if (!updates.length) {
        container.innerHTML = '<p class="loading-text">No recent quick updates.</p>';
        return;
    }

    container.innerHTML = updates.map(u => `
        <div class="mini-update">
            <strong>${escapeHtml(u.who)}</strong> ${escapeHtml(u.what)}
            <div class="time">${escapeHtml(u.when)}</div>
        </div>
    `).join('');
}

// === RENDER GALLERY ===
function renderGallery(gallery) {
    const grid = document.getElementById('gallery-grid');
    if (!gallery.length) {
        grid.innerHTML = '<p class="loading-text">Gallery loading with next update...</p>';
        return;
    }

    grid.innerHTML = gallery.map(item => {
        const member = (item.member || 'group').toLowerCase();
        const memberImg = ['ruka','pharita','asa','haram','rora','chiquita','ahyeon'].includes(member)
            ? `images/${member}.jpg` : '';
        const imgSrc = item.image || memberImg;
        return `
        <div class="gallery-item" data-member="${escapeHtml(member)}">
            ${imgSrc
                ? `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(item.caption || '')}" loading="lazy">`
                : `<span>${escapeHtml(item.caption || 'Photo')}</span>`
            }
        </div>`;
    }).join('');
}

// === FILTERS ===
function setupFilters() {
    document.querySelectorAll('.news-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.news-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            displayedCount = 0;
            renderNews();
        });
    });
}

function setupGalleryFilters() {
    document.querySelectorAll('.gallery-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.gallery-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.galleryFilter;

            document.querySelectorAll('.gallery-item').forEach(item => {
                if (filter === 'all' || item.dataset.member === filter) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });
}

// === NAVIGATION ===
function setupNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        navMenu.classList.toggle('open');
    });

    // Close on link click
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('open');
            navMenu.classList.remove('open');
        });
    });

    // Active state on scroll
    const sections = document.querySelectorAll('section[id], main[id]');
    const navLinks = document.querySelectorAll('.nav-menu a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 120;
            if (window.scrollY >= top) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}

// === UTILS ===
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(dateStr) {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateStr;
    }
}

// === COUNTDOWN TIMER ===
function startCountdown() {
    // BABYMONSTER 3rd Mini Album [CHOOM] — May 4, 2026 6:00 PM KST (UTC+9)
    const targetDate = new Date('2026-05-04T09:00:00Z'); // 6PM KST = 9AM UTC

    function update() {
        const now = new Date();
        let diff = targetDate - now;

        if (diff <= 0) {
            document.querySelector('.countdown-event-name').textContent = 'OUT NOW!';
            document.getElementById('cd-weeks').textContent = '0';
            document.getElementById('cd-days').textContent = '0';
            document.getElementById('cd-hours').textContent = '0';
            document.getElementById('cd-mins').textContent = '0';
            document.getElementById('cd-secs').textContent = '0';
            return;
        }

        const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
        diff -= weeks * (1000 * 60 * 60 * 24 * 7);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff -= days * (1000 * 60 * 60 * 24);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        diff -= hours * (1000 * 60 * 60);
        const mins = Math.floor(diff / (1000 * 60));
        diff -= mins * (1000 * 60);
        const secs = Math.floor(diff / 1000);

        document.getElementById('cd-weeks').textContent = weeks;
        document.getElementById('cd-days').textContent = days;
        document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('cd-mins').textContent = String(mins).padStart(2, '0');
        document.getElementById('cd-secs').textContent = String(secs).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
}
