import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BookOpen, CircleHelp, Heart, MessageCircle, Mic, Send, Sparkles, Trash2 } from 'lucide-react-native';
import type { LocalRecord } from '@shared/domain';
import { useAuth } from '@/providers/auth';
import { useData, useRecords } from '@/providers/data';
import { api } from '@/lib/api';
import { Notice, useDesign } from '@/components/ui';
import { VoiceInput } from '@/components/voice-input';

type ChatMode = 'chat' | 'prayer' | 'study' | 'quiz';
const modes = [
  { id: 'chat', title: 'Just Chat', icon: MessageCircle },
  { id: 'prayer', title: 'Prayer', icon: Heart },
  { id: 'study', title: 'Bible Study', icon: BookOpen },
  { id: 'quiz', title: 'Quiz', icon: CircleHelp },
] as const;
const suggestions: Record<ChatMode, string[]> = {
  chat: ['Here’s how my day is going…', 'Can we pray together for a moment?', 'Let’s talk about Hebrews 11:1'],
  prayer: ['Help me pray for peace.', 'Can we pray for someone I love?', 'Help me express my gratitude.'],
  study: ['Help me understand Psalm 23.', 'What is the context of John 3:16?', 'Let’s explore Hebrews 11:1.'],
  quiz: ['Quiz me on the Gospels.', 'Ask me a question about Genesis.', 'Help me learn about the Psalms.'],
};

export default function Companion() {
  const { profile, save } = useData();
  const { session } = useAuth();
  const { colors, isDark } = useDesign();
  const messages = useRecords('chat').sort((a, b) => a.data.createdAt.localeCompare(b.data.createdAt));
  const list = useRef<FlatList<LocalRecord<'chat'>>>(null);
  const controller = useRef<AbortController | null>(null);
  const active = useRef(true);
  const busyRef = useRef(false);
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState<ChatMode>('chat');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState<{ message: LocalRecord<'chat'>; mode: ChatMode } | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const green = isDark ? colors.green : '#009d68';
  const soft = isDark ? colors.soft : '#f1fbf6';
  const surface = isDark ? colors.bg : '#fff';
  useEffect(() => { active.current = true; return () => { active.current = false; controller.current?.abort(); }; }, []);

  const send = async (failed?: { message: LocalRecord<'chat'>; mode: ChatMode }) => {
    const text = failed?.message.data.text || draft.trim();
    const selectedMode = failed?.mode || mode;
    if (!text || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(null); setRetry(null);
    let userMessage = failed?.message;
    try {
      if (!userMessage) {
        const createdAt = new Date().toISOString();
        const id = await save('chat', { role: 'user', text, createdAt });
        userMessage = { id, kind: 'chat', data: { role: 'user', text, createdAt }, version: 0, deleted: false, dirty: true, mutationId: '', updated_at: createdAt };
        setDraft('');
      }
      controller.current = new AbortController();
      const history = messages.filter((record) => record.data.createdAt < userMessage!.data.createdAt).slice(-24).map((record) => ({ role: record.data.role, text: record.data.text.slice(0, 8000) }));
      const result = await api<{ reply: string }>('/api/chat', { method: 'POST', signal: controller.current.signal, body: JSON.stringify({ message: text, history, focus: profile.focus, mode: selectedMode }) }, session!.user.id);
      controller.current.signal.throwIfAborted();
      if (active.current) await save('chat', { role: 'model', text: result.reply, createdAt: new Date().toISOString() });
    } catch (failure) {
      if (active.current) { setError(failure instanceof Error ? failure.message : 'We could not send that message.'); setRetry(userMessage ? { message: userMessage, mode: selectedMode } : null); }
    } finally { busyRef.current = false; if (active.current) setBusy(false); }
  };
  const clear = () => Alert.alert('Clear your conversations?', 'This removes your saved conversation history from your account after syncing.', [
    { text: 'Keep conversations', style: 'cancel' }, { text: 'Clear', style: 'destructive', onPress: () => {
      void Promise.all(messages.map((message) => save('chat', message.data, message.id, true))).then(() => { setRetry(null); setError(null); }).catch(() => setError('We could not clear all messages yet. Please try again.'));
    } },
  ]);
  return <SafeAreaView edges={['top', 'left', 'right']} style={[s.root, { backgroundColor: surface }]}>
    <StatusBar style={isDark ? 'light' : 'dark'} />
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.header, { borderBottomColor: colors.line }]}>
        <View style={[s.avatar, { backgroundColor: soft }]}><Sparkles color={green} size={22} /></View>
        <View style={s.headerText}><Text accessibilityRole="header" style={[s.title, { color: colors.text }]}>Your Sanctuary Companion</Text><Text style={[s.subtitle, { color: green }]}>A quiet space for Scripture and prayer</Text></View>
        {messages.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Clear conversation" disabled={busy} onPress={clear} style={[s.iconButton, { borderColor: colors.line }]}><Trash2 color={green} size={17} /></Pressable>}
        <Pressable accessibilityRole="button" accessibilityLabel={voiceOpen ? 'Hide voice input' : 'Open voice input'} accessibilityState={{ expanded: voiceOpen, disabled: busy }} disabled={busy} onPress={() => setVoiceOpen(!voiceOpen)} style={[s.voiceButton, { borderColor: colors.line, backgroundColor: soft }]}><Mic color={green} size={14} /><Text style={[s.voiceText, { color: green }]}>Voice</Text></Pressable>
      </View>
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.line }}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.modes}>
        {modes.map(({ id, title, icon: Icon }) => <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: mode === id, disabled: busy }} disabled={busy} onPress={() => setMode(id)} style={[s.mode, { backgroundColor: mode === id ? green : soft, borderColor: mode === id ? green : colors.line }]}><Icon size={14} color={mode === id ? '#fff' : green} /><Text style={[s.modeText, { color: mode === id ? '#fff' : colors.text }]}>{title}</Text></Pressable>)}
      </ScrollView></View>
      <FlatList ref={list} style={s.root} data={messages} keyExtractor={(record) => record.id} keyboardShouldPersistTaps="handled" onContentSizeChange={() => { if (messages.length) list.current?.scrollToEnd({ animated: true }); }}
        contentContainerStyle={s.conversation}
        ListHeaderComponent={<View style={{ gap: 12 }}><View style={[s.message, s.welcome, { backgroundColor: colors.card, borderColor: colors.line }]}><Text style={[s.messageText, { color: colors.text }]}>Hey {profile.name || 'there'} 🌿 Talk with me about anything on your mind today—how you’re really feeling, something going on in your life, a prayer request, or anything from Scripture. I’m listening.</Text></View>
          {!messages.length && <View style={s.suggestions}>{suggestions[mode].map((suggestion) => <Pressable accessibilityRole="button" key={suggestion} onPress={() => setDraft(suggestion)} style={[s.suggestion, { borderColor: colors.line, backgroundColor: soft }]}><Text style={[s.suggestionText, { color: green }]}>{suggestion}</Text></Pressable>)}</View>}</View>}
        renderItem={({ item }) => <View style={[s.message, { alignSelf: item.data.role === 'user' ? 'flex-end' : 'flex-start', backgroundColor: item.data.role === 'user' ? soft : colors.card, borderColor: colors.line }]}><Text style={[s.messageLabel, { color: green }]}>{item.data.role === 'user' ? 'YOU' : 'SANCTUARY COMPANION'}</Text><Text selectable style={[s.messageText, { color: colors.text }]}>{item.data.text}</Text></View>} />
      <View style={[s.composer, { borderTopColor: colors.line, backgroundColor: surface }]}>
        {busy && <View style={s.inline}><ActivityIndicator size="small" color={green} /><Text style={[s.helper, { color: colors.muted }]}>Preparing a reply…</Text></View>}
        <Notice error message={error} />
        {retry && <Pressable accessibilityRole="button" onPress={() => void send(retry)}><Text style={{ color: green, fontWeight: '700', paddingVertical: 5 }}>Try sending again</Text></Pressable>}
        {voiceOpen && <VoiceInput disabled={busy} onTranscript={(value) => setDraft((previous) => `${previous}${previous.trim() ? ' ' : ''}${value}`.slice(0, 4000))} />}
        <View style={s.composeRow}><Pressable accessibilityRole="button" accessibilityLabel={voiceOpen ? 'Hide voice input' : 'Open voice input'} accessibilityState={{ expanded: voiceOpen, disabled: busy }} disabled={busy} onPress={() => setVoiceOpen(!voiceOpen)} style={[s.mic, { backgroundColor: soft, borderColor: colors.line }]}><Mic size={19} color={green} /></Pressable>
          <TextInput accessibilityLabel="Message your AI companion" placeholder="Say whatever is on your heart…" placeholderTextColor={colors.muted} value={draft} onChangeText={setDraft} multiline maxLength={4000} editable={!busy} style={[s.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.line }]} />
          <Pressable accessibilityRole="button" accessibilityLabel="Send message" accessibilityState={{ disabled: busy || !draft.trim() }} disabled={busy || !draft.trim()} onPress={() => void send()} style={[s.send, { backgroundColor: green, opacity: busy || !draft.trim() ? 0.45 : 1 }]}><Send size={18} color="#fff" /></Pressable></View>
        <Text style={[s.helper, { color: colors.muted }]}>Voice: review your transcript before sending. AI can make mistakes; check Bible references.</Text>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, headerText: { flex: 1, gap: 3 }, title: { fontWeight: '800', fontSize: 15 }, subtitle: { fontSize: 11 },
  iconButton: { width: 35, height: 35, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, voiceButton: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 9 }, voiceText: { fontWeight: '700', fontSize: 11 },
  modes: { gap: 7, paddingHorizontal: 14, paddingVertical: 10 }, mode: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 18, paddingVertical: 8, paddingHorizontal: 12 }, modeText: { fontSize: 11, fontWeight: '700' },
  conversation: { padding: 16, paddingBottom: 20, gap: 12 }, message: { padding: 14, borderRadius: 16, borderWidth: 1, maxWidth: '92%', gap: 6 }, welcome: { alignSelf: 'flex-start' }, messageText: { fontSize: 14, lineHeight: 22 }, messageLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  suggestions: { alignItems: 'flex-start', gap: 7 }, suggestion: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 }, suggestionText: { fontSize: 12, fontWeight: '600' },
  composer: { borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, gap: 7 }, composeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 }, mic: { width: 44, height: 44, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, input: { flex: 1, minHeight: 44, maxHeight: 110, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 }, send: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, helper: { fontSize: 11, lineHeight: 16 }, inline: { flexDirection: 'row', alignItems: 'center', gap: 7 },
});
