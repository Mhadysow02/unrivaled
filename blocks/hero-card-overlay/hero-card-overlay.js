/** @param {Element} block The hero-card-overlay block element */
export default function decorate(block) {
  const rows = [...block.children];

  // Media row: the first row with a picture and no heading.
  const mediaRow = rows.find((row) => row.querySelector('picture')
    && !row.querySelector('h1, h2, h3, h4, h5, h6'));

  const media = document.createElement('div');
  media.className = 'hero-card-overlay-media';
  const picture = (mediaRow || block).querySelector('picture');
  if (picture) media.append(picture);
  else block.classList.add('no-image');

  const card = document.createElement('div');
  card.className = 'hero-card-overlay-card';
  rows.forEach((row) => {
    [...row.children].forEach((cell) => {
      [...cell.childNodes].forEach((node) => {
        // Skip empty wrappers left behind by the moved picture.
        if (node.nodeType === Node.ELEMENT_NODE && !node.textContent.trim()
          && !node.querySelector('img, picture, a')) return;
        if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
        card.append(node);
      });
    });
  });

  const content = document.createElement('div');
  content.className = 'hero-card-overlay-content';
  content.append(card);

  block.replaceChildren(media, content);
}
