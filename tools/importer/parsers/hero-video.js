/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-video.
 * Source instances: .v2-hero.block (HLS via video.js, blob: src) and .v2-video.block (.mp4 src).
 * Output:
 *   row 1 = media: optional poster picture + link to the video
 *   row 2 = heading, paragraphs, CTA links (<strong> primary / <em> secondary)
 */
const SOURCE_ORIGIN = 'https://www.volvotrucks.us/';

function toAbsolute(url, document) {
  if (!url) return '';
  try {
    const base = (document && document.baseURI && !document.baseURI.startsWith('about:'))
      ? document.baseURI : SOURCE_ORIGIN;
    return new URL(url, base).href;
  } catch (e) {
    return url;
  }
}

function normalizeVideoUrl(url) {
  if (!url) return '';
  // AEM Assets HLS manifest -> /play delivery URL handled by the block
  return url.replace(/\/manifest\.m3u8(\?.*)?$/i, '/play');
}

function isUsable(url) {
  return !!url && !/^(blob:|data:)/i.test(url);
}

/** Resolve real video.js source (HLS streams expose only blob: URLs on <video>). */
function resolveVideoJsSource(element) {
  try {
    const vjs = (typeof window !== 'undefined') ? window.videojs : undefined;
    if (!vjs || typeof vjs.getPlayer !== 'function') return '';
    const ids = new Set();
    const video = element.querySelector('video');
    const vjsEl = (video && video.closest('.video-js')) || element.querySelector('.video-js');
    if (vjsEl && vjsEl.id) ids.add(vjsEl.id);
    if (video && video.id) ids.add(video.id.replace(/_html5_api$/, ''));
    element.querySelectorAll('[id^="video-"]').forEach((el) => {
      ids.add(el.id.replace(/_html5_api$/, ''));
    });
    for (const id of ids) {
      try {
        const player = vjs.getPlayer(id);
        const src = player && typeof player.currentSrc === 'function' ? player.currentSrc() : '';
        if (isUsable(src)) return src;
        const sources = player && typeof player.currentSources === 'function' ? player.currentSources() : [];
        const found = (sources || []).map((s) => s && s.src).find(isUsable);
        if (found) return found;
      } catch (e) { /* try next id */ }
    }
  } catch (e) { /* ignore */ }
  return '';
}

function resolveVideoSource(element, document) {
  const video = element.querySelector('video');
  const candidates = [];
  if (video) {
    candidates.push(video.getAttribute('src'));
    video.querySelectorAll('source[src]').forEach((s) => candidates.push(s.getAttribute('src')));
  }
  let src = candidates.find(isUsable) || '';
  if (!src) src = resolveVideoJsSource(element);
  if (!isUsable(src)) return '';
  return normalizeVideoUrl(toAbsolute(src, document));
}

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

  // Row 1: media
  const media = [];
  const isHero = element.classList.contains('v2-hero');
  if (!isHero) {
    const picture = element.querySelector('picture');
    const video = element.querySelector('video');
    if (picture && !(picture.closest('.v2-hero__content, .v2-video__content'))) {
      media.push(picture);
    } else if (video && isUsable(video.getAttribute('poster'))) {
      const img = document.createElement('img');
      img.src = toAbsolute(video.getAttribute('poster'), document);
      img.alt = '';
      media.push(img);
    }
  }
  const videoSrc = resolveVideoSource(element, document);
  if (videoSrc) {
    const link = document.createElement('a');
    link.href = videoSrc;
    link.textContent = videoSrc;
    const p = document.createElement('p');
    p.append(link);
    media.push(p);
  }
  cells.push([media]);

  // Row 2: text content
  const content = [];
  const contentRoot = element.querySelector('.v2-hero__content, .v2-video__content, [class*="__content"]') || element;
  contentRoot.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a.button, a').forEach((el) => {
    if (el.closest('.video-js, video')) return;
    if (el.tagName === 'A') {
      if (el.closest('p, h1, h2, h3, h4, h5, h6') && !el.closest('p.button-container')) return;
      if (!el.textContent.trim()) return;
      content.push(buildCta(el, document));
      return;
    }
    if (el.tagName === 'P') {
      if (el.classList.contains('button-container')) return; // handled via its <a>
      if (el.classList.contains('vjs-control-text') || el.closest('.vjs-modal-dialog')) return;
      if (!el.textContent.trim()) return;
    }
    content.push(el);
  });
  cells.push([content]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-video', cells });
  element.replaceWith(block);
}
