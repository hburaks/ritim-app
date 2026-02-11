import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ExamRecord, ExamType } from '@/types/exam';
import type { TrackId } from '@/lib/track/tracks';
import { TRACKS } from '@/lib/track/tracks';

import { EXAMS_KEY } from './storageKeys';

const VALID_TRACK_IDS = new Set<TrackId>(TRACKS.map((t) => t.id));
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const VALID_EXAM_TYPES = new Set<ExamType>(['FULL', 'BRANCH']);

export type ExamsMap = Record<string, ExamRecord>;

export async function loadExams(): Promise<ExamsMap> {
  try {
    const raw = await AsyncStorage.getItem(EXAMS_KEY);
    if (!raw) return {};
    return coerceExamsMap(raw);
  } catch (error) {
    console.warn('examsStorage.loadExams failed', error);
    return {};
  }
}

export async function saveExams(exams: ExamsMap): Promise<void> {
  try {
    await AsyncStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
  } catch (error) {
    console.warn('examsStorage.saveExams failed', error);
  }
}

function coerceExamsMap(raw: string): ExamsMap {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const result: ExamsMap = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      const normalized = normalizeExam(value);
      if (normalized) {
        result[normalized.id] = normalized;
      }
    }
    return result;
  } catch {
    console.warn('examsStorage.parse failed');
    return {};
  }
}

function normalizeExam(input: unknown): ExamRecord | null {
  if (!input || typeof input !== 'object') return null;

  const raw = input as Record<string, unknown>;

  const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : null;
  if (!id) return null;

  const trackId =
    typeof raw.trackId === 'string' && VALID_TRACK_IDS.has(raw.trackId as TrackId)
      ? (raw.trackId as TrackId)
      : null;
  if (!trackId) return null;

  const date = typeof raw.date === 'string' && DATE_REGEX.test(raw.date) ? raw.date : null;
  if (!date) return null;

  const type =
    typeof raw.type === 'string' && VALID_EXAM_TYPES.has(raw.type as ExamType)
      ? (raw.type as ExamType)
      : 'FULL';

  const subjectKey = typeof raw.subjectKey === 'string' ? raw.subjectKey : undefined;
  const name = typeof raw.name === 'string' && raw.name.length > 0 ? raw.name : undefined;

  const correctTotal = safeNonNegInt(raw.correctTotal);
  const wrongTotal = safeNonNegInt(raw.wrongTotal);
  const blankTotal = safeNonNegInt(raw.blankTotal);

  const subjectScores = normalizeSubjectScores(raw.subjectScores);

  const durationMinutes =
    typeof raw.durationMinutes === 'number' &&
    Number.isFinite(raw.durationMinutes) &&
    raw.durationMinutes > 0
      ? Math.floor(raw.durationMinutes)
      : undefined;

  const isDeleted = raw.isDeleted === true;
  const deletedAtMs = typeof raw.deletedAtMs === 'number' ? raw.deletedAtMs : null;
  const createdAtMs =
    typeof raw.createdAtMs === 'number' && raw.createdAtMs > 0
      ? raw.createdAtMs
      : Date.now();
  const updatedAtMs =
    typeof raw.updatedAtMs === 'number' && raw.updatedAtMs > 0
      ? raw.updatedAtMs
      : Date.now();

  return {
    id,
    trackId,
    date,
    type,
    subjectKey,
    name,
    correctTotal,
    wrongTotal,
    blankTotal,
    subjectScores,
    durationMinutes,
    isDeleted,
    deletedAtMs,
    createdAtMs,
    updatedAtMs,
  };
}

function normalizeSubjectScores(
  input: unknown,
): Record<string, { correct: number; wrong: number; blank: number }> | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return undefined;

  const result: Record<string, { correct: number; wrong: number; blank: number }> = {};
  let hasAny = false;

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const entry = value as Record<string, unknown>;
    result[key] = {
      correct: safeNonNegInt(entry.correct),
      wrong: safeNonNegInt(entry.wrong),
      blank: safeNonNegInt(entry.blank),
    };
    hasAny = true;
  }

  return hasAny ? result : undefined;
}

function safeNonNegInt(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  return 0;
}
