/*
 * Header block
 * Reads the nav fragment (nav.plain.html) and builds:
 *   section 1 → brand (logo link)
 *   section 2 → main navigation; each top-level item opens a megamenu panel on click.
 *               Panel children: an item without a sub-list is the "overview" link (mobile only),
 *               items with a sub-list are groups (heading link + links, optional image + description)
 *   section 3 → tools (icon links such as search, account, dealer locator)
 */

import { getMetadata } from '../../scripts/aem.js';

const DESKTOP = window.matchMedia('(min-width: 1200px)');

async function fetchNav() {
  // metadata-independent: /content first (local preview), then root (DA/EDS)
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const tmp = document.createElement('div');
  tmp.innerHTML = await resp.text();
  return tmp;
}

/** Moves an icon image's alt text into visually hidden link text (icon-only links). */
function labelFromAlt(link, img) {
  if (!img?.alt || link.textContent.trim()) return;
  const label = el('span', 'nav-sr-only');
  label.textContent = img.alt;
  img.alt = '';
  link.append(label);
}

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

/** Builds one megamenu link item: optional image, link, optional description text. */
function buildItem(li) {
  const item = el('li', 'nav-item');
  const img = li.querySelector(':scope > img, :scope > picture, :scope > p > img, :scope > p > picture');
  const link = li.querySelector('a');
  if (img) {
    const media = el('div', 'nav-item-media');
    media.append(img.closest('picture') || img);
    item.append(media);
    item.classList.add('has-image');
  }
  if (link) {
    link.className = 'nav-item-link';
    item.append(link);
  }
  const desc = [...li.childNodes]
    .filter((n) => n !== link && !(n.nodeType === 1 && n.matches('img, picture, ul')))
    .map((n) => n.textContent)
    .join(' ')
    .trim();
  if (desc) {
    const d = el('span', 'nav-item-desc');
    d.textContent = desc;
    item.append(d);
  }
  return item;
}

function buildPanel(sublist, id) {
  const panel = el('div', 'nav-mega', { id, hidden: '' });
  const inner = el('div', 'nav-mega-inner');
  [...sublist.children].forEach((li) => {
    const link = li.querySelector(':scope > a, :scope > p > a');
    const items = li.querySelector(':scope > ul');
    if (!items) {
      if (link) {
        const overview = el('div', 'nav-overview');
        overview.append(link);
        inner.append(overview);
      }
      return;
    }
    const group = el('div', 'nav-menu-content');
    const list = el('ul', 'nav-group-items');
    if (link) {
      link.className = 'nav-group-heading';
      link.setAttribute('aria-expanded', 'false');
      link.addEventListener('click', (e) => {
        if (DESKTOP.matches) return;
        e.preventDefault();
        link.setAttribute('aria-expanded', String(link.getAttribute('aria-expanded') !== 'true'));
      });
      group.append(link);
    }
    [...items.children].forEach((child) => list.append(buildItem(child)));
    if (list.querySelector('.has-image')) group.classList.add('has-images');
    group.append(list);
    inner.append(group);
  });
  panel.append(inner);
  return panel;
}

export default async function decorate(block) {
  const fragment = await fetchNav();
  if (!fragment) return;
  const [brandSection, navSection, toolsSection] = [...fragment.children];

  const nav = el('nav', 'header-nav', { 'aria-label': getMetadata('nav-label') || 'Main' });
  const overlay = el('div', 'nav-overlay', { hidden: '' });

  // brand
  const brandLink = brandSection?.querySelector('a');
  if (brandLink) {
    brandLink.className = 'nav-brand';
    const img = brandLink.querySelector('img');
    if (img) {
      img.width = 98;
      img.height = 19;
      labelFromAlt(brandLink, img);
    }
    nav.append(brandLink);
  }

  // main navigation
  const menu = el('ul', 'nav-main');
  const sections = el('div', 'nav-sections', { id: 'nav-sections' });
  const triggers = [];

  const closeAll = () => {
    triggers.forEach(({ link, panel, li }) => {
      link.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
      li.classList.remove('is-open');
      panel.querySelectorAll('.nav-group-heading').forEach((h) => h.setAttribute('aria-expanded', 'false'));
    });
    overlay.hidden = !nav.classList.contains('is-mobile-open') || DESKTOP.matches;
  };

  const toggle = (entry) => {
    const open = !entry.panel.hidden;
    closeAll();
    entry.link.setAttribute('aria-expanded', String(!open));
    entry.panel.hidden = open;
    entry.li.classList.toggle('is-open', !open);
    if (DESKTOP.matches) overlay.hidden = open;
  };

  const topItems = navSection ? [...navSection.querySelectorAll(':scope > ul > li')] : [];
  topItems.forEach((src, i) => {
    const link = src.querySelector(':scope > a, :scope > p > a');
    if (!link) return;
    const li = el('li', 'nav-main-item');
    link.className = 'nav-main-link';
    li.append(link);
    const sublist = src.querySelector(':scope > ul');
    if (sublist) {
      const id = `nav-mega-${i + 1}`;
      const panel = buildPanel(sublist, id);
      link.setAttribute('aria-expanded', 'false');
      link.setAttribute('aria-controls', id);
      li.append(panel);
      const entry = { link, panel, li };
      triggers.push(entry);
      link.addEventListener('click', (e) => {
        e.preventDefault();
        toggle(entry);
      });
    }
    menu.append(li);
  });
  sections.append(menu);

  // tools
  const tools = el('ul', 'nav-tools');
  (toolsSection?.querySelectorAll('li') || []).forEach((src) => {
    const link = src.querySelector('a');
    if (!link) return;
    const li = el('li', 'nav-tool');
    link.className = 'nav-tool-link';
    const img = link.querySelector('img');
    const text = link.textContent.trim();
    if (img) {
      img.width = 24;
      img.height = 24;
      labelFromAlt(link, img);
    }
    if (text) {
      [...link.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).forEach((n) => {
        const span = el('span', 'nav-tool-text');
        span.textContent = n.textContent.trim();
        n.replaceWith(span);
      });
      li.classList.add('has-text');
    }
    li.append(link);
    tools.append(li);
  });

  // mobile drawer: every tool after the first moves into the drawer's top row
  const drawerTools = el('ul', 'nav-drawer-tools');
  [...tools.children].slice(1).forEach((li) => {
    drawerTools.append(li.cloneNode(true));
    li.classList.add('nav-tool-secondary');
  });
  if (drawerTools.children.length) sections.prepend(drawerTools);

  // hamburger (mobile)
  const hamburger = el('button', 'nav-hamburger', {
    type: 'button',
    'aria-controls': 'nav-sections',
    'aria-expanded': 'false',
    'aria-label': getMetadata('nav-open-label') || 'Open navigation',
  });
  hamburger.innerHTML = '<span class="nav-hamburger-icon" aria-hidden="true"></span>';
  const setMobileOpen = (open) => {
    nav.classList.toggle('is-mobile-open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open
      ? (getMetadata('nav-close-label') || 'Close navigation')
      : (getMetadata('nav-open-label') || 'Open navigation'));
    document.body.style.overflowY = open && !DESKTOP.matches ? 'hidden' : '';
    overlay.hidden = !open;
    if (!open) closeAll();
  };
  hamburger.addEventListener('click', () => setMobileOpen(!nav.classList.contains('is-mobile-open')));

  nav.append(sections, tools, hamburger);

  overlay.addEventListener('click', () => {
    if (nav.classList.contains('is-mobile-open') && !DESKTOP.matches) setMobileOpen(false);
    else closeAll();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openEntry = triggers.find(({ link }) => link.getAttribute('aria-expanded') === 'true');
    closeAll();
    if (openEntry) openEntry.link.focus();
    else if (nav.classList.contains('is-mobile-open')) setMobileOpen(false);
  });
  document.addEventListener('click', (e) => {
    if (DESKTOP.matches && !nav.contains(e.target)) closeAll();
  });
  DESKTOP.addEventListener('change', () => setMobileOpen(false));

  const wrapper = el('div', 'nav-wrapper');
  wrapper.append(nav, overlay);
  block.replaceChildren(wrapper);
}
