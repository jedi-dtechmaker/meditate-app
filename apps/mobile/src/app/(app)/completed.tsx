import { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';
import { ArrowLeft, ChartNoAxesColumn, Check, ChevronRight, Feather, Heart, Home, Share2 } from 'lucide-react-native';
import { useData, useRecords } from '@/providers/data';
import { Notice, Page, useDesign } from '@/components/ui';
import { VoiceInput } from '@/components/voice-input';

export default function Completed() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useRecords('session').find((record) => record.id === id);
  const favorites = useRecords('favorite');
  const { save } = useData();
  const router = useRouter();
  const { colors } = useDesign();
  const [text, setText] = useState('');
  const [voice, setVoice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const verse = session?.data.verse;
  const favorite = Boolean(verse && favorites.some((record) => record.data.verse.id === verse.id));
  const saveNote = async () => {
    if (!verse || !text.trim() || busy) return;
    setBusy(true); setError('');
    try { await save('journal', { verse, text: text.trim(), createdAt: new Date().toISOString() }); setText(''); setVoice(false); setMessage('Your note is saved in your journal.'); }
    catch { setError('Could not save your note. Please try again.'); }
    finally { setBusy(false); }
  };
  const toggleFavorite = async () => {
    if (!verse || busy) return;
    setBusy(true); setError('');
    try {
      const hash = await digestStringAsync(CryptoDigestAlgorithm.SHA256, verse.id);
      const favoriteId = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-8${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
      await save('favorite', { verse }, favoriteId, favorite);
      setMessage(favorite ? 'Removed from your saved verses.' : 'Verse saved to your journal.');
    } catch { setError('Could not update your saved verse. Please try again.'); }
    finally { setBusy(false); }
  };
  const action = (title: string, Icon: typeof Heart, onPress: () => void, disabled = false) => <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[s.action, { backgroundColor: colors.card, borderColor: colors.line, opacity: disabled ? 0.5 : 1 }]}><Icon size={19} color={colors.green} /><Text style={[s.actionText, { color: colors.text }]}>{title}</Text><ChevronRight size={17} color={colors.muted} /></Pressable>;
  return <Page><View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.replace('/(app)/(tabs)')}><ArrowLeft color={colors.muted} size={22} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Go home" onPress={() => router.replace('/(app)/(tabs)')}><Home color={colors.muted} size={21} /></Pressable></View>
    <View style={s.hero}><View style={[s.check, { backgroundColor: colors.soft, borderColor: colors.green }]}><Check size={38} color={colors.green} /></View><Text accessibilityRole="header" style={[s.title, { color: colors.text }]}>Session Complete!</Text><Text style={[s.sub, { color: colors.muted }]}>You just meditated on God’s Word.</Text>{verse && <Text style={[s.sub, { color: colors.green }]}>{verse.reference} · {verse.translation}</Text>}</View>
    {verse ? <><View style={[s.card, { backgroundColor: colors.card, borderColor: colors.line }]}><View style={s.label}><Feather size={16} color={colors.green} /><Text style={[s.labelText, { color: colors.text }]}>Journaling Prompt</Text></View><Text style={[s.labelText, { color: colors.text }]}>What stood out to you?</Text><TextInput accessibilityLabel="Your reflection" multiline maxLength={12000} placeholder="Write your thoughts..." placeholderTextColor={colors.muted} value={text} onChangeText={(value) => { setText(value); setMessage(''); }} style={[s.input, { color: colors.text, borderColor: colors.line, backgroundColor: colors.bg }]} />
      <View style={s.actions}><Pressable accessibilityRole="button" accessibilityState={{ expanded: voice }} onPress={() => setVoice(!voice)} style={[s.button, { backgroundColor: colors.soft }]}><Text style={[s.buttonText, { color: colors.green }]}>🎙  Speak & transcribe</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || !text.trim() }} disabled={busy || !text.trim()} onPress={() => void saveNote()} style={[s.button, { backgroundColor: colors.green, opacity: busy || !text.trim() ? 0.5 : 1 }]}><Text style={[s.buttonText, { color: colors.white }]}>Save Note</Text></Pressable></View>
      {voice && <VoiceInput disabled={busy} onTranscript={(value) => setText((previous) => `${previous}${previous.trim() ? ' ' : ''}${value}`.slice(0, 12000))} />}
    </View>{action(favorite ? 'Saved to Favorites' : 'Save to Favorites', Heart, () => void toggleFavorite(), busy)}{action('Share Verse', Share2, () => { void Share.share({ message: `“${verse.quote}” — ${verse.reference} (${verse.translation})\nMeditate on the Word` }).catch(() => setError('Sharing is unavailable right now.')); })}</> : <Text style={{ color: colors.muted }}>This session is unavailable on this device.</Text>}
    {action('View Progress', ChartNoAxesColumn, () => router.replace('/(app)/(tabs)/progress'))}<Notice message={message || null} /><Notice error message={error || null} />
  </Page>;
}
const s = StyleSheet.create({ header: { flexDirection: 'row', justifyContent: 'space-between' }, hero: { alignItems: 'center', gap: 8, paddingVertical: 12 }, check: { height: 78, width: 78, borderRadius: 39, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }, title: { fontSize: 23, fontWeight: '800' }, sub: { fontSize: 13, textAlign: 'center' }, card: { borderRadius: 18, borderWidth: 1, padding: 18, gap: 12 }, label: { flexDirection: 'row', alignItems: 'center', gap: 8 }, labelText: { fontSize: 13, fontWeight: '700' }, input: { borderWidth: 1, borderRadius: 12, minHeight: 100, textAlignVertical: 'top', padding: 12, fontSize: 14 }, actions: { flexDirection: 'row', gap: 10 }, button: { flex: 1, minHeight: 48, padding: 8, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, buttonText: { fontSize: 12, fontWeight: '700', textAlign: 'center' }, action: { minHeight: 54, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, gap: 14 }, actionText: { flex: 1, fontWeight: '600', fontSize: 13 } });
