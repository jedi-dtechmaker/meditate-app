import type { ExpoConfig } from 'expo/config';

const production = process.env.EAS_BUILD_PROFILE === 'production';
if (production) {
  for (const name of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'EXPO_PUBLIC_API_URL']) {
    if (!process.env[name] || process.env[name]?.includes('YOUR_')) throw new Error(`Set ${name} before building for production`);
  }
  if (!process.env.EXPO_PUBLIC_API_URL?.startsWith('https://')) throw new Error('Production requires an HTTPS API URL');
}
const config: ExpoConfig = {
  name: 'Meditate on the Word', slug: 'meditate-on-the-word', owner: 'jedidtechmakers-team', version: '1.0.0',
  scheme: 'meditateword', orientation: 'portrait', userInterfaceStyle: 'automatic',
  icon: './assets/images/temporary-logo.png',
  android: { package: 'com.dabbie.meditateword', softwareKeyboardLayoutMode: 'resize',
    adaptiveIcon: { foregroundImage: './assets/images/temporary-logo.png', backgroundColor: '#ffca00' },
    permissions: ['POST_NOTIFICATIONS'],
  },
  ios: { bundleIdentifier: 'com.dabbie.meditateword', supportsTablet: true },
  web: { output: 'static', favicon: './assets/images/temporary-logo.png' },
  extra: { eas: { projectId: '33e3dd6f-3b4d-434f-ac5b-cf249f6c4dc9' } },
  plugins: ['expo-router', 'expo-secure-store', 'expo-sqlite', 'expo-notifications',
    ['expo-audio', { microphonePermission: 'Allow Meditate on the Word to transcribe your spoken reflections.', enableBackgroundPlayback: true, enableBackgroundRecording: false }],
    ['expo-splash-screen', { backgroundColor: '#ffca00', image: './assets/images/temporary-logo.png', imageWidth: 220 }],
    ['./plugins/with-development-network', { enabled: !production }],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
};
export default config;
