import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateProgress, defaultProfile, elapsedSeconds, localDateKey, type LocalRecord, type MeditationSession, type Verse } from '../shared/domain.ts';
import { acknowledge, mergeRemote } from '../shared/sync.ts';
import { recordChangeSchema } from '../shared/validation.ts';
import { pcmToWav } from '../api/ai.ts';

export const verse: Verse = { id: 'KJV:John:3:16', book: 'John', chapter: 3, verse: 16, reference: 'John 3:16', quote: 'For God so loved the world.', translation: 'KJV' };
const session = (localDate: string, durationSeconds = 180): MeditationSession => ({
  verse, localDate, durationSeconds, plannedSeconds: 600, focus: 'Peace', timezone: 'Africa/Lagos',
  startedAt: `${localDate}T08:00:00Z`, completedAt: `${localDate}T08:10:00Z`,
});
test('streaks count consecutive local calendar days rather than sessions', () => {
  const result = calculateProgress([session('2026-11-17'), session('2026-11-17'), session('2026-11-16')], new Date('2026-11-17T12:00:00Z'), 'Africa/Lagos');
  assert.deepEqual(result, { streak: 2, totalSeconds: 540, sessionCount: 3, activeDays: 2 });
});
test('yesterday remains a current streak, but a missed day resets it', () => {
  assert.equal(calculateProgress([session('2026-11-16')], new Date('2026-11-17T12:00:00Z'), 'Africa/Lagos').streak, 1);
  assert.equal(calculateProgress([session('2026-11-15')], new Date('2026-11-17T12:00:00Z'), 'Africa/Lagos').streak, 0);
  assert.equal(calculateProgress([], new Date('2026-11-17T12:00:00Z')).totalSeconds, 0);
});
test('local dates respect timezone boundaries and daylight saving transitions', () => {
  assert.equal(localDateKey(new Date('2026-11-17T23:30:00Z'), 'Africa/Lagos'), '2026-11-18');
  assert.equal(localDateKey(new Date('2026-11-17T01:00:00Z'), 'America/New_York'), '2026-11-16');
  const result = calculateProgress([session('2026-11-02'), session('2026-11-01'), session('2026-10-31')], new Date('2026-11-02T15:00:00Z'), 'America/New_York');
  assert.equal(result.streak, 3);
});
test('elapsed time includes background intervals, excludes pauses, and is capped', () => {
  assert.equal(elapsedSeconds(30000, 1000, 91000, 180), 120);
  assert.equal(elapsedSeconds(30000, null, 999999, 180), 30);
  assert.equal(elapsedSeconds(0, 1000, 999999, 180), 180);
});
const local: LocalRecord<'journal'> = {
  id: 'a737b998-b84f-4a8c-9be7-98c14612d323', kind: 'journal', data: { verse, text: 'A private reflection', createdAt: '2026-11-17T08:00:00Z' },
  version: 4, dirty: true, mutationId: 'b737b998-b84f-4a8c-9be7-98c14612d323', deleted: false, updated_at: '2026-11-17T08:00:00Z',
};
test('a concurrent device edit preserves both reflection versions', () => {
  const remote = { ...local, version: 5, data: { ...local.data, text: 'Edited on another phone' } };
  const result = mergeRemote(local, remote);
  assert.equal((result.data as typeof local.data).text, 'A private reflection');
  assert.equal((result.conflict!.data as typeof local.data).text, 'Edited on another phone');
  assert.equal(result.dirty, true);
});
test('an acknowledgement never erases an edit made while the upload was in flight', () => {
  const newer = { ...local, mutationId: 'new-change', data: { ...local.data, text: 'Typed during upload' } };
  const result = acknowledge(newer, { ...local, version: 9 }, local.mutationId);
  assert.equal((result.data as typeof local.data).text, 'Typed during upload');
  assert.equal(result.version, 9); assert.equal(result.dirty, true);
});
test('cloud tombstones remove clean cached records, and identical JSON never conflicts', () => {
  assert.equal(mergeRemote({ ...local, dirty: false }, { ...local, version: 6, deleted: true }).deleted, true);
  const reordered = { ...local, version: 6, data: { text: local.data.text, createdAt: local.data.createdAt, verse: local.data.verse } };
  assert.equal(mergeRemote(local, reordered).dirty, false);
});
test('record validation rejects malformed personal data before it reaches the database', () => {
  assert.equal(recordChangeSchema.safeParse({ ...local, baseVersion: 0 }).success, true);
  assert.equal(recordChangeSchema.safeParse({ ...local, baseVersion: -1 }).success, false);
  assert.equal(recordChangeSchema.safeParse({ ...local, baseVersion: 0, data: { ...local.data, text: '' } }).success, false);
  assert.equal(recordChangeSchema.safeParse({ ...local, kind: 'profile', data: { ...defaultProfile('A'), timezone: 'invented/timezone' }, baseVersion: 0 }).success, false);
});
test('speech PCM receives a valid mono WAV header', () => {
  const wav = pcmToWav(Buffer.from([0, 0, 1, 0]));
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.readUInt32LE(40), 4);
  assert.equal(wav.length, 48);
});
