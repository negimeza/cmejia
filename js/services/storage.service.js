/**
 * storage.service.js — Manejo de bucket de imágenes.
 */
window.StorageService = {

  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],

  async uploadImage(file) {
    if (!file) return '';

    if (file.size > this.MAX_SIZE) {
      throw new Error(`La imagen supera el límite permitido (${(this.MAX_SIZE / 1024 / 1024).toFixed(0)}MB).`);
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Formato no permitido. Use JPG, PNG, WEBP o AVIF.');
    }

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
