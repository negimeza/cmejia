/**
 * catalog-modal.js — Lógica del modal de detalles de producto.
 */

/** Tallas genéricas por defecto para todos los productos */
const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'Única'];

window.CatalogModal = {
  _product: null,
  _size: null,

  open(product) {
    this._product = product;
    this._size = null;

    document.getElementById('modal-img').src = product.image_url || 'https://placehold.co/400x500';
    document.getElementById('modal-name').textContent = product.name;
    document.getElementById('modal-desc').textContent = product.description || '';
    document.getElementById('modal-category').textContent = product.categories?.name || 'Varios';
    const priceEl = document.getElementById('modal-price');
    if (product.price > 0) {
      priceEl.textContent = Utils.formatCurrency(product.price);
      priceEl.style.display = 'block';
    } else {
      priceEl.style.display = 'none';
    }
    
    document.getElementById('modal-qty').textContent = '1';
    
    // Generar botones de talla dinámicamente
    const sizes = product.sizes?.length ? product.sizes : DEFAULT_SIZES;
    const sizesContainer = document.getElementById('sizes-container');
    sizesContainer.innerHTML = sizes.map(s =>
      `<button class="size-btn" data-size="${s}">${s}</button>`
    ).join('');
    sizesContainer.querySelectorAll('.size-btn').forEach(btn =>
      btn.addEventListener('click', () => this.selectSize(btn.dataset.size, btn))
    );
    
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

    const qty  = parseInt(document.getElementById('modal-qty').textContent);
    const item = { ...this._product, talla: this._size };

    window.Cart?.add(item, qty);
    this.close();
  }
};
