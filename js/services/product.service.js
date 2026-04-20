/**
 * product.service.js — Acceso a datos de productos y categorías.
 * Depende de: window.sb (supabase-client.js)
 */
window.ProductService = {

  /** Todos los productos (activos e inactivos) — para el admin */
  async getAll() {
    const { data, error } = await window.sb
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  /** Solo productos activos — para el catálogo público */
  async getActive() {
    const { data, error } = await window.sb
      .from('products')
      .select('*, categories(name)')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  /** Productos activos filtrados por categoría */
  async getActiveByCategory(categoryId) {
    let query = window.sb
      .from('products')
      .select('*, categories(name)')
      .eq('active', true);

    if (categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  /** Crea un producto nuevo */
  async create({ name, description, price, categoryId, imageUrl, active }) {
    const { data, error } = await window.sb
      .from('products')
      .insert([{
        name,
        description,
        price,
        category_id: categoryId || null,
        image_url:   imageUrl   || null,
        active:      active     ?? true,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Actualiza un producto existente */
  async update(id, { name, description, price, categoryId, imageUrl, active }) {
    const updates = { name, description, price, active };
    if (categoryId !== undefined) updates.category_id = categoryId || null;
    if (imageUrl   !== undefined) updates.image_url   = imageUrl   || null;

    const { data, error } = await window.sb
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Elimina un producto por ID */
  async delete(id) {
    const { error } = await window.sb
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  /** Obtiene las categorías (para el select del formulario) */
  async getCategories() {
    const { data, error } = await window.sb
      .from('categories')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },
};
