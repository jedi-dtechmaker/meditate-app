import { supabase } from './supabase';
import { stopSync } from './sync';
import { clearUser } from './database';
import { cancelReminder } from './reminders';
export async function signOutAndClear(userId: string) {
  await stopSync(userId);
  const result = await supabase!.auth.signOut({ scope: 'local' });
  if (result.error) throw result.error;
  try { await cancelReminder(userId); } finally { await clearUser(userId); }
}
