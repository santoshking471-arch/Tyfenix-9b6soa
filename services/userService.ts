import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  name?: string;
  is_admin?: boolean;
  created_at?: string;
}

export async function fetchAllUsers() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('id', { ascending: false });
  if (error) throw error;
  return data as UserProfile[];
}

export async function updateUserProfile(id: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as UserProfile;
}

export async function fetchCurrentUser(id: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as UserProfile;
}
