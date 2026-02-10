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
import { loadRecords, saveRecords } from '@/lib/storage/recordsStorage';
import {
  deleteRecordFromCloud,
  shouldSync,
  syncRecord,
} from '@/lib/supabase/sync';
import { useAuth } from '@/state/auth';
import { parseReminderTime, useSettings } from '@/state/settings';

export type ActivityType = 'KONU' | 'SORU' | 'KARISIK';

export type DailyRecord = {
  date: string; // YYYY-MM-DD
  focusMinutes: number;
  activityType: ActivityType;
  questionCount?: number;
  subjectBreakdown?: Record<string, number>;
};

type RecordsState = {
  recordsByDate: Record<string, DailyRecord>;
  todayKey: string;
  hydrated: boolean;
};

type RecordsAction =
  | { type: 'hydrate'; payload: Record<string, DailyRecord> }
  | { type: 'upsert'; payload: DailyRecord }
  | { type: 'remove'; payload: { date: string } }
  | { type: 'set-today'; payload: string };

type RecordsContextValue = {
  records: DailyRecord[];
  recordsByDate: Record<string, DailyRecord>;
  upsertRecord: (record: DailyRecord) => void;
  removeRecord: (date: string) => void;
  getRecordByDate: (date: string) => DailyRecord | undefined;
  selectTodayRecord: (dateKey?: string) => DailyRecord | undefined;
  selectWeekDots: (weekStartKey?: string) => boolean[];
  selectHasAnyRecords: () => boolean;
  getWeekDots: (weekStartKey?: string) => boolean[];
  todayKey: string;
  refreshTodayKey: () => string;
  hydrated: boolean;
};

const RecordsContext = createContext<RecordsContextValue | undefined>(undefined);

const INITIAL_STATE: RecordsState = {
  recordsByDate: {},
  todayKey: getDateKey(),
  hydrated: false,
};

function recordsReducer(state: RecordsState, action: RecordsAction): RecordsState {
  switch (action.type) {
    case 'hydrate':
      return {
        ...state,
        recordsByDate: action.payload,
        hydrated: true,
      };
    case 'upsert': {
      const record = action.payload;
      return {
        ...state,
        recordsByDate: {
          ...state.recordsByDate,
          [record.date]: record,
        },
      };
    }
    case 'remove': {
      const { date } = action.payload;
      if (!state.recordsByDate[date]) {
        return state;
      }
      const next = { ...state.recordsByDate };
      delete next[date];
      return {
        ...state,
        recordsByDate: next,
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
    return Object.values(state.recordsByDate).sort((a, b) => b.date.localeCompare(a.date));
  }, [state.recordsByDate]);

  useEffect(() => {
    if (!state.hydrated) {
      return;
    }
    const handle = setTimeout(() => {
      saveRecords(state.recordsByDate);
    }, 400);
    return () => clearTimeout(handle);
  }, [state.recordsByDate, state.hydrated]);

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
    (record: DailyRecord) => {
      dispatch({ type: 'upsert', payload: record });
      if (shouldSync(record.date, settings.coachConnected, session)) {
        syncRecord(record, session!).catch(console.warn);
      }
    },
    [settings.coachConnected, session],
  );

  const removeRecord = useCallback(
    (date: string) => {
      dispatch({ type: 'remove', payload: { date } });
      if (shouldSync(date, settings.coachConnected, session)) {
        deleteRecordFromCloud(date, session!).catch(console.warn);
      }
    },
    [settings.coachConnected, session],
  );

  const getRecordByDate = useCallback(
    (date: string) => {
      return state.recordsByDate[date];
    },
    [state.recordsByDate]
  );

  const selectTodayRecord = useCallback(
    (dateKey?: string) => {
      const key = dateKey ?? state.todayKey;
      return state.recordsByDate[key];
    },
    [state.recordsByDate, state.todayKey]
  );

  const selectWeekDots = useCallback(
    (weekStartKey?: string) => {
      const startDate = resolveWeekStart(weekStartKey ?? state.todayKey);
      const weekDates = getWeekDates(startDate);
      return weekDates.map((date) => Boolean(state.recordsByDate[date]));
    },
    [state.recordsByDate, state.todayKey]
  );

  const selectHasAnyRecords = useCallback(() => {
    return Object.keys(state.recordsByDate).length > 0;
  }, [state.recordsByDate]);

  const value = useMemo(
    () => ({
      records,
      recordsByDate: state.recordsByDate,
      upsertRecord,
      removeRecord,
      getRecordByDate,
      selectTodayRecord,
      selectWeekDots,
      selectHasAnyRecords,
      getWeekDots: selectWeekDots,
      todayKey: state.todayKey,
      refreshTodayKey,
      hydrated: state.hydrated,
    }),
    [
      records,
      state.recordsByDate,
      upsertRecord,
      removeRecord,
      getRecordByDate,
      selectTodayRecord,
      selectWeekDots,
      selectHasAnyRecords,
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
