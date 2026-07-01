/* ============================================================
   NEURAL SIGNATURE
   A lightweight, thematic node-network drawn on <canvas> for the
   hero background. Purpose: visualises "vernetztes Denken / KI".
   Performance-guarded: paused off-screen / hidden tab, skipped on
   reduced-motion and coarse-pointer (mobile). Canvas rendering only
   — no layout properties are animated.
   ============================================================ */

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function initNeural(canvas: HTMLCanvasElement): void {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(hover: none)').matches;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const parent = canvas.parentElement ?? canvas;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let nodes: Node[] = [];
  const pointer = { x: -9999, y: -9999 };
  const LINK_DIST = 130;

  const accent = () =>
    getComputedStyle(document.documentElement).getPropertyValue('--cyan').trim() || '#38e0ff';
  let stroke = accent();

  function resize(): void {
    const rect = parent.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Node count scales with area but is capped for performance.
    const count = Math.min(46, Math.round((width * height) / 26000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
    }));
    stroke = accent();
  }

  function draw(): void {
    ctx!.clearRect(0, 0, width, height);

    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;

      // Gentle pointer attraction for a sense of responsiveness.
      const dx = pointer.x - n.x;
      const dy = pointer.y - n.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 26000) {
        n.x += dx * 0.0015;
        n.y += dy * 0.0015;
      }
    }

    // Links between nearby nodes; opacity fades with distance.
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < LINK_DIST) {
          ctx!.globalAlpha = (1 - dist / LINK_DIST) * 0.28;
          ctx!.strokeStyle = stroke;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }
    }

    // Nodes.
    ctx!.globalAlpha = 0.7;
    ctx!.fillStyle = stroke;
    for (const n of nodes) {
      ctx!.beginPath();
      ctx!.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
      ctx!.fill();
    }
    ctx!.globalAlpha = 1;
  }

  let raf = 0;
  let running = false;
  const loop = () => {
    draw();
    raf = requestAnimationFrame(loop);
  };
  const start = () => {
    if (running) return;
    running = true;
    loop();
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  resize();

  // Reduced motion / mobile: render one static frame, no animation loop.
  if (reduced || coarse) {
    draw();
    return;
  }

  // Pause when the hero scrolls out of view or the tab is hidden.
  const io = new IntersectionObserver(
    ([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()),
    { threshold: 0 },
  );
  io.observe(parent);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (parent.getBoundingClientRect().bottom > 0) start();
  });

  window.addEventListener('resize', resize, { passive: true });
  // The canvas layer is pointer-events:none, so track on window and map into
  // the hero's box (ignoring positions outside it).
  window.addEventListener(
    'pointermove',
    (e) => {
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        pointer.x = -9999;
        pointer.y = -9999;
      } else {
        pointer.x = x;
        pointer.y = y;
      }
    },
    { passive: true },
  );

  start();
}
