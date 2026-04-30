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

      container.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.CatalogApp?.handleFilter(btn.dataset.id);
    });
  },

  renderFilters(categories, activeId) {
    const container = document.getElementById('cat-filters');
    if (!container) return;

    container.innerHTML = `<button class="cat-filter-btn ${activeId === 'all' ? 'active' : ''}" data-id="all">Todos</button>` +
      categories.map(cat => `
        <button class="cat-filter-btn ${activeId === cat.id ? 'active' : ''}" data-id="${cat.id}">
          ${cat.name}
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
        <img src="${p.image_url || 'https://placehold.co/400x500?text=Sin+Imagen'}" alt="${p.name}" loading="lazy"/>
      </div>
      <div class="card-info">
        <span class="cat">${p.categories?.name || 'Varios'}</span>
        <h3>${p.name}</h3>
        ${priceHTML}
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
   * Muestra u oculta el botón "Ver más" con contador opcional.
   * @param {boolean} visible
   * @param {number}  [loaded]  - Productos actualmente cargados
   * @param {number}  [total]   - Total de productos disponibles
   */
  toggleLoadMore(visible, loaded, total) {
    const container = document.getElementById('load-more-container');
    const btn       = document.getElementById('btn-load-more');
    if (container) container.style.display = visible ? 'flex' : 'none';
    if (btn && loaded != null && total != null) {
      btn.textContent = `Ver más · ${loaded} de ${total} productos`;
    } else if (btn) {
      btn.textContent = 'Ver más productos';
    }
  },

  setLoadingMore(loading) {
    const btn = document.getElementById('btn-load-more');
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading ? '<span class="spinner"></span> Cargando...' : 'Ver más productos';
  },

  showSkeletons() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = Array(8).fill(0).map(() => `<div class="card skeleton"></div>`).join('');
  }
};
