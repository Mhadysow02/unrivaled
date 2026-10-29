/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-video.js
  var SOURCE_ORIGIN = "https://www.volvotrucks.us/";
  function toAbsolute(url, document) {
    if (!url) return "";
    try {
      const base = document && document.baseURI && !document.baseURI.startsWith("about:") ? document.baseURI : SOURCE_ORIGIN;
      return new URL(url, base).href;
    } catch (e) {
      return url;
    }
  }
  function normalizeVideoUrl(url) {
    if (!url) return "";
    return url.replace(/\/manifest\.m3u8(\?.*)?$/i, "/play");
  }
  function isUsable(url) {
    return !!url && !/^(blob:|data:)/i.test(url);
  }
  function resolveVideoJsSource(element) {
    try {
      const vjs = typeof window !== "undefined" ? window.videojs : void 0;
      if (!vjs || typeof vjs.getPlayer !== "function") return "";
      const ids = /* @__PURE__ */ new Set();
      const video = element.querySelector("video");
      const vjsEl = video && video.closest(".video-js") || element.querySelector(".video-js");
      if (vjsEl && vjsEl.id) ids.add(vjsEl.id);
      if (video && video.id) ids.add(video.id.replace(/_html5_api$/, ""));
      element.querySelectorAll('[id^="video-"]').forEach((el) => {
        ids.add(el.id.replace(/_html5_api$/, ""));
      });
      for (const id of ids) {
        try {
          const player = vjs.getPlayer(id);
          const src = player && typeof player.currentSrc === "function" ? player.currentSrc() : "";
          if (isUsable(src)) return src;
          const sources = player && typeof player.currentSources === "function" ? player.currentSources() : [];
          const found = (sources || []).map((s) => s && s.src).find(isUsable);
          if (found) return found;
        } catch (e) {
        }
      }
    } catch (e) {
    }
    return "";
  }
  function resolveVideoSource(element, document) {
    const video = element.querySelector("video");
    const candidates = [];
    if (video) {
      candidates.push(video.getAttribute("src"));
      video.querySelectorAll("source[src]").forEach((s) => candidates.push(s.getAttribute("src")));
    }
    let src = candidates.find(isUsable) || "";
    if (!src) src = resolveVideoJsSource(element);
    if (!isUsable(src)) return "";
    return normalizeVideoUrl(toAbsolute(src, document));
  }
  function buildCta(a, document) {
    const link2 = document.createElement("a");
    link2.href = a.getAttribute("href");
    const title = a.getAttribute("title");
    if (title) link2.title = title;
    link2.textContent = a.textContent.trim();
    const p = document.createElement("p");
    if (a.classList.contains("primary")) {
      const strong = document.createElement("strong");
      strong.append(link2);
      p.append(strong);
    } else if (a.classList.contains("secondary")) {
      const em = document.createElement("em");
      em.append(link2);
      p.append(em);
    } else {
      p.append(link2);
    }
    return p;
  }
  function parse(element, { document }) {
    const cells = [];
    const media = [];
    const isHero = element.classList.contains("v2-hero");
    if (!isHero) {
      const picture = element.querySelector("picture");
      const video = element.querySelector("video");
      if (picture && !picture.closest(".v2-hero__content, .v2-video__content")) {
        media.push(picture);
      } else if (video && isUsable(video.getAttribute("poster"))) {
        const img = document.createElement("img");
        img.src = toAbsolute(video.getAttribute("poster"), document);
        img.alt = "";
        media.push(img);
      }
    }
    const videoSrc = resolveVideoSource(element, document);
    if (videoSrc) {
      const link2 = document.createElement("a");
      link2.href = videoSrc;
      link2.textContent = videoSrc;
      const p = document.createElement("p");
      p.append(link2);
      media.push(p);
    }
    cells.push([media]);
    const content = [];
    const contentRoot = element.querySelector('.v2-hero__content, .v2-video__content, [class*="__content"]') || element;
    contentRoot.querySelectorAll("h1, h2, h3, h4, h5, h6, p, a.button, a").forEach((el) => {
      if (el.closest(".video-js, video")) return;
      if (el.tagName === "A") {
        if (el.closest("p, h1, h2, h3, h4, h5, h6") && !el.closest("p.button-container")) return;
        if (!el.textContent.trim()) return;
        content.push(buildCta(el, document));
        return;
      }
      if (el.tagName === "P") {
        if (el.classList.contains("button-container")) return;
        if (el.classList.contains("vjs-control-text") || el.closest(".vjs-modal-dialog")) return;
        if (!el.textContent.trim()) return;
      }
      content.push(el);
    });
    cells.push([content]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-truck-lineup.js
  function buildCta2(a, document) {
    const link2 = document.createElement("a");
    link2.href = a.getAttribute("href");
    const title = a.getAttribute("title");
    if (title) link2.title = title;
    link2.textContent = a.textContent.trim();
    const p = document.createElement("p");
    if (a.classList.contains("primary")) {
      const strong = document.createElement("strong");
      strong.append(link2);
      p.append(strong);
    } else if (a.classList.contains("secondary")) {
      const em = document.createElement("em");
      em.append(link2);
      p.append(em);
    } else {
      p.append(link2);
    }
    return p;
  }
  function parse2(element, { document }) {
    const cells = [];
    const labels = [...element.querySelectorAll(".v2-truck-lineup__navigation-item")];
    const images = [...element.querySelectorAll(".v2-truck-lineup__image-item")];
    const descs = [...element.querySelectorAll(".v2-truck-lineup__desc-item")];
    const count = Math.max(labels.length, descs.length);
    for (let i = 0; i < count; i += 1) {
      const label = labels[i] ? labels[i].textContent.trim() : "";
      const desc = descs[i];
      const content = [];
      const picture = images[i] && images[i].querySelector("picture, img");
      if (picture) content.push(picture);
      if (desc) {
        const title = desc.querySelector(".v2-truck-lineup__title, h1, h2, h3, h4, h5, h6");
        if (title) content.push(title);
        desc.querySelectorAll(".v2-truck-lineup__description").forEach((p) => content.push(p));
        desc.querySelectorAll(".v2-truck-lineup__buttons-container a[href]").forEach((a) => {
          if (a.textContent.trim()) content.push(buildCta2(a, document));
        });
      }
      cells.push([label || (desc && desc.querySelector("h2") ? desc.querySelector("h2").textContent.trim() : ""), content]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs-truck-lineup", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-card-overlay.js
  function parse3(element, { document }) {
    const cells = [];
    const content = element.querySelector(".v2-dlt__content") || element;
    let image = [...element.querySelectorAll("picture, img")].find((el) => !content.contains(el) && !(el.tagName === "IMG" && el.closest("picture")));
    if (!image) {
      const bg = (element.getAttribute("style") || "").match(/background-image:\s*url\(\s*(?:&quot;|["'])?([^"')&]+(?:&[^"')]*)?)(?:&quot;|["'])?\s*\)/i);
      let src = bg ? bg[1].replace(/&quot;$/, "").replace(/&amp;/g, "&") : "";
      if (src) {
        try {
          src = new URL(src, "https://www.volvotrucks.us/").href;
        } catch (e) {
        }
        image = document.createElement("img");
        image.src = src;
        image.alt = "";
      }
    }
    cells.push([image ? [image] : []]);
    const items = [];
    content.querySelectorAll(":scope > *").forEach((el) => {
      if (el.matches("h1, h2, h3, h4, h5, h6")) {
        items.push(el);
      } else if (el.matches("p.button-container") || el.matches("a[href]")) {
        const a = el.matches("a") ? el : el.querySelector("a[href]");
        if (!a) return;
        const link2 = document.createElement("a");
        link2.href = a.getAttribute("href");
        const title = a.getAttribute("title");
        if (title) link2.title = title;
        link2.textContent = a.textContent.trim();
        const p = document.createElement("p");
        p.append(link2);
        items.push(p);
      } else if (el.textContent.trim()) {
        items.push(el);
      }
    });
    cells.push([items]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-card-overlay", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-image-grid.js
  function parse4(element, { document }) {
    const cells = [];
    element.querySelectorAll(".v2-content-card__item").forEach((item) => {
      const picture = item.querySelector("picture") || item.querySelector("img");
      const content = item.querySelector(".v2-content-card__content");
      const text = [];
      if (content) {
        [...content.children].forEach((el) => {
          if (el.textContent.trim() || el.querySelector("img, picture")) text.push(el);
        });
      }
      cells.push([picture ? [picture] : "", text]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-image-grid", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-story-carousel.js
  function parse5(element, { document }) {
    const cells = [];
    element.querySelectorAll("article.v2-stories-carousel-item").forEach((item) => {
      const picture = item.querySelector("picture") || item.querySelector("img");
      const textRoot = item.querySelector(".v2-stories-carousel-text") || item;
      const cta = textRoot.querySelector("a.v2-stories-carousel-cta, a[href]");
      const imageLink = item.querySelector(":scope > a[href]");
      const href = cta && cta.getAttribute("href") || imageLink && imageLink.getAttribute("href");
      const content = [];
      const heading = textRoot.querySelector("h1, h2, h3, h4, h5, h6");
      if (heading) {
        const h3 = document.createElement("h3");
        if (href) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = heading.textContent.trim();
          h3.append(a);
        } else {
          h3.textContent = heading.textContent.trim();
        }
        content.push(h3);
      }
      textRoot.querySelectorAll(":scope > p").forEach((p) => {
        if (p.textContent.trim()) content.push(p);
      });
      const date = textRoot.querySelector(".v2-stories-carousel-date");
      const readTime = textRoot.querySelector(".v2-stories-carousel-timetoread");
      const meta = [date, readTime].map((el) => el ? el.textContent.trim() : "").filter(Boolean);
      if (meta.length) {
        const p = document.createElement("p");
        p.textContent = meta.join(" | ");
        content.push(p);
      }
      if (cta && cta.textContent.trim()) {
        const a = document.createElement("a");
        a.href = cta.getAttribute("href");
        a.textContent = cta.textContent.trim();
        const p = document.createElement("p");
        p.append(a);
        content.push(p);
      }
      cells.push([picture ? [picture] : "", content]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-story-carousel", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/form.js
  var FORM_DEFINITIONS = { subscribe: "/forms/newsletter.json" };
  function link(document, href) {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = href;
    return a;
  }
  function parse6(element, { document }) {
    const rows = [...element.querySelectorAll(":scope > div")];
    let definition = "";
    let endpoint = "";
    rows.forEach((row) => {
      var _a;
      const href = ((_a = row.querySelector("a[href]")) == null ? void 0 : _a.href) || "";
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
    const block = WebImporter.Blocks.createBlock(document, { name: "form", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/volvotrucks-cleanup.js
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        "#onetrust-banner-sdk",
        "#onetrust-pc-sdk",
        "#ot-sdk-btn-floating",
        ".onetrust-pc-dark-filter",
        "iframe.ot-text-resize"
      ]);
      element.querySelectorAll(".video-js").forEach((player) => {
        [...player.children].forEach((child) => {
          if (child.tagName !== "VIDEO") child.remove();
        });
      });
      WebImporter.DOMUtils.remove(element, [
        ".vjs-control-bar",
        ".vjs-modal-dialog",
        ".vjs-big-play-button",
        ".vjs-loading-spinner",
        ".vjs-text-track-display",
        ".vjs-title-bar"
      ]);
      element.querySelectorAll(".v2-newsletter__title").forEach((title) => {
        const p = element.ownerDocument.createElement("p");
        p.innerHTML = title.innerHTML;
        title.replaceWith(p);
      });
    }
    if (hookName === "afterTransform") {
      WebImporter.DOMUtils.remove(element, [
        // site chrome
        "header.header-wrapper",
        ".header.block",
        "footer.footer-wrapper",
        ".footer.block",
        "nav",
        // interactive-only controls (not authorable)
        ".v2-hero__scroll-icon",
        ".v2-video__playback-button",
        ".v2-stories-carousel-arrowbutton",
        "vcdk-system-icon",
        // embeds / non-content
        "iframe",
        "script",
        "style",
        "noscript",
        "link"
      ]);
      element.querySelectorAll("[data-analytics], [data-track], [onclick], [data-ot-ignore]").forEach((el) => {
        el.removeAttribute("data-analytics");
        el.removeAttribute("data-track");
        el.removeAttribute("onclick");
        el.removeAttribute("data-ot-ignore");
      });
    }
  }

  // tools/importer/transformers/volvotrucks-sections.js
  var MARKER = "data-excat-section-id";
  function findSection(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (let i = 0; i < selectors.length; i += 1) {
      const el = selectors[i] && root.querySelector(selectors[i]);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = findSection(element, section);
        if (el && (i > 0 || section.style)) {
          const hr = document.createElement("hr");
          if (section.style) hr.setAttribute(MARKER, section.id);
          if (i === 0) hr.setAttribute("data-excat-first", "true");
          el.before(hr);
        }
      }
    }
    if (hookName === "afterTransform") {
      const hrs = [...element.querySelectorAll(`hr[${MARKER}]`)];
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (section.style) {
          const marker = hrs.find((hr) => hr.getAttribute(MARKER) === section.id);
          const metadata = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          let anchor = marker ? marker.nextElementSibling : null;
          while (anchor && anchor.tagName !== "HR") anchor = anchor.nextElementSibling;
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
      element.querySelectorAll("hr[data-excat-first]").forEach((hr) => hr.remove());
    }
  }

  // tools/importer/import-home.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "hero-video": parse,
    "tabs-truck-lineup": parse2,
    "hero-card-overlay": parse3,
    "cards-image-grid": parse4,
    "cards-story-carousel": parse5,
    "form": parse6
  };
  var transformers = [transform, transform2];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
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
  var import_home_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
