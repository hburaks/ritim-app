import type { SubjectDef, TrackId } from './tracks';
import { getTrackById } from './tracks';

export type TopicsSource = 'TOPICS_7' | 'TOPICS_8' | 'EMPTY';

export function getSubjectsForActiveTrack(trackId: TrackId): SubjectDef[] {
  return getTrackById(trackId).subjects;
}

export function getTopicsSourceForActiveTrack(trackId: TrackId): TopicsSource {
  switch (trackId) {
    case 'LGS7':
      return 'TOPICS_7';
    case 'LGS8':
      return 'TOPICS_8';
    case 'TYT':
    case 'AYT':
      return 'EMPTY';
  }
}
