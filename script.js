const DEFAULT_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSKmI-Y-b_a4v8VbeJrNpAQjdsMoZfxKXCCLbvW92GhLzTlJQxQjS8htJ-W5df4n-cSO_jY3Yh_QgUD/pub?gid=0&single=true&output=csv";

const CONFIG = window.BAADJIE_CONFIG || {};
const SHEET_CSV_URL = CONFIG.SHEET_CSV_URL || DEFAULT_SHEET_CSV_URL;
const WHATSAPP_NUMBER = CONFIG.WHATSAPP_NUMBER || CONFIG.whatsappNumber || "27792820388";

const grid = document.querySelector("#product-grid") || document.querySelector(".product-grid");
const statusText = document.querySelector("#product-status") || document.querySelector(".product-status");
const filterContainer = document.querySelector(".drop-tools");

let allProducts = [];
let activeFilter = "All";

const CACHE_KEY = "baadjie_products_cache_v3";
const CACHE_TIME_KEY = "baadjie_products_cache_time_v3";
const CACHE_MAX_AGE = 1000 * 60 * 10; // 10 minutes

const PRODUCT_BACKGROUNDS = [
  "assets/product-backgrounds/product-bg-01.jpg",
  "assets/product-backgrounds/product-bg-02.jpg",
  "assets/product-backgrounds/product-bg-03.jpg",
  "assets/product-backgrounds/product-bg-04.jpg",
  "assets/product-backgrounds/product-bg-05.jpg",
  "assets/product-backgrounds/product-bg-06.jpg",
  "assets/product-backgrounds/product-bg-07.jpg",
  "assets/product-backgrounds/product-bg-08.jpg",
  "assets/product-backgrounds/product-bg-09.jpg",
  "assets/product-backgrounds/product-bg-10.jpg",
  "assets/product-backgrounds/product-bg-11.jpg",
  "assets/product-backgrounds/product-bg-12.jpg"
];

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value.trim());
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (value || row.length) {
        row.push(value.trim());
        rows.push(row);
      }
      row = [];
      value = "";
      if (char === "\r" && next === "\n") i++;
      continue;
    }

    value += char;
  }

  if (value || row.length) {
    row.push(value.trim());
    rows.push(row);
  }

  if (!rows.length) return [];

  const headers = rows[0].map(header =>
    header.trim().replace(/^\uFEFF/, "").toLowerCase()
  );

  return rows.slice(1)
    .map(values => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || "";
      });
      return obj;
    })
    .filter(product => product.name || product.image);
}

function optimizeCloudinary(url, width = 700) {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url || "";
  }

  if (url.includes("f_auto") || url.includes("q_auto")) {
    return url;
  }

  return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${width},c_limit/`);
}

function preloadImage(src) {
  if (!src) return;
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = src;
  document.head.appendChild(link);
}

function loadCachedProducts() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTime = Number(localStorage.getItem(CACHE_TIME_KEY) || 0);

    if (!cached) return false;

    allProducts = JSON.parse(cached);
    buildFilters();
    renderProducts();

    if (statusText) statusText.textContent = `${allProducts.length} european pieces loaded`;

    return Date.now() - cachedTime < CACHE_MAX_AGE;
  } catch {
    return false;
  }
}

function saveProductsToCache(products) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(products));
    localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  } catch {
    // Storage full or blocked. Site still works.
  }
}

function renderSkeletonCards(count = 6) {
  if (!grid || grid.children.length) return;
  grid.innerHTML = Array.from({ length: count }).map(() => `
    <article class="product-card product-card-skeleton">
      <div class="product-image"></div>
      <div class="product-info">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line title"></div>
        <div class="skeleton-line"></div>
      </div>
    </article>
  `).join("");
}

function buildFilters() {
  if (!filterContainer) return;

  const categories = [
    "All",
    ...new Set(
      allProducts
        .map(product => (product.category || "").trim())
        .filter(Boolean)
    )
  ];

  filterContainer.innerHTML = categories.map(category => `
    <button class="filter-button ${category === activeFilter ? "is-active" : ""}" data-filter="${escapeHTML(category)}">
      ${escapeHTML(category)}
    </button>
  `).join("");
}

function renderProducts() {
  if (!grid) return;

  const filtered =
    activeFilter === "All"
      ? allProducts
      : allProducts.filter(product =>
          (product.category || "").trim().toLowerCase() === activeFilter.toLowerCase()
        );

  if (statusText) {
    statusText.textContent = `${filtered.length} european pieces loaded`;
  }

  const fragment = document.createDocumentFragment();

  filtered.forEach((product, index) => {
    const isSold = (product.status || "").toLowerCase() === "sold";
    const bg = PRODUCT_BACKGROUNDS[index % PRODUCT_BACKGROUNDS.length];
    const image = optimizeCloudinary(product.image || "", index < 8 ? 800 : 550);

    const whatsappMessage = encodeURIComponent(
      product.whatsappText ||
      product.whatsapptext ||
      `Hi, I want the ${product.name || "Baadjie piece"}.`
    );

    const card = document.createElement("article");
    card.className = `product-card reveal ${isSold ? "sold" : ""}`;
    card.style.setProperty("--product-bg", `url("${bg}")`);
    card.style.setProperty("--rail-index", index);

    card.innerHTML = `
      <div class="rail-hanger" aria-hidden="true"><span class="hanger-hook"></span><span class="hanger-body"><span></span></span></div>
      <div class="product-image" style="--product-bg:url('${bg}')">
        <img
          src="${escapeHTML(image)}"
          alt="${escapeHTML(product.name || "baadjie product")}"
          ${index < 8 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" fetchpriority="low"'}
          decoding="async"
        />
      </div>

      <div class="product-info">
        <div class="product-category">${escapeHTML(product.category || "European Stock")}</div>

        <h3 class="product-title">${escapeHTML(product.name || "Untitled")}</h3>

        <div class="product-meta">
          <div>${escapeHTML(product.size || "")}</div>
          <div>${escapeHTML(product.condition || "")}</div>
        </div>

        <p class="product-desc">
          ${escapeHTML(product.description || "Secondhand European piece with character.")}
        </p>

        <div class="product-bottom">
          <div class="price">${escapeHTML(product.price || "")}</div>
          ${
            isSold
              ? `<div class="product-link">sold</div>`
              : `<a class="product-link" target="_blank" rel="noreferrer" href="https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}">claim piece</a>`
          }
        </div>
      </div>
    `;

    const img = card.querySelector("img");
    if (img) {
      img.addEventListener("load", () => card.classList.add("image-loaded"), { once: true });
      if (img.complete) card.classList.add("image-loaded");
      if (index < 8) preloadImage(image);
    }

    fragment.appendChild(card);
  });

  grid.replaceChildren(fragment);
  ensureRailHangers();
  setupRail();
}

async function fetchProducts({ force = false } = {}) {
  try {
    if (statusText && !allProducts.length) statusText.textContent = "loading european stock...";

    const response = await fetch(SHEET_CSV_URL, {
      cache: force ? "reload" : "default"
    });

    if (!response.ok) throw new Error("Failed to fetch sheet");

    const csv = await response.text();
    const products = parseCSV(csv);

    if (!products.length) throw new Error("No products in sheet");

    allProducts = products;
    saveProductsToCache(products);
    buildFilters();
    renderProducts();
  } catch (error) {
    console.error(error);
    if (!allProducts.length && statusText) {
      statusText.textContent = "failed to load products.";
    }
  }
}

function initProducts() {
  if (!grid) return;

  renderSkeletonCards();

  const cacheFresh = loadCachedProducts();

  if (!cacheFresh) {
    fetchProducts({ force: false });
  }
}

/* Filters */
if (filterContainer) {
  filterContainer.addEventListener("click", event => {
    const button = event.target.closest(".filter-button");
    if (!button) return;

    activeFilter = button.dataset.filter || "All";

    filterContainer
      .querySelectorAll(".filter-button")
      .forEach(btn => btn.classList.toggle("is-active", btn === button));

    renderProducts();
  });
}



function ensureRailHangers(){
  if (!grid) return;
  grid.querySelectorAll(".product-card:not(.product-card-skeleton)").forEach(card => {
    if (card.querySelector(".rail-hanger")) return;
    const hanger = document.createElement("div");
    hanger.className = "rail-hanger";
    hanger.setAttribute("aria-hidden", "true");
    hanger.innerHTML = '<span class="hanger-hook"></span><span class="hanger-body"><span></span></span>';
    card.prepend(hanger);
  });
}

/* Stationary rail */
function setupRail() {
  if (!grid) return;
  ensureRailHangers();
  const drops = document.querySelector(".drops-panel");
  if (!drops) return;

  if (!drops.querySelector(".rail-static")) {
    const rail = document.createElement("div");
    rail.className = "rail-static";
    grid.insertAdjacentElement("beforebegin", rail);
  }

  if (!grid.dataset.railReady) {
    grid.dataset.railReady = "true";

    const controls = document.createElement("div");
    controls.className = "rail-controls";
    controls.innerHTML = `
      <div class="rail-note">Pull the rail sideways</div>
      <div class="rail-buttons">
        <button class="rail-button rail-prev" type="button" aria-label="Previous products">←</button>
        <button class="rail-button rail-next" type="button" aria-label="Next products">→</button>
      </div>
    `;
    grid.insertAdjacentElement("afterend", controls);

    const prev = controls.querySelector(".rail-prev");
    const next = controls.querySelector(".rail-next");

    const cardStep = () => {
      const card = grid.querySelector(".product-card:not(.product-card-skeleton)");
      return card ? card.getBoundingClientRect().width + 22 : 300;
    };

    prev?.addEventListener("click", () => grid.scrollBy({ left: -cardStep(), behavior: "smooth" }));
    next?.addEventListener("click", () => grid.scrollBy({ left: cardStep(), behavior: "smooth" }));

    let isDown = false;
    let startX = 0;
    let startLeft = 0;
    let moved = false;

    grid.addEventListener("pointerdown", event => {
      if (event.target.closest("button")) return;
      isDown = true;
      moved = false;
      startX = event.clientX;
      startLeft = grid.scrollLeft;
      grid.setPointerCapture?.(event.pointerId);
    });

    grid.addEventListener("pointermove", event => {
      if (!isDown) return;
      const dx = event.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      if (moved) {
        event.preventDefault();
        grid.scrollLeft = startLeft - dx;
      }
    });

    const endDrag = event => {
      if (moved) {
        grid.dataset.justDragged = "true";
        setTimeout(() => delete grid.dataset.justDragged, 250);
      }
      isDown = false;
      moved = false;
      try { grid.releasePointerCapture?.(event.pointerId); } catch {}
    };

    grid.addEventListener("pointerup", endDrag);
    grid.addEventListener("pointercancel", endDrag);
    grid.addEventListener("pointerleave", () => { isDown = false; });
  }
}

/* Product fullscreen modal - whole card opens */
const productModal = document.createElement("div");
productModal.className = "product-fullscreen";
productModal.innerHTML = `
  <button class="product-fullscreen-close" type="button">close</button>

  <article class="product-fullscreen-card">
    <div class="product-fullscreen-image"><img src="" alt=""></div>

    <div class="product-fullscreen-info">
      <p class="product-fullscreen-category"></p>
      <h2 class="product-fullscreen-title"></h2>
      <p class="product-fullscreen-meta"></p>
      <p class="product-fullscreen-desc"></p>

      <div class="product-fullscreen-bottom">
        <span class="product-fullscreen-price"></span>
        <a class="product-fullscreen-link" target="_blank" rel="noreferrer">claim piece</a>
      </div>
    </div>
  </article>
`;
document.body.appendChild(productModal);

function openProductInterface(card) {
  const image = card.querySelector(".product-image img");
  const title = card.querySelector(".product-title")?.textContent?.trim() || "Baadjie piece";
  const category = card.querySelector(".product-category")?.textContent?.trim() || "European Stock";
  const meta = card.querySelector(".product-meta")?.textContent?.replace(/\s+/g, " ").trim() || "";
  const desc = card.querySelector(".product-desc")?.textContent?.trim() || "";
  const price = card.querySelector(".price")?.textContent?.trim() || "";
  const link = card.querySelector(".product-link");
  const bg = card.style.getPropertyValue("--product-bg");

  productModal.querySelector(".product-fullscreen-image img").src = image?.currentSrc || image?.src || "";
  productModal.querySelector(".product-fullscreen-image img").alt = image?.alt || title;
  productModal.querySelector(".product-fullscreen-category").textContent = category;
  productModal.querySelector(".product-fullscreen-title").textContent = title;
  productModal.querySelector(".product-fullscreen-meta").textContent = meta;
  productModal.querySelector(".product-fullscreen-desc").textContent = desc;
  productModal.querySelector(".product-fullscreen-price").textContent = price;

  const imageBox = productModal.querySelector(".product-fullscreen-image");
  if (bg) {
    imageBox.style.setProperty("--product-bg", bg);
    imageBox.style.backgroundImage =
      `linear-gradient(180deg, rgba(4,44,38,.08), rgba(4,44,38,.18)), ${bg}`;
  }

  const modalLink = productModal.querySelector(".product-fullscreen-link");
  if (link && link.tagName.toLowerCase() === "a") {
    modalLink.href = link.href;
    modalLink.textContent = "claim piece";
    modalLink.style.pointerEvents = "auto";
    modalLink.style.opacity = "1";
  } else {
    modalLink.removeAttribute("href");
    modalLink.textContent = "sold";
    modalLink.style.pointerEvents = "none";
    modalLink.style.opacity = ".55";
  }

  productModal.classList.add("is-open");
  document.body.classList.add("modal-open");
}

function closeProductInterface() {
  productModal.classList.remove("is-open");
  document.body.classList.remove("modal-open");
}

document.addEventListener("click", event => {
  const card = event.target.closest(".product-card");

  if (card && !card.classList.contains("product-card-skeleton")) {
    if (grid?.dataset.justDragged === "true") return;

    event.preventDefault();
    event.stopPropagation();

    card.classList.add("is-popping-out");
    setTimeout(() => {
      card.classList.remove("is-popping-out");
      openProductInterface(card);
    }, 120);
    return;
  }

  if (event.target === productModal || event.target.closest(".product-fullscreen-close")) {
    closeProductInterface();
  }
}, true);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeProductInterface();
});

/* Wardrobe intro scroll animation - kept, but throttled with requestAnimationFrame */
(function(){
  const intro = document.querySelector(".wardrobe-intro");
  const stage = document.querySelector(".wardrobe-stage");
  const left = document.querySelector(".jacket-left");
  const right = document.querySelector(".jacket-right");
  const copy = document.querySelector(".wardrobe-copy");
  const cue = document.querySelector(".scroll-cue");

  if (!intro || !stage || !left || !right || !copy) return;

  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  let target = 0;
  let current = 0;
  let running = false;

  function measure() {
    const rect = intro.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    target = clamp((-rect.top) / Math.max(scrollable, 1), 0, 1);

    if (!running) {
      running = true;
      requestAnimationFrame(render);
    }
  }

  function render() {
    current += (target - current) * 0.14;

    const p = easeOut(current);
    const isMobile = window.matchMedia("(max-width: 560px)").matches;
    const isTablet = window.matchMedia("(max-width: 900px)").matches;

    if (p > 0.025) stage.classList.add("is-opening");
    else stage.classList.remove("is-opening");

    const leftMove = isMobile ? -86 : isTablet ? -78 : -70;
    const rightMove = isMobile ? 86 : isTablet ? 78 : 70;
    const drop = isMobile ? 18 + (20 * p) : 18 + (14 * p);
    const leftRot = -2 + (-23 * p);
    const rightRot = 2 + (23 * p);

    left.style.transform = `translate3d(${leftMove * p}vw, ${drop}px, 0) rotate(${leftRot}deg)`;
    right.style.transform = `translate3d(${rightMove * p}vw, ${drop}px, 0) rotate(${rightRot}deg)`;

    const reveal = clamp((p - 0.16) / 0.48, 0, 1);
    copy.style.opacity = reveal.toFixed(3);
    copy.style.filter = `blur(${(10 * (1 - reveal)).toFixed(2)}px)`;

    if (cue) cue.style.opacity = String(clamp(1 - p * 3.2, 0, 1));

    if (Math.abs(target - current) > 0.001) {
      requestAnimationFrame(render);
    } else {
      current = target;
      running = false;
    }
  }

  measure();
  window.addEventListener("scroll", measure, { passive: true });
  window.addEventListener("resize", measure);
})();

initProducts();
