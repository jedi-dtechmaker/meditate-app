import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { randomUUID } from 'expo-crypto';
import type { LocalRecord, Profile, RecordData, RecordKind, Verse } from '@shared/domain';
import { defaultProfile } from '@shared/domain';
import { dataSchemas } from '@shared/validation';
import { allRecords, resolveConflict, saveRecord } from '@/lib/database';
import { stopSync, syncUser } from '@/lib/sync';
import { useAuth } from './auth';

type Save = <K extends RecordKind>(kind: K, data: RecordData[K], id?: string, deleted?: boolean) => Promise<string>;
type DataState = {
  records: LocalRecord[]; profile: Profile; loading: boolean; bootError: string | null;
  syncing: boolean; syncError: string | null; pending: number; save: Save; sync: () => Promise<void>;
  updateProfile: (value: Partial<Profile>) => Promise<void>;
  resolve: (record: LocalRecord, keep: 'device' | 'cloud') => Promise<void>;
  selectedVerse: Verse | null; setSelectedVerse: (verse: Verse) => void;
};
const DataContext = createContext<DataState | null>(null);
export function DataProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const userId = session!.user.id;
  const [records, setRecords] = useState<LocalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const active = useRef(true);
  const reload = useCallback(async () => {
    const values = await allRecords(userId);
    if (active.current) setRecords(values);
    return values;
  }, [userId]);
  const sync = useCallback(async () => {
    if (!active.current) return;
    setSyncing(true);
    try {
      await syncUser(userId);
      if (active.current) { setSyncError(null); setBootError(null); setLoading(false); }
    } catch (error) {
      if (active.current) setSyncError(error instanceof Error ? error.message : 'Cloud sync is unavailable.');
      throw error;
    } finally {
      await reload();
      if (active.current) setSyncing(false);
    }
  }, [reload, userId]);
  useEffect(() => {
    active.current = true;
    (async () => {
      const cached = await reload();
      if (cached.some((record) => record.kind === 'profile')) setLoading(false);
      try { await sync(); }
      catch (error) {
        if (active.current && !cached.some((record) => record.kind === 'profile')) {
          setBootError(error instanceof Error ? error.message : 'We could not open your account.'); setLoading(false);
        }
      }
    })().catch(() => { if (active.current) { setBootError('We could not open your saved data. Please restart the app.'); setLoading(false); } });
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void sync().catch(() => {}); });
    const retry = setInterval(() => { void sync().catch(() => {}); }, 45000);
    return () => { active.current = false; subscription.remove(); clearInterval(retry); void stopSync(userId); };
  }, [reload, sync, userId]);
  const profile = useMemo(() => (records.find((record) => record.kind === 'profile' && !record.deleted)?.data as Profile | undefined)
    || defaultProfile(String(session?.user.user_metadata?.name || '')), [records, session]);
  const save: Save = useCallback(async (kind, data, id, deleted = false) => {
    if (!active.current) throw new Error('Please sign in to continue.');
    const parsed = dataSchemas[kind].parse(data) as RecordData[typeof kind];
    const recordId = kind === 'profile' ? userId : id || randomUUID();
    await saveRecord(userId, kind, recordId, parsed, deleted);
    await reload();
    void sync().catch(() => {});
    return recordId;
  }, [reload, sync, userId]);
  const updateProfile = useCallback(async (value: Partial<Profile>) => { await save('profile', { ...profile, ...value }); }, [profile, save]);
  const resolve = useCallback(async (record: LocalRecord, keep: 'device' | 'cloud') => {
    await resolveConflict(userId, record, keep); await reload(); await sync();
  }, [reload, sync, userId]);
  return <DataContext.Provider value={{ records, profile, loading, bootError, syncing, syncError,
    pending: records.filter((record) => record.dirty).length, save, sync, updateProfile, resolve, selectedVerse, setSelectedVerse }}>
    {children}
  </DataContext.Provider>;
}
export function useData() {
  const state = useContext(DataContext);
  if (!state) throw new Error('DataProvider is missing');
  return state;
}
export function useRecords<K extends RecordKind>(kind: K): LocalRecord<K>[] {
  return useData().records.filter((record) => record.kind === kind && !record.deleted) as LocalRecord<K>[];
}
