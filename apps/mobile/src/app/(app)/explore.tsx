import { useEffect, useMemo, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, ChevronRight, Search } from 'lucide-react-native';
import { TRANSLATIONS, type Translation } from '@shared/domain';
import { useData } from '@/providers/data';
import { searchBible, verseAt } from '@/lib/bible';
import { VerseCard } from '@/components/verse-card';
import { Page, useDesign } from '@/components/ui';

const topics = [
  { title: 'Faith', subtitle: 'Deepen belief', image: require('../../../assets/images/welcome/sunrise.jpg'), refs: [['Hebrews', 11, 1], ['2 Corinthians', 5, 7], ['Mark', 11, 24]] },
  { title: 'Healing', subtitle: 'Find peace', image: require('../../../assets/images/welcome/forest.jpg'), refs: [['Jeremiah', 17, 14], ['Psalms', 147, 3], ['Matthew', 11, 28]] },
  { title: 'Finances', subtitle: 'Trust God', image: require('../../../assets/images/welcome/mountains.jpg'), refs: [['Philippians', 4, 19], ['Proverbs', 3, 9], ['Matthew', 6, 33]] },
  { title: 'Wisdom', subtitle: 'Seek guidance', image: require('../../../assets/images/welcome/lake.jpg'), refs: [['James', 1, 5], ['Proverbs', 3, 5], ['Proverbs', 2, 6]] },
  { title: 'Peace', subtitle: 'Be still', image: require('../../../assets/images/welcome/sea.jpg'), refs: [['Isaiah', 26, 3], ['John', 14, 27], ['Psalms', 46, 10]] },
  { title: 'Courage', subtitle: 'Find strength', image: require('../../../assets/images/welcome/mountains.jpg'), refs: [['Joshua', 1, 9], ['Isaiah', 41, 10], ['2 Timothy', 1, 7]] },
] as const;
const suggestions = ['Isaiah 26:3', 'John 3:16', 'Psalms 23:1', 'Romans 8:28'];
export default function Explore({ showBack = true }: { showBack?: boolean }) {
  const { profile, updateProfile } = useData();
  const { colors } = useDesign();
  const router = useRouter();
  const [topic, setTopic] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [changing, setChanging] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setSearch(query.trim()), 300); return () => clearTimeout(timer); }, [query]);
  const selected = topics.find((item) => item.title === topic);
  const verses = useMemo(() => {
    if (search.length > 1) return searchBible(search, profile.translation);
    return selected?.refs.flatMap(([book, chapter, number]) => { try { return [verseAt(book, chapter, number, profile.translation)]; } catch { return []; } }) || [];
  }, [search, selected, profile.translation]);
  const changeTranslation = async (translation: Translation) => {
    if (translation === profile.translation || changing) return;
    setChanging(true); setError('');
    try { await updateProfile({ translation }); } catch { setError('Could not change Bible version. Please try again.'); } finally { setChanging(false); }
  };
  const chip = (label: string, active: boolean, onPress: () => void) => <Pressable key={label} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[s.chip, { backgroundColor: active ? colors.green : colors.card, borderColor: active ? colors.green : colors.line }]}><Text style={{ color: active ? colors.white : colors.green, fontWeight: '700', fontSize: 12 }}>{label}</Text></Pressable>;
  return <Page>{showBack && <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()}><ArrowLeft color={colors.green} size={22} /></Pressable>}<View style={s.between}><View><Text accessibilityRole="header" style={[s.title, { color: colors.text }]}>Explore</Text><Text style={[s.caption, { color: colors.muted }]}>Search all 66 Bible books or browse topics</Text></View>{chip(profile.translation, true, () => router.push('/(app)/(tabs)/bible'))}</View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0, minHeight: 50 }} contentContainerStyle={s.horizontal}>{TRANSLATIONS.map((translation) => chip(translation, translation === profile.translation, () => void changeTranslation(translation)))}</ScrollView>
    {Boolean(error) && <Text style={{ color: colors.danger }}>{error}</Text>}
    <View style={[s.search, { backgroundColor: colors.card, borderColor: colors.line }]}><Search size={19} color={colors.green} /><TextInput accessibilityLabel="Search any verse or word" placeholder="Search any verse (John 3:16) or word" placeholderTextColor={colors.muted} value={query} onChangeText={(value) => { setQuery(value); setTopic(null); }} maxLength={150} style={{ flex: 1, color: colors.text, minHeight: 48 }} /></View>
    <Pressable accessibilityRole="button" onPress={() => router.push('/(app)/(tabs)/bible')} style={[s.bible, { backgroundColor: colors.green }]}><BookOpen size={24} color={colors.white} /><View style={{ flex: 1 }}><Text style={{ color: colors.white, fontWeight: '800' }}>Read Full Holy Bible</Text><Text style={{ color: colors.white, fontSize: 11 }}>Genesis to Revelation · All 66 books</Text></View><ChevronRight size={20} color={colors.white} /></Pressable>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0, minHeight: 50 }} contentContainerStyle={s.horizontal}>{suggestions.map((value) => chip(value, query === value, () => { setTopic(null); setQuery(value); }))}</ScrollView>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0, minHeight: 50 }} contentContainerStyle={s.horizontal}>{chip('All', !topic && !query, () => { setTopic(null); setQuery(''); })}{topics.map((item) => chip(item.title, item.title === topic, () => { setQuery(''); setSearch(''); setTopic(item.title); }))}</ScrollView>
    {(topic || search.length > 1) ? <><View style={s.between}><Text accessibilityRole="header" style={[s.heading, { color: colors.text }]}>{search ? `Results for “${search}”` : `Scriptures on ${topic}`}</Text><Pressable accessibilityRole="button" onPress={() => { setTopic(null); setQuery(''); setSearch(''); }}><Text style={{ color: colors.green }}>Clear</Text></Pressable></View>{verses.length ? verses.map((verse) => <VerseCard key={verse.id} verse={verse} compact />) : <Text style={{ color: colors.muted }}>No verses found in this translation.</Text>}</> : <View style={s.grid}>{topics.map((item) => <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={`Explore ${item.title}`} onPress={() => setTopic(item.title)} style={s.tile}><ImageBackground source={item.image} style={s.tileImage} imageStyle={{ borderRadius: 15 }}><View style={s.tileShade} /><View><Text style={s.tileTitle}>{item.title}</Text><Text style={s.tileCaption}>{item.subtitle}</Text></View></ImageBackground></Pressable>)}</View>}
  </Page>;
}
const s = StyleSheet.create({ title: { fontWeight: '800', fontSize: 25 }, caption: { fontSize: 12, marginTop: 4 }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, horizontal: { alignItems: 'center', gap: 8 }, chip: { minHeight: 38, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, justifyContent: 'center' }, search: { borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 }, bible: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }, heading: { fontWeight: '800', fontSize: 16, flex: 1 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, tile: { width: '48%', flexGrow: 1 }, tileImage: { height: 150, padding: 14, justifyContent: 'flex-end', overflow: 'hidden', borderRadius: 15 }, tileShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.43)' }, tileTitle: { color: '#fff', fontSize: 17, fontWeight: '800' }, tileCaption: { color: '#fff', fontSize: 12, marginTop: 3 } });
