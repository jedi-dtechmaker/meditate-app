import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Clock3, Feather, Flame, Trophy } from 'lucide-react-native';
import { calculateProgress, localDateKey } from '@shared/domain';
import { useData, useRecords } from '@/providers/data';
import { Page, useDesign } from '@/components/ui';

export default function Progress() {
  const { profile, setSelectedVerse } = useData();
  const router = useRouter();
  const { colors } = useDesign();
  const [showAll, setShowAll] = useState(false);
  const sessions = useRecords('session').sort((a, b) => b.data.completedAt.localeCompare(a.data.completedAt));
  const progress = calculateProgress(sessions.map((record) => record.data), new Date(), profile.timezone);
  const today = localDateKey(new Date(), profile.timezone);
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.parse(`${today}T12:00:00Z`) - (6 - i) * 86400000);
    const key = date.toISOString().slice(0, 10);
    return { key, label: date.toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' }), count: sessions.filter((item) => item.data.localDate === key).length };
  });
  const max = Math.max(1, ...week.map((day) => day.count));
  const minutes = Math.floor(progress.totalSeconds / 60);
  const time = minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
  const card = { backgroundColor: colors.card, borderColor: colors.line };
  return <Page><Text accessibilityRole="header" style={[s.title, { color: colors.text }]}>🌿 Your Progress</Text>
    <View style={s.row}><View style={[s.stat, card]}><View style={[s.icon, { backgroundColor: colors.soft }]}><Flame size={20} color="#ef9d16" /></View><Text style={[s.number, { color: colors.text }]}>{progress.streak}</Text><Text style={[s.caption, { color: colors.muted }]}>Day Streak</Text></View><View style={[s.stat, card]}><View style={[s.icon, { backgroundColor: colors.soft }]}><Clock3 size={20} color={colors.green} /></View><Text style={[s.number, { color: colors.text }]}>{time}</Text><Text style={[s.caption, { color: colors.muted }]}>Total Time</Text></View></View>
    <View style={[s.chart, card]}><View style={s.between}><Text style={[s.heading, { color: colors.text }]}>Meditation Sessions</Text><Text style={[s.heading, { color: colors.green }]}>{progress.sessionCount} total</Text></View><Text style={[s.caption, { color: colors.muted }]}>Past seven days</Text><View style={s.bars}>{week.map((day) => <View key={day.key} style={s.day} accessibilityLabel={`${day.label}: ${day.count} sessions`}><View style={s.barArea}><View style={{ width: 18, height: day.count ? Math.max(8, day.count / max * 100) : 3, borderRadius: 9, backgroundColor: day.key === today ? colors.green : day.count ? '#80dcb5' : colors.line }} /></View><Text style={[s.caption, { color: colors.muted }]}>{day.label}</Text></View>)}</View></View>
    <View style={s.between}><Text accessibilityRole="header" style={[s.heading, { color: colors.text }]}>Recent Activity</Text>{sessions.length > 3 && <Pressable accessibilityRole="button" onPress={() => setShowAll(!showAll)}><Text style={[s.heading, { color: colors.green }]}>{showAll ? 'Show less' : 'See all ›'}</Text></Pressable>}</View>
    {!sessions.length && <Text style={[s.caption, { color: colors.muted }]}>Your completed meditations will appear here.</Text>}
    {(showAll ? sessions : sessions.slice(0, 3)).map((record) => <Pressable key={record.id} accessibilityRole="button" onPress={() => { setSelectedVerse(record.data.verse); router.push('/(app)/meditate'); }} style={[s.activity, card]}><View style={[s.icon, { backgroundColor: colors.soft }]}><Feather size={18} color={colors.green} /></View><View style={{ flex: 1, gap: 3 }}><Text style={[s.heading, { color: colors.text }]}>{record.data.verse.reference}</Text><Text style={[s.caption, { color: colors.muted }]}>{record.data.localDate === today ? 'Today' : new Date(record.data.completedAt).toLocaleDateString()} · {Math.floor(record.data.durationSeconds / 60)} min</Text></View><ChevronRight size={18} color={colors.green} /></Pressable>)}
    <View style={[s.banner, { backgroundColor: colors.soft, borderColor: colors.line }]}><Trophy size={24} color="#d5a51b" /><Text style={[s.heading, { color: colors.green, flex: 1 }]}>You’re growing in faith! Keep going 🌿</Text></View>
    <Pressable accessibilityRole="button" onPress={() => router.push('/(app)/(tabs)/journal')}><Text style={[s.heading, { color: colors.green, textAlign: 'center' }]}>Open reflection journal ›</Text></Pressable>
  </Page>;
}
const s = StyleSheet.create({ title: { fontSize: 23, fontWeight: '800' }, row: { flexDirection: 'row', gap: 12 }, stat: { flex: 1, borderWidth: 1, borderRadius: 18, alignItems: 'center', gap: 8, padding: 18 }, icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, number: { fontSize: 26, fontWeight: '800' }, caption: { fontSize: 12 }, chart: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 8 }, between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, heading: { fontWeight: '700', fontSize: 13 }, bars: { flexDirection: 'row', justifyContent: 'space-between', gap: 5, paddingTop: 12 }, day: { alignItems: 'center', flex: 1, gap: 8 }, barArea: { height: 100, justifyContent: 'flex-end', alignItems: 'center' }, activity: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 12 }, banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 16 } });
