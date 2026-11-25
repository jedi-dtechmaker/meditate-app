import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { BIBLE_TRANSLATIONS, getBibleBooks, getBibleChapter, searchFullBible } from '../bibleService.ts';
import { TRANSLATIONS } from '../shared/domain.ts';
import { recordChangeSchema } from '../shared/validation.ts';
import { createAuthenticator, requireAuth, type Authenticate, type AuthContext } from './auth.ts';
import { asyncRoute, errorHandler, HttpError } from './errors.ts';
import { mountAiRoutes } from './ai.ts';

export interface ApiConfig {
  supabaseUrl?: string; supabaseKey?: string; serviceRoleKey?: string; geminiKey?: string;
  chatModel?: string; ttsModel?: string; transcriptionModel?: string; dailyAiCredits?: number;
  allowedOrigins?: string[]; trustProxy?: number;
}
export function createApp(config: ApiConfig, authenticate?: Authenticate) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy || false);
  app.use(helmet());
  app.use(cors({ origin: config.allowedOrigins?.length ? config.allowedOrigins : false }));
  app.get('/api/health', (_req, res) => res.json({ ok: true, accountsConfigured: Boolean(config.supabaseUrl && config.supabaseKey) }));
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Please wait a moment before trying again.' } }));
  app.use('/api', requireAuth(authenticate || createAuthenticator({ url: config.supabaseUrl, publicKey: config.supabaseKey }),
    Boolean(authenticate || (config.supabaseUrl && config.supabaseKey))));
  app.use('/api/transcribe', express.json({ limit: '12mb' }));
  app.use('/api', express.json({ limit: '128kb' }));
  app.get('/api/capabilities', (_req, res) => res.json({
    ai: Boolean(config.geminiKey), accountDeletion: Boolean(config.serviceRoleKey), translations: TRANSLATIONS,
  }));
  app.get('/api/sync', asyncRoute(async (req, res) => {
    const after = z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).parse(req.query.after ?? 0);
    const { db, user } = res.locals.auth as AuthContext;
    const { data, error } = await db.from('user_records').select('id,kind,data,deleted,version,updated_at')
      .eq('user_id', user.id).gt('version', after).order('version').limit(200);
    if (error) throw new HttpError(503, 'Cloud sync is unavailable. Your changes remain saved on this device.');
    res.json({ records: data, cursor: data?.at(-1)?.version ?? after, hasMore: data?.length === 200 });
  }));
  app.put('/api/records', asyncRoute(async (req, res) => {
    const change = recordChangeSchema.parse(req.body);
    const { db, user } = res.locals.auth as AuthContext;
    if (change.kind === 'profile' && (change.id !== user.id || change.deleted)) throw new HttpError(400, 'Invalid profile.');
    const { data, error } = await db.rpc('apply_record_change', {
      p_kind: change.kind, p_id: change.id, p_data: change.data, p_deleted: change.deleted,
      p_base_version: change.baseVersion, p_mutation_id: change.mutationId,
    });
    if (error) throw new HttpError(503, 'We could not sync this change yet. It remains saved on this device.');
    res.status(data.status === 'conflict' ? 409 : 200).json(data);
  }));
  app.delete('/api/account', asyncRoute(async (req, res) => {
    if (!config.serviceRoleKey || !config.supabaseUrl) throw new HttpError(503, 'Account deletion is temporarily unavailable. Please try again later.');
    const { user } = res.locals.auth as AuthContext;
    const password = z.string().min(8).max(1024).parse(req.body?.password);
    if (!user.email || !config.supabaseKey) throw new HttpError(400, 'This account cannot use password confirmation.');
    const verifier = createClient(config.supabaseUrl, config.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const verification = await verifier.auth.signInWithPassword({ email: user.email, password });
    if (verification.error || verification.data.user?.id !== user.id) throw new HttpError(403, 'The account password was not correct.');
    const admin = createClient(config.supabaseUrl, config.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw new HttpError(503, 'We could not delete your account. Please try again.');
    res.status(204).end();
  }));
  app.get('/api/bible/translations', (_req, res) => res.json({ translations: BIBLE_TRANSLATIONS.filter((t) => t.source === 'local') }));
  app.get('/api/bible/books', (_req, res) => res.json({ books: getBibleBooks() }));
  const translationSchema = z.enum(TRANSLATIONS).default('KJV');
  app.get('/api/bible/chapter', asyncRoute(async (req, res) => {
    const book = z.string().min(1).max(80).parse(req.query.book);
    const chapter = z.coerce.number().int().min(1).max(150).parse(req.query.chapter);
    const result = await getBibleChapter(book, chapter, translationSchema.parse(req.query.translation));
    if (!result || result.chapter !== chapter) throw new HttpError(404, 'This chapter could not be found.');
    res.json(result);
  }));
  app.get('/api/bible-search', asyncRoute(async (req, res) => {
    const query = z.string().trim().min(2).max(150).parse(req.query.q);
    res.json(await searchFullBible(query, translationSchema.parse(req.query.translation), 40));
  }));
  mountAiRoutes(app, config);
  app.use((_req, res) => res.status(404).json({ error: 'This endpoint does not exist.' }));
  app.use(errorHandler);
  return app;
}
