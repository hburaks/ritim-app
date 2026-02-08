import React, { useMemo, useState, useEffect } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Chip } from '@/components/Chip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { colors, spacing } from '@/lib/theme/tokens';
import type { DailyRecord } from '@/state/records';

const DURATION_OPTIONS = [30, 60, 90, 120, 180] as const;
const SUBJECT_OPTIONS = ['Matematik', 'Türkçe', 'Fen', 'İnkılap', 'İngilizce', 'Din'] as const;
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
  onCloseComplete?: () => void;
  onSave: (values: DayEntryValues) => void;
  onDeletePress?: () => void;
  initialValues?: Partial<DayEntryValues>;
};

export function DayEntrySheet({
  visible,
  title,
  onClose,
  onCloseComplete,
  onSave,
  onDeletePress,
  initialValues,
}: DayEntrySheetProps) {
  const [duration, setDuration] = useState(45);
  const [hasQuestions, setHasQuestions] = useState(false);
  const [questionCounts, setQuestionCounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDuration(initialValues?.focusMinutes ?? 45);
    const initialHasQuestions = Boolean(
      (initialValues?.activityType && initialValues.activityType !== 'KONU') ||
        initialValues?.questionCount ||
        (initialValues?.subjectBreakdown &&
          Object.keys(initialValues.subjectBreakdown).length > 0)
    );
    setHasQuestions(initialHasQuestions);

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

  const showQuestionCounts = hasQuestions;
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
    const nextActivityType = hasQuestions
      ? initialValues?.activityType === 'KARISIK'
        ? 'KARISIK'
        : 'SORU'
      : 'KONU';

    onSave({
      focusMinutes: duration,
      activityType: nextActivityType,
      questionCount: showQuestionCounts && total > 0 ? total : undefined,
      subjectBreakdown: showQuestionCounts && Object.keys(breakdown).length ? breakdown : undefined,
    });
  };

  const headerRight = onDeletePress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Kaydı sil"
      onPress={onDeletePress}
      style={({ pressed }) => [
        styles.deleteButton,
        pressed ? styles.deleteButtonPressed : null,
      ]}
    >
      <IconSymbol name="trash" size={18} color={colors.textSecondary} />
    </Pressable>
  ) : null;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      onCloseComplete={onCloseComplete}
      title={title}
      headerRight={headerRight}
    >
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
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: hasQuestions }}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setHasQuestions((current) => !current);
          }}
          style={({ pressed }) => [
            styles.questionToggle,
            hasQuestions ? styles.questionToggleActive : null,
            pressed ? styles.questionTogglePressed : null,
          ]}
        >
          <Text
            style={[
              styles.questionToggleText,
              hasQuestions ? styles.questionToggleTextActive : null,
            ]}
          >
            Soru çözdüm
          </Text>
        </Pressable>
      </View>

      {showQuestionCounts ? (
        <View style={styles.sheetSection}>
          <Text style={styles.sheetLabel}>Soru Sayısı (opsiyonel)</Text>
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
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
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
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    textAlign: 'center',
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  questionToggle: {
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  questionToggleActive: {
    backgroundColor: colors.accentDeep,
    borderColor: colors.accentDeep,
  },
  questionToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  questionToggleTextActive: {
    color: colors.surface,
  },
  questionTogglePressed: {
    opacity: 0.85,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral200,
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
});
