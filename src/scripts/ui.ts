/* ============================================================
   KI-Beratungsportfolio — Client UI
   Progressive enhancement for a static, multi-page Astro site.
   ============================================================ */

// Astro/Vite inline this at build time. Ends with a trailing slash ("/" or "/repo/").
const BASE = import.meta.env.BASE_URL;

/** Join the site base with an app route like "/modul-1". */
function toHref(route: string): string {
  if (/^(https?:)?\/\//.test(route) || route.startsWith('mailto:')) return route;
  return (BASE.replace(/\/$/, '') + '/' + route.replace(/^\//, '')).replace(/\/+$/, '') || '/';
}

/* --- Delegated router: elements with [data-link] navigate on click/Enter --- */
function initDataLinkRouter(): void {
  const resolve = (el: HTMLElement | null) =>
    el?.closest<HTMLElement>('[data-link]') ?? null;

  document.addEventListener('click', (e) => {
    const target = resolve(e.target as HTMLElement);
    if (!target) return;
    const route = target.dataset.link;
    if (route) window.location.href = toHref(route);
  });

  // Keyboard accessibility for non-anchor clickable elements.
  document.querySelectorAll<HTMLElement>('[data-link]').forEach((el) => {
    // Real buttons and anchors with href are already keyboard-accessible;
    // everything else (spans, divs, href-less anchors) needs help.
    if (el.matches('button, a[href]')) return;
    el.tabIndex = 0;
    el.setAttribute('role', 'link');
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const route = el.dataset.link;
        if (route) window.location.href = toHref(route);
      }
    });
  });
}

/* --- Mobile navigation --- */
function initMobileNav(): void {
  const hamburger = document.getElementById('navHamburger');
  const mobile = document.getElementById('navMobile');
  if (!hamburger || !mobile) return;

  const close = () => {
    mobile.classList.remove('open');
    hamburger.classList.remove('open');
  };

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    mobile.classList.toggle('open');
    hamburger.classList.toggle('open');
  });

  // Close after tapping any link, or when clicking outside.
  mobile.querySelectorAll('a, button').forEach((el) => el.addEventListener('click', close));
  document.addEventListener('click', (e) => {
    if (mobile.classList.contains('open') && !mobile.contains(e.target as Node)) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

/* --- Theme toggle (persisted) --- */
const SUN =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
const MOON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

function initThemeToggle(): void {
  const html = document.documentElement;
  const btn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');

  const paint = (theme: string) => {
    if (!btn) return;
    btn.innerHTML = theme === 'dark' ? SUN : MOON;
    btn.setAttribute('aria-label', `Zu ${theme === 'dark' ? 'hellem' : 'dunklem'} Modus wechseln`);
  };

  paint(html.getAttribute('data-theme') || 'light');

  btn?.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage may be unavailable (private mode) — fail silently */
    }
    paint(next);
  });
}

/* --- Nav border on scroll --- */
function initNavScroll(): void {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  const update = () => {
    nav.style.borderBottomColor =
      window.scrollY > 10 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)';
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* --- Contact form ---
   Really submits: POSTs to `data-endpoint` (e.g. a Formspree/Web3Forms URL)
   when configured; otherwise opens a pre-filled e-mail via `data-mailto`
   so the message is never silently lost. */
function initContactForm(): void {
  const form = document.querySelector<HTMLFormElement>('.contact-form');
  const success = document.getElementById('formSuccess');
  if (!form || !success) return;

  const showSuccess = () => {
    form.style.transition = 'all 0.3s ease';
    form.style.opacity = '0';
    form.style.transform = 'translateY(-10px)';
    window.setTimeout(() => {
      form.style.display = 'none';
      success.style.display = 'block';
      success.style.animation = 'fadeInUp 0.5s ease both';
    }, 300);
  };

  const buildMailto = (data: FormData): string => {
    const to = form.dataset.mailto || '';
    const name = `${data.get('fname') ?? ''} ${data.get('lname') ?? ''}`.trim();
    const subject = `KI-Beratung Anfrage: ${data.get('module') || 'Allgemein'}`;
    const bodyLines = [
      `Name: ${name}`,
      `Unternehmen: ${data.get('company') ?? ''}`,
      `E-Mail: ${data.get('email') ?? ''}`,
      `Interessiertes Modul: ${data.get('module') ?? '—'}`,
      '',
      `${data.get('message') ?? ''}`,
    ];
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const endpoint = form.dataset.endpoint;
    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Wird gesendet …';
    }

    if (endpoint) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' },
        });
        if (res.ok) return showSuccess();
      } catch {
        /* fall through to mailto */
      }
    }

    // No backend (or it failed): hand off to the user's mail client.
    window.location.href = buildMailto(data);
    showSuccess();
  });
}

/* --- Scroll reveal --- */
function initScrollReveal(): void {
  const items = document.querySelectorAll<HTMLElement>(
    '.module-card, .deliverable-item, .team-card, .process-step, .sidebar-card',
  );
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('reveal', 'is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
  );

  items.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${Math.min(i * 60, 400)}ms`;
    observer.observe(el);
  });
}

/* --- Scroll progress bar --- */
function initScrollProgress(): void {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    bar.style.width = max > 0 ? `${(doc.scrollTop / max) * 100}%` : '0%';
  };
  update();
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
}

/* --- Count-up on stat numbers when they first appear --- */
function initCountUp(): void {
  const nums = document.querySelectorAll<HTMLElement>('.stat-num');
  if (!nums.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = (el: HTMLElement) => {
    const original = el.textContent ?? '';
    const m = original.match(/^(\D*)(\d[\d.]*)(.*)$/s); // leading number (with dot separators)
    if (!m || reduced) return;
    const [, pre, digits, rest] = m;
    const target = parseInt(digits.replace(/\./g, ''), 10);
    if (!Number.isFinite(target)) return;
    const dur = 1100;
    const start = performance.now();
    const fmt = (n: number) => n.toLocaleString('de-DE');
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = `${pre}${fmt(Math.round(target * eased))}${rest}`;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (!('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target as HTMLElement);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 },
  );
  nums.forEach((el) => obs.observe(el));
}

/* --- Mouse-follow spotlight on cards (sets --mx / --my) --- */
function initCardSpotlight(): void {
  if (matchMedia('(hover: none)').matches) return;
  document.addEventListener(
    'pointermove',
    (e) => {
      const card = (e.target as HTMLElement)?.closest<HTMLElement>('.module-card, .team-card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      card.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    },
    { passive: true },
  );
}

function init(): void {
  initDataLinkRouter();
  initMobileNav();
  initThemeToggle();
  initNavScroll();
  initScrollProgress();
  initContactForm();
  initScrollReveal();
  initCountUp();
  initCardSpotlight();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
