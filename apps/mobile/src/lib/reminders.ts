import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });
export async function cancelReminder(userId: string) {
  if (Platform.OS !== 'web') await Notifications.cancelScheduledNotificationAsync(`daily-word-${userId}`);
}
export async function scheduleReminder(userId: string, hour: number, minute: number, requestPermission = false) {
  if (Platform.OS === 'web') throw new Error('Daily reminders are available in the Android app.');
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('daily-word', { name: 'Daily Scripture reminder', importance: AndroidImportance.DEFAULT });
    } catch {
      // Android may have created the channel even if its response could not be read.
      const existing = await Notifications.getNotificationChannelAsync('daily-word').catch(() => null);
      if (!existing) throw new Error('We could not set up reminders on this phone. Check notification settings or continue without a reminder.');
    }
  }
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && requestPermission) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Allow notifications in your phone settings to receive reminders.');
  await cancelReminder(userId);
  await Notifications.scheduleNotificationAsync({
    identifier: `daily-word-${userId}`,
    content: { title: 'A little time in the Word', body: 'Your moment of Scripture, prayer, and stillness is waiting.', data: { screen: 'home' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: 'daily-word' },
  });
}
