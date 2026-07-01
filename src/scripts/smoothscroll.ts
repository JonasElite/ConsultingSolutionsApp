/* ============================================================
   SMOOTH SCROLL (Lenis only — no GSAP)
   Kept separate from the animation engine so it can load site-wide
   cheaply, while GSAP/ScrollTrigger only load on animated pages.
   Desktop-only; disabled for reduced-motion and touch (native
   momentum scrolling is better there).
   ============================================================ */
import Lenis from 'lenis';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(hover: none)').matches || window.innerWidth < 768;

let lenis: Lenis | null = null;

export function initSmoothScroll(): Lenis | null {
  if (reducedMotion || isMobile || lenis) return lenis;
  lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
  const raf = (time: number) => {
    lenis?.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
  return lenis;
}

/** The live Lenis instance (null when smooth scroll is disabled). */
export function getLenis(): Lenis | null {
  return lenis;
}

/** Jump to top after a client-side navigation. */
export function scrollTop(): void {
  if (lenis) lenis.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
}
