/**
 * utils.js — Utilidades comunes.
 */
window.Utils = {
  debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  },

  escapeHTML(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  escapeAttr(str) {
    return this.escapeHTML(str);
  },

  safeParse(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },

  formatCurrency(num) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(num ?? 0);
  },

  _scrollLock: 0,
  lockScroll() {
    if (this._scrollLock === 0) {
      document.body.style.overflow = 'hidden';
    }
    this._scrollLock++;
  },
  unlockScroll() {
    this._scrollLock = Math.max(0, this._scrollLock - 1);
    if (this._scrollLock === 0) {
      document.body.style.overflow = '';
    }
  },

  /**
   * Ejecuta una función async sobre cada item en chunks paralelos.
   * Limita la concurrencia para no saturar APIs (ej. Supabase rate limit).
   * @returns {Promise<PromiseSettledResult[]>}
   */
  async runInChunks(items, chunkSize, fn) {
    const results = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const settled = await Promise.allSettled(chunk.map(fn));
      results.push(...settled);
    }
    return results;
  },

  _FOCUSABLE_SEL: 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',

  _isVisible(el, container) {
    if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
    let node = el;
    while (node && node !== container) {
      if (node.hidden) return false;
      if (node.classList?.contains('hidden')) return false;
      if (node.getAttribute && node.getAttribute('aria-hidden') === 'true') return false;
      node = node.parentElement;
    }
    return true;
  },

  /**
   * Atrapa el foco dentro de un contenedor (Tab/Shift+Tab ciclan dentro).
   * Devuelve una función `release()` que desactiva el trap.
   * El llamador es responsable de guardar/restaurar el foco previo.
   */
  trapFocus(container) {
    if (!container) return () => {};
    const handler = (e) => {
      if (e.key !== 'Tab') return;
      const focusables = Array.from(container.querySelectorAll(this._FOCUSABLE_SEL))
        .filter(el => Utils._isVisible(el, container));
      if (!focusables.length) { e.preventDefault(); return; }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !container.contains(active))) {
        last.focus(); e.preventDefault();
      } else if (!e.shiftKey && (active === last || !container.contains(active))) {
        first.focus(); e.preventDefault();
      }
    };
    container.addEventListener('keydown', handler);
    return () => container.removeEventListener('keydown', handler);
  },

  /**
   * Foco inicial dentro de un modal: primer focusable o el contenedor mismo.
   */
  focusFirst(container) {
    if (!container) return;
    const first = container.querySelector(this._FOCUSABLE_SEL);
    (first || container).focus?.();
  }
};
