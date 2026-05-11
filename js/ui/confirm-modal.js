/**
 * confirm-modal.js — Diálogo de confirmación reutilizable.
 *
 * Uso:
 *   showConfirm({
 *     title:     '¿Eliminar?',
 *     message:   'Esta acción no se puede deshacer.',
 *     onConfirm: () => deleteItem(id),
 *     onCancel:  () => console.log('Cancelled')  // opcional
 *   });
 * 
 * Nota: Devuelve una Promise si se usa en contexto async:
 *   const confirmed = await confirmAsync('¿Eliminar?', '...');
 */
let _onConfirmCallback = null;
let _onCancelCallback = null;
let _releaseTrap = null;
let _previouslyFocused = null;
let _escapeHandler = null;

/** @param {{ title: string, message: string, onConfirm?: Function, onCancel?: Function }} options */
function showConfirm({ title, message, onConfirm, onCancel }) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent   = message;
  _onConfirmCallback = onConfirm || null;
  _onCancelCallback = onCancel || null;
  const modal = document.getElementById('confirm-modal');
  if (!modal) return;
  _previouslyFocused = document.activeElement;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  Utils.lockScroll();
  const box = modal.querySelector('.confirm-box') || modal;
  _releaseTrap = Utils.trapFocus(box);
  _escapeHandler = (e) => {
    if (e.key === 'Escape') {
      const cancel = _onCancelCallback;
      closeConfirm();
      cancel?.();
    }
  };
  document.addEventListener('keydown', _escapeHandler);
  // Foco al botón "Cancelar" como acción segura por defecto
  const cancelBtn = modal.querySelector('.btn-secondary');
  (cancelBtn || box).focus?.();
}

/** Versión Promise para uso en funciones async */
function confirmAsync(title, message) {
  return new Promise(resolve => {
    showConfirm({
      title,
      message,
      onConfirm: () => resolve(true),
      onCancel:  () => resolve(false)
    });
  });
}

/** Inicializa los listeners. Llamar UNA sola vez al cargar la página. */
function initConfirmModal() {
  const btn = document.getElementById('btn-confirm-action');
  if (!btn) return;
  
  // Limpiar listeners previos por si acaso
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);

  newBtn.addEventListener('click', () => {
    const callback = _onConfirmCallback;
    closeConfirm();
    if (callback) callback();
  });
  
  // Botón Cancelar
  const cancelBtn = document.querySelector('#confirm-modal .btn-secondary');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      const callback = _onCancelCallback;
      closeConfirm();
      if (callback) callback();
    });
  }

  document.getElementById('confirm-modal')
    ?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        const cancel = _onCancelCallback;
        closeConfirm();
        cancel?.();
      }
    });
}

function closeConfirm() {
  const modal = document.getElementById('confirm-modal');
  if (modal && !modal.classList.contains('hidden')) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    Utils.unlockScroll();
  }
  _releaseTrap?.();
  _releaseTrap = null;
  if (_escapeHandler) {
    document.removeEventListener('keydown', _escapeHandler);
    _escapeHandler = null;
  }
  _previouslyFocused?.focus?.();
  _previouslyFocused = null;
  _onConfirmCallback = null;
  _onCancelCallback = null;
}
