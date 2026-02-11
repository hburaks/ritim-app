import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import {
  type ExamsMap,
  loadExams,
  saveExams,
} from '@/lib/storage/examsStorage';
import { shouldSync, syncExam } from '@/lib/supabase/sync';
import type { TrackId } from '@/lib/track/tracks';
import type { ExamRecord } from '@/types/exam';
import { useAuth } from '@/state/auth';
import { useSettings } from '@/state/settings';

type ExamsState = {
  examsById: ExamsMap;
  hydrated: boolean;
};

type ExamsAction =
  | { type: 'hydrate'; payload: ExamsMap }
  | { type: 'upsert'; payload: ExamRecord }
  | { type: 'remove'; payload: { id: string; deletedAtMs: number } };

type AddExamInput = Omit<ExamRecord, 'id' | 'createdAtMs' | 'updatedAtMs' | 'isDeleted'>;

type ExamsContextValue = {
  addExam: (exam: AddExamInput) => void;
  updateExam: (exam: ExamRecord) => void;
  removeExam: (id: string) => void;
  getExamsForDate: (trackId: TrackId, date: string) => ExamRecord[];
  getExamsForTrack: (trackId: TrackId) => ExamRecord[];
  getExamDurationForDate: (trackId: TrackId, date: string) => number;
  hydrated: boolean;
};

const ExamsContext = createContext<ExamsContextValue | undefined>(undefined);

const INITIAL_STATE: ExamsState = {
  examsById: {},
  hydrated: false,
};

function examsReducer(state: ExamsState, action: ExamsAction): ExamsState {
  switch (action.type) {
    case 'hydrate':
      return { ...state, examsById: action.payload, hydrated: true };
    case 'upsert': {
      const exam = action.payload;
      return {
        ...state,
        examsById: { ...state.examsById, [exam.id]: exam },
      };
    }
    case 'remove': {
      const { id, deletedAtMs } = action.payload;
      const existing = state.examsById[id];
      if (!existing) return state;
      return {
        ...state,
        examsById: {
          ...state.examsById,
          [id]: {
            ...existing,
            isDeleted: true,
            deletedAtMs,
            updatedAtMs: deletedAtMs,
          },
        },
      };
    }
    default:
      return state;
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ExamsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(examsReducer, INITIAL_STATE);
  const { settings } = useSettings();
  const { session } = useAuth();

  useEffect(() => {
    let active = true;
    loadExams()
      .then((loaded) => {
        if (active) dispatch({ type: 'hydrate', payload: loaded });
      })
      .catch((error) => {
        console.warn('exams hydrate failed', error);
        if (active) dispatch({ type: 'hydrate', payload: {} });
      });
    return () => {
      active = false;
    };
  }, []);

  // Debounced persistence
  useEffect(() => {
    if (!state.hydrated) return;
    const handle = setTimeout(() => {
      saveExams(state.examsById);
    }, 400);
    return () => clearTimeout(handle);
  }, [state.examsById, state.hydrated]);

  const trySyncExam = useCallback(
    (exam: ExamRecord) => {
      if (!settings.activeTrack) return;
      if (shouldSync(exam.date, settings.coachConnected, session)) {
        syncExam(exam, session!).catch(console.warn);
      }
    },
    [settings.coachConnected, settings.activeTrack, session],
  );

  const addExam = useCallback(
    (partial: AddExamInput) => {
      const now = Date.now();
      const exam: ExamRecord = {
        ...partial,
        id: generateId(),
        isDeleted: false,
        createdAtMs: now,
        updatedAtMs: now,
      };
      dispatch({ type: 'upsert', payload: exam });
      trySyncExam(exam);
    },
    [trySyncExam],
  );

  const updateExam = useCallback(
    (exam: ExamRecord) => {
      const updated: ExamRecord = { ...exam, updatedAtMs: Date.now() };
      dispatch({ type: 'upsert', payload: updated });
      trySyncExam(updated);
    },
    [trySyncExam],
  );

  const removeExam = useCallback(
    (id: string) => {
      const now = Date.now();
      dispatch({ type: 'remove', payload: { id, deletedAtMs: now } });
      const existing = state.examsById[id];
      if (existing) {
        const tombstone: ExamRecord = {
          ...existing,
          isDeleted: true,
          deletedAtMs: now,
          updatedAtMs: now,
        };
        trySyncExam(tombstone);
      }
    },
    [state.examsById, trySyncExam],
  );

  const getExamsForDate = useCallback(
    (trackId: TrackId, date: string): ExamRecord[] => {
      return Object.values(state.examsById)
        .filter((e) => e.trackId === trackId && e.date === date && !e.isDeleted)
        .sort((a, b) => a.createdAtMs - b.createdAtMs);
    },
    [state.examsById],
  );

  const getExamsForTrack = useCallback(
    (trackId: TrackId): ExamRecord[] => {
      return Object.values(state.examsById)
        .filter((e) => e.trackId === trackId && !e.isDeleted)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAtMs - a.createdAtMs);
    },
    [state.examsById],
  );

  const getExamDurationForDate = useCallback(
    (trackId: TrackId, date: string): number => {
      return Object.values(state.examsById)
        .filter((e) => e.trackId === trackId && e.date === date && !e.isDeleted)
        .reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);
    },
    [state.examsById],
  );

  const value = useMemo(
    () => ({
      addExam,
      updateExam,
      removeExam,
      getExamsForDate,
      getExamsForTrack,
      getExamDurationForDate,
      hydrated: state.hydrated,
    }),
    [
      addExam,
      updateExam,
      removeExam,
      getExamsForDate,
      getExamsForTrack,
      getExamDurationForDate,
      state.hydrated,
    ],
  );

  return (
    <ExamsContext.Provider value={value}>{children}</ExamsContext.Provider>
  );
}

export function useExams() {
  const context = useContext(ExamsContext);
  if (!context) {
    throw new Error('useExams must be used within an ExamsProvider');
  }
  return context;
}
