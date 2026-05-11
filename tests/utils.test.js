import { describe, it, expect, beforeEach } from 'vitest';
import '../js/core/utils.js';

const Utils = window.Utils;

describe('Utils.escapeHTML', () => {
  it('escapa los 5 caracteres peligrosos', () => {
    expect(Utils.escapeHTML('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('escapa & antes que los demás (evita doble-escape)', () => {
    expect(Utils.escapeHTML('A & B')).toBe('A &amp; B');
    expect(Utils.escapeHTML('&amp;')).toBe('&amp;amp;');
  });

  it('escapa apóstrofes', () => {
    expect(Utils.escapeHTML("it's")).toBe('it&#39;s');
  });

  it('devuelve string vacío para null o undefined', () => {
    expect(Utils.escapeHTML(null)).toBe('');
    expect(Utils.escapeHTML(undefined)).toBe('');
  });

  it('convierte números a string', () => {
    expect(Utils.escapeHTML(42)).toBe('42');
  });

  it('no toca strings sin caracteres especiales', () => {
    expect(Utils.escapeHTML('Camisa azul talla M')).toBe('Camisa azul talla M');
  });
});

describe('Utils.escapeAttr', () => {
  it('es alias de escapeHTML (escapa los mismos 5 caracteres)', () => {
    expect(Utils.escapeAttr('"><img src=x>')).toBe('&quot;&gt;&lt;img src=x&gt;');
  });
});

describe('Utils.safeParse', () => {
  beforeEach(() => localStorage.clear());

  it('devuelve fallback si la clave no existe', () => {
    expect(Utils.safeParse('inexistente', [])).toEqual([]);
    expect(Utils.safeParse('inexistente', { a: 1 })).toEqual({ a: 1 });
  });

  it('devuelve el valor parseado si el JSON es válido', () => {
    localStorage.setItem('clave', JSON.stringify({ x: 10, y: [1, 2] }));
    expect(Utils.safeParse('clave', null)).toEqual({ x: 10, y: [1, 2] });
  });

  it('devuelve fallback si el JSON está corrupto', () => {
    localStorage.setItem('clave', '{esto no es json');
    expect(Utils.safeParse('clave', 'fallback')).toBe('fallback');
  });

  it('devuelve fallback si el valor almacenado es null literal', () => {
    localStorage.setItem('clave', 'null');
    expect(Utils.safeParse('clave', { default: true })).toEqual({ default: true });
  });

  it('respeta el valor 0 como válido (no usa truthy check)', () => {
    localStorage.setItem('clave', '0');
    expect(Utils.safeParse('clave', 999)).toBe(0);
  });
});

describe('Utils.lockScroll / unlockScroll', () => {
  beforeEach(() => {
    Utils._scrollLock = 0;
    document.body.style.overflow = '';
  });

  it('bloquea el scroll al primer lock', () => {
    Utils.lockScroll();
    expect(document.body.style.overflow).toBe('hidden');
    expect(Utils._scrollLock).toBe(1);
  });

  it('mantiene el bloqueo con múltiples locks anidados', () => {
    Utils.lockScroll();
    Utils.lockScroll();
    Utils.lockScroll();
    expect(Utils._scrollLock).toBe(3);
    Utils.unlockScroll();
    expect(document.body.style.overflow).toBe('hidden');
    Utils.unlockScroll();
    expect(document.body.style.overflow).toBe('hidden');
    Utils.unlockScroll();
    expect(document.body.style.overflow).toBe('');
  });

  it('no permite contador negativo si se llama unlock de más', () => {
    Utils.unlockScroll();
    Utils.unlockScroll();
    expect(Utils._scrollLock).toBe(0);
  });
});

describe('Utils.runInChunks', () => {
  it('procesa todos los items y respeta el orden', async () => {
    const items = [1, 2, 3, 4, 5];
    const results = await Utils.runInChunks(items, 2, async (n) => n * 10);
    expect(results.map(r => r.value)).toEqual([10, 20, 30, 40, 50]);
  });

  it('captura rechazos sin abortar el resto', async () => {
    const items = [1, 2, 3, 4];
    const results = await Utils.runInChunks(items, 2, async (n) => {
      if (n === 2) throw new Error('boom');
      return n;
    });
    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');
    expect(results[1].reason.message).toBe('boom');
    expect(results[2].status).toBe('fulfilled');
    expect(results[3].status).toBe('fulfilled');
  });

  it('limita la concurrencia al tamaño del chunk', async () => {
    let activeNow = 0;
    let maxActive = 0;
    const items = Array.from({ length: 10 }, (_, i) => i);

    await Utils.runInChunks(items, 3, async () => {
      activeNow++;
      maxActive = Math.max(maxActive, activeNow);
      await new Promise(r => setTimeout(r, 5));
      activeNow--;
    });

    expect(maxActive).toBeLessThanOrEqual(3);
  });

  it('soporta array vacío', async () => {
    const results = await Utils.runInChunks([], 5, async () => 1);
    expect(results).toEqual([]);
  });
});

describe('Utils.formatCurrency', () => {
  it('formatea como COP sin decimales', () => {
    const formatted = Utils.formatCurrency(15000);
    expect(formatted).toContain('15.000');
  });

  it('trata null/undefined como 0', () => {
    expect(Utils.formatCurrency(null)).toContain('0');
    expect(Utils.formatCurrency(undefined)).toContain('0');
  });
});

describe('Utils.trapFocus', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="trap">
        <button id="b1">B1</button>
        <input id="i1" />
        <button id="b2">B2</button>
      </div>
    `;
    container = document.getElementById('trap');
  });

  it('cicla al primer focusable cuando se tabula desde el último', () => {
    const release = Utils.trapFocus(container);
    const last = document.getElementById('b2');
    last.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    container.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement.id).toBe('b1');
    release();
  });

  it('cicla al último cuando se hace Shift+Tab desde el primero', () => {
    const release = Utils.trapFocus(container);
    const first = document.getElementById('b1');
    first.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'Tab', shiftKey: true, bubbles: true, cancelable: true
    });
    container.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement.id).toBe('b2');
    release();
  });

  it('release() desactiva el trap', () => {
    const release = Utils.trapFocus(container);
    release();
    const last = document.getElementById('b2');
    last.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    container.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('no hace nada si el contenedor es null', () => {
    const release = Utils.trapFocus(null);
    expect(typeof release).toBe('function');
    expect(() => release()).not.toThrow();
  });
});
