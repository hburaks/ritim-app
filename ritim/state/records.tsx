import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { loadRecords, saveRecords } from '@/lib/storage/recordsStorage';
import { rescheduleAllBasedOnRecords } from '@/lib/notifications/ritimNotifications';

export type ActivityType = 'KONU' | 'SORU' | 'KARISIK';

export type DailyRecord = {
  date: string; // YYYY-MM-DD
  focusMinutes: number;
  activityType: ActivityType;
  questionCount?: number;
  subjectBreakdown?: Record<string, number>;
};

type RecordsContextValue = {
  records: DailyRecord[];
  upsertRecord: (record: DailyRecord) => void;
  removeRecord: (date: string) => void;
  getRecordByDate: (date: string) => DailyRecord | undefined;
  hasRecordForDate: (date: string) => boolean;
  getWeekDots: (weekStartDate?: Date | string) => boolean[];
  hydrated: boolean;
};

const RecordsContext = createContext<RecordsContextValue | undefined>(undefined);

export function RecordsProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    loadRecords()
      .then((loaded) => {
        if (!active) {
          return;
        }
        if (loaded.length) {
          setRecords(loaded);
        }
      })
      .catch((error) => {
        console.warn('records hydrate failed', error);
      })
      .finally(() => {
        if (active) {
          setHydrated(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const handle = setTimeout(() => {
      saveRecords(records);
    }, 300);
    return () => clearTimeout(handle);
  }, [records, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    rescheduleAllBasedOnRecords(records);
  }, [records, hydrated]);

  const upsertRecord = useCallback((record: DailyRecord) => {
    setRecords((current) => {
      const index = current.findIndex((item) => item.date === record.date);
      if (index === -1) {
        return [record, ...current];
      }
      const next = [...current];
      next[index] = record;
      return next;
    });
  }, []);

  const removeRecord = useCallback((date: string) => {
    setRecords((current) => current.filter((record) => record.date !== date));
  }, []);

  const recordMap = useMemo(() => {
    return new Map(records.map((record) => [record.date, record]));
  }, [records]);

  const getRecordByDate = useCallback(
    (date: string) => {
      return recordMap.get(date);
    },
    [recordMap]
  );

  const hasRecordForDate = useCallback(
    (date: string) => {
      return recordMap.has(date);
    },
    [recordMap]
  );

  const getWeekDots = useCallback(
    (weekStartDate?: Date | string) => {
      const startDate = resolveWeekStart(weekStartDate);
      const weekDates = getWeekDates(startDate);
      return weekDates.map((date) => recordMap.has(date));
    },
    [recordMap]
  );

  const value = useMemo(
    () => ({
      records,
      upsertRecord,
      removeRecord,
      getRecordByDate,
      hasRecordForDate,
      getWeekDots,
      hydrated,
    }),
    [
      records,
      upsertRecord,
      removeRecord,
      getRecordByDate,
      hasRecordForDate,
      getWeekDots,
      hydrated,
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

export function getTodayDateString() {
  return toDateString(new Date());
}

export function getWeekDates(referenceDate = new Date()) {
  const start = getStartOfWeek(referenceDate);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return toDateString(date);
  });
}

function resolveWeekStart(weekStartDate?: Date | string) {
  if (!weekStartDate) {
    return getStartOfWeek(new Date());
  }
  if (weekStartDate instanceof Date) {
    return getStartOfWeek(weekStartDate);
  }
  const parsed = parseDateString(weekStartDate);
  return getStartOfWeek(parsed);
}

function parseDateString(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const parsed = new Date(year, (month ?? 1) - 1, day ?? 1);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function getStartOfWeek(date: Date) {
  const day = date.getDay();
  const diff = (day + 6) % 7; // Monday as start
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - diff);
  return start;
}

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
