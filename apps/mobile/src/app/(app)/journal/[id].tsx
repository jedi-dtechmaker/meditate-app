import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, usePreventRemove, useRouter } from 'expo-router';
import type { Verse } from '@shared/domain';
import { useAuth } from '@/providers/auth';
import { useData, useRecords } from '@/providers/data';
import { dailyVerse } from '@/lib/bible';
import { getMeta, setMeta } from '@/lib/database';
import { Button, Card, Copy, Field, Notice, Page, Title } from '@/components/ui';
import { VoiceInput } from '@/components/voice-input';

export default function JournalEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, selectedVerse, save } = useData();
  const { session } = useAuth();
  const notes = useRecords('journal');
  const existing = notes.find((record) => record.id === id);
  const [verse, setVerse] = useState<Verse>(existing?.data.verse || selectedVerse || dailyVerse(profile.focus, profile.translation, new Date(), profile.timezone));
  const [text, setText] = useState(existing?.data.text || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const draftLoaded = useRef(false);
  const router = useRouter();
  const draftKey = `journalDraft:${id}`;
  const dirty = text !== (existing?.data.text || '');
  usePreventRemove(dirty && !leaving, ({ repeat }) => {
    Alert.alert('Leave this reflection?', 'Your draft is saved on this phone. You can return to it later.', [
      { text: 'Keep writing', style: 'cancel' }, { text: 'Leave for now', onPress: () => {
        void setMeta(session!.user.id, draftKey, { text, verse }).then(() => { setLeaving(true); repeat(); }).catch(() => setError('We could not save your draft. Please try again.'));
      } },
    ]);
  });
  useEffect(() => {
    let active = true;
    void getMeta<{ text: string; verse: Verse }>(session!.user.id, draftKey).then((draft) => {
      if (!active) return;
      if (draft) { setText(draft.text); setVerse(draft.verse); }
      draftLoaded.current = true;
    });
    return () => { active = false; };
  }, [draftKey, session]);
  useEffect(() => {
    if (!draftLoaded.current || leaving) return;
    const timer = setTimeout(() => { void setMeta(session!.user.id, draftKey, { text, verse }).catch(() => setError('We could not save your draft. Please save your reflection before leaving.')); }, 400);
    return () => clearTimeout(timer);
  }, [draftKey, leaving, session, text, verse]);
  const persist = async (deleted = false) => {
    if (!text.trim() && !deleted) { setError('Write a few words before saving.'); return; }
    setBusy(true); setError(null);
    try {
      await save('journal', { verse, text: text.trim(), createdAt: existing?.data.createdAt || new Date().toISOString() }, existing?.id, deleted);
      await setMeta(session!.user.id, draftKey, null);
      setLeaving(true); setSaved(true);
      // Navigation is deferred until removal protection is disabled.
    } catch { setError('Your reflection could not be saved. Please try again.'); }
    finally { setBusy(false); }
  };
  useEffect(() => { if (saved && !busy) router.replace('/(app)/(tabs)/journal'); }, [busy, saved, router]);
  if (id !== 'new' && !existing) return <Page><Title>Reflection unavailable</Title><Copy>This reflection may have been deleted on another device.</Copy><Button title="Back to journal" onPress={() => router.replace('/(app)/(tabs)/journal')} /></Page>;
  return <Page><Button secondary title="Back to journal" onPress={() => router.back()} /><Title eyebrow="Between you and God">{existing ? 'Return to your reflection' : 'What is on your heart?'}</Title>
    <Card><Copy small muted>{verse.reference} · {verse.translation}</Copy><Copy style={{ fontStyle: 'italic' }}>“{verse.quote}”</Copy></Card>
    <Field label="Your reflection" placeholder="What stood out to you? What would you like to pray about?" multiline value={text} onChangeText={setText} maxLength={20000} style={{ minHeight: 230 }} />
    <VoiceInput onTranscript={(value) => setText((previous) => `${previous}${previous.trim() ? '\n' : ''}${value}`.slice(0, 20000))} disabled={busy} />
    <Notice error message={error} /><Button busy={busy} title="Save reflection" onPress={() => void persist()} />
    {existing && <Button secondary title="Delete reflection" onPress={() => Alert.alert('Delete this reflection?', 'It will be removed from your account when your device syncs.', [
      { text: 'Keep it', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => void persist(true) },
    ])} />}
  </Page>;
}
