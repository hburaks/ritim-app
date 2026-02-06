import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { DotRow } from '@/components/DotRow';
import { TextLink } from '@/components/TextLink';
import { colors, spacing } from '@/lib/theme/tokens';
import { getWeekDates, useRecords } from '@/state/records';

const WEEK_OFFSETS = [0, 1, 2, 3] as const;

export function DaysScreen() {
  const router = useRouter();
  const { getWeekDots, getRecordByDate } = useRecords();

  const weeks = useMemo(() => {
    return WEEK_OFFSETS.map((offset) => {
      const reference = new Date();
      reference.setDate(reference.getDate() - offset * 7);
      const dates = getWeekDates(reference);
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];
      const dots = getWeekDots(startDate);
      const { totalMinutes, totalQuestions, hasAny } = dates.reduce(
        (acc, date) => {
          const record = getRecordByDate(date);
          if (!record) {
            return acc;
          }
          const questionTotal = getQuestionTotal(record);
          return {
            totalMinutes: acc.totalMinutes + record.focusMinutes,
            totalQuestions: acc.totalQuestions + questionTotal,
            hasAny: true,
          };
        },
        { totalMinutes: 0, totalQuestions: 0, hasAny: false }
      );

      return {
        offset,
        startDate,
        endDate,
        dots,
        totalMinutes,
        totalQuestions,
        hasAny,
      };
    });
  }, [getRecordByDate, getWeekDots]);

  const navigateToWeek = (weekStart: string) => {
    router.push({ pathname: '/week/[weekStart]', params: { weekStart } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Günler</Text>
          <TextLink
            label="← Geri"
            onPress={() => router.back()}
            textStyle={styles.backLink}
          />
        </View>

        <View style={styles.weeksList}>
          {weeks.map((week, index) => {
            const label = index === 0 ? 'Bu hafta' : `-${week.offset} hafta`;
            const summary = week.hasAny
              ? `${week.totalMinutes} dk · ${week.totalQuestions} soru`
              : '—';

            return (
              <Pressable
                key={week.startDate}
                accessibilityRole="button"
                onPress={() => navigateToWeek(week.startDate)}
                style={({ pressed }) => [
                  styles.weekBlock,
                  pressed ? styles.weekBlockPressed : null,
                ]}
              >
                <Text style={styles.weekLabel}>{label}</Text>
                <DotRow activeIndex={-1} filled={week.dots} />
                <Text style={styles.weekSummary}>{summary}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

function getQuestionTotal(record: { questionCount?: number; subjectBreakdown?: Record<string, number> }) {
  if (record.questionCount !== undefined) {
    return record.questionCount;
  }
  if (!record.subjectBreakdown) {
    return 0;
  }
  return Object.values(record.subjectBreakdown).reduce((sum, value) => sum + value, 0);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backLink: {
    color: colors.accentDark,
    fontSize: 14,
    fontWeight: '600',
  },
  weeksList: {
    gap: spacing.lg,
  },
  weekBlock: {
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.neutral300,
    gap: spacing.sm,
  },
  weekBlockPressed: {
    opacity: 0.75,
  },
  weekLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  weekSummary: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
});
