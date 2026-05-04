import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/services/supabase';
import { fetchCurrentUser, UserProfile, updateUserProfile } from '@/services/userService';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  operationLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapProfile(profile: UserProfile, email: string): User {
  return {
    id: profile.id,
    name: profile.name || profile.username || email.split('@')[0],
    email: profile.email || email,
    phone: profile.phone,
    avatar: profile.avatar,
    isAdmin: profile.is_admin || false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);

  useEffect(() => {
    // Check current session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const profile = await fetchCurrentUser(session.user.id);
          setUser(mapProfile(profile, session.user.email || ''));
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const profile = await fetchCurrentUser(session.user.id);
          setUser(mapProfile(profile, session.user.email || ''));
        } catch {
          setUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    setOperationLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message };

      if (data.user) {
        const profile = await fetchCurrentUser(data.user.id);
        setUser(mapProfile(profile, email));
      }
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Login failed' };
    } finally {
      setOperationLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    setOperationLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: name, full_name: name } },
      });
      if (error) return { ok: false, error: error.message };

      if (data.user) {
        // Wait for trigger to create the profile row
        await new Promise(r => setTimeout(r, 800));
        // Upsert profile to ensure name is saved
        await supabase.from('user_profiles').upsert({
          id: data.user.id,
          email,
          name,
          username: name,
        }, { onConflict: 'id' });
        // Fetch updated profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();
        if (profile) setUser(mapProfile(profile as UserProfile, email));
        else setUser({ id: data.user.id, name, email, isAdmin: false });
      }
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Signup failed' };
    } finally {
      setOperationLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const updated = await updateUserProfile(user.id, {
      name: data.name,
      phone: data.phone,
      avatar: data.avatar,
    });
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: user !== null,
      isLoading,
      operationLoading,
      login,
      signup,
      logout,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
