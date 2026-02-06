import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DailyRecord } from '@/state/records';

const RECORDS_KEY = 'ritim.records.v1';

export async function loadRecords(): Promise<DailyRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(RECORDS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as DailyRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('recordsStorage.loadRecords failed', error);
    return [];
  }
}

export async function saveRecords(records: DailyRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch (error) {
    console.warn('recordsStorage.saveRecords failed', error);
  }
}
