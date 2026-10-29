/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for www.volvotrucks.us (source is itself an EDS site).
 * Removes non-authorable chrome: header/footer, OneTrust cookie consent,
 * iframes, video.js player chrome, playback/scroll controls and tracking attrs.
 * Selectors taken from migration-work/cleaned.html.
 */
export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // OneTrust cookie banner / preference center / floating button (can sit anywhere in body)
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '#onetrust-pc-sdk',
      '#ot-sdk-btn-floating',
      '.onetrust-pc-dark-filter',
      'iframe.ot-text-resize',
    ]);

    // video.js player chrome: keep only the <video> element inside .video-js
    // so the hero-video parser doesn't pick up control labels ("Play", "Mute", ...)
    element.querySelectorAll('.video-js').forEach((player) => {
      [...player.children].forEach((child) => {
        if (child.tagName !== 'VIDEO') child.remove();
      });
    });
    WebImporter.DOMUtils.remove(element, [
      '.vjs-control-bar',
      '.vjs-modal-dialog',
      '.vjs-big-play-button',
      '.vjs-loading-spinner',
      '.vjs-text-track-display',
      '.vjs-title-bar',
    ]);

    // newsletter consent disclaimer is marked up as h2 on the source but is not a heading
    element.querySelectorAll('.v2-newsletter__title').forEach((title) => {
      const p = element.ownerDocument.createElement('p');
      p.innerHTML = title.innerHTML;
      title.replaceWith(p);
    });
  }

  if (hookName === 'afterTransform') {
    WebImporter.DOMUtils.remove(element, [
      // site chrome
      'header.header-wrapper',
      '.header.block',
      'footer.footer-wrapper',
      '.footer.block',
      'nav',
      // interactive-only controls (not authorable)
      '.v2-hero__scroll-icon',
      '.v2-video__playback-button',
      '.v2-stories-carousel-arrowbutton',
      'vcdk-system-icon',
      // embeds / non-content
      'iframe',
      'script',
      'style',
      'noscript',
      'link',
    ]);

    // strip tracking / runtime attributes
    element.querySelectorAll('[data-analytics], [data-track], [onclick], [data-ot-ignore]').forEach((el) => {
      el.removeAttribute('data-analytics');
      el.removeAttribute('data-track');
      el.removeAttribute('onclick');
      el.removeAttribute('data-ot-ignore');
    });
  }
}
