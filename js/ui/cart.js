/**
 * cart.js — Carrito con persistencia en LocalStorage.
 */

const _WA_NUMBER_DEFAULT = '573207101121'; // PRUEBA — original: 573206419934
const _STORAGE_KEY = 'lupe_cart';

function _getConfig() {
  try {
    const saved = localStorage.getItem('lupe_config');
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function _getWANumber() {
  return _getConfig().waNumber || _WA_NUMBER_DEFAULT;
}

function _getShippingMsg() {
  return _getConfig().shippingMsg || '* Envío gratis en Medellín';
}

let _cartItems = JSON.parse(localStorage.getItem(_STORAGE_KEY)) || [];

/**
 * Agrega un producto al pedido.
 */
function addToCart(product) {
  _cartItems.push(product);
  _cartPersist();
  _cartRender();
  _animateCartBubble();
  _showCartDot();
}

/**
 * Elimina un producto por índice.
 */
function removeFromCart(index) {
  _cartItems.splice(index, 1);
  _cartPersist();
  _cartRender();
  if (_cartItems.length === 0) _hideCartDot();
}

/**
 * Abre o cierra el panel lateral del carrito.
 */
function toggleCart() {
  document.getElementById('cart-panel')?.classList.toggle('open');
  document.getElementById('cart-overlay')?.classList.toggle('open');
}

let _clearTimeout = null;

function confirmClearCart() {
  const btn = document.querySelector('.btn-clear-cart');
  if (!btn) return;

  if (btn.classList.contains('pending')) {
    // Segundo clic: Vaciar
    _cartItems = [];
    _cartPersist();
    _cartRender();
    _hideCartDot();
    
    // Reset botón
    btn.classList.remove('pending');
    btn.innerHTML = '🗑 Vaciar carrito';
    if (_clearTimeout) clearTimeout(_clearTimeout);
    return;
  }

  // Primer clic: Pedir confirmación
  btn.classList.add('pending');
  btn.innerHTML = '⚠️ ¿Seguro? Click para borrar';
  
  // Reset automático tras 4 segundos
  if (_clearTimeout) clearTimeout(_clearTimeout);
  _clearTimeout = setTimeout(() => {
    btn.classList.remove('pending');
    btn.innerHTML = '🗑 Vaciar carrito';
  }, 4000);
}

/**
 * Genera el mensaje y abre WhatsApp.
 */
function sendWhatsAppOrder() {
  if (!_cartItems.length) { 
    // En lugar de alert, resaltar visualmente que está vacío o simplemente ignorar
    console.warn('Intento de envío con carrito vacío');
    toggleCart(); // Abre el carrito para que el usuario vea que está vacío
    return; 
  }

  let msg = '\u00a1Hola LupeOutfit! Me interesan estas prendas:\n\n';
  
  // Agrupar por nombre para mejor lectura
  const summary = _cartItems.reduce((acc, p) => {
    const key = `${p.name} (Talla: ${p.talla || 'N/A'})`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  Object.keys(summary).forEach((name, i) => {
    msg += `${i + 1}. *${name}* (x${summary[name]})\n`;
  });

  msg += `\nTotal artículos: ${_cartItems.length}`;
  
  window.open(`https://wa.me/${_getWANumber()}?text=${encodeURIComponent(msg)}`, '_blank');
}

// Aliases para llamadas desde HTML antiguo o nuevo
function enviarPedidoWA() { sendWhatsAppOrder(); }
function renderCart() { 
  _cartRender(); 
  if (_cartItems.length > 0) _showCartDot();
}

// ── Privados ──

function _cartPersist() {
  localStorage.setItem(_STORAGE_KEY, JSON.stringify(_cartItems));
}

function _cartRender() {
  const list     = document.getElementById('cart-list');
  const count    = document.getElementById('cart-count');
  const totalQty = document.getElementById('cart-total-qty');
  const subtotal = document.getElementById('cart-subtotal');
  const total    = document.getElementById('cart-total');

  if (count)    count.textContent    = _cartItems.length;
  if (totalQty) totalQty.textContent = `${_cartItems.length} prendas`;

  if (!list) return;

  if (!_cartItems.length) {
    list.innerHTML = `
      <div class="cart-empty">
        <span class="ce-icon">🛍️</span>
        <p>Bolsa vacía.<br>Explora la colección para elegir.</p>
      </div>`;
    if (subtotal) subtotal.textContent = '$0';
    if (total)    total.textContent    = '$0';
    
    const sendBtn = document.querySelector('.btn-send-wa');
    if (sendBtn) sendBtn.disabled = true;

    return;
  }

  const sendBtn = document.querySelector('.btn-send-wa');
  if (sendBtn) sendBtn.disabled = false;

  list.innerHTML = '';
  let sum = 0;

  _cartItems.forEach((p, i) => {
    sum += Number(p.price);
    const item = document.createElement('div');
    item.className = 'cart-item';
    item.innerHTML = `
      <img src="${p.src}" alt="${p.name}"/>
      <div class="cart-item-info">
        <h4>${p.name}</h4>
        <p>${p.category} ${p.talla ? `• Talla: <b>${p.talla}</b>` : ''}</p>
        <span class="cart-remove" onclick="removeFromCart(${i})">Eliminar</span>
      </div>
      <div class="cart-item-price">${Number(p.price) === 0 ? '$-' : `$${Number(p.price).toLocaleString('es-CO')}`}</div>`;
    list.appendChild(item);
  });

  const formattedSum = `$${sum.toLocaleString('es-CO')}`;
  if (subtotal) subtotal.textContent = formattedSum;
  if (total)    total.textContent    = formattedSum;
}

function _animateCartBubble() {
  const bubble = document.getElementById('cart-bubble');
  const navBtn = document.getElementById('cart-btn-nav');
  [bubble, navBtn].forEach(el => {
    if (!el) return;
    el.style.transform = 'scale(1.2)';
    setTimeout(() => el.style.transform = '', 200);
  });
}

function _showCartDot() {
  document.getElementById('cart-dot')?.classList.add('show');
}

function _hideCartDot() {
  document.getElementById('cart-dot')?.classList.remove('show');
}
