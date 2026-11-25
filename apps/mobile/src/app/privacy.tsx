import { useRouter } from 'expo-router';
import { Button, Card, Copy, Page, SectionTitle, Title } from '@/components/ui';
export default function Privacy() {
  const router = useRouter();
  return <Page><Button secondary title="Back" onPress={() => router.back()} /><Title>Your personal space</Title>
    <Card><SectionTitle>Your account</SectionTitle><Copy>Your email and password are handled by our account provider, Supabase. Your name, preferences, reflections, favorites, meditation history, and saved conversations belong to your account.</Copy></Card>
    <Card><SectionTitle>Saved on your phone</SectionTitle><Copy>The app keeps local copies so you can read Scripture and return to your reflections without a connection. Changes sync to your account when you reconnect. Signing out removes this phone’s saved account data, including changes that have not synced.</Copy></Card>
    <Card><SectionTitle>When you use AI</SectionTitle><Copy>Messages and the recent conversation context are sent to Google’s Gemini service when you ask the AI companion a question. Scripture and your focus are sent when you create a reflection. Recordings are sent when you request transcription, and Scripture text is sent for narration.</Copy><Copy>AI responses can be mistaken. They are generated reflections, not Scripture or messages from God.</Copy></Card>
    <Card><SectionTitle>You are in control</SectionTitle><Copy>You can edit or delete reflections, remove saved verses, clear conversations, change reminders, and delete your account in Settings. Offline deletions reach your account after syncing. Keep the app connected until those changes finish syncing.</Copy></Card>
  </Page>;
}
