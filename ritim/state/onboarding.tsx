import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { loadGrade, saveGrade } from '@/lib/storage/gradeStorage';
import {
  loadOnboardingCompleted,
  saveOnboardingCompleted,
} from '@/lib/storage/onboardingStorage';

type OnboardingContextValue = {
  completed: boolean;
  setCompleted: (value: boolean) => void;
  hydrated: boolean;
  grade: '7' | '8' | null;
  setGrade: (value: '7' | '8' | null) => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined
);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [completed, setCompleted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [grade, setGrade] = useState<'7' | '8' | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([loadOnboardingCompleted(), loadGrade()])
      .then(([loadedCompleted, loadedGrade]) => {
        if (!active) {
          return;
        }
        if (loadedCompleted) {
          setCompleted(true);
        }
        if (loadedGrade) {
          setGrade(loadedGrade);
        }
      })
      .catch((error) => {
        console.warn('onboarding hydrate failed', error);
      })
      .finally(() => {
        if (active) {
          setHydrated(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveOnboardingCompleted(completed);
  }, [completed, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveGrade(grade);
  }, [grade, hydrated]);

  const value = useMemo(
    () => ({
      completed,
      setCompleted,
      hydrated,
      grade,
      setGrade,
    }),
    [completed, hydrated, grade]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
