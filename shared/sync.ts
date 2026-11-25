import type { LocalRecord, UserRecord } from './domain.ts';

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
export function sameValue(a: UserRecord, b: UserRecord) {
  return a.deleted === b.deleted && JSON.stringify(canonical(a.data)) === JSON.stringify(canonical(b.data));
}
export function mergeRemote(local: LocalRecord | undefined, remote: UserRecord): LocalRecord {
  if (!local) return { ...remote, dirty: false, mutationId: '' };
  if (remote.version <= local.version) return local;
  if (!local.dirty || sameValue(local, remote)) return { ...remote, dirty: false, mutationId: local.mutationId };
  return { ...local, conflict: remote };
}
export function acknowledge(local: LocalRecord, remote: UserRecord, mutationId: string): LocalRecord {
  if (local.mutationId === mutationId) return { ...remote, dirty: false, mutationId };
  // The user edited again during the request. Keep the new content and advance its base version.
  return { ...local, version: remote.version, conflict: undefined };
}
