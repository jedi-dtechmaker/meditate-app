import { useEffect, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { Bell, BookOpen, ChevronRight, Info, Mic2, Moon, Music2, Share2, UserRound, Settings as SettingsIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { FOCUSES, TRANSLATIONS, TRANSLATION_NAMES, type Profile, type RecordKind } from '@shared/domain';
import { useAuth } from '@/providers/auth';
import { PreferencesForm } from '@/components/preferences-form';
import { useData } from '@/providers/data';
import { signOutAndClear } from '@/lib/account';
import { api } from '@/lib/api';
import { cancelReminder, scheduleReminder } from '@/lib/reminders';
import { Button, Card, Chip, Copy, Field, Notice, Page, SectionTitle, styles, Title, useDesign } from '@/components/ui';

const kindLabels: Record<RecordKind, string> = { profile: 'Preferences', journal: 'Reflection', favorite: 'Saved verse', session: 'Meditation', chat: 'Conversation message' };
export default function Settings({ showBack = true }: { showBack?: boolean }) {
  const { session } = useAuth();
  const { profile, updateProfile, pending, syncError, syncing, sync, records, resolve } = useData();
  const { colors } = useDesign();
  const router = useRouter();
  const [draft, setDraft] = useState<Profile>(profile);
  const [hour, setHour] = useState(String(profile.reminderHour).padStart(2, '0'));
  const [minute, setMinute] = useState(String(profile.reminderMinute).padStart(2, '0'));
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [canDelete, setCanDelete] = useState(false);
  const [section, setSection] = useState<'preferences' | 'profile' | 'translation' | 'music' | 'voice' | 'reminder' | 'appearance' | 'account' | null>(null);
  useEffect(() => { void api<{ accountDeletion: boolean }>('/api/capabilities').then((result) => setCanDelete(result.accountDeletion)).catch(() => {}); }, []);
  const change = (value: Partial<Profile>) => setDraft((previous) => ({ ...previous, ...value }));
  const persist = async () => {
    const reminderHour = Number(hour), reminderMinute = Number(minute);
    if (!/^\d{1,2}$/.test(hour) || !/^\d{1,2}$/.test(minute) || reminderHour > 23 || reminderMinute > 59) { setError('Enter a reminder time between 00:00 and 23:59.'); return; }
    if (!draft.name.trim()) { setError('Please enter your name.'); return; }
    setBusy(true); setError(null); setMessage(null);
    try {
      if (section === 'reminder') {
        if (draft.reminderEnabled) await scheduleReminder(session!.user.id, reminderHour, reminderMinute, true);
        else await cancelReminder(session!.user.id);
      }
      await updateProfile({ ...draft, name: draft.name.trim(), reminderHour, reminderMinute, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' });
      setMessage('Your preferences are saved.');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'We could not save your preferences.'); }
    finally { setBusy(false); }
  };
  const signOut = () => Alert.alert('Sign out?', pending ? `You have ${pending} change${pending === 1 ? '' : 's'} that have not synced. Signing out removes this phone’s copies. Sync first to keep those changes in your account.` : 'Your synced reflections and progress will be waiting when you return. Saved copies will be removed from this phone.', [
    { text: 'Stay signed in', style: 'cancel' }, { text: 'Sign out', style: pending ? 'destructive' : 'default', onPress: () => {
      setBusy(true); void signOutAndClear(session!.user.id).catch(() => { setBusy(false); setError('Sign-out did not finish. Please try again.'); });
    } },
  ]);
  const deleteAccount = () => {
    if (!password) { setError('Enter your current password to confirm account deletion.'); return; }
    Alert.alert('Permanently delete your account?', 'Your account, reflections, saved verses, conversations, and meditation history will be permanently removed. This cannot be undone.', [
      { text: 'Keep my account', style: 'cancel' }, { text: 'Delete my account', style: 'destructive', onPress: () => {
        setBusy(true); setError(null);
        void api('/api/account', { method: 'DELETE', body: JSON.stringify({ password }) }, session!.user.id)
          .then(() => signOutAndClear(session!.user.id)).catch((failure: Error) => { setError(failure.message); setBusy(false); });
      } },
    ]);
  };
  const openSection = (value: NonNullable<typeof section>) => {
    setDraft(profile); setHour(String(profile.reminderHour).padStart(2, '0')); setMinute(String(profile.reminderMinute).padStart(2, '0'));
    setMessage(null); setError(null); setSection(value);
  };
  const row = (title: string, value: string, Icon: typeof BookOpen, onPress: () => void) => <Pressable accessibilityRole="button" onPress={onPress} style={[screen.row, { borderBottomColor: colors.line }]}><Icon size={19} color={colors.green} /><Text style={[screen.rowTitle, { color: colors.text }]}>{title}</Text><Text numberOfLines={1} style={[screen.value, { color: colors.muted }]}>{value}</Text><ChevronRight size={17} color={colors.muted} /></Pressable>;
  if (!section) return <Page>{showBack && <Button secondary title="Back" onPress={() => router.back()} />}<View style={screen.titleRow}><SettingsIcon size={22} color={colors.muted} /><Text accessibilityRole="header" style={[screen.title, { color: colors.text }]}>Settings</Text></View>
    <Pressable accessibilityRole="button" onPress={() => openSection('profile')} style={[screen.profile, { backgroundColor: colors.card, borderColor: colors.line }]}><View style={[screen.avatar, { backgroundColor: colors.green }]}><Text style={[screen.initial, { color: colors.white }]}>{profile.name.charAt(0).toUpperCase() || '✦'}</Text></View><View style={{ flex: 1, gap: 5 }}><Text style={[screen.name, { color: colors.text }]}>{profile.name || 'Your profile'}</Text><Text style={[screen.value, { color: colors.muted }]}>Meditating for a better you 🌿</Text></View><ChevronRight color={colors.muted} size={19} /></Pressable>
    <View style={[screen.group, { backgroundColor: colors.card, borderColor: colors.line }]}>
      {row('Meditation Preferences', profile.focus, SettingsIcon, () => openSection('preferences'))}
      {row('Bible Translation', profile.translation, BookOpen, () => openSection('translation'))}
      {row('Music Style', profile.music === 'piano' ? 'Gymnopédie No. 1' : profile.music === 'waters' ? 'Still Waters' : 'Quiet', Music2, () => openSection('music'))}
      {row('Scripture Voice', profile.voiceEnabled ? profile.voice : 'Off', Mic2, () => openSection('voice'))}
      {row('Reminder', profile.reminderEnabled ? `${String(profile.reminderHour).padStart(2, '0')}:${String(profile.reminderMinute).padStart(2, '0')}` : 'Off', Bell, () => openSection('reminder'))}
      {row('Appearance', profile.theme, Moon, () => openSection('appearance'))}
    </View>
    <View style={[screen.group, { backgroundColor: colors.card, borderColor: colors.line }]}>{row('Account & Sync', '', UserRound, () => openSection('account'))}{row('About & Privacy', '', Info, () => router.push('/privacy'))}{row('Share with Friends', '', Share2, () => { void Share.share({ message: 'Meditate on the Word — make a little space for Scripture and prayer.' }).catch(() => setError('Sharing is unavailable right now.')); })}</View><Notice error message={error} /></Page>;
  if (section === 'preferences') return <PreferencesForm onBack={() => setSection(null)} />;
  const title = { profile: 'Your profile', translation: 'Bible translation', music: 'Music style', voice: 'Scripture voice', reminder: 'Daily reminder', appearance: 'Appearance', account: 'Account & sync' }[section];
  return <Page><Button secondary title="Back to settings" onPress={() => { setSection(null); setError(null); setMessage(null); setDraft(profile); setHour(String(profile.reminderHour).padStart(2, '0')); setMinute(String(profile.reminderMinute).padStart(2, '0')); }} /><Title>{title}</Title>
    {section === 'profile' && <><Copy muted>{session!.user.email}</Copy><Field label="Your name" value={draft.name} onChangeText={(name) => change({ name })} maxLength={60} /><Card><SectionTitle>Your focus</SectionTitle><View style={styles.wrap}>{FOCUSES.map((focus) => <Chip key={focus} title={focus} selected={draft.focus === focus} onPress={() => change({ focus })} />)}</View></Card><Card><SectionTitle>Meditation length</SectionTitle><View style={styles.wrap}>{[3, 5, 10, 15, 20, 30].map((durationMinutes) => <Chip key={durationMinutes} title={`${durationMinutes} min`} selected={draft.durationMinutes === durationMinutes} onPress={() => change({ durationMinutes })} />)}</View></Card></>}
    {section === 'translation' && <Card><SectionTitle>Bible translation</SectionTitle><View style={styles.wrap}>{TRANSLATIONS.map((translation) => <Chip key={translation} title={TRANSLATION_NAMES[translation]} selected={draft.translation === translation} onPress={() => change({ translation })} />)}</View><Copy small muted>All translations are available offline.</Copy></Card>}
    {section === 'music' && <Card><SectionTitle>Background music</SectionTitle><View style={styles.wrap}><Chip title="Quiet" selected={draft.music === 'quiet'} onPress={() => change({ music: 'quiet' })} /><Chip title="Gymnopédie No. 1" selected={draft.music === 'piano'} onPress={() => change({ music: 'piano' })} /><Chip title="Still Waters" selected={draft.music === 'waters'} onPress={() => change({ music: 'waters' })} /></View><Copy small muted>Gymnopédie No. 1 by Erik Satie. Recording by Teknopazzo, Wikimedia Commons, CC0 1.0. Adapted for quiet meditation. Still Waters is an original synthesized ambient track.</Copy></Card>}
    {section === 'voice' && <Card><View style={styles.between}><Copy>Scripture narration</Copy><Switch accessibilityLabel="Enable Scripture narration" value={draft.voiceEnabled} onValueChange={(voiceEnabled) => change({ voiceEnabled })} trackColor={{ true: colors.green }} /></View>{draft.voiceEnabled && <View style={styles.wrap}>{(['Aoede', 'Kore', 'Charon', 'Puck'] as const).map((voice) => <Chip key={voice} title={voice} selected={draft.voice === voice} onPress={() => change({ voice })} />)}</View>}</Card>}
    {section === 'reminder' && <Card><View style={styles.between}><Copy>A moment in the Word</Copy><Switch accessibilityLabel="Enable daily reminder" value={draft.reminderEnabled} onValueChange={(reminderEnabled) => change({ reminderEnabled })} trackColor={{ true: colors.green }} /></View><View style={styles.row}><View style={{ flex: 1 }}><Field label="Hour · 24-hour time" value={hour} onChangeText={setHour} keyboardType="number-pad" maxLength={2} /></View><View style={{ flex: 1 }}><Field label="Minute" value={minute} onChangeText={setMinute} keyboardType="number-pad" maxLength={2} /></View></View><Copy small muted>Reminders follow this phone’s local time.</Copy></Card>}
    {section === 'appearance' && <Card><View style={styles.wrap}>{(['system', 'light', 'dark'] as const).map((theme) => <Chip key={theme} title={theme[0].toUpperCase() + theme.slice(1)} selected={draft.theme === theme} onPress={() => change({ theme })} />)}</View></Card>}
    {section !== 'account' && <><Notice error message={error} /><Notice message={message} /><Button title="Save preferences" busy={busy} onPress={() => void persist()} /></>}
    {section === 'account' && <><Card><SectionTitle>Your account data</SectionTitle><Copy small muted>{pending ? `${pending} change${pending === 1 ? '' : 's'} waiting to sync.` : 'Your changes are synced.'}</Copy><Notice error message={syncError} />
      <Button secondary busy={syncing} title="Sync now" onPress={() => { void sync().catch(() => {}); }} /><Button secondary title="How your data is used" onPress={() => router.push('/privacy')} />
      {records.filter((record) => record.conflict).map((record) => <Card key={`${record.kind}:${record.id}`}><SectionTitle>{kindLabels[record.kind]} changed on another device</SectionTitle><Copy small muted>Both versions are kept until you choose which one to use.</Copy>
        {record.kind === 'journal' && <><Copy small>On this phone: {'text' in record.data ? record.data.text : ''}</Copy><Copy small>In your account: {record.conflict && 'text' in record.conflict.data ? record.conflict.data.text : ''}</Copy></>}
        <Button secondary title="Keep this phone’s version" onPress={() => { void resolve(record, 'device').catch(() => setError('Please reconnect and try again.')); }} /><Button secondary title="Use the cloud version" onPress={() => { void resolve(record, 'cloud').catch(() => setError('Please reconnect and try again.')); }} /></Card>)}
    </Card><Notice error message={error} /><Button secondary title="Sign out" disabled={busy} onPress={signOut} /><Card><SectionTitle>Delete account</SectionTitle><Copy small muted>Permanently remove your account and its saved data.</Copy><Field label="Current password" secureTextEntry value={password} onChangeText={setPassword} autoComplete="current-password" />{!canDelete && <Copy small muted>Account deletion is temporarily unavailable. Please try again later.</Copy>}<Button danger title="Delete my account" disabled={!canDelete || busy} onPress={deleteAccount} /></Card></>}
  </Page>;
}
const screen = StyleSheet.create({ titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, title: { fontSize: 23, fontWeight: '800' }, profile: { borderWidth: 1, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }, avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' }, initial: { fontSize: 22, fontWeight: '800' }, name: { fontWeight: '800', fontSize: 16 }, group: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' }, row: { minHeight: 57, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 15, borderBottomWidth: StyleSheet.hairlineWidth }, rowTitle: { flex: 1, fontSize: 13, fontWeight: '700' }, value: { fontSize: 12, maxWidth: 110, textTransform: 'capitalize' } });
