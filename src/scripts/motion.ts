/* ============================================================
   MOTION ENGINE
   Lenis (smooth scroll) + GSAP/ScrollTrigger, with hard guards
   for reduced-motion and touch/mobile. Purpose-built, reusable
   helpers that the sections call — no effects run on their own.
   ============================================================ */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const coarsePointer = matchMedia('(hover: none)').matches;

// Signal that the engine loaded, so the head fallback keeps content hidden
// (rather than force-revealing) — see BaseLayout inline script.
document.documentElement.classList.add('motion-booted');

const D = {
  base: 0.4,
  slow: 0.7,
  easeOut: 'power3.out' as const,
  stagger: 0.06,
};

/* ---------- Lenis ↔ ScrollTrigger bridge ----------
   The Lenis instance lives in smoothscroll.ts (loaded site-wide without
   GSAP). On animated pages we forward its virtual scroll to ScrollTrigger. */
export function connectLenis(lenis: { on: (e: 'scroll', cb: () => void) => void } | null): void {
  if (!lenis) return;
  lenis.on('scroll', () => ScrollTrigger.update());
}

/** Kill ScrollTriggers whose element left the DOM (after a swap), then refresh. */
export function refreshTriggers(): void {
  ScrollTrigger.getAll().forEach((t) => {
    const el = t.trigger;
    if (el && !document.contains(el)) t.kill();
  });
  ScrollTrigger.refresh();
}

/* ---------- Word-split for text reveals ---------- */
/** Wraps each word of `el` in a <span class="split-word">, preserving text. */
export function splitWords(el: HTMLElement): HTMLElement[] {
  if (el.dataset.split === 'done') {
    return Array.from(el.querySelectorAll<HTMLElement>('.split-word'));
  }
  const words = (el.textContent ?? '').split(/(\s+)/);
  el.textContent = '';
  const spans: HTMLElement[] = [];
  for (const chunk of words) {
    if (chunk.trim() === '') {
      el.appendChild(document.createTextNode(chunk));
      continue;
    }
    const span = document.createElement('span');
    span.className = 'split-word';
    span.textContent = chunk;
    el.appendChild(span);
    spans.push(span);
  }
  el.dataset.split = 'done';
  return spans;
}

/* ---------- Reveal on scroll ([data-reveal]) ---------- */
/** Animates `[data-reveal]` elements within `root` as they enter view. */
export function revealOnScroll(root: ParentNode = document): void {
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]')).filter(
    (el) => !el.dataset.mDone,
  );
  if (!els.length) return;
  els.forEach((el) => (el.dataset.mDone = '1'));

  if (reducedMotion) {
    els.forEach((el) => el.classList.add('is-inview'));
    return;
  }

  ScrollTrigger.batch(els, {
    start: 'top 85%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        autoAlpha: 1,
        y: 0,
        x: 0,
        scale: 1,
        duration: D.slow,
        ease: D.easeOut,
        stagger: D.stagger,
        overwrite: true,
      }),
  });
}

/* ---------- Word-reveal for a heading ---------- */
export function revealText(el: HTMLElement): void {
  if (el.dataset.mDone) return;
  el.dataset.mDone = '1';
  const words = splitWords(el);
  if (reducedMotion) {
    gsap.set(words, { opacity: 1, y: 0 });
    return;
  }
  gsap.to(words, {
    scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    opacity: 1,
    y: 0,
    duration: D.slow,
    ease: D.easeOut,
    stagger: D.stagger,
  });
}

/* ---------- Parallax ([data-parallax="0.2"]) ---------- */
export function parallax(root: ParentNode = document): void {
  if (reducedMotion) return;
  root.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    if (el.dataset.mDone) return;
    el.dataset.mDone = '1';
    const depth = parseFloat(el.dataset.parallax || '0.2');
    gsap.to(el, {
      yPercent: -depth * 100,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

/* ---------- Magnetic buttons ([data-magnetic]) ---------- */
export function magnetic(root: ParentNode = document): void {
  if (reducedMotion || coarsePointer) return;
  root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    if (el.dataset.mDone) return;
    el.dataset.mDone = '1';
    const strength = parseFloat(el.dataset.magnetic || '0.3');
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - (r.left + r.width / 2)) * strength,
        y: (e.clientY - (r.top + r.height / 2)) * strength,
        duration: D.base,
        ease: D.easeOut,
      });
    };
    const reset = () => gsap.to(el, { x: 0, y: 0, duration: D.base, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', reset);
  });
}

/* ---------- Count-up ([data-countup]) ---------- */
export function countUp(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-countup]').forEach((el) => {
    if (el.dataset.mDone) return;
    el.dataset.mDone = '1';
    const target = parseFloat(el.dataset.countup || '0');
    const suffix = el.dataset.suffix ?? '';
    if (reducedMotion) {
      el.textContent = target.toLocaleString('de-DE') + suffix;
      return;
    }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.1,
      ease: D.easeOut,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onUpdate: () => {
        el.textContent = Math.round(obj.v).toLocaleString('de-DE') + suffix;
      },
    });
  });
}

export { gsap, ScrollTrigger };
