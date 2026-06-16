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
  const image = LariSite.escapeAttribute(product.image);
  const productId = LariSite.escapeAttribute(product.id);
  container.innerHTML = `
    <section class="product-detail">
      <img src="${image}" alt="${name}" />
      <div>
        <span class="eyebrow pink">${category}</span>
        <h1>${name}</h1>
        <p class="detail-price">${LariSite.money(product.price)}</p>
        <p>Stock available: ${product.stock}</p>
        <p>${LariSite.escapeHtml(settings.productDescription)}</p>
        <button class="btn btn-yellow" data-add-product="${productId}">${LariSite.escapeHtml(settings.productAddButton)}</button>
        <a class="btn btn-outline-dark" href="collection.html">${LariSite.escapeHtml(settings.productBackButton)}</a>
      </div>
    </section>`;
  [["announcement", ".announcement p"], ["productDescription", ".product-detail div p:nth-of-type(3)"], ["productAddButton", "[data-add-product]"], ["productBackButton", ".product-detail .btn-outline-dark"]].forEach(([key, selector]) => {
    document.querySelectorAll(selector).forEach((item) => (item.hidden = visibility[key] === false));
  });
  LariSite.bindPageAddButtons(state.products);
}

initProduct();
