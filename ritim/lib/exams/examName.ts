import type { ExamRecord } from '@/types/exam';
import type { TrackId } from '@/lib/track/tracks';
import { getTrackById } from '@/lib/track/tracks';
import { getSubjectsForActiveTrack } from '@/lib/track/selectors';

const MONTH_NAMES = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];

function formatShortDate(dateStr: string): string {
  const [, monthStr, dayStr] = dateStr.split('-');
  const month = Number(monthStr);
  const day = Number(dayStr);
  return `${day} ${MONTH_NAMES[month - 1]}`;
}

export function generateExamName(
  exam: ExamRecord,
  trackId: TrackId,
  existingNames: string[],
): string {
  const shortDate = formatShortDate(exam.date);
  let baseName: string;

  if (exam.type === 'FULL') {
    const track = getTrackById(trackId);
    baseName = `${track.shortLabel} Genel Deneme – ${shortDate}`;
  } else {
    const subjects = getSubjectsForActiveTrack(trackId);
    const subjectLabel = subjects.find((s) => s.key === exam.subjectKey)?.label ?? exam.subjectKey ?? 'Branş';
    baseName = `${subjectLabel} Denemesi – ${shortDate}`;
  }

  if (!existingNames.includes(baseName)) return baseName;

  let counter = 2;
  while (existingNames.includes(`${baseName} (${counter})`)) {
    counter++;
  }
  return `${baseName} (${counter})`;
}

export function getExamDisplayName(
  exam: ExamRecord,
  trackId: TrackId,
  existingNames: string[],
): string {
  if (exam.name) return exam.name;
  return generateExamName(exam, trackId, existingNames);
}

/**
 * Bir deneme listesi için sıralı isim üretir.
 * Her deneme sadece kendinden önceki denemelerin isimlerini görür,
 * böylece ilk deneme (2) almaz.
 */
export function buildExamDisplayNames(
  exams: ExamRecord[],
  trackId: TrackId,
): Map<string, string> {
  const result = new Map<string, string>();
  const usedNames: string[] = [];

  for (const exam of exams) {
    const name = getExamDisplayName(exam, trackId, usedNames);
    result.set(exam.id, name);
    usedNames.push(name);
  }

  return result;
}
