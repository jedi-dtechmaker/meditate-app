import type { RecordChange, UserRecord } from '@shared/domain';
import { dataSchemas } from '@shared/validation';
import { api, ApiError } from './api';
import { acceptMutation, acceptRemote, allRecords, getMeta, markConflict, setMeta } from './database';

const running = new Map<string, { promise: Promise<void>; controller: AbortController }>();
export function syncUser(userId: string): Promise<void> {
  const current = running.get(userId);
  if (current) return current.promise;
  const controller = new AbortController();
  const promise = (async () => {
    const pending = (await allRecords(userId)).filter((record) => record.dirty && !record.conflict);
    for (const record of pending) {
      controller.signal.throwIfAborted();
      const change: RecordChange = { ...record, baseVersion: record.version };
      try {
        const result = await api<{ record: UserRecord }>('/api/records', {
          method: 'PUT', signal: controller.signal, body: JSON.stringify(change),
        }, userId);
        controller.signal.throwIfAborted();
        await acceptMutation(userId, result.record, record.mutationId);
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          const remote = (error.body as { record: UserRecord }).record;
          controller.signal.throwIfAborted();
          await markConflict(userId, remote);
        } else throw error;
      }
    }
    let cursor = await getMeta<number>(userId, 'cursor') || 0;
    let hasMore = true;
    while (hasMore) {
      const page = await api<{ records: UserRecord[]; cursor: number; hasMore: boolean }>(`/api/sync?after=${cursor}`, { signal: controller.signal }, userId);
      controller.signal.throwIfAborted();
      for (const record of page.records) {
        const parsed = dataSchemas[record.kind]?.safeParse(record.data);
        if (!parsed?.success) throw new Error('Some cloud data could not be read. Please contact support.');
        await acceptRemote(userId, { ...record, data: parsed.data });
      }
      cursor = page.cursor; hasMore = page.hasMore;
      await setMeta(userId, 'cursor', cursor);
    }
    await setMeta(userId, 'lastSync', new Date().toISOString());
  })().finally(() => { if (running.get(userId)?.controller === controller) running.delete(userId); });
  running.set(userId, { promise, controller });
  return promise;
}
export async function stopSync(userId: string) {
  const current = running.get(userId);
  if (current) { current.controller.abort(); await current.promise.catch(() => {}); }
}
