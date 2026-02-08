import React from 'react';
import { Stack } from 'expo-router';

import { OnboardingProvider, useOnboarding } from '@/state/onboarding';
import { RecordsProvider } from '@/state/records';
import { SettingsProvider } from '@/state/settings';
import { TopicsProvider } from '@/state/topics';
export default function RootLayout() {
  return (
    <OnboardingProvider>
      <SettingsProvider>
        <RecordsProvider>
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
            </Stack>
          </TopicsProviderBridge>
        </RecordsProvider>
      </SettingsProvider>
    </OnboardingProvider>
  );
}

function TopicsProviderBridge({ children }: { children: React.ReactNode }) {
  const { grade } = useOnboarding();
  return <TopicsProvider grade={grade ?? '8'}>{children}</TopicsProvider>;
}
