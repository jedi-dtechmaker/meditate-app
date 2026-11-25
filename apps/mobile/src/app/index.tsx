import { Redirect } from 'expo-router';
import { useAuth } from '@/providers/auth';
export default function Index() {
  const { session, recovery } = useAuth();
  return <Redirect href={session ? recovery ? '/reset-password' : '/(app)/entry' : '/welcome'} />;
}
