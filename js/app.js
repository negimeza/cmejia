/**
 * app.js — Orquestador del catálogo público Boutique V2.
 */
window.CatalogApp = {
  _products: [],
  _categories: [],
  _activeCategory: 'all',
  _currentPage: 0,
  _pageSize: 12,
  _hasMore: true,
  _totalCount: 0,
  _isLoading: false,
  _observer: null,   // IntersectionObserver para infinite scroll

  async init() {
    await ConfigService.load();
    BrandConfig.apply();
    CatalogUI.init();

    // Escuchar tecla Escape para cerrar menú móvil
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeMenu();
    });

    // Header Effect
    this.setupHeaderScroll();

    // Cerrar modal al hacer click en el backdrop
    document.getElementById('overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) window.CatalogModal?.close();
    });

    // Infinite Scroll: observar el centinela
    this._setupObserver();

    // Carga inicial
    this.loadInitialData();

    // Renderizar carrito inicial
    if (window.Cart) Cart.render();
  },

  /**
   * Configura el IntersectionObserver sobre el div#scroll-sentinel.
   * Cuando el sentinel entra en el viewport, carga la siguiente página.
   * rootMargin: '200px' → empieza a cargar 200px antes del borde inferior.
   */
  _setupObserver() {
    const sentinel = document.getElementById('scroll-sentinel');
    if (!sentinel || !('IntersectionObserver' in window)) return;

    this._observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && this._hasMore && !this._isLoading) {
        this.loadNextPage();
      }
    }, {
      rootMargin: '200px',
      threshold: 0
    });

    this._observer.observe(sentinel);
  },

  async loadInitialData() {
    CatalogUI.showSkeletons();

    try {
      const [cats, result] = await Promise.all([
        ProductService.getCategories(),
        ProductService.getActive(0, this._pageSize)
      ]);

      this._categories  = cats;
      this._products    = result.data;
      this._totalCount  = result.count ?? result.data.length;
      this._hasMore     = this._products.length < this._totalCount;

      CatalogUI.renderFilters(this._categories, this._activeCategory);
      CatalogUI.renderGrid(this._products);
      CatalogUI.toggleLoadMore(this._hasMore);

    } catch (err) {
      console.error('Error inicial:', err);
      const grid = document.getElementById('products-grid');
      if (grid) {
        grid.innerHTML = `
          <div class="empty-catalog" style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">
            <p style="font-size: 1.1rem; color: var(--accent); margin-bottom: 0.5rem;">⚠️ No se pudo cargar el catálogo</p>
            <p style="font-size: 0.9rem;">Si estás abriendo el archivo directamente (<code>file://</code>), el navegador bloquea las solicitudes de datos por seguridad (CORS). Intenta usando un servidor local (ej. <code>npx live-server</code>).</p>
          </div>
        `;
      }
    }
  },

  async handleFilter(categoryId) {
    if (this._isLoading) return;
    this._activeCategory = categoryId;
    this._currentPage    = 0;
    this._hasMore        = true;
    this._totalCount     = 0;

    CatalogUI.showSkeletons();

    try {
      const result = await ProductService.getActiveByCategory(this._activeCategory, 0, this._pageSize);
      this._products   = result.data;
      this._totalCount = result.count ?? result.data.length;
      this._hasMore    = this._products.length < this._totalCount;

      CatalogUI.renderGrid(this._products);
      CatalogUI.toggleLoadMore(this._hasMore);
    } catch (err) {
      console.error('Error filtro:', err);
      const grid = document.getElementById('products-grid');
      if (grid) {
        grid.innerHTML = `
          <div class="empty-catalog" style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">
            <p style="font-size: 1.1rem; color: var(--accent); margin-bottom: 0.5rem;">⚠️ No se pudo filtrar el catálogo</p>
            <p style="font-size: 0.9rem;">Hubo un error de conexión con la base de datos.</p>
          </div>
        `;
      }
    }
  },

  async loadNextPage() {
    if (!this._hasMore || this._isLoading) return;
    this._isLoading = true;
    this._currentPage++;

    CatalogUI.setLoadingMore(true);

    try {
      const result = await ProductService.getActiveByCategory(this._activeCategory, this._currentPage, this._pageSize);
      this._products   = [...this._products, ...result.data];
      this._totalCount = result.count ?? this._products.length;
      this._hasMore    = this._products.length < this._totalCount;

      CatalogUI.appendGrid(result.data);
      CatalogUI.toggleLoadMore(this._hasMore);
    } catch (err) {
      console.error('Error carga más:', err);
    } finally {
      this._isLoading = false;
      CatalogUI.setLoadingMore(false);
    }
  },

  setupHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    window.addEventListener('scroll', () => {
      const isScrolled = window.scrollY > 50;
      header.classList.toggle('scrolled', isScrolled);
    });
  },
  
  // ── Gestión Menú Móvil ──
  toggleMenu() {
    const nav = document.getElementById('main-mobile-nav');
    const overlay = document.getElementById('main-nav-overlay');
    const btn = document.getElementById('main-hamburger');
    if (!nav) return;

    const isOpen = nav.classList.contains('visible');
    if (isOpen) {
      this.closeMenu();
    } else {
      nav.classList.add('visible');
      overlay?.classList.add('visible');
      btn?.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  closeMenu() {
    const nav = document.getElementById('main-mobile-nav');
    const overlay = document.getElementById('main-nav-overlay');
    const btn = document.getElementById('main-hamburger');
    nav?.classList.remove('visible');
    overlay?.classList.remove('visible');
    btn?.classList.remove('open');
    document.body.style.overflow = '';
  }
};

// Alias global para compatibilidad con el HTML
window.App = window.CatalogApp;

// Iniciar
document.addEventListener('DOMContentLoaded', () => CatalogApp.init());

// Helpers Globales para el HTML
window.changeModalQty   = (d)    => CatalogModal.changeQty(d);
window.selectSize       = (s, b) => CatalogModal.selectSize(s, b);
window.agregarAlCarrito = ()     => CatalogModal.confirmAdd();
window.closeModal       = (e)    => CatalogModal.close(e);
