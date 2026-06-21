const overlay = document.querySelector("[data-overlay]");
const menu = document.querySelector("[data-menu]");
const cart = document.querySelector("[data-cart]");
const search = document.querySelector("[data-search]");
const cartItems = document.querySelector("[data-cart-items]");
const cartEmpty = document.querySelector("[data-cart-empty]");
const counts = document.querySelectorAll("[data-cart-count]");
let items = [];
let catalog = [];

const homeMoney = (value) => `Rs. ${Number(value).toLocaleString("en-PK")}`;
const esc = (value) => LariSite.escapeHtml(value);
const attr = (value) => LariSite.escapeAttribute(value);
const setText = (selector, value) => {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
};
const setImage = (selector, src) => {
  const image = document.querySelector(selector);
  if (image) image.src = src;
};
const setSectionState = (selector, hidden) => {
  const element = document.querySelector(selector);
  if (element) element.hidden = hidden;
};
const applyVisibility = (visibility, pairs) => {
  pairs.forEach(([key, selector]) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.hidden = visibility?.[key] === false;
    });
  });
};

function closeAll() {
  [menu, cart, search, overlay].forEach((element) => element.classList.remove("active"));
}

function openPanel(panel) {
  closeAll();
  panel.classList.add("active");
  overlay.classList.add("active");
}

function renderCart() {
  counts.forEach((count) => (count.textContent = items.length));
  cartEmpty.style.display = items.length ? "none" : "block";
  cartItems.innerHTML = items.map((item) => `<div class="cart-item"><b>${esc(item.name)}</b>${item.size || item.color ? `<br /><small>${esc([item.size ? `Size: ${item.size}` : "", item.color ? `Colour: ${item.color}` : ""].filter(Boolean).join(" · "))}</small>` : ""}<br /><small>${homeMoney(item.price)}</small></div>`).join("");
}

function bindProducts() {
  document.querySelectorAll("[data-add]").forEach((button) => button.addEventListener("click", () => {
    const product = catalog.find((item) => item.id === button.dataset.product);
    if (!product) return;
    if (LariSite.productHasVariants(product)) {
      location.href = `product.html?id=${encodeURIComponent(product.id)}`;
      return;
    }
    LariSite.addToCart(product);
    items = LariSite.getCart();
    renderCart();
    button.textContent = "ADDED";
    setTimeout(() => (button.textContent = "QUICK ADD"), 1200);
  }));
  document.querySelectorAll(".wish").forEach((button) => button.addEventListener("click", () => {
    button.classList.toggle("active");
    button.textContent = button.classList.contains("active") ? "YES" : "LOVE";
  }));
}

function renderStorefront(state) {
  const settings = state.settings;
  const visibility = state.visibility || {};
  catalog = state.products;
  const publishedGallery = state.gallery.filter((image) => typeof image === "string" && image.trim());
  document.querySelectorAll(".announcement p").forEach((item, index) => {
    item.textContent = [settings.announcement, settings.announcementTwo, settings.announcementThree][index] || item.textContent;
  });
  setImage(".hero > img", settings.heroImage);
  setText(".hero-copy .eyebrow", settings.heroEyebrow);
  setText(".hero-copy h1", settings.heroTitle);
  setText(".hero-copy p", settings.heroSubtitle);
  setText(".hero-sticker", settings.heroSticker);
  setText(".departments .section-heading .eyebrow", settings.moodEyebrow);
  setText(".departments .section-heading h2", settings.moodTitle);
  document.querySelectorAll(".ticker span").forEach((item, index) => {
    item.textContent = [settings.tickerOne, settings.tickerTwo, settings.tickerThree, settings.tickerOne, settings.tickerTwo][index] || item.textContent;
  });
  document.querySelectorAll(".department-card").forEach((card, index) => {
    const titles = [settings.departmentOneTitle, settings.departmentTwoTitle, settings.departmentThreeTitle];
    const images = [settings.departmentOneImage, settings.departmentTwoImage, settings.departmentThreeImage];
    setImage(`.department-card:nth-child(${index + 1}) img`, images[index]);
    const title = card.querySelector("h3");
    if (title) title.textContent = titles[index];
  });
  setText(".product-section .eyebrow", settings.trendingEyebrow);
  setText(".product-section h2", settings.trendingTitle);
  setImage(".story-banner > img", settings.storyImage);
  setText(".story-copy .eyebrow", settings.storyEyebrow);
  setText(".story-copy h2", settings.storyTitle);
  setText(".story-copy p", settings.storySubtitle);
  setText(".story-copy .btn", settings.storyButton);
  setText(".feature-section .eyebrow", settings.editEyebrow);
  setText(".feature-section h2", settings.editTitle);
  setText(".feature-section .section-heading p", settings.editSubtitle);
  document.querySelectorAll(".edit-card").forEach((card, index) => {
    const titles = [settings.editOneTitle, settings.editTwoTitle, settings.editThreeTitle];
    const images = [settings.editOneImage, settings.editTwoImage, settings.editThreeImage];
    const image = card.querySelector("img");
    const label = card.querySelector("span");
    if (image) image.src = images[index];
    if (label) label.textContent = `${titles[index]} ->`;
  });
  setText(".insta .eyebrow", settings.instagramEyebrow);
  setText(".insta h2", settings.instagramTitle);
  document.querySelectorAll(".benefits-grid > div").forEach((item, index) => {
    const titles = [settings.benefitOneTitle, settings.benefitTwoTitle, settings.benefitThreeTitle, settings.benefitFourTitle];
    const subtitles = [settings.benefitOneText, settings.benefitTwoText, settings.benefitThreeText, settings.benefitFourText];
    const title = item.querySelector("b");
    const subtitle = item.querySelector("small");
    if (title) title.textContent = titles[index];
    if (subtitle) subtitle.textContent = subtitles[index];
  });
  setText(".footer-brand p", settings.footerText);
  setText(".newsletter h4", settings.newsletterTitle);
  setText(".newsletter p", settings.newsletterText);
  applyVisibility(visibility, [
    ["announcement", ".announcement p:nth-child(1)"], ["announcementTwo", ".announcement p:nth-child(2)"], ["announcementThree", ".announcement p:nth-child(3)"],
    ["heroEyebrow", ".hero-copy .eyebrow"], ["heroTitle", ".hero-copy h1"], ["heroSubtitle", ".hero-copy p"], ["heroImage", ".hero > img"], ["heroSticker", ".hero-sticker"],
    ["moodEyebrow", ".departments .section-heading .eyebrow"], ["moodTitle", ".departments .section-heading h2"],
    ["departmentOneTitle", ".department-card:nth-child(1) h3"], ["departmentOneImage", ".department-card:nth-child(1) img"], ["departmentTwoTitle", ".department-card:nth-child(2) h3"], ["departmentTwoImage", ".department-card:nth-child(2) img"], ["departmentThreeTitle", ".department-card:nth-child(3) h3"], ["departmentThreeImage", ".department-card:nth-child(3) img"],
    ["tickerOne", ".ticker span:nth-of-type(1), .ticker span:nth-of-type(4)"], ["tickerTwo", ".ticker span:nth-of-type(2), .ticker span:nth-of-type(5)"], ["tickerThree", ".ticker span:nth-of-type(3)"],
    ["trendingEyebrow", ".product-section .eyebrow"], ["trendingTitle", ".product-section h2"], ["storyImage", ".story-banner > img"], ["storyEyebrow", ".story-copy .eyebrow"], ["storyTitle", ".story-copy h2"], ["storySubtitle", ".story-copy p"], ["storyButton", ".story-copy .btn"],
    ["editEyebrow", ".feature-section .eyebrow"], ["editTitle", ".feature-section h2"], ["editSubtitle", ".feature-section .section-heading p"], ["editOneTitle", ".edit-card:nth-child(1) span"], ["editOneImage", ".edit-card:nth-child(1) img"], ["editTwoTitle", ".edit-card:nth-child(2) span"], ["editTwoImage", ".edit-card:nth-child(2) img"], ["editThreeTitle", ".edit-card:nth-child(3) span"], ["editThreeImage", ".edit-card:nth-child(3) img"],
    ["instagramEyebrow", ".insta .eyebrow"], ["instagramTitle", ".insta h2"], ["benefitOneTitle", ".benefits-grid > div:nth-child(1) b"], ["benefitOneText", ".benefits-grid > div:nth-child(1) small"], ["benefitTwoTitle", ".benefits-grid > div:nth-child(2) b"], ["benefitTwoText", ".benefits-grid > div:nth-child(2) small"], ["benefitThreeTitle", ".benefits-grid > div:nth-child(3) b"], ["benefitThreeText", ".benefits-grid > div:nth-child(3) small"], ["benefitFourTitle", ".benefits-grid > div:nth-child(4) b"], ["benefitFourText", ".benefits-grid > div:nth-child(4) small"],
    ["footerText", ".footer-brand p"], ["newsletterTitle", ".newsletter h4"], ["newsletterText", ".newsletter p"]
  ]);
  document.querySelector(".product-grid").innerHTML = state.products.map((product) => `
    <article class="product-card">
      <div class="product-image">
        <img src="${attr(product.image)}" alt="${attr(product.name)}" />
        ${product.badge ? `<span class="badge ${String(product.badge).includes("%") ? "sale" : ""}">${esc(product.badge)}</span>` : ""}
        <button class="wish" aria-label="Add ${attr(product.name)} to wishlist">LOVE</button>
        <button class="quick-add" data-add data-product="${attr(product.id)}">${LariSite.productHasVariants(product) ? "SELECT OPTIONS" : "QUICK ADD"}</button>
      </div>
      <div class="product-info"><h3><a href="product.html?id=${encodeURIComponent(product.id)}">${esc(product.name)}</a></h3><p>${homeMoney(product.price)}</p><div class="swatches"><i></i><i></i><i></i></div></div>
    </article>`).join("") || "<p>No products are published yet.</p>";
  document.querySelector(".insta-grid").innerHTML = publishedGallery.map((image) => `<img src="${attr(image)}" alt="LARI community style" />`).join("");
  setSectionState(".insta", !publishedGallery.length || visibility?.instagramTitle === false);
  bindProducts();
}

async function refreshStorefront() {
  try {
    renderStorefront(await LariStore.publicState());
  } catch (error) {
    document.querySelector(".product-grid").innerHTML = `<p>Store data could not load. Please refresh the page.</p>`;
  }
}

document.querySelector("[data-open-menu]").addEventListener("click", () => openPanel(menu));
document.querySelector("[data-open-cart]").addEventListener("click", () => openPanel(cart));
document.querySelector("[data-open-search]").addEventListener("click", () => openPanel(search));
document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", closeAll));
overlay.addEventListener("click", closeAll);
document.querySelector(".newsletter form").addEventListener("submit", (event) => {
  event.preventDefault();
  event.currentTarget.querySelector("button").textContent = "OK";
});
document.querySelector("[data-checkout]").addEventListener("click", async () => {
  if (!items.length) return;
  try {
    await LariStore.createOrder({
      items: items.map((item) => ({ productId: item.id, size: item.size || "", color: item.color || "", image: item.image || "" })),
      customer: "Online Customer",
      payment: "Cash on Delivery"
    });
    items = [];
    LariSite.saveCart([]);
    renderCart();
    closeAll();
    await refreshStorefront();
    alert("Order created. It is now visible in the admin dashboard.");
  } catch (error) {
    alert(error.message);
  }
});
refreshStorefront();
items = LariSite.getCart();
renderCart();
