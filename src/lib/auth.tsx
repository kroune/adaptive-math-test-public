import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { logger } from './logger';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read session immediately from localStorage — no network call, no delay.
    // This is the fast path: if Sonya has a valid stored session the admin UI
    // appears instantly instead of waiting for Supabase to refresh the token.
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);
      logger.info('Auth: initial session (cache)', { hasSession: !!initialSession });
    });

    // onAuthStateChange handles subsequent events: sign-in, sign-out, token refresh.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_IN') {
        setSession(newSession);
        logger.info('Auth: signed in');
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        logger.info('Auth: signed out');
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        logger.info('Auth: token refreshed');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
