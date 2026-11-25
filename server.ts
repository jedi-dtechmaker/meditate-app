import 'dotenv/config';
import { createApp } from './api/app.ts';

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535');
if (process.env.NODE_ENV === 'production' && (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY)) {
  throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY before starting production');
}
const app = createApp({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  geminiKey: process.env.GEMINI_API_KEY,
  chatModel: process.env.GEMINI_CHAT_MODEL,
  ttsModel: process.env.GEMINI_TTS_MODEL,
  transcriptionModel: process.env.GEMINI_TRANSCRIPTION_MODEL,
  dailyAiCredits: Math.max(1, Math.min(1000, Number(process.env.DAILY_AI_CREDITS) || 40)),
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean),
  trustProxy: Math.max(0, Math.min(3, Number(process.env.TRUST_PROXY) || 0)),
});
const server = app.listen(port, '0.0.0.0', () => console.log(`Meditate API listening on port ${port}`));
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => server.close(() => process.exit(0)));
}
