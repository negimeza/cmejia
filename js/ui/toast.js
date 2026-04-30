/**
 * toast.js — Notificaciones visuales no bloqueantes.
 * - showToast(msg, isError)    → Toast de texto simple (admin)
 * - showProductToast(product)  → Mini-card con imagen (catálogo)
 */
let _toastTimeout    = null;
let _prodToastTimer  = null;

/**
 * Muestra un mensaje toast en pantalla.
 * @param {string}  msg
 * @param {boolean} isError
 */
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = msg;
  toast.classList.remove('hidden', 'toast-error');
  if (isError) toast.classList.add('toast-error');

  clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(() => toast.classList.add('hidden'), 4000);
}

/**
 * Muestra una mini-card de confirmación de producto agregado al carrito.
 * Se crea/reutiliza el elemento #product-toast en el DOM.
 * @param {object} product
 */
function showProductToast(product) {
  let pt = document.getElementById('product-toast');

  // Crear el elemento si no existe
  if (!pt) {
    pt = document.createElement('div');
    pt.id = 'product-toast';
    pt.className = 'product-toast hidden';
    document.body.appendChild(pt);
  }

  const tallaLabel = product.talla
    ? `Talla: <strong>${product.talla}</strong>`
    : '<span class="pt-no-size">Sin talla</span>';

  pt.innerHTML = `
    <div class="pt-img-wrap">
      <img src="${product.image_url || 'https://placehold.co/56'}" alt="${product.name}">
    </div>
    <div class="pt-info">
      <span class="pt-label">✓ Agregado al carrito</span>
      <strong class="pt-name">${product.name}</strong>
      <span class="pt-size">${tallaLabel}</span>
    </div>
  `;

  // Resetear y mostrar
  pt.classList.remove('hidden', 'pt-exit');
  void pt.offsetWidth; // forzar reflow para reiniciar animación
  pt.classList.add('pt-enter');

  clearTimeout(_prodToastTimer);
  _prodToastTimer = setTimeout(() => {
    pt.classList.remove('pt-enter');
    pt.classList.add('pt-exit');
    setTimeout(() => pt.classList.add('hidden'), 350);
  }, 2800);
}

// Exportar al ámbito global
window.showToast = showToast;
window.showProductToast = showProductToast;
