import { useState } from 'react';
import { Text, View } from 'react-native';
import { Leaf } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { authRedirect, configured } from '@/lib/config';
import { Button, Card, Chip, Copy, Field, Notice, Page, styles, Title, useDesign } from '@/components/ui';
import { useAuth } from '@/providers/auth';

export default function SignIn() {
  const { colors } = useDesign();
  const router = useRouter();
  const { error: restoreError } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'forgot'>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const submit = async () => {
    setError(null); setMessage(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (mode !== 'forgot' && password.length < 8) { setError('Use a password with at least 8 characters.'); return; }
    if (mode === 'sign-up' && !name.trim()) { setError('What would you like us to call you?'); return; }
    setBusy(true);
    try {
      if (!supabase) throw new Error('Account services are temporarily unavailable.');
      if (mode === 'forgot') {
        const result = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${authRedirect}?intent=recovery` });
        if (result.error) throw result.error;
        setMessage('If an account exists for this email, a password reset link is on its way. Open it on this phone.');
      } else if (mode === 'sign-up') {
        const result = await supabase.auth.signUp({ email: email.trim(), password,
          options: { data: { name: name.trim() }, emailRedirectTo: authRedirect } });
        if (result.error) throw result.error;
        if (!result.data.session) setMessage('Check your email to confirm your account. Open the confirmation link on this phone, then sign in.');
      } else {
        const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (result.error) throw result.error;
      }
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'We could not continue. Please try again.'); }
    finally { setBusy(false); }
  };
  return <Page>
    <View style={{ paddingTop: 24, gap: 22 }}>
      <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: colors.soft, justifyContent: 'center', alignItems: 'center' }}><Leaf color={colors.green} size={32} /></View>
      <Title eyebrow="Meditate on the Word">A little stillness.{'\n'}A deeper connection.</Title>
      <Copy muted>A personal space for Scripture, prayer, and the moments you share with God.</Copy>
    </View>
    <Card>
      <View style={styles.wrap}><Chip title="Sign in" selected={mode === 'sign-in'} onPress={() => { setMode('sign-in'); setError(null); setMessage(null); }} />
        <Chip title="Create account" selected={mode === 'sign-up'} onPress={() => { setMode('sign-up'); setError(null); setMessage(null); }} /></View>
      {mode === 'forgot' && <Copy style={{ fontWeight: '700' }}>Reset your password</Copy>}
      {mode === 'sign-up' && <Field label="Your name" value={name} onChangeText={setName} autoComplete="name" maxLength={60} />}
      <Field label="Email address" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      {mode !== 'forgot' && <Field label="Password" placeholder="At least 8 characters" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} />}
      <Notice error message={error || restoreError} /><Notice message={message} />
      {!configured && <Notice error message="We’re getting your sanctuary ready. Account services are not available yet. Please try again later." />}
      <Button busy={busy} disabled={!configured} title={mode === 'sign-up' ? 'Create my account' : mode === 'forgot' ? 'Send reset link' : 'Welcome back'} onPress={() => void submit()} />
      <Button secondary title={mode === 'forgot' ? 'Back to sign in' : 'Forgot password?'} onPress={() => { setMode(mode === 'forgot' ? 'sign-in' : 'forgot'); setMessage(null); setError(null); }} />
    </Card>
    <Text style={{ textAlign: 'center', color: colors.muted, fontSize: 12, lineHeight: 20 }}>Your reflections, your journey. Sign in to keep them together across your devices.</Text>
    <Button secondary title="How your data is used" onPress={() => router.push('/privacy')} />
  </Page>;
}
