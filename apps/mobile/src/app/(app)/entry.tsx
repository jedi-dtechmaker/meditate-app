import { Redirect } from 'expo-router';
import { useData } from '@/providers/data';

export default function AccountEntry() {
  const { profile } = useData();
  return <Redirect href={profile.onboarded ? '/(app)/(tabs)' : '/(app)/onboarding'} />;
}
