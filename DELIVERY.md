# LARI Delivery Guide

Use this as your same-day presentation checklist.

## 1. Start The Project

```powershell
npm start
```

Open:

- Storefront: `http://localhost:4173`
- Collection: `http://localhost:4173/collection.html`
- Product detail: `http://localhost:4173/product.html`
- Cart: `http://localhost:4173/cart.html`
- Checkout: `http://localhost:4173/checkout.html`
- About: `http://localhost:4173/about.html`
- Contact: `http://localhost:4173/contact.html`
- Admin dashboard: `http://localhost:4173/lari-admin-portal.html`

Admin password:

```text
lari-admin-2026
```

## 2. Run Final Checks

```powershell
npm test
npm run smoke
```

Expected result:

- JavaScript syntax checks pass
- Storefront loads
- Admin dashboard loads
- Public API responds
- Admin login works
- Protected admin API works
- Order creation works
-- Smoke-test data resets after the smoke test

## 3. Delivery Flow

1. Open the storefront and show the LARI branded homepage.
2. Open the collection page and filter/search products.
3. Open a product detail page.
4. Add a product to the bag.
5. Open the cart and checkout page.
6. Place a live test order.
7. Open the admin dashboard.
8. Login with the admin password.
9. Show overview metrics and recent orders.
10. Edit a product price, stock, or image.
11. Use Bulk Import to upload many products from CSV.
12. Add a new product manually and publish it.
13. Add or remove a gallery picture.
14. Edit the homepage announcement or hero title.
15. Return to the storefront and refresh to show the update.

## Bulk Article Upload

For 100+ products, the client should not add articles one by one. Use:

- Admin Dashboard -> Products -> Download CSV Template
- Fill it in Excel or Google Sheets
- Export/download as CSV
- Admin Dashboard -> Products -> Bulk Import
- Upload the CSV

Required columns:

- `name`
- `category`
- `price`
- `stock`
- `badge`
- `image`
- `active`

There is also a sample file in `sample-products.csv`.

## 4. What To Say If Asked About Production

This is a full-stack e-commerce starter with a branded storefront, admin dashboard,
server API, protected admin login, server-side persistence, order creation, and stock
updates. It is ready for project delivery and production handoff.

For a real public business launch, the next integrations are payment gateway, shipping
rules, transactional email, hosted database, cloud image storage, backups, monitoring,
and deployment hardening.

## 5. Important Files

- `server.js`: Node server, API routes, auth, persistence
- `data/store.json`: saved catalog, content, gallery, orders
- `index.html`: storefront
- `lari-admin-portal.html`: admin dashboard
- `src/main.js`: storefront behavior
- `src/admin.js`: admin dashboard behavior
- `src/store.js`: API client
- `src/styles.css`: storefront styling
- `src/admin.css`: admin styling
- `CLIENT_PRIVATE_NOTES.md`: private client contact and business details; do not publish without approval
