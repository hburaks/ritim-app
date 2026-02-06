import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { DayEntrySheet } from '@/components/DayEntrySheet';
import { DotRow } from '@/components/DotRow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextLink } from '@/components/TextLink';
import { colors, spacing } from '@/lib/theme/tokens';
import { useOnboarding } from '@/state/onboarding';
import { ActivityType, getTodayDateString, useRecords } from '@/state/records';

export function HomeScreen() {
  const router = useRouter();
  const { completed, hydrated } = useOnboarding();
  const { getRecordByDate, upsertRecord, getWeekDots } = useRecords();
  const [sheetVisible, setSheetVisible] = useState(false);

  const today = getTodayDateString();
  const todayRecord = getRecordByDate(today);
  const weekDots = useMemo(() => getWeekDots(), [getWeekDots]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (!completed) {
      router.replace('/onboarding-1');
    }
  }, [completed, hydrated, router]);

  const activityLabel = (type: ActivityType) => {
    switch (type) {
      case 'KONU':
        return 'Konu';
      case 'SORU':
        return 'Soru';
      case 'KARISIK':
      default:
        return 'Karışık';
    }
  };

  const summaryText = useMemo(() => {
    if (!todayRecord) {
      return '';
    }
    const parts = [
      `${todayRecord.focusMinutes} dk`,
      activityLabel(todayRecord.activityType),
    ];
    if (todayRecord.questionCount !== undefined) {
      parts.push(String(todayRecord.questionCount));
    }
    return `Bugün: ${parts.join(' · ')}`;
  }, [todayRecord]);

  const handleSave = (values: {
    focusMinutes: number;
    activityType: ActivityType;
    questionCount?: number;
    subjectBreakdown?: Record<string, number>;
  }) => {
    upsertRecord({
      date: today,
      ...values,
    });
    setSheetVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Bu hafta</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/days')}>
              <Text style={styles.daysLink}>Gunler →</Text>
            </Pressable>
          </View>
          <DotRow activeIndex={-1} filled={weekDots} />
          <TextLink
            label="Konular →"
            onPress={() => router.push('/topics')}
            textStyle={styles.topicsLink}
          />
        </View>

        <View style={styles.content}>
          {!todayRecord ? (
            <PrimaryButton label="Bugün odaklandım" onPress={() => setSheetVisible(true)} />
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setSheetVisible(true)}
              style={({ pressed }) => [
                styles.todayRow,
                pressed ? styles.todayRowPressed : null,
              ]}
            >
              <View style={styles.todayRowTextWrap}>
                <Text style={styles.todayText}>{summaryText}</Text>
                <Text style={styles.editText}>Düzenle →</Text>
              </View>
            </Pressable>
          )}
        </View>
      </View>

      <DayEntrySheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title={todayRecord ? 'Bugün' : 'Yeni kayıt'}
        onSave={handleSave}
        initialValues={todayRecord}
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
  header: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  daysLink: {
    color: colors.accentDark,
    fontSize: 14,
    fontWeight: '600',
  },
  topicsLink: {
    color: colors.accentDark,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    gap: spacing.lg,
  },
  todayRow: {
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.neutral300,
  },
  todayRowPressed: {
    opacity: 0.75,
  },
  todayRowTextWrap: {
    gap: spacing.sm,
  },
  todayText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  editText: {
    color: colors.accentDark,
    fontSize: 14,
    fontWeight: '500',
  },
});
