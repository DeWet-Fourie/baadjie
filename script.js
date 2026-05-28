const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSKmI-Y-b_a4v8VbeJrNpAQjdsMoZfxKXCCLbvW92GhLzTlJQxQjS8htJ-W5df4n-cSO_jY3Yh_QgUD/pub?gid=0&single=true&output=csv";

const CONFIG = window.BAADJIE_CONFIG || {};
const WHATSAPP_NUMBER = CONFIG.WHATSAPP_NUMBER || "27000000000";

const grid = document.querySelector("#product-grid");
const statusText = document.querySelector("#product-status");
const filterContainer = document.querySelector(".drop-tools");

let allProducts = [];
let activeFilter = "All";

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

  const headers = rows
    .shift()
    .map(header =>
      header
        .trim()
        .replace(/^\uFEFF/, "")
        .toLowerCase()
    );

  return rows
    .map(values => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = values[index] || "";
      });
      return item;
    })
    .filter(item => item.name || item.image);
}

function normaliseProduct(product) {
  return {
    name: product.name || "Untitled piece",
    category: product.category || "European Stock",
    size: product.size || "",
    condition: product.condition || "",
    price: product.price || "",
    status: product.status || "Available",
    image: product.image || product.imageurl || product.photo || "",
    description:
      product.description ||
      "Handpicked secondhand European piece with character.",
    whatsappText: product.whatsapptext || product.whatsappText || ""
  };
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

  filterContainer.innerHTML = "";

  categories.forEach(category => {
    const button = document.createElement("button");
    button.className =
      "filter-button" + (category === activeFilter ? " is-active" : "");
    button.dataset.filter = category;
    button.textContent = category;

    button.addEventListener("click", () => {
      activeFilter = category;

      document
        .querySelectorAll(".filter-button")
        .forEach(btn => btn.classList.remove("is-active"));

      button.classList.add("is-active");
      renderProducts();
    });

    filterContainer.appendChild(button);
  });
}

function productMessage(product) {
  const message =
    product.whatsappText ||
    `Hi, I want to claim this baadjie piece: ${product.name} (${product.size}) - ${product.price}`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function renderProducts() {
  if (!grid) return;

  const filtered =
    activeFilter === "All"
      ? allProducts
      : allProducts.filter(
          product =>
            (product.category || "").trim().toLowerCase() ===
            activeFilter.toLowerCase()
        );

  if (!filtered.length) {
    grid.innerHTML = "";
    if (statusText) statusText.textContent = "No pieces found in this category.";
    return;
  }

  if (statusText) {
    statusText.textContent = `${filtered.length} secondhand European piece${
      filtered.length === 1 ? "" : "s"
    } loaded.`;
  }

  grid.innerHTML = filtered
    .map(product => {
      const sold = (product.status || "").toLowerCase() === "sold";

      return `
        <article class="product-card ${sold ? "sold" : ""}">
          <div class="product-image">
            <img
              src="${escapeHTML(product.image)}"
              alt="${escapeHTML(product.name)}"
              loading="lazy"
              onerror="this.style.opacity='0'; this.closest('.product-image').classList.add('image-missing');"
            />
          </div>

          <div class="product-info">
            <p class="product-category">${escapeHTML(product.category)}</p>
            <h3 class="product-title">${escapeHTML(product.name)}</h3>

            <p class="product-meta">
              ${escapeHTML(product.size)}
              ${product.size && product.condition ? " / " : ""}
              ${escapeHTML(product.condition)}
              ${product.status ? " / " + escapeHTML(product.status) : ""}
            </p>

            <p class="product-desc">${escapeHTML(product.description)}</p>

            <div class="product-bottom">
              <span class="price">${escapeHTML(product.price)}</span>

              ${
                sold
                  ? `<span class="product-link">Sold</span>`
                  : `<a class="product-link" href="${productMessage(product)}" target="_blank" rel="noreferrer">Claim</a>`
              }
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadProducts() {
  try {
    if (statusText) statusText.textContent = "Loading European stock...";

    const response = await fetch(`${SHEET_CSV_URL}&cachebust=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Could not load Google Sheet CSV.");
    }

    const csv = await response.text();
    allProducts = parseCSV(csv).map(normaliseProduct);

    activeFilter = "All";
    buildFilters();
    renderProducts();
  } catch (error) {
    console.error(error);
    if (grid) grid.innerHTML = "";
    if (statusText) {
      statusText.textContent =
        "Could not load products from Google Sheets. Check your published CSV link and column names.";
    }
  }
}

loadProducts();
