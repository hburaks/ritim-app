export type TrackId = 'LGS7' | 'LGS8' | 'TYT' | 'AYT';

export type SubjectDef = {
  key: string;
  label: string;
};

export type TrackDef = {
  id: TrackId;
  label: string;
  shortLabel: string;
  subjects: SubjectDef[];
};

const LGS_SUBJECTS: SubjectDef[] = [
  { key: 'mat', label: 'Matematik' },
  { key: 'turkce', label: 'Türkçe' },
  { key: 'fen', label: 'Fen Bilimleri' },
  { key: 'inkilap', label: 'İnkılap' },
  { key: 'ingilizce', label: 'İngilizce' },
  { key: 'din', label: 'Din Kültürü' },
];

const TYT_SUBJECTS: SubjectDef[] = [
  { key: 'turkce', label: 'Türkçe' },
  { key: 'mat', label: 'Matematik' },
  { key: 'fen', label: 'Fen Bilimleri' },
  { key: 'sosyal', label: 'Sosyal Bilimler' },
];

const AYT_SUBJECTS: SubjectDef[] = [
  { key: 'mat', label: 'Matematik' },
  { key: 'fizik', label: 'Fizik' },
  { key: 'kimya', label: 'Kimya' },
  { key: 'biyoloji', label: 'Biyoloji' },
  { key: 'edebiyat', label: 'Edebiyat' },
  { key: 'tarih', label: 'Tarih' },
  { key: 'cografya', label: 'Coğrafya' },
];

export const TRACKS: TrackDef[] = [
  { id: 'LGS7', label: 'LGS 7. Sınıf', shortLabel: 'LGS 7', subjects: LGS_SUBJECTS },
  { id: 'LGS8', label: 'LGS 8. Sınıf', shortLabel: 'LGS 8', subjects: LGS_SUBJECTS },
  { id: 'TYT', label: 'TYT', shortLabel: 'TYT', subjects: TYT_SUBJECTS },
  { id: 'AYT', label: 'AYT', shortLabel: 'AYT', subjects: AYT_SUBJECTS },
];

export function getTrackById(id: TrackId): TrackDef {
  const track = TRACKS.find((t) => t.id === id);
  if (!track) {
    throw new Error(`Unknown track: ${id}`);
  }
  return track;
}
