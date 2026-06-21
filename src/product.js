function normalizeSizeStock(product) {
  const stock = product?.sizeStock && typeof product.sizeStock === "object" ? product.sizeStock : {};
  return {
    S: Math.max(0, Number(stock.S || 0)),
    M: Math.max(0, Number(stock.M || 0)),
    L: Math.max(0, Number(stock.L || 0))
  };
}

function availableSizes(product) {
  const stock = normalizeSizeStock(product);
  const sizes = Object.entries(stock).filter(([, count]) => count > 0).map(([size]) => size);
  if (sizes.length) return sizes;
  return Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : [];
}

function availableColors(product) {
  return Array.isArray(product.colors) ? product.colors.filter(Boolean) : [];
}

function selectionSummary(size, color) {
  return [size ? `Size: ${size}` : "", color ? `Colour: ${color}` : ""].filter(Boolean).join(" · ");
}

async function initProduct() {
  const id = new URLSearchParams(location.search).get("id");
  const state = await LariStore.publicState();
  const settings = state.settings;
  const visibility = state.visibility || {};
  const product = state.products.find((item) => item.id === id) || state.products[0];
  const container = document.querySelector("[data-product-detail]");
  const announcement = document.querySelector(".announcement p");
  if (announcement) announcement.textContent = settings.announcement;
  if (!product) {
    container.innerHTML = "<p>Product not found.</p>";
    return;
  }

  document.title = `LARI | ${product.name}`;
  const name = LariSite.escapeHtml(product.name);
  const category = LariSite.escapeHtml(product.category);
  const images = (Array.isArray(product.images) && product.images.length ? product.images : [product.image]).filter(Boolean);
  const image = LariSite.escapeAttribute(images[0] || "");
  const productId = LariSite.escapeAttribute(product.id);
  const description = LariSite.escapeHtml(product.description || settings.productDescription);
  const sizeStock = normalizeSizeStock(product);
  const sizes = availableSizes(product);
  const colors = availableColors(product);
  const stockTotal = Number(product.stock || 0);

  container.innerHTML = `
    <section class="product-detail">
      <div class="product-gallery">
        <img class="product-main-image" src="${image}" alt="${name}" data-product-main-image />
        ${images.length > 1 ? `<div class="product-thumbs">${images.map((item, index) => `<button type="button" class="product-thumb ${index === 0 ? "active" : ""}" data-product-thumb="${LariSite.escapeAttribute(item)}"><img src="${LariSite.escapeAttribute(item)}" alt="${name} view ${index + 1}" /></button>`).join("")}</div>` : ""}
      </div>
      <div class="product-copy">
        <span class="eyebrow pink">${category}</span>
        <h1>${name}</h1>
        <p class="detail-price">${LariSite.money(product.price)}</p>
        <p class="product-stock" data-product-stock>${sizes.length ? "Select a size to view stock" : `Stock available: ${stockTotal}`}</p>
        ${sizes.length ? `<div class="product-option-group"><span>Choose size</span><div class="product-option-list">${sizes.map((size) => `<button type="button" class="product-option" data-size-option="${LariSite.escapeAttribute(size)}">${LariSite.escapeHtml(size)} <small>${Number(sizeStock[size] || 0)}</small></button>`).join("")}</div></div>` : ""}
        ${colors.length ? `<div class="product-option-group"><span>Choose colour</span><div class="product-option-list">${colors.map((color) => `<button type="button" class="product-option color-option" data-color-option="${LariSite.escapeAttribute(color)}">${LariSite.escapeHtml(color)}</button>`).join("")}</div></div>` : ""}
        <p class="product-selection" data-product-selection>${sizes.length || colors.length ? "Select your options before adding to bag." : ""}</p>
        <p class="product-description">${description}</p>
        <div class="product-actions">
          <button class="btn btn-yellow" data-add-product="${productId}">${LariSite.escapeHtml(settings.productAddButton)}</button>
          <a class="btn btn-outline-dark" href="collection.html">${LariSite.escapeHtml(settings.productBackButton)}</a>
        </div>
      </div>
    </section>`;

  [["announcement", ".announcement p"], ["productDescription", ".product-description"], ["productAddButton", "[data-add-product]"], ["productBackButton", ".product-detail .btn-outline-dark"]].forEach(([key, selector]) => {
    document.querySelectorAll(selector).forEach((item) => (item.hidden = visibility[key] === false));
  });

  document.querySelectorAll("[data-product-thumb]").forEach((button) => button.addEventListener("click", () => {
    document.querySelector("[data-product-main-image]").src = button.dataset.productThumb;
    document.querySelectorAll("[data-product-thumb]").forEach((thumb) => thumb.classList.toggle("active", thumb === button));
  }));

  let selectedSize = "";
  let selectedColor = "";
  const stockNode = document.querySelector("[data-product-stock]");
  const selectionNode = document.querySelector("[data-product-selection]");
  const addButton = document.querySelector("[data-add-product]");

  function renderSelection() {
    document.querySelectorAll("[data-size-option]").forEach((button) => {
      button.classList.toggle("active", button.dataset.sizeOption === selectedSize);
    });
    document.querySelectorAll("[data-color-option]").forEach((button) => {
      button.classList.toggle("active", button.dataset.colorOption === selectedColor);
    });
    if (stockNode) {
      stockNode.textContent = selectedSize ? `Stock available in ${selectedSize}: ${Number(sizeStock[selectedSize] || 0)}` : (sizes.length ? "Select a size to view stock" : `Stock available: ${stockTotal}`);
    }
    if (selectionNode) {
      selectionNode.textContent = selectionSummary(selectedSize, selectedColor) || (sizes.length || colors.length ? "Select your options before adding to bag." : "");
    }
  }

  document.querySelectorAll("[data-size-option]").forEach((button) => button.addEventListener("click", () => {
    selectedSize = button.dataset.sizeOption;
    renderSelection();
  }));
  document.querySelectorAll("[data-color-option]").forEach((button) => button.addEventListener("click", () => {
    selectedColor = button.dataset.colorOption;
    renderSelection();
  }));

  addButton?.addEventListener("click", () => {
    if (sizes.length && !selectedSize) {
      alert("Please select a size.");
      return;
    }
    if (colors.length && !selectedColor) {
      alert("Please select a colour.");
      return;
    }
    LariSite.addToCart(product, {
      size: selectedSize,
      color: selectedColor,
      image: document.querySelector("[data-product-main-image]")?.getAttribute("src") || image
    });
    addButton.textContent = "ADDED";
    setTimeout(() => {
      addButton.textContent = settings.productAddButton;
    }, 1000);
  });

  renderSelection();
}

initProduct();
