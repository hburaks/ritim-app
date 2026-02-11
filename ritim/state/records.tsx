import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { AppState } from 'react-native';

import { rescheduleAllBasedOnRecords } from '@/lib/notifications/ritimNotifications';
import { loadRecords, makeRecordKey, saveRecords } from '@/lib/storage/recordsStorage';
import {
  shouldSync,
  syncRecord,
} from '@/lib/supabase/sync';
import type { TrackId } from '@/lib/track/tracks';
import { useAuth } from '@/state/auth';
import { parseReminderTime, useSettings } from '@/state/settings';

export type ActivityType = 'KONU' | 'SORU' | 'KARISIK';

export type DailyRecord = {
  date: string; // YYYY-MM-DD
  trackId: TrackId;
  focusMinutes: number;
  activityType: ActivityType;
  questionCount?: number;
  subjectBreakdown?: Record<string, number>;
  isDeleted: boolean;
  deletedAtMs?: number | null;
  createdAtMs: number;
  updatedAtMs: number;
};

export type DailyRecordInput = Omit<DailyRecord, 'isDeleted' | 'deletedAtMs' | 'createdAtMs' | 'updatedAtMs'>;

type RecordsState = {
  recordsByKey: Record<string, DailyRecord>;
  todayKey: string;
  hydrated: boolean;
};

type RecordsAction =
  | { type: 'hydrate'; payload: Record<string, DailyRecord> }
  | { type: 'upsert'; payload: DailyRecord }
  | { type: 'tombstone'; payload: { trackId: TrackId; date: string; deletedAtMs: number } }
  | { type: 'set-today'; payload: string };

type RecordsContextValue = {
  records: DailyRecord[];
  recordsByKey: Record<string, DailyRecord>;
  upsertRecord: (record: DailyRecordInput) => void;
  removeRecord: (trackId: TrackId, date: string) => void;
  getRecord: (trackId: TrackId, date: string) => DailyRecord | undefined;
  selectTodayRecord: (trackId: TrackId, dateKey?: string) => DailyRecord | undefined;
  selectWeekDots: (trackId: TrackId, weekStartKey?: string) => boolean[];
  selectHasAnyRecords: (trackId?: TrackId) => boolean;
  listRecordsByTrack: (trackId: TrackId) => DailyRecord[];
  getTrackRange: (trackId: TrackId) => { minDate?: string; maxDate?: string };
  getTrackStreak: (trackId: TrackId, fromDateKey?: string) => number;
  getWeekDots: (trackId: TrackId, weekStartKey?: string) => boolean[];
  todayKey: string;
  refreshTodayKey: () => string;
  hydrated: boolean;
};

const RecordsContext = createContext<RecordsContextValue | undefined>(undefined);

const INITIAL_STATE: RecordsState = {
  recordsByKey: {},
  todayKey: getDateKey(),
  hydrated: false,
};

function recordsReducer(state: RecordsState, action: RecordsAction): RecordsState {
  switch (action.type) {
    case 'hydrate':
      return {
        ...state,
        recordsByKey: action.payload,
        hydrated: true,
      };
    case 'upsert': {
      const record = action.payload;
      const key = makeRecordKey(record.trackId, record.date);
      return {
        ...state,
        recordsByKey: {
          ...state.recordsByKey,
          [key]: record,
        },
      };
    }
    case 'tombstone': {
      const { trackId, date, deletedAtMs } = action.payload;
      const key = makeRecordKey(trackId, date);
      const existing = state.recordsByKey[key];
      if (!existing) {
        return state;
      }
      return {
        ...state,
        recordsByKey: {
          ...state.recordsByKey,
          [key]: {
            ...existing,
            isDeleted: true,
            deletedAtMs,
            updatedAtMs: deletedAtMs,
          },
        },
      };
    }
    case 'set-today': {
      if (action.payload === state.todayKey) {
        return state;
      }
      return {
        ...state,
        todayKey: action.payload,
      };
    }
    default:
      return state;
  }
}

export function RecordsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(recordsReducer, INITIAL_STATE);
  const { settings, hydrated: settingsHydrated, updateSettings } = useSettings();
  const { session } = useAuth();

  useEffect(() => {
    let active = true;
    loadRecords()
      .then((loaded) => {
        if (!active) {
          return;
        }
        dispatch({ type: 'hydrate', payload: loaded });
      })
      .catch((error) => {
        console.warn('records hydrate failed', error);
        if (active) {
          dispatch({ type: 'hydrate', payload: {} });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const records = useMemo(() => {
    return Object.values(state.recordsByKey)
      .filter((r) => !r.isDeleted)
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) {
          return dateCompare;
        }
        return a.trackId.localeCompare(b.trackId);
      });
  }, [state.recordsByKey]);

  useEffect(() => {
    if (!state.hydrated) {
      return;
    }
    const handle = setTimeout(() => {
      saveRecords(state.recordsByKey);
    }, 400);
    return () => clearTimeout(handle);
  }, [state.recordsByKey, state.hydrated]);

  useEffect(() => {
    if (!state.hydrated || !settingsHydrated) {
      return;
    }
    if (!settings.remindersEnabled) {
      return;
    }
    const reminderTime = parseReminderTime(settings.reminderTime);
    let active = true;
    void rescheduleAllBasedOnRecords(records, reminderTime).then((id) => {
      if (!active) {
        return;
      }
      updateSettings({ scheduledNotificationId: id ?? null });
    });
    return () => {
      active = false;
    };
  }, [
    records,
    settings.remindersEnabled,
    settings.reminderTime,
    state.hydrated,
    settingsHydrated,
    updateSettings,
  ]);

  const refreshTodayKey = useCallback(() => {
    const nextKey = getDateKey();
    dispatch({ type: 'set-today', payload: nextKey });
    return nextKey;
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshTodayKey();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshTodayKey]);

  const upsertRecord = useCallback(
    (record: DailyRecordInput) => {
      const now = Date.now();
      const key = makeRecordKey(record.trackId, record.date);
      const existing = state.recordsByKey[key];
      const merged: DailyRecord = {
        ...record,
        isDeleted: false,
        deletedAtMs: null,
        createdAtMs: existing?.createdAtMs ?? now,
        updatedAtMs: now,
      };
      dispatch({ type: 'upsert', payload: merged });
      if (shouldSync(merged.date, settings.coachConnected, session)) {
        syncRecord(merged, session!).catch(console.warn);
      }
    },
    [state.recordsByKey, settings.coachConnected, session],
  );

  const removeRecord = useCallback(
    (trackId: TrackId, date: string) => {
      const now = Date.now();
      dispatch({ type: 'tombstone', payload: { trackId, date, deletedAtMs: now } });
      const existing = state.recordsByKey[makeRecordKey(trackId, date)];
      if (existing && shouldSync(date, settings.coachConnected, session)) {
        const tombstone: DailyRecord = {
          ...existing,
          isDeleted: true,
          deletedAtMs: now,
          updatedAtMs: now,
        };
        syncRecord(tombstone, session!).catch(console.warn);
      }
    },
    [state.recordsByKey, settings.coachConnected, session],
  );

  const getRecord = useCallback(
    (trackId: TrackId, date: string) => {
      const record = state.recordsByKey[makeRecordKey(trackId, date)];
      return record?.isDeleted ? undefined : record;
    },
    [state.recordsByKey],
  );

  const selectTodayRecord = useCallback(
    (trackId: TrackId, dateKey?: string) => {
      const key = dateKey ?? state.todayKey;
      const record = state.recordsByKey[makeRecordKey(trackId, key)];
      return record?.isDeleted ? undefined : record;
    },
    [state.recordsByKey, state.todayKey],
  );

  const selectWeekDots = useCallback(
    (trackId: TrackId, weekStartKey?: string) => {
      const startDate = resolveWeekStart(weekStartKey ?? state.todayKey);
      const weekDates = getWeekDates(startDate);
      return weekDates.map((date) => {
        const record = state.recordsByKey[makeRecordKey(trackId, date)];
        return Boolean(record && !record.isDeleted);
      });
    },
    [state.recordsByKey, state.todayKey],
  );

  const selectHasAnyRecords = useCallback(
    (trackId?: TrackId) => {
      const values = Object.values(state.recordsByKey);
      if (!trackId) {
        return values.some((r) => !r.isDeleted);
      }
      return values.some((r) => r.trackId === trackId && !r.isDeleted);
    },
    [state.recordsByKey],
  );

  const listRecordsByTrack = useCallback(
    (trackId: TrackId) => {
      return records.filter((record) => record.trackId === trackId);
    },
    [records],
  );

  const getTrackRange = useCallback(
    (trackId: TrackId) => {
      let minDate: string | undefined;
      let maxDate: string | undefined;

      for (const record of Object.values(state.recordsByKey)) {
        if (record.trackId !== trackId || record.isDeleted) {
          continue;
        }
        if (!minDate || record.date < minDate) {
          minDate = record.date;
        }
        if (!maxDate || record.date > maxDate) {
          maxDate = record.date;
        }
      }

      return { minDate, maxDate };
    },
    [state.recordsByKey],
  );

  const getTrackStreak = useCallback(
    (trackId: TrackId, fromDateKey?: string) => {
      let streak = 0;
      const cursor = parseDateKey(fromDateKey ?? state.todayKey);

      while (streak < 365) {
        const dateKey = getDateKey(cursor);
        const streakRecord = state.recordsByKey[makeRecordKey(trackId, dateKey)];
        if (!streakRecord || streakRecord.isDeleted) {
          break;
        }
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }

      return streak;
    },
    [state.recordsByKey, state.todayKey],
  );

  const value = useMemo(
    () => ({
      records,
      recordsByKey: state.recordsByKey,
      upsertRecord,
      removeRecord,
      getRecord,
      selectTodayRecord,
      selectWeekDots,
      selectHasAnyRecords,
      listRecordsByTrack,
      getTrackRange,
      getTrackStreak,
      getWeekDots: selectWeekDots,
      todayKey: state.todayKey,
      refreshTodayKey,
      hydrated: state.hydrated,
    }),
    [
      records,
      state.recordsByKey,
      upsertRecord,
      removeRecord,
      getRecord,
      selectTodayRecord,
      selectWeekDots,
      selectHasAnyRecords,
      listRecordsByTrack,
      getTrackRange,
      getTrackStreak,
      state.todayKey,
      refreshTodayKey,
      state.hydrated,
    ]
  );

  return (
    <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>
  );
}

export function useRecords() {
  const context = useContext(RecordsContext);
  if (!context) {
    throw new Error('useRecords must be used within a RecordsProvider');
  }
  return context;
}

export function useRecordsHydration() {
  const { hydrated } = useRecords();
  return hydrated;
}

export function getDateKey(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayKey() {
  return getDateKey(new Date());
}

export function getTodayDateString() {
  return getTodayKey();
}

export function parseDateKey(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const parsed = new Date(year, (month ?? 1) - 1, day ?? 1);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

export function getWeekDates(referenceDate: Date | string = new Date()) {
  const resolved =
    referenceDate instanceof Date ? referenceDate : parseDateKey(referenceDate);
  const start = getStartOfWeek(resolved);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return getDateKey(date);
  });
}

export function getWeekStartKey(referenceDate: Date | string = new Date()) {
  const resolved =
    referenceDate instanceof Date ? referenceDate : parseDateKey(referenceDate);
  return getDateKey(getStartOfWeek(resolved));
}

function resolveWeekStart(weekStartDate?: Date | string) {
  if (!weekStartDate) {
    return getStartOfWeek(new Date());
  }
  if (weekStartDate instanceof Date) {
    return getStartOfWeek(weekStartDate);
  }
  const parsed = parseDateKey(weekStartDate);
  return getStartOfWeek(parsed);
}

function getStartOfWeek(date: Date) {
  const day = date.getDay();
  const diff = (day + 6) % 7; // Monday as start
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - diff);
  return start;
}
