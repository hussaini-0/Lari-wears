const fs = require("fs");
const path = require("path");
const { createClient } = require("@libsql/client");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeLegacyStore(defaults, legacy) {
  if (!legacy || typeof legacy !== "object") return clone(defaults);
  return {
    ...clone(defaults),
    ...legacy,
    settings: { ...defaults.settings, ...(legacy.settings || {}) },
    visibility: { ...(legacy.visibility || {}) },
    products: Array.isArray(legacy.products) ? legacy.products : clone(defaults.products),
    gallery: Array.isArray(legacy.gallery) ? legacy.gallery : clone(defaults.gallery),
    orders: Array.isArray(legacy.orders) ? legacy.orders : clone(defaults.orders)
  };
}

function rowMap(rows, keyName, valueName) {
  return Object.fromEntries(rows.map((row) => [row[keyName], row[valueName]]));
}

async function createDatabase({ dataDir, legacyJsonFile, defaults, databaseUrl, authToken }) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const localFile = path.join(dataDir, "store-local.db");
  const client = createClient({
    url: databaseUrl || `file:${localFile}`,
    authToken: authToken || undefined
  });

  await client.batch([
    `CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS visibility (
      key TEXT PRIMARY KEY,
      is_visible INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      badge TEXT NOT NULL,
      image TEXT NOT NULL,
      active INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS gallery (
      position INTEGER PRIMARY KEY,
      image TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      payment TEXT NOT NULL,
      paymentProof TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL,
      date TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      order_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      productId TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      PRIMARY KEY (order_id, position)
    )`
  ], "write");

  async function replaceStore(store) {
    await client.batch([
      "DELETE FROM settings",
      "DELETE FROM visibility",
      "DELETE FROM products",
      "DELETE FROM gallery",
      "DELETE FROM order_items",
      "DELETE FROM orders"
    ], "write");

    for (const [key, value] of Object.entries(store.settings || {})) {
      await client.execute({ sql: "INSERT INTO settings (key, value) VALUES (?, ?)", args: [key, String(value)] });
    }

    for (const [key, value] of Object.entries(store.visibility || {})) {
      await client.execute({ sql: "INSERT INTO visibility (key, is_visible) VALUES (?, ?)", args: [key, value === false ? 0 : 1] });
    }

    for (const product of store.products || []) {
      await client.execute({
        sql: `INSERT INTO products (id, name, category, price, stock, badge, image, active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          String(product.id),
          String(product.name),
          String(product.category),
          Number(product.price),
          Number(product.stock),
          String(product.badge || ""),
          String(product.image || ""),
          product.active ? 1 : 0
        ]
      });
    }

    for (const [index, image] of (store.gallery || []).entries()) {
      await client.execute({ sql: "INSERT INTO gallery (position, image) VALUES (?, ?)", args: [index, String(image)] });
    }

    for (const order of store.orders || []) {
      await client.execute({
        sql: `INSERT INTO orders (id, customer, email, phone, address, payment, paymentProof, total, status, date)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          String(order.id),
          String(order.customer || ""),
          String(order.email || ""),
          String(order.phone || ""),
          String(order.address || ""),
          String(order.payment || "Cash on Delivery"),
          String(order.paymentProof || ""),
          Number(order.total || 0),
          String(order.status || "Processing"),
          String(order.date || "")
        ]
      });
      for (const [index, item] of (order.items || []).entries()) {
        await client.execute({
          sql: `INSERT INTO order_items (order_id, position, productId, name, price, quantity)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            String(order.id),
            index,
            String(item.productId || ""),
            String(item.name || ""),
            Number(item.price || 0),
            Number(item.quantity || 1)
          ]
        });
      }
    }

    await client.execute({
      sql: "INSERT OR REPLACE INTO metadata (key, value) VALUES ('initialized', '1')"
    });
  }

  async function getStore() {
    const settingsRows = await client.execute("SELECT key, value FROM settings");
    const visibilityRows = await client.execute("SELECT key, is_visible FROM visibility");
    const productRows = await client.execute("SELECT id, name, category, price, stock, badge, image, active FROM products ORDER BY rowid ASC");
    const galleryRows = await client.execute("SELECT image FROM gallery ORDER BY position ASC");
    const orderRows = await client.execute(`
      SELECT id, customer, email, phone, address, payment, paymentProof, total, status, date
      FROM orders ORDER BY rowid DESC
    `);
    const itemRows = await client.execute(`
      SELECT order_id, position, productId, name, price, quantity
      FROM order_items ORDER BY order_id ASC, position ASC
    `);

    const itemsByOrder = new Map();
    for (const row of itemRows.rows) {
      if (!itemsByOrder.has(row.order_id)) itemsByOrder.set(row.order_id, []);
      itemsByOrder.get(row.order_id).push({
        productId: row.productId,
        name: row.name,
        price: Number(row.price),
        quantity: Number(row.quantity)
      });
    }

    return {
      settings: rowMap(settingsRows.rows, "key", "value"),
      visibility: Object.fromEntries(visibilityRows.rows.map((row) => [row.key, Number(row.is_visible) === 1])),
      products: productRows.rows.map((row) => ({
        ...row,
        price: Number(row.price),
        stock: Number(row.stock),
        active: Number(row.active) === 1
      })),
      gallery: galleryRows.rows.map((row) => row.image),
      orders: orderRows.rows.map((row) => ({
        ...row,
        total: Number(row.total),
        items: itemsByOrder.get(row.id) || []
      }))
    };
  }

  const initialized = await client.execute("SELECT value FROM metadata WHERE key = 'initialized'");
  if (!initialized.rows.length) {
    let seed = clone(defaults);
    if (fs.existsSync(legacyJsonFile)) {
      try {
        const legacy = JSON.parse(fs.readFileSync(legacyJsonFile, "utf8"));
        seed = mergeLegacyStore(defaults, legacy);
      } catch (error) {
        seed = clone(defaults);
      }
    }
    await replaceStore(seed);
  }

  return {
    async getStore() {
      return getStore();
    },
    async saveStore(store) {
      await replaceStore(store);
      return getStore();
    },
    async resetStore() {
      await replaceStore(clone(defaults));
      return getStore();
    },
    async close() {
      await client.close();
    }
  };
}

module.exports = { createDatabase };
