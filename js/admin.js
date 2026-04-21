/**
 * admin.js — Orquestador del panel administrativo.
 * Depende de (en orden): supabase CDN, supabase-config.js,
 *   core/supabase-client.js, services/*.js, ui/toast.js,
 *   ui/confirm-modal.js, ui/image-upload.js
 */

// ── Estado ──
let _allProducts = [];

// ── Refs DOM ──
const loginSection     = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm        = document.getElementById('login-form');
const productForm      = document.getElementById('product-form');
const categoryForm     = document.getElementById('category-form');
const userInfo         = document.getElementById('user-info');
const userEmailEl      = document.getElementById('user-email');
const userAvatarEl     = document.getElementById('user-avatar');
const categorySelect   = document.getElementById('p-category');
const categoriesList   = document.getElementById('categories-list');
const catCountBadge    = document.getElementById('cat-count-badge');
const activeCheckbox   = document.getElementById('p-active');
const toggleLabelText  = document.getElementById('toggle-label-text');
const searchInput      = document.getElementById('inventory-search');

// ── Inicialización de componentes UI ──
initConfirmModal();

const imageUpload = initImageUpload({
  dropAreaId:      'drop-area',
  fileInputId:     'p-image',
  previewImgId:    'preview-img',
  uploadInnerId:   'upload-inner',
  uploadPreviewId: 'upload-preview',
});

activeCheckbox?.addEventListener('change', () => {
  if (toggleLabelText) {
    toggleLabelText.textContent = activeCheckbox.checked
      ? 'Visible'
      : 'Oculto';
  }
});

// ══════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════
sb.auth.onAuthStateChange((_, session) => {
  session ? showDashboard(session.user) : showLogin();
});

function showDashboard(user) {
  loginSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  userInfo.classList.remove('hidden');
  userEmailEl.textContent  = user.email;
  userAvatarEl.textContent = user.email.charAt(0).toUpperCase();
  loadCategories();
  loadProducts();
}

function showLogin() {
  loginSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
  userInfo.classList.add('hidden');
}

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn      = document.getElementById('btn-login');
  const errorDiv = document.getElementById('login-error');
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  btn.textContent = 'Verificando...';
  btn.disabled    = true;
  errorDiv.classList.add('hidden');

  const { error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    errorDiv.textContent = '❌ ' + translateAuthError(error.message);
    errorDiv.classList.remove('hidden');
    btn.textContent = 'Iniciar sesión';
    btn.disabled    = false;
  }
});

async function signOut() {
  await sb.auth.signOut();
  showToast('👋 Sesión cerrada correctamente');
}

function translateAuthError(msg) {
  const map = {
    'Invalid login credentials': 'Correo o contraseña incorrectos.',
    'Email not confirmed':       'Confirma tu correo electrónico primero.',
    'Too many requests':         'Demasiados intentos. Espera un momento.',
  };
  return map[msg] || msg;
}

function togglePassword() {
  const input = document.getElementById('password');
  const icon  = document.getElementById('eye-icon');
  if (input.type === 'password') {
    input.type     = 'text';
    icon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
  } else {
    input.type     = 'password';
    icon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  }
}

function toggleCheckbox() {
  const checkbox = document.querySelector('.checkbox-custom');
  const hiddenInput = document.getElementById('remember-me');
  checkbox.classList.toggle('checked');
  if (hiddenInput) {
    hiddenInput.checked = checkbox.classList.contains('checked');
  }
}

// ══════════════════════════════════════════
// TABS
// ══════════════════════════════════════════
function switchTab(tabId, btnEl) {
  document.querySelectorAll('.tab-content').forEach((t) => {
    t.classList.remove('active');
    t.classList.add('hidden');
  });
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));

  const target = document.getElementById('tab-' + tabId);
  target?.classList.remove('hidden');
  target?.classList.add('active');
  btnEl.classList.add('active');

  if (tabId === 'inventory')  loadProducts();
  if (tabId === 'categories') loadCategories();
  if (tabId === 'settings')   loadConfigForm();
}

// ══════════════════════════════════════════
// CATEGORÍAS
// ══════════════════════════════════════════
async function loadCategories() {
  try {
    const cats = await CategoryService.getAll();
    renderCategorySelect(cats);
    renderCategoryList(cats);
  } catch (err) {
    console.error('Error cargando categorías:', err.message);
  }
}

function renderCategorySelect(categories) {
  categorySelect.innerHTML =
    '<option value="">Seleccionar categoría...</option>' +
    categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
}

function renderCategoryList(categories) {
  catCountBadge.textContent = categories.length;

  if (!categories.length) {
    categoriesList.innerHTML = `
      <div class="empty-state">
        <span>🏷️</span>
        <p>No hay categorías. ¡Crea la primera!</p>
      </div>`;
    return;
  }

  categoriesList.innerHTML = categories.map((cat) => {
    const date = new Date(cat.created_at).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
    return `
      <div class="cat-item" id="cat-${cat.id}">
        <div class="cat-item-info">
          <div class="cat-dot"></div>
          <div>
            <div class="cat-item-name">${cat.name}</div>
            <div class="cat-item-date">Creada el ${date}</div>
          </div>
        </div>
        <button class="cat-item-delete"
          onclick="confirmDeleteCategory('${cat.id}', '${escapeAttr(cat.name)}')"
          title="Eliminar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>`;
  }).join('');
}

categoryForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn  = document.getElementById('btn-save-cat');
  const name = document.getElementById('cat-name').value.trim();
  if (!name) return;

  btn.disabled    = true;
  btn.textContent = 'Creando...';

  try {
    await CategoryService.create(name);
    showToast('🏷️ Categoría creada exitosamente');
    categoryForm.reset();
    await loadCategories();
  } catch (err) {
    showToast('❌ ' + err.message, true);
  } finally {
    btn.disabled  = false;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Crear Categoría`;
  }
});

function confirmDeleteCategory(id, name) {
  showConfirm({
    title:   '¿Eliminar categoría?',
    message: `Vas a eliminar "${name}". Los productos quedarán sin clasificar.`,
    onConfirm: async () => {
      try {
        await CategoryService.delete(id);
        showToast('🗑️ Categoría eliminada');
        await loadCategories();
      } catch {
        showToast('❌ No se puede eliminar. Puede tener productos asignados.', true);
      }
    },
  });
}

// ══════════════════════════════════════════
// PRODUCTOS
// ══════════════════════════════════════════
productForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-save');
  btn.disabled  = true;
  btn.innerHTML = `<svg width="18" height="18" class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Guardando...`;

  try {
    const name       = document.getElementById('p-name').value.trim();
    const desc       = document.getElementById('p-desc').value.trim();
    const price      = parseFloat(document.getElementById('p-price').value) || 0;
    const categoryId = document.getElementById('p-category').value;
    const active     = activeCheckbox ? activeCheckbox.checked : true;

    if (!name)       throw new Error('El nombre del producto es obligatorio.');
    if (!categoryId) throw new Error('Selecciona una categoría.');

    const file     = imageUpload.getFile();
    const imageUrl = file ? await StorageService.uploadImage(file) : '';

    await ProductService.create({ name, description: desc, price, categoryId, imageUrl, active });

    showToast('✅ ¡Producto guardado en el catálogo!');
    resetProductForm();

    const tabInventory = document.getElementById('tab-inventory');
    if (!tabInventory?.classList.contains('hidden')) await loadProducts();

  } catch (err) {
    showToast('❌ ' + err.message, true);
  } finally {
    btn.disabled  = false;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Guardar Producto`;
  }
});

function resetProductForm() {
  productForm?.reset();
  imageUpload.reset();
  if (activeCheckbox)   activeCheckbox.checked   = true;
  if (toggleLabelText) toggleLabelText.textContent = 'Activo (visible en catálogo)';
}

async function loadProducts() {
  const tbody = document.getElementById('products-list');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-dim)">Cargando inventario...</td></tr>`;
  try {
    _allProducts = await ProductService.getAll();
    renderInventory(_allProducts);
  } catch {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--danger);padding:2rem">Error al cargar el inventario.</td></tr>`;
  }
}

function renderInventory(products) {
  const tbody      = document.getElementById('products-list');
  const emptyState = document.getElementById('inventory-empty');

  if (!products.length) {
    tbody.innerHTML = '';
    emptyState?.classList.remove('hidden');
    return;
  }
  emptyState?.classList.add('hidden');

  const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  tbody.innerHTML = products.map((p) => {
    const thumb = p.image_url || `https://placehold.co/48x48/1c1c2e/f472b6?text=${encodeURIComponent(p.name.charAt(0))}`;
    const badge = p.active
      ? `<span class="status-badge status-active">● Activo</span>`
      : `<span class="status-badge status-inactive">● Inactivo</span>`;
    const desc = p.description
      ? p.description.slice(0, 45) + (p.description.length > 45 ? '...' : '')
      : '\u2014';
    const pData = escapeAttr(JSON.stringify({
      id: p.id, name: p.name, description: p.description || '',
      price: p.price, categoryId: p.category_id || '',
      imageUrl: p.image_url || '', active: p.active,
    }));

    return `
      <tr>
        <td><img src="${thumb}" class="p-thumb" alt="${p.name}"
            onerror="this.src='https://placehold.co/48x48/1c1c2e/f472b6?text=?'"></td>
        <td>
          <strong style="color:var(--text-primary)">${p.name}</strong><br>
          <small style="color:var(--text-dim)">${desc}</small>
        </td>
        <td style="color:var(--text-muted)">${(p.categories && p.categories.name) || '\u2014'}</td>
        <td style="font-weight:700;color:var(--accent2)">${fmt.format(p.price)}</td>
        <td>${badge}</td>
        <td>
          <div class="tbl-actions">
            <button class="btn-tbl-edit" onclick="openEditModal('${pData}')" title="Editar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn-tbl-delete" onclick="confirmDeleteProduct('${p.id}', '${escapeAttr(p.name)}')" title="Eliminar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function filterInventory() {
  const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const filtered = q
    ? _allProducts.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        ((p.categories && p.categories.name) || '').toLowerCase().includes(q)
      )
    : _allProducts;
  renderInventory(filtered);
}

function confirmDeleteProduct(id, name) {
  showConfirm({
    title:   '¿Eliminar producto?',
    message: `Vas a eliminar "${name}" del catálogo. Esta acción no se puede deshacer.`,
    onConfirm: async () => {
      try {
        await ProductService.delete(id);
        showToast('🗑️ Producto eliminado del catálogo');
        await loadProducts();
      } catch (err) {
        showToast('❌ Error al eliminar: ' + err.message, true);
      }
    },
  });
}

// ── Utilidades ──
function escapeAttr(str) {
  return str.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

// ══════════════════════════════════════════
// CONFIGURACIÓN
// ══════════════════════════════════════════
function loadConfigForm() {
  if (typeof ConfigService === 'undefined') return;
  const cfg = ConfigService.get();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

  set('cfg-name',       cfg.storeName);
  set('cfg-city',       cfg.city);
  set('cfg-instagram',  cfg.instagram);
  // Número de WA: quitar prefijo 57 para mostrar solo el local
  set('cfg-wa',         cfg.waNumber.replace(/^57/, ''));
  set('cfg-shipping',   cfg.shippingMsg);
  set('cfg-hero-title', cfg.heroTitle);
  set('cfg-hero-sub',   cfg.heroSubtitle);
}

function saveConfig() {
  const get = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };

  const waRaw = get('cfg-wa').replace(/\D/g, '');
  if (!waRaw || waRaw.length < 7) {
    showToast('El número de WhatsApp no es válido.', true);
    return;
  }

  ConfigService.save({
    storeName:    get('cfg-name')       || 'LupeOutfit',
    city:         get('cfg-city')       || 'Medellín',
    instagram:    get('cfg-instagram'),
    waNumber:     '57' + waRaw,
    shippingMsg:  get('cfg-shipping')   || '* Envío gratis en Medellín',
    heroTitle:    get('cfg-hero-title') || 'Tu Estilo, Tu Regla.',
    heroSubtitle: get('cfg-hero-sub')   || '',
  });

  showToast('Configuración guardada. Recarga el catálogo para ver los cambios.');
}

function resetConfig() {
  ConfigService.reset();
  loadConfigForm();
  showToast('Configuración restablecida a los valores por defecto.');
}

// ══════════════════════════════════════════
// MODAL DE EDICIÓN
// ══════════════════════════════════════════
let _editingProduct = null;

function openEditModal(dataStr) {
  _editingProduct = JSON.parse(dataStr.replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
  const p = _editingProduct;

  // Llenar campos
  document.getElementById('edit-name').value        = p.name;
  document.getElementById('edit-desc').value        = p.description;
  document.getElementById('edit-price').value      = p.price;
  document.getElementById('edit-active').checked   = p.active;

  // Llenar select con opciones actuales
  const sel = document.getElementById('edit-category');
  sel.innerHTML = '<option value="">Sin categoría</option>' +
    Array.from(document.getElementById('p-category').options)
      .filter(o => o.value)
      .map(o => `<option value="${o.value}" ${o.value === p.categoryId ? 'selected' : ''}>${o.text}</option>`)
      .join('');

  // Mostrar imagen actual
  const preview = document.getElementById('edit-img-preview');
  if (p.imageUrl) {
    preview.src = p.imageUrl;
    preview.classList.remove('hidden');
  } else {
    preview.classList.add('hidden');
  }

  document.getElementById('edit-modal-overlay').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('edit-modal-overlay').classList.add('hidden');
  _editingProduct = null;
}

async function saveEditProduct() {
  if (!_editingProduct) return;
  const btn = document.getElementById('btn-edit-save');
  btn.disabled  = true;
  btn.innerHTML = `<svg width="16" height="16" class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Guardando...`;

  try {
    const name       = document.getElementById('edit-name').value.trim();
    const desc       = document.getElementById('edit-desc').value.trim();
    const price      = parseFloat(document.getElementById('edit-price').value) || 0;
    const categoryId = document.getElementById('edit-category').value;
    const active     = document.getElementById('edit-active').checked;

    if (!name) throw new Error('El nombre es obligatorio.');

    await ProductService.update(_editingProduct.id, { name, description: desc, price, categoryId, active });

    showToast('✅ Producto actualizado');
    closeEditModal();
    await loadProducts();
  } catch (err) {
    showToast('❌ ' + err.message, true);
  } finally {
    btn.disabled  = false;
    btn.innerHTML = 'Guardar';
  }
}

// ══════════════════════════════════════════
// MENÚ HAMBURGUESA (MÓVIL)
// ══════════════════════════════════════════
function toggleMobileNav() {
  const nav     = document.getElementById('mobile-nav');
  const overlay = document.getElementById('mobile-nav-overlay');
  const btn     = document.getElementById('hamburger-btn');

  const isOpen = nav.classList.contains('visible');
  if (isOpen) {
    closeMobileNav();
  } else {
    nav.classList.add('visible');
    overlay.classList.add('visible');
    btn.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeMobileNav() {
  const nav     = document.getElementById('mobile-nav');
  const overlay = document.getElementById('mobile-nav-overlay');
  const btn     = document.getElementById('hamburger-btn');

  if (nav) nav.classList.remove('visible');
  if (overlay) overlay.classList.remove('visible');
  if (btn) btn.classList.remove('open');
  document.body.style.overflow = '';
}

function switchTabMobile(tabId, clickedBtn) {
  // 1. Cambiar tab activo en el menú móvil
  document.querySelectorAll('.mobile-tab-btn').forEach(b => b.classList.remove('active'));
  if (clickedBtn) clickedBtn.classList.add('active');

  // 2. Reusar la lógica del switchTab original (también actualiza tabs de desktop)
  const desktopBtn = document.querySelector(`.tab-btn[onclick*="'${tabId}'"]`);
  switchTab(tabId, desktopBtn);

  // 3. Cerrar el menú
  closeMobileNav();
}

// Cerrar menú con tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMobileNav();
});
