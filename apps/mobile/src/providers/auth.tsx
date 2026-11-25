import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthState = { session: Session | null; loading: boolean; recovery: boolean; setRecovery: (value: boolean) => void; error: string | null };
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [recovery, setRecovery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError('We could not restore your session. Please sign in again.');
      setSession(data.session); setLoading(false);
    }).catch(() => { if (active) { setError('We could not open your saved session.'); setLoading(false); } });
    const { data } = client.auth.onAuthStateChange((event, value) => {
      if (!active) return;
      setSession(value);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (event === 'SIGNED_OUT') setRecovery(false);
      setLoading(false);
    });
    client.auth.startAutoRefresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') client.auth.startAutoRefresh(); else client.auth.stopAutoRefresh();
    });
    return () => { active = false; data.subscription.unsubscribe(); subscription.remove(); client.auth.stopAutoRefresh(); };
  }, []);
  return <AuthContext.Provider value={{ session, loading, recovery, setRecovery, error }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const state = useContext(AuthContext);
  if (!state) throw new Error('AuthProvider is missing');
  return state;
}
