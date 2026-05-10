/**
 * storage.service.js — Manejo de bucket de imágenes.
 */
window.StorageService = {

  async uploadImage(file) {
    if (!file) return '';

    if (file.size > 5 * 1024 * 1024) throw new Error('La imagen no puede superar 5MB.');
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) throw new Error('Solo se permiten imágenes JPG, PNG o WEBP.');

    const ext = file.type.split('/')[1];
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await sb.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = sb.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  }
};
