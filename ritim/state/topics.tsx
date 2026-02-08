import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import { loadTopics, saveTopics } from '@/lib/storage/topicsStorage';

export type TopicSubject = 'MAT' | 'TURK' | 'FEN' | 'INK';
export type TopicMood = 'GOOD' | 'HARD' | 'NONE';

export type TopicItem = {
  id: string;
  subject: TopicSubject;
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
  { id: 'mat-7-1', subject: 'MAT', title: 'Tam sayilar' },
  { id: 'mat-7-2', subject: 'MAT', title: 'Kesirler' },
  { id: 'turk-7-1', subject: 'TURK', title: 'Fiiller' },
  { id: 'turk-7-2', subject: 'TURK', title: 'Cümlede anlam' },
  { id: 'fen-7-1', subject: 'FEN', title: 'Hücre ve bolunmeler' },
  { id: 'fen-7-2', subject: 'FEN', title: 'Kuvvet ve enerji' },
  { id: 'ink-7-1', subject: 'INK', title: 'Milli Mucadele' },
  { id: 'ink-7-2', subject: 'INK', title: 'Ataturkculuk' },
];

const TOPICS_8: TopicItem[] = [
  { id: 'mat-8-1', subject: 'MAT', title: 'Carpanlar ve katlar' },
  { id: 'mat-8-2', subject: 'MAT', title: 'Denklemler' },
  { id: 'turk-8-1', subject: 'TURK', title: 'Paragraf' },
  { id: 'turk-8-2', subject: 'TURK', title: 'Fiilimsi' },
  { id: 'fen-8-1', subject: 'FEN', title: 'DNA ve genetik' },
  { id: 'fen-8-2', subject: 'FEN', title: 'Basinc' },
  { id: 'ink-8-1', subject: 'INK', title: 'Inkilap tarihi' },
  { id: 'ink-8-2', subject: 'INK', title: 'Ataturk ilkeleri' },
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
  grade = '8',
}: {
  children: React.ReactNode;
  grade?: '7' | '8';
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

  const topics = useMemo(() => (grade === '7' ? TOPICS_7 : TOPICS_8), [grade]);

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
