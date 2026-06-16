const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

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

function createDatabase({ dataDir, dbFile, legacyJsonFile, defaults }) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(dbFile);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS visibility (
      key TEXT PRIMARY KEY,
      is_visible INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      badge TEXT NOT NULL,
      image TEXT NOT NULL,
      active INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS gallery (
      position INTEGER PRIMARY KEY,
      image TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
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
    );
    CREATE TABLE IF NOT EXISTS order_items (
      order_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      productId TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      PRIMARY KEY (order_id, position),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  const replaceStore = db.transaction((store) => {
    db.prepare("DELETE FROM settings").run();
    db.prepare("DELETE FROM visibility").run();
    db.prepare("DELETE FROM products").run();
    db.prepare("DELETE FROM gallery").run();
    db.prepare("DELETE FROM order_items").run();
    db.prepare("DELETE FROM orders").run();

    const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
    for (const [key, value] of Object.entries(store.settings || {})) insertSetting.run(key, String(value));

    const insertVisibility = db.prepare("INSERT INTO visibility (key, is_visible) VALUES (?, ?)");
    for (const [key, value] of Object.entries(store.visibility || {})) insertVisibility.run(key, value === false ? 0 : 1);

    const insertProduct = db.prepare(`
      INSERT INTO products (id, name, category, price, stock, badge, image, active)
      VALUES (@id, @name, @category, @price, @stock, @badge, @image, @active)
    `);
    for (const product of store.products || []) {
      insertProduct.run({
        id: String(product.id),
        name: String(product.name),
        category: String(product.category),
        price: Number(product.price),
        stock: Number(product.stock),
        badge: String(product.badge || ""),
        image: String(product.image || ""),
        active: product.active ? 1 : 0
      });
    }

    const insertGallery = db.prepare("INSERT INTO gallery (position, image) VALUES (?, ?)");
    (store.gallery || []).forEach((image, index) => insertGallery.run(index, String(image)));

    const insertOrder = db.prepare(`
      INSERT INTO orders (id, customer, email, phone, address, payment, paymentProof, total, status, date)
      VALUES (@id, @customer, @email, @phone, @address, @payment, @paymentProof, @total, @status, @date)
    `);
    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (order_id, position, productId, name, price, quantity)
      VALUES (@order_id, @position, @productId, @name, @price, @quantity)
    `);
    for (const order of store.orders || []) {
      insertOrder.run({
        id: String(order.id),
        customer: String(order.customer || ""),
        email: String(order.email || ""),
        phone: String(order.phone || ""),
        address: String(order.address || ""),
        payment: String(order.payment || "Cash on Delivery"),
        paymentProof: String(order.paymentProof || ""),
        total: Number(order.total || 0),
        status: String(order.status || "Processing"),
        date: String(order.date || "")
      });
      (order.items || []).forEach((item, index) => {
        insertOrderItem.run({
          order_id: String(order.id),
          position: index,
          productId: String(item.productId || ""),
          name: String(item.name || ""),
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1)
        });
      });
    }

    db.prepare(`
      INSERT INTO metadata (key, value) VALUES ('initialized', '1')
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run();
  });

  function getStore() {
    const settings = Object.fromEntries(db.prepare("SELECT key, value FROM settings").all().map((row) => [row.key, row.value]));
    const visibility = Object.fromEntries(
      db.prepare("SELECT key, is_visible FROM visibility").all().map((row) => [row.key, row.is_visible === 1])
    );
    const products = db.prepare("SELECT id, name, category, price, stock, badge, image, active FROM products ORDER BY rowid ASC").all()
      .map((row) => ({ ...row, active: row.active === 1 }));
    const gallery = db.prepare("SELECT image FROM gallery ORDER BY position ASC").all().map((row) => row.image);
    const orderRows = db.prepare(`
      SELECT id, customer, email, phone, address, payment, paymentProof, total, status, date
      FROM orders ORDER BY rowid DESC
    `).all();
    const itemRows = db.prepare(`
      SELECT order_id, position, productId, name, price, quantity
      FROM order_items ORDER BY order_id ASC, position ASC
    `).all();
    const itemsByOrder = new Map();
    for (const row of itemRows) {
      if (!itemsByOrder.has(row.order_id)) itemsByOrder.set(row.order_id, []);
      itemsByOrder.get(row.order_id).push({
        productId: row.productId,
        name: row.name,
        price: row.price,
        quantity: row.quantity
      });
    }
    return {
      settings,
      visibility,
      products,
      gallery,
      orders: orderRows.map((order) => ({ ...order, items: itemsByOrder.get(order.id) || [] }))
    };
  }

  const initialized = db.prepare("SELECT value FROM metadata WHERE key = 'initialized'").get();
  if (!initialized) {
    let seed = clone(defaults);
    if (fs.existsSync(legacyJsonFile)) {
      try {
        const legacy = JSON.parse(fs.readFileSync(legacyJsonFile, "utf8"));
        seed = mergeLegacyStore(defaults, legacy);
      } catch (error) {
        seed = clone(defaults);
      }
    }
    replaceStore(seed);
  }

  return {
    getStore,
    saveStore(store) {
      replaceStore(store);
      return getStore();
    },
    resetStore() {
      replaceStore(clone(defaults));
      return getStore();
    },
    close() {
      db.close();
    }
  };
}

module.exports = { createDatabase };
