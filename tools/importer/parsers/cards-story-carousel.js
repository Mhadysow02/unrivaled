/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-story-carousel (source: .v2-stories-carousel.block).
 * One row per story: cell 1 = image; cell 2 = linked H3 title, teaser,
 * date / read-time paragraph, CTA link.
 */
export default function parse(element, { document }) {
  const cells = [];
  element.querySelectorAll('article.v2-stories-carousel-item').forEach((item) => {
    const picture = item.querySelector('picture') || item.querySelector('img');
    const textRoot = item.querySelector('.v2-stories-carousel-text') || item;
    const cta = textRoot.querySelector('a.v2-stories-carousel-cta, a[href]');
    const imageLink = item.querySelector(':scope > a[href]');
    const href = (cta && cta.getAttribute('href')) || (imageLink && imageLink.getAttribute('href'));

    const content = [];
    const heading = textRoot.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      const h3 = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = heading.textContent.trim();
        h3.append(a);
      } else {
        h3.textContent = heading.textContent.trim();
      }
      content.push(h3);
    }

    textRoot.querySelectorAll(':scope > p').forEach((p) => {
      if (p.textContent.trim()) content.push(p);
    });

    const date = textRoot.querySelector('.v2-stories-carousel-date');
    const readTime = textRoot.querySelector('.v2-stories-carousel-timetoread');
    const meta = [date, readTime].map((el) => (el ? el.textContent.trim() : '')).filter(Boolean);
    if (meta.length) {
      const p = document.createElement('p');
      p.textContent = meta.join(' | ');
      content.push(p);
    }

    if (cta && cta.textContent.trim()) {
      const a = document.createElement('a');
      a.href = cta.getAttribute('href');
      a.textContent = cta.textContent.trim();
      const p = document.createElement('p');
      p.append(a);
      content.push(p);
    }

    cells.push([picture ? [picture] : '', content]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-story-carousel', cells });
  element.replaceWith(block);
}
