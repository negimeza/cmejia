/**
 * cart.js — Carrito con persistencia en LocalStorage.
 * Los items se agrupan por id + talla para evitar duplicados.
 */
window.Cart = {
  _items: Utils.safeParse('lupe_cart', []),

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
    this._bindDelegatedEvents();
  },

  _bindDelegatedEvents() {
    if (this._listenersBound) return;
    const list = document.getElementById('cart-list');
    if (!list) return;
    list.addEventListener('click', (e) => {
      const qtyBtn = e.target.closest('[data-cart-action="qty"]');
      if (qtyBtn) {
        const dir = Number(qtyBtn.dataset.dir);
        if (dir === 1 || dir === -1) this.changeQty(qtyBtn.dataset.key, dir);
        return;
      }
      const removeBtn = e.target.closest('[data-cart-action="remove"]');
      if (removeBtn) this.remove(removeBtn.dataset.key);
    });
    this._listenersBound = true;
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

  _keyOf(item) {
    return `${item.id}|||${item.talla || ''}`;
  },

  _findByKey(key) {
    if (typeof key === 'number') return this._items[key];
    const [id, talla] = key.split('|||');
    return this._items.find(i => i.id === id && i.talla === (talla || undefined));
  },

  /** Incrementa o decrementa la cantidad. Acepta índice (número) o key (string id|||talla). */
  changeQty(key, dir) {
    const item = this._findByKey(key);
    if (!item) return;

    const newQty = (item.qty || 1) + dir;
    if (newQty < 1) {
      this.remove(key);
      return;
    }
    item.qty = newQty;
    this.persist();
    this.render();
  },

  /** Elimina un item por índice (número) o key (string). */
  remove(key) {
    const item = this._findByKey(key);
    if (!item) return;

    const productId = item.id;
    const idx = this._items.indexOf(item);
    if (idx !== -1) this._items.splice(idx, 1);
    this.persist();
    this.render();

    if (!this.hasProduct(productId)) {
      this._notifyCardState(productId, false);
    }
  },

  clear() {
    const btn = document.querySelector('.btn-clear-cart');
    if (!btn) return;
    const span = btn.querySelector('span') || btn;

    if (btn.classList.contains('pending')) {
      this._items = [];
      this.persist();
      this.render();
      btn.classList.remove('pending');
      span.textContent = 'Vaciar';
      // Limpiar estado visual de todas las cards
      document.querySelectorAll('.card.in-cart').forEach(c => c.classList.remove('in-cart'));
      document.querySelectorAll('.btn-add-cart-fast.in-cart').forEach(b => b.classList.remove('in-cart'));
      return;
    }

    btn.classList.add('pending');
    span.textContent = '¿Seguro?';
    setTimeout(() => {
      btn.classList.remove('pending');
      span.textContent = 'Vaciar';
    }, 4000);
  },

  persist() {
    localStorage.setItem('lupe_cart', JSON.stringify(this._items));
  },

  // ── Render ───────────────────────────────────────────────────

  render() {
    this._bindDelegatedEvents();
    const list     = document.getElementById('cart-list');
    const count    = document.getElementById('cart-count');
    const totalQty = document.getElementById('cart-total-qty');
    const subtotal = document.getElementById('cart-subtotal');
    const total    = document.getElementById('cart-total');
    const dot      = document.getElementById('cart-dot');

    const qty = this.totalQty;
    if (count)    count.textContent    = qty;
    if (totalQty) totalQty.textContent = `${qty} prendas`;
    if (dot) {
      dot.classList.toggle('show', qty > 0);
      dot.textContent = qty > 99 ? '99+' : qty;
    }

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
    let hasConsultationItems = false;

    list.innerHTML = this._items.map((p) => {
      const itemQty   = p.qty || 1;
      const priceVal  = Number(p.price);
      const isConsult = priceVal === 0;
      const key = this._keyOf(p);
      
      if (isConsult) hasConsultationItems = true;
      
      const itemTotal = priceVal * itemQty;
      sum += itemTotal;

      const priceDisplay = isConsult 
        ? `<span class="price-consult">Consultar precio</span>`
        : Utils.formatCurrency(itemTotal);

      const safeImg  = Utils.escapeAttr(p.image_url || 'https://placehold.co/100');
      const safeAlt  = Utils.escapeAttr(p.name);
      const safeKey  = Utils.escapeAttr(key);

      return `
        <div class="cart-item">
          <img src="${safeImg}" alt="${safeAlt}" loading="lazy" decoding="async"/>
          <div class="cart-item-info">
            <h4>${Utils.escapeHTML(p.name)}</h4>
            <p>${Utils.escapeHTML(p.categories?.name || 'Varios')}${p.talla ? ` · Talla: <b>${Utils.escapeHTML(p.talla)}</b>` : ''}</p>
            <div class="cart-item-qty-row">
              <div class="cart-qty-control">
                <button type="button" data-cart-action="qty" data-key="${safeKey}" data-dir="-1" aria-label="Disminuir">−</button>
                <span>${itemQty}</span>
                <button type="button" data-cart-action="qty" data-key="${safeKey}" data-dir="1" aria-label="Aumentar">+</button>
              </div>
              <button type="button" class="cart-remove" data-cart-action="remove" data-key="${safeKey}" aria-label="Eliminar del carrito" title="Eliminar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </div>
          </div>
          <div class="cart-item-price">${priceDisplay}</div>
        </div>
      `;
    }).join('');

    const formattedSum = Utils.formatCurrency(sum);
    if (subtotal) subtotal.textContent = formattedSum;
    if (total)    total.textContent    = formattedSum;

    // Nota de cotización
    const shipMsg = document.getElementById('shipping-msg');
    if (shipMsg) {
      const cfg = ConfigService.get();
      const baseMsg = Utils.escapeHTML(cfg.shippingMsg || '* Envío gratis en Medellín');
      shipMsg.innerHTML = hasConsultationItems
        ? `${baseMsg}<br><span style="color:var(--accent); font-weight:600;">⚠️ El total no incluye prendas por consultar.</span>`
        : baseMsg;
    }
  },

  // ── Pedido WA ────────────────────────────────────────────────

  sendOrder() {
    if (!this._items.length) return;

    const btn = document.querySelector('.btn-send-wa');
    if (btn?.hasAttribute('data-sending')) return;
    if (btn) {
      btn.setAttribute('data-sending', '1');
      setTimeout(() => btn.removeAttribute('data-sending'), 1500);
    }

    const cfg   = ConfigService.get();
    const waNum = cfg.waNumber || '573207101121';

    let msg      = '¡Hola! 👋 Me interesan estas prendas:\n\n';
    let totalArt = 0;
    let hasConsult = false;

    this._items.forEach((p, i) => {
      const qty = p.qty || 1;
      totalArt += qty;
      const talla = p.talla ? ` (Talla: ${p.talla})` : '';
      const priceVal = Number(p.price);
      
      let priceText = '';
      if (priceVal === 0) {
        priceText = 'Precio a consultar';
        hasConsult = true;
      } else {
        priceText = Utils.formatCurrency(priceVal * qty);
      }

      msg += `${i + 1}. *${p.name}*${talla} — x${qty} — ${priceText}\n`;
    });

    const totalStr = Utils.formatCurrency(this._items.reduce((s, p) => s + (Number(p.price) * (p.qty || 1)), 0));
    msg += `\nTotal artículos: ${totalArt}`;
    msg += `\nTotal estimado: ${totalStr}${hasConsult ? ' (Sujeto a cotización)' : ''}`;

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
    const panel = document.getElementById('cart-panel');
    const overlay = document.getElementById('cart-overlay');
    const cartBtn = document.getElementById('cart-btn-nav');
    if (!panel) return;
    const wasOpen = panel.classList.contains('open');
    panel.classList.toggle('open');
    overlay?.classList.toggle('open');

    if (wasOpen) {
      panel.setAttribute('aria-hidden', 'true');
      if (cartBtn) cartBtn.setAttribute('aria-expanded', 'false');
      Utils.unlockScroll();
      this._releaseTrap?.();
      this._releaseTrap = null;
      if (this._escapeHandler) {
        document.removeEventListener('keydown', this._escapeHandler);
        this._escapeHandler = null;
      }
      this._previouslyFocused?.focus?.();
      this._previouslyFocused = null;
    } else {
      this._previouslyFocused = document.activeElement;
      panel.setAttribute('aria-hidden', 'false');
      if (cartBtn) cartBtn.setAttribute('aria-expanded', 'true');
      Utils.lockScroll();
      this._releaseTrap = Utils.trapFocus(panel);
      this._escapeHandler = (e) => { if (e.key === 'Escape') this.toggle(); };
      document.addEventListener('keydown', this._escapeHandler);
      Utils.focusFirst(panel);
    }
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
