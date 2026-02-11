import React from 'react';
import { Stack } from 'expo-router';

import { AuthProvider } from '@/state/auth';
import { ExamsProvider } from '@/state/exams';
import { OnboardingProvider } from '@/state/onboarding';
import { RecordsProvider } from '@/state/records';
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
