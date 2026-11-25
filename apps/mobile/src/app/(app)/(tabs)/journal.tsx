import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useData, useRecords } from '@/providers/data';
import { dailyVerse } from '@/lib/bible';
import { Button, Card, Copy, Page, SectionTitle, Title } from '@/components/ui';
export default function Journal() {
  const notes = useRecords('journal').sort((a, b) => b.data.createdAt.localeCompare(a.data.createdAt));
  const favorites = useRecords('favorite');
  const { profile, setSelectedVerse } = useData();
  const router = useRouter();
  return <Page><Title eyebrow="Your quiet conversations">The reflection journal</Title><Copy muted>A place to remember what God’s Word is stirring in you.</Copy>
    <Button title="Write a reflection" onPress={() => { setSelectedVerse(dailyVerse(profile.focus, profile.translation, new Date(), profile.timezone)); router.push('/(app)/journal/new'); }} />
    {!notes.length && <Card><SectionTitle>Your first page is waiting</SectionTitle><Copy muted>Write after a meditation, or begin with what is on your heart today.</Copy></Card>}
    {notes.map((record) => <Pressable key={record.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/(app)/journal/[id]', params: { id: record.id } })}>
      <Card><Copy small muted>{new Date(record.data.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {record.dirty ? 'Saved on this phone' : 'Synced'}</Copy>
        <SectionTitle>{record.data.verse.reference}</SectionTitle><Copy>{record.data.text.length > 180 ? `${record.data.text.slice(0, 180)}…` : record.data.text}</Copy>
      </Card></Pressable>)}
    <SectionTitle>Saved Scripture · {favorites.length}</SectionTitle>
    {favorites.length ? favorites.map((record) => <Pressable key={record.id} accessibilityRole="button" onPress={() => { setSelectedVerse(record.data.verse); router.push('/(app)/meditate'); }}>
      <Card><SectionTitle>{record.data.verse.reference} · {record.data.verse.translation}</SectionTitle><Copy muted>{record.data.verse.quote}</Copy></Card></Pressable>) : <Copy muted>Save a verse while reading to return to it here.</Copy>}
  </Page>;
}
