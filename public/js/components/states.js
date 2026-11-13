// Loading / empty / error states.
import { el } from './dom.js';
import { icon } from './icons.js';

export function skeletonCards(count = 5) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    frag.append(
      el('div', { class: 'product-card product-card--skeleton', 'aria-hidden': 'true' }, [
        el('div', { class: 'skeleton skeleton--image' }),
        el('div', { class: 'skeleton skeleton--line' }),
        el('div', { class: 'skeleton skeleton--line skeleton--short' }),
        el('div', { class: 'skeleton skeleton--btn' }),
      ])
    );
  }
  return frag;
}

function stateBox({ iconName, title, text, actions }) {
  return el('div', { class: 'state__box' }, [
    el('span', { class: 'state__icon', html: icon(iconName, 'icon--lg') }),
    el('h3', { class: 'state__title', text: title }),
    text ? el('p', { class: 'state__text', text }) : null,
    actions && actions.length ? el('div', { class: 'state__actions' }, actions) : null,
  ]);
}

export function emptyState({ title = 'نتیجه‌ای پیدا نشد', text, actionLabel, onAction }) {
  return stateBox({
    iconName: 'search',
    title,
    text,
    actions: actionLabel ? [el('button', { type: 'button', class: 'btn btn--dark', text: actionLabel, onclick: onAction })] : [],
  });
}

export function errorState({ text = 'دریافت اطلاعات با مشکل روبه‌رو شد.', onRetry }) {
  return stateBox({
    iconName: 'alert',
    title: 'خطا',
    text,
    actions: onRetry ? [el('button', { type: 'button', class: 'btn btn--dark', text: 'تلاش دوباره', onclick: onRetry })] : [],
  });
}
