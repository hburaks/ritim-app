import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { DayEntrySheet } from '@/components/DayEntrySheet';
import { DotRow } from '@/components/DotRow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, radius, spacing } from '@/lib/theme/tokens';
import { useOnboarding } from '@/state/onboarding';
import { DailyRecord, getTodayDateString, useRecords } from '@/state/records';
import { useSettings } from '@/state/settings';

export function Onboarding2Screen() {
  const router = useRouter();
  const { completed, hydrated, setCompleted } = useOnboarding();
  const { settings } = useSettings();
  const { upsertRecord } = useRecords();
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (completed) {
      router.replace('/');
    }
  }, [completed, hydrated, router]);

  const handleSave = (values: {
    focusMinutes: number;
    activityType: 'KONU' | 'SORU' | 'KARISIK';
    questionCount?: number;
    subjectBreakdown?: Record<string, number>;
  }) => {
    if (!settings.activeTrack) {
      return;
    }
    const today = getTodayDateString();
    const record: DailyRecord = {
      date: today,
      trackId: settings.activeTrack,
      ...values,
    };
    upsertRecord(record);
    setCompleted(true);
    setSheetVisible(false);
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.dotHeader}>
            <Text style={styles.dotTitle}>Bu hafta</Text>
            <View style={styles.dotCapsule}>
              <DotRow activeIndex={-1} />
            </View>
          </View>

          <Text style={styles.description}>
            Her odaklandığında bir gün dolacak.
          </Text>
        </View>

        <PrimaryButton
          label="İlk günü dolduralım"
          disabled={!settings.activeTrack}
          onPress={() => setSheetVisible(true)}
        />
      </View>

      <DayEntrySheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title="İlk gün"
        trackId={settings.activeTrack}
        onSave={handleSave}
      />
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
  content: {
    gap: spacing.lg,
  },
  dotHeader: {
    gap: spacing.md,
  },
  dotTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  dotCapsule: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.capsule,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
