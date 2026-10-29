import { createOptimizedPicture, getMetadata, toClassName } from '../../scripts/aem.js';

/**
 * Replace same-origin, non-SVG pictures with optimized ones. External
 * (not yet uploaded) and SVG images keep their authored <picture>.
 */
function optimizePictures(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 900px)', width: '1600' }, { width: '750' }]),
    );
  });
}

function buildArrow(direction, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `tabs-truck-lineup-arrow tabs-truck-lineup-arrow-${direction}`;
  button.setAttribute('aria-label', label);
  return button;
}

/** @param {Element} block The tabs-truck-lineup block element */
export default function decorate(block) {
  const rows = [...block.children].filter((row) => row.children.length >= 2);
  if (!rows.length) return;

  const blockId = `tabs-truck-lineup-${[...document.querySelectorAll('.tabs-truck-lineup')].indexOf(block)}`;

  const stage = document.createElement('div');
  stage.className = 'tabs-truck-lineup-stage';
  const track = document.createElement('div');
  track.className = 'tabs-truck-lineup-track';
  const panels = document.createElement('div');
  panels.className = 'tabs-truck-lineup-panels';
  const tablist = document.createElement('div');
  tablist.className = 'tabs-truck-lineup-tablist';
  tablist.setAttribute('role', 'tablist');

  const tabs = [];
  const panelEls = [];
  const slides = [];

  rows.forEach((row, i) => {
    const [labelCell, contentCell] = row.children;
    const labelText = labelCell.textContent.trim() || `${i + 1}`;
    const id = `${blockId}-${toClassName(labelText) || i}`;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-truck-lineup-tab';
    tab.id = `${id}-tab`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `${id}-panel`);
    tab.innerHTML = labelCell.innerHTML;
    // The label must be inline text inside a button; flatten block-level wrappers.
    tab.querySelectorAll('p').forEach((p) => p.replaceWith(...p.childNodes));
    tabs.push(tab);
    tablist.append(tab);

    const panel = document.createElement('div');
    panel.className = 'tabs-truck-lineup-panel';
    panel.id = `${id}-panel`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);

    // Images live in a shared slider track so the neighbouring trucks peek in.
    const slide = document.createElement('div');
    slide.className = 'tabs-truck-lineup-slide';
    const picture = contentCell.querySelector('picture');
    if (picture) {
      const wrap = picture.closest('p');
      slide.append(picture);
      if (wrap && !wrap.textContent.trim() && !wrap.children.length) wrap.remove();
    }
    slides.push(slide);
    track.append(slide);

    const text = document.createElement('div');
    text.className = 'tabs-truck-lineup-text';
    const ctas = document.createElement('div');
    ctas.className = 'tabs-truck-lineup-ctas';
    [...contentCell.children].forEach((el) => {
      const links = el.querySelectorAll('a[href]');
      const isCtaParagraph = el.tagName === 'P' && links.length
        && el.textContent.trim() === [...links].map((a) => a.textContent.trim()).join('');
      if (isCtaParagraph) ctas.append(el);
      else text.append(el);
    });
    // Loose text nodes (cell without paragraphs).
    if (!contentCell.children.length && contentCell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = contentCell.textContent.trim();
      text.append(p);
    }

    const body = document.createElement('div');
    body.className = 'tabs-truck-lineup-body';
    body.append(text);
    if (ctas.children.length) body.append(ctas);

    panel.append(body);
    panelEls.push(panel);
    panels.append(panel);
  });

  let active = 0;
  const select = (index, focus = false) => {
    active = (index + tabs.length) % tabs.length;
    tabs.forEach((tab, i) => {
      const selected = i === active;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panelEls[i].hidden = !selected;
      panelEls[i].classList.toggle('is-active', selected);
      slides[i].classList.toggle('is-active', selected);
      slides[i].setAttribute('aria-hidden', String(!selected));
    });
    block.style.setProperty('--tabs-truck-lineup-index', active);
    if (focus) tabs[active].focus();
  };

  tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i)));
  tablist.addEventListener('keydown', (e) => {
    const keys = {
      ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: tabs.length - 1,
    };
    if (e.key in keys) {
      e.preventDefault();
      select(keys[e.key], true);
    }
  });

  stage.append(track);
  if (tabs.length > 1) {
    const prev = buildArrow('prev', getMetadata('carousel-previous-label') || 'Previous');
    const next = buildArrow('next', getMetadata('carousel-next-label') || 'Next');
    prev.addEventListener('click', () => select(active - 1));
    next.addEventListener('click', () => select(active + 1));
    stage.append(prev, next);

    // Horizontal swipe on touch screens (arrows are hidden on small viewports).
    let startX = null;
    stage.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) select(active + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  optimizePictures(track);
  block.replaceChildren(stage, tablist, panels);
  select(0);
}
