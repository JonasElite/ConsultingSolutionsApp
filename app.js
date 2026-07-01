/* ============================================================
   KI-Beratungsportfolio — App Logic
   ============================================================ */

// --- SPA View Router ---
function showView(viewId) {
  // Hide all views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  // Show target view
  const target = document.getElementById('view-' + viewId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update active nav link
  document.querySelectorAll('.nav-link[data-view]').forEach(link => {
    link.classList.toggle('active', link.dataset.view === viewId);
  });

  // Update browser hash (for shareability)
  history.pushState({ view: viewId }, '', '#' + viewId);
}

// --- Mobile Nav ---
const navHamburger = document.getElementById('navHamburger');
const navMobile = document.getElementById('navMobile');

navHamburger && navHamburger.addEventListener('click', () => {
  navMobile.classList.toggle('open');
  navHamburger.classList.toggle('open');
});

function closeMobileNav() {
  navMobile && navMobile.classList.remove('open');
  navHamburger && navHamburger.classList.remove('open');
}

// Close mobile nav on outside click
document.addEventListener('click', (e) => {
  if (navMobile && navMobile.classList.contains('open')) {
    if (!navMobile.contains(e.target) && !navHamburger.contains(e.target)) {
      closeMobileNav();
    }
  }
});

// --- Dark Mode Toggle ---
(function () {
  const toggle = document.querySelector('[data-theme-toggle]');
  const html = document.documentElement;
  let currentTheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  html.setAttribute('data-theme', currentTheme);
  updateToggleIcon(toggle, currentTheme);

  toggle && toggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', currentTheme);
    updateToggleIcon(toggle, currentTheme);
  });

  function updateToggleIcon(btn, theme) {
    if (!btn) return;
    btn.innerHTML = theme === 'dark'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    btn.setAttribute('aria-label', 'Zu ' + (theme === 'dark' ? 'hellem' : 'dunklem') + ' Modus wechseln');
  }
})();

// --- Nav Scroll Effect ---
const nav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
  if (nav) {
    nav.style.borderBottomColor = window.scrollY > 10
      ? 'rgba(255,255,255,0.12)'
      : 'rgba(255,255,255,0.08)';
  }
}, { passive: true });

// --- Contact Form ---
function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const success = document.getElementById('formSuccess');

  // Animate form out, success in
  form.style.opacity = '0';
  form.style.transform = 'translateY(-10px)';
  form.style.transition = 'all 0.3s ease';

  setTimeout(() => {
    form.style.display = 'none';
    success.style.display = 'block';
    success.style.animation = 'fadeInUp 0.5s ease both';
  }, 300);
}

// --- Hash-based routing on load ---
(function () {
  const hash = location.hash.replace('#', '');
  const validViews = ['home', 'module1', 'module2', 'module3', 'module4', 'team', 'contact'];
  if (hash && validViews.includes(hash)) {
    showView(hash);
  } else {
    showView('home');
  }
})();

// --- Browser back/forward support ---
window.addEventListener('popstate', (e) => {
  const view = (e.state && e.state.view) || 'home';
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + view);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-link[data-view]').forEach(link => {
    link.classList.toggle('active', link.dataset.view === view);
  });
});

// --- Intersection Observer for scroll animations ---
const observerOpts = {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOpts);

// Observe cards and items after page load
setTimeout(() => {
  document.querySelectorAll('.module-card, .deliverable-item, .team-card, .process-step').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.5s ease ${i * 0.07}s, transform 0.5s ease ${i * 0.07}s`;
    observer.observe(el);
  });
}, 100);
