/**
 * admin-editor.js — Formularios de creación y edición de productos.
 */
window.AdminEditor = {
  _editingId: null,
  _currentImageUrl: null,
  _releaseTrap: null,
  _previouslyFocused: null,
  _escapeHandler: null,

  init() {
    const form = document.getElementById('product-form');
    form?.addEventListener('submit', (e) => this.handleCreate(e));

    // Listener para actualizar el badge del modal de edición
    const editCat = document.getElementById('edit-category');
    editCat?.addEventListener('change', () => {
      const badge = document.getElementById('edit-modal-badge');
      if (badge) {
        badge.textContent = editCat.options[editCat.selectedIndex]?.text || 'Sin categoría';
      }
    });
  },

  reset() {
    document.getElementById('product-form')?.reset();
    window.imageUpload?.reset();
    const activeCheck = document.getElementById('p-active');
    if (activeCheck) activeCheck.checked = true;
    const label = document.getElementById('toggle-label-text');
    if (label) label.textContent = 'Visible';
  },

  async handleCreate(e) {
    e.preventDefault();

    const csrfToken = document.getElementById('csrf_token_product')?.value;
    if (!Utils.validateCSRFToken(csrfToken)) {
      showToast('❌ Error de seguridad: Token inválido', true);
      return;
    }

    const btn = document.getElementById('btn-save');
    btn.disabled = true;
    btn.innerHTML = `<svg width="18" height="18" class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Guardando...`;

    try {
      const priceRaw = document.getElementById('p-price').value.trim();
      const priceVal = Utils.parseNumberFromDots(priceRaw);
      if (Number.isNaN(priceVal)) throw new Error('El precio debe ser un número válido.');
      if (priceVal < 0) throw new Error('El precio no puede ser negativo.');

      const data = {
        name:        document.getElementById('p-name').value.trim(),
        description: document.getElementById('p-desc').value.trim(),
        price:       priceVal,
        category_id: document.getElementById('p-category').value,
        active:      document.getElementById('p-active').checked
      };

      if (!data.name) throw new Error('El nombre es obligatorio.');
      if (!data.category_id) throw new Error('Selecciona una categoría.');

      const file = window.imageUpload?.getFile();
      data.image_url = file ? await StorageService.uploadImage(file) : null;

      await ProductService.create(data);
      showToast('✅ Producto guardado');
      this.reset();
      window.AdminInventory?.load();
    } catch (err) {
      showToast('❌ ' + err.message, true);
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Guardar`;
    }
  },

  open(productId) {
    const p = window.AdminInventory._products.find(x => x.id === productId);
    if (!p) return;

    this._editingId = p.id;
    this._currentImageUrl = p.image_url;

    document.getElementById('edit-name').value   = p.name;
    document.getElementById('edit-desc').value   = p.description;
    document.getElementById('edit-price').value  = Utils.formatNumberWithDots(p.price);
    document.getElementById('edit-active').checked = p.active;

    // Categorías — usar variable en memoria o fallback a #p-category
    const catList = window.AdminCategories?._list || [];
    const sel = document.getElementById('edit-category');
    if (catList.length) {
      sel.innerHTML = '<option value="">Sin categoría</option>' +
        catList.map(c => `<option value="${Utils.escapeAttr(c.id)}" ${c.id === p.category_id ? 'selected' : ''}>${Utils.escapeHTML(c.name)}</option>`).join('');
    } else {
      sel.innerHTML = '<option value="">Sin categoría</option>' +
        Array.from(document.getElementById('p-category').options)
          .filter(o => o.value)
          .map(o => `<option value="${Utils.escapeAttr(o.value)}" ${o.value === p.category_id ? 'selected' : ''}>${Utils.escapeHTML(o.text)}</option>`).join('');
    }

    // Actualizar badge de categoría
    const badge = document.getElementById('edit-modal-badge');
    if (badge) {
      badge.textContent = sel.options[sel.selectedIndex]?.text || 'Sin categoría';
    }

    // Imagen
    this.updatePreview(p.image_url);
    const modalOverlay = document.getElementById('edit-modal-overlay');
    const modalBox = modalOverlay.querySelector('.edit-modal-box');
    this._previouslyFocused = document.activeElement;
    modalOverlay.classList.remove('hidden');
    modalOverlay.setAttribute('aria-hidden', 'false');
    Utils.lockScroll();
    this._releaseTrap = Utils.trapFocus(modalBox || modalOverlay);
    this._escapeHandler = (e) => { if (e.key === 'Escape') this.close(); };
    document.addEventListener('keydown', this._escapeHandler);
    Utils.focusFirst(modalBox || modalOverlay);
  },

  updatePreview(url) {
    const img = document.getElementById('edit-img-preview');
    const placeholder = document.getElementById('edit-img-placeholder');
    if (url) {
      img.src = url;
      img.classList.remove('hidden');
      img.style.display = 'block';
      placeholder.classList.add('hidden');
      placeholder.style.display = 'none';
    } else {
      img.classList.add('hidden');
      img.style.display = 'none';
      placeholder.classList.remove('hidden');
      placeholder.style.display = 'flex';
    }
  },

  async handleImageChange(input) {
    const file = input.files[0];
    if (!file) return;

    try {
      showToast('Subiendo nueva imagen...');
      const url = await StorageService.uploadImage(file);
      this._currentImageUrl = url;
      this.updatePreview(url);
      showToast('✅ Imagen lista');
    } catch (err) {
      showToast('❌ Error al subir', true);
    } finally {
      input.value = '';
    }
  },

  async saveEdit() {
    if (!this._editingId) return;

    const csrfToken = document.getElementById('csrf_token_product')?.value;
    if (!Utils.validateCSRFToken(csrfToken)) {
      showToast('❌ Error de seguridad: Token inválido', true);
      return;
    }

    const btn = document.getElementById('btn-edit-save');
    btn.disabled = true;

    try {
      const priceRaw = document.getElementById('edit-price').value.trim();
      const priceVal = Utils.parseNumberFromDots(priceRaw);
      if (Number.isNaN(priceVal)) throw new Error('El precio debe ser un número válido.');
      if (priceVal < 0) throw new Error('El precio no puede ser negativo.');

      const updates = {
        name:        document.getElementById('edit-name').value.trim(),
        description: document.getElementById('edit-desc').value.trim(),
        price:       priceVal,
        category_id: document.getElementById('edit-category').value,
        active:      document.getElementById('edit-active').checked,
        image_url:   this._currentImageUrl
      };

      await ProductService.update(this._editingId, updates);
      showToast('✅ Cambios guardados');
      this.close();
      window.AdminInventory?.load();
    } catch (err) {
      showToast('❌ Error al guardar', true);
    } finally {
      btn.disabled = false;
    }
  },

  close() {
    const modalOverlay = document.getElementById('edit-modal-overlay');
    if (!modalOverlay || modalOverlay.classList.contains('hidden')) return;
    modalOverlay.classList.add('hidden');
    modalOverlay.setAttribute('aria-hidden', 'true');
    Utils.unlockScroll();
    this._releaseTrap?.();
    this._releaseTrap = null;
    if (this._escapeHandler) {
      document.removeEventListener('keydown', this._escapeHandler);
      this._escapeHandler = null;
    }
    this._previouslyFocused?.focus?.();
    this._previouslyFocused = null;
    this._editingId = null;
  }
};
