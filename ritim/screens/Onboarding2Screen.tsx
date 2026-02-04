import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/lib/theme/tokens';

export function Onboarding2Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Onboarding 2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
  },
});
