import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { File } from 'expo-file-system';
import { api } from '@/lib/api';
import { Button, Copy, Notice } from './ui';

export function VoiceInput({ onTranscript, disabled = false }: { onTranscript: (text: string) => void; disabled?: boolean }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processing = useRef(false);
  const active = useRef(true);
  const callback = useRef(onTranscript);
  useEffect(() => { callback.current = onTranscript; }, [onTranscript]);
  const controller = useRef<AbortController | null>(null);
  const stop = useCallback(async () => {
    if (processing.current) return;
    processing.current = true; setBusy(true); setError(null);
    let file: File | null = null;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, shouldPlayInBackground: true });
      if (!recorder.uri) throw new Error('No recording was captured. Please try again.');
      file = new File(recorder.uri);
      if (file.size > 8_000_000) throw new Error('The recording is too long. Please keep it under one minute.');
      controller.current = new AbortController();
      const result = await api<{ transcript: string }>('/api/transcribe', { method: 'POST', signal: controller.current.signal,
        body: JSON.stringify({ audioBase64: await file.base64(), mimeType: 'audio/mp4' }) });
      if (active.current) callback.current(result.transcript);
    } catch (failure) { if (active.current) setError(failure instanceof Error ? failure.message : 'We could not transcribe that recording.'); }
    finally {
      if (file?.exists) file.delete();
      await setAudioModeAsync({ allowsRecording: false, shouldPlayInBackground: true }).catch(() => {});
      processing.current = false; if (active.current) setBusy(false);
    }
  }, [recorder]);
  useEffect(() => { if (state.isRecording && state.durationMillis >= 60000) void stop(); }, [state.durationMillis, state.isRecording, stop]);
  useEffect(() => {
    active.current = true;
    const subscription = AppState.addEventListener('change', (value) => { if (value !== 'active' && recorder.isRecording) void stop(); });
    return () => {
      active.current = false; controller.current?.abort(); subscription.remove();
      if (recorder.isRecording && !processing.current) void recorder.stop().finally(() => {
        if (recorder.uri) { const file = new File(recorder.uri); if (file.exists) file.delete(); }
        return setAudioModeAsync({ allowsRecording: false, shouldPlayInBackground: true });
      }).catch(() => {});
    };
  }, [recorder, stop]);
  const start = async () => {
    setError(null);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) throw new Error('Microphone access is needed to record. You can also type your reflection.');
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, shouldPlayInBackground: false });
      await recorder.prepareToRecordAsync(); recorder.record();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Recording could not start.'); }
  };
  return <View style={{ gap: 8 }}><Button secondary busy={busy} disabled={disabled && !state.isRecording} title={state.isRecording ? `Stop & transcribe · ${Math.floor(state.durationMillis / 1000)}s` : 'Speak & transcribe'} onPress={() => void (state.isRecording ? stop() : start())} />
    <Copy small muted>Voice recordings are sent for AI transcription and removed from this phone afterward. Up to one minute.</Copy><Notice error message={error} /></View>;
}
