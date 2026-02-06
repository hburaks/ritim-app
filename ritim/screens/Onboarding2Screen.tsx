import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { DayEntrySheet } from '@/components/DayEntrySheet';
import { DotRow } from '@/components/DotRow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing } from '@/lib/theme/tokens';
import { requestPermissionsIfNeeded, rescheduleAllBasedOnRecords } from '@/lib/notifications/ritimNotifications';
import { useOnboarding } from '@/state/onboarding';
import { DailyRecord, getTodayDateString, useRecords } from '@/state/records';

export function Onboarding2Screen() {
  const router = useRouter();
  const { completed, hydrated, setCompleted } = useOnboarding();
  const { records, upsertRecord } = useRecords();
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
    const today = getTodayDateString();
    const record: DailyRecord = {
      date: today,
      ...values,
    };
    upsertRecord(record);
    setCompleted(true);
    setSheetVisible(false);
    void requestPermissionsIfNeeded().then((granted) => {
      if (!granted) {
        return;
      }
      const nextRecords = upsertRecordIntoList(records, record);
      rescheduleAllBasedOnRecords(nextRecords);
    });
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.dotHeader}>
            <Text style={styles.dotTitle}>Bu hafta</Text>
            <DotRow activeIndex={-1} />
          </View>

          <Text style={styles.description}>
            Her odaklandığında bir gün dolacak.
          </Text>
        </View>

        <PrimaryButton
          label="İlk günü dolduralım"
          onPress={() => setSheetVisible(true)}
        />
      </View>

      <DayEntrySheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title="İlk gün"
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

function upsertRecordIntoList(records: DailyRecord[], record: DailyRecord) {
  const index = records.findIndex((item) => item.date === record.date);
  if (index === -1) {
    return [record, ...records];
  }
  const next = [...records];
  next[index] = record;
  return next;
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
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
});
