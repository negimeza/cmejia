/**
 * admin-inventory.js — Tabla de productos, búsqueda, paginación,
 *   ordenamiento por columnas, acciones masivas y memoria en URL.
 */
window.AdminInventory = {
  _products: [],
  _currentPage: 0,
  _pageSize: 15,
  _totalCount: 0,
  _searchQuery: '',
  _sortBy: 'created_at',
  _sortAsc: false,
  _selectedIds: new Set(),

  init() {
    if (this._initialized) return;
    this._initialized = true;

    // ── Búsqueda con debounce ──────────────────────────────────────
    const searchInput = document.getElementById('inventory-search');
    searchInput?.addEventListener('input', Utils.debounce(() => {
      this._searchQuery = searchInput.value.trim();
      this._currentPage = 0;
      this._selectedIds.clear();
      this._syncToURL();
      this.load();
    }, 500));

    // ── Restaurar estado desde URL ─────────────────────────────────
    this._readFromURL();

    // Sincronizar campo de búsqueda con el valor de la URL
    if (searchInput && this._searchQuery) {
      searchInput.value = this._searchQuery;
    }

    // ── Event delegation para acciones de tabla ────────────────────
    const tbody = document.getElementById('products-list');
    if (tbody) {
      tbody.addEventListener('change', (e) => {
        const cb = e.target.closest('.row-check');
        if (cb) this.toggleSelect(cb.dataset.id, cb.checked);
      });
      tbody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-tbl-edit');
        if (editBtn) {
          e.preventDefault();
          AdminEditor.open(editBtn.dataset.id);
          return;
        }
        const delBtn = e.target.closest('.btn-tbl-delete');
        if (delBtn) {
          e.preventDefault();
          this.confirmDelete(delBtn.dataset.id);
        }
      });
    }

    // Cargar datos iniciales
    this.load();
  },

  // ── URL Memory ────────────────────────────────────────────────────
  _syncToURL() {
    const params = new URLSearchParams();
    if (this._currentPage > 0)  params.set('page', this._currentPage);
    if (this._searchQuery)       params.set('q', this._searchQuery);
    if (this._sortBy !== 'created_at') params.set('sort', this._sortBy);
    if (this._sortAsc)           params.set('asc', '1');
    const newURL = params.toString()
      ? `${location.pathname}?${params}`
      : location.pathname;
    history.replaceState(null, '', newURL);
  },

  _readFromURL() {
    const params = new URLSearchParams(location.search);
    this._currentPage  = parseInt(params.get('page') || '0', 10);
    this._searchQuery  = params.get('q') || '';
    this._sortBy       = params.get('sort') || 'created_at';
    this._sortAsc      = params.get('asc') === '1';
  },

  // ── Carga de datos ────────────────────────────────────────────────
  async load() {
    const tbody = document.getElementById('products-list');
    if (!tbody) return;

    try {
      const { data, count } = await ProductService.getAll({
        page: this._currentPage,
        pageSize: this._pageSize,
        search: this._searchQuery,
        sortBy: this._sortBy,
        ascending: this._sortAsc,
      });

      this._products = data;
      this._totalCount = count;
      this._selectedIds.clear();
      this.render();
      this.renderPagination();
      this._updateBulkBar();
    } catch (err) {
      console.error('Error cargando inventario:', err);
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar datos.</td></tr>`;
    }
  },

  // ── Render de la tabla ────────────────────────────────────────────
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
      <tr class="${this._selectedIds.has(p.id) ? 'row-selected' : ''}">
        <td class="td-check">
          <input type="checkbox" class="row-check" data-id="${p.id}"
            ${this._selectedIds.has(p.id) ? 'checked' : ''}>
        </td>
        <td><img src="${Utils.escapeAttr(p.image_url || 'https://placehold.co/48x48/1c1c2e/f472b6?text=?')}" class="p-thumb" alt="${Utils.escapeAttr(p.name)}" loading="lazy" decoding="async"></td>
        <td>
          <strong class="text-primary">${Utils.escapeHTML(p.name)}</strong>
        </td>
        <td class="text-muted">${Utils.escapeHTML(p.categories?.name || '—')}</td>
        <td class="text-bold text-accent">${fmt.format(p.price)}</td>
        <td>
          <span class="status-badge ${p.active ? 'status-active' : 'status-inactive'}">
            <span class="dot"></span> ${p.active ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <div class="tbl-actions">
            <button class="btn-tbl-edit" data-id="${p.id}" title="Editar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-tbl-delete" data-id="${p.id}" title="Eliminar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  // ── Paginación ────────────────────────────────────────────────────
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
    this._syncToURL();
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // ── Ordenamiento por columnas ─────────────────────────────────────
  handleSort(column) {
    if (this._sortBy === column) {
      this._sortAsc = !this._sortAsc;  // invertir dirección
    } else {
      this._sortBy  = column;
      this._sortAsc = true;
    }
    this._currentPage = 0;
    this._syncToURL();
    this.load();
    this._updateSortHeaders();
  },

  _updateSortHeaders() {
    document.querySelectorAll('[data-sort]').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.sort === this._sortBy) {
        th.classList.add(this._sortAsc ? 'sort-asc' : 'sort-desc');
      }
    });
  },

  // ── Acciones Masivas (Bulk) ───────────────────────────────────────
  toggleSelect(id, checked) {
    if (checked) {
      this._selectedIds.add(id);
    } else {
      this._selectedIds.delete(id);
    }
    // Actualizar highlight visual de la fila
    const row = document.querySelector(`input.row-check[data-id="${id}"]`)?.closest('tr');
    if (row) row.classList.toggle('row-selected', checked);

    this._updateBulkBar();
  },

  toggleSelectAll(checked) {
    this._selectedIds.clear();
    if (checked) {
      this._products.forEach(p => this._selectedIds.add(p.id));
    }
    // Actualizar todos los checkboxes y filas
    document.querySelectorAll('.row-check').forEach(cb => {
      cb.checked = checked;
      const row = cb.closest('tr');
      if (row) row.classList.toggle('row-selected', checked);
    });
    this._updateBulkBar();
  },

  _updateBulkBar() {
    const bar   = document.getElementById('bulk-action-bar');
    const count = document.getElementById('bulk-count');
    const allCb = document.getElementById('check-all');
    if (!bar) return;

    const n = this._selectedIds.size;
    bar.classList.toggle('visible', n > 0);
    if (count) count.textContent = `${n} producto${n !== 1 ? 's' : ''} seleccionado${n !== 1 ? 's' : ''}`;

    // Estado del checkbox "seleccionar todo"
    if (allCb) {
      allCb.checked       = n === this._products.length && n > 0;
      allCb.indeterminate = n > 0 && n < this._products.length;
    }
  },

  async bulkHide() {
    if (!this._selectedIds.size) return;
    const ids = [...this._selectedIds];
    const confirmed = await confirmAsync(
      '¿Ocultar productos?',
      `Vas a ocultar ${ids.length} producto(s) seleccionados.`
    );
    if (!confirmed) return;
    try {
      const results = await Utils.runInChunks(ids, 8, id => ProductService.update(id, { active: false }));
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        showToast(`⚠️ ${ids.length - failed} ocultados, ${failed} error(es)`, true);
      } else {
        showToast(`👁️ ${ids.length} producto(s) ocultados`);
      }
      this.load();
    } catch (err) {
      showToast('❌ Error al ocultar: ' + err.message, true);
    }
  },

  async bulkDelete() {
    if (!this._selectedIds.size) return;
    const ids = [...this._selectedIds];
    const confirmed = await confirmAsync(
      '¿Eliminar productos?',
      `⚠️ Vas a eliminar ${ids.length} producto(s) permanentemente. Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;
    try {
      const results = await Utils.runInChunks(ids, 8, id => ProductService.delete(id));
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        showToast(`⚠️ ${ids.length - failed} eliminados, ${failed} error(es)`, true);
      } else {
        showToast(`🗑️ ${ids.length} producto(s) eliminados`);
      }
      this.load();
    } catch (err) {
      showToast('❌ Error al eliminar: ' + err.message, true);
    }
  },

  // ── Eliminar individual ───────────────────────────────────────────
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

    if (typeof showConfirm !== 'function') {
      alert('Error crítico: La función showConfirm no está disponible.');
      return;
    }

    showConfirm({
      title: '¿Eliminar producto?',
      message: `Vas a eliminar "${p.name}" del catálogo definitivamente.`,
      onConfirm: async () => {
        try {
          await ProductService.delete(id);
          showToast('🗑️ Producto eliminado');
          setTimeout(() => this.load(), 300);
        } catch (err) {
          showToast('❌ Error: ' + err.message, true);
        }
      }
    });
  }
};
