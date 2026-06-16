let allProducts = [];
const gridKey = "lari-grid-columns";

function applyGridColumns(columns) {
  const safeColumns = ["2", "3", "4", "5"].includes(String(columns)) ? String(columns) : "4";
  const grid = document.querySelector("[data-collection-grid]");
  grid.style.setProperty("--grid-columns", safeColumns);
  localStorage.setItem(gridKey, safeColumns);
  document.querySelectorAll("[data-grid-cols]").forEach((button) => {
    const active = button.dataset.gridCols === safeColumns;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderCollection() {
  const query = document.querySelector("[data-search-products]").value.toLowerCase();
  const category = document.querySelector("[data-filter-category]").value;
  const sort = document.querySelector("[data-sort-products]").value;
  const products = allProducts.filter((product) => {
    const matchesQuery = product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query);
    const matchesCategory = !category || product.category === category;
    return matchesQuery && matchesCategory;
  });
  if (sort === "price-low") products.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === "price-high") products.sort((a, b) => Number(b.price) - Number(a.price));
  if (sort === "new") products.sort((a, b) => String(b.id).localeCompare(String(a.id)));
  document.querySelector("[data-item-count]").textContent = products.length.toLocaleString("en-PK");
  document.querySelector("[data-collection-grid]").innerHTML = products.map(LariSite.productCard).join("") || "<p>No products found.</p>";
  LariSite.bindPageAddButtons(allProducts);
}

function applyCollectionVisibility(visibility) {
  const chipFields = {
    all: ["chipAllLabel", "chipAllImage"],
    eastern: ["chipEasternLabel", "chipEasternImage"],
    western: ["chipWesternLabel", "chipWesternImage"],
    shirts: ["chipShirtsLabel", "chipShirtsImage"],
    sale: ["chipSaleLabel", "chipSaleImage"]
  };
  const pairs = [
    ["collectionTitle", "[data-collection-title]"], ["navHome", "[data-collection-nav='navHome']"], ["navNewIn", "[data-collection-nav='navNewIn']"], ["navCordSets", "[data-collection-nav='navCordSets']"], ["navEastern", "[data-collection-nav='navEastern']"], ["navWestern", "[data-collection-nav='navWestern']"], ["navShirts", "[data-collection-nav='navShirts']"], ["navSale", "[data-collection-nav='navSale']"], ["navAbout", "[data-collection-nav='navAbout']"],
    ["actionSearch", "[data-collection-nav='actionSearch']"], ["actionWishlist", "[data-collection-nav='actionWishlist']"], ["actionAccount", "[data-collection-nav='actionAccount']"], ["actionBag", "[data-collection-nav='actionBag']"],
    ["chipAllLabel", "[data-chip='all'] span"], ["chipAllImage", "[data-chip='all'] img"], ["chipEasternLabel", "[data-chip='eastern'] span"], ["chipEasternImage", "[data-chip='eastern'] img"], ["chipWesternLabel", "[data-chip='western'] span"], ["chipWesternImage", "[data-chip='western'] img"], ["chipShirtsLabel", "[data-chip='shirts'] span"], ["chipShirtsImage", "[data-chip='shirts'] img"], ["chipSaleLabel", "[data-chip='sale'] span"], ["chipSaleImage", "[data-chip='sale'] img"]
  ];
  pairs.forEach(([key, selector]) => document.querySelectorAll(selector).forEach((item) => (item.hidden = visibility?.[key] === false)));
  Object.entries(chipFields).forEach(([chip, fields]) => {
    const chipButton = document.querySelector(`[data-chip='${chip}']`);
    if (chipButton) chipButton.hidden = fields.every((field) => visibility?.[field] === false);
  });
}

function renderCollectionContent(settings, visibility = {}) {
  document.querySelectorAll("[data-collection-nav]").forEach((item) => {
    const value = settings[item.dataset.collectionNav];
    if (value) item.textContent = value;
  });
  document.querySelector("[data-collection-title]").textContent = settings.collectionTitle;
  document.title = `LARI | ${settings.collectionTitle}`;

  const chips = {
    all: [settings.chipAllLabel, settings.chipAllImage],
    eastern: [settings.chipEasternLabel, settings.chipEasternImage],
    western: [settings.chipWesternLabel, settings.chipWesternImage],
    shirts: [settings.chipShirtsLabel, settings.chipShirtsImage],
    sale: [settings.chipSaleLabel, settings.chipSaleImage]
  };

  document.querySelectorAll("[data-chip]").forEach((chip) => {
    const [label, image] = chips[chip.dataset.chip] || [];
    const imageNode = chip.querySelector("img");
    if (label) chip.querySelector("span").textContent = label;
    if (image && /^https?:|^data:|^\//.test(String(image))) {
      imageNode.src = image;
      imageNode.hidden = false;
      chip.classList.remove("empty");
    }
    imageNode.onerror = () => {
      imageNode.hidden = true;
      chip.classList.add("empty");
    };
    imageNode.onload = () => {
      imageNode.hidden = false;
      chip.classList.remove("empty");
    };
  });
  applyCollectionVisibility(visibility);
}

async function initCollection() {
  const state = await LariStore.publicState();
  renderCollectionContent(state.settings, state.visibility);
  allProducts = state.products;
  renderCollection();
}

document.querySelector("[data-search-products]").addEventListener("input", renderCollection);
document.querySelector("[data-filter-category]").addEventListener("change", renderCollection);
document.querySelector("[data-sort-products]").addEventListener("change", renderCollection);
document.querySelectorAll("[data-grid-cols]").forEach((button) => {
  button.addEventListener("click", () => applyGridColumns(button.dataset.gridCols));
});
document.querySelectorAll("[data-chip-category]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector("[data-filter-category]").value = button.dataset.chipCategory;
    renderCollection();
  });
});
applyGridColumns(localStorage.getItem(gridKey) || "4");
initCollection();
