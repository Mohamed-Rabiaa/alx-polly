"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/app/lib/supabase';
import type { User } from '@supabase/supabase-js';



type MaybeSession = User | null;

const AuthContext = createContext<{ user: MaybeSession, signOut: () => void }>({ user: null, signOut: () => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<MaybeSession>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);