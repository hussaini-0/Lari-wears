# LARI Clothing Store

Run the production-style local server:

```powershell
npm start
```

Run with production safeguards enabled:

```powershell
$env:NODE_ENV="production"
$env:LARI_ADMIN_PASSWORD="replace-with-a-long-random-password"
npm run start:prod
```

Run delivery checks:

```powershell
npm test
npm run smoke
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
- Health check: `http://localhost:4173/api/health`
- Default local admin password: `lari-admin-2026`

For deployment, set a strong password before starting the server. Production mode refuses to start with the default password:

```powershell
$env:NODE_ENV="production"
$env:LARI_ADMIN_PASSWORD="replace-with-a-long-secret"
npm run start:prod
```

## Included

- Responsive branded storefront
- Multi-page customer site with homepage, collection, product detail, cart, checkout, about, and contact pages
- Public brand story and policy pages for LARI
- Product variations limited to Cord Set - Eastern, Cord Set - Western, and Shirts
- Node.js static server and JSON API
- Server-backed catalog, content, media, and orders in Turso/libSQL, with local file fallback for development
- Protected admin login and bearer-token admin API
- Managed product catalog and storefront publishing
- Product add, edit, remove, image URL, pricing, category, and stock controls
- Bulk product import from CSV for adding 100+ articles quickly
- Gallery picture URL and local upload management
- Homepage announcement and hero content editing
- Order creation from storefront checkout
- Order fulfilment status management
- Local dashboard metrics
- Smoke-test script for delivery verification
- Security headers on API and static responses
- Production admin password enforcement with `NODE_ENV=production`
- Basic admin login rate limiting
- Safer path validation for static file serving
- Sanitized public rendering for catalog/cart/content data
- Turso/libSQL database storage with automatic migration from legacy `data/store.json`

See `DELIVERY.md` for the delivery flow and presentation checklist.

## Remaining Production Requirements

This is now ready for project delivery and can be hosted as a small Node app. A commercial live store should still add a real payment provider, shipping rules, transactional email, a managed database, object storage for uploaded images, backups, monitoring, and automated browser tests.
