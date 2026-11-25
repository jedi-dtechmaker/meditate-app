import { useCallback, useEffect, useState } from 'react';
import { AppState, ImageBackground, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { BookOpen, ChevronRight, Clock3, Crown, Feather, Heart, MessageCircle, NotebookPen, Search, Shield, Sparkles, Sun, UserRound } from 'lucide-react-native';
import { FOCUSES, calculateProgress, localDateKey, type Focus, type Verse } from '@shared/domain';
import { useData, useRecords } from '@/providers/data';
import { useAuth } from '@/providers/auth';
import { dailyVerse, verseAt, versesForFocus } from '@/lib/bible';
import { getMeta, setMeta } from '@/lib/database';
import { DailyDevotional } from '@/components/devotional';
import { useDesign } from '@/components/ui';

const focusIcons = { Peace: Feather, Joy: Sun, Courage: Shield, Healing: Sparkles, Gratitude: Heart };
const durations = [{ label: 'Quick', minutes: 5 }, { label: 'Standard', minutes: 10 }, { label: 'Deep', minutes: 20 }];
type TodayChoice = { date: string; book: string; chapter: number; verse: number };

export default function Home() {
  const { profile, updateProfile, setSelectedVerse, pending, syncError } = useData();
  const { session } = useAuth();
  const sessions = useRecords('session');
  const { colors, isDark } = useDesign();
  const router = useRouter();
  const [now, setNow] = useState(new Date());
  const [resumable, setResumable] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [todayChoice, setTodayChoice] = useState<{ dayKey: string; choice: TodayChoice | null } | null>(null);
  const [choiceBusy, setChoiceBusy] = useState(false);
  const [choiceError, setChoiceError] = useState('');
  const userId = session!.user.id;
  const today = localDateKey(now, profile.timezone);
  const dayKey = `${userId}:${today}`;
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') setNow(new Date()); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  useEffect(() => {
    let active = true;
    void getMeta<TodayChoice>(userId, 'home:todayVerse').then((choice) => {
      if (active) setTodayChoice({ dayKey, choice: choice?.date === today ? choice : null });
    }).catch(() => {
      if (active) { setTodayChoice({ dayKey, choice: null }); setChoiceError('Could not load your selected verse.'); }
    });
    return () => { active = false; };
  }, [dayKey, today, userId]);
  useFocusEffect(useCallback(() => {
    setNow(new Date());
    void getMeta(session!.user.id, 'activeMeditation').then((value) => setResumable(Boolean(value))).catch(() => setResumable(false));
  }, [session]));
  const progress = calculateProgress(sessions.map((record) => record.data), now, profile.timezone);
  const choice = todayChoice?.dayKey === dayKey ? todayChoice.choice : null;
  let verse = dailyVerse(profile.focus, profile.translation, now, profile.timezone);
  if (choice) {
    try { verse = verseAt(choice.book, choice.chapter, choice.verse, profile.translation); } catch { /* Ignore an invalid saved reference. */ }
  }
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const background = isDark ? colors.bg : '#fff';
  const card = isDark ? colors.card : '#fff';
  const soft = isDark ? colors.soft : '#f2fbf6';
  const green = isDark ? colors.green : '#009d68';
  const changeProfile = (value: { focus?: Focus; durationMinutes?: number }) => {
    setUpdateError('');
    void updateProfile(value).catch(() => setUpdateError('Could not save your preference. Please try again.'));
  };
  const meditate = (selected: Verse) => { setSelectedVerse(selected); router.push('/(app)/meditate'); };
  const chooseToday = async (selected: Verse) => {
    const current = new Date();
    const date = localDateKey(current, profile.timezone);
    const value = { date, book: selected.book, chapter: selected.chapter, verse: selected.verse };
    setNow(current); setChoiceBusy(true); setChoiceError('');
    try {
      await setMeta(userId, 'home:todayVerse', value);
      setTodayChoice({ dayKey: `${userId}:${date}`, choice: value });
    } catch { setChoiceError('Could not save today’s verse on this phone. Please try again.'); }
    finally { setChoiceBusy(false); }
  };

  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: background }}>
    <StatusBar style={isDark ? 'light' : 'dark'} />
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.between}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => router.push('/(app)/settings')} style={[s.profileButton, { backgroundColor: soft }]}><UserRound size={19} color={green} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`${progress.streak} day streak. Open progress`} onPress={() => router.push('/(app)/(tabs)/progress')} style={[s.streak, { backgroundColor: soft }]}><Crown size={15} color={green} /><Text style={[s.streakText, { color: green }]}>{progress.streak}</Text></Pressable>
      </View>
      <View style={{ gap: 4 }}><Text accessibilityRole="header" style={[s.greeting, { color: colors.text }]}>{greeting}, {profile.name} 🌿</Text><Text style={[s.caption, { color: colors.muted }]}>Pause. Meditate. Connect.</Text></View>
      {(syncError || updateError) ? <Text style={{ color: colors.muted, fontSize: 12 }}>{updateError || (pending ? `${pending} change${pending === 1 ? '' : 's'} saved on this phone. We’ll sync when you reconnect.` : 'Your saved content is available on this phone.')}</Text> : null}
      {choiceError ? <Text style={{ color: colors.danger, fontSize: 12 }}>{choiceError}</Text> : null}
      <View style={s.searchRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Search the Bible" onPress={() => router.push('/(app)/(tabs)/bible')} style={[s.search, { borderColor: colors.line, backgroundColor: soft }]}><Search size={16} color={green} /><Text style={[s.searchText, { color: colors.muted }]}>Search Isaiah 26:3, John 3:16...</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/(app)/(tabs)/bible')} style={[s.bibleButton, { backgroundColor: green }]}><BookOpen size={15} color="#fff" /><Text style={s.whiteButtonText}>Full Bible</Text></Pressable>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Meditate on today's verse, ${verse.reference}`} onPress={() => meditate(verse)}>
        <ImageBackground source={require('../../../../assets/images/welcome/sea.jpg')} style={s.hero} imageStyle={{ borderRadius: 14 }}>
          <View style={s.heroShade} /><View style={s.heroContent}><Text style={s.heroLabel}>▣  Today’s Verse</Text><Text numberOfLines={3} style={s.heroQuote}>“{verse.quote}”</Text><Text style={s.heroReference}>{verse.reference} · {verse.translation}</Text><Text style={s.heroAction}>TAP TO MEDITATE  ›</Text></View>
        </ImageBackground>
      </Pressable>
      {resumable && <Pressable accessibilityRole="button" onPress={() => router.push('/(app)/meditate')} style={[s.resume, { backgroundColor: soft }]}><Text style={{ color: green, fontWeight: '700' }}>Return to your meditation</Text><ChevronRight size={18} color={green} /></Pressable>}
      <View style={s.durationRow}>{durations.map(({ label, minutes }) => {
        const selected = profile.durationMinutes === minutes;
        return <Pressable key={label} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => changeProfile({ durationMinutes: minutes })} style={[s.duration, { borderColor: selected ? green : colors.line, backgroundColor: selected ? soft : card }]}><View style={[s.miniIcon, { backgroundColor: soft }]}><Clock3 size={15} color={green} /></View><Text style={[s.durationTitle, { color: colors.text }]}>{label}</Text><Text style={[s.caption, { color: colors.muted }]}>{minutes} min</Text></Pressable>;
      })}</View>
      <DailyDevotional key={`${verse.id}:${profile.focus}`} verse={verse} />
      <Pressable accessibilityRole="button" onPress={() => router.push('/(app)/(tabs)/companion')} style={[s.companion, { backgroundColor: green }]}><View style={s.companionIcon}><MessageCircle size={21} color="#fff" /></View><View style={{ flex: 1, gap: 3 }}><Text style={s.companionTitle}>Talk with Sanctuary Companion</Text><Text style={s.companionCaption}>Chat or speak naturally about your day.</Text></View><Text style={s.chat}>Chat  ›</Text></Pressable>
      <View style={s.between}><Text accessibilityRole="header" style={[s.sectionTitle, { color: colors.text }]}>🌿 Choose Mood</Text><Text style={[s.caption, { color: green }]}>Choose what’s on your heart</Text></View>
      <View style={s.focusRow}>{FOCUSES.map((focus) => {
        const Icon = focusIcons[focus]; const selected = profile.focus === focus;
        return <Pressable key={focus} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => changeProfile({ focus })} style={[s.focus, { borderColor: selected ? green : colors.line, backgroundColor: selected ? soft : card }]}><View style={[s.focusIcon, { backgroundColor: selected ? green : soft }]}><Icon size={17} color={selected ? '#fff' : green} /></View><Text style={[s.focusText, { color: colors.text }]}>{focus}</Text></Pressable>;
      })}</View>
      <View style={[s.scriptures, { backgroundColor: soft, borderColor: colors.line }]}>
        <View style={s.scriptureHeading}><View style={[s.miniIcon, { backgroundColor: card }]}><BookOpen size={16} color={green} /></View><View><Text style={[s.sectionTitle, { color: colors.text }]}>Scriptures on {profile.focus}</Text><Text style={[s.caption, { color: colors.muted }]}>Verses for your selected mood</Text></View></View>
        {versesForFocus(profile.focus, profile.translation, now, profile.timezone).map((item) => {
          const selected = Boolean(choice && item.book === choice.book && item.chapter === choice.chapter && item.verse === choice.verse);
          return <View key={item.id} style={[s.scriptureCard, { backgroundColor: card, borderColor: colors.line }]}><View style={s.between}><Text style={[s.verseReference, { color: colors.text }]}>{item.reference}</Text><Text style={[s.focusBadge, { color: green, borderColor: colors.line }]}>{profile.focus}</Text></View><Text style={[s.scriptureQuote, { color: colors.muted }]}>“{item.quote}”</Text><View style={s.verseActions}><Pressable accessibilityRole="button" onPress={() => meditate(item)} style={[s.meditateButton, { backgroundColor: green }]}><Text style={s.whiteButtonText}>▶  Meditate Now</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={selected ? `${item.reference} is today’s verse` : `Set ${item.reference} as today’s verse`} accessibilityState={{ selected, disabled: choiceBusy || todayChoice?.dayKey !== dayKey }} disabled={choiceBusy || todayChoice?.dayKey !== dayKey} onPress={() => void chooseToday(item)} style={[s.todayButton, { borderColor: colors.line, opacity: choiceBusy || todayChoice?.dayKey !== dayKey ? 0.5 : 1 }]}><Text style={[s.todayButtonText, { color: green }]}>{selected ? 'Today’s Verse ✓' : 'Set as Today’s'}</Text></Pressable></View></View>;
        })}
        <Text style={[s.caption, { color: colors.muted }]}>Your choice is saved on this phone for today.</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push('/(app)/(tabs)/journal')} style={[s.resume, { backgroundColor: soft }]}><View style={s.scriptureHeading}><NotebookPen size={18} color={green} /><Text style={{ color: green, fontWeight: '700' }}>Open your journal</Text></View><ChevronRight size={18} color={green} /></Pressable>
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30, gap: 16, width: '100%', maxWidth: 740, alignSelf: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  profileButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, streak: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18 }, streakText: { fontWeight: '700', fontSize: 13 },
  greeting: { fontSize: 23, fontWeight: '800', letterSpacing: -0.6 }, caption: { fontSize: 11, lineHeight: 16 },
  searchRow: { flexDirection: 'row', gap: 8 }, search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, minHeight: 43 }, searchText: { fontSize: 11, flexShrink: 1 }, bibleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 9, paddingHorizontal: 12 }, whiteButtonText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  hero: { height: 188, overflow: 'hidden', borderRadius: 14, justifyContent: 'center' }, heroShade: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(10,25,30,0.54)' }, heroContent: { alignItems: 'center', gap: 8, paddingHorizontal: 20 }, heroLabel: { color: '#fff', backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4, fontSize: 10, fontWeight: '600' }, heroQuote: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: '#fff', textAlign: 'center', fontSize: 21, lineHeight: 26 }, heroReference: { color: '#fff', fontSize: 11 }, heroAction: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  resume: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12 }, durationRow: { flexDirection: 'row', gap: 10 }, duration: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 13, paddingVertical: 12, gap: 4 }, miniIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, durationTitle: { fontSize: 12, fontWeight: '700' },
  companion: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderRadius: 13 }, companionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' }, companionTitle: { fontSize: 12, color: '#fff', fontWeight: '700' }, companionCaption: { fontSize: 10, color: '#fff' }, chat: { color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, overflow: 'hidden', fontSize: 10, fontWeight: '700' }, sectionTitle: { fontSize: 13, fontWeight: '700' },
  focusRow: { flexDirection: 'row', gap: 6 }, focus: { flex: 1, minHeight: 74, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 7 }, focusIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, focusText: { fontSize: 10, fontWeight: '600' },
  scriptures: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 }, scriptureHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 }, scriptureCard: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 8 }, verseReference: { fontSize: 12, fontWeight: '700' }, focusBadge: { borderWidth: 1, borderRadius: 10, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 3, fontSize: 9 }, scriptureQuote: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontStyle: 'italic', fontSize: 13, lineHeight: 20 }, verseActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, meditateButton: { borderRadius: 7, paddingHorizontal: 15, paddingVertical: 10 }, todayButton: { borderWidth: 1, borderRadius: 7, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 9 }, todayButtonText: { fontSize: 11, fontWeight: '700' },
});
