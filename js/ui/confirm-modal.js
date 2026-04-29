/**
 * confirm-modal.js — Diálogo de confirmación reutilizable.
 *
 * Uso:
 *   showConfirm({
 *     title:     '¿Eliminar?',
 *     message:   'Esta acción no se puede deshacer.',
 *     onConfirm: () => deleteItem(id),
 *   });
 */
let _onConfirmCallback = null;

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

  document.getElementById('confirm-modal')
    ?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeConfirm();
    });
}

/** @param {{ title: string, message: string, onConfirm: Function }} options */
function showConfirm({ title, message, onConfirm }) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent   = message;
  _onConfirmCallback = onConfirm;
  document.getElementById('confirm-modal')?.classList.remove('hidden');
}

function closeConfirm() {
  document.getElementById('confirm-modal')?.classList.add('hidden');
  _onConfirmCallback = null;
}
