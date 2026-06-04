const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSKmI-Y-b_a4v8VbeJrNpAQjdsMoZfxKXCCLbvW92GhLzTlJQxQjS8htJ-W5df4n-cSO_jY3Yh_QgUD/pub?gid=0&single=true&output=csv";

const WHATSAPP_NUMBER = "27792820388";

const grid = document.querySelector(".product-grid");
const statusText = document.querySelector(".product-status");
const filterContainer = document.querySelector(".drop-tools");

let allProducts = [];
let activeFilter = "All";

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

  return rows.slice(1).map(values => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || "";
    });
    return obj;
  }).filter(product => product.name || product.image);
}

function buildFilters() {
  if (!filterContainer) return;

  filterContainer.innerHTML = "";

  const categories = [
    "All",
    ...new Set(
      allProducts
        .map(product => (product.category || "").trim())
        .filter(Boolean)
    )
  ];

  categories.forEach(category => {
    const button = document.createElement("button");

    button.className =
      `filter-button ${category === activeFilter ? "is-active" : ""}`;

    button.dataset.filter = category;
    button.textContent = category;

    button.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-button")
        .forEach(btn => btn.classList.remove("is-active"));

      button.classList.add("is-active");
      activeFilter = category;
      renderProducts();
    });

    filterContainer.appendChild(button);
  });
}

async function loadProducts() {
  try {
    if (statusText) statusText.textContent = "loading european stock...";

    const response = await fetch(`${SHEET_CSV_URL}&cache=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) throw new Error("Failed to fetch sheet");

    const csv = await response.text();
    allProducts = parseCSV(csv);

    buildFilters();
    renderProducts();
  } catch (error) {
    console.error(error);
    if (statusText) statusText.textContent = "failed to load products.";
  }
}

function renderProducts() {
  if (!grid) return;

  grid.innerHTML = "";

  const filtered =
    activeFilter === "All"
      ? allProducts
      : allProducts.filter(
          product =>
            (product.category || "").trim().toLowerCase() ===
            activeFilter.toLowerCase()
        );

  if (statusText) {
    statusText.textContent = `${filtered.length} european pieces loaded`;
  }

  filtered.forEach(product => {
    const isSold = (product.status || "").toLowerCase() === "sold";

    const whatsappMessage = encodeURIComponent(
      product.whatsappText ||
        product.whatsapptext ||
        `Hi, I want the ${product.name}.`
    );

    const card = document.createElement("article");
    card.className = `product-card reveal ${isSold ? "sold" : ""}`;

    card.innerHTML = `
      <div class="product-image">
        <img
          src="${product.image || ""}"
          alt="${product.name || "baadjie product"}"
          loading="lazy"
        />
      </div>

      <div class="product-info">
        <div class="product-category">
          ${product.category || "European Stock"}
        </div>

        <h3 class="product-title">
          ${product.name || "Untitled"}
        </h3>

        <div class="product-meta">
          <div>${product.size || ""}</div>
          <div>${product.condition || ""}</div>
        </div>

        <p class="product-desc">
          ${product.description || "Secondhand European piece with character."}
        </p>

        <div class="product-bottom">
          <div class="price">
            ${product.price || ""}
          </div>

          ${
            isSold
              ? `<div class="product-link">sold</div>`
              : `<a
                    class="product-link"
                    target="_blank"
                    href="https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}"
                 >claim piece</a>`
          }
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

loadProducts();


/* ---------------- PRODUCT FULLSCREEN INTERFACE ---------------- */

const productModal = document.createElement("div");
productModal.className = "product-fullscreen";
productModal.innerHTML = `
  <button class="product-fullscreen-close" type="button">close</button>

  <article class="product-fullscreen-card">
    <div class="product-fullscreen-image">
      <img src="" alt="">
    </div>

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

const modalClose = productModal.querySelector(".product-fullscreen-close");
const modalImage = productModal.querySelector(".product-fullscreen-image img");
const modalCategory = productModal.querySelector(".product-fullscreen-category");
const modalTitle = productModal.querySelector(".product-fullscreen-title");
const modalMeta = productModal.querySelector(".product-fullscreen-meta");
const modalDesc = productModal.querySelector(".product-fullscreen-desc");
const modalPrice = productModal.querySelector(".product-fullscreen-price");
const modalLink = productModal.querySelector(".product-fullscreen-link");

function openProductInterface(card){
  const image = card.querySelector(".product-image img");
  const category = card.querySelector(".product-category");
  const title = card.querySelector(".product-title");
  const meta = card.querySelector(".product-meta");
  const desc = card.querySelector(".product-desc");
  const price = card.querySelector(".price");
  const link = card.querySelector(".product-link");

  modalImage.src = image?.src || "";
  const bg = card.style.getPropertyValue("--product-bg");
  if (bg) productModal.style.setProperty("--product-bg", bg);
  modalImage.alt = image?.alt || title?.textContent?.trim() || "baadjie product";

  modalCategory.textContent = category?.textContent?.trim() || "European Stock";
  modalTitle.textContent = title?.textContent?.trim() || "Untitled";
  modalMeta.textContent = meta?.textContent?.replace(/\s+/g, " ").trim() || "";
  modalDesc.textContent = desc?.textContent?.trim() || "";
  modalPrice.textContent = price?.textContent?.trim() || "";

  if (link && link.tagName.toLowerCase() === "a") {
    modalLink.href = link.href;
    modalLink.textContent = link.textContent.trim() || "claim piece";
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

function closeProductInterface(){
  productModal.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  modalImage.src = "";
}

document.addEventListener("click", event => {
  const card = event.target.closest(".product-card");

  if (card && !event.target.closest(".product-link")) {
    openProductInterface(card);
  }

  if (event.target === productModal || event.target === modalClose) {
    closeProductInterface();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeProductInterface();
  }
});



/* ---------------- BAADJIE PRODUCT BACKGROUND FIX ----------------
   This is intentionally at the very bottom of script.js so it runs AFTER products are created.
   It cycles the uploaded retro backgrounds through the product cards.
--------------------------------------------------------------- */

const BAADJIE_PRODUCT_BACKGROUNDS = [
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

function baadjieApplyProductBackgrounds() {
  const cards = document.querySelectorAll(".product-card");

  cards.forEach((card, index) => {
    const bg = BAADJIE_PRODUCT_BACKGROUNDS[index % BAADJIE_PRODUCT_BACKGROUNDS.length];
    const imageBlock = card.querySelector(".product-image");

    card.classList.add("has-retro-bg");
    card.style.setProperty("--product-bg", `url('${bg}')`);
    card.dataset.productBg = bg;

    if (imageBlock) {
      imageBlock.style.setProperty("--product-bg", `url('${bg}')`);
      imageBlock.style.backgroundImage = `linear-gradient(180deg, rgba(4,44,38,.08), rgba(4,44,38,.18)), url('${bg}')`;
      imageBlock.style.backgroundSize = "cover";
      imageBlock.style.backgroundPosition = "center";
    }
  });
}

function baadjieStartBackgroundWatcher() {
  const productGrid = document.querySelector("#product-grid");

  if (!productGrid) return;

  baadjieApplyProductBackgrounds();

  const observer = new MutationObserver(() => {
    baadjieApplyProductBackgrounds();
  });

  observer.observe(productGrid, {
    childList: true,
    subtree: true
  });

  // Safety re-runs because Google Sheets products load async.
  setTimeout(baadjieApplyProductBackgrounds, 400);
  setTimeout(baadjieApplyProductBackgrounds, 1000);
  setTimeout(baadjieApplyProductBackgrounds, 2000);
}

document.addEventListener("DOMContentLoaded", baadjieStartBackgroundWatcher);
window.addEventListener("load", baadjieApplyProductBackgrounds);

// If the product modal exists, make the opened product use the same background.
document.addEventListener("click", (event) => {
  const card = event.target.closest(".product-card");
  if (!card) return;

  const bg = card.dataset.productBg || card.style.getPropertyValue("--product-bg");
  if (!bg) return;

  setTimeout(() => {
    const modalImage = document.querySelector(".product-fullscreen-image");
    const modal = document.querySelector(".product-fullscreen");
    if (modal) modal.style.setProperty("--product-bg", bg.startsWith("url") ? bg : `url('${bg}')`);
    if (modalImage) {
      modalImage.style.backgroundImage = `linear-gradient(180deg, rgba(4,44,38,.08), rgba(4,44,38,.18)), ${bg.startsWith("url") ? bg : `url('${bg}')`}`;
      modalImage.style.backgroundSize = "cover";
      modalImage.style.backgroundPosition = "center";
    }
  }, 30);
});


/* =========================================================
   BAADJIE WARDROBE INTRO SCROLL ANIMATION - SMOOTH FIX
   ========================================================= */
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
  let ticking = false;

  function getProgress(){
    const rect = intro.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    return clamp((-rect.top) / Math.max(scrollable, 1), 0, 1);
  }

  function render(){
    current += (target - current) * 0.14;

    if (Math.abs(target - current) < 0.001) {
      current = target;
      ticking = false;
    } else {
      requestAnimationFrame(render);
    }

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
  }

  function requestUpdate(){
    target = getProgress();
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  }

  requestUpdate();
  window.addEventListener("scroll", requestUpdate, { passive:true });
  window.addEventListener("resize", requestUpdate);
})();



/* =========================================================
   BAADJIE PRODUCT INSPECTION ONLY
   Keeps flashlight hover, removes side slider and product stamps.
   ========================================================= */
(function(){
  document.addEventListener("pointermove", function(e){
    const image = e.target.closest(".product-image");
    if (!image) return;

    const rect = image.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    image.style.setProperty("--mx", `${x.toFixed(2)}%`);
    image.style.setProperty("--my", `${y.toFixed(2)}%`);
  }, { passive:true });
})();


/* =========================================================
   IMPROVED CLOTHING RAIL PRODUCT BEHAVIOUR
   Stationary rail + faster image loading attributes.
   ========================================================= */
(function(){
  function optimizeProductImages(){
    document.querySelectorAll("#product-grid img").forEach((img, index) => {
      img.loading = index < 4 ? "eager" : "lazy";
      img.decoding = "async";
      if (index < 4) img.fetchPriority = "high";
      else img.fetchPriority = "low";
    });
  }

  function setupRail(){
    const grid = document.querySelector("#product-grid");
    const drops = document.querySelector(".drops-panel");
    if (!grid || !drops) return;

    if (!drops.querySelector(".rail-static")) {
      const rail = document.createElement("div");
      rail.className = "rail-static";
      grid.insertAdjacentElement("beforebegin", rail);
    }

    if (grid.dataset.railReady !== "true") {
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

      function cardStep(){
        const card = grid.querySelector(".product-card");
        return card ? card.getBoundingClientRect().width + 22 : 300;
      }

      prev.addEventListener("click", () => grid.scrollBy({ left:-cardStep(), behavior:"smooth" }));
      next.addEventListener("click", () => grid.scrollBy({ left:cardStep(), behavior:"smooth" }));

      let isDown = false;
      let startX = 0;
      let startLeft = 0;
      let moved = false;

      grid.addEventListener("pointerdown", (e) => {
        if (e.target.closest("button, a")) return;
        isDown = true;
        moved = false;
        startX = e.clientX;
        startLeft = grid.scrollLeft;
        grid.setPointerCapture(e.pointerId);
      });

      grid.addEventListener("pointermove", (e) => {
        if (!isDown) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 5) moved = true;
        if (moved) {
          e.preventDefault();
          grid.scrollLeft = startLeft - dx;
        }
      });

      function endDrag(e){
        isDown = false;
        setTimeout(() => { moved = false; }, 0);
        try { grid.releasePointerCapture(e.pointerId); } catch {}
      }

      grid.addEventListener("pointerup", endDrag);
      grid.addEventListener("pointercancel", endDrag);
      grid.addEventListener("pointerleave", () => { isDown = false; });

      document.addEventListener("click", (e) => {
        const card = e.target.closest(".product-card");
        if (!card || !grid.contains(card)) return;
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        card.classList.add("is-lifted");
        setTimeout(() => card.classList.remove("is-lifted"), 420);
      }, true);
    }

    grid.querySelectorAll(".product-card").forEach((card, index) => {
      card.style.setProperty("--rail-index", index);
    });

    optimizeProductImages();
  }

  setupRail();
  document.addEventListener("DOMContentLoaded", setupRail);
  window.addEventListener("load", setupRail);

  const gridWait = setInterval(() => {
    setupRail();
    const cards = document.querySelectorAll("#product-grid .product-card");
    if (cards.length) clearInterval(gridWait);
  }, 150);

  setTimeout(() => clearInterval(gridWait), 5000);

  const grid = document.querySelector("#product-grid");
  if (grid) {
    new MutationObserver(setupRail).observe(grid, { childList:true, subtree:true });
  }
})();



/* =========================================================
   STABLE PRODUCT MODAL FINAL
   Clean single modal system for desktop + mobile rail.
   ========================================================= */
(function(){
  let downX = 0;
  let downY = 0;
  let downCard = null;
  let dragged = false;
  let suppressClickUntil = 0;

  function txt(card, selector){
    const el = card.querySelector(selector);
    return el ? el.textContent.trim() : "";
  }

  function getNumber(){
    if (window.BAADJIE_CONFIG && window.BAADJIE_CONFIG.whatsappNumber) return window.BAADJIE_CONFIG.whatsappNumber;
    if (window.WHATSAPP_NUMBER) return window.WHATSAPP_NUMBER;
    return "270000000000";
  }

  function ensureModal(){
    let modal = document.querySelector(".product-fullscreen");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.className = "product-fullscreen";
    modal.innerHTML = `
      <button class="product-fullscreen-close" type="button" aria-label="Close product">Close</button>
      <article class="product-fullscreen-card" role="dialog" aria-modal="true">
        <div class="product-fullscreen-image"><img src="" alt="" /></div>
        <div class="product-fullscreen-info">
          <p class="product-fullscreen-category"></p>
          <h2 class="product-fullscreen-title"></h2>
          <p class="product-fullscreen-meta"></p>
          <p class="product-fullscreen-desc"></p>
          <div class="product-fullscreen-bottom">
            <strong class="product-fullscreen-price"></strong>
            <a class="product-fullscreen-link" target="_blank" rel="noreferrer">Claim piece</a>
          </div>
        </div>
      </article>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", function(e){
      if (e.target === modal || e.target.closest(".product-fullscreen-close")) {
        modal.classList.remove("is-open");
        document.body.classList.remove("modal-open");
      }
    });

    return modal;
  }

  function openProduct(card){
    const modal = ensureModal();
    const imageBox = modal.querySelector(".product-fullscreen-image");
    const modalImg = modal.querySelector(".product-fullscreen-image img");
    const cardImg = card.querySelector(".product-image img");
    const imageWrap = card.querySelector(".product-image");

    const title = txt(card, ".product-title") || "Baadjie piece";
    const bg = imageWrap ? getComputedStyle(imageWrap).getPropertyValue("--product-bg") : "";

    modal.querySelector(".product-fullscreen-category").textContent = txt(card, ".product-category") || "Baadjie";
    modal.querySelector(".product-fullscreen-title").textContent = title;
    modal.querySelector(".product-fullscreen-meta").textContent = txt(card, ".product-meta");
    modal.querySelector(".product-fullscreen-desc").textContent = txt(card, ".product-desc");
    modal.querySelector(".product-fullscreen-price").textContent = txt(card, ".price");

    modalImg.src = cardImg ? (cardImg.currentSrc || cardImg.src) : "";
    modalImg.alt = cardImg ? (cardImg.alt || title) : title;

    if (bg) {
      imageBox.style.setProperty("--product-bg", bg);
      imageBox.style.backgroundImage = `linear-gradient(180deg,rgba(4,44,38,.08),rgba(4,44,38,.18)), ${bg}`;
    }

    const claim = modal.querySelector(".product-fullscreen-link");
    claim.href = `https://wa.me/${getNumber()}?text=${encodeURIComponent("Hi, I want to claim this Baadjie piece: " + title)}`;

    modal.classList.add("is-open");
    document.body.classList.add("modal-open");
  }

  document.addEventListener("pointerdown", function(e){
    const card = e.target.closest(".product-card");
    if (!card) return;
    downCard = card;
    downX = e.clientX;
    downY = e.clientY;
    dragged = false;
  }, true);

  document.addEventListener("pointermove", function(e){
    if (!downCard) return;
    if (Math.abs(e.clientX - downX) > 10 || Math.abs(e.clientY - downY) > 10) dragged = true;
  }, true);

  document.addEventListener("pointerup", function(){
    if (dragged) suppressClickUntil = Date.now() + 350;
    downCard = null;
    dragged = false;
  }, true);

  document.addEventListener("click", function(e){
    const card = e.target.closest(".product-card");
    if (!card) return;

    if (Date.now() < suppressClickUntil) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();

    card.classList.remove("is-popping-out");
    void card.offsetWidth;
    card.classList.add("is-popping-out");

    setTimeout(function(){
      card.classList.remove("is-popping-out");
      openProduct(card);
    }, 160);
  }, true);

  document.addEventListener("keydown", function(e){
    if (e.key !== "Escape") return;
    const modal = document.querySelector(".product-fullscreen");
    if (modal) modal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
  });
})();

