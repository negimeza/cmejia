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
  _isLoading: false,

  init() {
    CatalogConfig.apply();
    CatalogUI.init();
    
    // Header Effect
    this.setupHeaderScroll();

    // Eventos
    document.getElementById('btn-load-more')?.addEventListener('click', () => this.loadNextPage());
    
    // Carga inicial
    this.loadInitialData();
    
    // Renderizar carrito inicial
    if (window.Cart) Cart.render();
  },

  async loadInitialData() {
    CatalogUI.showSkeletons();

    try {
      const [cats, productsRaw] = await Promise.all([
        ProductService.getCategories(),
        ProductService.getActive(0, this._pageSize)
      ]);

      this._categories = cats;
      this._products   = productsRaw;
      this._hasMore    = productsRaw.length === this._pageSize;

      CatalogUI.renderFilters(this._categories, this._activeCategory);
      CatalogUI.renderGrid(this._products);
      CatalogUI.toggleLoadMore(this._hasMore);

    } catch (err) {
      console.error('Error inicial:', err);
    }
  },

  async handleFilter(categoryId) {
    if (this._isLoading) return;
    this._activeCategory = categoryId;
    this._currentPage = 0;
    this._hasMore = true;
    
    CatalogUI.showSkeletons();

    try {
      const raw = await ProductService.getActiveByCategory(this._activeCategory, 0, this._pageSize);
      this._products = raw;
      this._hasMore  = raw.length === this._pageSize;
      
      CatalogUI.renderGrid(this._products);
      CatalogUI.toggleLoadMore(this._hasMore);
    } catch (err) {
      console.error("Error filtro:", err);
    }
  },

  async loadNextPage() {
    if (!this._hasMore || this._isLoading) return;
    this._isLoading = true;
    this._currentPage++;

    CatalogUI.setLoadingMore(true);

    try {
      const raw = await ProductService.getActiveByCategory(this._activeCategory, this._currentPage, this._pageSize);
      this._products = [...this._products, ...raw];
      this._hasMore  = raw.length === this._pageSize;

      CatalogUI.appendGrid(raw);
      CatalogUI.toggleLoadMore(this._hasMore);
    } catch (err) {
      console.error("Error carga más:", err);
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
      header.style.padding = isScrolled ? '0.8rem 0' : '1.2rem 0';
      header.style.background = isScrolled ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)';
    });
  }
};

// Iniciar
document.addEventListener('DOMContentLoaded', () => CatalogApp.init());

// Helpers Globales para el HTML
window.changeModalQty  = (d)   => CatalogModal.changeQty(d);
window.selectSize      = (s, b) => CatalogModal.selectSize(s, b);
window.agregarAlCarrito = ()    => CatalogModal.confirmAdd();
window.closeModal      = (e)   => CatalogModal.close(e);
