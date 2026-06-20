const money = (value) => `Rs. ${Number(value).toLocaleString("en-PK")}`;
const cartKey = "lari-cart";
const htmlEscapes = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(cartKey)) || [];
  } catch (error) {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(cartKey, JSON.stringify(items));
  updateCartBadges();
}

function updateCartBadges() {
  const count = getCart().length;
  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    badge.textContent = count;
  });
}

function addToCart(product) {
  const items = getCart();
  items.push({ id: product.id, name: product.name, price: product.price, image: product.image || product.images?.[0] || "" });
  saveCart(items);
}

function productCard(product) {
  const id = encodeURIComponent(product.id);
  const name = escapeHtml(product.name);
  const category = escapeHtml(product.category);
  const image = escapeAttribute(product.image || product.images?.[0] || "");
  const badge = escapeHtml(product.badge);
  return `
    <article class="product-card">
      <a class="product-image" href="product.html?id=${id}">
        <img src="${image}" alt="${name}" />
        ${product.badge ? `<span class="badge ${String(product.badge).includes("%") ? "sale" : ""}">${badge}</span>` : ""}
        <button class="wish collection-wish" type="button" aria-label="Add ${name} to wishlist">LOVE</button>
      </a>
      <div class="product-info">
        <h3><a href="product.html?id=${id}">${name}</a></h3>
        <small>${category}</small>
        <p>${money(product.price)}</p>
        <button class="quick-add inline-add" data-add-product="${escapeAttribute(product.id)}">ADD TO BAG</button>
      </div>
    </article>`;
}

function bindPageAddButtons(products) {
  document.querySelectorAll("[data-add-product]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = products.find((item) => item.id === button.dataset.addProduct);
      if (!product) return;
      addToCart(product);
      button.textContent = "ADDED";
      setTimeout(() => (button.textContent = "ADD TO BAG"), 1000);
    });
  });
}

function setActiveNav() {
  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === current);
  });
}

function paragraphHtml(text) {
  return String(text || "")
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
}

async function applyManagedContent() {
  if (!window.LariStore) return;
  const { settings, visibility = {} } = await LariStore.publicState();
  const about = document.querySelector(".brand-story");
  const contact = document.querySelector(".contact-grid");

  if (about) {
    document.querySelector(".announcement p").textContent = settings.aboutAnnouncement;
    about.querySelector(".eyebrow").textContent = settings.aboutEyebrow;
    about.querySelector("h1").textContent = settings.aboutTitle;
    const cards = about.querySelector(".info-cards");
    about.querySelectorAll(":scope > p").forEach((paragraph) => paragraph.remove());
    about.querySelector("h1").insertAdjacentHTML("afterend", paragraphHtml(settings.aboutBody));
    about.querySelector("h2").textContent = settings.aboutClosing;
    if (cards) about.appendChild(cards);
    [["aboutAnnouncement", ".announcement p"], ["aboutEyebrow", ".brand-story .eyebrow"], ["aboutTitle", ".brand-story h1"], ["aboutBody", ".brand-story > p"], ["aboutClosing", ".brand-story h2"]].forEach(([key, selector]) => {
      document.querySelectorAll(selector).forEach((item) => (item.hidden = visibility[key] === false));
    });
  }

  if (contact) {
    document.querySelector(".announcement p").textContent = settings.contactAnnouncement;
    contact.querySelector(".eyebrow").textContent = settings.contactEyebrow;
    contact.querySelector("h1").textContent = settings.contactTitle;
    const copy = contact.querySelector("div");
    copy.querySelectorAll("p").forEach((paragraph) => paragraph.remove());
    copy.insertAdjacentHTML("beforeend", `
      ${paragraphHtml(settings.contactBody)}
      <p><b>Shipment:</b> ${escapeHtml(settings.shipmentText)}</p>
      <p><b>Returns:</b> ${escapeHtml(settings.returnsText)}</p>
      <p><b>Payments:</b> ${escapeHtml(settings.paymentsText)}</p>
      <p><b>Delivery:</b> ${escapeHtml(settings.deliveryText)}</p>
    `);
    [["contactAnnouncement", ".announcement p"], ["contactEyebrow", ".contact-grid .eyebrow"], ["contactTitle", ".contact-grid h1"], ["contactBody", ".contact-grid div > p:first-of-type"], ["shipmentText", ".contact-grid div > p:nth-of-type(2)"], ["returnsText", ".contact-grid div > p:nth-of-type(3)"], ["paymentsText", ".contact-grid div > p:nth-of-type(4)"], ["deliveryText", ".contact-grid div > p:nth-of-type(5)"]].forEach(([key, selector]) => {
      document.querySelectorAll(selector).forEach((item) => (item.hidden = visibility[key] === false));
    });
  }
}

updateCartBadges();
setActiveNav();
applyManagedContent().catch(() => {});
window.LariSite = { money, escapeHtml, escapeAttribute, getCart, saveCart, addToCart, productCard, bindPageAddButtons, updateCartBadges };
