/**
 * toast.js — Notificaciones visuales no bloqueantes.
 */
let _toastTimeout = null;

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
