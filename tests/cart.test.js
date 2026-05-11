import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../js/core/utils.js';
import '../js/ui/cart.js';

const Cart = window.Cart;

function mountCartDOM() {
  document.body.innerHTML = `
    <button id="cart-btn-nav"></button>
    <button id="cart-panel"></button>
    <div id="cart-overlay"></div>
    <div id="cart-list"></div>
    <span id="cart-count"></span>
    <span id="cart-total-qty"></span>
    <span id="cart-subtotal"></span>
    <span id="cart-total"></span>
    <span id="cart-dot"></span>
    <p id="shipping-msg"></p>
    <button class="btn-send-wa"></button>
  `;
}

beforeEach(() => {
  localStorage.clear();
  Cart._items = [];
  Cart._listenersBound = false;
  window.showProductToast = vi.fn();
  window.CatalogUI = { updateCardState: vi.fn() };
  window.ConfigService = { get: () => ({ shippingMsg: '* Envío local' }) };
  mountCartDOM();
});

describe('Cart.add', () => {
  it('agrega un producto nuevo con qty=1', () => {
    Cart.add({ id: 'p1', name: 'Camisa', price: 100, talla: 'M' });
    expect(Cart._items).toHaveLength(1);
    expect(Cart._items[0].qty).toBe(1);
    expect(Cart._items[0].id).toBe('p1');
  });

  it('incrementa qty si el mismo id+talla ya existe', () => {
    Cart.add({ id: 'p1', name: 'Camisa', price: 100, talla: 'M' });
    Cart.add({ id: 'p1', name: 'Camisa', price: 100, talla: 'M' }, 2);
    expect(Cart._items).toHaveLength(1);
    expect(Cart._items[0].qty).toBe(3);
  });

  it('crea items separados para diferentes tallas del mismo producto', () => {
    Cart.add({ id: 'p1', name: 'Camisa', price: 100, talla: 'M' });
    Cart.add({ id: 'p1', name: 'Camisa', price: 100, talla: 'L' });
    expect(Cart._items).toHaveLength(2);
  });

  it('llama showProductToast al agregar', () => {
    Cart.add({ id: 'p1', name: 'Camisa', price: 100, talla: 'M' });
    expect(window.showProductToast).toHaveBeenCalledTimes(1);
  });

  it('notifica a CatalogUI que el producto está en el carrito', () => {
    Cart.add({ id: 'p1', name: 'Camisa', price: 100, talla: 'M' });
    expect(window.CatalogUI.updateCardState).toHaveBeenCalledWith('p1', true);
  });
});

describe('Cart.changeQty (por key compuesta id|||talla)', () => {
  beforeEach(() => {
    Cart.add({ id: 'p1', name: 'A', price: 100, talla: 'M' });
  });

  it('incrementa correctamente', () => {
    Cart.changeQty('p1|||M', 1);
    expect(Cart._items[0].qty).toBe(2);
  });

  it('decrementa correctamente', () => {
    Cart._items[0].qty = 3;
    Cart.changeQty('p1|||M', -1);
    expect(Cart._items[0].qty).toBe(2);
  });

  it('elimina el item si qty cae por debajo de 1', () => {
    Cart.changeQty('p1|||M', -1);
    expect(Cart._items).toHaveLength(0);
  });

  it('no rompe ante una key inexistente', () => {
    expect(() => Cart.changeQty('zzz|||X', 1)).not.toThrow();
    expect(Cart._items).toHaveLength(1);
  });

  it('acepta índice numérico (compatibilidad legacy)', () => {
    Cart.changeQty(0, 1);
    expect(Cart._items[0].qty).toBe(2);
  });
});

describe('Cart.remove', () => {
  it('elimina por key compuesta sin afectar otros items', () => {
    Cart.add({ id: 'p1', name: 'A', price: 100, talla: 'M' });
    Cart.add({ id: 'p2', name: 'B', price: 200, talla: 'L' });
    Cart.remove('p1|||M');
    expect(Cart._items).toHaveLength(1);
    expect(Cart._items[0].id).toBe('p2');
  });

  it('no-op ante una key inexistente', () => {
    Cart.add({ id: 'p1', name: 'A', price: 100, talla: 'M' });
    Cart.remove('inexistente|||X');
    expect(Cart._items).toHaveLength(1);
  });

  it('notifica a CatalogUI cuando se elimina la última unidad de un producto', () => {
    Cart.add({ id: 'p1', name: 'A', price: 100, talla: 'M' });
    window.CatalogUI.updateCardState.mockClear();
    Cart.remove('p1|||M');
    expect(window.CatalogUI.updateCardState).toHaveBeenCalledWith('p1', false);
  });

  it('NO notifica si el producto sigue presente con otra talla', () => {
    Cart.add({ id: 'p1', name: 'A', price: 100, talla: 'M' });
    Cart.add({ id: 'p1', name: 'A', price: 100, talla: 'L' });
    window.CatalogUI.updateCardState.mockClear();
    Cart.remove('p1|||M');
    expect(window.CatalogUI.updateCardState).not.toHaveBeenCalledWith('p1', false);
  });
});

describe('Cart.hasProduct', () => {
  it('devuelve true si el producto está (cualquier talla)', () => {
    Cart.add({ id: 'p1', name: 'A', price: 100, talla: 'M' });
    expect(Cart.hasProduct('p1')).toBe(true);
  });

  it('devuelve false si el producto no está', () => {
    expect(Cart.hasProduct('p1')).toBe(false);
  });
});

describe('Cart.totalQty', () => {
  it('suma las cantidades de todos los items', () => {
    Cart.add({ id: 'p1', name: 'A', price: 100, talla: 'M' }, 2);
    Cart.add({ id: 'p2', name: 'B', price: 200, talla: 'L' }, 3);
    expect(Cart.totalQty).toBe(5);
  });

  it('devuelve 0 con carrito vacío', () => {
    expect(Cart.totalQty).toBe(0);
  });
});

describe('Cart.persist + safeParse', () => {
  it('persiste en localStorage tras add', () => {
    Cart.add({ id: 'p1', name: 'A', price: 100, talla: 'M' });
    const stored = JSON.parse(localStorage.getItem('lupe_cart'));
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('p1');
    expect(stored[0].qty).toBe(1);
  });

  it('persiste tras changeQty', () => {
    Cart.add({ id: 'p1', name: 'A', price: 100, talla: 'M' });
    Cart.changeQty('p1|||M', 1);
    const stored = JSON.parse(localStorage.getItem('lupe_cart'));
    expect(stored[0].qty).toBe(2);
  });

  it('persiste tras remove', () => {
    Cart.add({ id: 'p1', name: 'A', price: 100, talla: 'M' });
    Cart.remove('p1|||M');
    const stored = JSON.parse(localStorage.getItem('lupe_cart'));
    expect(stored).toEqual([]);
  });
});

describe('Cart.toggle', () => {
  it('bloquea scroll al abrir y lo libera al cerrar', () => {
    window.Utils._scrollLock = 0;
    document.body.style.overflow = '';

    Cart.toggle();
    expect(document.body.style.overflow).toBe('hidden');

    Cart.toggle();
    expect(document.body.style.overflow).toBe('');
  });
});
