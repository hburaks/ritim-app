import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import { loadTopics, saveTopics } from '@/lib/storage/topicsStorage';
import { getTopicsSourceForActiveTrack } from '@/lib/track/selectors';
import type { SubjectDef, TrackId } from '@/lib/track/tracks';

export type TopicSubject = 'MAT' | 'TURK' | 'FEN' | 'INK' | 'DIN';
export type TopicMood = 'GOOD' | 'HARD' | 'NONE';
export type SubjectKey = SubjectDef['key'];

export type TopicItem = {
  id: string;
  // Deprecated: kept for backward compatibility with older UI code paths.
  subject: TopicSubject;
  subjectKey: SubjectKey;
  title: string;
};

type TopicsState = {
  moods: Record<string, TopicMood>;
  hydrated: boolean;
};

type TopicsAction =
  | { type: 'hydrate'; payload: Record<string, TopicMood> }
  | { type: 'set-mood'; payload: { topicId: string; mood: TopicMood } }
  | { type: 'toggle-mood'; payload: { topicId: string; mood: Exclude<TopicMood, 'NONE'> } };

type TopicsContextValue = {
  topics: TopicItem[];
  setMood: (topicId: string, mood: TopicMood) => void;
  toggleMood: (topicId: string, mood: Exclude<TopicMood, 'NONE'>) => void;
  getMood: (topicId: string) => TopicMood;
  hydrated: boolean;
};

const TopicsContext = createContext<TopicsContextValue | undefined>(undefined);

const INITIAL_STATE: TopicsState = {
  moods: {},
  hydrated: false,
};

const TOPICS_7: TopicItem[] = [
  { id: 'mat-7-1', subject: 'MAT', subjectKey: 'mat', title: 'Tam sayilar' },
  { id: 'mat-7-2', subject: 'MAT', subjectKey: 'mat', title: 'Kesirler' },
  { id: 'turk-7-1', subject: 'TURK', subjectKey: 'turkce', title: 'Fiiller' },
  { id: 'turk-7-2', subject: 'TURK', subjectKey: 'turkce', title: 'Cümlede anlam' },
  { id: 'fen-7-1', subject: 'FEN', subjectKey: 'fen', title: 'Hücre ve bolunmeler' },
  { id: 'fen-7-2', subject: 'FEN', subjectKey: 'fen', title: 'Kuvvet ve enerji' },
  { id: 'ink-7-1', subject: 'INK', subjectKey: 'inkilap', title: 'Milli Mucadele' },
  { id: 'ink-7-2', subject: 'INK', subjectKey: 'inkilap', title: 'Ataturkculuk' },
  { id: 'din-7-1', subject: 'DIN', subjectKey: 'din', title: 'Inanc esaslari' },
  { id: 'din-7-2', subject: 'DIN', subjectKey: 'din', title: 'Ibadet ve dua' },
];

const TOPICS_8: TopicItem[] = [
  { id: 'mat-8-1', subject: 'MAT', subjectKey: 'mat', title: 'Carpanlar ve katlar' },
  { id: 'mat-8-2', subject: 'MAT', subjectKey: 'mat', title: 'Denklemler' },
  { id: 'turk-8-1', subject: 'TURK', subjectKey: 'turkce', title: 'Paragraf' },
  { id: 'turk-8-2', subject: 'TURK', subjectKey: 'turkce', title: 'Fiilimsi' },
  { id: 'fen-8-1', subject: 'FEN', subjectKey: 'fen', title: 'DNA ve genetik' },
  { id: 'fen-8-2', subject: 'FEN', subjectKey: 'fen', title: 'Basinc' },
  { id: 'ink-8-1', subject: 'INK', subjectKey: 'inkilap', title: 'Inkilap tarihi' },
  { id: 'ink-8-2', subject: 'INK', subjectKey: 'inkilap', title: 'Ataturk ilkeleri' },
  { id: 'din-8-1', subject: 'DIN', subjectKey: 'din', title: 'Ahlak ve erdem' },
  { id: 'din-8-2', subject: 'DIN', subjectKey: 'din', title: 'Hak ve sorumluluk' },
];

function topicsReducer(state: TopicsState, action: TopicsAction): TopicsState {
  switch (action.type) {
    case 'hydrate':
      return {
        moods: action.payload,
        hydrated: true,
      };
    case 'set-mood': {
      const { topicId, mood } = action.payload;
      return {
        ...state,
        moods: {
          ...state.moods,
          [topicId]: mood,
        },
      };
    }
    case 'toggle-mood': {
      const { topicId, mood } = action.payload;
      const currentMood = state.moods[topicId] ?? 'NONE';
      return {
        ...state,
        moods: {
          ...state.moods,
          [topicId]: currentMood === mood ? 'NONE' : mood,
        },
      };
    }
    default:
      return state;
  }
}

export function TopicsProvider({
  children,
  trackId,
}: {
  children: React.ReactNode;
  trackId: TrackId;
}) {
  const [state, dispatch] = useReducer(topicsReducer, INITIAL_STATE);

  useEffect(() => {
    let active = true;
    loadTopics()
      .then((loaded) => {
        if (!active) {
          return;
        }
        dispatch({ type: 'hydrate', payload: loaded.moods });
      })
      .catch((error) => {
        console.warn('topics hydrate failed', error);
        if (active) {
          dispatch({ type: 'hydrate', payload: {} });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) {
      return;
    }
    const handle = setTimeout(() => {
      saveTopics({ moods: state.moods });
    }, 400);
    return () => clearTimeout(handle);
  }, [state.moods, state.hydrated]);

  const topics = useMemo(() => {
    const source = getTopicsSourceForActiveTrack(trackId);
    if (source === 'TOPICS_7') return TOPICS_7;
    if (source === 'TOPICS_8') return TOPICS_8;
    return [];
  }, [trackId]);

  const setMood = useCallback((topicId: string, mood: TopicMood) => {
    dispatch({ type: 'set-mood', payload: { topicId, mood } });
  }, []);

  const toggleMood = useCallback(
    (topicId: string, mood: Exclude<TopicMood, 'NONE'>) => {
      dispatch({ type: 'toggle-mood', payload: { topicId, mood } });
    },
    []
  );

  const getMood = useCallback(
    (topicId: string) => {
      return state.moods[topicId] ?? 'NONE';
    },
    [state.moods]
  );

  const value = useMemo(
    () => ({
      topics,
      setMood,
      toggleMood,
      getMood,
      hydrated: state.hydrated,
    }),
    [topics, setMood, toggleMood, getMood, state.hydrated]
  );

  return <TopicsContext.Provider value={value}>{children}</TopicsContext.Provider>;
}

export function useTopics() {
  const context = useContext(TopicsContext);
  if (!context) {
    throw new Error('useTopics must be used within a TopicsProvider');
  }
  return context;
}
