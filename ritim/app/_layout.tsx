import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack initialRouteName="onboarding-1" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding-1" />
      <Stack.Screen name="onboarding-2" />
      <Stack.Screen name="index" />
      <Stack.Screen name="playground" />
    </Stack>
  );
}
