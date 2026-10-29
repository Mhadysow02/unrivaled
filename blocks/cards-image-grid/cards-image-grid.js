import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Replace same-origin, non-SVG pictures with optimized ones. External
 * (not yet uploaded) and SVG images keep their authored <picture>.
 */
function optimizePictures(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '1200' }]));
  });
}

/** @param {Element} block The cards-image-grid block element */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-image-grid-card';

    const image = document.createElement('div');
    image.className = 'cards-image-grid-image';
    const body = document.createElement('div');
    body.className = 'cards-image-grid-body';

    [...row.children].forEach((cell) => {
      const picture = cell.querySelector('picture');
      // A cell that is only a picture is the image cell.
      if (picture && !cell.textContent.trim()) {
        image.append(picture);
        return;
      }
      if (picture) {
        const wrap = picture.closest('p');
        image.append(picture);
        if (wrap && !wrap.textContent.trim() && !wrap.children.length) wrap.remove();
      }
      while (cell.firstChild) body.append(cell.firstChild);
    });

    if (image.children.length) li.append(image);
    else li.classList.add('no-image');
    li.append(body);
    ul.append(li);
  });

  optimizePictures(ul);
  block.replaceChildren(ul);
}
