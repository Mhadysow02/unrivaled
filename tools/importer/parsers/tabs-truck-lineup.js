/* eslint-disable */
/* global WebImporter */

/**
 * Parser for tabs-truck-lineup (source: .v2-truck-lineup.block).
 * One row per tab: cell 1 = tab label; cell 2 = image, heading, description, CTA links.
 * Labels, images and descriptions are paired by document order.
 */
function buildCta(a, document) {
  const link = document.createElement('a');
  link.href = a.getAttribute('href');
  const title = a.getAttribute('title');
  if (title) link.title = title;
  link.textContent = a.textContent.trim();
  const p = document.createElement('p');
  if (a.classList.contains('primary')) {
    const strong = document.createElement('strong');
    strong.append(link);
    p.append(strong);
  } else if (a.classList.contains('secondary')) {
    const em = document.createElement('em');
    em.append(link);
    p.append(em);
  } else {
    p.append(link);
  }
  return p;
}

export default function parse(element, { document }) {
  const cells = [];
  const labels = [...element.querySelectorAll('.v2-truck-lineup__navigation-item')];
  const images = [...element.querySelectorAll('.v2-truck-lineup__image-item')];
  const descs = [...element.querySelectorAll('.v2-truck-lineup__desc-item')];
  const count = Math.max(labels.length, descs.length);

  for (let i = 0; i < count; i += 1) {
    const label = labels[i] ? labels[i].textContent.trim() : '';
    const desc = descs[i];
    const content = [];
    const picture = images[i] && images[i].querySelector('picture, img');
    if (picture) content.push(picture);
    if (desc) {
      const title = desc.querySelector('.v2-truck-lineup__title, h1, h2, h3, h4, h5, h6');
      if (title) content.push(title);
      desc.querySelectorAll('.v2-truck-lineup__description').forEach((p) => content.push(p));
      desc.querySelectorAll('.v2-truck-lineup__buttons-container a[href]').forEach((a) => {
        if (a.textContent.trim()) content.push(buildCta(a, document));
      });
    }
    cells.push([label || (desc && desc.querySelector('h2') ? desc.querySelector('h2').textContent.trim() : ''), content]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-truck-lineup', cells });
  element.replaceWith(block);
}
