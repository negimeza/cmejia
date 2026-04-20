/**
 * app.js — Orquestador del catálogo público Boutique V2.
 */

let _currentProduct = null;
let _products = [];
let _categories = [];
let _activeCategory = 'all';
let _currentSize     = null;

// ── Aplica configuración guardada en localStorage ──
function applyConfig() {
  try {
    const saved = localStorage.getItem('lupe_config');
    if (!saved) return;
    const cfg = JSON.parse(saved);

    // — Título del navegador —
    if (cfg.storeName) {
      document.title = `${cfg.storeName} – Catálogo Premium`;
      const logo = document.getElementById('header-logo');
      if (logo) logo.textContent = cfg.storeName;
    }

    // — Hero —
    if (cfg.heroTitle) {
      const el = document.getElementById('hero-title');
      if (el) el.textContent = cfg.heroTitle;
    }
    if (cfg.heroSubtitle) {
      const el = document.getElementById('hero-sub');
      if (el) el.textContent = cfg.heroSubtitle;
    }
    if (cfg.city) {
      const badge = document.getElementById('hero-badge');
      if (badge) badge.textContent = `\uD83D\uDCCD ${cfg.city} \u00b7 Colecci\u00f3n 2026`;
    }

    // — Carrito / Envío —
    if (cfg.shippingMsg) {
      const el = document.getElementById('shipping-msg');
      if (el) el.textContent = cfg.shippingMsg;
    }

    // — Footer —
    const name    = cfg.storeName || 'LupeOutfit';
    const city    = cfg.city      || 'Medell\u00edn';
    const waNum   = cfg.waNumber  || '573207101121';
    const waLocal = waNum.replace(/^57/, '');
    const igHandle = cfg.instagram || '';

    const footerName = document.getElementById('footer-name');
    if (footerName) footerName.innerHTML = `<strong>${name}</strong> \u2014 Cat\u00e1logo de Ropa`;

    const footerCity = document.getElementById('footer-city');
    if (footerCity) footerCity.innerHTML = `Env\u00edos en <strong>${city}</strong>`;

    const footerCopy = document.getElementById('footer-copy');
    if (footerCopy) footerCopy.textContent = `\u00a9 2026 ${name} \u00b7 Todos los derechos reservados`;

    const waLink = document.getElementById('footer-wa-link');
    const waText = document.getElementById('footer-wa-text');
    if (waLink) waLink.href = `https://wa.me/${waNum}`;
    if (waText) waText.textContent = `+57 ${waLocal.slice(0,3)} ${waLocal.slice(3,6)} ${waLocal.slice(6)}`;

    const igLink = document.getElementById('footer-ig-link');
    const igText = document.getElementById('footer-ig-text');
    if (igHandle && igLink) {
      igLink.href = `https://www.instagram.com/${igHandle}`;
      if (igText) igText.textContent = `@${igHandle}`;
      igLink.classList.remove('hidden');
    } else if (igLink) {
      igLink.classList.add('hidden');
    }

    // — Botón flotante WA —
    const waFloat = document.querySelector('.wa-float');
    if (waFloat && waNum) {
      waFloat.href = `https://wa.me/${waNum}?text=Hola%2C%20quiero%20m%C3%A1s%20informaci%C3%B3n`;
    }

  } catch { /* silencioso */ }
}

document.addEventListener('DOMContentLoaded', () => {
  applyConfig();
  initApp();
});

async function initApp() {
  // 1. Inicializar UI del Carrito
  if (typeof renderCart === 'function') renderCart(); 

  // 2. Inicializar Interfaz de Catálogo
  if (window.CatalogUI) {
    CatalogUI.init({
      onProductClick: openModal,
      onAddClick:     addToCart
    });
  }

  // 3. Cargar Datos
  await loadData();

  // 4. Header Effect
  setupHeaderScroll();
}

async function loadData() {
  const loadingEl = document.getElementById('loading');
  if (window.CatalogUI) CatalogUI.showSkeletons();

  try {
    // Verificación de seguridad de conexión
    if (!window.sb) {
      throw new Error("La conexión con Supabase no se pudo inicializar. Revisa la configuración.");
    }

    // Cargar categorías y productos en paralelo
    const [cats, productsRaw] = await Promise.all([
      ProductService.getCategories(),
      ProductService.getActive()
    ]);

    _categories = cats;
    _products   = mapProducts(productsRaw);

    if (loadingEl) loadingEl.style.display = 'none';

    // Renderizar filtros y grilla
    if (window.CatalogUI) {
      CatalogUI.renderFilters(_categories, _activeCategory, handleFilter);
      CatalogUI.renderGrid(_products);
    }

  } catch (err) {
    console.error('Error cargando catálogo:', err);
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div style="color:#e53; padding:2rem; background:rgba(255,0,0,0.05); border-radius:8px;">
          <p style="font-size:1.2rem; margin-bottom:0.5rem;">⚠️ Error</p>
          <p style="font-weight:400; font-size:0.9rem;">${err.message}</p>
          <button onclick="location.reload()" style="margin-top:1rem; padding:0.5rem 1rem; cursor:pointer;">Reintentar</button>
        </div>`;
    }
  }
}

async function handleFilter(categoryId) {
  _activeCategory = categoryId;
  if (window.CatalogUI) CatalogUI.showSkeletons();
  
  try {
    const raw = await ProductService.getActiveByCategory(categoryId);
    _products = mapProducts(raw);
    if (window.CatalogUI) CatalogUI.renderGrid(_products);
  } catch (err) {
    console.error('Error filtrando:', err);
  }
}

function mapProducts(raw) {
  return raw.map(p => ({
    id:       p.id,
    name:     p.name,
    desc:     p.description || '',
    src:      p.image_url   || '',
    price:    p.price,
    category: p.categories ? p.categories.name : 'General',
  }));
}

function setupHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
      header.style.padding = '0.8rem 0';
      header.style.background = 'rgba(255, 255, 255, 0.9)';
    } else {
      header.classList.remove('scrolled');
      header.style.padding = '1.2rem 0';
      header.style.background = 'rgba(255, 255, 255, 0.7)';
    }
  });
}

// ── Lógica de Modal ──

function openModal(product) {
  _currentProduct = product;
  const img  = document.getElementById('modal-img');
  const name = document.getElementById('modal-name');
  const desc = document.getElementById('modal-desc');
  const cat  = document.getElementById('modal-category');
  const price = document.getElementById('modal-price');
  
  if (img)   img.src         = product.src;
  if (name)  name.textContent = product.name;
  if (desc)  desc.textContent = product.desc;
  if (cat)   cat.textContent  = product.category;
  if (price) price.textContent = Number(product.price) === 0 ? '$-' : `$${Number(product.price).toLocaleString('es-CO')}`;
  
  const qtyEl = document.getElementById('modal-qty');
  if (qtyEl) qtyEl.textContent = '1';
  
  document.getElementById('overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  
  // Reset talla
  _currentSize = null;
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
}

function closeModal(e) {
  const overlay = document.getElementById('overlay');
  const isOverlay = !e || e.target === overlay;
  const isCloseBtn = e && e.target && (e.target.classList.contains('modal-x') || e.target.classList.contains('btn-close-modal'));
  
  if (isOverlay || isCloseBtn) {
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function changeModalQty(dir) {
  const el = document.getElementById('modal-qty');
  if (!el) return;
  let qty = parseInt(el.textContent) + dir;
  if (qty < 1) qty = 1;
  el.textContent = qty;
}

function selectSize(size) {
  _currentSize = size;
  document.querySelectorAll('.size-btn').forEach(b => {
    b.classList.toggle('active', b.textContent === size);
  });
}

function agregarAlCarrito() {
  if (!_currentSize) {
    const container = document.querySelector('.modal-sizes');
    container?.classList.add('shake');
    setTimeout(() => container?.classList.remove('shake'), 500);
    return;
  }

  const qtyEl = document.getElementById('modal-qty');
  const qty = qtyEl ? parseInt(qtyEl.textContent) : 1;
  
  const productWithTalla = { ..._currentProduct, talla: _currentSize };

  for(let i=0; i<qty; i++) {
    if (typeof addToCart === 'function') addToCart(productWithTalla);
  }
  closeModal();
}
