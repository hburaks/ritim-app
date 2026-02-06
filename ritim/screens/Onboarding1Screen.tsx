import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Chip } from '@/components/Chip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing } from '@/lib/theme/tokens';
import { useOnboarding } from '@/state/onboarding';

const GRADE_OPTIONS = ['7', '8'] as const;

export function Onboarding1Screen() {
  const router = useRouter();
  const { completed, hydrated, grade, setGrade } = useOnboarding();
  const [selectedGrade, setSelectedGrade] = useState<(typeof GRADE_OPTIONS)[number] | null>(
    grade ?? null
  );

  const handleSelectGrade = (grade: (typeof GRADE_OPTIONS)[number]) => {
    setSelectedGrade(grade);
    setGrade(grade);
  };

  useEffect(() => {
    if (grade) {
      setSelectedGrade(grade);
    }
  }, [grade]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (completed) {
      router.replace('/');
    }
  }, [completed, hydrated, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>
            Bu uygulama odaklanma ritmi kazanmanı kolaylaştırmak için var.
          </Text>

          <View style={styles.section}>
            <Text style={styles.subtitle}>Kaçıncı sınıftasın? (7/8)</Text>
            <View style={styles.chipRow}>
              {GRADE_OPTIONS.map((grade) => (
                <Chip
                  key={grade}
                  label={grade}
                  selected={selectedGrade === grade}
                  onPress={() => handleSelectGrade(grade)}
                />
              ))}
            </View>
          </View>

          <Text style={styles.helper}>
            Günde sadece 1 kez girmen yeterli. 30 saniyeden kısa sürer.
          </Text>
        </View>

        <PrimaryButton
          label="Devam"
          disabled={!selectedGrade}
          onPress={() => router.push('/onboarding-2')}
        />
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
    justifyContent: 'space-between',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  content: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  subtitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  helper: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
});
