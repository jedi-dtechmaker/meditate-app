import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import { Bell, BookOpen, Mic2, Music2 } from 'lucide-react-native';
import { useAudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
import { FOCUSES, type Focus, type Profile } from '@shared/domain';
import { Button, Chip, Copy, Field, Notice, Page, styles, useDesign } from '@/components/ui';
import { useData } from '@/providers/data';
import { useAuth } from '@/providers/auth';
import { cancelReminder, scheduleReminder } from '@/lib/reminders';
import { api } from '@/lib/api';

const focusDetails: Record<Focus, { icon: string; label: string; verse: string }> = {
  Peace: { icon: '🕊', label: 'Peace & Calm', verse: 'Ps. 46:10' },
  Joy: { icon: '☀', label: 'Joy & Rejoicing', verse: 'Neh. 8:10' },
  Courage: { icon: '⚡', label: 'Courage & Strength', verse: 'Isa. 40:31' },
  Healing: { icon: '🌿', label: 'Healing & Wholeness', verse: 'Jer. 17:14' },
  Gratitude: { icon: '🙌', label: 'Praise & Thanksgiving', verse: 'Ps. 100:4' },
};

/** Shared onboarding and settings editor. Choices are stored on the account profile. */
export function PreferencesForm({ onboarding = false, onBack }: { onboarding?: boolean; onBack?: () => void }) {
  const { profile, updateProfile } = useData();
  const { session } = useAuth();
  const { colors } = useDesign();
  const [draft, setDraft] = useState(profile);
  const [hour, setHour] = useState(String(profile.reminderHour).padStart(2, '0'));
  const [minute, setMinute] = useState(String(profile.reminderMinute).padStart(2, '0'));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminderFailure, setReminderFailure] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const previewController = useRef<AbortController | null>(null);
  const previewFile = useRef<File | null>(null);
  const previewPlayer = useAudioPlayer(null);
  useEffect(() => () => {
    previewController.current?.abort();
    previewController.current = null;
    previewPlayer.pause();
    if (previewFile.current?.exists) previewFile.current.delete();
  }, [previewPlayer]);
  const preview = async () => {
    previewController.current?.abort();
    previewPlayer.pause();
    const controller = new AbortController();
    previewController.current = controller;
    setPreviewBusy(true); setError(null);
    try {
      const response = await api<{ audioBase64: string }>('/api/tts', { method: 'POST', signal: controller.signal, body: JSON.stringify({ text: 'Be still, and know that I am God.', voice: draft.voice }) }, session!.user.id);
      if (controller.signal.aborted) return;
      if (previewFile.current?.exists) previewFile.current.delete();
      const file = new File(Paths.cache, `voice-preview-${randomUUID()}.wav`);
      file.write(Uint8Array.from(atob(response.audioBase64), (character) => character.charCodeAt(0)));
      previewFile.current = file;
      previewPlayer.replace(file.uri); previewPlayer.play();
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Voice preview is unavailable.');
    } finally { if (previewController.current === controller) setPreviewBusy(false); }
  };
  const change = (values: Partial<Profile>) => setDraft((current) => ({ ...current, ...values }));
  const save = async (skip = false, withoutReminder = false) => {
    const validTime = /^\d{1,2}$/.test(hour) && /^\d{1,2}$/.test(minute) && Number(hour) <= 23 && Number(minute) <= 59;
    if (!skip && !withoutReminder && draft.reminderEnabled && !validTime) { setError('Enter a time between 00:00 and 23:59.'); return; }
    if (!skip && !draft.name.trim()) { setError('Please enter your name.'); return; }
    const h = validTime ? Number(hour) : profile.reminderHour;
    const m = validTime ? Number(minute) : profile.reminderMinute;
    let reminderChanged = false;
    let reminderFailed = false;
    let cancellationFailed = false;
    setBusy(true); setError(null); setReminderFailure(false);
    try {
      if (skip) {
        await updateProfile({ onboarded: true, name: draft.name.trim() || profile.name.trim() || 'Friend' });
      } else {
        reminderChanged = true;
        try {
          if (!withoutReminder && draft.reminderEnabled) await scheduleReminder(session!.user.id, h, m, true);
          else await cancelReminder(session!.user.id);
        } catch (failure) {
          if (withoutReminder) cancellationFailed = true;
          else { reminderFailed = true; throw failure; }
        }
        await updateProfile({ ...draft, name: draft.name.trim(), reminderEnabled: withoutReminder ? false : draft.reminderEnabled, reminderHour: h, reminderMinute: m, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', onboarded: true });
      }
      if (cancellationFailed) Alert.alert('Check your reminders', 'Your preferences were saved. An existing reminder could not be removed; check your phone’s notification settings.');
      if (!onboarding) onBack?.();
    } catch (failure) {
      let restoreFailed = false;
      if (reminderChanged) {
        try {
          if (profile.reminderEnabled) await scheduleReminder(session!.user.id, profile.reminderHour, profile.reminderMinute);
          else await cancelReminder(session!.user.id);
        } catch { restoreFailed = true; }
      }
      setReminderFailure(reminderFailed);
      const message = reminderFailed && !(failure instanceof Error && (failure.message.startsWith('We could not set up reminders') || failure.message.startsWith('Allow notifications') || failure.message.startsWith('Daily reminders')))
        ? 'We could not update reminders on this phone. You can retry or continue without a reminder.'
        : failure instanceof Error ? failure.message : 'We could not save your preferences. Please try again.';
      setError(restoreFailed ? `${message} Please check your reminder settings too.` : message);
    } finally { setBusy(false); }
  };
  const label = (icon: React.ReactNode, text: string) => <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{icon}<Text style={{ color: colors.muted, fontWeight: '700', fontSize: 12, letterSpacing: 1 }}>{text.toUpperCase()}</Text></View>;
  return <Page>
    <View style={styles.between}>{onBack ? <Pressable accessibilityRole="button" onPress={onBack}><Text style={{ color: colors.green, fontWeight: '700' }}>‹ Back</Text></Pressable> : <View />}{onboarding && <Pressable accessibilityRole="button" disabled={busy} onPress={() => void save(true)}><Text style={{ color: colors.muted, fontWeight: '600' }}>Skip</Text></Pressable>}</View>
    <View style={{ alignItems: 'center', gap: 8 }}><Text accessibilityRole="header" style={{ fontSize: 25, fontWeight: '800', color: colors.text }}>Set Your Preferences</Text><Copy small muted>Help us personalize your meditation experience.</Copy></View>
    {!profile.name.trim() && <Field label="What should we call you?" value={draft.name} onChangeText={(name) => change({ name })} maxLength={60} autoComplete="name" />}
    <View style={{ gap: 12 }}>{label(<Bell size={17} color={colors.green} />, 'Reminder time')}<View style={[styles.between, { backgroundColor: colors.soft, borderRadius: 15, padding: 12 }]}><Copy small>Daily reminder</Copy><Switch accessibilityLabel="Enable daily reminder" value={draft.reminderEnabled} onValueChange={(reminderEnabled) => change({ reminderEnabled })} trackColor={{ true: colors.green }} /></View>{draft.reminderEnabled && <View style={styles.row}><View style={{ flex: 1 }}><Field label="Hour (24-hour)" value={hour} onChangeText={setHour} keyboardType="number-pad" maxLength={2} /></View><View style={{ flex: 1 }}><Field label="Minute" value={minute} onChangeText={setMinute} keyboardType="number-pad" maxLength={2} /></View></View>}</View>
    <View style={{ gap: 12 }}>{label(<Music2 size={17} color={colors.green} />, 'Preferred sound style')}<View style={styles.wrap}>{([{ id: 'piano', title: '🎹 Gymnopédie No. 1' }, { id: 'waters', title: '🌊 Still Waters' }, { id: 'quiet', title: 'Quiet' }] as const).map((music) => <Chip key={music.id} title={music.title} selected={draft.music === music.id} onPress={() => change({ music: music.id })} />)}</View></View>
    <View style={{ gap: 12 }}>{label(<Music2 size={17} color={colors.green} />, 'Meditation duration')}<View style={styles.wrap}>{[3, 5, 10, 15, 20, 30].map((durationMinutes) => <Chip key={durationMinutes} title={`${durationMinutes} min`} selected={draft.durationMinutes === durationMinutes} onPress={() => change({ durationMinutes })} />)}</View></View>
    <View style={{ gap: 12 }}>{label(<Mic2 size={17} color={colors.green} />, 'Scripture voice')}<View style={styles.between}><Copy small>Read scripture aloud</Copy><Switch accessibilityLabel="Enable scripture voice" value={draft.voiceEnabled} onValueChange={(voiceEnabled) => { if (!voiceEnabled) { previewController.current?.abort(); setPreviewBusy(false); previewPlayer.pause(); } change({ voiceEnabled }); }} trackColor={{ true: colors.green }} /></View>{draft.voiceEnabled && <><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{(['Aoede', 'Kore', 'Charon', 'Puck'] as const).map((voice) => <Pressable key={voice} accessibilityRole="button" accessibilityState={{ selected: draft.voice === voice }} onPress={() => { previewController.current?.abort(); setPreviewBusy(false); previewPlayer.pause(); change({ voice }); }} style={{ width: '48%', minHeight: 76, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: draft.voice === voice ? colors.green : colors.line, backgroundColor: draft.voice === voice ? colors.soft : colors.card, justifyContent: 'center', gap: 5 }}><Text style={{ color: colors.text, fontWeight: '700' }}>{voice}</Text><Text style={{ color: colors.muted, fontSize: 11 }}>{draft.voice === voice ? 'Selected voice ✓' : 'Scripture narration'}</Text></Pressable>)}</View><Pressable accessibilityRole="button" disabled={previewBusy} onPress={() => void preview()}><Text style={{ color: colors.green, fontWeight: '700' }}>{previewBusy ? 'Preparing preview…' : '▶ Preview selected voice'}</Text></Pressable></>}</View>
    <View style={{ gap: 12 }}>{label(<BookOpen size={17} color={colors.green} />, 'Biblical focus themes')}<Copy small muted>Choose a focus for your daily Scripture and meditation.</Copy><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{FOCUSES.map((focus: Focus) => <Pressable key={focus} accessibilityRole="button" accessibilityState={{ selected: draft.focus === focus }} onPress={() => change({ focus })} style={{ width: '48%', minHeight: 66, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: draft.focus === focus ? colors.green : colors.line, backgroundColor: draft.focus === focus ? colors.soft : colors.card, justifyContent: 'center' }}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ fontSize: 20 }}>{focusDetails[focus].icon}</Text><Text style={{ color: colors.muted, fontSize: 10 }}>{focusDetails[focus].verse}</Text></View><Text style={{ color: colors.text, fontWeight: '700', marginTop: 8 }}>{focusDetails[focus].label}</Text></Pressable>)}</View></View>
    <Notice error message={error} />{reminderFailure && <Button secondary title={onboarding ? 'Continue without reminder' : 'Save without reminder'} disabled={busy} onPress={() => void save(false, true)} />}<Button title={onboarding ? 'Continue' : 'Save preferences'} busy={busy} onPress={() => void save()} />
  </Page>;
}
