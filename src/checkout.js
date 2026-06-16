async function applyCheckoutContent() {
  try {
    const { settings, visibility = {} } = await LariStore.publicState();
    document.querySelectorAll("[data-checkout-copy]").forEach((item) => {
      item.textContent = settings[item.dataset.checkoutCopy] || item.textContent;
      item.hidden = visibility[item.dataset.checkoutCopy] === false;
    });
  } catch (error) {
    // Keep static fallback content if the local API is unavailable.
  }
}

document.querySelector("[data-checkout-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const items = LariSite.getCart();
  if (!items.length) {
    alert("Your bag is empty.");
    return;
  }
  try {
    const customer = new FormData(event.currentTarget).get("customer");
    const result = await LariStore.createOrder(items.map((item) => item.id), customer);
    LariSite.saveCart([]);
    alert(`Order ${result.order.id} created and visible in admin.`);
    location.href = "index.html";
  } catch (error) {
    alert(error.message);
  }
});

applyCheckoutContent();
