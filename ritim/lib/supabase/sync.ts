import type { Session } from '@supabase/supabase-js';

import type { DailyRecord } from '@/state/records';

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
