import { useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BookOpen, ChevronLeft, ChevronRight, Search } from 'lucide-react-native';
import { bible, isOmittedReference, searchBible, versesInChapter } from '@/lib/bible';
import { useData } from '@/providers/data';
import { TRANSLATIONS, TRANSLATION_NAMES, type Translation, type Verse } from '@shared/domain';
import { Button, Copy, Page, styles, Title, useDesign } from '@/components/ui';
import { VerseCard } from '@/components/verse-card';

const suggestions = ['Isaiah 26:3', 'John 3:16', 'Psalms 23:1', 'Genesis 1:1'];
type Testament = 'All' | 'Old Testament' | 'New Testament';

export default function BibleScreen() {
  const { profile, updateProfile } = useData();
  const { colors, isDark } = useDesign();
  const { fontScale } = useWindowDimensions();
  const books = bible(profile.translation);
  const [book, setBook] = useState<string | null>(null);
  const [chapter, setChapter] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [testament, setTestament] = useState<Testament>('All');
  const [selected, setSelected] = useState<Verse | null>(null);
  const [translationError, setTranslationError] = useState('');
  const [changingTranslation, setChangingTranslation] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setSearch(query.trim()), 300); return () => clearTimeout(timer); }, [query]);
  const selectedBook = books.find((item) => item.name === book);
  const verses = useMemo(() => {
    if (search.length > 1) return searchBible(search, profile.translation);
    if (!book) return [];
    return versesInChapter(book, chapter, profile.translation);
  }, [book, chapter, profile.translation, search]);
  const visibleBooks = books.map((item, index) => ({ ...item, number: index + 1 }))
    .filter((item) => testament === 'All' || (testament === 'Old Testament' ? item.number <= 39 : item.number > 39));
  const openBook = (name: string) => { setBook(name); setChapter(1); setQuery(''); setSearch(''); };
  const changeTranslation = async (translation: Translation) => {
    if (translation === profile.translation || changingTranslation) return;
    setTranslationError('');
    setChangingTranslation(true);
    try { await updateProfile({ translation }); }
    catch { setTranslationError('Could not change Bible version. Please try again.'); }
    finally { setChangingTranslation(false); }
  };
  const showingVerses = search.length > 1 || Boolean(selectedBook);
  const capsule = (active: boolean) => ({ borderRadius: 20, borderWidth: 1, borderColor: active ? colors.green : colors.line, backgroundColor: active ? colors.green : colors.card, paddingHorizontal: 13, paddingVertical: 8 });
  const capsuleText = (active: boolean) => ({ color: active ? colors.white : colors.green, fontSize: 12, fontWeight: '600' as const });
  const horizontalRow = { flexGrow: 0, flexShrink: 0, minHeight: Math.max(44, 22 * fontScale + 18) };

  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
    <StatusBar style={isDark ? 'light' : 'dark'} />
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
    <View style={{ flex: 1, width: '100%', maxWidth: 740, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 10, gap: 10 }}>
    <View style={styles.between}>
      <View style={[styles.row, { flex: 1 }]}><View style={{ backgroundColor: colors.green, borderRadius: 12, padding: 9 }}><BookOpen color={colors.white} size={20} /></View>
        <View style={{ flex: 1 }}><Text accessibilityRole="header" style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>Holy Bible</Text><Copy small muted>Genesis to Revelation · {books.length} books</Copy></View></View>
      <View style={capsule(true)}><Text style={capsuleText(true)}>{profile.translation}</Text></View>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={horizontalRow} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
      {TRANSLATIONS.map((translation) => <Pressable key={translation} accessibilityRole="button" accessibilityLabel={TRANSLATION_NAMES[translation]} accessibilityState={{ selected: profile.translation === translation, disabled: changingTranslation }} disabled={changingTranslation} onPress={() => { void changeTranslation(translation); }} style={capsule(profile.translation === translation)}><Text style={capsuleText(profile.translation === translation)}>{translation}</Text></Pressable>)}
    </ScrollView>
    {Boolean(translationError) && <Text accessibilityLiveRegion="polite" style={{ color: colors.danger, fontSize: 13 }}>{translationError}</Text>}
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 14 }}>
      <Search size={18} color={colors.green} /><TextInput accessibilityLabel="Search Scripture" placeholder="Search any verse (John 3:16) or word" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} maxLength={150} autoCorrect={false} style={{ flex: 1, minHeight: 48, color: colors.text }} />
    </View>
    {!showingVerses && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={horizontalRow} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
      {suggestions.map((suggestion) => <Pressable key={suggestion} accessibilityRole="button" style={capsule(false)} onPress={() => setQuery(suggestion)}><Text style={capsuleText(false)}>{suggestion}</Text></Pressable>)}
    </ScrollView>}
    {showingVerses ? <>
      <View style={styles.between}><Pressable accessibilityRole="button" accessibilityLabel="Back to books" onPress={() => { setBook(null); setQuery(''); setSearch(''); }} style={[styles.row, { paddingVertical: 8 }]}><ChevronLeft size={18} color={colors.green} /><Copy style={{ fontWeight: '700' }}>{search ? 'Books' : `${book} ${chapter}`}</Copy></Pressable>
        {!search && selectedBook && <View style={styles.row}><Pressable accessibilityRole="button" accessibilityLabel="Previous chapter" onPress={() => setChapter((value) => Math.max(1, value - 1))} style={{ padding: 10 }}><ChevronLeft color={colors.green} size={20} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Next chapter" onPress={() => setChapter((value) => Math.min(selectedBook.chapters.length, value + 1))} style={{ padding: 10 }}><ChevronRight color={colors.green} size={20} /></Pressable></View>}
      </View>
      <Copy small muted>{search ? `${verses.length}${verses.length === 40 ? '+' : ''} results · ${profile.translation}` : 'Tap a verse to meditate, save, or share.'}</Copy>
      <FlatList data={verses} keyExtractor={(verse) => verse.id} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }} ListEmptyComponent={<Copy muted>{isOmittedReference(search, profile.translation) ? `This verse is not included in ${profile.translation}. Try another version.` : 'No verses matched. Try a reference such as John 3:16 or a single word.'}</Copy>}
        renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`${item.reference}. ${item.quote}. Open verse actions.`} onPress={() => setSelected(item)} style={{ paddingVertical: 17, borderBottomColor: colors.line, borderBottomWidth: 1 }}>
          {search && <Copy small muted>{item.reference}</Copy>}<Text style={[styles.serif, { fontSize: 21, lineHeight: 34, color: colors.text }]}><Text style={{ color: colors.green, fontSize: 12 }}>{item.verse}  </Text>{item.quote}</Text>
        </Pressable>} />
    </> : <>
      <View style={[styles.row, { gap: 6 }]}>{(['All', 'Old Testament', 'New Testament'] as const).map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: testament === value }} onPress={() => setTestament(value)} style={[capsule(testament === value), { flex: 1, alignItems: 'center', paddingHorizontal: 5 }]}><Text style={capsuleText(testament === value)}>{value === 'All' ? `All (${books.length})` : value === 'Old Testament' ? 'Old Test. (39)' : `New Test. (${Math.max(0, books.length - 39)})`}</Text></Pressable>)}</View>
      <FlatList data={visibleBooks} numColumns={2} keyExtractor={(item) => item.name} columnWrapperStyle={{ gap: 10 }} contentContainerStyle={{ gap: 10, paddingBottom: 24 }} renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`${item.name}, ${item.chapters.length} chapters`} onPress={() => openBook(item.name)} style={{ flex: 1, minHeight: 92, borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.card, padding: 12 }}>
        <View style={styles.between}><Text style={{ color: colors.green, fontSize: 11, fontWeight: '700' }}>{item.number}. {item.number > 39 ? 'NT' : 'OT'}</Text><ChevronRight size={15} color={colors.green} /></View><Text style={{ color: colors.text, fontWeight: '700', marginTop: 4 }}>{item.name}</Text><Copy small muted>{item.chapters.length} chapters</Copy>
      </Pressable>} />
    </>}
    <Modal visible={Boolean(selected)} animationType="slide" onRequestClose={() => setSelected(null)}><Page><Title>Rest in these words</Title>{selected && <VerseCard verse={selected} onNavigate={() => setSelected(null)} />}<Button secondary title="Back to reading" onPress={() => setSelected(null)} /></Page></Modal>
    </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
