import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { once } from 'node:events';
import type { Server } from 'node:http';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createApp } from '../api/app.ts';
import { createAuthenticator } from '../api/auth.ts';
import { defaultProfile, TRANSLATIONS } from '../shared/domain.ts';

const userId = 'a737b998-b84f-4a8c-9be7-98c14612d323';
let server: Server;
let base: string;
let selectedUser: unknown;
let calls: { name: string; args: unknown }[] = [];
const db = {
  from() {
    const query = { select() { return query; }, eq(_field: string, value: unknown) { selectedUser = value; return query; },
      gt() { return query; }, order() { return query; }, async limit() { return { data: [], error: null }; } };
    return query;
  },
  async rpc(name: string, args: unknown) { calls.push({ name, args }); return { data: { status: 'accepted', record: {} }, error: null }; },
} as unknown as SupabaseClient;
before(async () => {
  server = createApp({}, async (token) => token === 'valid-test-session' ? { user: { id: userId } as User, db, token } : null).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string'); base = `http://127.0.0.1:${address.port}`;
});
after(async () => { server?.closeAllConnections(); await new Promise<void>((resolve) => server?.close(() => resolve())); });
const headers = { Authorization: 'Bearer valid-test-session', 'Content-Type': 'application/json' };
test('personal data and AI routes require a verified session', async () => {
  for (const path of ['/api/sync', '/api/bible/books', '/api/capabilities']) {
    assert.equal((await fetch(base + path)).status, 401);
    assert.equal((await fetch(base + path, { headers: { Authorization: 'Bearer invalid-session' } })).status, 401);
  }
  assert.equal((await fetch(base + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
});
test('sync queries always use the verified account identity', async () => {
  const response = await fetch(base + '/api/sync?user_id=someone-else', { headers });
  assert.equal(response.status, 200); assert.equal(selectedUser, userId);
});
test('one account cannot update another account profile', async () => {
  calls = [];
  const response = await fetch(base + '/api/records', { method: 'PUT', headers, body: JSON.stringify({
    id: 'b737b998-b84f-4a8c-9be7-98c14612d323', kind: 'profile', data: { ...defaultProfile('Reader'), onboarded: true }, deleted: false, baseVersion: 0, mutationId: userId,
  }) });
  assert.equal(response.status, 400); assert.equal(calls.length, 0);
});
test('invalid records and unsupported translations fail explicitly', async () => {
  assert.equal((await fetch(base + '/api/records', { method: 'PUT', headers, body: JSON.stringify({ kind: 'session', data: { durationSeconds: -1 } }) })).status, 400);
  assert.equal((await fetch(base + '/api/bible/chapter?book=John&chapter=999&translation=KJV', { headers })).status, 400);
  assert.equal((await fetch(base + '/api/bible/chapter?book=John&chapter=3&translation=INVENTED', { headers })).status, 400);
});
test('AI being unconfigured returns a helpful failure without charging quota', async () => {
  calls = [];
  const response = await fetch(base + '/api/chat', { method: 'POST', headers, body: JSON.stringify({ message: 'Help me reflect on peace.' }) });
  assert.equal(response.status, 503); assert.equal(calls.length, 0);
  assert.doesNotMatch((await response.json()).error, /GEMINI|API_KEY|Secrets/);
});
test('chat modes are validated before making an AI request', async () => {
  for (const mode of ['chat', 'prayer', 'study', 'quiz']) {
    const response = await fetch(base + '/api/chat', { method: 'POST', headers, body: JSON.stringify({ message: 'Help me reflect.', mode }) });
    assert.equal(response.status, 503);
  }
  const invalid = await fetch(base + '/api/chat', { method: 'POST', headers, body: JSON.stringify({ message: 'Help me reflect.', mode: 'invalid' }) });
  assert.equal(invalid.status, 400);
});
test('bundled Bible chapters are readable by a signed-in user', async () => {
  const response = await fetch(base + '/api/bible/chapter?book=John&chapter=3&translation=BBE', { headers });
  assert.equal(response.status, 200); assert.equal((await response.json()).verses.length, 36);
});
test('the authenticator rejects guest identities and unconfirmed accounts', async (context) => {
  let identity: Record<string, unknown> = { id: userId, email: 'reader@example.test', email_confirmed_at: '2026-11-17T08:00:00Z', is_anonymous: false };
  context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(identity), { headers: { 'Content-Type': 'application/json' } }));
  const authenticate = createAuthenticator({ url: 'https://accounts.example.test', publicKey: 'sb_publishable_local_test' });
  assert.equal((await authenticate('test-token'))?.user.id, userId);
  identity = { ...identity, is_anonymous: true };
  assert.equal(await authenticate('test-token'), null);
  identity = { ...identity, is_anonymous: false, email_confirmed_at: null };
  assert.equal(await authenticate('test-token'), null);
});


test('API exposes and serves each bundled Bible translation', async () => {
  const catalog = await fetch(base + '/api/bible/translations', { headers });
  assert.equal(catalog.status, 200);
  const body = await catalog.json() as { translations: { id: string }[] };
  assert.deepEqual(new Set(body.translations.map((item) => item.id)), new Set(TRANSLATIONS));
  for (const translation of TRANSLATIONS) {
    const response = await fetch(`${base}/api/bible/chapter?book=John&chapter=3&translation=${translation}`, { headers });
    assert.equal(response.status, 200);
    const chapter = await response.json() as { translation: string; verses: unknown[] };
    assert.equal(chapter.translation, translation);
    assert.equal(chapter.verses.length, 36);
  }
});
