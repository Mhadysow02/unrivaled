/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-image-grid (source: .v2-content-card.block).
 * One row per card: cell 1 = image; cell 2 = title (H3) + description.
 */
export default function parse(element, { document }) {
  const cells = [];
  element.querySelectorAll('.v2-content-card__item').forEach((item) => {
    const picture = item.querySelector('picture') || item.querySelector('img');
    const content = item.querySelector('.v2-content-card__content');
    const text = [];
    if (content) {
      [...content.children].forEach((el) => {
        if (el.textContent.trim() || el.querySelector('img, picture')) text.push(el);
      });
    }
    cells.push([picture ? [picture] : '', text]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-image-grid', cells });
  element.replaceWith(block);
}
