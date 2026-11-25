import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronDown, Music2, Pause, Play, RotateCcw, RotateCw, Sparkles, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import type { Focus, Verse } from '@shared/domain';
import { localDateKey } from '@shared/domain';
import { useAuth } from '@/providers/auth';
import { useData } from '@/providers/data';
import { dailyVerse } from '@/lib/bible';
import { getMeta, setMeta } from '@/lib/database';
import { api } from '@/lib/api';
import { clearLockScreenPlayback, setPlayerVolumes, startNativePlayback, supportsBackgroundPlayback } from '@/lib/playback';
import { Loading } from '@/components/ui';

interface ActiveMeditation {
  id: string; verse: Verse; focus: Focus; plannedSeconds: number; elapsedSeconds: number;
  startedAt: string; music: string; timezone: string;
}
type MusicChoice = 'piano' | 'quiet' | 'waters';
const audioSource = (music: MusicChoice) => music === 'piano' ? require('../../assets/audio/quiet-piano.m4a') : music === 'waters' ? require('../../assets/audio/still-waters.wav') : require('../../assets/audio/quiet.m4a');
const musicChoice = (music: string): MusicChoice => music === 'piano' || music === 'waters' ? music : 'quiet';
const AUDIO_SECONDS = 1800;
const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;

export function MeditationPlayer({ visible, onCompleted }: { visible: boolean; onCompleted: () => void }) {
  const { session } = useAuth();
  const userId = session!.user.id;
  const { profile, selectedVerse, setSelectedVerse, save } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<ActiveMeditation | null>(null);
  const [duration, setDuration] = useState(profile.durationMinutes);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [error, setError] = useState<string | null>(null);
  const [completionId, setCompletionId] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(profile.voiceEnabled);
  const [voice, setVoice] = useState(profile.voice);
  const [initialMusic] = useState(() => musicChoice(profile.music));
  const [music, setMusic] = useState<MusicChoice>(musicChoice(profile.music));
  const [showDurations, setShowDurations] = useState(false);
  const [showVoices, setShowVoices] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const finishing = useRef(false);
  const elapsedRef = useRef(0);
  const voiceController = useRef<AbortController | null>(null);
  const voiceFile = useRef<File | null>(null);
  const playingRef = useRef(false);
  const narrationReady = useRef(false);
  const loadedMusic = useRef<MusicChoice | null>(initialMusic);
  const promptedVerse = useRef('');
  const source = audioSource(initialMusic);
  const player = useAudioPlayer(source, { updateInterval: 250 });
  const narration = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const offset = AUDIO_SECONDS - (active?.plannedSeconds || duration * 60);
  const elapsed = active ? ready ? status.didJustFinish && status.currentTime >= AUDIO_SECONDS - 1 ? active.plannedSeconds : Math.max(0, Math.min(active.plannedSeconds, Math.floor(status.currentTime - offset))) : active.elapsedSeconds : 0;
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);
  const verse = active?.verse || selectedVerse || dailyVerse(profile.focus, profile.translation, new Date(), profile.timezone);

  useEffect(() => {
    let mounted = true;
    void getMeta<ActiveMeditation>(userId, 'activeMeditation').then((value) => {
      if (!mounted) return;
      if (value) { setActive(value); setDuration(value.plannedSeconds / 60); setMusic(musicChoice(value.music)); }
      setLoaded(true);
    }).catch(() => { setError('We could not restore your meditation. Please try reopening the app.'); setLoaded(true); });
    return () => { mounted = false; playingRef.current = false; voiceController.current?.abort(); clearLockScreenPlayback(player); if (voiceFile.current?.exists) voiceFile.current.delete(); };
  }, [userId, player]);
  useEffect(() => {
    if (!visible || !loaded || !active || completionId || !selectedVerse || selectedVerse.id === active.verse.id) return;
    const key = `${active.id}:${selectedVerse.id}`;
    if (promptedVerse.current === key) return;
    promptedVerse.current = key;
    Alert.alert('Meditation in progress', `You are meditating on ${active.verse.reference}.`, [
      { text: 'Continue session', style: 'cancel' },
      { text: 'Start selected verse', onPress: () => {
        playingRef.current = false; voiceController.current?.abort(); player.pause(); narration.pause();
        clearLockScreenPlayback(player);
        void setMeta(session!.user.id, 'activeMeditation', null).then(() => {
          elapsedRef.current = 0; narrationReady.current = false; setActive(null); setReady(false);
          setDuration(profile.durationMinutes); setMusic(musicChoice(profile.music));
        }).catch(() => setError('Could not start a new session. Please try again.'));
      } },
    ]);
  }, [active, completionId, loaded, narration, player, profile.durationMinutes, profile.music, selectedVerse, session, visible]);
  // Keep a still-unstarted player aligned with settings edited elsewhere in the app.
  useEffect(() => {
    if (!loaded || active || visible) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDuration(profile.durationMinutes);
    setMusic(musicChoice(profile.music));
    setVoice(profile.voice);
    setVoiceEnabled(profile.voiceEnabled);
  }, [active, loaded, visible, profile.durationMinutes, profile.music, profile.voice, profile.voiceEnabled]);
  useEffect(() => {
    setPlayerVolumes(player, narration, volume);
  }, [narration, player, volume]);
  const checkpoint = useCallback(async () => {
    if (active && !finishing.current) await setMeta(session!.user.id, 'activeMeditation', { ...active, elapsedSeconds: elapsedRef.current });
  }, [active, session]);
  const checkpointBucket = Math.floor(elapsed / 5);
  useEffect(() => {
    if (active && ready && !completionId) void checkpoint().catch(() => setError('We could not save your session progress. Please try pausing and resuming.'));
  }, [active, checkpoint, checkpointBucket, completionId, ready, status.playing]);
  const loadMusic = async (next: MusicChoice, position: number) => {
    if (loadedMusic.current !== next) {
      loadedMusic.current = null;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => { subscription.remove(); reject(new Error('Audio did not load')); }, 12000);
        const subscription = player.addListener('playbackStatusUpdate', (update) => {
          if (update.isLoaded) { clearTimeout(timer); subscription.remove(); resolve(); }
          else if (update.error) { clearTimeout(timer); subscription.remove(); reject(new Error('Audio did not load')); }
        });
        player.replace(audioSource(next));
      });
      loadedMusic.current = next;
    }
    await player.seekTo(position);
  };
  const start = async () => {
    setBusy(true); setError(null);
    const value: ActiveMeditation = active || {
      id: randomUUID(), verse, focus: profile.focus, plannedSeconds: duration * 60, elapsedSeconds: 0,
      startedAt: new Date().toISOString(), music, timezone: profile.timezone,
    };
    const position = active ? elapsedRef.current : 0;
    try {
      await setMeta(session!.user.id, 'activeMeditation', { ...value, elapsedSeconds: position });
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, shouldPlayInBackground: supportsBackgroundPlayback, interruptionMode: 'doNotMix' });
      await loadMusic(musicChoice(value.music), AUDIO_SECONDS - value.plannedSeconds + position);
      setActive(value); setReady(true); playingRef.current = true;
      startNativePlayback(player, value.verse.reference, value.plannedSeconds / 60);
      if (voiceEnabled) { if (narrationReady.current) narration.play(); else void speak(voice, value.verse); }
    } catch { setError('Audio could not start. Please try again.'); }
    finally { setBusy(false); }
  };
  const pause = async () => { playingRef.current = false; voiceController.current?.abort(); player.pause(); narration.pause(); await checkpoint().catch(() => setError('We could not save your place yet. Please try again.')); };
  const finish = useCallback(async () => {
    if (!active || finishing.current) return;
    finishing.current = true; setBusy(true); setError(null);
    playingRef.current = false; voiceController.current?.abort(); player.pause(); narration.pause(); clearLockScreenPlayback(player);
    try {
      const durationSeconds = Math.max(1, Math.min(active.plannedSeconds, elapsedRef.current));
      const now = new Date();
      await save('session', { verse: active.verse, focus: active.focus, plannedSeconds: active.plannedSeconds, durationSeconds,
        startedAt: active.startedAt, completedAt: now.toISOString(), localDate: localDateKey(now, active.timezone), timezone: active.timezone }, active.id);
      await setMeta(session!.user.id, 'activeMeditation', null);
      setSelectedVerse(active.verse); setCompletionId(active.id);
    } catch { finishing.current = false; setError('We could not save your meditation. Please tap Finish to try again.'); }
    finally { setBusy(false); }
  }, [active, narration, player, save, session, setSelectedVerse]);
  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', (nativeStatus) => {
      if (active && ready && !completionId && (nativeStatus.didJustFinish || nativeStatus.currentTime >= AUDIO_SECONDS - 0.01)) {
        elapsedRef.current = active.plannedSeconds;
        void finish();
      }
    });
    return () => subscription.remove();
  }, [active, completionId, finish, player, ready]);
  useEffect(() => {
    if (completionId && visible) {
      router.replace({ pathname: '/(app)/completed', params: { id: completionId } });
      onCompleted();
    }
  }, [completionId, visible, router, onCompleted]);
  const speak = async (selectedVoice = voice, selectedScripture = verse) => {
    voiceController.current?.abort();
    const controller = new AbortController();
    voiceController.current = controller;
    narration.pause(); narrationReady.current = false;
    setVoiceBusy(true); setError(null);
    try {
      const response = await api<{ audioBase64: string }>('/api/tts', { method: 'POST', signal: controller.signal, body: JSON.stringify({ text: selectedScripture.quote, voice: selectedVoice }) }, session!.user.id);
      if (controller.signal.aborted || !playingRef.current) return;
      if (voiceFile.current?.exists) voiceFile.current.delete();
      const file = new File(Paths.cache, `scripture-${randomUUID()}.wav`);
      file.write(Uint8Array.from(atob(response.audioBase64), (character) => character.charCodeAt(0)));
      voiceFile.current = file; narration.replace(file.uri); narrationReady.current = true; narration.play();
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Scripture narration is unavailable.');
    } finally { if (voiceController.current === controller) setVoiceBusy(false); }
  };
  const changeMusic = async (next: MusicChoice) => {
    setShowMusic(false);
    if (next === music) return;
    if (!active) { setMusic(next); return; }
    const wasPlaying = status.playing;
    const position = elapsedRef.current;
    setBusy(true); setError(null); setReady(false); player.pause();
    try {
      await loadMusic(next, AUDIO_SECONDS - active.plannedSeconds + position);
      const updated = { ...active, music: next, elapsedSeconds: position };
      await setMeta(session!.user.id, 'activeMeditation', updated);
      setActive(updated); setMusic(next); setReady(true);
      if (wasPlaying) startNativePlayback(player, active.verse.reference, active.plannedSeconds / 60);
    } catch { playingRef.current = false; narration.pause(); setError('Could not change the background audio. Press play to try again.'); }
    finally { setBusy(false); }
  };
  const seek = async (seconds: number) => {
    if (!active || !ready) return;
    const target = Math.max(0, Math.min(active.plannedSeconds - 1, elapsedRef.current + seconds));
    try { await player.seekTo(AUDIO_SECONDS - active.plannedSeconds + target); elapsedRef.current = target; }
    catch { setError('Could not move to that position. Please try again.'); }
  };
  if (!loaded) return visible ? <View style={StyleSheet.absoluteFill}><Loading message="Preparing your quiet space…" /></View> : null;
  return <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
  <View pointerEvents={visible ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, !visible && { display: 'none' }]}>
  <ImageBackground source={require('../../assets/images/welcome/mountains.jpg')} style={screen.root}>
    <View style={screen.shade} />
    <SafeAreaView style={screen.root} edges={['top', 'bottom', 'left', 'right']}>
      {visible && <StatusBar style="light" />}
      <ScrollView contentContainerStyle={screen.content} showsVerticalScrollIndicator={false}>
        <View style={screen.top}>
          <Pressable accessibilityRole="button" accessibilityLabel="Return to app" onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)')} style={screen.close}><X size={20} color="#fff" /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose duration" accessibilityState={{ expanded: showDurations, disabled: Boolean(active) }} disabled={Boolean(active)} onPress={() => setShowDurations(!showDurations)} style={screen.topPill}><Text style={screen.pillText}>{active ? active.plannedSeconds / 60 : duration} min · {active?.focus || profile.focus}</Text><ChevronDown size={14} color="#fff" /></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: showVoices }} onPress={() => setShowVoices(!showVoices)} style={[screen.topPill, screen.green]}><Sparkles size={14} color="#fff" /><Text style={screen.pillText}>Voice</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: showMusic }} onPress={() => setShowMusic(!showMusic)} style={screen.topPill}><Music2 size={14} color="#48dfaa" /><Text numberOfLines={1} style={screen.pillText}>{music === 'piano' ? 'Piano' : music === 'waters' ? 'Still Waters' : 'Quiet'}</Text></Pressable>
        </View>
        {showDurations && !active && <View style={screen.options}>{[3, 5, 10, 15, 20, 30].map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: duration === value }} onPress={() => { setDuration(value); setShowDurations(false); }} style={[screen.option, duration === value && screen.selected]}><Text style={screen.optionText}>{value} min</Text></Pressable>)}</View>}
        <View style={screen.verse}><Text selectable style={screen.quote}>“{verse.quote}”</Text><Text style={screen.reference}>{verse.reference} · {verse.translation}</Text></View>
        <View style={screen.controls}>
          <View style={screen.modeRow}>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: !voiceEnabled }} onPress={() => { setVoiceEnabled(false); voiceController.current?.abort(); setVoiceBusy(false); narration.pause(); if (volume === 0) setVolume(0.6); if (music === 'quiet') void changeMusic('piano'); }} style={[screen.mode, !voiceEnabled && screen.selected]}><Text style={screen.modeText}>◀  Music only</Text><Text style={screen.modeDetail}>No voice</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: voiceEnabled }} onPress={() => { setVoiceEnabled(true); if (status.playing) void speak(voice); }} style={[screen.mode, voiceEnabled && screen.selected]}><Text style={screen.modeText}>✦  Scripture voice</Text><Text style={screen.modeDetail}>AI narration</Text></Pressable>
          </View>
          {voiceEnabled && <Pressable accessibilityRole="button" disabled={!status.playing || voiceBusy} onPress={() => void speak()} style={screen.hint}><Text style={screen.hintText}>{voiceBusy ? 'Preparing narration…' : status.playing ? `✦  ${voice} · Tap to hear the verse again` : `✦  ${voice} · Narration starts when you play`}</Text></Pressable>}
          {showVoices && <View style={screen.panel}><Text style={screen.panelTitle}>Choose a voice</Text><View style={screen.options}>{(['Aoede', 'Kore', 'Charon', 'Puck'] as const).map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: voice === value }} onPress={() => { setVoice(value); setVoiceEnabled(true); narrationReady.current = false; if (status.playing) void speak(value); }} style={[screen.option, voice === value && screen.selected]}><Text style={screen.optionText}>{value}</Text></Pressable>)}</View></View>}
          {showMusic && <View style={screen.panel}><Text style={screen.panelTitle}>Background audio</Text><View style={screen.options}>{([{ id: 'piano', label: 'Gymnopédie No. 1' }, { id: 'waters', label: 'Still Waters' }, { id: 'quiet', label: 'Quiet (silence)' }] as const).map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: music === item.id, disabled: busy }} disabled={busy} onPress={() => void changeMusic(item.id)} style={[screen.option, music === item.id && screen.selected]}><Text style={screen.optionText}>{item.label}</Text></Pressable>)}</View></View>}
          <View style={screen.volume}><Text style={screen.small}>MUSIC VOLUME</Text>{[0, 0.3, 0.6, 1].map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: volume === value }} onPress={() => setVolume(value)} style={[screen.volumeChip, volume === value && screen.selected]}><Text style={screen.small}>{value === 0 ? 'Off' : `${Math.round(value * 100)}%`}</Text></Pressable>)}</View>
          {error || status.error ? <Text accessibilityRole="alert" style={screen.error}>{error || 'The audio could not be loaded. Please reopen this meditation.'}</Text> : null}
          <View style={screen.transport}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back 15 seconds" disabled={!active || !ready} onPress={() => void seek(-15)} style={screen.skip}><RotateCcw size={22} color="#fff" /><Text style={screen.skipLabel}>15</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={status.playing ? 'Pause meditation' : 'Play meditation'} disabled={busy || !status.isLoaded} onPress={() => void (status.playing ? pause() : start())} style={[screen.play, (busy || !status.isLoaded) && { opacity: 0.5 }]}>{busy ? <ActivityIndicator color="#fff" /> : status.playing ? <Pause color="#fff" fill="#fff" size={25} /> : <Play color="#fff" fill="#fff" size={25} />}</Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Go forward 15 seconds" disabled={!active || !ready} onPress={() => void seek(15)} style={screen.skip}><RotateCw size={22} color="#fff" /><Text style={screen.skipLabel}>15</Text></Pressable>
          </View>
          <View style={screen.track}><View style={[screen.trackProgress, { width: `${Math.max(0, Math.min(100, elapsed / (active?.plannedSeconds || duration * 60) * 100))}%` }]} /></View>
          <View style={screen.timeRow}><Text style={screen.small}>{formatTime(elapsed)}</Text><Text style={screen.small}>{formatTime(active?.plannedSeconds || duration * 60)}</Text></View>
          {active && <Pressable accessibilityRole="button" disabled={elapsed < 1 || busy} onPress={() => void finish()} style={screen.finish}><Text style={screen.finishText}>Finish & reflect</Text></Pressable>}
        </View>
      </ScrollView>
    </SafeAreaView>
  </ImageBackground></View>
  {!visible && (active || completionId) && <View style={[screen.mini, { bottom: insets.bottom + 76 }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={completionId ? 'View completed meditation' : 'Return to meditation'} style={screen.miniInfo} onPress={() => {
      if (completionId) { router.push({ pathname: '/(app)/completed', params: { id: completionId } }); onCompleted(); }
      else router.push('/(app)/meditate');
    }}><Text style={screen.miniTitle}>{completionId ? 'Meditation complete' : active?.verse.reference}</Text><Text style={screen.miniCaption}>{completionId ? 'Tap to reflect' : `${status.playing ? 'Playing' : 'Paused'} · ${formatTime(elapsed)}`}</Text></Pressable>
    {!completionId && <Pressable accessibilityRole="button" accessibilityLabel={status.playing ? 'Pause meditation' : 'Resume meditation'} disabled={busy || !status.isLoaded} onPress={() => void (status.playing ? pause() : start())} style={screen.miniButton}>{status.playing ? <Pause color="#fff" size={20} /> : <Play color="#fff" size={20} />}</Pressable>}
  </View>}
  </View>;
}

const screen = StyleSheet.create({
  mini: { position: 'absolute', left: 14, right: 82, minHeight: 58, backgroundColor: '#143e31', borderRadius: 15, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', elevation: 8 }, miniInfo: { flex: 1, paddingVertical: 9 }, miniTitle: { color: '#fff', fontSize: 13, fontWeight: '700' }, miniCaption: { color: '#c8eee0', fontSize: 11, marginTop: 3 }, miniButton: { padding: 10 },
  root: { flex: 1, backgroundColor: '#141a24' }, shade: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(12, 14, 23, 0.78)' },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, maxWidth: 620, width: '100%', alignSelf: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6 }, close: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#15151abb', alignItems: 'center', justifyContent: 'center' },
  topPill: { flexDirection: 'row', flexShrink: 1, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#22232acc', paddingHorizontal: 11, minHeight: 36, borderRadius: 20, borderWidth: 1, borderColor: '#ffffff33' }, green: { backgroundColor: '#009d68' }, pillText: { color: '#fff', fontSize: 11, fontWeight: '700', flexShrink: 1 },
  verse: { flex: 1, minHeight: 235, justifyContent: 'center', alignItems: 'center', paddingVertical: 28 }, quote: { fontFamily: 'serif', fontSize: 28, lineHeight: 40, color: '#fff', textAlign: 'center' }, reference: { color: '#d8e8e1', fontSize: 12, letterSpacing: 1, marginTop: 16, textAlign: 'center' },
  controls: { gap: 10 }, modeRow: { flexDirection: 'row', gap: 8 }, mode: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: '#18191fdd', borderRadius: 28, borderWidth: 1, borderColor: '#ffffff33' }, selected: { backgroundColor: '#009d68', borderColor: '#38d99e' }, modeText: { color: '#fff', fontWeight: '700', fontSize: 12 }, modeDetail: { color: '#d9f5e8', fontSize: 10, marginTop: 2 },
  hint: { backgroundColor: '#ffffff20', padding: 12, borderRadius: 18, alignItems: 'center' }, hintText: { color: '#f1fff7', fontSize: 11, textAlign: 'center' }, panel: { backgroundColor: '#171a20e8', borderRadius: 18, padding: 12, gap: 9 }, panelTitle: { color: '#fff', fontWeight: '700', fontSize: 12 }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 6 }, option: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18, backgroundColor: '#34383e', borderWidth: 1, borderColor: '#ffffff22' }, optionText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  volume: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 }, volumeChip: { backgroundColor: '#202126cc', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 15, borderWidth: 1, borderColor: '#ffffff22' }, small: { fontSize: 10, color: '#e5e9e7' }, error: { color: '#ffd4d4', fontSize: 12, lineHeight: 18 },
  transport: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 42, marginTop: 8 }, play: { width: 64, height: 64, borderRadius: 32, borderColor: '#ffffff99', borderWidth: 1, backgroundColor: '#ffffff38', alignItems: 'center', justifyContent: 'center' }, skip: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, skipLabel: { color: '#fff', fontSize: 8, position: 'absolute', top: 18 }, track: { height: 4, backgroundColor: '#ffffff55', borderRadius: 3, overflow: 'hidden', marginTop: 6 }, trackProgress: { height: 4, backgroundColor: '#fff' }, timeRow: { flexDirection: 'row', justifyContent: 'space-between' }, finish: { padding: 8, alignItems: 'center' }, finishText: { color: '#c0f6dd', fontSize: 12, fontWeight: '700' },
});
