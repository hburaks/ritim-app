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
const MAX_DURATION = 600;
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
  const [didTopics, setDidTopics] = useState(true);
  const [didQuestions, setDidQuestions] = useState(false);
  const [questionCounts, setQuestionCounts] = useState<Record<string, string>>({});
  const [durationMessage, setDurationMessage] = useState<string | null>(null);
  const [questionMessage, setQuestionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const initialDuration = clampDuration(initialValues?.focusMinutes ?? 45);
    setDuration(initialDuration);
    setDurationMessage(null);
    const initialActivity = initialValues?.activityType;
    const nextDidTopics = initialActivity === 'SORU' ? false : true;
    const nextDidQuestions = Boolean(
      initialActivity === 'SORU' ||
        initialActivity === 'KARISIK' ||
        initialValues?.questionCount ||
        (initialValues?.subjectBreakdown &&
          Object.keys(initialValues.subjectBreakdown).length > 0)
    );
    setDidTopics(nextDidTopics);
    setDidQuestions(nextDidQuestions);

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
    setQuestionMessage(null);
  }, [visible, initialValues]);

  const showQuestionCounts = didQuestions;
  const durationLabel = useMemo(() => `${duration} dk`, [duration]);

  const adjustDuration = (delta: number) => {
    setDuration((current) => {
      const raw = current + delta;
      const next = clampDuration(raw);
      if (raw < MIN_DURATION) {
        setDurationMessage(`0'dan küçük olamaz`);
      } else if (raw > MAX_DURATION) {
        setDurationMessage('Lütfen geçerli bir değer gir.');
      } else {
        setDurationMessage(null);
      }
      return next;
    });
  };

  const handleCountChange = (subject: string, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    if (sanitized !== value) {
      setQuestionMessage('Lütfen geçerli bir değer gir.');
    } else {
      setQuestionMessage(null);
    }
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
    setQuestionMessage(null);
  };

  const handleSave = () => {
    const safeDuration = clampDuration(duration);
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
    const nextActivityType = didQuestions && didTopics ? 'KARISIK' : didQuestions ? 'SORU' : 'KONU';

    onSave({
      focusMinutes: safeDuration,
      activityType: nextActivityType,
      questionCount: showQuestionCounts ? total : undefined,
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
        <Text style={styles.sheetLabel}>SÜRE</Text>
        <View style={styles.durationInlineRow}>
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
          <Text style={styles.durationDisplay}>{durationLabel}</Text>
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
        {durationMessage ? (
          <Text style={styles.validationText}>{durationMessage}</Text>
        ) : null}
        <View style={styles.durationPresetRow}>
          {DURATION_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={`${option} dk`}
              selected={duration === option}
              onPress={() => {
                setDuration(clampDuration(option));
                setDurationMessage(null);
              }}
            />
          ))}
        </View>
      </View>

      <View style={styles.sheetSection}>
        <Text style={styles.sheetLabel}>BUGÜN NE YAPTIN?</Text>
        <View style={styles.activityToggleList}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: didTopics }}
            onPress={() => {
              setDidTopics((current) => !current);
            }}
            style={({ pressed }) => [
              styles.activityToggle,
              didTopics ? styles.activityToggleActive : null,
              pressed ? styles.activityTogglePressed : null,
            ]}
          >
            <View
              style={[
                styles.activityCheckbox,
                didTopics ? styles.activityCheckboxActive : null,
              ]}
            />
            <Text
              style={[
                styles.activityToggleText,
                didTopics ? styles.activityToggleTextActive : null,
              ]}
            >
              Konu çalıştım
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: didQuestions }}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setDidQuestions((current) => {
                const next = !current;
                if (!next) {
                  setQuestionCounts({});
                  setQuestionMessage(null);
                }
                return next;
              });
            }}
            style={({ pressed }) => [
              styles.activityToggle,
              didQuestions ? styles.activityToggleActive : null,
              pressed ? styles.activityTogglePressed : null,
            ]}
          >
            <View
              style={[
                styles.activityCheckbox,
                didQuestions ? styles.activityCheckboxActive : null,
              ]}
            />
            <Text
              style={[
                styles.activityToggleText,
                didQuestions ? styles.activityToggleTextActive : null,
              ]}
            >
              Soru çözdüm
            </Text>
          </Pressable>
        </View>
      </View>

      {showQuestionCounts ? (
        <View style={styles.sheetSection}>
          <Text style={styles.sheetLabel}>SORU SAYISI</Text>
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
          {questionMessage ? (
            <Text style={styles.validationText}>{questionMessage}</Text>
          ) : null}
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
  durationInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  durationDisplay: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  durationPresetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  durationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationButtonPressed: {
    opacity: 0.75,
  },
  durationButtonText: {
    fontSize: 20,
    fontWeight: '700',
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
  activityToggleList: {
    gap: spacing.sm,
  },
  activityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  activityToggleActive: {
    borderColor: colors.accentDeep,
    backgroundColor: colors.accentSoft,
  },
  activityTogglePressed: {
    opacity: 0.85,
  },
  activityCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  activityCheckboxActive: {
    borderColor: colors.accentDeep,
    backgroundColor: colors.accentDeep,
  },
  activityToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  activityToggleTextActive: {
    color: colors.textPrimary,
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
  validationText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});

function clampDuration(value: number) {
  if (!Number.isFinite(value)) {
    return MIN_DURATION;
  }
  if (value < MIN_DURATION) {
    return MIN_DURATION;
  }
  if (value > MAX_DURATION) {
    return MAX_DURATION;
  }
  return value;
}
