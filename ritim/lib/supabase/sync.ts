import type { Session } from '@supabase/supabase-js';

import type { DailyRecord } from '@/state/records';
import type { ExamRecord } from '@/types/exam';

import { supabase } from './client';

const SYNC_WINDOW_DAYS = 30;

type CloudRecord = {
  user_id: string;
  track_id: string;
  date: string;
  focus_minutes: number;
  activity_type: string;
  question_count: number | null;
  subject_breakdown: Record<string, number> | null;
  updated_at: string;
};

export function shouldSync(
  recordDate: string,
  coachConnected: boolean,
  session: Session | null,
): boolean {
  if (!coachConnected || !session) return false;

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - SYNC_WINDOW_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return recordDate >= cutoffStr;
}

function toCloudRecord(record: DailyRecord, userId: string): CloudRecord {
  return {
    user_id: userId,
    track_id: record.trackId,
    date: record.date,
    focus_minutes: record.focusMinutes,
    activity_type: record.activityType,
    question_count: record.questionCount ?? null,
    subject_breakdown: record.subjectBreakdown ?? null,
    updated_at: new Date().toISOString(),
  };
}

export async function syncRecord(
  record: DailyRecord,
  session: Session,
): Promise<void> {
  const cloud = toCloudRecord(record, session.user.id);
  const { error } = await supabase
    .from('daily_records')
    .upsert(cloud, { onConflict: 'user_id,track_id,date' });

  if (error) {
    console.warn('[sync] upsert failed:', error.message);
  }
}

export async function deleteRecordFromCloud(
  date: string,
  trackId: string,
  session: Session,
): Promise<void> {
  const { error } = await supabase
    .from('daily_records')
    .delete()
    .eq('user_id', session.user.id)
    .eq('track_id', trackId)
    .eq('date', date);

  if (error) {
    console.warn('[sync] delete failed:', error.message);
  }
}

export async function syncInitialLast30Days(
  records: DailyRecord[],
  session: Session,
): Promise<void> {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - SYNC_WINDOW_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const cloudRecords = records
    .filter((r) => r.date >= cutoffStr)
    .map((r) => toCloudRecord(r, session.user.id));

  if (cloudRecords.length === 0) return;

  const { error } = await supabase
    .from('daily_records')
    .upsert(cloudRecords, { onConflict: 'user_id,track_id,date' });

  if (error) {
    console.warn('[sync] initial sync failed:', error.message);
  }
}

// ─── Exam sync ───

type CloudExamRecord = {
  id: string;
  user_id: string;
  track_id: string;
  date: string;
  type: string;
  subject_key: string | null;
  name: string | null;
  subject_scores: Record<string, { correct: number; wrong: number; blank: number }> | null;
  correct_total: number;
  wrong_total: number;
  blank_total: number;
  duration_minutes: number | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

function toCloudExam(exam: ExamRecord, userId: string): CloudExamRecord {
  return {
    id: exam.id,
    user_id: userId,
    track_id: exam.trackId,
    date: exam.date,
    type: exam.type,
    subject_key: exam.subjectKey ?? null,
    name: exam.name ?? null,
    subject_scores: exam.subjectScores ?? null,
    correct_total: exam.correctTotal,
    wrong_total: exam.wrongTotal,
    blank_total: exam.blankTotal,
    duration_minutes: exam.durationMinutes ?? null,
    is_deleted: exam.isDeleted,
    deleted_at: exam.deletedAtMs ? new Date(exam.deletedAtMs).toISOString() : null,
    created_at: new Date(exam.createdAtMs).toISOString(),
    updated_at: new Date(exam.updatedAtMs).toISOString(),
  };
}

export async function syncExam(
  exam: ExamRecord,
  session: Session,
): Promise<void> {
  const cloud = toCloudExam(exam, session.user.id);
  const { error } = await supabase
    .from('exam_records')
    .upsert(cloud, { onConflict: 'id' });

  if (error) {
    console.warn('[sync] exam upsert failed:', error.message);
  }
}

export async function syncInitialExamsLast30Days(
  exams: ExamRecord[],
  session: Session,
): Promise<void> {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - SYNC_WINDOW_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const cloudExams = exams
    .filter((e) => e.date >= cutoffStr)
    .map((e) => toCloudExam(e, session.user.id));

  if (cloudExams.length === 0) return;

  const { error } = await supabase
    .from('exam_records')
    .upsert(cloudExams, { onConflict: 'id' });

  if (error) {
    console.warn('[sync] initial exam sync failed:', error.message);
  }
}
