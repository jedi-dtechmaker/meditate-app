import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Keep each native Keychain entry below historical per-value size limits.
// Write the pointer last so an interrupted write never replaces a valid session.
const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
async function nativeRead(key: string) {
  const raw = await SecureStore.getItemAsync(`${key}.manifest`, options);
  if (!raw) return null;
  const { generation, count } = JSON.parse(raw) as { generation: string; count: number };
  if (!Number.isInteger(count) || count < 1 || count > 100) return null;
  const chunks = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${generation}.${i}`, options)));
  return chunks.some((chunk) => chunk === null) ? null : chunks.join('');
}
async function removeChunks(key: string, raw: string | null) {
  if (!raw) return;
  const { generation, count } = JSON.parse(raw) as { generation: string; count: number };
  await Promise.all(Array.from({ length: Math.min(count, 100) }, (_, i) => SecureStore.deleteItemAsync(`${key}.${generation}.${i}`, options)));
}
export const secureStorage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') return typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(key);
    return nativeRead(key);
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') { sessionStorage.setItem(key, value); return; }
    const previous = await SecureStore.getItemAsync(`${key}.manifest`, options);
    const generation = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const characters = Array.from(value);
    const count = Math.max(1, Math.ceil(characters.length / 256));
    if (count > 100) throw new Error('Session is too large to save securely.');
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(`${key}.${generation}.${i}`, characters.slice(i * 256, (i + 1) * 256).join(''), options);
    }
    await SecureStore.setItemAsync(`${key}.manifest`, JSON.stringify({ generation, count }), options);
    await removeChunks(key, previous);
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web') { sessionStorage.removeItem(key); return; }
    const previous = await SecureStore.getItemAsync(`${key}.manifest`, options);
    await SecureStore.deleteItemAsync(`${key}.manifest`, options);
    await removeChunks(key, previous);
  },
};
