import { createClient, processLock } from '@supabase/supabase-js';
import { config } from './config';
import { secureStorage } from './secure-storage';

export const supabase = config.supabaseUrl && config.supabaseKey ? createClient(config.supabaseUrl, config.supabaseKey, {
  auth: { storage: secureStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: 'pkce', lock: processLock },
}) : null;
