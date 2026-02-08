import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { DailyRecord } from '@/state/records';

const DAILY_REMINDER_HOUR = 20;
const DAILY_REMINDER_MINUTE = 30;
const SCHEDULE_WINDOW_DAYS = 14;
const REMINDER_TITLE = 'Bugün odaklandın mı?';

export type ReminderTime = { hour: number; minute: number };

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

export async function hasNotificationPermission() {
  if (Platform.OS === 'web') {
    return false;
  }
  try {
    const settings = await Notifications.getPermissionsAsync();
    return Boolean(
      settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.warn('notifications permission check failed', error);
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
      title: REMINDER_TITLE,
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

export async function scheduleDailyReminder(time: { hour: number; minute: number }) {
  if (Platform.OS === 'web') {
    return null;
  }
  const permissionGranted = await hasNotificationPermission();
  if (!permissionGranted) {
    return null;
  }
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: REMINDER_TITLE,
        body: '',
      },
      trigger: {
        hour: time.hour,
        minute: time.minute,
        repeats: true,
      },
    });
    return id;
  } catch (error) {
    console.warn('notifications schedule failed', error);
    return null;
  }
}

export async function cancelScheduledReminder(id?: string | null) {
  if (Platform.OS === 'web') {
    return;
  }
  if (!id) {
    return;
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (error) {
    console.warn('notifications cancel reminder failed', error);
  }
}

export async function isReminderScheduled(id?: string | null) {
  if (Platform.OS === 'web') {
    return false;
  }
  if (!id) {
    return false;
  }
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.some((item) => item.identifier === id);
  } catch (error) {
    console.warn('notifications read schedule failed', error);
    return false;
  }
}

export async function rescheduleAllBasedOnRecords(
  records: DailyRecord[],
  time?: ReminderTime
) {
  if (Platform.OS === 'web') {
    return null;
  }
  const permissionGranted = await hasNotificationPermission();
  if (!permissionGranted) {
    return null;
  }

  await cancelAllRitimNotifications();
  return scheduleUpcomingReminders(records, time);
}

function getTodayDateString() {
  return toDateString(new Date());
}

function buildTriggerForDate(
  dateString: string,
  time?: ReminderTime
): Notifications.DateTriggerInput | null {
  const date = parseDateString(dateString);
  const hour = time?.hour ?? DAILY_REMINDER_HOUR;
  const minute = time?.minute ?? DAILY_REMINDER_MINUTE;
  date.setHours(hour, minute, 0, 0);
  if (date <= new Date()) {
    return null;
  }
  return { type: Notifications.SchedulableTriggerInputTypes.DATE, date };
}

function buildTonightTrigger(time?: ReminderTime): Notifications.DateTriggerInput | null {
  return buildTriggerForDate(getTodayDateString(), time);
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

function parseDateString(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const parsed = new Date(year, (month ?? 1) - 1, day ?? 1);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

async function scheduleUpcomingReminders(records: DailyRecord[], time?: ReminderTime) {
  const recordSet = new Set(records.map((record) => record.date));
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  let lastScheduledId: string | null = null;

  for (let offset = 0; offset < SCHEDULE_WINDOW_DAYS; offset += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + offset);
    const dateString = toDateString(date);

    if (recordSet.has(dateString)) {
      continue;
    }

    const trigger = buildTriggerForDate(dateString, time);
    if (!trigger) {
      continue;
    }

    const missingStreak = getMissingStreak(recordSet, dateString);
    if (missingStreak >= 2) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${missingStreak} gündür kayıt yok. Ritmi korumak için bugün kısa bir odak yeter.`,
          body: '',
        },
        trigger,
      });
      lastScheduledId = id;
      continue;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: REMINDER_TITLE,
        body: '',
      },
      trigger,
    });
    lastScheduledId = id;
  }

  return lastScheduledId;
}

function getMissingStreak(recordSet: Set<string>, dateString: string) {
  let streak = 0;
  let cursor = shiftDateString(dateString, -1);
  while (streak < 30) {
    if (recordSet.has(cursor)) {
      break;
    }
    streak += 1;
    cursor = shiftDateString(cursor, -1);
  }
  return streak;
}
