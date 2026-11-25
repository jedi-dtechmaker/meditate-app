import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/providers/auth';
import { BrandLoading, Button, Copy, DesignProvider, Page, Title } from '@/components/ui';
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <SafeAreaProvider><DesignProvider><Page><Title>Let’s take a breath.</Title>
    <Copy>We could not open this part of your sanctuary. Please try again.</Copy><Button title="Try again" onPress={retry} />
  </Page></DesignProvider></SafeAreaProvider>;
}

function Routes() {
  const { session, loading, recovery } = useAuth();
  if (loading) return <BrandLoading />;
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="index" />
    <Stack.Screen name="auth/callback" />
    <Stack.Screen name="privacy" />
    <Stack.Protected guard={!session}><Stack.Screen name="welcome" /><Stack.Screen name="sign-in" /></Stack.Protected>
    <Stack.Protected guard={Boolean(session) && recovery}><Stack.Screen name="reset-password" /></Stack.Protected>
    <Stack.Protected guard={Boolean(session) && !recovery}><Stack.Screen name="(app)" /></Stack.Protected>
  </Stack>;
}
export default function RootLayout() {
  return <SafeAreaProvider><DesignProvider><AuthProvider><Routes /></AuthProvider></DesignProvider></SafeAreaProvider>;
}
