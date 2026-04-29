/**
 * Look Book Attire - Core Engine v3.0
 * Refactored for standalone admin separation and ID-based persistence.
 */

(function() {
    console.log("🌙 Look Book: Initializing...");

    let attireData = [];
    let closet = []; // Array of attire IDs
    let currentUser = null;
    let activeFilters = { gender: 'all', occasion: 'all', season: 'all' };
    let UI = {};

    function init() {
        mapUI();
        initData();
        setupEventListeners();
        
        // Auto-fill last username
        const lastUser = localStorage.getItem('lookbook_last_user');
        const userField = document.getElementById('username');
        if (lastUser && userField) userField.value = lastUser;

        // Check for active session
        const sessionUser = sessionStorage.getItem('lookbook_active_user');
        if (sessionUser) {
            currentUser = JSON.parse(sessionUser);
            // Skip splash/auth and go to main UI
            showScreen('main-interface');
            showView('discovery-view');
            renderAttire();
            updateFilterLabel();
        } else {
            // Normal splash sequence
            const skipBtn = document.getElementById('skip-splash');
            if (skipBtn) skipBtn.onclick = transitionToAuth;
            setTimeout(transitionToAuth, 3000);
        }
    }

    function mapUI() {
        UI = {
            screens: document.querySelectorAll('.screen'),
            views: document.querySelectorAll('.view'),
            navItems: document.querySelectorAll('.nav-item'),
            attireGrid: document.getElementById('attire-grid'),
            closetGrid: document.getElementById('closet-grid'),
            filterLabel: document.getElementById('current-filter-label'),
            filterModal: document.getElementById('filter-modal')
        };
    }

    function initData() {
        attireData = VaultDB.getAttires();
        try {
            const saved = localStorage.getItem('midnight_closet_preference');
            closet = saved ? JSON.parse(saved) : [];
        } catch(e) { closet = []; }
    }

    function transitionToAuth() {
        // Only show if still on splash
        const splash = document.getElementById('splash-screen');
        if (splash && splash.classList.contains('active')) {
            showScreen('auth-screen');
        }
    }

    function setupEventListeners() {
        // Auth Logic
        const guestAccess = document.getElementById('guest-access');
        const loginForm = document.getElementById('login-form');
        const logoutBtn = document.getElementById('logout-btn');

        if (guestAccess) {
            guestAccess.onclick = () => {
                currentUser = { username: 'Guest', role: 'guest' };
                handleSuccessfulLogin(false);
            };
        }

        if (loginForm) {
            loginForm.onsubmit = (e) => {
                e.preventDefault();
                const u = document.getElementById('username').value;
                const p = document.getElementById('password').value;
                const user = VaultDB.authenticate(u, p);
                
                if (user || (u && p)) {
                    currentUser = user || { username: u, role: 'user' };
                    handleSuccessfulLogin(currentUser.role === 'admin');
                } else {
                    alert("Authentication required.");
                }
            };
        }

        if (logoutBtn) {
            logoutBtn.onclick = () => {
                const f = document.getElementById('login-form');
                if (f) f.reset();
                currentUser = null;
                sessionStorage.removeItem('lookbook_active_user');
                sessionStorage.removeItem('admin_authenticated');
                showScreen('auth-screen');
            };
        }

        // Navigation Logic
        UI.navItems.forEach(item => {
            const vid = item.getAttribute('data-view');
            if (!vid) return; // Skip items that handle their own paging (like Closet/Admin)
            
            item.onclick = () => {
                showView(vid);
                UI.navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');
            };
        });

        // Filter Logic
        const filterToggle = document.getElementById('filter-toggle');
        const applyFilters = document.getElementById('apply-filters');

        if (filterToggle) filterToggle.onclick = () => UI.filterModal.classList.add('active');
        document.querySelectorAll('.close-modal').forEach(b => {
            b.onclick = () => b.closest('.modal').classList.remove('active');
        });

        document.querySelectorAll('.chip').forEach(c => {
            c.onclick = () => {
                const s = c.parentElement.getAttribute('data-filter');
                document.querySelectorAll(`.chip-group[data-filter="${s}"] .chip`).forEach(cc => cc.classList.remove('active'));
                c.classList.add('active');
                activeFilters[s] = c.getAttribute('data-value');
            };
        });

        if (applyFilters) {
            applyFilters.onclick = () => {
                renderAttire();
                updateFilterLabel();
                UI.filterModal.classList.remove('active');
            };
        }
    }

    function handleSuccessfulLogin(isAdmin) {
        // Persist session
        sessionStorage.setItem('lookbook_active_user', JSON.stringify(currentUser));
        localStorage.setItem('lookbook_last_user', currentUser.username);

        if (isAdmin) {
            sessionStorage.setItem('admin_authenticated', 'true');
            window.location.href = 'admin.html';
            return;
        }
        showScreen('main-interface');
        showView('discovery-view');
        renderAttire();
        updateFilterLabel();
    }

    // Rendering Helpers
    function showScreen(id) {
        UI.screens.forEach(s => s.classList.remove('active'));
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
    }

    function showView(id) {
        UI.views.forEach(v => v.classList.remove('active'));
        const v = document.getElementById(id);
        if (v) {
            v.classList.add('active');
            if (id === 'discovery-view') renderAttire();
        }
    }

    function renderAttire() {
        const f = attireData.filter(i => {
            return (activeFilters.gender === 'all' || i.gender === activeFilters.gender) &&
                   (activeFilters.occasion === 'all' || i.occasion === activeFilters.occasion) &&
                   (activeFilters.season === 'all' || i.season === activeFilters.season);
        });
        UI.attireGrid.innerHTML = f.length ? f.map(createCard).join('') : '<div class="empty-state">No matching styles.</div>';
    }

    function createCard(i) {
        const liked = closet.includes(i.id);
        const avg = VaultDB.getAverageRating(i.id);
        return `
            <div class="attire-card">
                <div class="card-image" onclick="window.location.href='detail.html?id=${i.id}'" style="cursor:pointer;">
                    <img src="${i.image}" loading="lazy">
                    <div class="card-overlay">
                        <button class="like-btn ${liked ? 'active' : ''}" onclick="window.toggleLike(event, '${i.id}')">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
                <div class="card-info">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h4>${i.name}</h4>
                            <p>${i.brand}</p>
                        </div>
                        <div class="star-rating" onclick="window.rateItem(event, '${i.id}')">
                            <i class="${avg > 0 ? 'fas' : 'far'} fa-star"></i>
                            <span style="font-size:0.7rem; margin-top:2px; display:block;">${avg > 0 ? avg : ''}</span>
                        </div>
                    </div>
                    <div class="card-tags"><span class="tag">${i.occasion}</span><span class="tag">${i.season}</span></div>
                </div>
            </div>
        `;
    }

    window.toggleLike = (e, id) => {
        e.stopPropagation();
        const idx = closet.indexOf(id);
        if (idx === -1) closet.push(id); else closet.splice(idx, 1);
        localStorage.setItem('midnight_closet_preference', JSON.stringify(closet));
        renderAttire();
    };

    window.rateItem = (e, id) => {
        e.stopPropagation();
        if (currentUser.role === 'guest') return alert("Sign in to rate.");
        const r = prompt("Rate (1-5):", "5");
        if (r >= 1 && r <= 5) {
            VaultDB.addRating(id, currentUser.username, parseInt(r));
            renderAttire();
        }
    };

    function updateFilterLabel() {
        const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
        if (UI.filterLabel) UI.filterLabel.innerText = `${cap(activeFilters.gender)} • ${cap(activeFilters.occasion)} • ${cap(activeFilters.season)}`;
    }

    document.addEventListener('DOMContentLoaded', init);
})();
