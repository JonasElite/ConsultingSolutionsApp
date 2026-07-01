/* ============================================================
   CONTENT PAGE MOTION
   Shared entrance/interaction layer for the module, team and
   contact pages — same motion language as the homepage, without
   duplicating logic. GSAP only loads on pages that import this.
   Below-the-fold content reveals keep using the lightweight
   IntersectionObserver reveal in ui.ts.
   ============================================================ */
import {
  gsap,
  splitWords,
  magnetic,
  revealOnScroll,
  parallax,
  connectLenis,
  refreshTriggers,
  reducedMotion,
} from './motion';
import { getLenis } from './smoothscroll';

let connected = false;

/** Above-the-fold hero entrance: word-reveal the title, stagger the rest. */
function heroEntrance(hero: HTMLElement): void {
  if (hero.dataset.anim) return;
  hero.dataset.anim = '1';

  const titleEl = hero.querySelector<HTMLElement>('[data-reveal-text]');
  const words = titleEl ? splitWords(titleEl) : [];
  const bits = Array.from(hero.querySelectorAll<HTMLElement>('[data-hero-in]'));

  if (reducedMotion) {
    gsap.set([...words, ...bits], { opacity: 1, y: 0 });
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.6 } });
  if (bits.length) tl.to(bits, { autoAlpha: 1, y: 0, stagger: 0.07 });
  if (words.length) tl.to(words, { autoAlpha: 1, y: 0, stagger: 0.035 }, 0.12);
}

export function initContentPage(): void {
  if (!connected) {
    connectLenis(getLenis());
    connected = true;
  }

  const hero = document.querySelector<HTMLElement>('.module-hero, .page-hero');
  if (hero) heroEntrance(hero);

  magnetic(document);
  parallax(document);
  revealOnScroll(document); // [data-reveal] elements (e.g. contact columns)
  refreshTriggers();
}
