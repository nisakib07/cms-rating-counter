'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SUPER_ADMIN_EMAILS, ADMIN_ROLES } from '@/types/database';
import type { Session, User } from '@supabase/supabase-js';

type AccessLevel = 'super_admin' | 'admin' | 'member' | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  accessLevel: AccessLevel;
  memberName: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(null);
  const [memberName, setMemberName] = useState<string | null>(null);

  // Check user's access level by looking up their email in the members table
  const checkAccessLevel = useCallback(async (email: string | undefined) => {
    if (!email) {
      setAccessLevel(null);
      setMemberName(null);
      return;
    }

    // Super admins always have access
    if (SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
      setAccessLevel('super_admin');
      setMemberName(null); // They might not be in members table
      
      // Still try to get their name from members table
      const { data } = await supabase
        .from('members')
        .select('name')
        .eq('email', email)
        .single();
      if (data) setMemberName(data.name);
      return;
    }

    // Check if user exists in members table with an admin role
    const { data: member } = await supabase
      .from('members')
      .select('name, role')
      .eq('email', email)
      .single();

    if (member && ADMIN_ROLES.includes(member.role as typeof ADMIN_ROLES[number])) {
      setAccessLevel('admin');
      setMemberName(member.name);
    } else if (member) {
      setAccessLevel('member');
      setMemberName(member.name);
    } else {
      setAccessLevel(null);
      setMemberName(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkAccessLevel(session?.user?.email).then(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkAccessLevel(session?.user?.email).then(() => setLoading(false));
    });

    return () => subscription.unsubscribe();
  }, [checkAccessLevel]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAccessLevel(null);
    setMemberName(null);
  };

  const isAdmin = accessLevel === 'admin' || accessLevel === 'super_admin';
  const isSuperAdminFlag = accessLevel === 'super_admin';

  return (
    <AuthContext.Provider value={{
      session, user, loading, accessLevel, memberName,
      isAdmin, isSuperAdmin: isSuperAdminFlag,
      signIn, signUp, signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
