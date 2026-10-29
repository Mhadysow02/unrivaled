/* eslint-disable */
/* global WebImporter */

import heroVideoParser from "./parsers/hero-video.js";
import tabsTruckLineupParser from "./parsers/tabs-truck-lineup.js";
import heroCardOverlayParser from "./parsers/hero-card-overlay.js";
import cardsImageGridParser from "./parsers/cards-image-grid.js";
import cardsStoryCarouselParser from "./parsers/cards-story-carousel.js";
import formParser from "./parsers/form.js";
import cleanupTransformer from "./transformers/volvotrucks-cleanup.js";
import sectionsTransformer from "./transformers/volvotrucks-sections.js";

const PAGE_TEMPLATE = {
  "name": "home",
  "urls": [
    "https://www.volvotrucks.us/"
  ],
  "representativeUrl": "https://www.volvotrucks.us/",
  "description": "Volvo Trucks USA homepage: video hero, truck lineup tabs, dealer locator teaser, electromobility video banner, promises cards, stories carousel and newsletter signup",
  "urlPattern": "/",
  "blocks": [
    {
      "name": "hero-video",
      "instances": [
        ".v2-hero.block",
        ".v2-video.block"
      ]
    },
    {
      "name": "tabs-truck-lineup",
      "instances": [
        ".v2-truck-lineup.block"
      ]
    },
    {
      "name": "hero-card-overlay",
      "instances": [
        ".v2-dealer-locator-teaser.block"
      ]
    },
    {
      "name": "cards-image-grid",
      "instances": [
        ".v2-content-card.block"
      ]
    },
    {
      "name": "cards-story-carousel",
      "instances": [
        ".v2-stories-carousel.block"
      ]
    },
    {
      "name": "form",
      "instances": [
        ".v2-newsletter__form-container .v2-forms.block"
      ]
    }
  ],
  "sections": [
    {
      "id": "rc1",
      "name": "Hero - All-new Volvo VNX",
      "selector": [
        "div.section.v2-hero-container"
      ],
      "style": null,
      "blocks": [
        "hero-video"
      ],
      "defaultContent": []
    },
    {
      "id": "rc2",
      "name": "Truck lineup header",
      "selector": [
        "div.section.v2-section-header-container:not(.v2-content-card-container):not(.v2-stories-carousel-container)"
      ],
      "style": "centered",
      "blocks": [],
      "defaultContent": [
        ".v2-section-header-wrapper"
      ]
    },
    {
      "id": "rc3",
      "name": "Truck lineup tabs/slider",
      "selector": [
        "div.section.v2-truck-lineup-container"
      ],
      "style": null,
      "blocks": [
        "tabs-truck-lineup"
      ],
      "defaultContent": []
    },
    {
      "id": "rc4",
      "name": "Find a dealer teaser",
      "selector": [
        "div.section.v2-dealer-locator-teaser-container"
      ],
      "style": null,
      "blocks": [
        "hero-card-overlay"
      ],
      "defaultContent": []
    },
    {
      "id": "rc5",
      "name": "Electromobility video banner",
      "selector": [
        "div.section.v2-video-container"
      ],
      "style": null,
      "blocks": [
        "hero-video"
      ],
      "defaultContent": []
    },
    {
      "id": "rc6",
      "name": "Our promises",
      "selector": [
        "div.section.v2-content-card-container"
      ],
      "style": "centered",
      "blocks": [
        "cards-image-grid"
      ],
      "defaultContent": [
        ".v2-section-header-wrapper"
      ]
    },
    {
      "id": "rc7",
      "name": "Stories from the road + newsletter",
      "selector": [
        "div.section.v2-stories-carousel-container"
      ],
      "style": "centered",
      "blocks": [
        "cards-story-carousel",
        "form"
      ],
      "defaultContent": [
        ".v2-section-header-wrapper",
        ".v2-newsletter__text"
      ]
    }
  ]
};

const parsers = {
  "hero-video": heroVideoParser,
  "tabs-truck-lineup": tabsTruckLineupParser,
  "hero-card-overlay": heroCardOverlayParser,
  "cards-image-grid": cardsImageGridParser,
  "cards-story-carousel": cardsStoryCarouselParser,
  "form": formParser,
};

const transformers = [cleanupTransformer, sectionsTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers("beforeTransform", main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers("afterTransform", main, payload);

    main.appendChild(document.createElement("hr"));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, "")
      .replace(/\.html?$/, "");
    const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
