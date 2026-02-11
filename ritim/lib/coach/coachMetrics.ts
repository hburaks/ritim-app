import type { TrackId } from '@/lib/track/tracks';
import type { StudentDailyRecord, StudentExamRecord } from './coachApi';

// ─── Filtering ───

export function filterDailyByTrack(
  records: StudentDailyRecord[],
  userId: string,
  trackId: TrackId | null,
): StudentDailyRecord[] {
  if (!trackId) return [];
  return records.filter(
    (r) => r.user_id === userId && r.track_id === trackId,
  );
}

export function filterExamsByTrack(
  records: StudentExamRecord[],
  userId: string,
  trackId: TrackId | null,
): StudentExamRecord[] {
  if (!trackId) return [];
  return records.filter(
    (r) => r.user_id === userId && r.track_id === trackId,
  );
}

// ─── Last Activity ───

export function computeLastActivity(
  dailyRecords: StudentDailyRecord[],
  examRecords: StudentExamRecord[],
): string | null {
  let maxDate: string | null = null;

  for (const r of dailyRecords) {
    if (!maxDate || r.date > maxDate) maxDate = r.date;
  }
  for (const r of examRecords) {
    if (!maxDate || r.date > maxDate) maxDate = r.date;
  }

  return maxDate;
}

export function formatLastActivity(lastDate: string | null, today: string): string {
  if (!lastDate) return 'Son 30 günde aktivite yok';

  if (lastDate === today) return 'Bugün';

  const diffMs = new Date(today).getTime() - new Date(lastDate).getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Dün';
  if (diffDays > 30) return 'Son 30 günde aktivite yok';
  return `${diffDays} gün önce`;
}

// ─── Weekly Metrics ───

function getWeekStart(today: string): string {
  const d = new Date(today + 'T00:00:00');
  d.setDate(d.getDate() - 6);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function computeWeeklyMinutes(
  dailyRecords: StudentDailyRecord[],
  examRecords: StudentExamRecord[],
  today: string,
): number {
  const weekStart = getWeekStart(today);

  let total = 0;

  for (const r of dailyRecords) {
    if (r.date >= weekStart && r.date <= today) {
      total += r.focus_minutes;
    }
  }

  for (const r of examRecords) {
    if (r.date >= weekStart && r.date <= today) {
      total += r.duration_minutes ?? 0;
    }
  }

  return total;
}

export function computeWeeklyFullExamCount(
  examRecords: StudentExamRecord[],
  today: string,
): number {
  const weekStart = getWeekStart(today);

  let count = 0;
  for (const r of examRecords) {
    if (r.date >= weekStart && r.date <= today) {
      count++;
    }
  }

  return count;
}

// ─── Local today helper ───

export function getLocalToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
