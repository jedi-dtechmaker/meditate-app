export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
  apiUrl: (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, ''),
};
export const configured = Boolean(config.supabaseUrl && config.supabaseKey && config.apiUrl);
export const authRedirect = 'meditateword://auth/callback';
