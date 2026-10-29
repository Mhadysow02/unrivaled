/*
 * Footer block
 * Reads the footer fragment (footer.plain.html). Sections:
 *   - a section with headings → link column (each heading + list is a group; accordion on mobile)
 *   - a section with only a list (+ paragraph) → legal bar and copyright line
 *   - a section with a single "#" link → floating back-to-top button
 */

const DESKTOP = window.matchMedia('(min-width: 1200px)');

async function fetchFooter() {
  // metadata-independent: /content first (local preview), then root (DA/EDS)
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const tmp = document.createElement('div');
  tmp.innerHTML = await resp.text();
  return tmp;
}

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

/** Opens links to other hosts in a new tab; links with an icon get a new-tab indicator. */
function decorateLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const url = new URL(a.href, window.location.href);
    if (url.host === window.location.host || !url.protocol.startsWith('http')) return;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  });
  root.querySelectorAll('li > a').forEach((a) => {
    const img = a.querySelector(':scope > img:first-child');
    if (!img) return;
    a.querySelectorAll('img').forEach((i) => {
      i.width = i === img ? 16 : 14;
      i.height = i === img ? 16 : 14;
    });
    a.classList.add('footer-icon-link');
    const text = el('span', 'footer-link-text');
    [...a.childNodes].filter((n) => n !== img).forEach((n) => text.append(n));
    a.append(text);
  });
}

function buildColumns(sections) {
  const columns = el('div', 'footer-columns');
  const groups = [];
  sections.forEach((section) => {
    const column = el('div', 'footer-column');
    section.querySelectorAll(':scope > h2, :scope > h3, :scope > h4').forEach((heading, i) => {
      const list = heading.nextElementSibling?.tagName === 'UL' ? heading.nextElementSibling : null;
      const group = el('div', 'footer-group');
      const title = el(heading.tagName.toLowerCase(), 'footer-group-title');
      const toggle = el('button', 'footer-group-toggle');
      toggle.type = 'button';
      toggle.textContent = heading.textContent.trim();
      const chevron = el('img', 'footer-group-chevron');
      chevron.src = `${window.hlx?.codeBasePath || ''}/icons/chevron-down.svg`;
      chevron.alt = '';
      chevron.width = 24;
      chevron.height = 24;
      toggle.append(chevron);
      const id = `footer-group-${groups.length + 1}-${i}`;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', id);
      title.append(toggle);
      group.append(title);
      if (list) {
        list.id = id;
        list.className = 'footer-group-list';
        group.append(list);
      }
      groups.push({ toggle, list });
      column.append(group);
    });
    columns.append(column);
  });

  const setOpen = (entry, open) => {
    entry.toggle.setAttribute('aria-expanded', String(open));
    if (entry.list) entry.list.style.maxHeight = open ? `${entry.list.scrollHeight}px` : '';
  };
  groups.forEach((entry) => {
    entry.toggle.addEventListener('click', () => {
      if (DESKTOP.matches) return;
      const open = entry.toggle.getAttribute('aria-expanded') !== 'true';
      groups.forEach((g) => setOpen(g, false));
      setOpen(entry, open);
    });
  });
  const syncMode = () => groups.forEach((g) => {
    setOpen(g, false);
    g.toggle.disabled = DESKTOP.matches;
  });
  DESKTOP.addEventListener('change', syncMode);
  syncMode();
  return columns;
}

function buildBottom(section) {
  const bottom = el('div', 'footer-bottom');
  const inner = el('div', 'footer-bottom-inner');
  const list = section.querySelector('ul');
  if (list) {
    list.className = 'footer-legal';
    inner.append(list);
  }
  section.querySelectorAll(':scope > p').forEach((p) => {
    p.className = 'footer-copyright';
    inner.append(p);
  });
  bottom.append(inner);
  return bottom;
}

function buildBackToTop(link) {
  link.className = 'footer-back-to-top';
  link.setAttribute('aria-label', link.textContent.trim());
  link.title = link.textContent.trim();
  link.innerHTML = '<span class="footer-back-to-top-icon" aria-hidden="true"></span>';
  link.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('header a, main a')?.focus({ preventScroll: true });
  });
  return link;
}

/** @param {Element} block The footer block element */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  if (!fragment) return;
  const sections = [...fragment.children];

  const columnSections = sections.filter((s) => s.querySelector(':scope > h2, :scope > h3, :scope > h4'));
  const backToTopSection = sections.find((s) => {
    const links = s.querySelectorAll('a');
    return links.length === 1 && links[0].getAttribute('href') === '#';
  });
  const bottomSection = sections.find((s) => !columnSections.includes(s) && s !== backToTopSection);

  const wrapper = el('div', 'footer-inner');
  if (columnSections.length) wrapper.append(buildColumns(columnSections));
  if (bottomSection) wrapper.append(buildBottom(bottomSection));
  if (backToTopSection) wrapper.append(buildBackToTop(backToTopSection.querySelector('a')));

  decorateLinks(wrapper);
  block.replaceChildren(wrapper);
}
