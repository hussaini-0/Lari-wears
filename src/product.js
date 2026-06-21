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
  const sizes = Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : [];
  container.innerHTML = `
    <section class="product-detail">
      <div class="product-gallery">
        <img class="product-main-image" src="${image}" alt="${name}" data-product-main-image />
        ${images.length > 1 ? `<div class="product-thumbs">${images.map((item, index) => `<button type="button" class="product-thumb ${index === 0 ? "active" : ""}" data-product-thumb="${LariSite.escapeAttribute(item)}"><img src="${LariSite.escapeAttribute(item)}" alt="${name} view ${index + 1}" /></button>`).join("")}</div>` : ""}
      </div>
      <div>
        <span class="eyebrow pink">${category}</span>
        <h1>${name}</h1>
        <p class="detail-price">${LariSite.money(product.price)}</p>
        <p>Stock available: ${product.stock}</p>
        ${sizes.length ? `<div class="product-sizes"><span>Available sizes</span><div>${sizes.map((size) => `<b>${LariSite.escapeHtml(size)}</b>`).join("")}</div></div>` : ""}
        <p>${description}</p>
        <button class="btn btn-yellow" data-add-product="${productId}">${LariSite.escapeHtml(settings.productAddButton)}</button>
        <a class="btn btn-outline-dark" href="collection.html">${LariSite.escapeHtml(settings.productBackButton)}</a>
      </div>
    </section>`;
  [["announcement", ".announcement p"], ["productDescription", ".product-detail div p:nth-of-type(3)"], ["productAddButton", "[data-add-product]"], ["productBackButton", ".product-detail .btn-outline-dark"]].forEach(([key, selector]) => {
    document.querySelectorAll(selector).forEach((item) => (item.hidden = visibility[key] === false));
  });
  document.querySelectorAll("[data-product-thumb]").forEach((button) => button.addEventListener("click", () => {
    document.querySelector("[data-product-main-image]").src = button.dataset.productThumb;
    document.querySelectorAll("[data-product-thumb]").forEach((thumb) => thumb.classList.toggle("active", thumb === button));
  }));
  LariSite.bindPageAddButtons(state.products);
}

initProduct();
