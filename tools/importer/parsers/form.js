/* eslint-disable */
/* global WebImporter */

/**
 * Parser for form (source: .v2-newsletter__form-container .v2-forms.block).
 * Source rows: row 1 = form type ("subscribe"), row 2 = submit endpoint URL.
 * Output follows the local form block contract:
 *   row 1 = link to the form definition sheet (/forms/{type}.json)
 *   row 2 = link to the submit endpoint
 */
const FORM_DEFINITIONS = { subscribe: '/forms/newsletter.json' };

function link(document, href) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = href;
  return a;
}

export default function parse(element, { document }) {
  const rows = [...element.querySelectorAll(':scope > div')];
  let definition = '';
  let endpoint = '';
  rows.forEach((row) => {
    const href = row.querySelector('a[href]')?.href || '';
    const text = row.textContent.trim();
    if (href || /^https?:\/\//i.test(text)) {
      endpoint = endpoint || href || text;
    } else if (text) {
      definition = definition || FORM_DEFINITIONS[text.toLowerCase()] || `/forms/${text.toLowerCase()}.json`;
    }
  });

  const cells = [];
  if (definition) cells.push([link(document, definition)]);
  if (endpoint) cells.push([link(document, endpoint)]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'form', cells });
  element.replaceWith(block);
}
