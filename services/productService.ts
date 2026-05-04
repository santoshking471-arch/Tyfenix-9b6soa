import { supabase } from './supabase';

export interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number;
  discount: number;
  rating: number;
  reviews: number;
  category: string;
  category_id: string;
  image: string;
  images: string[];
  description: string;
  brand: string;
  in_stock: boolean;
  badge?: string;
  tags: string[];
  sold: number;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  product_count: number;
}

export async function fetchProducts(filters?: {
  search?: string;
  categoryId?: string;
  minRating?: number;
}) {
  let query = supabase.from('products').select('*').order('sold', { ascending: false });

  if (filters?.categoryId && filters.categoryId !== 'all') {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`);
  }
  if (filters?.minRating) {
    query = query.gte('rating', filters.minRating);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Product[];
}

export async function fetchProductById(id: string) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Product;
}

export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data as Category[];
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('products').insert(product).select().single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function createCategory(cat: Omit<Category, 'product_count'>) {
  const { data, error } = await supabase.from('categories').insert({ ...cat, product_count: 0 }).select().single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(id: string, updates: Partial<Category>) {
  const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}
