import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DailyRecord } from '@/state/records';
import type { TrackId } from '@/lib/track/tracks';
import { TRACKS } from '@/lib/track/tracks';

import { RECORDS_KEY } from './storageKeys';

const LEGACY_RECORDS_KEY = 'ritim.records.v1';
const DEFAULT_TRACK_ID: TrackId = 'TYT';
const VALID_TRACK_IDS = new Set<TrackId>(TRACKS.map((track) => track.id));
const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type RecordsMap = Record<string, DailyRecord>;
type SubjectBreakdown = Record<string, number>;
type ActivityType = DailyRecord['activityType'];
type RawRecord = Partial<DailyRecord> & Record<string, unknown>;

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

export async function getRecord(trackId: TrackId, date: string): Promise<DailyRecord | undefined> {
  const records = await loadRecords();
  return records[makeRecordKey(trackId, date)];
}

export async function upsertRecord(record: DailyRecord): Promise<void> {
  const records = await loadRecords();
  records[makeRecordKey(record.trackId, record.date)] = record;
  await saveRecords(records);
}

export async function listRecordsByTrack(trackId: TrackId): Promise<DailyRecord[]> {
  const records = await loadRecords();
  return Object.values(records)
    .filter((record) => record.trackId === trackId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function makeRecordKey(trackId: TrackId, date: string): string {
  return `${trackId}__${date}`;
}

function coerceRecordsMap(raw: string): RecordsMap {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.reduce<RecordsMap>((acc, record) => {
        const normalized = normalizeRecord(record);
        if (normalized) {
          acc[makeRecordKey(normalized.trackId, normalized.date)] = normalized;
        }
        return acc;
      }, {});
    }
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed as RecordsMap).reduce<RecordsMap>(
        (acc, [key, record]) => {
          const normalized = normalizeRecord(record, key);
          if (normalized) {
            acc[makeRecordKey(normalized.trackId, normalized.date)] = normalized;
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

function normalizeRecord(input: unknown, keyHint?: string): DailyRecord | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const rawRecord = input as RawRecord;
  const keyParts = parseRecordKey(keyHint);

  const date = resolveDate(rawRecord.date, keyParts.date);
  if (!date) {
    return null;
  }

  const trackId =
    resolveTrackId(rawRecord.trackId) ?? keyParts.trackId ?? DEFAULT_TRACK_ID;
  const activityType = resolveActivityType(rawRecord.activityType);
  const focusMinutes = resolveFocusMinutes(rawRecord.focusMinutes);
  const questionCount = resolveOptionalNumber(rawRecord.questionCount);
  const subjectBreakdown = resolveSubjectBreakdown(rawRecord.subjectBreakdown);

  const normalized: DailyRecord = {
    date,
    trackId,
    focusMinutes,
    activityType,
  };

  if (questionCount !== undefined) {
    normalized.questionCount = questionCount;
  }
  if (subjectBreakdown && Object.keys(subjectBreakdown).length > 0) {
    normalized.subjectBreakdown = subjectBreakdown;
  }

  return normalized;
}

function parseRecordKey(key?: string): { trackId?: TrackId; date?: string } {
  if (!key) {
    return {};
  }

  const [rawTrackId, rawDate] = key.split('__');
  const parsedTrackId = resolveTrackId(rawTrackId);
  if (parsedTrackId && rawDate && DATE_KEY_REGEX.test(rawDate)) {
    return { trackId: parsedTrackId, date: rawDate };
  }

  if (DATE_KEY_REGEX.test(key)) {
    return { date: key };
  }

  return {};
}

function resolveTrackId(value: unknown): TrackId | null {
  if (typeof value !== 'string') {
    return null;
  }
  if (VALID_TRACK_IDS.has(value as TrackId)) {
    return value as TrackId;
  }
  return null;
}

function resolveDate(value: unknown, fallback?: string): string | null {
  if (typeof value === 'string' && DATE_KEY_REGEX.test(value)) {
    return value;
  }
  if (fallback && DATE_KEY_REGEX.test(fallback)) {
    return fallback;
  }
  return null;
}

function resolveActivityType(value: unknown): ActivityType {
  if (value === 'KONU' || value === 'SORU' || value === 'KARISIK') {
    return value;
  }
  return 'KONU';
}

function resolveFocusMinutes(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  return 0;
}

function resolveOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  return undefined;
}

function resolveSubjectBreakdown(value: unknown): SubjectBreakdown | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const entries = Object.entries(value as Record<string, unknown>).reduce<SubjectBreakdown>(
    (acc, [subject, count]) => {
      if (typeof count === 'number' && Number.isFinite(count) && count > 0) {
        acc[subject] = Math.floor(count);
      }
      return acc;
    },
    {}
  );

  return Object.keys(entries).length > 0 ? entries : undefined;
}
