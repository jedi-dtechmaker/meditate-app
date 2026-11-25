export const FOCUSES = ['Peace', 'Joy', 'Courage', 'Healing', 'Gratitude'] as const;
export type Focus = (typeof FOCUSES)[number];
export const TRANSLATIONS = ['KJV', 'BBE', 'WEB', 'ASV', 'YLT'] as const;
export type Translation = (typeof TRANSLATIONS)[number];
export const TRANSLATION_NAMES: Record<Translation, string> = {
  KJV: 'King James Version', BBE: 'Bible in Basic English', WEB: 'World English Bible',
  ASV: 'American Standard Version', YLT: "Young’s Literal Translation",
};

export interface Verse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  reference: string;
  quote: string;
  translation: Translation;
}

export interface Profile {
  name: string;
  focus: Focus;
  translation: Translation;
  durationMinutes: number;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  music: string;
  voiceEnabled: boolean;
  voice: 'Aoede' | 'Kore' | 'Charon' | 'Puck';
  theme: 'system' | 'light' | 'dark';
  timezone: string;
  onboarded: boolean;
}

export interface MeditationSession {
  verse: Verse;
  focus: Focus;
  startedAt: string;
  completedAt: string;
  localDate: string;
  timezone: string;
  durationSeconds: number;
  plannedSeconds: number;
}

export interface JournalEntry {
  verse: Verse;
  text: string;
  createdAt: string;
}

export interface Favorite { verse: Verse; }
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  createdAt: string;
}
export interface RecordData {
  profile: Profile;
  session: MeditationSession;
  journal: JournalEntry;
  favorite: Favorite;
  chat: ChatMessage;
}
export type RecordKind = keyof RecordData;
export type UserRecord<K extends RecordKind = RecordKind> = {
  id: string;
  kind: K;
  data: RecordData[K];
  version: number;
  deleted: boolean;
  updated_at: string;
};
export type LocalRecord<K extends RecordKind = RecordKind> = UserRecord<K> & {
  dirty: boolean;
  mutationId: string;
  conflict?: UserRecord;
};
export interface RecordChange {
  id: string;
  kind: RecordKind;
  data: RecordData[RecordKind];
  deleted: boolean;
  baseVersion: number;
  mutationId: string;
}
export interface Devotional {
  title: string;
  reflection: string;
  prayer: string;
}

export function defaultProfile(name = ''): Profile {
  return {
    name, focus: 'Peace', translation: 'KJV', durationMinutes: 10,
    reminderEnabled: false, reminderHour: 8, reminderMinute: 0,
    music: 'piano', voiceEnabled: true, voice: 'Aoede', theme: 'system',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', onboarded: false,
  };
}

export function localDateKey(date = new Date(), timezone?: string): string {
  if (timezone) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(date);
    const part = (type: string) => parts.find((p) => p.type === type)!.value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function calculateProgress(sessions: MeditationSession[], now = new Date(), timezone?: string) {
  const days = new Set(sessions.map((session) => session.localDate));
  const today = localDateKey(now, timezone);
  const stepBack = (key: string) => new Date(Date.parse(`${key}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  let cursor = days.has(today) ? today : stepBack(today);
  let streak = 0;
  while (days.has(cursor)) { streak++; cursor = stepBack(cursor); }
  return {
    streak,
    totalSeconds: sessions.reduce((sum, session) => sum + session.durationSeconds, 0),
    sessionCount: sessions.length,
    activeDays: days.size,
  };
}

export function elapsedSeconds(accumulatedMs: number, startedAtMs: number | null, nowMs: number, limitSeconds: number) {
  return Math.min(limitSeconds, Math.max(0, Math.floor((accumulatedMs + (startedAtMs === null ? 0 : Math.max(0, nowMs - startedAtMs))) / 1000)));
}
