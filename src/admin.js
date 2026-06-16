let state;
let token = sessionStorage.getItem("lari-admin-token") || "";
const panels = document.querySelectorAll("[data-panel]");
const navButtons = document.querySelectorAll("[data-view]");
const productDialog = document.querySelector("[data-product-dialog]");
const mediaDialog = document.querySelector("[data-media-dialog]");
const importDialog = document.querySelector("[data-import-dialog]");
const productForm = document.querySelector("[data-product-form]");
const mediaForm = document.querySelector("[data-media-form]");
const importForm = document.querySelector("[data-import-form]");
const homeForm = document.querySelector("[data-home-form]");
const pageEditorSelect = document.querySelector("[data-page-editor-select]");
const pageEditor = document.querySelector("[data-page-editor]");
const editorPreviewLink = document.querySelector("[data-editor-preview-link]");
const titles = { overview: "Store overview", products: "Manage products", media: "Media library", editor: "Edit pages", homepage: "Site content", orders: "Orders" };
const money = (value) => `Rs. ${Number(value).toLocaleString("en-PK")}`;
const pageEditorPages = {
  home: {
    label: "Home page",
    url: "index.html",
    sections: [
      ["Announcement bar", ["announcement", "announcementTwo", "announcementThree"]],
      ["Hero", ["heroEyebrow", "heroTitle", "heroSubtitle", ["Hero image", "heroImage"], "heroSticker"]],
      ["Mood cards", ["moodEyebrow", "moodTitle", ["Department 1", "departmentOneTitle", "departmentOneImage"], ["Department 2", "departmentTwoTitle", "departmentTwoImage"], ["Department 3", "departmentThreeTitle", "departmentThreeImage"]]],
      ["Ticker and products", ["tickerOne", "tickerTwo", "tickerThree", "trendingEyebrow", "trendingTitle"]],
      ["Story banner", ["storyEyebrow", "storyTitle", "storySubtitle", "storyButton", ["Story image", "storyImage"]]],
      ["Edit cards", ["editEyebrow", "editTitle", "editSubtitle", ["Edit card 1", "editOneTitle", "editOneImage"], ["Edit card 2", "editTwoTitle", "editTwoImage"], ["Edit card 3", "editThreeTitle", "editThreeImage"]]],
      ["Instagram, benefits, footer", ["instagramEyebrow", "instagramTitle", "benefitOneTitle", "benefitOneText", "benefitTwoTitle", "benefitTwoText", "benefitThreeTitle", "benefitThreeText", "benefitFourTitle", "benefitFourText", "footerText", "newsletterTitle", "newsletterText"]]
    ]
  },
  collection: {
    label: "Collection page",
    url: "collection.html",
    sections: [
      ["Header navigation", ["navHome", "navNewIn", "navCordSets", "navEastern", "navWestern", "navShirts", "navSale", "navAbout", "actionSearch", "actionWishlist", "actionAccount", "actionBag"]],
      ["Title and category circles", ["collectionTitle", ["Chip All", "chipAllLabel", "chipAllImage"], ["Chip Eastern", "chipEasternLabel", "chipEasternImage"], ["Chip Western", "chipWesternLabel", "chipWesternImage"], ["Chip Shirts", "chipShirtsLabel", "chipShirtsImage"], ["Chip Sale", "chipSaleLabel", "chipSaleImage"]]],
      ["Product grid", ["__products"]]
    ]
  },
  product: {
    label: "Product page",
    url: "product.html",
    sections: [
      ["Product detail template", ["productDescription", "productAddButton", "productBackButton", "__products"]]
    ]
  },
  cart: {
    label: "Cart page",
    url: "cart.html",
    sections: [
      ["Header", ["cartAnnouncement", "cartContinueLabel", "cartAdminLabel"]],
      ["Cart content", ["cartEyebrow", "cartTitle", "cartSummaryTitle", "cartSubtotalLabel", "cartCheckoutButton", "cartEmptyText"]]
    ]
  },
  checkout: {
    label: "Checkout page",
    url: "checkout.html",
    sections: [
      ["Checkout copy", ["checkoutAnnouncement", "checkoutEyebrow", "checkoutTitle", "checkoutIntro"]],
      ["Checkout form labels", ["checkoutNameLabel", "checkoutEmailLabel", "checkoutPhoneLabel", "checkoutAddressLabel", "checkoutPaymentLabel", "checkoutSubmitButton"]],
      ["Manual payments", ["manualPaymentTitle", "bankTransferInstructions", "easypaisaInstructions", "jazzcashInstructions", "paymentProofLabel"]]
    ]
  },
  about: {
    label: "About page",
    url: "about.html",
    sections: [
      ["About content", ["aboutAnnouncement", "aboutEyebrow", "aboutTitle", "aboutBody", "aboutClosing"]]
    ]
  },
  contact: {
    label: "Contact page",
    url: "contact.html",
    sections: [
      ["Contact content", ["contactAnnouncement", "contactEyebrow", "contactTitle", "contactBody", "shipmentText", "returnsText", "paymentsText", "deliveryText"]]
    ]
  }
};
const fieldLabels = {
  __products: "Products are edited from the Products tab"
};

function labelFromKey(key) {
  if (fieldLabels[key]) return fieldLabels[key];
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function isImageField(key) {
  return key.toLowerCase().includes("image");
}

function showLogin(error = "") {
  document.body.innerHTML = `
    <main class="login-screen">
      <form data-login-form class="login-card">
        <a class="brand" href="index.html"><b>LARI</b><span>wears</span></a>
        <p class="kicker">SECURE ADMIN AREA</p>
        <h1>Admin login</h1>
        <label>Password<input name="password" type="password" autocomplete="current-password" required autofocus /></label>
        ${error ? `<p class="login-error">${error}</p>` : ""}
        <button class="primary" type="submit">LOGIN</button>
        <small>Default local password: lari-admin-2026. Change it with LARI_ADMIN_PASSWORD before deployment.</small>
      </form>
    </main>`;
  document.querySelector("[data-login-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const result = await LariStore.login(new FormData(event.currentTarget).get("password"));
      sessionStorage.setItem("lari-admin-token", result.token);
      location.reload();
    } catch (loginError) {
      showLogin(loginError.message);
    }
  });
}

async function loadState() {
  try {
    state = await LariStore.adminState(token);
    renderAll();
  } catch (error) {
    sessionStorage.removeItem("lari-admin-token");
    showLogin(error.message);
  }
}

async function save(message) {
  try {
    state = await LariStore.saveAdmin(token, state);
    renderAll();
    toast(message);
  } catch (error) {
    toast(error.message);
  }
}

function toast(message) {
  const element = document.querySelector("[data-toast]");
  if (!element) return;
  element.textContent = message;
  element.classList.add("active");
  setTimeout(() => element.classList.remove("active"), 1800);
}

function showPanel(name) {
  panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === name));
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === name));
  document.querySelector("[data-page-title]").textContent = titles[name];
  document.querySelector(".sidebar").classList.remove("active");
}

function orderTable(orders, editable) {
  return `<table class="data-table"><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>PAYMENT</th><th>DATE</th><th>TOTAL</th><th>STATUS</th>${editable ? "<th>ACTION</th>" : ""}</tr></thead><tbody>${orders.map((order) => `<tr><td><b>${order.id}</b></td><td>${order.customer}<br /><small>${order.phone || ""}</small><br /><small>${order.address || ""}</small></td><td>${order.payment || "Cash on Delivery"}${order.paymentProof ? `<br /><small>${order.paymentProof}</small>` : ""}</td><td>${order.date}</td><td>${money(order.total)}</td><td><span class="pill ${order.status}">${order.status}</span></td>${editable ? `<td><select data-order-status="${order.id}"><option ${order.status === "Processing" ? "selected" : ""}>Processing</option><option ${order.status === "Payment Pending" ? "selected" : ""}>Payment Pending</option><option ${order.status === "Paid" ? "selected" : ""}>Paid</option><option ${order.status === "Shipped" ? "selected" : ""}>Shipped</option><option ${order.status === "Delivered" ? "selected" : ""}>Delivered</option><option ${order.status === "Cancelled" ? "selected" : ""}>Cancelled</option></select></td>` : ""}</tr>`).join("")}</tbody></table>`;
}

function renderOverview() {
  const revenue = state.orders.filter((order) => order.status !== "Cancelled").reduce((sum, order) => sum + Number(order.total), 0);
  const lowStock = state.products.filter((product) => Number(product.stock) < 5).length;
  document.querySelector("[data-stats]").innerHTML = [
    ["TOTAL SALES", money(revenue), "Backend synced"],
    ["ORDERS", state.orders.length, "Server stored"],
    ["PRODUCTS", state.products.length, `${state.products.filter((product) => product.active).length} published`],
    ["LOW STOCK", lowStock, lowStock ? "Needs attention" : "Healthy inventory"]
  ].map(([label, value, detail]) => `<div class="stat"><span>${label}</span><b>${value}</b><small>${detail}</small></div>`).join("");
  document.querySelector("[data-recent-orders]").innerHTML = orderTable(state.orders.slice(0, 4), false);
}

function renderProducts() {
  const query = document.querySelector("[data-product-search]").value.toLowerCase();
  const products = state.products.filter((product) => product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query));
  document.querySelector("[data-product-total]").textContent = `${products.length} ARTICLES`;
  document.querySelector("[data-product-table]").innerHTML = `<table class="data-table"><thead><tr><th>ARTICLE</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>${products.map((product) => `<tr><td><div class="product-cell"><img src="${product.image}" alt="" /><b>${product.name}</b></div></td><td>${product.category}</td><td>${money(product.price)}</td><td>${product.stock}</td><td><span class="pill ${product.active ? "" : "Draft"}">${product.active ? "Published" : "Draft"}</span></td><td><button class="tiny" data-edit-product="${product.id}">EDIT</button> <button class="tiny danger" data-delete-product="${product.id}">REMOVE</button></td></tr>`).join("")}</tbody></table>`;
}

function renderMedia() {
  document.querySelector("[data-media-grid]").innerHTML = state.gallery.map((image, index) => `<article class="media-card"><img src="${image}" alt="Gallery image ${index + 1}" /><button data-delete-media="${index}" aria-label="Remove picture">x</button></article>`).join("");
}

function renderHome() {
  Object.entries(state.settings).forEach(([key, value]) => {
    if (homeForm.elements[key]) homeForm.elements[key].value = value;
  });
  document.querySelector("[data-hero-preview]").src = state.settings.heroImage;
}

function renderPageEditor() {
  if (!pageEditor || !pageEditorSelect) return;
  if (!pageEditorSelect.options.length) {
    pageEditorSelect.innerHTML = Object.entries(pageEditorPages).map(([key, page]) => `<option value="${key}">${page.label}</option>`).join("");
  }
  const pageKey = pageEditorSelect.value || "home";
  const page = pageEditorPages[pageKey];
  editorPreviewLink.href = page.url;
  pageEditor.innerHTML = `
    <div class="editor-page-frame">
      <header class="editor-page-header">
        <b>LARI</b>
        <span>${page.label}</span>
      </header>
      ${page.sections.map(([title, fields]) => `
        <section class="editor-page-section">
          <h3>${title}</h3>
          <div class="editor-block-grid">
            ${fields.map((field) => Array.isArray(field) ? editorGroupBlock(field) : editorBlock(field)).join("")}
          </div>
        </section>
      `).join("")}
    </div>`;
}

function editorGroupBlock(group) {
  const [title, ...fields] = group;
  const hidden = fields.every((field) => state.visibility?.[field] === false);
  return `
    <article class="editor-block grouped ${hidden ? "is-hidden" : ""}">
      <span>${title}</span>
      <div class="editor-group-parts">
        ${fields.map((field) => editorFieldPart(field)).join("")}
      </div>
    </article>`;
}

function editorFieldPart(field) {
  const value = state.settings[field] || "";
  const image = isImageField(field);
  const visible = state.visibility?.[field] !== false;
  return `
    <div class="editor-field-part ${image ? "image" : "text"} ${visible ? "" : "is-hidden"}">
      <small>${labelFromKey(field)}</small>
      ${visible
        ? image
          ? `<i style="background-image:url('${String(value).replace(/'/g, "%27")}')"></i>`
          : `<b>${String(value).slice(0, 90) || "Empty text"}</b>`
        : "<b>HIDDEN</b>"}
      <div class="editor-actions">
        <button class="tiny" type="button" data-edit-setting="${field}">EDIT</button>
        <button class="tiny ${visible ? "" : "danger"}" type="button" data-toggle-setting="${field}">${visible ? "VIEW" : "HIDDEN"}</button>
      </div>
    </div>`;
}

function editorBlock(field) {
  if (field === "__products") {
    return `<article class="editor-block muted"><span>Product area</span><b>Managed in Products tab</b><button class="secondary mini-action" type="button" data-go="products">OPEN PRODUCTS</button></article>`;
  }
  const value = state.settings[field] || "";
  const image = isImageField(field);
  const visible = state.visibility?.[field] !== false;
  return `
    <article class="editor-block ${image ? "image" : "text"} ${visible ? "" : "is-hidden"}">
      <span>${labelFromKey(field)}</span>
      ${editorFieldPart(field)}
    </article>`;
}

function renderOrders() {
  document.querySelector("[data-order-total]").textContent = `${state.orders.length} ORDERS`;
  document.querySelector("[data-order-table]").innerHTML = orderTable(state.orders, true);
}

function renderAll() {
  renderOverview();
  renderProducts();
  renderMedia();
  renderHome();
  renderPageEditor();
  renderOrders();
}

function openProduct(id) {
  productForm.reset();
  productForm.elements.active.checked = true;
  const product = state.products.find((item) => item.id === id);
  document.querySelector("[data-dialog-title]").textContent = product ? "Edit product" : "Add product";
  if (product) Object.entries(product).forEach(([key, value]) => {
    if (!productForm.elements[key]) return;
    if (key === "active") productForm.elements[key].checked = value;
    else productForm.elements[key].value = value;
  });
  productDialog.showModal();
}

navButtons.forEach((button) => button.addEventListener("click", () => showPanel(button.dataset.view)));
document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => showPanel(button.dataset.go)));
document.querySelectorAll("[data-action='add-product']").forEach((button) => button.addEventListener("click", () => openProduct()));
document.querySelector("[data-action='add-media']").addEventListener("click", () => mediaDialog.showModal());
document.querySelectorAll("[data-action='bulk-import']").forEach((button) => button.addEventListener("click", () => importDialog.showModal()));
document.querySelectorAll("[data-action='download-template']").forEach((button) => button.addEventListener("click", downloadTemplate));
document.querySelector("[data-toggle-menu]").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("active"));
document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelector("[data-product-search]").addEventListener("input", renderProducts);
pageEditorSelect?.addEventListener("change", renderPageEditor);

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(productForm);
  const product = { id: form.get("id") || LariStore.makeId(form.get("name")), name: form.get("name"), category: form.get("category"), badge: form.get("badge"), price: Number(form.get("price")), stock: Number(form.get("stock")), image: form.get("image"), active: form.get("active") === "on" };
  const index = state.products.findIndex((item) => item.id === product.id);
  if (index >= 0) state.products[index] = product;
  else state.products.unshift(product);
  productDialog.close();
  await save("Product saved");
});

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadTemplate() {
  const rows = [
    ["name", "category", "price", "stock", "badge", "image", "active"],
    ["Blush Eastern Cord Set", "Cord Set - Eastern", "5490", "25", "NEW", "https://example.com/blush-eastern-cord-set.jpg", "true"],
    ["Black Western Cord Set", "Cord Set - Western", "4990", "12", "", "https://example.com/black-western-cord-set.jpg", "true"],
    ["Printed Lawn Shirt", "Shirts", "2990", "18", "NEW", "https://example.com/printed-lawn-shirt.jpg", "true"]
  ];
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "lari-products-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function productsFromCsv(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.toLowerCase().trim());
  return rows.slice(1).map((row) => {
    const item = Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]));
    return {
      id: LariStore.makeId(item.name),
      name: item.name,
      category: item.category || "Cord Set - Eastern",
      price: Number(item.price || 0),
      stock: Number(item.stock || 0),
      badge: item.badge || "",
      image: item.image || "",
      active: !["false", "0", "no", "draft"].includes(String(item.active || "true").toLowerCase())
    };
  }).filter((product) => product.name && product.image && Number.isFinite(product.price) && Number.isFinite(product.stock));
}

importForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = importForm.elements.file.files[0];
  const pasted = importForm.elements.csv.value.trim();
  const text = file ? await file.text() : pasted;
  const imported = productsFromCsv(text);
  if (!imported.length) {
    toast("No valid products found in CSV");
    return;
  }
  state.products = [...imported, ...state.products];
  importDialog.close();
  importForm.reset();
  await save(`${imported.length} articles imported`);
});

mediaForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = mediaForm.elements.url.value.trim();
  const file = mediaForm.elements.file.files[0];
  if (url) {
    state.gallery.unshift(url);
    mediaDialog.close();
    mediaForm.reset();
    await save("Picture added");
  } else if (file) {
    const reader = new FileReader();
    reader.onload = async () => {
      state.gallery.unshift(reader.result);
      mediaDialog.close();
      mediaForm.reset();
      await save("Picture uploaded");
    };
    reader.readAsDataURL(file);
  }
});

homeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  state.settings = { ...state.settings, ...Object.fromEntries(new FormData(homeForm).entries()) };
  await save("Homepage updated");
});
homeForm.elements.heroImage.addEventListener("input", () => document.querySelector("[data-hero-preview]").src = homeForm.elements.heroImage.value);

document.addEventListener("click", async (event) => {
  const go = event.target.closest("[data-go]");
  const editSetting = event.target.closest("[data-edit-setting]");
  const toggleSetting = event.target.closest("[data-toggle-setting]");
  const edit = event.target.closest("[data-edit-product]");
  const remove = event.target.closest("[data-delete-product]");
  const removeMedia = event.target.closest("[data-delete-media]");
  if (go) showPanel(go.dataset.go);
  if (editSetting) {
    const key = editSetting.dataset.editSetting;
    const current = state.settings[key] || "";
    const next = prompt(`${isImageField(key) ? "Image URL" : "Text"}: ${labelFromKey(key)}`, current);
    if (next !== null && next !== current) {
      state.settings[key] = next.trim();
      await save(`${labelFromKey(key)} updated`);
    }
  }
  if (toggleSetting) {
    const key = toggleSetting.dataset.toggleSetting;
    state.visibility = { ...(state.visibility || {}), [key]: state.visibility?.[key] === false };
    await save(`${labelFromKey(key)} ${state.visibility[key] === false ? "hidden" : "visible"}`);
  }
  if (edit) openProduct(edit.dataset.editProduct);
  if (remove && confirm("Remove this product from the catalog?")) {
    state.products = state.products.filter((item) => item.id !== remove.dataset.deleteProduct);
    await save("Product removed");
  }
  if (removeMedia && confirm("Remove this picture from the gallery?")) {
    state.gallery.splice(Number(removeMedia.dataset.deleteMedia), 1);
    await save("Picture removed");
  }
});

document.addEventListener("change", async (event) => {
  if (!event.target.matches("[data-order-status]")) return;
  const order = state.orders.find((item) => item.id === event.target.dataset.orderStatus);
  order.status = event.target.value;
  await save("Order status updated");
});

document.querySelector("[data-reset]").addEventListener("click", async () => {
  if (!confirm("Reset all store content to the current default live state?")) return;
  state = await LariStore.reset(token);
  renderAll();
  toast("Store data reset");
});

loadState();
