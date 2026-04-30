# 🎨 LupeOutfit — Documento de Diseño Vivo

> **Versión:** 2.0 · **Última revisión:** Abril 2026  
> **Stack:** Vanilla JS + CSS + Supabase  
> **Contexto:** Boutique de ropa en Medellín. Catálogo público + Panel Admin.

---

## 1. SISTEMA DE DISEÑO

### 1.1 Tokens de Color (CSS Custom Properties en `base.css`)

| Token | Valor | Uso |
|---|---|---|
| `--bg-dark` | `#0a0a0f` | Fondo global del body |
| `--bg-surface` | `#0f0f18` | Fondo de modales y cards elevados |
| `--bg-card` | `rgba(255,255,255,0.03)` | Fondo de tarjetas de producto |
| `--white` | `#ffffff` | Texto principal |
| `--accent` | `#e8457a` | Rosa boutique — CTA, precios, badges |
| `--accent-glow` | `rgba(232,69,122,0.3)` | Sombras y glow de acento |
| `--text-main` | `#ffffff` | Texto primario |
| `--text-muted` | `#9ca3af` | Texto secundario, labels |
| `--border` | `rgba(255,255,255,0.08)` | Bordes sutiles en dark mode |
| `--wa` | `#25D366` | Verde WhatsApp |
| `--radius` | `12px` | Radio de bordes estándar |
| `--radius-lg` | `20px` | Radio de bordes grande (modales, cards) |
| `--transition` | `0.4s cubic-bezier(.165,.84,.44,1)` | Transición estándar |

### 1.2 Tipografía

| Fuente | Peso | Rol |
|---|---|---|
| `Outfit` | 300, 400, 600, 800 | Cuerpo, botones, labels, filtros |
| `Cormorant Garamond` | 300, 400, 500 | Títulos de modal (elegante, serif) |
| `Inter` | 400, 500, 600, 700 | Textos técnicos, tablas admin |

**Regla de uso:**
- Headings principales → `Outfit 800`, gradient clip blanco→slate
- Nombre del producto en modal → `Cormorant Garamond 300`, 36px
- Labels (talla, cantidad) → `Outfit 600`, uppercase, `letter-spacing: .18em`
- Precios → `Outfit 800`, color `var(--accent)`

### 1.3 Gradiente de Fondo (body)

```css
background-image:
  radial-gradient(circle at 10% 20%, rgba(232,69,122,0.05) 0%, transparent 40%),
  radial-gradient(circle at 90% 80%, rgba(139,92,246,0.05) 0%, transparent 40%);
```
Ambos radiales son sutiles; el segundo usa un violeta (`#8b5cf6`) para tensión visual.

### 1.4 Escala de Elevación (box-shadow)

| Nivel | Uso | Shadow |
|---|---|---|
| **Low** | Cards en reposo | Ninguna (solo border) |
| **Mid** | Cards en hover | `0 20px 40px rgba(0,0,0,0.4)` |
| **High** | Modales | `0 30px 80px -20px rgba(0,0,0,.7), 0 10px 30px -10px rgba(0,0,0,.5)` |
| **Glow** | Botones CTA / badges activos | `0 10px 30px -12px rgba(232,69,122,0.55)` |

---

## 2. COMPONENTES UI — CATÁLOGO PÚBLICO

### 2.1 Header (`header.css`)
- Posición: `fixed top-0`, `z-index: 100`
- Efecto scroll: al pasar 50px → `background: rgba(255,255,255,0.9)`, padding reduce de `1.2rem 0` a `0.8rem 0`
- Clase JS: `.scrolled` (gestionada en `app.js → setupHeaderScroll()`)
- Ícono Admin: SVG de engranaje, enlaza a `admin.html`

### 2.2 Hero (`hero.css`)
- Badge superior: `📍 Medellín · Colección 2026` (dinámico via `CatalogConfig.apply()`)
- H1: usa `formatBoutiqueText()` → última palabra en `<em>` con gradiente
- CTA: `<a href="#catalogo">Ver Catálogo</a>` — scroll interno

### 2.3 Filtros de Categoría (`.cat-filters`)
- Generados dinámicamente en `CatalogUI.renderFilters()`
- Botón activo: `background: var(--accent)`, `box-shadow: 0 0 15px var(--accent-glow)`
- Evento: delegación de click en el container (no en cada botón individual)

### 2.4 Tarjeta de Producto (`.card`)
- Aspect-ratio imagen: `3/4` (portrait — ideal para ropa)
- Animación de entrada: `@keyframes reveal` con `animation-delay: index * 0.05s`
- Hover: `translateY(-10px)`, border rosa, shadow profunda
- Botón rápido (`.btn-add-cart-fast`): aparece con `opacity: 1` en hover de la card
- **Click en card** → `CatalogModal.open(product)`
- **Click en botón rápido** → `Cart.add(product)` (sin modal, sin talla)

### 2.5 Modal de Producto (`modal.css` + `catalog-modal.js`)
- Layout: 50% imagen | 50% datos (flex row)
- Mobile < 700px: columna, imagen `height: 350px`
- Badge de categoría: posición absoluta `top:20px left:20px`, gradiente rosa
- Título: `Cormorant Garamond 300`, 36px
- Selector de tallas: botones pill — **estado activo requerido** para agregar al carrito
- Validación sin talla: animación `.shake` en `.modal-sizes`
- Cantidad: control +/− con estado mínimo = 1
- CTA: gradiente rosa `linear-gradient(135deg, #f472b6, var(--accent), #db2777)`

> ⚠️ **BUG CONOCIDO:** `selectSize(s, btn)` en `catalog-modal.js` recibe el botón como segundo parámetro, pero en `index.html` el onclick hardcodeado llama `selectSize('S')` **sin pasar el botón**. El sistema de tallas en el HTML es estático; debería generarse dinámicamente desde el producto.

### 2.6 Carrito Drawer (`.cart-drawer`)
- Slide desde la derecha: `transform: translateX(100%)` → `translateX(0)` con clase `.open`
- Overlay oscuro: `#cart-overlay` cierra el drawer al hacer click
- Items: imagen + nombre + categoría + talla + precio + botón eliminar
- Footer: Subtotal = Total (no hay costos de envío calculados aún)
- Botón WA: genera mensaje estructurado agrupando por producto+talla

### 2.7 Botón WhatsApp Flotante
- Posición: `fixed bottom-right`
- Animación: `.wa-pulse` — anillo que pulsa con `@keyframes pulse`
- Número hardcodeado en HTML: `573206419934` — **debería venir de `ConfigService`**

---

## 3. COMPONENTES UI — PANEL ADMIN

### 3.1 Login (`admin.css`)
- Pantalla completa con fondo animado (3 círculos difusos + grid pattern + estrellas decorativas)
- Card de login centrada, efecto glassmorphism
- Toggle de contraseña con SVG del ojo
- Checkbox personalizado (`.checkbox-custom`)
- Error: `#login-error` aparece debajo del botón

### 3.2 Navegación Admin
- **Desktop:** Navbar superior (`#admin-nav`) + Tabs horizontales (`#tabs-nav`)
- **Mobile:** Hamburger → Slide-in nav lateral (`#mobile-nav`) con overlay
- Tabs: Productos · Categorías · Inventario · Configuración

### 3.3 Tab Productos — Alta
- Formulario: imagen (drag&drop / click), nombre, categoría (dinámico), descripción, precio, toggle activo
- Upload de imagen: `StorageService.uploadImage()` → URL pública en Supabase Storage
- Categorías cargadas desde `CategoryService` via `AdminCategories.load()`

### 3.4 Tab Inventario
- Tabla con paginación server-side (15 por página)
- Búsqueda debounced (500ms) por nombre o descripción
- Columnas: Imagen · Producto · Categoría · Precio · Estado · Acciones
- Acciones: Editar (`AdminEditor.open(id)`) · Eliminar (confirm modal)

### 3.5 Modal de Edición
- Layout espejo del modal público: columna imagen | columna campos
- Click en imagen → file input → `AdminEditor.handleImageChange()` → Supabase Storage
- Categorías copiadas del select de creación (mismo DOM)
- Guardado: `ProductService.update(id, updates)`

### 3.6 Tab Categorías
- Formulario mínimo: nombre + botón "Crear"
- Lista de categorías con botón eliminar
- Badge contador de categorías en header de la lista

### 3.7 Tab Configuración
- Campos: Nombre de tienda, Ciudad, WhatsApp, Instagram
- Persistencia: `localStorage` via `ConfigService`
- Al guardar → `CatalogConfig.apply()` actualiza el DOM en tiempo real

---

## 4. ARQUITECTURA DE MÓDULOS JS

```
js/
├── supabase-config.js        # URL y publishable key de Supabase
├── app.js                    # Orquestador del catálogo público
├── admin.js                  # Orquestador del panel admin
│
├── core/
│   ├── supabase-client.js    # Instancia window.sb
│   └── utils.js              # debounce, escapeAttr, formatCurrency
│
├── services/
│   ├── config.service.js     # get/set configuración en localStorage
│   ├── product.service.js    # CRUD de productos (Supabase)
│   ├── category.service.js   # CRUD de categorías (Supabase)
│   └── storage.service.js    # Upload de imágenes (Supabase Storage)
│
├── catalog/
│   ├── catalog-config.js     # Aplica config al DOM del catálogo
│   └── catalog-modal.js      # Lógica del modal de producto
│
├── ui/
│   ├── cart.js               # Carrito con localStorage
│   ├── catalog-ui.js         # Grid, filtros, skeletons
│   ├── toast.js              # Notificaciones toast
│   ├── confirm-modal.js      # Modal de confirmación de acciones
│   └── image-upload.js       # Drag & drop de imágenes (alta)
│
└── admin/
    ├── admin-auth.js         # Login/logout con Supabase Auth
    ├── admin-ui.js           # Tabs, nav móvil, estado del dashboard
    ├── admin-editor.js       # Crear y editar productos
    ├── admin-inventory.js    # Tabla, búsqueda, paginación
    ├── admin-categories.js   # CRUD de categorías
    └── admin-settings.js     # Configuración de tienda
```

### Flujo de Carga — Catálogo Público

```
DOMContentLoaded
  └─ CatalogApp.init()
       ├─ CatalogConfig.apply()       → ajusta DOM con config de localStorage
       ├─ CatalogUI.init()            → delegación de eventos en filtros
       ├─ setupHeaderScroll()         → scroll listener
       ├─ loadInitialData()
       │    ├─ ProductService.getCategories()   → renderFilters()
       │    └─ ProductService.getActive(0,12)   → renderGrid()
       └─ Cart.render()               → estado inicial del carrito
```

### Flujo de Carga — Admin

```
DOMContentLoaded
  └─ AdminAuth.init()
       └─ sb.auth.onAuthStateChange()
            ├─ No session → showLogin()
            └─ Session    → showDashboard(user)
                             ├─ AdminCategories.load()   → llena selects de categoría
                             └─ AdminInventory.load()    → tabla inicial
```

---

## 5. BASE DE DATOS SUPABASE

### Tabla `products`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | Auto-generado |
| `name` | `text` NOT NULL | Nombre del producto |
| `description` | `text` | Descripción libre |
| `price` | `numeric` | Precio en COP |
| `category_id` | `uuid` FK → `categories.id` | Nullable |
| `image_url` | `text` | URL pública en Storage |
| `active` | `boolean` | Visible en catálogo público |
| `created_at` | `timestamptz` | Auto, usado para ordenar desc |

### Tabla `categories`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | Auto-generado |
| `name` | `text` NOT NULL UNIQUE | Nombre de la categoría |

### Join estándar
```javascript
// Siempre se hace eager loading del nombre de categoría:
.select('*, categories(name)')
// Acceso en JS: product.categories?.name
```

### Storage Bucket
- Bucket: `product-images`
- Acceso público (URLs directas sin auth)
- Subida: `StorageService.uploadImage(file)` → devuelve `publicUrl`

---

## 6. CONFIGURACIÓN DE TIENDA (localStorage)

Gestionado por `ConfigService` bajo la key `lupe_config`.

```javascript
// Estructura del objeto de configuración:
{
  storeName: "LupeOutfit",
  city: "Medellín",
  waNumber: "573207101121",  // formato internacional completo
  instagram: "lupeoutfit"    // sin @
}
```

---

## 7. BUGS CONOCIDOS Y DEUDA TÉCNICA

### 🔴 Críticos

1. **Tallas hardcodeadas en el modal público.**  
   Las tallas (S, M, L, XL, Única) están en `index.html` como HTML estático. `CatalogModal.selectSize(s, btn)` espera el botón como segundo arg, pero el `onclick` del HTML no lo pasa.  
   **Fix:** Generar los botones de talla dinámicamente en `CatalogModal.open()` desde un array del producto o default.

2. **Botón WA flotante usa número hardcodeado.**  
   `index.html` línea 122 tiene `573206419934` hardcodeado. El número correcto debería venir de `ConfigService`.  
   **Fix:** Generar el botón desde JS leyendo `ConfigService.get().waNumber`.

3. **`agregarAlCarrito()` llama a `CatalogModal.confirmAdd()` no a `CatalogModal.agregarAlCarrito()`.**  
   Alias en `app.js` línea 112 apunta correctamente a `confirmAdd()`. Consistente pero el nombre del alias es confuso.

### 🟡 Mejoras de UX

4. **No hay feedback visual al agregar al carrito sin modal (botón rápido).**  
   El botón rápido `.btn-add-cart-fast` llama `Cart.add(p)` que ya llama `animate()`, pero el toast o confirmación es inexistente. El usuario no sabe qué talla se registró.  
   **Propuesta:** Mostrar un mini-toast `+1 al carrito (sin talla)` o abrir el modal para forzar talla.

5. **El carrito no agrupa por producto+talla en la vista del drawer.**  
   Cada `Cart.add()` añade un item independiente. La vista muestra items repetidos.  
   **Propuesta:** Agregar una propiedad `qty` al item y fusionar duplicados en `Cart.add()`.

6. **Skeletons no respetan el aspect-ratio de las cards.**  
   Los skeletons en `CatalogUI.showSkeletons()` usan `height: 350px` fijo. Con `aspect-ratio: 3/4`, el skeleton debería omitir el height o usar la misma regla.

### 🟢 Mejoras de Arquitectura

7. **`admin-editor.js` copia las opciones del select `#p-category` del DOM para el modal de edición.**  
   Frágil dependencia DOM. Si el tab de productos no se ha activado, el select puede estar vacío.  
   **Fix:** Guardar las categorías en una variable compartida (`window.AdminCategories._list`) y usarla directamente.

8. **Paginación del catálogo público usa `raw.length === pageSize` para detectar si hay más páginas.**  
   Si el total de productos es múltiplo exacto de `pageSize`, el botón "Ver más" aparece aunque no haya más productos.  
   **Fix ideal:** Usar `count: 'exact'` en la query y comparar contra el total real.

9. **`ConfigService` no reactivo.**  
   Al guardar config en admin, `CatalogConfig.apply()` se llama manualmente. Si el admin y el catálogo se abrieran en pestañas distintas no se sincronizarían.  
   **Impacto actual:** Bajo (dos páginas separadas). Documentado por completitud.

---

## 8. PRÓXIMAS FEATURES SUGERIDAS

| Prioridad | Feature | Descripción |
|---|---|---|
| 🔴 Alta | **Tallas dinámicas** | Tabla `product_sizes` o campo `sizes: text[]` en products. Modal genera botones desde el dato. |
| 🔴 Alta | **Imágenes múltiples** | Tabla `product_images` para carousel en modal. |
| 🟡 Media | **Carrito agrupado** | Items con `qty` en lugar de duplicados. |
| 🟡 Media | **Precio tachado** | Campo `original_price` para mostrar descuento. |
| 🟡 Media | **Toast al agregar** | Feedback visual inmediato con mini-card del producto. |
| 🟢 Baja | **Newsletter** | Sección comentada en index.html. Requiere tabla `subscribers`. |
| 🟢 Baja | **Analytics básicos** | Supabase Edge Functions para registrar views por producto. |

---

## 9. GUÍA DE ESTILO PARA NUEVO CÓDIGO

### Nomenclatura de objetos JS
- Los módulos globales usan **PascalCase**: `CatalogApp`, `AdminInventory`, `ProductService`
- Las propiedades internas prefijadas con `_`: `_products`, `_currentPage`
- Los métodos públicos en **camelCase**: `handleFilter()`, `loadNextPage()`

### Manipulación del DOM
- Siempre usar `?.` (optional chaining) al acceder a elementos del DOM
- Usar `innerHTML` solo para listas/tablas. Para textos simples, `textContent`
- Escapar strings del usuario con `Utils.escapeAttr()` antes de interpolar en HTML

### CSS
- Variables de token siempre sobre valores hardcoded
- Nuevas animaciones: `cubic-bezier(.165,.84,.44,1)` (la misma de `--transition`)
- Estados `:hover` siempre deben tener `transition` explícito
- Evitar `!important` salvo en `.hidden`

### Integración Supabase
- Siempre destructurar `{ data, error }` y lanzar el error: `if (error) throw error`
- En el catálogo público: `ProductService` → solo métodos `getActive*` y `getCategories`
- En el admin: todos los métodos del servicio disponibles

---

*Este documento debe actualizarse cada vez que se agregue un componente nuevo, se corrija un bug documentado, o cambie la arquitectura.*
