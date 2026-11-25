import type { AudioPlayer } from 'expo-audio';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

// Expo Go cannot add this app's Android audio service via a config plugin.
// StoreClient also includes development builds, so distinguish those via the launcher.
const isExpoGo = Constants.appOwnership === 'expo' ||
  (Constants.executionEnvironment === ExecutionEnvironment.StoreClient &&
    (Boolean(Constants.expoGoConfig) || !NativeModules.EXDevLauncher));
// Android development sessions can run in Expo Go without the native service.
// Keep playback in the foreground in development; standalone releases can use
// the configured background service and lock-screen controls.
export const supportsBackgroundPlayback = !(Platform.OS === 'android' && (__DEV__ || isExpoGo));

// Expo's native player deliberately exposes mutable properties. Keep that
// imperative boundary outside React components and their compiler analysis.
export function setPlayerVolumes(player: AudioPlayer, narration: AudioPlayer, volume: number) {
  player.volume = volume;
  narration.volume = 1;
}
export function startNativePlayback(player: AudioPlayer, reference: string, minutes: number) {
  player.loop = false;
  if (supportsBackgroundPlayback) player.setActiveForLockScreen(true, { title: reference, artist: 'Meditate on the Word', albumTitle: `${minutes} minutes of stillness` });
  player.play();
}

export function clearLockScreenPlayback(player: AudioPlayer) {
  if (supportsBackgroundPlayback) player.setActiveForLockScreen(false);
}
