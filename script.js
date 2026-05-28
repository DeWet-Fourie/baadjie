const CONFIG = window.BAADJIE_CONFIG || {};
const SHEET_CSV_URL = CONFIG.SHEET_CSV_URL || "";
const WHATSAPP_NUMBER = CONFIG.WHATSAPP_NUMBER || "27000000000";

const fallbackProducts = [
  { name:"Black Storm Shell", category:"Jackets", size:"L", condition:"Rare", price:"R1,250", status:"Available", image:"https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=90", description:"A secondhand European technical shell with a clean shape and sharp presence." },
  { name:"Grape Puffer", category:"Puffers", size:"XL", condition:"Excellent", price:"R1,650", status:"Available", image:"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=90", description:"Secondhand European winter weight, soft volume, and colour that does the talking." },
  { name:"Vintage Convert Jacket", category:"Jackets", size:"L", condition:"Vintage", price:"R950", status:"Available", image:"https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=900&q=90", description:"A secondhand European outer layer with the kind of wear that feels earned." },
  { name:"Pink Tech Layer", category:"Streetwear", size:"M", condition:"90s", price:"R1,100", status:"Available", image:"https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=90", description:"Bright, clean, secondhand European stock for someone who knows exactly what they found." }
];

const grid = document.querySelector("#product-grid");
const statusText = document.querySelector("#product-status");
const filters = document.querySelectorAll(".filter-button");
let allProducts = [];
let activeFilter = "all";

function parseCSV(text){
  const rows = [];
  let current = "";
  let row = [];
  let insideQuotes = false;

  for(let i = 0; i < text.length; i++){
    const char = text[i];
    const next = text[i + 1];

    if(char === '"' && next === '"'){
      current += '"';
      i++;
    } else if(char === '"'){
      insideQuotes = !insideQuotes;
    } else if(char === "," && !insideQuotes){
      row.push(current.trim());
      current = "";
    } else if((char === "\n" || char === "\r") && !insideQuotes){
      if(current || row.length){
        row.push(current.trim());
        rows.push(row);
        row = [];
        current = "";
      }
      if(char === "\r" && next === "\n") i++;
    } else {
      current += char;
    }
  }
  if(current || row.length){
    row.push(current.trim());
    rows.push(row);
  }

  const headers = rows.shift().map(h => h.toLowerCase().trim());
  return rows.map(values => {
    const item = {};
    headers.forEach((header, index) => item[header] = values[index] || "");
    return item;
  }).filter(item => item.name);
}

function normaliseProduct(product){
  return {
    name: product.name || "Unnamed piece",
    category: product.category || "Jackets",
    size: product.size || "One size",
    condition: product.condition || "Good",
    price: product.price || "POA",
    status: product.status || "Available",
    image: product.image || product.imageurl || "",
    description: product.description || "A handpicked secondhand European baadjie piece with character.",
    whatsappText: product.whatsapptext || product.whatsappText || ""
  };
}

function productMessage(product){
  const message = product.whatsappText || `Hi, I want to buy this baadjie piece: ${product.name} (${product.size}) - ${product.price}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function renderProducts(){
  const visible = allProducts.filter(product => activeFilter === "all" || product.category === activeFilter);

  if(!visible.length){
    grid.innerHTML = "";
    statusText.textContent = "No pieces found for this filter.";
    return;
  }

  statusText.textContent = `${visible.length} piece${visible.length === 1 ? "" : "s"} in this drop.`;
  grid.innerHTML = visible.map(product => {
    const sold = product.status.toLowerCase() === "sold";
    return `
      <article class="product-card ${sold ? "sold" : ""}">
        <div class="product-image">
          <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=90'">
        </div>
        <div class="product-info">
          <p class="product-category">${product.category}</p>
          <h3 class="product-title">${product.name}</h3>
          <p class="product-meta">${product.size} / ${product.condition} / ${product.status}</p>
          <p class="product-desc">${product.description}</p>
          <div class="product-bottom">
            <span class="price">${product.price}</span>
            <a class="product-link" href="${productMessage(product)}" target="_blank" rel="noreferrer">${sold ? "Sold" : "Buy"}</a>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

async function loadProducts(){
  try{
    if(!SHEET_CSV_URL){
      allProducts = fallbackProducts.map(normaliseProduct);
      renderProducts();
      statusText.textContent += " Add your Google Sheets CSV link in config.js to go live.";
      return;
    }

    const response = await fetch(SHEET_CSV_URL);
    if(!response.ok) throw new Error("Could not load sheet");
    const csv = await response.text();
    allProducts = parseCSV(csv).map(normaliseProduct);
    renderProducts();
  } catch(error){
    console.error(error);
    allProducts = fallbackProducts.map(normaliseProduct);
    renderProducts();
    statusText.textContent = "Could not load the sheet, so demo products are showing.";
  }
}

filters.forEach(button => {
  button.addEventListener("click", () => {
    filters.forEach(item => item.classList.remove("is-active"));
    button.classList.add("is-active");
    activeFilter = button.dataset.filter;
    renderProducts();
  });
});

loadProducts();
