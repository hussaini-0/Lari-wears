let checkoutSettings = {};

async function applyCheckoutContent() {
  try {
    const { settings, visibility = {} } = await LariStore.publicState();
    checkoutSettings = settings;
    document.querySelectorAll("[data-checkout-copy]").forEach((item) => {
      item.textContent = settings[item.dataset.checkoutCopy] || item.textContent;
      item.hidden = visibility[item.dataset.checkoutCopy] === false;
    });
    updatePaymentInstructions();
  } catch (error) {
    // Keep static fallback content if the local API is unavailable.
  }
}

function updatePaymentInstructions() {
  const method = document.querySelector("[data-payment-method]").value;
  const box = document.querySelector("[data-manual-payment]");
  const instructions = document.querySelector("[data-payment-instructions]");
  const map = {
    "Bank Transfer": checkoutSettings.bankTransferInstructions,
    Easypaisa: checkoutSettings.easypaisaInstructions,
    JazzCash: checkoutSettings.jazzcashInstructions
  };
  box.hidden = !map[method];
  instructions.textContent = map[method] || "";
}

document.querySelector("[data-checkout-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const items = LariSite.getCart();
  if (!items.length) {
    alert("Your bag is empty.");
    return;
  }
  try {
    const form = new FormData(event.currentTarget);
    const result = await LariStore.createOrder({
      items: items.map((item) => item.id),
      customer: form.get("customer"),
      email: form.get("email"),
      phone: form.get("phone"),
      address: form.get("address"),
      payment: form.get("payment"),
      paymentProof: form.get("paymentProof")
    });
    LariSite.saveCart([]);
    alert(`Order ${result.order.id} created and visible in admin.`);
    location.href = "index.html";
  } catch (error) {
    alert(error.message);
  }
});

document.querySelector("[data-payment-method]").addEventListener("change", updatePaymentInstructions);
applyCheckoutContent();
