import React, { useEffect } from 'react';
import { Stack } from 'expo-router';

import { OnboardingProvider, useOnboarding } from '@/state/onboarding';
import { RecordsProvider } from '@/state/records';
import { TopicsProvider } from '@/state/topics';
import { requestPermissionsIfNeeded } from '@/lib/notifications/ritimNotifications';

export default function RootLayout() {
  useEffect(() => {
    requestPermissionsIfNeeded();
  }, []);

  return (
    <OnboardingProvider>
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
          </Stack>
        </TopicsProviderBridge>
      </RecordsProvider>
    </OnboardingProvider>
  );
}

function TopicsProviderBridge({ children }: { children: React.ReactNode }) {
  const { grade } = useOnboarding();
  return <TopicsProvider grade={grade ?? '8'}>{children}</TopicsProvider>;
}
