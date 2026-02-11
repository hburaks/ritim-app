import type { TrackId } from '@/lib/track/tracks';

export type ExamType = 'FULL' | 'BRANCH';

export type ExamRecord = {
  id: string;
  trackId: TrackId;
  date: string; // YYYY-MM-DD
  type: ExamType;
  subjectKey?: string; // sadece BRANCH
  name?: string; // opsiyonel kullanıcı ismi

  correctTotal: number;
  wrongTotal: number;
  blankTotal: number;

  subjectScores?: Record<string, {
    correct: number;
    wrong: number;
    blank: number;
  }>;

  durationMinutes?: number;

  isDeleted: boolean;
  deletedAtMs?: number | null;
  createdAtMs: number;
  updatedAtMs: number;
};

export function calculateNet(
  trackId: TrackId,
  correct: number,
  wrong: number,
): number {
  const divisor = trackId.startsWith('LGS') ? 3 : 4;
  return correct - wrong / divisor;
}

export function sumSubjectScores(
  scores: Record<string, { correct: number; wrong: number; blank: number }>,
) {
  const correctTotal = Object.values(scores).reduce((s, v) => s + v.correct, 0);
  const wrongTotal = Object.values(scores).reduce((s, v) => s + v.wrong, 0);
  const blankTotal = Object.values(scores).reduce((s, v) => s + v.blank, 0);
  return { correctTotal, wrongTotal, blankTotal };
}
