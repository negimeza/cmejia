/**
 * cart.js — Carrito con persistencia en LocalStorage.
 * Los items se agrupan por id + talla para evitar duplicados.
 */
window.Cart = {
  _items: JSON.parse(localStorage.getItem('lupe_cart')) || [],

  // ── Getters ──────────────────────────────────────────────────

  get totalQty() {
    return this._items.reduce((sum, i) => sum + (i.qty || 1), 0);
  },

  hasProduct(id) {
    return this._items.some(i => i.id === id);
  },

  // ── Operaciones ──────────────────────────────────────────────

  init() {
    this.render();
  },

  /**
   * Agrega un producto. Si ya existe con la misma talla, incrementa qty.
   * @param {object} product  - Producto a agregar
   * @param {number} [qty=1]  - Cantidad a agregar (para el modal con selector)
   */
  add(product, qty = 1) {
    const existing = this._items.find(
      i => i.id === product.id && i.talla === product.talla
    );

    if (existing) {
      existing.qty = (existing.qty || 1) + qty;
    } else {
      this._items.push({ ...product, qty });
    }

    this.persist();
    this.render();
    this.animate();
    this._notifyCardState(product.id, true);
    showProductToast(product);
  },

  /** Incrementa o decrementa la cantidad de un item por índice. */
  changeQty(index, dir) {
    const item = this._items[index];
    if (!item) return;

    const newQty = (item.qty || 1) + dir;
    if (newQty < 1) {
      this.remove(index);
      return;
    }
    item.qty = newQty;
    this.persist();
    this.render();
  },

  /** Elimina un item. Si qty > 1, primero decrementa. */
  remove(index) {
    const item = this._items[index];
    if (!item) return;

    const productId = item.id;
    this._items.splice(index, 1);
    this.persist();
    this.render();

    // Si ya no quedan unidades del mismo producto, actualiza la card
    if (!this.hasProduct(productId)) {
      this._notifyCardState(productId, false);
    }
  },

  clear() {
    const btn = document.querySelector('.btn-clear-cart');
    if (!btn) return;

    if (btn.classList.contains('pending')) {
      this._items = [];
      this.persist();
      this.render();
      btn.classList.remove('pending');
      btn.innerHTML = '🗑 Vaciar carrito';
      // Limpiar estado visual de todas las cards
      document.querySelectorAll('.card.in-cart').forEach(c => c.classList.remove('in-cart'));
      document.querySelectorAll('.btn-add-cart-fast.in-cart').forEach(b => b.classList.remove('in-cart'));
      return;
    }

    btn.classList.add('pending');
    btn.innerHTML = '⚠️ ¿Seguro? Click aquí';
    setTimeout(() => {
      btn.classList.remove('pending');
      btn.innerHTML = '🗑 Vaciar carrito';
    }, 4000);
  },

  persist() {
    localStorage.setItem('lupe_cart', JSON.stringify(this._items));
  },

  // ── Render ───────────────────────────────────────────────────

  render() {
    const list     = document.getElementById('cart-list');
    const count    = document.getElementById('cart-count');
    const totalQty = document.getElementById('cart-total-qty');
    const subtotal = document.getElementById('cart-subtotal');
    const total    = document.getElementById('cart-total');
    const dot      = document.getElementById('cart-dot');

    const qty = this.totalQty;
    if (count)    count.textContent    = qty;
    if (totalQty) totalQty.textContent = `${qty} prendas`;
    if (dot)      dot.classList.toggle('show', qty > 0);

    if (!list) return;

    if (!this._items.length) {
      list.innerHTML = `
        <div class="cart-empty">
          <span class="ce-icon">🛍️</span>
          <p>Bolsa vacía.<br>Explora la colección para elegir.</p>
        </div>`;
      if (subtotal) subtotal.textContent = '$0';
      if (total)    total.textContent    = '$0';
      document.querySelector('.btn-send-wa')?.setAttribute('disabled', 'true');
      return;
    }

    document.querySelector('.btn-send-wa')?.removeAttribute('disabled');

    let sum = 0;
    list.innerHTML = this._items.map((p, i) => {
      const itemQty   = p.qty || 1;
      const itemTotal = Number(p.price) * itemQty;
      sum += itemTotal;
      return `
        <div class="cart-item">
          <img src="${p.image_url || 'https://placehold.co/100'}" alt="${p.name}"/>
          <div class="cart-item-info">
            <h4>${p.name}</h4>
            <p>${p.categories?.name || 'Varios'}${p.talla ? ` · Talla: <b>${p.talla}</b>` : ''}</p>
            <div class="cart-item-qty-row">
              <div class="cart-qty-control">
                <button onclick="Cart.changeQty(${i}, -1)" aria-label="Disminuir">−</button>
                <span>${itemQty}</span>
                <button onclick="Cart.changeQty(${i}, 1)" aria-label="Aumentar">+</button>
              </div>
              <span class="cart-remove" onclick="Cart.remove(${i})">Eliminar</span>
            </div>
          </div>
          <div class="cart-item-price">${Utils.formatCurrency(itemTotal)}</div>
        </div>
      `;
    }).join('');

    const formattedSum = Utils.formatCurrency(sum);
    if (subtotal) subtotal.textContent = formattedSum;
    if (total)    total.textContent    = formattedSum;
  },

  // ── Pedido WA ────────────────────────────────────────────────

  sendOrder() {
    if (!this._items.length) return;

    const cfg   = ConfigService.get();
    const waNum = cfg.waNumber || '573207101121';

    let msg      = '¡Hola! 👋 Me interesan estas prendas:\n\n';
    let totalArt = 0;

    this._items.forEach((p, i) => {
      const qty = p.qty || 1;
      totalArt += qty;
      const talla = p.talla ? ` (Talla: ${p.talla})` : '';
      msg += `${i + 1}. *${p.name}*${talla} — x${qty} — ${Utils.formatCurrency(Number(p.price) * qty)}\n`;
    });

    msg += `\nTotal artículos: ${totalArt}`;
    window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_blank');
  },

  // ── Helpers internos ─────────────────────────────────────────

  animate() {
    const navBtn = document.getElementById('cart-btn-nav');
    if (navBtn) {
      navBtn.style.transform = 'scale(1.2)';
      setTimeout(() => navBtn.style.transform = '', 200);
    }
  },

  toggle() {
    document.getElementById('cart-panel')?.classList.toggle('open');
    document.getElementById('cart-overlay')?.classList.toggle('open');
  },

  _notifyCardState(productId, inCart) {
    window.CatalogUI?.updateCardState(productId, inCart);
  }
};

// Aliases para compatibilidad HTML
window.addToCart        = (p)   => Cart.add(p);
window.removeFromCart   = (i)   => Cart.remove(i);
window.toggleCart       = ()    => Cart.toggle();
window.confirmClearCart = ()    => Cart.clear();
window.enviarPedidoWA   = ()    => Cart.sendOrder();
window.renderCart       = ()    => Cart.render();
