# Revisión de Código — Boutique V2 (Catálogo + Admin)

> **Fecha:** 2026-05-10
> **Revisor:** Senior Code Reviewer
> **Alcance:** Análisis completo del frontend (HTML/CSS/JS) + integración Supabase.
> **Modo:** Solo lectura — no se modifican archivos.

---

## Tabla de contenido

1. [Vulnerabilidades de seguridad](#1-vulnerabilidades-de-seguridad)
2. [Bugs reales](#2-bugs-reales)
3. [Arquitectura y mantenibilidad](#3-arquitectura-y-mantenibilidad)
4. [Performance](#4-performance)
5. [Observabilidad y código sucio](#5-observabilidad-y-código-sucio)
6. [Accesibilidad](#6-accesibilidad)
7. [Inputs y validaciones](#7-inputs-y-validaciones)
8. [Tests faltantes](#8-tests-faltantes)
9. [Resumen ejecutivo](#9-resumen-ejecutivo)

---

## 1. Vulnerabilidades de seguridad

### 🔴 Critical — XSS generalizado por interpolación sin escapar en `innerHTML`

**Archivos afectados:**
`js/admin/admin-inventory.js`, `js/admin/admin-categories.js`, `js/ui/catalog-ui.js`, `js/ui/cart.js`, `js/ui/toast.js`, `js/catalog/catalog-modal.js`, `js/core/brand-config.js`.

**Explicación:**
Los nombres de producto, descripciones, categorías, `storeName`, `instagram`, tallas, etc. provienen de la base de datos / configuración y se inyectan directamente en plantillas `innerHTML` sin escapar. Aunque `AGENTS.md` exige `Utils.escapeAttr()`, **nunca se invoca** en el código.

Además, `Utils.escapeAttr()` está **incompleto**: solo escapa `'` y `"`. No escapa `<`, `>`, `&`, por lo que ni siquiera serviría contra XSS dentro de texto.

**Ejemplo de ataque:**
Un admin crea una categoría llamada `<img src=x onerror=alert(1)>` → al renderizarla en el catálogo público, ejecuta JS arbitrario en el navegador de **todos los visitantes**.

**Líneas problemáticas (selección):**
- `js/admin/admin-inventory.js:99-128` → `${p.name}`, `alt="${p.name}"`, `onclick="AdminEditor.open('${p.id}')"`.
- `js/admin/admin-categories.js:33-46` → el `replace(/'/g, "\\'")` **no es escape HTML**, solo escape JS.
- `js/ui/catalog-ui.js:76-93` → `${p.name}` y `${p.categories?.name}` interpolados.
- `js/ui/cart.js:158-178` → `<h4>${p.name}</h4>`, talla, categoría.
- `js/ui/toast.js:46-55` → nombres e imágenes interpoladas.
- `js/core/brand-config.js:39, 53, 112` → `storeName` puesto en `innerHTML`.

**Impacto:**
Robo de sesión del admin (token JWT en `localStorage`), defacement del catálogo, redirecciones maliciosas, robo de datos del carrito.

**Recomendación:**
1. Reparar `Utils.escapeAttr` y crear un `escapeHTML` real.
2. Reemplazar interpolación en `innerHTML` por creación de nodos (`textContent` siempre que sea posible).

**Fix sugerido:**
```js
// js/core/utils.js
escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
},
escapeAttr(str) { return this.escapeHTML(str); }
```
Y en todos los `innerHTML`:
```js
`<h3>${Utils.escapeHTML(p.name)}</h3>`
```
Mejor aún, refactorizar `_createCard`, `cart-item`, `cat-item` a `document.createElement` + `textContent`.

---

### 🟠 High — `onclick="...('${p.id}')"` permite inyección en handlers

**Archivos:** `js/admin/admin-inventory.js:104, 119, 122`, `js/admin/admin-categories.js:42`.

**Explicación:**
Aunque `p.id` sea un UUID hoy, cualquier campo string interpolado en `onclick="...('${X}')"` es un vector si la BD cambia o el dato proviene de un campo libre (e.g., el escape de `c.name` con `replace(/'/g,"\\'")` no protege ante `</button><script>...`).

**Recomendación:**
Usar event delegation (como ya se hace bien en `catalog-ui.js:9` para los filtros). Eliminar `onclick` inline en HTML generado dinámicamente.

**Ejemplo:**
```js
tbody.addEventListener('click', (e) => {
  const editBtn = e.target.closest('.btn-tbl-edit');
  if (editBtn) AdminEditor.open(editBtn.dataset.id);
});
```

---

### 🟠 High — Upload de imágenes sin validación cliente real

**Archivos:** `js/services/storage.service.js`, `js/ui/image-upload.js:46-49`.

**Problemas:**
1. No hay validación de **tamaño** del archivo → el usuario puede subir un GB.
2. La validación MIME (`startsWith('image/')`) **solo existe en el handler de `drop`**, no en el de `change`. Por el `<input type="file" accept="image/*">` confías al navegador, pero ese atributo es **bypaseable**.
3. La extensión se toma del nombre del archivo (`file.name.split('.').pop()`) → atacante puede subir `evil.svg` (XSS via SVG) o `.html`.
4. `Math.random().toString(36).substring(2)` produce nombres de **longitud variable**, con colisiones esperadas en pocos miles de uploads.

**Recomendación:**
```js
async uploadImage(file) {
  if (!file) return '';
  if (file.size > 5 * 1024 * 1024) throw new Error('Máximo 5MB');
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) throw new Error('Solo JPG/PNG/WEBP');
  const ext = file.type.split('/')[1];
  const fileName = `${crypto.randomUUID()}.${ext}`;
  // ...
}
```
Y en el bucket Supabase: política RLS que restrinja por mime/size desde el servidor.

---

### 🟠 High — Verificar políticas RLS en Supabase (no visible en repo)

**Archivo:** `js/supabase-config.js`.

**Explicación:**
La key publicable es correcta exponer; pero el modelo de seguridad depende **totalmente** de RLS. No hay forma de verificarlo desde el código. Si las tablas `products`, `categories`, `settings` o el bucket `product-images` no tienen RLS estricta para roles anónimos, un atacante puede insertar/borrar desde la consola del navegador.

**Recomendación:**
Confirmar en Supabase Dashboard:
- `products`, `categories`, `settings`: `SELECT` público OK; `INSERT/UPDATE/DELETE` solo `authenticated`.
- Bucket `product-images`: insertar solo `authenticated`, leer público.

---

## 2. Bugs reales

### 🟠 High — `JSON.parse` sin try/catch puede romper la carga de la página

**Archivos:** `js/ui/cart.js:6`, `js/services/config.service.js:19`.

```js
_items: JSON.parse(localStorage.getItem('lupe_cart')) || [],
```
Si `localStorage` se corrompe (extensión del navegador, edición manual), **lanza** y el módulo entero falla a la carga. En `config.service.js` es peor: rompe el bootstrap completo del catálogo.

**Fix:**
```js
function safeParse(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
_items: safeParse('lupe_cart', []),
```

---

### 🟠 High — `ConfigService.load()` sobrescribe defaults con `null`

**Archivo:** `js/services/config.service.js:40-51`.

Si la fila en `settings` existe pero algún campo es `null` (e.g., `instagram`), `this._cache.instagram = null` pisa el default y, peor, los consumidores que esperaban string vacío fallan (e.g., `cfg.instagram` se usa con `cfg.instagram ? ... : 'hidden'` así que aquí pasa por casualidad; pero `cfg.waNumber` si llega `null` rompe `.replace(/^57/, '')` en `admin-settings.js:15`).

**Fix:** mergear con defaults:
```js
this._cache = { ...CONFIG_DEFAULTS, ...mapped(data) };
```

---

### 🟡 Medium — `confirmDelete` puede entrar en bucle infinito

**Archivo:** `js/admin/admin-inventory.js:261-268`.

Si el producto no está en `_products` (ya borrado en otra sesión), llama `this.load().then(() => this.confirmDelete(id))`. Después del reload, el producto **sigue** sin estar → recursión infinita silenciosa.

**Fix:**
```js
confirmDelete(id, _retry = false) {
  const p = this._products.find(x => x.id === id);
  if (!p) {
    if (_retry) {
      showToast('El producto ya no existe.', true);
      return;
    }
    this.load().then(() => this.confirmDelete(id, true));
    return;
  }
  // ...
}
```

---

### 🟡 Medium — `admin-settings.js` mezcla `confirm()` nativo y `showConfirm` custom

**Archivo:** `js/admin/admin-settings.js:50`.

```js
if (!confirm('¿Restablecer configuración a valores por defecto?')) return;
```
Usa `confirm()` nativo aunque el proyecto tiene `showConfirm/confirmAsync`. UX inconsistente y bloqueante.

**Fix:**
```js
async reset() {
  if (!(await confirmAsync('Restablecer configuración', '¿Volver a valores por defecto?'))) return;
  // ...
}
```

---

### 🟡 Medium — `togglePassword` falla sin null-check

**Archivo:** `js/admin.js:44-53`.

`input.type` se accede sin guard. Si por A/B testing o cambio de DOM `#password` no existe, throw.

**Fix:** añadir `if (!input || !icon) return;`.

---

### 🟡 Medium — `Cart._items` referenciado por índice → frágil tras render

**Archivo:** `js/ui/cart.js:166-170`.

`onclick="Cart.changeQty(${i}, -1)"` usa el índice del array. Cualquier render asíncrono concurrente (por ejemplo, si `add()` se llama mientras el carrito está abierto y antes del re-render, el usuario hace click) deja índices stale apuntando al item equivocado.

**Recomendación:** usar identificador único (`${p.id}-${p.talla}`) y resolver por clave en runtime.

---

### 🟡 Medium — `bulkHide/bulkDelete` usan `Promise.all` sin manejo parcial

**Archivo:** `js/admin/admin-inventory.js:235, 252`.

Si una update falla, las anteriores ya pasaron. El usuario ve un error genérico y no sabe cuáles funcionaron.

**Fix:** `Promise.allSettled`, mostrar contador "X éxitos, Y errores".

---

### 🟢 Low — `app.js` no resetea `_currentPage` en `loadInitialData`

**Archivo:** `js/app.js:65-95`.

Sí lo hace en `handleFilter` (línea 100). Pero si se vuelve a llamar `loadInitialData` (no ocurre hoy, pero podría), el currentPage queda con valor antiguo.

---

### 🟢 Low — `applyRandomHero` usa ruta absoluta

**Archivo:** `js/core/brand-config.js:130`.

`url("/assets/hero/hero-${randomNum}.png")` con barra inicial. Si el sitio se sirve bajo un subpath (GitHub Pages, etc.), rompe.

**Fix:** usar ruta relativa `assets/hero/...` o configurar `base href`.

---

### 🟢 Low — `Cart.render()` usa `'$0'` literal en lugar de `Utils.formatCurrency`

**Archivo:** `js/ui/cart.js:133-134`.

Mínimo, pero inconsistente con resto del proyecto (formato COP).

---

## 3. Arquitectura y mantenibilidad

### 🟡 Medium — Acoplamiento por estado global mutable

**Ejemplos:**
`AdminEditor.open()` lee `window.AdminInventory._products` (`admin-editor.js:66`), `window.AdminCategories._list` (línea 78). Un módulo accede a propiedades `_internas` de otro.

**Impacto:**
Refactorizar uno rompe al otro silenciosamente. Imposible de testear unitariamente.

**Recomendación:**
Mediano plazo — migrar a **ES modules** (`type="module"`), exponer APIs explícitas:
```js
// admin-inventory.js
export function getProductById(id) { return _products.find(p => p.id === id); }
```
O al menos pasar listas por argumento: `AdminEditor.open(p, categories)`.

---

### 🟡 Medium — `window.*` en todo el código + orden de carga implícito

La sección "Load order matters" de `AGENTS.md` es un olor a diseño: si el orden de `<script>` cambia, todo falla en runtime. No hay forma de detectarlo antes de ejecutar.

**Recomendación:**
Migrar a ES Modules. Sin build step, los módulos nativos `<script type="module">` ya soportan imports. Beneficios inmediatos:
- Imports explícitos → IDE detecta usos no resueltos.
- Sin globales → menor superficie XSS.
- Tree-shaking trivial al añadir bundler luego.

---

### 🟡 Medium — Lógica duplicada de `body.style.overflow`

Modal carrito, modal detalle, mobile nav, confirm modal, admin edit modal → todos ponen `document.body.style.overflow = 'hidden'`. Si abres dos al mismo tiempo (modal de confirmación encima del edit), cerrar uno restaura el scroll y rompe el otro.

**Recomendación:**
Crear `Utils.lockScroll() / unlockScroll()` con contador (semáforo).

---

### 🟡 Medium — SVGs inline duplicados decenas de veces

WhatsApp, basurero, lápiz, plus → mismas paths repetidos en HTML y JS. ~3 KB innecesarios por página y dolor de mantener.

**Recomendación:**
Mover a un `<svg style="display:none"><symbol id="ico-whatsapp">…</symbol></svg>` con `<use href="#ico-whatsapp">`.

---

### 🟢 Low — `confirm-modal.js` clona el botón para "limpiar listeners"

**Archivo:** `js/ui/confirm-modal.js:45-46`.

El truco `cloneNode` indica que `initConfirmModal` se temía llamar más de una vez. Hoy se llama exactamente uno (en `admin.js`). En `index.html` no se llama — pero `confirmAsync` está disponible globalmente, y al primer uso público (en catálogo) **no hay handlers** → el modal no responde.

**Recomendación:** llamar `initConfirmModal()` también desde `app.js` (no daña), o auto-inicializar al primer `showConfirm`.

---

### 🟢 Low — `admin-editor.js:84-88` fallback frágil a `#p-category` options

Sólo funciona si la pestaña Productos se visitó antes. Ya está documentado como bug conocido en `AGENTS.md`. Solución limpia: cargar categorías una vez al login (`AdminAuth.showDashboard` ya las carga línea 23) y exponerlas en `AdminCategories._list`.

---

## 4. Performance

### 🟢 Low — `Promise.all` sin throttling en bulk ops

Con 200 productos seleccionados → 200 requests concurrentes. Supabase tiene rate limiting. Mejor usar un pool (chunks de 10).

### 🟢 Low — Re-render completo de la tabla admin en cada cambio

OK para `pageSize=15`. Si crece a 100, considerar diffing.

### 🟢 Low — `setupHeaderScroll` sin `requestAnimationFrame`

**Archivo:** `js/app.js:154`.

Listener de `scroll` ejecuta `toggle` en cada frame. Throttle con rAF:
```js
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      header.classList.toggle('scrolled', window.scrollY > 50);
      ticking = false;
    });
    ticking = true;
  }
});
```

### 🟢 Low — Sin `IntersectionObserver` cleanup

`app.js:62` observa el centinela. Si `init` se llamara dos veces, se pierde el observer. Hoy no pasa, pero `disconnect()` antes de re-observar es defensa barata.

---

## 5. Observabilidad y código sucio

### 🟢 Low — `console.log` de debug en producción

Quitar:
- `js/services/product.service.js:86, 94, 102, 109, 112`
- `js/admin/admin-inventory.js:262, 265`
- `js/ui/confirm-modal.js:49, 53, 56, 65, 68`
- `js/core/brand-config.js:132`

Mantener `console.error` para errores reales.

### 🟢 Low — Cero tracking de errores

Catch silenciosos en `BrandConfig.apply` (línea 115), `ConfigService.load`, etc. Sin Sentry/LogRocket, los bugs en producción son invisibles. Mínimo: enviar `console.error` a un endpoint Supabase Edge Function.

---

## 6. Accesibilidad

### 🟡 Medium — Modales sin `role="dialog"` ni focus trap

`#overlay`, `#confirm-modal`, `#edit-modal-overlay` no tienen `role="dialog"`, `aria-modal="true"`, ni mueven foco al abrirlos. Lector de pantalla y teclado quedan fuera.

### 🟡 Medium — Botones generados sin `aria-label` consistente

En tabla de inventario, los botones tienen `title` pero no `aria-label`. Carrito `cart-remove` es `<span>` con `onclick` — debe ser `<button>`.

### 🟢 Low — Falta `prefers-reduced-motion`

Animaciones `animationDelay` en cards y `bg-circle` en admin se ejecutan siempre.

---

## 7. Inputs y validaciones

### 🟡 Medium — `parseFloat || 0` enmascara error de entrada

**Archivos:** `js/admin/admin-editor.js:41, 147`.

Si el usuario escribe `abc` en precio, `parseFloat` da `NaN`, `|| 0` lo silencia y guarda 0 sin avisar. Mejor:
```js
const priceVal = parseFloat(document.getElementById('p-price').value);
if (Number.isNaN(priceVal) || priceVal < 0) throw new Error('Precio inválido.');
```

### 🟢 Low — Falta validación de `instagram` (puede meter URL completa)

Si el admin pega `https://www.instagram.com/usuario/`, queda `https://www.instagram.com/https://www.instagram.com/usuario/`. Sanitizar a username:
```js
instagram: get('cfg-instagram').replace(/^.*instagram\.com\//, '').replace(/\/$/, '')
```

---

## 8. Tests faltantes

No hay ninguno. Mínimo recomendado para producción:
- **Carrito**: agregar/quitar/cambiar cantidad, persistencia, deduplicación por id+talla.
- **ConfigService**: load fallback, save mapping camelCase↔snake_case.
- **Utils.escapeHTML**: cobertura de los 5 caracteres.

Setup mínimo: **Vitest** (un solo archivo `package.json`, sin tocar HTML).

---

## 9. Resumen ejecutivo

### Salud general

**Aceptable para MVP, NO listo para producción real**. Arquitectura simple y legible, separación por capas razonable, pero con un agujero XSS sistémico crítico y dependencia fuerte de globales sin pruebas.

### Riesgos principales (orden de criticidad)

1. **XSS** en catálogo y admin por interpolación HTML sin escape — explotable hoy por cualquier admin (o por cualquier visitante si las políticas RLS de Supabase permiten escritura anónima).
2. **Storage de imágenes sin validar** — abuso, costo, SVG-XSS.
3. **`JSON.parse` sin try/catch** rompe la app con un localStorage corrupto.
4. **Acoplamiento global** dificulta cualquier cambio futuro.
5. **Sin tests, sin observabilidad** → bugs invisibles en producción.

### Lista priorizada (top 10)

| # | Severidad | Acción |
|---|---|---|
| 1 | 🔴 Critical | Arreglar `Utils.escapeHTML` y aplicarlo en TODOS los `innerHTML` con datos de BD |
| 2 | 🟠 High | Validar tipo/tamaño en `StorageService.uploadImage` |
| 3 | 🟠 High | Verificar RLS de Supabase (auditoría manual) |
| 4 | 🟠 High | `try/catch` en `JSON.parse` de localStorage (`cart.js`, `config.service.js`) |
| 5 | 🟠 High | `ConfigService.load` debe merge-ear con defaults |
| 6 | 🟡 Medium | Reemplazar `onclick` inline por delegación de eventos |
| 7 | 🟡 Medium | `confirmDelete` con flag `_retry` para evitar recursión infinita |
| 8 | 🟡 Medium | Unificar modales en `lockScroll()` con contador |
| 9 | 🟡 Medium | `confirm()` nativo → `confirmAsync` en `admin-settings.js` |
| 10 | 🟢 Low | Quitar `console.log` de debug y centralizar SVGs en `<symbol>` |

### Recomendaciones de arquitectura

- **Migrar a ES Modules** (`<script type="module">` + `import/export`). Sin build step, sin globales. Mejora seguridad, testabilidad y refactoring.
- **Servicios → repositorios + casos de uso**: `ProductService` mezcla queries y mapeo. Separar en `productRepo.findAll()` + `productMapper.toDomain()`.
- **Estado del UI centralizado**: hoy cada módulo guarda su `_state`. Considerar un store mínimo (~30 líneas) con pub/sub para que `Cart` notifique a `CatalogUI` sin acoplamiento directo.
- **Build step opcional pero recomendado**: `esbuild` (1 línea), añade minificación, tree-shaking, cache busting automático en lugar del `?v=4` manual.

### Recomendaciones de testing

- **Vitest** + JSDOM para `Cart`, `Utils`, `ConfigService` (unit).
- **Playwright** para flujos críticos: login admin, crear producto, agregar al carrito, enviar WhatsApp.
- Smoke test en CI: cargar `index.html` y verificar que `window.CatalogApp` exista y `init()` no lance.

### Recomendaciones de seguridad

1. Auditar RLS en Supabase (productos/categorías/settings/bucket).
2. Activar **CSP** en el HTML:
   ```html
   <meta http-equiv="Content-Security-Policy"
         content="default-src 'self' https://*.supabase.co;
                  img-src * data:;
                  script-src 'self' https://cdn.jsdelivr.net">
   ```
   Mata casi todo el XSS reflejado aunque exista el bug.
3. Eliminar `innerHTML` con datos dinámicos en favor de `textContent`+`createElement`.
4. Honeypot/rate-limit en login si se expone públicamente.

### Quick wins (1-2 horas cada uno)

1. ✅ Reparar `Utils.escapeHTML` y reemplazar los ~15 puntos críticos de interpolación.
2. ✅ `try/catch` en `JSON.parse(localStorage…)` (2 archivos).
3. ✅ Validación de tipo + tamaño en `uploadImage`.
4. ✅ Reemplazar `confirm()` nativo por `confirmAsync` en settings.
5. ✅ Quitar `console.log` de debug.
6. ✅ Añadir CSP meta tag.
7. ✅ Unificar `lockScroll()`.

---

**Próximo paso sugerido:** abrir un PR pequeño solo con los Quick Wins #1 (XSS) y #4 (`JSON.parse` seguro), que son los de mayor impacto-por-esfuerzo y se pueden revisar en menos de 15 minutos.
