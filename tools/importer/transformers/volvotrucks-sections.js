/* eslint-disable */
/* global WebImporter */

/**
 * Section transformer for www.volvotrucks.us.
 * beforeTransform: inserts <hr> section breaks (and markers for styled sections)
 * while the source div.section elements still exist.
 * afterTransform: appends Section Metadata blocks for styled sections.
 */
const MARKER = 'data-excat-section-id';

function findSection(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (let i = 0; i < selectors.length; i += 1) {
    const el = selectors[i] && root.querySelector(selectors[i]);
    if (el) return el;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];
  if (sections.length < 2) return;
  const document = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = findSection(element, section);
      if (el && (i > 0 || section.style)) {
        const hr = document.createElement('hr');
        if (section.style) hr.setAttribute(MARKER, section.id);
        if (i === 0) hr.setAttribute('data-excat-first', 'true');
        el.before(hr);
      }
    }
  }

  if (hookName === 'afterTransform') {
    const hrs = [...element.querySelectorAll(`hr[${MARKER}]`)];
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (section.style) {
        const marker = hrs.find((hr) => hr.getAttribute(MARKER) === section.id);
        const metadata = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        // Section Metadata goes at the end of the section: before the next <hr>
        let anchor = marker ? marker.nextElementSibling : null;
        while (anchor && anchor.tagName !== 'HR') anchor = anchor.nextElementSibling;
        if (marker) {
          if (anchor) anchor.before(metadata);
          else marker.parentElement.append(metadata);
        } else {
          const el = findSection(element, section);
          if (el) el.after(metadata);
        }
      }
    }
    element.querySelectorAll(`hr[${MARKER}]`).forEach((hr) => hr.removeAttribute(MARKER));
    element.querySelectorAll('hr[data-excat-first]').forEach((hr) => hr.remove());
  }
}
