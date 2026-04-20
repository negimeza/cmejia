/**
 * category.service.js — CRUD de categorías.
 */
window.CategoryService = {

  async getAll() {
    const { data, error } = await sb
      .from('categories')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },

  async create(name) {
    const { error } = await sb.from('categories').insert([{ name }]);
    if (error) throw error;
  },

  async delete(id) {
    const { error } = await sb.from('categories').delete().eq('id', id);
    if (error) throw error;
  }
};
