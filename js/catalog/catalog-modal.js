/**
 * catalog-modal.js — Lógica del modal de detalles de producto.
 */
window.CatalogModal = {
  _product: null,
  _size: null,

  open(product) {
    this._product = product;
    this._size = null;

    document.getElementById('modal-img').src = product.image_url || 'https://via.placeholder.com/400x500';
    document.getElementById('modal-name').textContent = product.name;
    document.getElementById('modal-desc').textContent = product.description || '';
    document.getElementById('modal-category').textContent = product.categories?.name || 'Varios';
    document.getElementById('modal-price').textContent = Utils.formatCurrency(product.price);
    
    document.getElementById('modal-qty').textContent = '1';
    
    // Reset tallas
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById('overlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  close() {
    document.getElementById('overlay')?.classList.remove('open');
    document.body.style.overflow = '';
  },

  changeQty(dir) {
    const el = document.getElementById('modal-qty');
    let qty = parseInt(el.textContent) + dir;
    if (qty < 1) qty = 1;
    el.textContent = qty;
  },

  selectSize(size, btn) {
    this._size = size;
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  },

  confirmAdd() {
    if (!this._size) {
      const container = document.querySelector('.modal-sizes');
      container?.classList.add('shake');
      setTimeout(() => container?.classList.remove('shake'), 500);
      return;
    }

    const qty = parseInt(document.getElementById('modal-qty').textContent);
    const item = { ...this._product, talla: this._size };

    for(let i=0; i<qty; i++) {
      window.Cart?.add(item);
    }
    this.close();
  }
};
