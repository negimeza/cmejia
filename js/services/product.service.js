/**
 * product.service.js — Acceso a datos de productos y categorías.
 * Depende de: window.sb (supabase-client.js)
 */
window.ProductService = {

  /** 
   * Obtiene productos con paginación y búsqueda opcional (para el admin)
   */
  async getAll({ page = 0, pageSize = 20, search = '', sortBy = 'created_at', ascending = false } = {}) {
    const from = page * pageSize;
    const to   = from + pageSize - 1;

    let query = window.sb
      .from('products')
      .select('*, categories(name)', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order(sortBy, { ascending })
      .range(from, to);

    if (error) throw error;
    return { data, count };
  },

  /** Solo productos activos — para el catálogo público */
  async getActive(page = 0, pageSize = 12) {
    const from = page * pageSize;
    const to   = from + pageSize - 1;

    const { data, error, count } = await window.sb
      .from('products')
      .select('*, categories(name)', { count: 'exact' })
      .eq('active', true)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return { data, count };
  },

  /** Productos activos filtrados por categoría */
  async getActiveByCategory(categoryId, page = 0, pageSize = 12) {
    const from = page * pageSize;
    const to   = from + pageSize - 1;

    let query = window.sb
      .from('products')
      .select('*, categories(name)', { count: 'exact' })
      .eq('active', true);

    if (categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return { data, count };
  },

  /** Crea un producto nuevo */
  async create({ name, description, price, category_id, image_url, active }) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('El nombre del producto es obligatorio y debe ser un texto no vacío.');
    }
    if (name.length > 200) {
      throw new Error('El nombre del producto no puede exceder 200 caracteres.');
    }
    if (description && description.length > 2000) {
      throw new Error('La descripción no puede exceder 2000 caracteres.');
    }
    if (typeof price !== 'number' || price < 0) {
      throw new Error('El precio debe ser un número no negativo.');
    }
    if (category_id && typeof category_id !== 'string') {
      throw new Error('El ID de categoría debe ser un texto.');
    }

    const { data, error } = await window.sb
      .from('products')
      .insert([{
        name: name.trim(),
        description: description?.trim() || null,
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
    if (!id) {
      throw new Error('El ID del producto es obligatorio.');
    }
    if (updates.name !== undefined) {
      if (typeof updates.name !== 'string' || updates.name.trim().length === 0) {
        throw new Error('El nombre del producto es obligatorio y debe ser un texto no vacío.');
      }
      if (updates.name.length > 200) {
        throw new Error('El nombre del producto no puede exceder 200 caracteres.');
      }
      updates.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      if (updates.description && updates.description.length > 2000) {
        throw new Error('La descripción no puede exceder 2000 caracteres.');
      }
      updates.description = updates.description?.trim() || null;
    }
    if (updates.price !== undefined) {
      if (typeof updates.price !== 'number' || updates.price < 0) {
        throw new Error('El precio debe ser un número no negativo.');
      }
    }
    if (updates.category_id !== undefined && updates.category_id !== null) {
      if (typeof updates.category_id !== 'string') {
        throw new Error('El ID de categoría debe ser un texto.');
      }
    }

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

    return true;
  },

  /** Archiva un producto (soft delete) */
  async softDelete(id) {
    const { data, error } = await window.sb
      .from('products')
      .update({
        active: false,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Restaura un producto archivado */
  async restore(id) {
    const { data, error } = await window.sb
      .from('products')
      .update({
        active: true,
        deleted_at: null
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Obtiene productos archivados */
  async getDeleted(page = 0, pageSize = 20) {
    const from = page * pageSize;
    const to   = from + pageSize - 1;

    const { data, error, count } = await window.sb
      .from('products')
      .select('*, categories(name)', { count: 'exact' })
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return { data, count };
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
