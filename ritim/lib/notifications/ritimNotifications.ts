import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { DailyRecord } from '@/state/records';

const DAILY_REMINDER_HOUR = 20;
const DAILY_REMINDER_MINUTE = 30;

export async function requestPermissionsIfNeeded() {
  if (Platform.OS === 'web') {
    return false;
  }
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return true;
    }
    const requested = await Notifications.requestPermissionsAsync();
    return Boolean(requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL);
  } catch (error) {
    console.warn('notifications permission failed', error);
    return false;
  }
}

export async function scheduleDailyReminderIfNeeded(todayHasRecord: boolean) {
  if (Platform.OS === 'web') {
    return;
  }
  if (todayHasRecord) {
    return;
  }
  const trigger = buildTonightTrigger();
  if (!trigger) {
    return;
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Bugün odaklandın mı?',
      body: '',
    },
    trigger,
  });
}

export async function scheduleThirdDayReminderIfNeeded(lastTwoDaysMissing: boolean) {
  if (Platform.OS === 'web') {
    return;
  }
  if (!lastTwoDaysMissing) {
    return;
  }
  const trigger = buildTonightTrigger();
  if (!trigger) {
    return;
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '2 gündür kayıt yok. Ritmi korumak için bugün kısa bir odak yeter.',
      body: '',
    },
    trigger,
  });
}

export async function cancelAllRitimNotifications() {
  if (Platform.OS === 'web') {
    return;
  }
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('notifications cancel failed', error);
  }
}

export async function rescheduleAllBasedOnRecords(records: DailyRecord[]) {
  if (Platform.OS === 'web') {
    return;
  }
  const permissionGranted = await requestPermissionsIfNeeded();
  if (!permissionGranted) {
    return;
  }

  await cancelAllRitimNotifications();

  const today = getTodayDateString();
  const yesterday = shiftDateString(today, -1);
  const twoDaysAgo = shiftDateString(today, -2);

  const todayHasRecord = records.some((record) => record.date === today);
  const yesterdayHasRecord = records.some((record) => record.date === yesterday);
  const twoDaysAgoHasRecord = records.some((record) => record.date === twoDaysAgo);

  const lastTwoDaysMissing = !yesterdayHasRecord && !twoDaysAgoHasRecord;

  if (!todayHasRecord && lastTwoDaysMissing) {
    await scheduleThirdDayReminderIfNeeded(true);
    return;
  }

  await scheduleDailyReminderIfNeeded(todayHasRecord);
}

function getTodayDateString() {
  return toDateString(new Date());
}

function buildTonightTrigger(): Notifications.DateTriggerInput | null {
  const now = new Date();
  const triggerDate = new Date(now);
  triggerDate.setHours(DAILY_REMINDER_HOUR, DAILY_REMINDER_MINUTE, 0, 0);
  if (triggerDate <= now) {
    return null;
  }
  return triggerDate;
}

function shiftDateString(dateString: string, deltaDays: number) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  date.setDate(date.getDate() + deltaDays);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
