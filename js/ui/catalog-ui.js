/**
 * catalog-ui.js — Gestión de la cuadrícula de productos y filtros.
 * Recibe datos procesados y callbacks del orquestador (app.js).
 */

let _onProductClick;
let _onAddClick;

window.CatalogUI = {
  
  /**
   * Inicializa la interfaz del catálogo.
   */
  init({ onProductClick, onAddClick }) {
    _onProductClick = onProductClick;
    _onAddClick     = onAddClick;
  },

  /**
   * Renderiza los botones de categorías en el DOM.
   */
  renderFilters(categories, activeId, onFilterClick) {
    const container = document.getElementById('cat-filters');
    if (!container) return;

    // Mantener el botón "Todos"
    container.innerHTML = `<button class="cat-filter-btn ${activeId === 'all' ? 'active' : ''}" data-id="all">Todos</button>`;
    
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `cat-filter-btn ${activeId === cat.id ? 'active' : ''}`;
      btn.textContent = cat.name;
      btn.dataset.id = cat.id;
      container.appendChild(btn);
    });

    // Agregar eventos
    container.querySelectorAll('.cat-filter-btn').forEach(btn => {
      btn.onclick = () => {
        container.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        onFilterClick(btn.dataset.id);
      };
    });
  },

  /**
   * Renderiza la cuadrícula de productos.
   */
  renderGrid(products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (products.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 4rem 2rem; color: #aaa;">
        <p>No se encontraron productos.</p>
      </div>`;
      return;
    }

    products.forEach((p, i) => {
      const card = document.createElement('div');
      card.className = 'card';
      // Animación escalonada
      card.style.animationDelay = `${i * 0.05}s`;
      
      card.innerHTML = `
        <div class="card-img-wrap">
          <button class="btn-add-cart-fast" title="Agregar rápido">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          <img src="${p.src || 'https://via.placeholder.com/400x500?text=Sin+Imagen'}" alt="${p.name}" loading="lazy"/>
        </div>
        <div class="card-info">
          <span class="cat">${p.category}</span>
          <h3>${p.name}</h3>
          <span class="price">${Number(p.price) === 0 ? '$-' : `$${Number(p.price).toLocaleString('es-CO')}`}</span>
        </div>
      `;

      // Eventos
      card.onclick = () => _onProductClick(p);
      card.querySelector('.btn-add-cart-fast').onclick = (e) => {
        e.stopPropagation();
        _onAddClick(p);
      };

      grid.appendChild(card);
    });
  },

  /**
   * Muestra skeletons de carga en la cuadrícula.
   */
  showSkeletons() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const s = document.createElement('div');
      s.className = 'card skeleton';
      s.style.height = '350px';
      grid.appendChild(s);
    }
  }
};
