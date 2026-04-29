/**
 * product.service.js — Acceso a datos de productos y categorías.
 * Depende de: window.sb (supabase-client.js)
 */
window.ProductService = {

  /** 
   * Obtiene productos con paginación y búsqueda opcional (para el admin)
   */
  async getAll({ page = 0, pageSize = 20, search = '' } = {}) {
    const from = page * pageSize;
    const to   = from + pageSize - 1;

    let query = window.sb
      .from('products')
      .select('*, categories(name)', { count: 'exact' });

    if (search) {
      // Búsqueda simple por nombre o descripción
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, count };
  },

  /** Solo productos activos — para el catálogo público */
  async getActive(page = 0, pageSize = 12) {
    const from = page * pageSize;
    const to   = from + pageSize - 1;

    const { data, error } = await window.sb
      .from('products')
      .select('*, categories(name)')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return data;
  },

  /** Productos activos filtrados por categoría */
  async getActiveByCategory(categoryId, page = 0, pageSize = 12) {
    const from = page * pageSize;
    const to   = from + pageSize - 1;

    let query = window.sb
      .from('products')
      .select('*, categories(name)')
      .eq('active', true);

    if (categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return data;
  },

  /** Crea un producto nuevo */
  async create({ name, description, price, category_id, image_url, active }) {
    const { data, error } = await window.sb
      .from('products')
      .insert([{
        name,
        description,
        price,
        category_id: category_id || null,
        image_url:   image_url   || null,
        active:      active      ?? true,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Actualiza un producto existente */
  async update(id, updates) {
    console.log('ProductService: Actualizando producto', id, updates);
    const { data, error } = await window.sb
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) {
        console.error('ProductService: Error al actualizar', error);
        throw error;
    }
    return data;
  },

  /** Elimina un producto por ID */
  async delete(id) {
    console.log('ProductService: Intentando eliminar ID:', id);
    const { error } = await window.sb
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('ProductService: Error de Supabase al eliminar:', error);
      throw error;
    }
    console.log('ProductService: Producto eliminado con éxito');
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
