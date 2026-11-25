import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Moon, Sparkles, Sun } from 'lucide-react-native';
import type { Devotional, Verse } from '@shared/domain';
import { localDateKey } from '@shared/domain';
import { useAuth } from '@/providers/auth';
import { useData } from '@/providers/data';
import { getMeta, setMeta } from '@/lib/database';
import { api } from '@/lib/api';
import { Notice, useDesign } from './ui';

export function DailyDevotional({ verse }: { verse: Verse }) {
  const { session } = useAuth();
  const { profile } = useData();
  const { colors, isDark } = useDesign();
  const [period, setPeriod] = useState<'morning' | 'evening'>(() => new Date().getHours() < 17 ? 'morning' : 'evening');
  const key = `devotional:${localDateKey()}:${period}:${profile.focus}:${verse.id}`;
  const [cached, setCached] = useState<{ key: string; value: Devotional | null } | null>(null);
  const loading = cached?.key !== key;
  const devotional = loading ? null : cached.value;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const green = isDark ? colors.green : '#008c5d';
  const soft = isDark ? colors.soft : '#effbf4';

  useEffect(() => {
    let active = true;
    void getMeta<Devotional>(session!.user.id, key)
      .then((value) => { if (active) setCached({ key, value }); })
      .catch(() => { if (active) { setCached({ key, value: null }); setError('Could not load your saved reflection. Please try again.'); } });
    return () => { active = false; };
  }, [key, session]);
  const generate = async () => {
    setBusy(true); setError(null);
    try {
      const result = await api<{ devotional: Devotional }>('/api/devotional', { method: 'POST', body: JSON.stringify({ verse, focus: profile.focus, period }) }, session!.user.id);
      await setMeta(session!.user.id, key, result.devotional); setCached({ key, value: result.devotional });
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDark ? colors.line : '#b7ebcf' }]}>
    <View style={styles.heading}><View style={[styles.icon, { backgroundColor: soft }]}><Sparkles size={17} color={green} /></View><View style={{ flex: 1, gap: 3 }}><Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Daily Prayer Reflection</Text><Text style={[styles.subtitle, { color: green }]}>{verse.reference} · {profile.focus}</Text></View></View>
    <View style={[styles.tabs, { backgroundColor: soft }]}>{(['morning', 'evening'] as const).map((choice) => {
      const selected = choice === period;
      const Icon = choice === 'morning' ? Sun : Moon;
      return <Pressable key={choice} accessibilityRole="button" accessibilityState={{ selected, disabled: busy }} disabled={busy} onPress={() => { setError(null); setPeriod(choice); }} style={[styles.tab, { backgroundColor: selected ? colors.card : 'transparent', borderColor: selected ? green : 'transparent', opacity: busy ? 0.6 : 1 }]}><Icon size={15} color={green} /><Text style={[styles.tabText, { color: green }]}>{choice === 'morning' ? 'Morning' : 'Evening'}</Text></Pressable>;
    })}</View>
    <View style={styles.reflectionHeader}><Text style={[styles.reflectionTitle, { color: colors.text }]}>{devotional?.title || 'Quiet Trust for Today'}</Text><Text style={[styles.periodLabel, { color: green }]}>{period.toUpperCase()} LIGHT</Text></View>
    {loading ? <ActivityIndicator color={green} /> : devotional ? <><Text selectable style={[styles.reflection, { color: colors.text }]}>{devotional.reflection}</Text><View style={[styles.prayer, { backgroundColor: soft, borderColor: isDark ? colors.line : '#c4ecd4' }]}><Text style={[styles.periodLabel, { color: green }]}>{period.toUpperCase()} PRAYER</Text><Text selectable style={[styles.prayerText, { color: colors.text }]}>{devotional.prayer}</Text></View></> : <Text style={[styles.reflection, { color: colors.muted }]}>Create a short reflection and prayer based on today’s Scripture and what’s on your heart.</Text>}
    <Notice error message={error} />
    {!loading && <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={() => void generate()} style={[styles.generate, { backgroundColor: soft, opacity: busy ? 0.6 : 1 }]}>{busy && <ActivityIndicator size="small" color={green} />}<Text style={[styles.generateText, { color: green }]}>{busy ? 'Creating reflection…' : devotional ? 'Create a new reflection' : 'Create my reflection'}</Text></Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13, fontWeight: '700' }, subtitle: { fontSize: 11 },
  tabs: { flexDirection: 'row', borderRadius: 9, padding: 3, gap: 3 },
  tab: { flex: 1, borderRadius: 7, borderWidth: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  tabText: { fontSize: 12, fontWeight: '600' },
  reflectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  reflectionTitle: { flex: 1, fontSize: 13, fontWeight: '700' },
  periodLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  reflection: { fontSize: 13, lineHeight: 21 },
  prayer: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 7 },
  prayerText: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontStyle: 'italic', fontSize: 13, lineHeight: 22 },
  generate: { minHeight: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  generateText: { fontSize: 12, fontWeight: '700' },
});
