let cartSettings = {};
let cartVisibility = {};

function renderCartPage() {
  const items = LariSite.getCart();
  document.querySelector("[data-cart-page]").innerHTML = items.length ? items.map((item, index) => `
    <article class="cart-line">
      <img src="${LariSite.escapeAttribute(item.image)}" alt="${LariSite.escapeAttribute(item.name)}" />
      <div><h3>${LariSite.escapeHtml(item.name)}</h3><p>${LariSite.money(item.price)}</p></div>
      <button data-remove-cart="${index}">REMOVE</button>
    </article>`).join("") : `<p>${LariSite.escapeHtml(cartSettings.cartEmptyText || "Your bag is empty.")}</p>`;
  document.querySelector("[data-cart-subtotal]").textContent = LariSite.money(items.reduce((sum, item) => sum + Number(item.price), 0));
  LariSite.updateCartBadges();
}

async function initCartPage() {
  try {
    const state = await LariStore.publicState();
    cartSettings = state.settings;
    cartVisibility = state.visibility || {};
    document.querySelectorAll("[data-cart-copy]").forEach((item) => {
      item.textContent = cartSettings[item.dataset.cartCopy] || item.textContent;
      item.hidden = cartVisibility[item.dataset.cartCopy] === false;
    });
  } catch (error) {
    cartSettings = {};
    cartVisibility = {};
  }
  renderCartPage();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-cart]");
  if (!button) return;
  const items = LariSite.getCart();
  items.splice(Number(button.dataset.removeCart), 1);
  LariSite.saveCart(items);
  renderCartPage();
});

initCartPage();
