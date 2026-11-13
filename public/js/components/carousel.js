// Horizontal carousel: arrow buttons, mouse drag, native touch swipe, scroll snapping.
// Pass the section that contains .carousel__track and the [data-carousel-prev/next] buttons.
import { qs } from './dom.js';

export function initCarousel(section) {
  const track = qs('.carousel__track', section);
  const prev = qs('[data-carousel-prev]', section);
  const next = qs('[data-carousel-next]', section);
  if (!track) return;

  const sign = () => (getComputedStyle(track).direction === 'rtl' ? -1 : 1);
  const step = () => Math.max(240, track.clientWidth * 0.8);

  function updateButtons() {
    const max = track.scrollWidth - track.clientWidth - 2;
    const pos = Math.abs(track.scrollLeft);
    if (prev) prev.disabled = pos <= 2;
    if (next) next.disabled = pos >= max;
    const scrollable = track.scrollWidth - track.clientWidth > 4;
    [prev, next].forEach((b) => b && (b.hidden = !scrollable));
  }

  prev?.addEventListener('click', () => track.scrollBy({ left: -step() * sign(), behavior: 'smooth' }));
  next?.addEventListener('click', () => track.scrollBy({ left: step() * sign(), behavior: 'smooth' }));
  track.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);
  new MutationObserver(updateButtons).observe(track, { childList: true });

  // Mouse drag (touch uses native scrolling).
  let down = false;
  let moved = false;
  let startX = 0;
  let startLeft = 0;

  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true;
    moved = false;
    startX = e.clientX;
    startLeft = track.scrollLeft;
  });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 5) {
      moved = true;
      track.classList.add('is-dragging');
    }
    if (moved) track.scrollLeft = startLeft - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    track.classList.remove('is-dragging');
  });
  // A drag must not count as a click on a card or link.
  track.addEventListener(
    'click',
    (e) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    },
    true
  );
  track.addEventListener('dragstart', (e) => e.preventDefault());

  updateButtons();
  return { update: updateButtons };
}
