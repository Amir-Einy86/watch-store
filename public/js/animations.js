/* animations.js — scroll reveals and micro-interactions for TIMELESS.
   Plain script (no imports). Loaded before main.js so it can see cards as soon as the pages
   render them. To turn everything off, remove its <script> tag in views/partials/foot.ejs.
   Styles for everything here live in /css/animations.css. */
(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const page = body.dataset.page || '';

  // Respect the user's "reduce motion" system setting: no reveals, no extra motion.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches) return;

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const css = getComputedStyle(root);
  const STAGGER = parseFloat(css.getPropertyValue('--motion-stagger')) || 70; // ms between list items
  const MAX_STEPS = 8; // the 9th item and later wait no longer than the 8th
  const FIRST_LOAD_MS = 2500; // "firstLoadOnly" rules only animate inside this window
  const startedAt = performance.now();

  /* ------------------------------------------------------------------
     1. REVEAL RULES — which elements animate and how (first match wins)
     effect = name used in CSS: [data-reveal='effect']
     firstLoadOnly = only on the first render (for lists that re-render on every click)
     ------------------------------------------------------------------ */
  const RULES = [
    // Shared
    { sel: '.site-footer .footer__grid > section', effect: 'rise' },
    { sel: '.footer__bar', effect: 'fade' },
    { sel: '.search-overlay__results > li', effect: 'rise-sm' },
    { sel: '.state__box', effect: 'glass' },

    // Landing
    { sel: '.section-head', effect: 'unveil' },
    { sel: '.category-card', effect: 'rise-scale' },
    { sel: '.catalog__head', effect: 'fade' },
    { sel: '.carousel__item > .product-card', effect: 'slide-end' },
    { sel: '.product-card:not(.product-card--skeleton)', effect: 'card' },
    { sel: '.promo__box', effect: 'glass' },
    { sel: '.about-card', effect: 'glass' },
    { sel: '.about-card__intro > *', effect: 'rise' },
    { sel: '.about-card__points > li', effect: 'slide-end' },

    // Category page
    { sel: '.filters', effect: 'drop' },
    { sel: '.result-bar', effect: 'fade' },

    // Product page
    { sel: '.product-detail__media', effect: 'focus' },
    { sel: '.product-detail__info > *', effect: 'rise' },
    { sel: '.related .section-title', effect: 'unveil' },

    // Cart and account
    { sel: '.demo-banner', effect: 'fade' },
    { sel: '.cart-line', effect: 'slide-start', firstLoadOnly: true },
    { sel: '.cart-summary', effect: 'glass', firstLoadOnly: true },
    { sel: '.account-card', effect: 'glass' },
    { sel: '.account-wishlist .section-title', effect: 'unveil' },

    // Admin
    { sel: '.kpi', effect: 'rise' },
    { sel: '.panel', effect: 'glass' },
    { sel: '.bar__fill', effect: 'grow' },
    { sel: '.admin-tools, .admin-note', effect: 'fade' },
    { sel: '.table tbody tr', effect: 'rise-sm', firstLoadOnly: true },
  ];

  /* ------------------------------------------------------------------
     2. REVEAL ENGINE (IntersectionObserver + MutationObserver)
     ------------------------------------------------------------------ */
  const seen = new WeakSet(); // elements already handled, so each reveal runs once

  // Puts elements in reading order (top to bottom), so the stagger looks natural.
  const byDocumentOrder = (a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

  const pending = new Set(); // elements waiting to be revealed

  function reveal(list) {
    list.sort(byDocumentOrder).forEach((el, i) => {
      io.unobserve(el);
      pending.delete(el);
      el.style.setProperty('--reveal-delay', `${Math.min(i, MAX_STEPS) * STAGGER}ms`);
      el.classList.add('is-revealed');
    });
  }

  // rootMargin -8% at the bottom: things start appearing a little after they enter the screen.
  const io =
    'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => reveal(entries.filter((e) => e.isIntersecting).map((e) => e.target)), {
          rootMargin: '0px 0px -8% 0px',
          threshold: 0,
        })
      : null;

  // The last elements of a page (e.g. the footer bar) can never reach that zone,
  // so at the very bottom of the page everything that is on screen is revealed.
  window.addEventListener(
    'scroll',
    () => {
      if (!pending.size) return;
      if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 4) return;
      reveal([...pending].filter(isOnScreen));
    },
    { passive: true }
  );

  function isOnScreen(el) {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
  }

  /**
   * Finds rule matches inside `node` and prepares them.
   * isNew = the node was just added by a page script (not painted yet, safe to hide).
   */
  function scan(node, isNew) {
    if (!io) return;
    const lateForFirstLoad = performance.now() - startedAt > FIRST_LOAD_MS;
    for (const rule of RULES) {
      const matches = node.matches?.(rule.sel) ? [node] : [];
      node.querySelectorAll?.(rule.sel).forEach((el) => matches.push(el));
      for (const el of matches) {
        if (seen.has(el)) continue;
        seen.add(el);
        if (rule.firstLoadOnly && lateForFirstLoad) continue;
        // Content already visible on the first screen is left alone (the CSS page-load
        // animation covers it) so nothing flashes or disappears.
        if (!isNew && isOnScreen(el)) continue;
        el.dataset.reveal = rule.effect;
        pending.add(el);
        io.observe(el);
      }
    }
  }

  scan(body, false);

  // Cards, rows and results are created later by the page scripts: watch for them.
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((n) => n.nodeType === 1 && scan(n, true));
    }
  }).observe(body, { childList: true, subtree: true });

  /* ------------------------------------------------------------------
     3. MICRO-INTERACTIONS (Web Animations API)
     `scale` / `translate` are separate CSS properties, so they never fight
     with the transforms the site already uses on hover.
     ------------------------------------------------------------------ */
  const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

  // 3a. Heart: "pops" when a watch is added to the wishlist.
  document.addEventListener('click', (e) => {
    const heart = e.target.closest('[data-heart], .heart-btn');
    if (heart) {
      // wait one tick: the page's own click handler updates aria-pressed first
      setTimeout(() => {
        if (heart.getAttribute('aria-pressed') !== 'true') return;
        heart.querySelector('svg')?.animate(
          [{ scale: 1 }, { scale: 1.35 }, { scale: 0.92 }, { scale: 1 }],
          { duration: 480, easing: 'ease-out' }
        );
      }, 0);
    }

    // 3b. Add to cart: the bag icon makes a small "drop into the bag" hop.
    const addBtn = e.target.closest('.product-card__cart:not(:disabled)');
    if (addBtn) {
      addBtn.querySelector('svg')?.animate(
        [{ translate: '0 0' }, { translate: '0 -5px' }, { translate: '0 2px' }, { translate: '0 0' }],
        { duration: 420, easing: 'ease-out' }
      );
    }
  });

  // 3c. Cart / wishlist counters bounce when their number changes.
  const bump = (selector) => () =>
    document.querySelectorAll(selector).forEach((n) => {
      if (!n.hidden) n.animate([{ scale: 1 }, { scale: 1.4 }, { scale: 1 }], { duration: 420, easing: SPRING });
    });
  window.addEventListener('cart:change', bump('[data-cart-count]'));
  window.addEventListener('wishlist:change', bump('[data-wishlist-count]'));

  // 3d. Form errors: fields with an error shake gently after submit.
  const shake = (el) =>
    el.animate(
      [{ translate: '0 0' }, { translate: '6px 0' }, { translate: '-5px 0' }, { translate: '3px 0' }, { translate: '0 0' }],
      { duration: 380, easing: 'ease-out' }
    );
  document.addEventListener(
    'submit',
    (e) => {
      const form = e.target;
      // the page's own submit handler runs first; check the result on the next frame
      requestAnimationFrame(() => {
        form.querySelectorAll('.field-error').forEach((err) => {
          if (err.textContent.trim() && err.previousElementSibling) shake(err.previousElementSibling);
        });
      });
    },
    true
  );

  // 3e. OTP code: each typed digit gives a small "click".
  document.addEventListener('input', (e) => {
    const digit = e.target.closest?.('[data-otp-digit]');
    if (digit && digit.value) digit.animate([{ scale: 0.85 }, { scale: 1 }], { duration: 240, easing: SPRING });
  });

  // 3f. Text that changes in place (catalog title, result count) fades to the new value.
  document.querySelectorAll('[data-catalog-title], [data-catalog-meta], [data-result-count]').forEach((node) => {
    new MutationObserver(() =>
      node.animate([{ opacity: 0, translate: '0 6px' }, { opacity: 1, translate: '0 0' }], { duration: 360, easing: 'ease-out' })
    ).observe(node, { childList: true, characterData: true, subtree: true });
  });

  // 3g. Header: thin gold line that shows how far the page is scrolled.
  const header = document.querySelector('[data-header]');
  if (header) {
    const bar = document.createElement('span');
    bar.className = 'anim-progress';
    bar.setAttribute('aria-hidden', 'true');
    header.append(bar);
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }

  if (!finePointer) return; // the effects below need a mouse

  // 3h. Product cards: the soft light follows the pointer (CSS reads --mx / --my).
  let glareCard = null;
  let glareEvent = null;
  document.addEventListener(
    'pointermove',
    (e) => {
      const card = e.target.closest?.('.product-card');
      if (!card) return;
      const first = !glareEvent;
      glareCard = card;
      glareEvent = e;
      if (first)
        requestAnimationFrame(() => {
          const r = glareCard.getBoundingClientRect();
          glareCard.style.setProperty('--mx', `${glareEvent.clientX - r.left}px`);
          glareCard.style.setProperty('--my', `${glareEvent.clientY - r.top}px`);
          glareEvent = null;
        });
    },
    { passive: true }
  );

  // 3i. Landing hero: the two watches drift slightly with the pointer (depth effect).
  const hero = document.querySelector('.hero');
  if (hero && page === 'landing') {
    const watches = [
      [hero.querySelector('.hero__watch--main img'), 10],
      [hero.querySelector('.hero__watch--side img'), -16],
    ].filter(([img]) => img);
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5; // -0.5 … 0.5
      const y = (e.clientY - r.top) / r.height - 0.5;
      watches.forEach(([img, depth]) => (img.style.translate = `${(x * depth).toFixed(1)}px ${(y * depth * 0.6).toFixed(1)}px`));
    });
    hero.addEventListener('pointerleave', () => watches.forEach(([img]) => (img.style.translate = '')));
  }
})();
