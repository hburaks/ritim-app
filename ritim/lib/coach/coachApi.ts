import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase/client';
import { TRACKS, type TrackId } from '@/lib/track/tracks';

// ─── Types ───

export type CoachStudent = {
  coach_id: string;
  student_id: string;
};

export type StudentProfile = {
  id: string;
  display_name: string | null;
  active_track: TrackId | null;
};

export type StudentDailyRecord = {
  user_id: string;
  track_id: string;
  date: string;
  focus_minutes: number;
};

export type StudentExamRecord = {
  user_id: string;
  track_id: string;
  date: string;
  duration_minutes: number | null;
};

export type CoachData = {
  profiles: StudentProfile[];
  dailyRecords: StudentDailyRecord[];
  examRecords: StudentExamRecord[];
};

// ─── Helpers ───

const VALID_TRACKS = new Set<string>(TRACKS.map((t) => t.id));

function validateTrackId(value: string | null | undefined): TrackId | null {
  if (value && VALID_TRACKS.has(value)) return value as TrackId;
  return null;
}

function getLocalToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDateNDaysAgo(n: number): string {
  const now = new Date();
  now.setDate(now.getDate() - n);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Fetch ───

export async function fetchCoachData(session: Session): Promise<CoachData | null> {
  // 1) Get linked student IDs
  const { data: links, error: linksErr } = await supabase
    .from('coach_students')
    .select('student_id')
    .eq('coach_id', session.user.id);

  if (linksErr) {
    console.warn('[coachApi] coach_students fetch failed:', linksErr.message);
    throw linksErr;
  }

  const studentIds = (links ?? []).map((l: { student_id: string }) => l.student_id);

  // Short-circuit: no students → return empty
  if (studentIds.length === 0) return null;

  const since30 = getDateNDaysAgo(30);

  // 2) Parallel fetch: profiles, daily_records, exam_records
  const [profilesRes, dailyRes, examsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, active_track')
      .in('id', studentIds),
    supabase
      .from('daily_records')
      .select('user_id, track_id, date, focus_minutes')
      .in('user_id', studentIds)
      .gte('date', since30)
      .eq('is_deleted', false),
    supabase
      .from('exam_records')
      .select('user_id, track_id, date, duration_minutes')
      .in('user_id', studentIds)
      .gte('date', since30)
      .eq('is_deleted', false)
      .eq('type', 'FULL'),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (dailyRes.error) throw dailyRes.error;
  if (examsRes.error) throw examsRes.error;

  const profiles: StudentProfile[] = (profilesRes.data ?? []).map((p: any) => ({
    id: p.id,
    display_name: p.display_name,
    active_track: validateTrackId(p.active_track),
  }));

  return {
    profiles,
    dailyRecords: (dailyRes.data ?? []) as StudentDailyRecord[],
    examRecords: (examsRes.data ?? []) as StudentExamRecord[],
  };
}

// ─── active_track update (best-effort) ───

export async function updateActiveTrack(trackId: TrackId): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { error } = await supabase
    .from('profiles')
    .update({ active_track: trackId })
    .eq('id', session.user.id);

  if (error) {
    console.warn('[coachApi] active_track update failed:', error.message);
  }
}
