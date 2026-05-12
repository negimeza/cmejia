/**
 * utils.js — Utilidades comunes.
 */
window.Utils = {
  _requestCache: new Map(),
  _pendingRequests: new Map(),

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

  /**
   * Formatea un número o string numérico con puntos como separador de miles.
   */
  formatNumberWithDots(val) {
    if (val == null || val === '') return '';
    // Eliminar todo lo que no sea dígito
    const clean = String(val).replace(/\D/g, '');
    if (!clean) return '';
    // Añadir puntos cada 3 dígitos desde el final
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  },

  /**
   * Limpia los puntos de un string y devuelve el valor numérico.
   */
  parseNumberFromDots(val) {
    if (!val) return 0;
    const clean = String(val).replace(/\./g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  },

  /**
   * Busca todos los inputs con data-type="currency" y les añade 
   * el comportamiento de formateo en tiempo real.
   */
  setupCurrencyInputs() {
    const inputs = document.querySelectorAll('input[data-type="currency"]');
    inputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const cursorPosition = e.target.selectionStart;
        const oldLength = e.target.value.length;
        
        const formatted = this.formatNumberWithDots(e.target.value);
        e.target.value = formatted;

        // Intentar mantener la posición del cursor (aproximado)
        const newLength = formatted.length;
        const diff = newLength - oldLength;
        const newPosition = cursorPosition + diff;
        e.target.setSelectionRange(newPosition, newPosition);
      });
    });
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
  },

  /**
   * Traduce errores técnicos a mensajes amigables para el usuario.
   */
  translateError(error) {
    if (!error) return 'Ocurrió un error desconocido.';

    const message = error.message || String(error);

    const supabaseErrors = {
      'Invalid login credentials': 'Correo o contraseña incorrectos.',
      'Email not confirmed': 'Confirma tu correo electrónico primero.',
      'Too many requests': 'Demasiados intentos. Espera un momento.',
      'User already registered': 'Este correo ya está registrado.',
      'duplicate key value violates unique constraint': 'Este valor ya existe en el sistema.',
      'null value violates not-null constraint': 'Falta un campo requerido.',
      'JWT expired': 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
      'Network request failed': 'Error de conexión. Verifica tu internet.',
      'Timeout': 'La operación tardó demasiado. Intenta nuevamente.'
    };

    if (supabaseErrors[message]) {
      return supabaseErrors[message];
    }

    for (const [key, value] of Object.entries(supabaseErrors)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    if (error.code === 'PGRST116') {
      return 'No se encontraron resultados.';
    }

    if (message.includes('network') || message.includes('fetch')) {
      return 'Error de conexión. Verifica tu internet e intenta nuevamente.';
    }

    if (message.includes('timeout')) {
      return 'La operación tardó demasiado. Intenta nuevamente.';
    }

    return 'Ocurrió un error. Por favor intenta nuevamente.';
  },

  /**
   * Muestra un toast de error amigable.
   */
  showError(error, context = '') {
    const message = this.translateError(error);
    const fullMessage = context ? `${context}: ${message}` : message;
    if (window.showToast) {
      window.showToast(`❌ ${fullMessage}`, true);
    }
    console.error('Error:', error);
  },

  /**
   * Registra errores para debugging.
   */
  logError(type, error) {
    const errorInfo = {
      type,
      message: error?.message || String(error),
      stack: error?.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    console.error('[Error Log]', errorInfo);
  },

  /**
   * Configura manejadores globales de errores.
   */
  setupGlobalErrorHandlers() {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault();

      if (window.showToast) {
        this.showError(event.reason, 'Error inesperado');
      }

      this.logError('UnhandledPromiseRejection', event.reason);
    });

    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);

      if (window.showToast) {
        this.showError(event.error, 'Error');
      }

      this.logError('GlobalError', event.error);
    });
  },

  /**
   * Genera y almacena un token CSRF.
   */
  generateCSRFToken() {
    const token = crypto.randomUUID();
    sessionStorage.setItem('csrf_token', token);
    return token;
  },

  /**
   * Valida un token CSRF.
   */
  validateCSRFToken(token) {
    const stored = sessionStorage.getItem('csrf_token');
    return stored && stored === token;
  },

  /**
   * Obtiene el token CSRF actual.
   */
  getCSRFToken() {
    return sessionStorage.getItem('csrf_token');
  },

  /**
   * Deduplica requests con la misma clave.
   */
  async deduplicatedRequest(key, requestFn) {
    if (this._pendingRequests.has(key)) {
      return this._pendingRequests.get(key);
    }

    if (this._requestCache.has(key)) {
      const cached = this._requestCache.get(key);
      if (Date.now() - cached.timestamp < 300000) {
        return cached.data;
      }
    }

    const promise = requestFn()
      .then(data => {
        this._requestCache.set(key, {
          data,
          timestamp: Date.now()
        });
        this._pendingRequests.delete(key);
        return data;
      })
      .catch(error => {
        this._pendingRequests.delete(key);
        throw error;
      });

    this._pendingRequests.set(key, promise);
    return promise;
  },

  /**
   * Limpia el cache de requests.
   */
  clearRequestCache() {
    this._requestCache.clear();
  },

  _lazyObserver: null,

  /**
   * Configura lazy loading. Crea un IntersectionObserver singleton y observa
   * todas las imágenes con [data-src] presentes en el DOM al momento.
   * Para imágenes renderizadas más tarde, llamar Utils.observeLazyImages().
   */
  setupLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: cargar todas las imágenes inmediatamente
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
      return null;
    }

    if (!this._lazyObserver) {
      this._lazyObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
            }
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '200px 0px',
        threshold: 0.01,
      });
    }

    this.observeLazyImages();
    return this._lazyObserver;
  },

  /**
   * Observa nuevas imágenes [data-src] añadidas al DOM tras el setup inicial.
   * @param {ParentNode} [root=document] contenedor donde buscar imágenes.
   */
  observeLazyImages(root = document) {
    if (!this._lazyObserver) {
      // Sin observer (navegador sin IntersectionObserver): cargar directo
      root.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
      return;
    }
    root.querySelectorAll('img[data-src]').forEach(img => {
      this._lazyObserver.observe(img);
    });
  },

  /**
   * Establece estado de carga en un botón.
   */
  setButtonLoading(btn, loading, originalText = '') {
    if (!btn) return;

    if (loading) {
      btn.dataset.originalText = btn.textContent || originalText;
      btn.disabled = true;
      btn.innerHTML = `
        <svg width="18" height="18" class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <span style="margin-left: 8px;">Procesando...</span>
      `;
    } else {
      btn.disabled = false;
      btn.textContent = btn.dataset.originalText || originalText;
      delete btn.dataset.originalText;
    }
  },

  /**
   * Muestra overlay de carga.
   */
  showLoadingOverlay(message = 'Cargando...') {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loading-overlay';
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div class="loading-spinner">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <p>${message}</p>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    overlay.classList.remove('hidden');
    this.lockScroll();
    return overlay;
  },

  /**
   * Oculta overlay de carga.
   */
  hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      this.unlockScroll();
    }
  }
};
