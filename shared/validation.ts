import { z } from 'zod';
import { FOCUSES, TRANSLATIONS } from './domain.ts';

export const verseSchema = z.object({
  id: z.string().min(1).max(200), book: z.string().min(1).max(60),
  chapter: z.number().int().min(1).max(150), verse: z.number().int().min(1).max(176),
  reference: z.string().min(1).max(100), quote: z.string().min(1).max(6000),
  translation: z.enum(TRANSLATIONS),
});
const verse = verseSchema;
const isoDate = z.iso.datetime({ offset: true });
const timezone = z.string().max(100).refine((value) => {
  try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
}, 'Invalid timezone');

export const dataSchemas = {
  profile: z.object({
    name: z.string().trim().min(1).max(60), focus: z.enum(FOCUSES), translation: z.enum(TRANSLATIONS),
    durationMinutes: z.number().int().min(1).max(30), reminderEnabled: z.boolean(),
    reminderHour: z.number().int().min(0).max(23), reminderMinute: z.number().int().min(0).max(59),
    music: z.string().max(100), voiceEnabled: z.boolean(), voice: z.enum(['Aoede', 'Kore', 'Charon', 'Puck']),
    theme: z.enum(['system', 'light', 'dark']), timezone, onboarded: z.boolean(),
  }),
  session: z.object({
    verse, focus: z.enum(FOCUSES), startedAt: isoDate, completedAt: isoDate,
    localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), timezone,
    durationSeconds: z.number().int().min(1).max(1800), plannedSeconds: z.number().int().min(60).max(1800),
  }).refine((session) => session.durationSeconds <= session.plannedSeconds &&
    Date.parse(session.completedAt) >= Date.parse(session.startedAt), 'Invalid session timing'),
  journal: z.object({ verse, text: z.string().trim().min(1).max(20000), createdAt: isoDate }),
  favorite: z.object({ verse }),
  chat: z.object({ role: z.enum(['user', 'model']), text: z.string().trim().min(1).max(20000), createdAt: isoDate }),
};

export const recordChangeSchema = z.object({
  id: z.uuid(), kind: z.enum(['profile', 'session', 'journal', 'favorite', 'chat']),
  data: z.unknown(), deleted: z.boolean(), baseVersion: z.number().int().min(0), mutationId: z.uuid(),
}).transform((change, ctx) => {
  const result = dataSchemas[change.kind].safeParse(change.data);
  if (!result.success) {
    ctx.addIssue({ code: 'custom', message: result.error.issues[0]?.message || 'Invalid record data', path: ['data'] });
    return z.NEVER;
  }
  return { ...change, data: result.data };
});
