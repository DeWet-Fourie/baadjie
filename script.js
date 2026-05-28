const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSKmI-Y-b_a4v8VbeJrNpAQjdsMoZfxKXCCLbvW92GhLzTlJQxQjS8htJ-W5df4n-cSO_jY3Yh_QgUD/pub?gid=0&single=true&output=csv";

const WHATSAPP_NUMBER = "27000000000";

const grid = document.querySelector(".product-grid");
const statusText = document.querySelector(".product-status");
const filterButtons = document.querySelectorAll(".filter-button");

let allProducts = [];
let activeFilter = "All";

/* ---------------- CSV PARSER ---------------- */

function parseCSV(text) {
  const lines = text.trim().split("\n");

  const headers = lines[0]
    .split(",")
    .map(h => h.trim().replace(/"/g, ""));

  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];

    const obj = {};

    headers.forEach((header, index) => {
      obj[header] = (values[index] || "")
        .replace(/^"|"$/g, "")
        .trim();
    });

    return obj;
  });
}

/* ---------------- FETCH PRODUCTS ---------------- */

async function loadProducts() {
  try {
    statusText.textContent = "loading european stock...";

    const response = await fetch(SHEET_CSV_URL);

    if (!response.ok) {
      throw new Error("Failed to fetch sheet");
    }

    const csv = await response.text();

    allProducts = parseCSV(csv);

    renderProducts();

  } catch (error) {
    console.error(error);

    statusText.textContent =
      "failed to load products.";
  }
}

/* ---------------- RENDER PRODUCTS ---------------- */

function renderProducts() {

  grid.innerHTML = "";

  let filtered = allProducts;

  if (activeFilter !== "All") {
    filtered = allProducts.filter(
      p =>
        (p.category || "").toLowerCase() ===
        activeFilter.toLowerCase()
    );
  }

  statusText.textContent =
    `${filtered.length} european pieces loaded`;

  filtered.forEach(product => {

    const isSold =
      (product.status || "").toLowerCase() === "sold";

    const whatsappMessage =
      encodeURIComponent(
        product.whatsappText ||
        `Hi, I want the ${product.name}.`
      );

    const card = document.createElement("article");

    card.className =
      `product-card reveal ${isSold ? "sold" : ""}`;

    card.innerHTML = `
      <div class="product-image">
        <img
          src="${product.image}"
          alt="${product.name}"
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
          ${
            product.description ||
            "Secondhand European piece with character."
          }
        </p>

        <div class="product-bottom">

          <div class="price">
            ${product.price || ""}
          </div>

          ${
            isSold
              ? `
                <div class="product-link">
                  sold
                </div>
              `
              : `
                <a
                  class="product-link"
                  target="_blank"
                  href="https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}"
                >
                  claim piece
                </a>
              `
          }

        </div>

      </div>
    `;

    grid.appendChild(card);
  });
}

/* ---------------- FILTERS ---------------- */

filterButtons.forEach(button => {

  button.addEventListener("click", () => {

    filterButtons.forEach(btn =>
      btn.classList.remove("is-active")
    );

    button.classList.add("is-active");

    activeFilter =
      button.dataset.filter || "All";

    renderProducts();
  });
});

/* ---------------- START ---------------- */

loadProducts();
