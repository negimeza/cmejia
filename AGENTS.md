# AGENTS.md

## Project

Vanilla JS + CSS + Supabase e-commerce. Two pages: public catalog (`index.html`) and admin panel (`admin.html`). No framework, no build step, no package manager — open directly or via `npx live-server`.

## Commands

- **Run locally:** `npx live-server` (required; `file://` breaks CORS for Supabase calls)
- **No lint, no tests, no typecheck, no build** — this is a raw HTML/JS/CSS project

## Architecture

### Entry points
- `index.html` → `js/app.js` (orchestrator: `window.CatalogApp`)
- `admin.html` → `js/admin.js` (orchestrator: `window.AdminAuth` → `AdminUI` → etc.)

### JS layer (all global via `window.*`)
- `core/` — `supabase-client.js` (instantiates `window.sb`), `brand-config.js` (applies store identity to DOM), `utils.js`
- `services/` — `config.service.js`, `product.service.js`, `category.service.js`, `storage.service.js` — all call `window.sb`
- `ui/` — `cart.js`, `catalog-ui.js`, `toast.js`, `confirm-modal.js`, `image-upload.js`
- `catalog/` — `catalog-modal.js`
- `admin/` — `admin-auth.js`, `admin-ui.js`, `admin-inventory.js`, `admin-editor.js`, `admin-categories.js`, `admin-settings.js`

### Load order matters
`supabase-config.js` (CDN) → `supabase-client.js` → `services/*` → `ui/*` → `catalog/*` → `app.js`. Dependencies are implicit via `window.*`, not ES modules.

### Supabase config
- Hardcoded in `js/supabase-config.js` — URL + publishable key (not in .env)
- Singleton `window.sb` created in `js/core/supabase-client.js`
- Tables: `products` (joins `categories(name)`), `categories`, `settings`
- Storage bucket: `product-images` (public)

### Config flow
`ConfigService` caches store config in `localStorage` key `lupe_config_cache`. `BrandConfig.apply()` reads it synchronously and patches DOM (logos, hero, WhatsApp links, Instagram, footer).

### Cart
Persisted in `localStorage` key `lupe_cart`. Checkout via WhatsApp message.

## Key conventions

- All JS modules use `window.XXX = { ... }` pattern (no imports/exports)
- Internal properties prefixed with `_`: `_products`, `_currentPage`, `_isLoading`
- Always destructure Supabase responses: `{ data, error }` + `if (error) throw error`
- Use `?.` for DOM element access; `textContent` for plain text, `innerHTML` only for lists/tables
- Escape user strings with `Utils.escapeAttr()` before interpolating in HTML
- CSS tokens in `base.css` — prefer `var(--accent)`, `var(--bg-card)`, etc. over hardcoded colors
- Fonts: Outfit (body/buttons), Cormorant Garamond (modal titles), Inter (admin tables)

## Important design doc

`js/diseñador.md` is the live design document with architecture diagrams, CSS tokens, component specs, known bugs, and style guide. Read it before significant UI work.

## Known issues (from diseñador.md)

- Modal tallas (sizes) were previously static HTML. They're now generated dynamically in `CatalogModal.open()` — verify before assuming otherwise.
- WhatsApp float button: ensure number comes from `ConfigService`, not hardcoded in HTML
- No reactive sync between admin and catalog tabs — `BrandConfig.apply()` must be called manually after config save
- Admin edit modal copies category options from create-form DOM — fragile if products tab hasn't been visited