/**
 * admin.js — Orquestador del panel administrativo.
 * Inicializa los módulos correspondientes.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Inicialización de componentes base
  if (window.initConfirmModal) initConfirmModal();
  
  window.imageUpload = initImageUpload({
    dropAreaId:      'drop-area',
    fileInputId:     'p-image',
    previewImgId:    'preview-img',
    uploadInnerId:   'upload-inner',
    uploadPreviewId: 'upload-preview',
  });

  // Inicializar módulos administrativos
  AdminAuth.init();
  AdminUI.init();
  AdminInventory.init();
  AdminEditor.init();
  AdminCategories.init();
  await ConfigService.load();
  BrandConfig.apply();
});

// Exponer funciones globales que se llaman desde el HTML (Legacy support)
window.switchTab       = (id, btn) => AdminUI.switchTab(id, btn);
window.switchTabMobile = (id, btn) => AdminUI.switchTabMobile(id, btn);
window.toggleMobileNav = ()        => AdminUI.toggleMobileNav();
window.signOut         = ()        => AdminAuth.signOut();
window.saveEditProduct = ()        => AdminEditor.saveEdit();
window.closeEditModal  = ()        => AdminEditor.close();
window.resetProductForm = ()       => AdminEditor.reset();
window.removeImage     = (e)       => {
  if (e) e.stopPropagation();
  window.imageUpload?.reset();
};
window.handleEditImageUpload = (i) => AdminEditor.handleImageChange(i);
window.saveConfig      = ()        => AdminSettings.save();
window.resetConfig     = ()        => AdminSettings.reset();
window.togglePassword  = ()        => {
  const input = document.getElementById('password');
  const icon  = document.getElementById('eye-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
  } else {
    input.type = 'password';
    icon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  }
};
