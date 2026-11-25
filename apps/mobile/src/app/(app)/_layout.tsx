import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { DataProvider, useData } from '@/providers/data';
import { useAuth } from '@/providers/auth';
import { BrandLoading, Button, Copy, Page, Title, useDesign } from '@/components/ui';
import { cancelReminder, scheduleReminder } from '@/lib/reminders';
import { signOutAndClear } from '@/lib/account';
import { FloatingCompanion } from '@/components/floating-companion';
import { MeditationPlayer } from '@/components/meditation-player';

function AccountRoutes() {
  const { loading, bootError, sync, profile } = useData();
  const { session } = useAuth();
  const { setMode } = useDesign();
  const pathname = usePathname();
  const [playerMounted, setPlayerMounted] = useState(false);
  // Once opened, keep the audio players mounted while the user visits other screens.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (pathname === '/meditate') setPlayerMounted(true); }, [pathname]);
  useEffect(() => { setMode(profile.theme); }, [profile.theme, setMode]);
  useEffect(() => {
    if (!profile.onboarded || !session) return;
    if (profile.reminderEnabled) void scheduleReminder(session.user.id, profile.reminderHour, profile.reminderMinute).catch(() => {});
    else void cancelReminder(session.user.id).catch(() => {});
  }, [profile.onboarded, profile.reminderEnabled, profile.reminderHour, profile.reminderMinute, session]);
  if (loading) return <BrandLoading />;
  if (bootError) return <Page><Title>Let’s reconnect</Title><Copy>{bootError}</Copy>
    <Button title="Try again" onPress={() => { void sync().catch(() => {}); }} />
    <Button secondary title="Sign out" onPress={() => { void signOutAndClear(session!.user.id); }} /></Page>;
  return <View style={{ flex: 1 }}><Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="entry" />
    <Stack.Protected guard={!profile.onboarded}><Stack.Screen name="onboarding" /></Stack.Protected>
    <Stack.Protected guard={profile.onboarded}>
      <Stack.Screen name="(tabs)" /><Stack.Screen name="meditate" /><Stack.Screen name="completed" />
      <Stack.Screen name="settings" /><Stack.Screen name="explore" /><Stack.Screen name="journal/[id]" />
    </Stack.Protected>
  </Stack>{profile.onboarded && playerMounted && <MeditationPlayer visible={pathname === '/meditate'} onCompleted={() => setPlayerMounted(false)} />}
    {profile.onboarded && <FloatingCompanion />}</View>;
}
export default function AppLayout() {
  const { session } = useAuth();
  return <DataProvider key={session!.user.id}><AccountRoutes /></DataProvider>;
}
