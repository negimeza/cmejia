/**
 * catalog-ui.js — Gestión de la cuadrícula de productos y filtros.
 */
window.CatalogUI = {

  init() {
    // Delegación de eventos para filtros (más eficiente)
    const container = document.getElementById('cat-filters');
    container?.addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-filter-btn');
      if (!btn) return;

      container.querySelectorAll('.cat-filter-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      window.CatalogApp?.handleFilter(btn.dataset.id);
    });
  },

  renderFilters(categories, activeId) {
    const container = document.getElementById('cat-filters');
    if (!container) return;

    container.innerHTML = `<button class="cat-filter-btn ${activeId === 'all' ? 'active' : ''}" data-id="all" aria-pressed="${activeId === 'all'}">Todos</button>` +
      categories.map(cat => `
        <button class="cat-filter-btn ${activeId === cat.id ? 'active' : ''}" data-id="${Utils.escapeAttr(cat.id)}" aria-pressed="${activeId === cat.id}">
          ${Utils.escapeHTML(cat.name)}
        </button>
      `).join('');
  },

  renderGrid(products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.innerHTML = '';
    if (!products.length) {
      grid.innerHTML = `<div class="empty-catalog"><p>No se encontraron productos.</p></div>`;
      return;
    }

    products.forEach((p, i) => grid.appendChild(this._createCard(p, i)));
  },

  appendGrid(products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    const currentCount = grid.querySelectorAll('.card').length;
    products.forEach((p, i) => grid.appendChild(this._createCard(p, currentCount + i)));
  },

  _createCard(p, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.productId = p.id;
    card.style.animationDelay = `${index * 0.05}s`;

    const inCart = window.Cart?.hasProduct(p.id) ?? false;

    // Precio con descuento (campo opcional, sin cambio de BD)
    const hasDiscount = p.original_price && Number(p.original_price) > Number(p.price);
    const discountPct = hasDiscount
      ? Math.round((1 - Number(p.price) / Number(p.original_price)) * 100)
      : 0;

    let priceHTML = '';
    if (p.price > 0) {
      priceHTML = hasDiscount
        ? `<div class="price-group">
             <span class="price-original">${Utils.formatCurrency(p.original_price)}</span>
             <span class="price">${Utils.formatCurrency(p.price)}</span>
             <span class="discount-badge">${discountPct}% OFF</span>
           </div>`
        : `<span class="price">${Utils.formatCurrency(p.price)}</span>`;
    }

    card.innerHTML = `
      <div class="card-img-wrap">
        <button class="btn-add-cart-fast${inCart ? ' in-cart' : ''}" title="${inCart ? 'En tu carrito' : 'Agregar rápido'}">
          ${inCart
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
            : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`
          }
        </button>
        <img data-src="${Utils.escapeAttr(p.image_url || 'https://placehold.co/400x500?text=Sin+Imagen')}"
             src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'%3E%3Crect fill='%23f0f0f0' width='400' height='500'/%3E%3C/svg%3E"
             alt="${Utils.escapeAttr(p.name)}"
             loading="lazy"
             decoding="async"/>
      </div>
      <div class="card-info">
        <div class="card-top">
          <span class="cat">${Utils.escapeHTML(p.categories?.name || 'Varios')}</span>
          ${priceHTML}
        </div>
        <h3>${Utils.escapeHTML(p.name)}</h3>
      </div>
    `;

    card.onclick = () => window.CatalogModal?.open(p);
    card.querySelector('.btn-add-cart-fast').onclick = (e) => {
      e.stopPropagation();
      window.Cart?.add(p);
    };

    return card;
  },

  /**
   * Actualiza el estado visual del botón de agregar en la card del producto.
   * @param {string}  productId
   * @param {boolean} inCart
   */
  updateCardState(productId, inCart) {
    const card = document.querySelector(`.card[data-product-id="${productId}"]`);
    if (!card) return;

    const btn = card.querySelector('.btn-add-cart-fast');
    if (!btn) return;

    btn.classList.toggle('in-cart', inCart);
    btn.title = inCart ? 'En tu carrito' : 'Agregar rápido';
    btn.innerHTML = inCart
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`;
  },

  /**
   * Activa/desactiva el centinela del IntersectionObserver.
   * Cuando hasMore=false, el centinela se oculta y no se disparan más cargas.
   * @param {boolean} hasMore
   */
  toggleLoadMore(hasMore) {
    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) sentinel.style.visibility = hasMore ? 'visible' : 'hidden';
  },

  /**
   * Muestra u oculta el spinner de "cargando más".
   * @param {boolean} loading
   */
  setLoadingMore(loading) {
    const spinner = document.getElementById('infinite-spinner');
    if (!spinner) return;
    spinner.classList.toggle('hidden', !loading);
  },

  showSkeletons() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = Array(8).fill(0).map(() => `<div class="card skeleton"></div>`).join('');
  }
};
