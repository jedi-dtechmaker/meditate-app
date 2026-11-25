import { openDatabaseAsync } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import type { LocalRecord, RecordData, RecordKind, UserRecord } from '@shared/domain';
import { acknowledge, mergeRemote } from '@shared/sync';

const connection = openDatabaseAsync('meditate.db').then(async (db) => {
  await db.execAsync(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS records (
      user_id TEXT NOT NULL, kind TEXT NOT NULL, id TEXT NOT NULL, value TEXT NOT NULL,
      PRIMARY KEY (user_id, kind, id)
    );
    CREATE TABLE IF NOT EXISTS metadata (
      user_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL,
      PRIMARY KEY (user_id, key)
    );`);
  return db;
});
let queue: Promise<unknown> = Promise.resolve();
function write<T>(run: () => Promise<T>): Promise<T> {
  const result = queue.then(run); queue = result.catch(() => {}); return result;
}
export async function allRecords(userId: string): Promise<LocalRecord[]> {
  await queue;
  const db = await connection;
  return (await db.getAllAsync<{ value: string }>('SELECT value FROM records WHERE user_id = ?', userId)).map((row) => JSON.parse(row.value));
}
async function read(userId: string, kind: RecordKind, id: string): Promise<LocalRecord | undefined> {
  const db = await connection;
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM records WHERE user_id = ? AND kind = ? AND id = ?', userId, kind, id);
  return row ? JSON.parse(row.value) : undefined;
}
async function put(userId: string, record: LocalRecord) {
  const db = await connection;
  await db.runAsync('INSERT INTO records (user_id, kind, id, value) VALUES (?, ?, ?, ?) ON CONFLICT (user_id, kind, id) DO UPDATE SET value = excluded.value',
    userId, record.kind, record.id, JSON.stringify(record));
}
export function saveRecord<K extends RecordKind>(userId: string, kind: K, id: string, data: RecordData[K], deleted = false) {
  return write(async () => {
    const previous = await read(userId, kind, id);
    const record: LocalRecord = {
      id, kind, data, deleted, version: previous?.version || 0, dirty: true,
      mutationId: randomUUID(), updated_at: new Date().toISOString(), conflict: previous?.conflict,
    };
    await put(userId, record);
    return record;
  });
}
export function acceptRemote(userId: string, remote: UserRecord) {
  return write(async () => put(userId, mergeRemote(await read(userId, remote.kind, remote.id), remote)));
}
export function acceptMutation(userId: string, remote: UserRecord, mutationId: string) {
  return write(async () => {
    const local = await read(userId, remote.kind, remote.id);
    if (local) await put(userId, acknowledge(local, remote, mutationId));
  });
}
export function markConflict(userId: string, remote: UserRecord) {
  return write(async () => {
    const local = await read(userId, remote.kind, remote.id);
    if (local) await put(userId, { ...local, conflict: remote });
  });
}
export function resolveConflict(userId: string, record: LocalRecord, keep: 'device' | 'cloud') {
  return write(async () => {
    const latest = await read(userId, record.kind, record.id);
    if (!latest?.conflict) return;
    const remote = latest.conflict;
    await put(userId, keep === 'cloud' ? { ...remote, dirty: false, mutationId: '' } : {
      ...latest, version: remote.version, dirty: true, mutationId: randomUUID(), conflict: undefined,
    });
  });
}
export async function getMeta<T>(userId: string, key: string): Promise<T | null> {
  await queue;
  const db = await connection;
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM metadata WHERE user_id = ? AND key = ?', userId, key);
  return row ? JSON.parse(row.value) : null;
}
export function setMeta(userId: string, key: string, value: unknown) {
  return write(async () => {
    const db = await connection;
    if (value === null) await db.runAsync('DELETE FROM metadata WHERE user_id = ? AND key = ?', userId, key);
    else await db.runAsync('INSERT INTO metadata (user_id, key, value) VALUES (?, ?, ?) ON CONFLICT (user_id, key) DO UPDATE SET value = excluded.value', userId, key, JSON.stringify(value));
  });
}
export function clearUser(userId: string) {
  return write(async () => {
    const db = await connection;
    await db.runAsync('DELETE FROM records WHERE user_id = ?', userId);
    await db.runAsync('DELETE FROM metadata WHERE user_id = ?', userId);
  });
}
