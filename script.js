const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSKmI-Y-b_a4v8VbeJrNpAQjdsMoZfxKXCCLbvW92GhLzTlJQxQjS8htJ-W5df4n-cSO_jY3Yh_QgUD/pub?gid=0&single=true&output=csv";

const WHATSAPP_NUMBER = "27000000000";

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
const modal = document.createElement("div");
modal.className = "product-modal";
modal.innerHTML = `
  <button class="product-modal-close">close</button>
  <img src="" alt="Expanded product image">
`;
document.body.appendChild(modal);

const modalImg = modal.querySelector("img");
const modalClose = modal.querySelector(".product-modal-close");

document.addEventListener("click", event => {
  const image = event.target.closest(".product-image img");

  if (!image) return;

  modalImg.src = image.src;
  modalImg.alt = image.alt || "baadjie product";
  modal.classList.add("is-open");
});

modalClose.addEventListener("click", () => {
  modal.classList.remove("is-open");
  modalImg.src = "";
});

modal.addEventListener("click", event => {
  if (event.target === modal) {
    modal.classList.remove("is-open");
    modalImg.src = "";
  }
});
const modal = document.createElement("div");
modal.className = "product-modal";
modal.innerHTML = `
  <button class="product-modal-close" type="button">close</button>
  <img src="" alt="Expanded product image">
`;

document.body.appendChild(modal);

const modalImg = modal.querySelector("img");
const closeBtn = modal.querySelector(".product-modal-close");

function openProductModal(image){
  modalImg.src = image.src;
  modalImg.alt = image.alt || "baadjie product";
  modal.classList.add("is-open");
  document.body.classList.add("modal-open");
}

function closeProductModal(){
  modal.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  modalImg.src = "";
}

document.addEventListener("click", event => {
  const image = event.target.closest(".product-image img");
  if (image) openProductModal(image);

  if (
    event.target === modal ||
    event.target === closeBtn
  ) {
    closeProductModal();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeProductModal();
});


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

  if (
    card &&
    !event.target.closest(".product-link")
  ) {
    openProductInterface(card);
  }

  if (
    event.target === productModal ||
    event.target === modalClose
  ) {
    closeProductInterface();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeProductInterface();
  }
});
