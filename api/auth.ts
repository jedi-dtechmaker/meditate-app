import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { RequestHandler } from 'express';

export interface AuthContext { user: User; db: SupabaseClient; token: string; }
export interface AuthConfig { url?: string; publicKey?: string; }
export type Authenticate = (token: string) => Promise<AuthContext | null>;

export function createAuthenticator(config: AuthConfig): Authenticate {
  return async (token) => {
    if (!config.url || !config.publicKey) return null;
    const db = createClient(config.url, config.publicKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    // Verify with Auth rather than trusting decoded JWT claims.
    const { data, error } = await db.auth.getUser(token);
    return error || !data.user || data.user.is_anonymous || !data.user.email_confirmed_at
      ? null : { user: data.user, db, token };
  };
}
export function requireAuth(authenticate: Authenticate, configured: boolean): RequestHandler {
  return async (req, res, next) => {
    if (!configured) return void res.status(503).json({ error: 'Account services are temporarily unavailable.' });
    const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '');
    if (!match || match[1].length > 8192) return void res.status(401).json({ error: 'Please sign in to continue.' });
    try {
      const auth = await authenticate(match[1]);
      if (!auth) return void res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
      res.locals.auth = auth;
      next();
    } catch { res.status(503).json({ error: 'We could not verify your account. Please try again.' }); }
  };
}
