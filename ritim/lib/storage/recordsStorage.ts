import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DailyRecord } from '@/state/records';

import { RECORDS_KEY } from './storageKeys';

const LEGACY_RECORDS_KEY = 'ritim.records.v1';

type RecordsMap = Record<string, DailyRecord>;

export async function loadRecords(): Promise<RecordsMap> {
  try {
    const raw = await AsyncStorage.getItem(RECORDS_KEY);
    if (raw) {
      return coerceRecordsMap(raw);
    }

    const legacyRaw = await AsyncStorage.getItem(LEGACY_RECORDS_KEY);
    if (!legacyRaw) {
      return {};
    }
    const legacyMap = coerceRecordsMap(legacyRaw);
    await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(legacyMap));
    return legacyMap;
  } catch (error) {
    console.warn('recordsStorage.loadRecords failed', error);
    return {};
  }
}

export async function saveRecords(records: RecordsMap): Promise<void> {
  try {
    await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch (error) {
    console.warn('recordsStorage.saveRecords failed', error);
  }
}

function coerceRecordsMap(raw: string): RecordsMap {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.reduce<RecordsMap>((acc, record) => {
        if (record && typeof record === 'object' && 'date' in record) {
          const date = String((record as DailyRecord).date);
          if (date) {
            acc[date] = record as DailyRecord;
          }
        }
        return acc;
      }, {});
    }
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed as RecordsMap).reduce<RecordsMap>(
        (acc, [date, record]) => {
          if (record) {
            acc[date] = { ...record, date: record.date ?? date } as DailyRecord;
          }
          return acc;
        },
        {}
      );
    }
    return {};
  } catch (error) {
    console.warn('recordsStorage.parse failed', error);
    return {};
  }
}
