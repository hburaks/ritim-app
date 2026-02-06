import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type TopicSubject = 'MAT' | 'TURK' | 'FEN' | 'INK';
export type TopicMood = 'GOOD' | 'HARD' | 'NONE';

export type TopicItem = {
  id: string;
  subject: TopicSubject;
  title: string;
};

type TopicsContextValue = {
  topics: TopicItem[];
  setMood: (topicId: string, mood: TopicMood) => void;
  toggleMood: (topicId: string, mood: Exclude<TopicMood, 'NONE'>) => void;
  getMood: (topicId: string) => TopicMood;
};

const TopicsContext = createContext<TopicsContextValue | undefined>(undefined);

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

export function TopicsProvider({
  children,
  grade = '8',
}: {
  children: React.ReactNode;
  grade?: '7' | '8';
}) {
  const [moods, setMoods] = useState<Record<string, TopicMood>>({});

  const topics = useMemo(() => (grade === '7' ? TOPICS_7 : TOPICS_8), [grade]);

  const setMood = useCallback((topicId: string, mood: TopicMood) => {
    setMoods((current) => ({
      ...current,
      [topicId]: mood,
    }));
  }, []);

  const toggleMood = useCallback(
    (topicId: string, mood: Exclude<TopicMood, 'NONE'>) => {
      setMoods((current) => {
        const currentMood = current[topicId] ?? 'NONE';
        return {
          ...current,
          [topicId]: currentMood === mood ? 'NONE' : mood,
        };
      });
    },
    []
  );

  const getMood = useCallback(
    (topicId: string) => {
      return moods[topicId] ?? 'NONE';
    },
    [moods]
  );

  const value = useMemo(
    () => ({
      topics,
      setMood,
      toggleMood,
      getMood,
    }),
    [topics, setMood, toggleMood, getMood]
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
