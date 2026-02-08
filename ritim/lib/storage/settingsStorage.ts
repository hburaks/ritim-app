import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppSettings } from '@/state/settings';

import { SETTINGS_KEY } from './storageKeys';

const DEFAULT_SETTINGS: AppSettings = {
  remindersEnabled: false,
  reminderTime: '20:30',
  scheduledNotificationId: null,
};

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw) as LegacySettingsPayload | null;
    if (!parsed || typeof parsed !== 'object') {
      return DEFAULT_SETTINGS;
    }
    const reminderTime = normalizeReminderTime(parsed);
    return {
      remindersEnabled: resolveRemindersEnabled(parsed),
      reminderTime,
      scheduledNotificationId: resolveNotificationId(parsed),
    };
  } catch (error) {
    console.warn('settingsStorage.loadSettings failed', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('settingsStorage.saveSettings failed', error);
  }
}

type LegacySettingsPayload = Partial<{
  remindersEnabled: boolean;
  reminderTime: string;
  scheduledNotificationId: string | null;
  notificationsEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
}>;

function resolveRemindersEnabled(parsed: LegacySettingsPayload) {
  if (typeof parsed.remindersEnabled === 'boolean') {
    return parsed.remindersEnabled;
  }
  if (typeof parsed.notificationsEnabled === 'boolean') {
    return parsed.notificationsEnabled;
  }
  return DEFAULT_SETTINGS.remindersEnabled;
}

function normalizeReminderTime(parsed: LegacySettingsPayload) {
  if (typeof parsed.reminderTime === 'string' && isValidTimeString(parsed.reminderTime)) {
    return parsed.reminderTime;
  }
  if (typeof parsed.reminderHour === 'number' && typeof parsed.reminderMinute === 'number') {
    return formatTime(parsed.reminderHour, parsed.reminderMinute);
  }
  return DEFAULT_SETTINGS.reminderTime;
}

function resolveNotificationId(parsed: LegacySettingsPayload) {
  if (typeof parsed.scheduledNotificationId === 'string') {
    return parsed.scheduledNotificationId;
  }
  if (parsed.scheduledNotificationId === null) {
    return null;
  }
  return DEFAULT_SETTINGS.scheduledNotificationId;
}

function isValidTimeString(value: string) {
  return /^([01]\\d|2[0-3]):([0-5]\\d)$/.test(value);
}

function formatTime(hour: number, minute: number) {
  const safeHour = Math.min(23, Math.max(0, Math.floor(hour)));
  const safeMinute = Math.min(59, Math.max(0, Math.floor(minute)));
  return `${String(safeHour).padStart(2, '0')}:${String(safeMinute).padStart(2, '0')}`;
}
