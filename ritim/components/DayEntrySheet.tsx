import React, { useMemo, useState, useEffect } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Chip } from '@/components/Chip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing } from '@/lib/theme/tokens';
import type { ActivityType, DailyRecord } from '@/state/records';

const DURATION_OPTIONS = [20, 30, 60, 90, 120, 180] as const;
const TYPE_OPTIONS: { label: string; value: ActivityType }[] = [
  { label: 'Konu', value: 'KONU' },
  { label: 'Soru', value: 'SORU' },
  { label: 'Karışık', value: 'KARISIK' },
];
const SUBJECT_OPTIONS = ['Matematik', 'Türkçe', 'Fen', 'İnkılap', 'İngilizce'] as const;
const MIN_DURATION = 5;
const MAX_DURATION = 180;
const DURATION_STEP = 5;

type DayEntryValues = Pick<
  DailyRecord,
  'focusMinutes' | 'activityType' | 'questionCount' | 'subjectBreakdown'
>;

type DayEntrySheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: (values: DayEntryValues) => void;
  initialValues?: Partial<DayEntryValues>;
};

export function DayEntrySheet({
  visible,
  title,
  onClose,
  onSave,
  initialValues,
}: DayEntrySheetProps) {
  const [duration, setDuration] = useState(45);
  const [entryType, setEntryType] = useState<ActivityType>('KONU');
  const [questionCounts, setQuestionCounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDuration(initialValues?.focusMinutes ?? 45);
    setEntryType(initialValues?.activityType ?? 'KONU');

    const initialBreakdown = initialValues?.subjectBreakdown ?? {};
    const nextCounts = Object.entries(initialBreakdown).reduce<Record<string, string>>(
      (acc, [subject, value]) => {
        if (value > 0) {
          acc[subject] = String(value);
        }
        return acc;
      },
      {}
    );
    setQuestionCounts(nextCounts);
  }, [visible, initialValues]);

  const showQuestionCounts = entryType !== 'KONU';
  const durationLabel = useMemo(() => `${duration} dk`, [duration]);

  const adjustDuration = (delta: number) => {
    setDuration((current) => {
      const next = Math.min(MAX_DURATION, Math.max(MIN_DURATION, current + delta));
      return next;
    });
  };

  const handleCountChange = (subject: string, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    setQuestionCounts((current) => ({
      ...current,
      [subject]: sanitized,
    }));
  };

  const adjustQuestionCount = (subject: string, delta: number) => {
    setQuestionCounts((current) => {
      const currentValue = Number(current[subject] ?? 0);
      const nextValue = Math.max(0, currentValue + delta);
      return {
        ...current,
        [subject]: nextValue === 0 ? '' : String(nextValue),
      };
    });
  };

  const handleSave = () => {
    const breakdown = Object.entries(questionCounts).reduce<Record<string, number>>(
      (acc, [subject, value]) => {
        const count = Number(value);
        if (Number.isFinite(count) && count > 0) {
          acc[subject] = count;
        }
        return acc;
      },
      {}
    );
    const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

    onSave({
      focusMinutes: duration,
      activityType: entryType,
      questionCount: showQuestionCounts && total > 0 ? total : undefined,
      subjectBreakdown: showQuestionCounts && Object.keys(breakdown).length ? breakdown : undefined,
    });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.sheetSection}>
        <Text style={styles.sheetLabel}>Süre</Text>
        <View style={styles.durationRow}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.durationButton,
              pressed ? styles.durationButtonPressed : null,
            ]}
            onPress={() => adjustDuration(-DURATION_STEP)}
          >
            <Text style={styles.durationButtonText}>-</Text>
          </Pressable>
          <Text style={styles.durationValue}>{durationLabel}</Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.durationButton,
              pressed ? styles.durationButtonPressed : null,
            ]}
            onPress={() => adjustDuration(DURATION_STEP)}
          >
            <Text style={styles.durationButtonText}>+</Text>
          </Pressable>
        </View>
        <View style={styles.chipRow}>
          {DURATION_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={`${option} dk`}
              selected={duration === option}
              onPress={() => setDuration(option)}
            />
          ))}
        </View>
      </View>

      <View style={styles.sheetSection}>
        <Text style={styles.sheetLabel}>Tür</Text>
        <View style={styles.chipRow}>
          {TYPE_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={entryType === option.value}
              onPress={() => setEntryType(option.value)}
            />
          ))}
        </View>
      </View>

      {showQuestionCounts ? (
        <View style={styles.sheetSection}>
          <Text style={styles.sheetLabel}>Derslere soru sayısı (opsiyonel)</Text>
          <View style={styles.questionList}>
            {SUBJECT_OPTIONS.map((subject) => (
              <View key={subject} style={styles.questionRow}>
                <Text style={styles.questionLabel}>{subject}</Text>
                <View style={styles.questionStepper}>
                  <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.stepperButton,
                      pressed ? styles.stepperButtonPressed : null,
                    ]}
                    onPress={() => adjustQuestionCount(subject, -5)}
                  >
                    <Text style={styles.stepperButtonText}>-</Text>
                  </Pressable>
                  <TextInput
                    value={questionCounts[subject] ?? ''}
                    onChangeText={(value) => handleCountChange(subject, value)}
                    keyboardType="number-pad"
                    placeholder="—"
                    placeholderTextColor={colors.textMuted}
                    style={styles.questionInput}
                  />
                  <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.stepperButton,
                      pressed ? styles.stepperButtonPressed : null,
                    ]}
                    onPress={() => adjustQuestionCount(subject, 5)}
                  >
                    <Text style={styles.stepperButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <PrimaryButton label="Kaydet" onPress={handleSave} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetSection: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sheetLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  durationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationButtonPressed: {
    opacity: 0.75,
  },
  durationButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  durationValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  questionList: {
    gap: spacing.sm,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  questionStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  questionLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonPressed: {
    opacity: 0.75,
  },
  stepperButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  questionInput: {
    minWidth: 64,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral300,
    paddingHorizontal: spacing.md,
    textAlign: 'center',
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
});
