const http = require("http");
const { spawn } = require("child_process");

const PORT = Number(process.env.PORT || 4173);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ADMIN_PASSWORD = process.env.LARI_ADMIN_PASSWORD || "lari-admin-2026";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function request(path, options = {}) {
  return fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
}

function portIsOpen() {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/api/health`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function expectStatus(label, response, expected) {
  if (response.status !== expected) {
    const text = await response.text().catch(() => "");
    throw new Error(`${label} expected ${expected}, received ${response.status}. ${text}`);
  }
  console.log(`OK ${label}: ${response.status}`);
  return response;
}

async function run() {
  let server;
  if (!(await portIsOpen())) {
    server = spawn(process.execPath, ["server.js"], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(PORT) },
      stdio: "inherit"
    });
    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (await portIsOpen()) break;
      await wait(250);
    }
  }

  try {
    await expectStatus("health", await request("/api/health"), 200);
    await expectStatus("storefront", await fetch(`${BASE_URL}/`), 200);
    await expectStatus("collection page", await fetch(`${BASE_URL}/collection.html`), 200);
    await expectStatus("product page", await fetch(`${BASE_URL}/product.html`), 200);
    await expectStatus("cart page", await fetch(`${BASE_URL}/cart.html`), 200);
    await expectStatus("checkout page", await fetch(`${BASE_URL}/checkout.html`), 200);
    await expectStatus("about page", await fetch(`${BASE_URL}/about.html`), 200);
    await expectStatus("contact page", await fetch(`${BASE_URL}/contact.html`), 200);
    await expectStatus("admin page", await fetch(`${BASE_URL}/lari-admin-portal.html`), 200);
    await expectStatus("public store", await request("/api/public/store"), 200);

    const login = await expectStatus("admin login", await request("/api/admin/login", {
      method: "POST",
      body: { password: ADMIN_PASSWORD }
    }), 200);
    const { token } = await login.json();
    const auth = { Authorization: `Bearer ${token}` };

    await expectStatus("admin store", await request("/api/admin/store", { headers: auth }), 200);
    await expectStatus("reset before order", await request("/api/admin/reset", {
      method: "POST",
      headers: auth
    }), 200);
    const emptyAdminStore = await expectStatus("admin store after reset", await request("/api/admin/store", { headers: auth }), 200);
    const emptyState = await emptyAdminStore.json();
    emptyState.products.unshift({
      id: "smoke-test-product",
      name: "Smoke Test Product",
      category: "Shirts",
      price: 2990,
      stock: 5,
      badge: "",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=82",
      active: true
    });
    await expectStatus("seed smoke product", await request("/api/admin/store", {
      method: "PUT",
      headers: auth,
      body: emptyState
    }), 200);
    const seededStore = await expectStatus("public store after reset", await request("/api/public/store"), 200);
    const seededProducts = (await seededStore.json()).products;
    if (!seededProducts.length) throw new Error("No public products available for order test");
    await expectStatus("order create", await request("/api/public/orders", {
      method: "POST",
      body: { items: [seededProducts[0].id], customer: "Smoke Test Customer" }
    }), 201);
    await expectStatus("reset seed data", await request("/api/admin/reset", {
      method: "POST",
      headers: auth
    }), 200);

    console.log("Smoke test passed.");
  } finally {
    if (server) server.kill();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
