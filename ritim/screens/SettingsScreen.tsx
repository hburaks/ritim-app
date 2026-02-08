import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { colors, spacing } from '@/lib/theme/tokens';

export function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed ? styles.backPressed : null]}
          >
            <IconSymbol name="chevron.right" size={18} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.title}>Ayarlar</Text>
        </View>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Bu ekran yakında doldurulacak.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.neutral200,
    transform: [{ rotate: '180deg' }],
  },
  backPressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  placeholder: {
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.neutral600,
  },
  placeholderText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
