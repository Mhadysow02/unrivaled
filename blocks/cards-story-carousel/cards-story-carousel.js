import { createOptimizedPicture, getMetadata } from '../../scripts/aem.js';

/**
 * Replace same-origin, non-SVG pictures with optimized ones. External
 * (not yet uploaded) and SVG images keep their authored <picture>.
 */
function optimizePictures(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
}

/** True when a paragraph holds nothing but links (a CTA line). */
function isLinkOnly(el) {
  const links = [...el.querySelectorAll('a[href]')];
  return links.length > 0
    && el.textContent.trim() === links.map((a) => a.textContent.trim()).join('');
}

/** Split an authored "date | read time" line into separate items. */
function splitMeta(p) {
  if (p.children.length || !p.textContent.includes('|')) return;
  const parts = p.textContent.split('|').map((t) => t.trim()).filter(Boolean);
  p.replaceChildren(...parts.map((text) => {
    const span = document.createElement('span');
    span.textContent = text;
    return span;
  }));
}

function buildCard(row) {
  const li = document.createElement('li');
  li.className = 'cards-story-carousel-card';

  const image = document.createElement('div');
  image.className = 'cards-story-carousel-image';
  const body = document.createElement('div');
  body.className = 'cards-story-carousel-body';

  [...row.children].forEach((cell) => {
    const picture = cell.querySelector('picture');
    if (picture) {
      const wrap = picture.closest('p');
      image.append(picture);
      if (wrap && !wrap.textContent.trim() && !wrap.children.length) wrap.remove();
    }
    while (cell.firstChild) body.append(cell.firstChild);
  });

  // Text paragraphs after the heading: first is the teaser, a later one is the
  // date / read-time line. Link-only paragraphs are the CTA.
  const paragraphs = [...body.querySelectorAll(':scope > p')];
  paragraphs.filter(isLinkOnly).forEach((p) => p.classList.add('cards-story-carousel-cta'));
  const textParas = paragraphs.filter((p) => !isLinkOnly(p) && p.textContent.trim());
  if (textParas.length >= 2) {
    const meta = textParas[textParas.length - 1];
    meta.classList.add('cards-story-carousel-meta');
    splitMeta(meta);
  }

  if (image.children.length) li.append(image);
  else li.classList.add('no-image');
  li.append(body);
  return li;
}

function buildArrow(direction, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `cards-story-carousel-arrow cards-story-carousel-arrow-${direction}`;
  button.setAttribute('aria-label', label);
  return button;
}

/** @param {Element} block The cards-story-carousel block element */
export default function decorate(block) {
  const track = document.createElement('ul');
  track.className = 'cards-story-carousel-track';
  [...block.children].forEach((row) => track.append(buildCard(row)));
  optimizePictures(track);
  block.replaceChildren(track);

  const cards = [...track.children];
  if (!cards.length) return;

  const controls = document.createElement('div');
  controls.className = 'cards-story-carousel-controls';
  const prev = buildArrow('prev', getMetadata('carousel-previous-label') || 'Previous');
  const next = buildArrow('next', getMetadata('carousel-next-label') || 'Next');
  controls.append(prev, next);
  if (cards.length > 1) block.append(controls);

  let active = -1;
  const behavior = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
  const centerOf = (card) => card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2;

  const setActive = (index) => {
    if (index === active) return;
    active = index;
    cards.forEach((card, i) => card.classList.toggle('active', i === index));
    prev.disabled = index <= 0;
    next.disabled = index >= cards.length - 1;
  };

  /** The active card is the one closest to the centre of the track. */
  const sync = () => {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    cards.forEach((card, i) => {
      const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - mid);
      const best = Math.abs(cards[closest].offsetLeft + cards[closest].offsetWidth / 2 - mid);
      if (d < best) closest = i;
    });
    setActive(closest);
  };

  const goTo = (index, smooth = true) => {
    const i = Math.max(0, Math.min(cards.length - 1, index));
    track.scrollTo({ left: centerOf(cards[i]), behavior: smooth ? behavior() : 'instant' });
    setActive(i);
  };

  prev.addEventListener('click', () => goTo(active - 1));
  next.addEventListener('click', () => goTo(active + 1));

  let frame;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(sync);
  }, { passive: true });

  // keyboard users: bring a focused card to the centre so its text is visible
  track.addEventListener('focusin', (e) => {
    const index = cards.indexOf(e.target.closest('.cards-story-carousel-card'));
    if (index > -1 && index !== active) goTo(index);
  });

  // Position once the track has a size (CSS and section may still be loading).
  // Wide screens open on the second story so a neighbour peeks on both sides.
  let ready = false;
  new ResizeObserver(() => {
    if (!track.clientWidth) return;
    if (!ready) {
      ready = true;
      const wide = window.matchMedia('(width >= 900px)').matches;
      goTo(wide && cards.length > 2 ? 1 : 0, false);
    } else {
      goTo(active, false);
    }
  }).observe(track);
  setActive(0);
}
