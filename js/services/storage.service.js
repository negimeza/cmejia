/**
 * storage.service.js — Manejo de bucket de imágenes.
 */
window.StorageService = {

  async uploadImage(file) {
    if (!file) return '';

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
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
