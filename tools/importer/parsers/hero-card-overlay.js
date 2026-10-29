/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-card-overlay (source: .v2-dealer-locator-teaser.block).
 * Row 1 = background image; row 2 = heading, paragraph(s), link.
 */
export default function parse(element, { document }) {
  const cells = [];

  const content = element.querySelector('.v2-dlt__content') || element;
  let image = [...element.querySelectorAll('picture, img')]
    .find((el) => !content.contains(el) && !(el.tagName === 'IMG' && el.closest('picture')));
  if (!image) {
    // live DOM: the block JS moves the <img> into an inline background-image
    const bg = (element.getAttribute('style') || '').match(/background-image:\s*url\(\s*(?:&quot;|["'])?([^"')&]+(?:&[^"')]*)?)(?:&quot;|["'])?\s*\)/i);
    let src = bg ? bg[1].replace(/&quot;$/, '').replace(/&amp;/g, '&') : '';
    if (src) {
      try { src = new URL(src, 'https://www.volvotrucks.us/').href; } catch (e) { /* keep */ }
      image = document.createElement('img');
      image.src = src;
      image.alt = '';
    }
  }
  cells.push([image ? [image] : []]);

  const items = [];
  content.querySelectorAll(':scope > *').forEach((el) => {
    if (el.matches('h1, h2, h3, h4, h5, h6')) {
      items.push(el);
    } else if (el.matches('p.button-container') || el.matches('a[href]')) {
      const a = el.matches('a') ? el : el.querySelector('a[href]');
      if (!a) return;
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      const title = a.getAttribute('title');
      if (title) link.title = title;
      link.textContent = a.textContent.trim();
      const p = document.createElement('p');
      p.append(link);
      items.push(p);
    } else if (el.textContent.trim()) {
      items.push(el);
    }
  });
  cells.push([items]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-card-overlay', cells });
  element.replaceWith(block);
}
