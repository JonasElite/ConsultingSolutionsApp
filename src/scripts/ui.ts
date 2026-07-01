/* ============================================================
   KI-Beratungsportfolio — Client UI
   Progressive enhancement. Structured for Astro View Transitions:
   document/window listeners bind once; per-page setup runs on
   `astro:page-load` and is idempotent (guarded), so nothing double-
   binds when the DOM is swapped during a client navigation.
   ============================================================ */
import { navigate } from 'astro:transitions/client';

// Astro/Vite inline this at build time. Ends with a trailing slash ("/" or "/repo/").
const BASE = import.meta.env.BASE_URL;

/** Join the site base with an app route like "/modul-1". */
function toHref(route: string): string {
  if (/^(https?:)?\/\//.test(route) || route.startsWith('mailto:')) return route;
  return (BASE.replace(/\/$/, '') + '/' + route.replace(/^\//, '')).replace(/\/+$/, '') || '/';
}

/** Navigate with a view transition, falling back to a full load. */
function go(route: string): void {
  const href = toHref(route);
  try {
    navigate(href);
  } catch {
    window.location.href = href;
  }
}

/* ---------- Router (one-time click) ---------- */
function bindRouterClick(): void {
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement)?.closest<HTMLElement>('[data-link]');
    if (!el) return;
    const route = el.dataset.link;
    if (route) {
      e.preventDefault();
      go(route);
    }
  });
}

/* ---------- Router (per-page keyboard a11y) ---------- */
function augmentDataLinkA11y(): void {
  document.querySelectorAll<HTMLElement>('[data-link]').forEach((el) => {
    if (el.dataset.kbd) return;
    el.dataset.kbd = '1';
    if (el.matches('button, a[href]')) return; // already focusable
    el.tabIndex = 0;
    el.setAttribute('role', 'link');
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const route = el.dataset.link;
        if (route) go(route);
      }
    });
  });
}

/* ---------- Mobile navigation (one-time, delegated) ---------- */
function bindMobileNav(): void {
  const close = () => {
    document.getElementById('navMobile')?.classList.remove('open');
    document.getElementById('navHamburger')?.classList.remove('open');
  };

  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('#navHamburger')) {
      e.stopPropagation();
      document.getElementById('navMobile')?.classList.toggle('open');
      document.getElementById('navHamburger')?.classList.toggle('open');
      return;
    }
    if (t.closest('#navMobile a, #navMobile button')) return close();
    const mobile = document.getElementById('navMobile');
    if (mobile?.classList.contains('open') && !t.closest('#navMobile')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

/* ---------- Theme (persisted, transition-safe) ---------- */
const SUN =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
const MOON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

function currentTheme(): string {
  try {
    return (
      localStorage.getItem('theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    );
  } catch {
    return 'light';
  }
}

function applyTheme(): void {
  document.documentElement.setAttribute('data-theme', currentTheme());
}

function paintToggle(): void {
  const btn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (!btn) return;
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  btn.innerHTML = theme === 'dark' ? SUN : MOON;
  btn.setAttribute('aria-label', `Zu ${theme === 'dark' ? 'hellem' : 'dunklem'} Modus wechseln`);
}

function bindThemeToggle(): void {
  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement)?.closest('[data-theme-toggle]')) return;
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage unavailable (private mode) — ignore */
    }
    paintToggle();
  });
}

/* ---------- Nav border on scroll (one-time) ---------- */
function navBorderUpdate(): void {
  const nav = document.getElementById('mainNav');
  if (nav) {
    nav.style.borderBottomColor =
      window.scrollY > 10 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)';
  }
}

/* ---------- Scroll progress bar (one-time) ---------- */
function progressUpdate(): void {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  bar.style.width = max > 0 ? `${(doc.scrollTop / max) * 100}%` : '0%';
}

function bindScroll(): void {
  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        progressUpdate();
        navBorderUpdate();
      });
    },
    { passive: true },
  );
}

/* ---------- Card spotlight (one-time, delegated) ---------- */
function bindCardSpotlight(): void {
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

/* ---------- Contact form (per-page, guarded) ---------- */
function initContactForm(): void {
  const form = document.querySelector<HTMLFormElement>('.contact-form');
  const success = document.getElementById('formSuccess');
  if (!form || !success || form.dataset.bound) return;
  form.dataset.bound = '1';

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
    const body = [
      `Name: ${name}`,
      `Unternehmen: ${data.get('company') ?? ''}`,
      `E-Mail: ${data.get('email') ?? ''}`,
      `Interessiertes Modul: ${data.get('module') ?? '—'}`,
      '',
      `${data.get('message') ?? ''}`,
    ].join('\n');
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
    window.location.href = buildMailto(data);
    showSuccess();
  });
}

/* ---------- Scroll reveal + count-up (per-page, guarded) ---------- */
let revealObserver: IntersectionObserver | null = null;
let countObserver: IntersectionObserver | null = null;

function initScrollReveal(): void {
  const items = document.querySelectorAll<HTMLElement>(
    '.module-card, .deliverable-item, .team-card, .process-step, .sidebar-card, .journey-step, .format-card, .compliance-card, .op-layer',
  );
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('reveal', 'is-visible'));
    return;
  }

  revealObserver ??= new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
  );

  let i = 0;
  items.forEach((el) => {
    if (el.dataset.reveal2) return;
    el.dataset.reveal2 = '1';
    el.classList.add('reveal');
    el.style.transitionDelay = `${Math.min(i++ * 60, 400)}ms`;
    revealObserver!.observe(el);
  });
}

function initCountUp(): void {
  const nums = document.querySelectorAll<HTMLElement>('.stat-num');
  if (!nums.length || !('IntersectionObserver' in window)) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = (el: HTMLElement) => {
    const original = el.textContent ?? '';
    const m = original.match(/^(\D*)(\d[\d.]*)(.*)$/s);
    if (!m || reduced) return;
    const [, pre, digits, rest] = m;
    const targetVal = parseInt(digits.replace(/\./g, ''), 10);
    if (!Number.isFinite(targetVal)) return;
    const start = performance.now();
    const fmt = (n: number) => n.toLocaleString('de-DE');
    const tick = (now: number) => {
      const p = Math.min((now - start) / 1100, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = `${pre}${fmt(Math.round(targetVal * eased))}${rest}`;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  countObserver ??= new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target as HTMLElement);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 },
  );

  nums.forEach((el) => {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    countObserver!.observe(el);
  });
}

/* ---------- Lifecycle ---------- */
function bootOnce(): void {
  bindRouterClick();
  bindThemeToggle();
  bindMobileNav();
  bindScroll();
  bindCardSpotlight();
}

function onPage(): void {
  applyTheme();
  paintToggle();
  augmentDataLinkA11y();
  navBorderUpdate();
  progressUpdate();
  initContactForm();
  initScrollReveal();
  initCountUp();
}

bootOnce();
// Keep the theme correct the instant the DOM swaps (avoids a flash).
document.addEventListener('astro:after-swap', applyTheme);
// Fires on initial load and after every client navigation (ClientRouter).
document.addEventListener('astro:page-load', onPage);
