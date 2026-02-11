import React, { useEffect } from 'react';
import { Stack } from 'expo-router';

import {
  getPendingInitialSync,
  setPendingInitialSync,
} from '@/lib/storage/pendingSyncStorage';
import { syncInitialLast30Days, syncInitialExamsLast30Days } from '@/lib/supabase/sync';
import { AuthProvider, useAuth } from '@/state/auth';
import { ExamsProvider, useExams } from '@/state/exams';
import { OnboardingProvider } from '@/state/onboarding';
import { RecordsProvider, useRecords } from '@/state/records';
import { SettingsProvider, useSettings } from '@/state/settings';
import { TopicsProvider } from '@/state/topics';

export default function RootLayout() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <SettingsProvider>
          <RecordsProvider>
            <ExamsProvider>
              <TopicsProviderBridge>
              <PendingSyncRetry />
              <Stack initialRouteName="onboarding-1" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="onboarding-1" />
                <Stack.Screen name="onboarding-2" />
                <Stack.Screen name="index" />
                <Stack.Screen name="days" />
                <Stack.Screen name="week/[weekStart]" />
                <Stack.Screen name="topics" />
                <Stack.Screen name="playground" />
                <Stack.Screen name="settings" />
                <Stack.Screen name="coach-connect" />
                <Stack.Screen name="exams" />
                <Stack.Screen name="coach" />
              </Stack>
              </TopicsProviderBridge>
            </ExamsProvider>
          </RecordsProvider>
        </SettingsProvider>
      </OnboardingProvider>
    </AuthProvider>
  );
}

function TopicsProviderBridge({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  if (!settings.activeTrack) {
    return <>{children}</>;
  }
  return <TopicsProvider trackId={settings.activeTrack}>{children}</TopicsProvider>;
}

function PendingSyncRetry() {
  const { session } = useAuth();
  const { records } = useRecords();
  const { getAllExams, hydrated: examsHydrated } = useExams();
  const { hydrated: settingsHydrated } = useSettings();

  useEffect(() => {
    if (!session || !examsHydrated || !settingsHydrated) return;

    getPendingInitialSync().then((pending) => {
      if (!pending) return;

      Promise.all([
        syncInitialLast30Days(records, session),
        syncInitialExamsLast30Days(getAllExams(), session),
      ])
        .then(() => {
          setPendingInitialSync(false);
          console.log('[sync] pending initial sync completed');
        })
        .catch((err) => {
          console.warn('[sync] pending initial sync retry failed:', err);
        });
    });
  }, [session, examsHydrated, settingsHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
