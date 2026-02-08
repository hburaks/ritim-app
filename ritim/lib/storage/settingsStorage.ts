import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppSettings } from '@/state/settings';

import { SETTINGS_KEY } from './storageKeys';

const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  reminderHour: 20,
  reminderMinute: 30,
};

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw) as Partial<AppSettings> | null;
    if (!parsed || typeof parsed !== 'object') {
      return DEFAULT_SETTINGS;
    }
    return {
      notificationsEnabled:
        typeof parsed.notificationsEnabled === 'boolean'
          ? parsed.notificationsEnabled
          : DEFAULT_SETTINGS.notificationsEnabled,
      reminderHour:
        typeof parsed.reminderHour === 'number'
          ? parsed.reminderHour
          : DEFAULT_SETTINGS.reminderHour,
      reminderMinute:
        typeof parsed.reminderMinute === 'number'
          ? parsed.reminderMinute
          : DEFAULT_SETTINGS.reminderMinute,
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
