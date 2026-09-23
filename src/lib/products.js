import { supabaseAdmin } from './supabase-admin';

export async function getProducts({ category, search } = {}) {
  if (!supabaseAdmin) return [];
  let query = supabaseAdmin.from('products').select('*').order('created_at', { ascending: false });
  if (category && category !== 'All') query = query.eq('category', category);
  if (search?.trim()) query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
  const { data, error } = await query;
  if (error) console.error('getProducts error:', error.message);
  return data || [];
}

export async function getProduct(id) {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin.from('products').select('*').eq('id', id).single();
  return data;
}

export async function getCategories() {
  const products = await getProducts();
  return ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];
}
