/**
 * admin-inventory.js — Tabla de productos, búsqueda y paginación.
 */
window.AdminInventory = {
  _products: [],
  _currentPage: 0,
  _pageSize: 15,
  _totalCount: 0,
  _searchQuery: '',

  init() {
    const searchInput = document.getElementById('inventory-search');
    searchInput?.addEventListener('input', Utils.debounce(() => {
      this._searchQuery = searchInput.value;
      this._currentPage = 0;
      this.load();
    }, 500));
  },

  async load() {
    const tbody = document.getElementById('products-list');
    if (!tbody) return;

    // Loading state opcional
    try {
      const { data, count } = await ProductService.getAll({
        page: this._currentPage,
        pageSize: this._pageSize,
        search: this._searchQuery
      });

      this._products = data;
      this._totalCount = count;
      this.render();
      this.renderPagination();
    } catch (err) {
      console.error('Error cargando inventario:', err);
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar datos.</td></tr>`;
    }
  },

  render() {
    const tbody = document.getElementById('products-list');
    const empty = document.getElementById('inventory-empty');
    
    if (!this._products.length) {
      tbody.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');

    const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

    tbody.innerHTML = this._products.map(p => `
      <tr>
        <td><img src="${p.image_url || 'https://placehold.co/48x48/1c1c2e/f472b6?text=?'}" class="p-thumb" alt="${p.name}"></td>
        <td>
          <strong class="text-primary">${p.name}</strong><br>
          <small class="text-dim">${p.description?.slice(0, 45) || '—'}${p.description?.length > 45 ? '...' : ''}</small>
        </td>
        <td class="text-muted">${p.categories?.name || '—'}</td>
        <td class="text-bold text-accent">${fmt.format(p.price)}</td>
        <td>
          <span class="status-badge ${p.active ? 'status-active' : 'status-inactive'}">
            ● ${p.active ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <div class="tbl-actions">
            <button class="btn-tbl-edit" onclick="AdminEditor.open('${p.id}')" title="Editar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-tbl-delete" onclick="AdminInventory.confirmDelete('${p.id}')" title="Eliminar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  renderPagination() {
    const container = document.getElementById('inventory-pagination');
    if (!container) return;

    const totalPages = Math.ceil(this._totalCount / this._pageSize);
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="pagination">
        <button ${this._currentPage === 0 ? 'disabled' : ''} onclick="AdminInventory.changePage(${this._currentPage - 1})">Anterior</button>
        <span>Página ${this._currentPage + 1} de ${totalPages}</span>
        <button ${this._currentPage >= totalPages - 1 ? 'disabled' : ''} onclick="AdminInventory.changePage(${this._currentPage + 1})">Siguiente</button>
      </div>
    `;
  },

  changePage(newPage) {
    this._currentPage = newPage;
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  confirmDelete(id) {
    console.log('[DELETE] Iniciando proceso para ID:', id);
    const p = this._products.find(x => x.id === id);
    if (!p) {
      console.error('[DELETE] Producto no encontrado en memoria. Reintentando carga de productos...');
      this.load().then(() => this.confirmDelete(id));
      return;
    }

    console.log('[DELETE] Producto encontrado:', p.name);
    
    if (typeof showConfirm !== 'function') {
      alert('Error crítico: La función showConfirm no está disponible.');
      return;
    }

    showConfirm({
      title: '¿Eliminar producto?',
      message: `Vas a eliminar "${p.name}" del catálogo definitivamente.`,
      onConfirm: async () => {
        console.log('[DELETE] Confirmación recibida. Llamando a ProductService...');
        try {
          await ProductService.delete(id);
          console.log('[DELETE] ProductService reporta éxito');
          showToast('🗑️ Producto eliminado');
          
          // Forzamos un pequeño delay antes de recargar para asegurar que Supabase procesó el cambio
          setTimeout(() => {
            console.log('[DELETE] Recargando inventario...');
            AdminInventory.load();
          }, 300);
        } catch (err) {
          console.error('[DELETE] Error en el proceso:', err);
          showToast('❌ Error: ' + err.message, true);
        }
      }
    });
  }
};
