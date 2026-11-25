import { useEffect, useRef, useState } from 'react';
import { useURL } from 'expo-linking';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';
import { Button, Loading, Notice, Page, Title } from '@/components/ui';

export default function Callback() {
  const url = useURL();
  const router = useRouter();
  const { setRecovery } = useAuth();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!url || started.current) return;
    started.current = true;
    (async () => {
      const parsed = new URL(url);
      const params = new URLSearchParams(`${parsed.search.slice(1)}&${parsed.hash.slice(1)}`);
      if (params.get('error_description')) throw new Error('This link has expired or is invalid. Please request a new one.');
      const recovery = params.get('intent') === 'recovery' || params.get('type') === 'recovery';
      setRecovery(recovery);
      const code = params.get('code');
      if (!supabase || !code) throw new Error('This link could not be opened. Please return to sign in, or request a new link.');
      const result = await supabase.auth.exchangeCodeForSession(code);
      if (result.error) throw new Error('Open this link on the phone where you requested it. If your email is confirmed, you can return to sign in.');
      router.replace(recovery ? '/reset-password' : '/(app)/entry');
    })().catch((failure: Error) => setError(failure.message));
  }, [router, setRecovery, url]);
  if (!error) return <Loading message="Confirming your account…" />;
  return <Page><Title>Let’s try that again</Title><Notice error message={error} /><Button title="Continue" onPress={() => { setRecovery(false); router.replace('/'); }} /></Page>;
}
