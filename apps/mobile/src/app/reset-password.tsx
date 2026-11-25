import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';
import { Button, Field, Notice, Page, Title } from '@/components/ui';
export default function ResetPassword() {
  const { setRecovery } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    if (password.length < 8 || password !== confirmation) { setError('Enter matching passwords with at least 8 characters.'); return; }
    setBusy(true); setError(null);
    try {
      const result = await supabase!.auth.updateUser({ password });
      if (result.error) throw result.error;
      setRecovery(false); router.replace('/(app)/entry');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  return <Page><Title>Choose a new password</Title><Field label="New password" secureTextEntry value={password} onChangeText={setPassword} autoComplete="new-password" />
    <Field label="Confirm password" secureTextEntry value={confirmation} onChangeText={setConfirmation} autoComplete="new-password" />
    <Notice error message={error} /><Button busy={busy} title="Save password" onPress={() => void submit()} /></Page>;
}
