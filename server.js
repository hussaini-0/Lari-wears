const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createDatabase } = require("./database");

const PORT = Number(process.env.PORT || 4173);
const ADMIN_PASSWORD = process.env.LARI_ADMIN_PASSWORD || "lari-admin-2026";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL || "";
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || "";
const sessions = new Map();
const loginAttempts = new Map();
let database;

if (IS_PRODUCTION && ADMIN_PASSWORD === "lari-admin-2026") {
  console.error("Refusing to start in production with the default admin password. Set LARI_ADMIN_PASSWORD.");
  process.exit(1);
}

const defaults = {
  settings: {
    announcement: "FREE SHIPPING ON ORDERS ABOVE RS. 4,999",
    announcementTwo: "NEW SEASON, NEW ENERGY",
    announcementThree: "EXCHANGE WITHIN 14 DAYS",
    heroEyebrow: "FRESH FITS / 2026",
    heroTitle: "Wear Your Own Story.",
    heroSubtitle: "Everyday fits. Main-character confidence.",
    heroImage: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2200&q=88",
    heroSticker: "NEW DROP",
    moodEyebrow: "SHOP YOUR MOOD",
    moodTitle: "Pick Your Vibe.",
    departmentOneTitle: "WOMEN",
    departmentOneImage: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1100&q=85",
    departmentTwoTitle: "FORMALS",
    departmentTwoImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1100&q=85",
    departmentThreeTitle: "CASUALS",
    departmentThreeImage: "https://images.unsplash.com/photo-1506629905607-d405b7a30db9?auto=format&fit=crop&w=1100&q=85",
    tickerOne: "LARI LOVES COLOR",
    tickerTwo: "STYLE IT YOUR WAY",
    tickerThree: "MADE FOR YOUR EVERYDAY",
    trendingEyebrow: "JUST LANDED",
    trendingTitle: "Trending Now.",
    storyEyebrow: "EVERYDAY ESSENTIALS",
    storyTitle: "Good Fits. Better Days.",
    storySubtitle: "Easy pieces you will reach for again and again.",
    storyButton: "EXPLORE ESSENTIALS",
    storyImage: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=2200&q=85",
    editEyebrow: "THE LARI EDIT",
    editTitle: "Looks We Love.",
    editSubtitle: "Curated for your scroll, ready for your wardrobe.",
    editOneTitle: "DENIM DAYS",
    editOneImage: "https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=900&q=84",
    editTwoTitle: "PASTEL PLAY",
    editTwoImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=84",
    editThreeTitle: "WESTERN CORD SETS",
    editThreeImage: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=900&q=84",
    instagramEyebrow: "@LARIWEARS",
    instagramTitle: "Styled By You.",
    benefitOneTitle: "EASY EXCHANGE",
    benefitOneText: "Within 14 days",
    benefitTwoTitle: "SECURE PAYMENTS",
    benefitTwoText: "Shop with confidence",
    benefitThreeTitle: "QUALITY FIRST",
    benefitThreeText: "Made for repeat wear",
    benefitFourTitle: "NEED HELP?",
    benefitFourText: "We are here for you",
    footerText: "Women's fashion born from creativity, passion, and purpose.",
    newsletterTitle: "STAY IN THE LOOP",
    newsletterText: "Sign up for drops, deals, and a little style inspiration.",
    aboutAnnouncement: "LARI - WEAR YOUR STORY",
    aboutEyebrow: "ABOUT LARI",
    aboutTitle: "LARI is a fashion brand born from creativity, passion, and purpose.",
    aboutBody: "Founded by Laiba Lari, the journey of LARI began as a textile thesis project, where design became a medium for storytelling and self-expression.\n\nGuided by its signature tagline, Wear Your Story, LARI believes that every garment carries a narrative.\n\nToday, LARI continues to create designs that are more than clothing. They are stories waiting to be worn.",
    aboutClosing: "LARI - Wear Your Story.",
    contactAnnouncement: "24/7 SUPPORT THROUGH WHATSAPP",
    contactEyebrow: "CONTACT",
    contactTitle: "Need help with an order?",
    contactBody: "LARI provides support through WhatsApp and is available 24/7 for order questions, sizing help, delivery updates, and general support.",
    shipmentText: "7-14 working days.",
    returnsText: "No return policy.",
    paymentsText: "Cash on delivery and online transfer.",
    deliveryText: "Available all over Pakistan and internationally.",
    collectionTitle: "Cord Sets & Shirts",
    navHome: "HOME",
    navNewIn: "NEW IN",
    navCordSets: "CORD SETS",
    navEastern: "EASTERN",
    navWestern: "WESTERN",
    navShirts: "SHIRTS",
    navSale: "SALE",
    navAbout: "ABOUT",
    actionSearch: "Search",
    actionWishlist: "Wishlist",
    actionAccount: "Account",
    actionBag: "Bag",
    chipAllLabel: "All",
    chipAllImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80",
    chipEasternLabel: "Eastern Cord Set",
    chipEasternImage: "https://images.unsplash.com/photo-1506629905607-d405b7a30db9?auto=format&fit=crop&w=240&q=80",
    chipWesternLabel: "Western Cord Set",
    chipWesternImage: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=240&q=80",
    chipShirtsLabel: "Shirts",
    chipShirtsImage: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=240&q=80",
    chipSaleLabel: "Sale Edit",
    chipSaleImage: "https://images.unsplash.com/photo-1542295663-7ad9f8e958bb?auto=format&fit=crop&w=240&q=80",
    productDescription: "Soft everyday styling with LARI color energy. Managed directly from the admin dashboard.",
    productAddButton: "ADD TO BAG",
    productBackButton: "BACK TO SHOP",
    cartAnnouncement: "FREE SHIPPING ON ORDERS ABOVE RS. 4,999",
    cartContinueLabel: "Continue Shopping",
    cartAdminLabel: "Admin",
    cartEyebrow: "YOUR BAG",
    cartTitle: "Shopping Bag",
    cartSummaryTitle: "Order Summary",
    cartSubtotalLabel: "Subtotal",
    cartCheckoutButton: "CHECKOUT",
    cartEmptyText: "Your bag is empty.",
    checkoutAnnouncement: "COD AND ONLINE TRANSFER AVAILABLE",
    checkoutEyebrow: "CHECKOUT",
    checkoutTitle: "Place Order",
    checkoutIntro: "Shipment takes 7-14 working days. Delivery is available across Pakistan and internationally.",
    checkoutNameLabel: "Full name",
    checkoutEmailLabel: "Email",
    checkoutPhoneLabel: "Phone",
    checkoutAddressLabel: "Address",
    checkoutPaymentLabel: "Payment method",
    checkoutSubmitButton: "PLACE ORDER",
    manualPaymentTitle: "Manual payment instructions",
    bankTransferInstructions: "Bank Transfer: Send payment to Account Title LARI, Account No. 000000000000, Bank Name Your Bank. Share screenshot on WhatsApp after placing order.",
    easypaisaInstructions: "Easypaisa: Send payment to 03XX-XXXXXXX under Account Title LARI. Share transaction ID after placing order.",
    jazzcashInstructions: "JazzCash: Send payment to 03XX-XXXXXXX under Account Title LARI. Share transaction ID after placing order.",
    paymentProofLabel: "Payment screenshot / transaction ID"
  },
  visibility: {},
  products: [
    { id: "blush-eastern-cord-set", name: "Blush Eastern Cord Set", category: "Cord Set - Eastern", price: 5490, stock: 16, badge: "NEW", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=82", active: true },
    { id: "black-western-cord-set", name: "Black Western Cord Set", category: "Cord Set - Western", price: 4990, stock: 11, badge: "-20%", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=82", active: true },
    { id: "printed-lawn-shirt", name: "Printed Lawn Shirt", category: "Shirts", price: 2990, stock: 18, badge: "NEW", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=82", active: true }
  ],
  gallery: [
    "https://images.unsplash.com/photo-1506629905607-d405b7a30db9?auto=format&fit=crop&w=520&q=80",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=520&q=80",
    "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=520&q=80",
    "https://images.unsplash.com/photo-1542295663-7ad9f8e958bb?auto=format&fit=crop&w=520&q=80",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=520&q=80"
  ],
  orders: [
    { id: "LARI-1004", customer: "Ayesha Khan", total: 5490, status: "Processing", date: "2026-06-01", items: [{ productId: "blush-eastern-cord-set", name: "Blush Eastern Cord Set", price: 5490, quantity: 1 }] },
    { id: "LARI-1003", customer: "Sara Ahmed", total: 2990, status: "Delivered", date: "2026-05-31", items: [{ productId: "printed-lawn-shirt", name: "Printed Lawn Shirt", price: 2990, quantity: 1 }] },
    { id: "LARI-1002", customer: "Hania Ali", total: 10480, status: "Shipped", date: "2026-05-30", items: [{ productId: "black-western-cord-set", name: "Black Western Cord Set", price: 4990, quantity: 1 }, { productId: "blush-eastern-cord-set", name: "Blush Eastern Cord Set", price: 5490, quantity: 1 }] }
  ]
};

function cleanImageSource(value, fallback = "") {
  const source = String(value || fallback).slice(0, 200000);
  if (source.startsWith("data:image/")) return source;
  try {
    const url = new URL(source);
    return ["http:", "https:"].includes(url.protocol) ? source : fallback;
  } catch (error) {
    return fallback;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function securityHeaders(extra = {}) {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    ...extra
  };
}

function send(res, status, payload, headers = {}) {
  res.writeHead(status, securityHeaders({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers }));
  res.end(JSON.stringify(payload));
}

function notFound(res) {
  send(res, 404, { error: "Not found" });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 8 * 1024 * 1024) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function requireAdmin(req, res) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    send(res, 401, { error: "Admin login required" });
    return false;
  }
  session.expiresAt = Date.now() + 1000 * 60 * 60 * 8;
  return true;
}

function loginAllowed(req) {
  const ip = req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const record = loginAttempts.get(ip) || { count: 0, resetAt: now + windowMs };
  if (record.resetAt < now) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }
  record.count += 1;
  loginAttempts.set(ip, record);
  return record.count <= 10;
}

async function publicStore() {
  const store = await database.getStore();
  return {
    settings: store.settings,
    visibility: store.visibility || {},
    products: store.products.filter((product) => product.active && Number(product.stock) > 0),
    gallery: store.gallery
  };
}

function nextOrderId(orders) {
  const max = orders.reduce((highest, order) => {
    const match = String(order.id || "").match(/^LARI-(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 1000);
  return `LARI-${max + 1}`;
}

function normalizeStore(input) {
const clean = clone(defaults);
  clean.settings = {
    ...Object.fromEntries(Object.entries(defaults.settings).map(([key, fallback]) => {
      const limit = key.toLowerCase().includes("image") ? 200000 : key.toLowerCase().includes("body") ? 2000 : 180;
      const value = String(input.settings?.[key] || fallback).slice(0, limit);
      return [key, key.toLowerCase().includes("image") ? cleanImageSource(value, fallback) : value];
    }))
  };
  clean.visibility = Object.fromEntries(Object.entries(input.visibility || {}).map(([key, value]) => [String(key).slice(0, 80), Boolean(value)]));
  clean.products = Array.isArray(input.products) ? input.products.map((product) => ({
    id: String(product.id || crypto.randomUUID()).slice(0, 80),
    name: String(product.name || "Untitled Product").slice(0, 120),
    category: String(product.category || "Cord Set - Eastern").slice(0, 40),
    price: Math.max(0, Number(product.price || 0)),
    stock: Math.max(0, Number(product.stock || 0)),
    badge: String(product.badge || "").slice(0, 20),
    image: cleanImageSource(product.image),
    active: Boolean(product.active)
  })) : clean.products;
  clean.gallery = Array.isArray(input.gallery) ? input.gallery.map((image) => cleanImageSource(image)).filter(Boolean).slice(0, 40) : clean.gallery;
  clean.orders = Array.isArray(input.orders) ? input.orders.map((order) => ({
    id: String(order.id || `LARI-${Date.now()}`).slice(0, 40),
    customer: String(order.customer || "Online Customer").slice(0, 120),
    email: String(order.email || "").slice(0, 160),
    phone: String(order.phone || "").slice(0, 60),
    address: String(order.address || "").slice(0, 300),
    payment: String(order.payment || "Cash on Delivery").slice(0, 80),
    paymentProof: String(order.paymentProof || "").slice(0, 300),
    total: Math.max(0, Number(order.total || 0)),
    status: ["Processing", "Payment Pending", "Paid", "Shipped", "Delivered", "Cancelled"].includes(order.status) ? order.status : "Processing",
    date: String(order.date || new Date().toISOString().slice(0, 10)).slice(0, 20),
    items: Array.isArray(order.items) ? order.items : []
  })) : clean.orders;
  return clean;
}

async function handleApi(req, res) {
  if (req.method === "GET" && req.url === "/api/health") {
    return send(res, 200, { ok: true, service: "lari-store", timestamp: new Date().toISOString() });
  }

  if (req.method === "GET" && req.url === "/api/public/store") return send(res, 200, await publicStore());

  if (req.method === "POST" && req.url === "/api/admin/login") {
    if (!loginAllowed(req)) return send(res, 429, { error: "Too many login attempts. Try again later." });
    const body = await readBody(req);
    if (String(body.password || "") !== ADMIN_PASSWORD) return send(res, 401, { error: "Invalid admin password" });
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, { expiresAt: Date.now() + 1000 * 60 * 60 * 8 });
    return send(res, 200, { token });
  }

  if (req.method === "POST" && req.url === "/api/public/orders") {
    const body = await readBody(req);
    const productIds = Array.isArray(body.items) ? body.items.map(String) : [];
    const store = await database.getStore();
    const products = productIds.map((id) => store.products.find((product) => product.id === id && product.active)).filter(Boolean);
    if (!products.length) return send(res, 400, { error: "No valid products in order" });
    for (const product of products) {
      if (Number(product.stock) < 1) return send(res, 409, { error: `${product.name} is out of stock` });
    }
    for (const product of products) product.stock = Math.max(0, Number(product.stock) - 1);
    const order = {
      id: nextOrderId(store.orders),
      customer: String(body.customer || "Online Customer").slice(0, 120),
      email: String(body.email || "").slice(0, 160),
      phone: String(body.phone || "").slice(0, 60),
      address: String(body.address || "").slice(0, 300),
      payment: String(body.payment || "Cash on Delivery").slice(0, 80),
      paymentProof: String(body.paymentProof || "").slice(0, 300),
      total: products.reduce((sum, product) => sum + Number(product.price), 0),
      status: ["Bank Transfer", "Easypaisa", "JazzCash"].includes(String(body.payment || "")) ? "Payment Pending" : "Processing",
      date: new Date().toISOString().slice(0, 10),
      items: products.map((product) => ({ productId: product.id, name: product.name, price: product.price, quantity: 1 }))
    };
    store.orders.unshift(order);
    await database.saveStore(store);
    return send(res, 201, { order });
  }

  if (req.url === "/api/admin/store") {
    if (!requireAdmin(req, res)) return;
    if (req.method === "GET") return send(res, 200, await database.getStore());
    if (req.method === "PUT") {
      const body = await readBody(req);
      const clean = normalizeStore(body);
      return send(res, 200, await database.saveStore(clean));
    }
  }

  if (req.method === "POST" && req.url === "/api/admin/reset") {
    if (!requireAdmin(req, res)) return;
    return send(res, 200, await database.resetStore());
  }

  return notFound(res);
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const requested = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.normalize(path.join(ROOT, requested));
  const relativePath = path.relative(ROOT, filePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) return notFound(res);
  fs.readFile(filePath, (error, data) => {
    if (error) return notFound(res);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml" }[ext] || "application/octet-stream";
    res.writeHead(200, securityHeaders({ "Content-Type": contentType, "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600" }));
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res).catch((error) => send(res, error.message.includes("large") ? 413 : 400, { error: error.message }));
  } else {
    serveStatic(req, res);
  }
});

(async () => {
  database = await createDatabase({
    dataDir: DATA_DIR,
    legacyJsonFile: STORE_FILE,
    defaults,
    databaseUrl: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN
  });
  server.listen(PORT, () => {
    console.log(`LARI store running at http://localhost:${PORT}`);
    if (!process.env.LARI_ADMIN_PASSWORD) console.log("Using default admin password: lari-admin-2026");
  });
})().catch((error) => {
  console.error("Database startup failed:", error.message);
  process.exit(1);
});
