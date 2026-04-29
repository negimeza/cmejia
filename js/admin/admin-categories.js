/**
 * admin-categories.js — Gestión de etiquetas/categorías.
 */
window.AdminCategories = {
  _list: [],

  init() {
    document.getElementById('category-form')?.addEventListener('submit', (e) => this.handleCreate(e));
  },

  async load() {
    try {
      this._list = await CategoryService.getAll();
      this.render();
      this.populateSelects();
    } catch (err) {
      console.error('Error categorías:', err);
    }
  },

  render() {
    const list = document.getElementById('categories-list');
    const badge = document.getElementById('cat-count-badge');
    if (!list) return;

    badge.textContent = this._list.length;

    if (!this._list.length) {
      list.innerHTML = `<div class="empty-state"><span>🏷️</span><p>No hay categorías.</p></div>`;
      return;
    }

    list.innerHTML = this._list.map(c => `
      <div class="cat-item">
        <div class="cat-item-info">
          <div class="cat-dot"></div>
          <div>
            <div class="cat-item-name">${c.name}</div>
            <div class="cat-item-date">Creada: ${new Date(c.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        <button class="cat-item-delete" onclick="AdminCategories.confirmDelete('${c.id}', '${c.name.replace(/'/g, "\\'")}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    `).join('');
  },

  populateSelects() {
    const sel = document.getElementById('p-category');
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccionar categoría...</option>' +
      this._list.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  },

  async handleCreate(e) {
    e.preventDefault();
    const input = document.getElementById('cat-name');
    const name = input.value.trim();
    if (!name) return;

    try {
      await CategoryService.create(name);
      showToast('🏷️ Categoría creada');
      input.value = '';
      this.load();
    } catch (err) {
      showToast('❌ Error: ' + err.message, true);
    }
  },

  confirmDelete(id, name) {
    showConfirm({
      title: '¿Eliminar categoría?',
      message: `Vas a eliminar "${name}". Los productos quedarán sin clasificación.`,
      onConfirm: async () => {
        try {
          await CategoryService.delete(id);
          showToast('🗑️ Categoría eliminada');
          this.load();
        } catch (err) {
          showToast('❌ No se puede eliminar (puede tener productos)', true);
        }
      }
    });
  }
};
