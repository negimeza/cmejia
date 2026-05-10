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

/** @param {{ title: string, message: string, onConfirm?: Function, onCancel?: Function }} options */
function showConfirm({ title, message, onConfirm, onCancel }) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent   = message;
  _onConfirmCallback = onConfirm || null;
  _onCancelCallback = onCancel || null;
  document.getElementById('confirm-modal')?.classList.remove('hidden');
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
    console.log('ConfirmModal: Botón Confirmar clicado');
    const callback = _onConfirmCallback;
    closeConfirm();
    if (callback) {
      console.log('ConfirmModal: Ejecutando callback');
      callback();
    } else {
      console.warn('ConfirmModal: No hay callback definido');
    }
  });
  
  // Botón Cancelar
  const cancelBtn = document.querySelector('#confirm-modal .btn-secondary');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      console.log('ConfirmModal: Cancelar clicado');
      const callback = _onCancelCallback;
      closeConfirm();
      if (callback) {
        console.log('ConfirmModal: Ejecutando onCancel');
        callback();
      }
    });
  }

  document.getElementById('confirm-modal')
    ?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeConfirm();
    });
}

function closeConfirm() {
  document.getElementById('confirm-modal')?.classList.add('hidden');
  _onConfirmCallback = null;
  _onCancelCallback = null;
}
