import { useState } from 'react';
import { Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';
import type { Verse } from '@shared/domain';
import { useData, useRecords } from '@/providers/data';
import { Button, Card, Copy, Notice, styles, useDesign } from './ui';

export function VerseCard({ verse, compact = false, onNavigate }: { verse: Verse; compact?: boolean; onNavigate?: () => void }) {
  const { colors } = useDesign();
  const { setSelectedVerse, save } = useData();
  const favorites = useRecords('favorite');
  const saved = favorites.some((record) => record.data.verse.id === verse.id);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toggleFavorite = async () => {
    setBusy(true); setError(null);
    try {
      const hash = await digestStringAsync(CryptoDigestAlgorithm.SHA256, verse.id);
      const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-8${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
      await save('favorite', { verse }, id, saved);
    } catch { setError('We could not save this verse. Please try again.'); }
    finally { setBusy(false); }
  };
  return <Card>
    <View style={styles.between}><Copy small style={{ fontWeight: '700', color: colors.green }}>{verse.reference}</Copy><Copy small muted>{verse.translation}</Copy></View>
    <Text style={[styles.serif, { color: colors.text, fontSize: compact ? 19 : 25, lineHeight: compact ? 29 : 38 }]} selectable>“{verse.quote}”</Text>
    <Button title="Meditate on this verse" onPress={() => { onNavigate?.(); setSelectedVerse(verse); router.push('/(app)/meditate'); }} />
    <View style={styles.row}><View style={{ flex: 1 }}><Button secondary busy={busy} title={saved ? 'Saved ♥' : 'Save verse'} onPress={() => void toggleFavorite()} /></View>
      <View style={{ flex: 1 }}><Button secondary title="Share" onPress={() => { void Share.share({ message: `“${verse.quote}” — ${verse.reference} (${verse.translation})\nMeditate on the Word` }).catch(() => setError('Sharing is unavailable right now.')); }} /></View>
    </View><Notice error message={error} />
  </Card>;
}
