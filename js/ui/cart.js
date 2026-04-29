/**
 * cart.js — Carrito con persistencia en LocalStorage.
 */
window.Cart = {
  _items: JSON.parse(localStorage.getItem('lupe_cart')) || [],

  init() {
    this.render();
  },

  add(product) {
    this._items.push(product);
    this.persist();
    this.render();
    this.animate();
  },

  remove(index) {
    this._items.splice(index, 1);
    this.persist();
    this.render();
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

  render() {
    const list     = document.getElementById('cart-list');
    const count    = document.getElementById('cart-count');
    const totalQty = document.getElementById('cart-total-qty');
    const subtotal = document.getElementById('cart-subtotal');
    const total    = document.getElementById('cart-total');
    const dot      = document.getElementById('cart-dot');

    if (count)    count.textContent    = this._items.length;
    if (totalQty) totalQty.textContent = `${this._items.length} prendas`;
    if (dot)      dot.classList.toggle('show', this._items.length > 0);

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
      sum += Number(p.price);
      return `
        <div class="cart-item">
          <img src="${p.image_url || 'https://via.placeholder.com/100'}" alt="${p.name}"/>
          <div class="cart-item-info">
            <h4>${p.name}</h4>
            <p>${p.categories?.name || 'Varios'} ${p.talla ? `• Talla: <b>${p.talla}</b>` : ''}</p>
            <span class="cart-remove" onclick="Cart.remove(${i})">Eliminar</span>
          </div>
          <div class="cart-item-price">${Utils.formatCurrency(p.price)}</div>
        </div>
      `;
    }).join('');

    const formattedSum = Utils.formatCurrency(sum);
    if (subtotal) subtotal.textContent = formattedSum;
    if (total)    total.textContent    = formattedSum;
  },

  sendOrder() {
    if (!this._items.length) return;

    const cfg = ConfigService.get();
    const waNum = cfg.waNumber || '573207101121';

    let msg = '¡Hola! 👋 Me interesan estas prendas:\n\n';
    
    const summary = this._items.reduce((acc, p) => {
      const key = `${p.name} (Talla: ${p.talla || 'N/A'})`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    Object.keys(summary).forEach((name, i) => {
      msg += `${i + 1}. *${name}* (x${summary[name]})\n`;
    });

    msg += `\nTotal artículos: ${this._items.length}`;
    
    window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_blank');
  },

  animate() {
    const bubble = document.getElementById('cart-bubble');
    const navBtn = document.getElementById('cart-btn-nav');
    [bubble, navBtn].forEach(el => {
      if (!el) return;
      el.style.transform = 'scale(1.2)';
      setTimeout(() => el.style.transform = '', 200);
    });
  },

  toggle() {
    document.getElementById('cart-panel')?.classList.toggle('open');
    document.getElementById('cart-overlay')?.classList.toggle('open');
  }
};

// Aliases para compatibilidad HTML
window.addToCart = (p) => Cart.add(p);
window.removeFromCart = (i) => Cart.remove(i);
window.toggleCart = () => Cart.toggle();
window.confirmClearCart = () => Cart.clear();
window.enviarPedidoWA = () => Cart.sendOrder();
window.renderCart = () => Cart.render();
