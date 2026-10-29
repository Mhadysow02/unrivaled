import { getMetadata } from '../../scripts/aem.js';

const VIDEO_EXT = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
// AEM Assets (Dynamic Media with OpenAPI) video delivery, e.g. .../adobe/assets/urn:aaid:aem:<id>/play
const DM_VIDEO = /^(.*\/adobe\/assets\/urn:aaid:aem:[^/]+)\/(play|manifest\.m3u8)$/i;

function isVideoHref(href) {
  const { pathname, origin } = new URL(href, window.location.href);
  return VIDEO_EXT.test(pathname) || DM_VIDEO.test(`${origin}${pathname}`);
}

/**
 * Finds the authored video link in the block (a link to a video file or an AEM Assets video).
 * @param {Element} block
 * @returns {HTMLAnchorElement|null}
 */
function findVideoLink(block) {
  return [...block.querySelectorAll('a[href]')].find((a) => isVideoHref(a.href)) || null;
}

/**
 * Returns the video sources for a link: AEM Assets videos get an HLS stream
 * plus an MP4 fallback for browsers without native HLS support.
 * @param {string} href
 * @returns {{src: string, type: string}[]}
 */
function getSources(href) {
  const { pathname, origin } = new URL(href, window.location.href);
  const dm = `${origin}${pathname}`.match(DM_VIDEO);
  if (dm) {
    return [
      { src: `${dm[1]}/manifest.m3u8`, type: 'application/x-mpegURL' },
      { src: `${dm[1]}/original/as/video.mp4`, type: 'video/mp4' },
    ];
  }
  const ext = pathname.split('.').pop().toLowerCase();
  return [{ src: href, type: `video/${ext === 'mov' ? 'quicktime' : ext}` }];
}

/**
 * Builds a muted, looping background video. Autoplay is skipped when the
 * user prefers reduced motion; the poster image stays visible in that case.
 */
function buildVideo(href, posterImg) {
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.preload = 'none';
  if (posterImg) video.poster = posterImg.currentSrc || posterImg.src;
  getSources(href).forEach(({ src, type }) => {
    const source = document.createElement('source');
    source.src = src;
    source.type = type;
    video.append(source);
  });
  return video;
}

/**
 * Adds a play/pause toggle so autoplaying motion can be stopped (WCAG 2.2.2).
 * Labels come from page metadata so they stay localizable.
 */
function buildToggle(video) {
  const pauseLabel = getMetadata('video-pause-label') || 'Pause';
  const playLabel = getMetadata('video-play-label') || 'Play';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'hero-video-toggle';
  const sync = () => {
    const playing = !video.paused;
    button.setAttribute('aria-label', playing ? pauseLabel : playLabel);
    button.setAttribute('aria-pressed', String(!playing));
    button.classList.toggle('is-paused', !playing);
  };
  button.addEventListener('click', () => {
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  });
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  sync();
  return button;
}

/** @param {Element} block The hero-video block element */
export default function decorate(block) {
  const rows = [...block.children];
  const videoLink = findVideoLink(block);

  // Media row: the row holding the video link or the first picture, without a heading.
  const mediaRow = rows.find((row) => !row.querySelector('h1, h2, h3, h4, h5, h6')
    && (row.querySelector('picture') || (videoLink && row.contains(videoLink))));
  const contentRows = rows.filter((row) => row !== mediaRow);

  const media = document.createElement('div');
  media.className = 'hero-video-media';

  const poster = (mediaRow || block).querySelector('picture');
  if (poster) {
    const posterWrap = poster.closest('p') || poster;
    media.append(poster);
    if (posterWrap !== poster && !posterWrap.textContent.trim() && !posterWrap.children.length) {
      posterWrap.remove();
    }
  }

  let video;
  if (videoLink) {
    const href = videoLink.href;
    const linkWrap = videoLink.closest('p');
    videoLink.remove();
    if (linkWrap && !linkWrap.textContent.trim() && !linkWrap.children.length) linkWrap.remove();
    video = buildVideo(href, poster?.querySelector('img'));
    media.append(video);
  }

  if (!poster && !video) block.classList.add('no-media');

  const content = document.createElement('div');
  content.className = 'hero-video-content';
  contentRows.forEach((row) => {
    [...row.children].forEach((cell) => {
      while (cell.firstChild) content.append(cell.firstChild);
    });
  });
  // Any leftover text in the media row (besides the media) moves to the content.
  if (mediaRow) {
    [...mediaRow.querySelectorAll(':scope > div > *')].forEach((el) => {
      if (el.textContent.trim()) content.append(el);
    });
  }

  // Group the call-to-action paragraphs (a paragraph holding only a link) into one wrapper.
  const ctaParas = [...content.children].filter((el) => {
    const link = el.tagName === 'P' && el.querySelector('a[href]');
    return link && el.textContent.trim() === link.textContent.trim();
  });
  if (ctaParas.length) {
    const ctas = document.createElement('div');
    ctas.className = 'hero-video-ctas';
    ctaParas[0].before(ctas);
    ctas.append(...ctaParas);
  }

  block.replaceChildren(media, content);

  if (video) {
    block.append(buildToggle(video));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) {
      // Start the video once the block is near the viewport, keeping the poster as LCP.
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          video.preload = 'auto';
          video.play().catch(() => {});
        }
      }, { rootMargin: '200px' });
      observer.observe(block);
    }
    video.addEventListener('playing', () => block.classList.add('is-playing'));
  }
}
