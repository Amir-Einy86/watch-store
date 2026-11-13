/* background.js — the "Golden Hour" living background for TIMELESS.
   The feeling of a quiet watch boutique in late-afternoon light, drawn on one <canvas>:
     1. bokeh — big, soft, out-of-focus lights drifting slowly (like lights seen through a lens)
     2. gold dust — tiny specks floating upward, glowing a little brighter on every second (the "tick")
     3. light sweep — every few seconds a soft beam glides across, like light over a watch crystal
   Remove its <script> tag in views/partials/foot.ejs to turn it off.
   Speed and strength: --bg-speed and --bg-intensity in /css/animations.css. */
(() => {
  'use strict';

  const page = document.body.dataset.page || '';
  // The login page has its own painted scene; the admin panel is a work tool: keep them calm.
  if (page === 'login' || page.startsWith('admin')) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.className = 'living-bg';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Color family follows the category page theme (men gold, women rose gold, smart silver-teal).
  const PALETTES = {
    men: { warm: [214, 172, 78], soft: [246, 228, 186] },
    women: { warm: [210, 150, 128], soft: [250, 226, 214] },
    smart: { warm: [128, 172, 176], soft: [222, 238, 238] },
  };
  const palette = PALETTES[document.body.dataset.category] || PALETTES.men;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let intensity = 1;
  let speed = 1;
  let orbs = [];
  let motes = [];
  let rafId = 0;
  let running = false;
  let onScreen = true;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }; // current and target, both -1 … 1

  const rand = (min, max) => min + Math.random() * (max - min);
  const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${a})`;

  /* ---------- Pre-drawn sprites (drawing an image is much cheaper than a gradient) ---------- */
  function makeGlow(color, size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, rgba(color, 1));
    grad.addColorStop(0.45, rgba(color, 0.35));
    grad.addColorStop(1, rgba(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return c;
  }
  const sprites = {
    warm: makeGlow(palette.warm, 256),
    soft: makeGlow(palette.soft, 256),
    white: makeGlow([255, 255, 255], 256),
    dust: makeGlow([232, 196, 110], 32),
    dustWhite: makeGlow([255, 250, 236], 32),
  };

  /* ---------- Scene setup ---------- */
  function readSettings() {
    const css = getComputedStyle(document.documentElement);
    intensity = parseFloat(css.getPropertyValue('--bg-intensity'));
    speed = parseFloat(css.getPropertyValue('--bg-speed'));
    if (!Number.isFinite(intensity)) intensity = 1;
    if (!Number.isFinite(speed)) speed = 1;
  }

  function resize() {
    readSettings();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5); // soft content does not need more pixels
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const small = width < 700; // phones get fewer lights and specks
    const orbCount = small ? 5 : 9;
    const moteCount = small ? 28 : 70;
    const base = Math.min(width, height);

    // Positions are stored as 0…1 so a resize keeps the same composition.
    if (orbs.length !== orbCount) {
      orbs = Array.from({ length: orbCount }, (_, i) => ({
        x: rand(0, 1),
        y: rand(0, 1),
        size: rand(0.35, 0.8), // × base
        depth: rand(0.3, 1),
        phase: rand(0, Math.PI * 2),
        drift: rand(0.03, 0.07), // how far it wanders (× width)
        tempo: rand(0.04, 0.09), // how fast it wanders
        alpha: rand(0.14, 0.28),
        sprite: i % 3 === 0 ? 'white' : i % 3 === 1 ? 'warm' : 'soft',
      }));
    }
    orbs.forEach((o) => (o.px = o.size * base));

    if (motes.length !== moteCount) {
      motes = Array.from({ length: moteCount }, () => newMote(true));
    }
  }

  function newMote(anywhere) {
    return {
      x: rand(0, width),
      y: anywhere ? rand(0, height) : height + 10,
      size: rand(2.3, 6.9), // radius in px (15% larger than the first version)
      rise: rand(5, 16), // px per second, upward
      sway: rand(6, 20),
      swayTempo: rand(0.2, 0.6),
      phase: rand(0, Math.PI * 2),
      alpha: rand(0.25, 0.7),
      sprite: Math.random() < 0.7 ? 'dust' : 'dustWhite',
    };
  }

  /* ---------- Drawing ---------- */
  let last = 0;
  function frame(now) {
    const dt = Math.min((now - (last || now)) / 1000, 0.05) * speed; // seconds, capped after a pause
    last = now;
    draw(now / 1000, dt);
    if (running) rafId = requestAnimationFrame(frame);
  }

  function draw(t, dt) {
    ctx.clearRect(0, 0, width, height);
    const ts = t * speed;
    const scroll = window.scrollY;

    // Pointer moves are eased so the lights glide instead of jumping.
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;

    // 1. Bokeh lights
    for (const o of orbs) {
      const x = (o.x + Math.sin(ts * o.tempo + o.phase) * o.drift) * width + pointer.x * 24 * o.depth;
      const yRaw = o.y * height + Math.cos(ts * o.tempo * 0.8 + o.phase) * o.drift * height - scroll * 0.06 * o.depth;
      const y = ((yRaw % (height + o.px)) + height + o.px) % (height + o.px) - o.px / 2; // wraps while scrolling
      const breathe = 0.8 + 0.2 * Math.sin(ts * 0.5 + o.phase);
      ctx.globalAlpha = o.alpha * breathe * intensity;
      ctx.drawImage(sprites[o.sprite], x - o.px / 2, y - o.px / 2 + pointer.y * 16 * o.depth, o.px, o.px);
    }

    // 2. Gold dust with a gentle "tick" on every real second
    const ms = Date.now() % 1000;
    const tick = Math.exp(-ms / 180); // 1 right on the second, fading quickly
    for (const m of motes) {
      m.y -= m.rise * dt;
      if (m.y < -10) Object.assign(m, newMote(false));
      const x = m.x + Math.sin(ts * m.swayTempo + m.phase) * m.sway;
      const twinkle = 0.65 + 0.35 * Math.sin(ts * 1.3 + m.phase);
      ctx.globalAlpha = Math.min(1, m.alpha * twinkle * (1 + 0.25 * tick)) * intensity;
      ctx.drawImage(sprites[m.sprite], x - m.size, m.y - m.size, m.size * 2, m.size * 2);
    }

    // 3. Light sweep: every 11 s a soft beam crosses the screen in 3.2 s
    const cycle = (ts + 4) % 11;
    if (cycle < 3.2) {
      const p = cycle / 3.2; // 0 … 1
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const beamW = Math.max(width, height) * 0.35;
      const cx = -beamW + eased * (width + beamW * 2);
      ctx.save();
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.5 * intensity; // fades in and out
      ctx.translate(cx, height / 2);
      ctx.rotate(-0.35);
      const grad = ctx.createLinearGradient(-beamW / 2, 0, beamW / 2, 0);
      grad.addColorStop(0, rgba(palette.soft, 0));
      grad.addColorStop(0.5, rgba(palette.soft, 0.5));
      grad.addColorStop(1, rgba(palette.soft, 0));
      ctx.fillStyle = grad;
      ctx.fillRect(-beamW / 2, -height * 1.5, beamW, height * 3);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- Start / stop ---------- */
  function start() {
    if (running || reduceMotion.matches || document.hidden || !onScreen) return;
    running = true;
    last = 0;
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }
  function drawStill() {
    // Reduced motion: one calm, static picture (no beam, no movement).
    stop();
    ctx.clearRect(0, 0, width, height);
    const savedMotes = motes;
    motes = [];
    draw(2, 0); // t = 2 s: a moment with no light beam on screen
    motes = savedMotes;
  }

  resize();
  if (reduceMotion.matches) drawStill();
  else start();
  requestAnimationFrame(() => canvas.classList.add('is-ready')); // CSS fades the canvas in

  // Pause when the tab is hidden (saves battery), resume when it comes back.
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  // Pause if the canvas is ever off screen (it is fixed, so normally it is always visible).
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      onScreen ? start() : stop();
    }).observe(canvas);
  }

  // Follow the "reduce motion" setting even if it changes while the page is open.
  reduceMotion.addEventListener?.('change', () => (reduceMotion.matches ? drawStill() : start()));

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      if (!running) drawStill();
    }, 150);
  });

  if (finePointer) {
    window.addEventListener(
      'pointermove',
      (e) => {
        pointer.tx = (e.clientX / width) * 2 - 1;
        pointer.ty = (e.clientY / height) * 2 - 1;
      },
      { passive: true }
    );
  }
})();
