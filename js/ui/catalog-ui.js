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
    card.style.animationDelay = `${index * 0.05}s`;
    
    card.innerHTML = `
      <div class="card-img-wrap">
        <button class="btn-add-cart-fast" title="Agregar rápido">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <img src="${p.image_url || 'https://via.placeholder.com/400x500?text=Sin+Imagen'}" alt="${p.name}" loading="lazy"/>
      </div>
      <div class="card-info">
        <span class="cat">${p.categories?.name || 'Varios'}</span>
        <h3>${p.name}</h3>
        <span class="price">${Utils.formatCurrency(p.price)}</span>
      </div>
    `;

    card.onclick = () => window.CatalogModal?.open(p);
    card.querySelector('.btn-add-cart-fast').onclick = (e) => {
      e.stopPropagation();
      window.Cart?.add(p);
    };

    return card;
  },

  toggleLoadMore(visible) {
    const container = document.getElementById('load-more-container');
    if (container) container.style.display = visible ? 'flex' : 'none';
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
    grid.innerHTML = Array(8).fill(0).map(() => `<div class="card skeleton" style="height: 350px;"></div>`).join('');
  }
};
