import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Chip } from '@/components/Chip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { colors, radius, spacing } from '@/lib/theme/tokens';
import { getSubjectsForActiveTrack } from '@/lib/track/selectors';
import type { TrackId } from '@/lib/track/tracks';
import type { DailyRecord } from '@/state/records';
import { useExams } from '@/state/exams';
import { useSettings } from '@/state/settings';
import type { ExamRecord, ExamType } from '@/types/exam';
import { calculateNet, sumSubjectScores } from '@/types/exam';
import { buildExamDisplayNames } from '@/lib/exams/examName';

const DURATION_OPTIONS = [30, 60, 90, 120, 180] as const;
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
  date?: string;
  onClose: () => void;
  onCloseComplete?: () => void;
  trackId?: TrackId | null;
  onSave: (values: DayEntryValues) => void;
  onDeletePress?: () => void;
  initialValues?: Partial<DayEntryValues>;
};

export function DayEntrySheet({
  visible,
  title,
  date,
  onClose,
  onCloseComplete,
  trackId,
  onSave,
  onDeletePress,
  initialValues,
}: DayEntrySheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const { settings } = useSettings();
  const effectiveTrack = trackId ?? settings.activeTrack;
  const scrollMaxHeight = Math.max(420, Math.floor(windowHeight * 0.82));
  const subjectDefs = useMemo(
    () => (effectiveTrack ? getSubjectsForActiveTrack(effectiveTrack) : []),
    [effectiveTrack]
  );

  const [duration, setDuration] = useState(45);
  const [didTopics, setDidTopics] = useState(true);
  const [didQuestions, setDidQuestions] = useState(false);
  const [questionCounts, setQuestionCounts] = useState<Record<string, string>>({});
  const [durationMessage, setDurationMessage] = useState<string | null>(null);
  const [questionMessage, setQuestionMessage] = useState<string | null>(null);

  const prevTrackRef = React.useRef(settings.activeTrack);
  useEffect(() => {
    if (prevTrackRef.current !== settings.activeTrack && visible) {
      onClose();
    }
    prevTrackRef.current = settings.activeTrack;
  }, [settings.activeTrack, visible, onClose]);

  useEffect(() => {
    if (visible && !effectiveTrack) {
      onClose();
    }
  }, [effectiveTrack, onClose, visible]);

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={[styles.scrollContainer, { maxHeight: scrollMaxHeight }]}
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
              {subjectDefs.map((s) => (
                <View key={s.key} style={styles.questionRow}>
                  <Text style={styles.questionLabel}>{s.label}</Text>
                  <View style={styles.questionStepper}>
                    <Pressable
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.stepperButton,
                        pressed ? styles.stepperButtonPressed : null,
                      ]}
                      onPress={() => adjustQuestionCount(s.key, -5)}
                    >
                      <Text style={styles.stepperButtonText}>-</Text>
                    </Pressable>
                    <TextInput
                      value={questionCounts[s.key] ?? ''}
                      onChangeText={(value) => handleCountChange(s.key, value)}
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
                      onPress={() => adjustQuestionCount(s.key, 5)}
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

        {effectiveTrack && date ? (
          <ExamsSection trackId={effectiveTrack} date={date} subjectDefs={subjectDefs} />
        ) : null}

        <PrimaryButton label="Kaydet" onPress={handleSave} />
      </ScrollView>
    </BottomSheet>
  );
}

// ─── Exams Section ───

type ExamsSectionProps = {
  trackId: TrackId;
  date: string;
  subjectDefs: { key: string; label: string }[];
};

function ExamsSection({ trackId, date, subjectDefs }: ExamsSectionProps) {
  const { getExamsForDate, addExam, updateExam, removeExam } = useExams();
  const exams = getExamsForDate(trackId, date);
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamRecord | null>(null);

  // Form state
  const [examType, setExamType] = useState<ExamType>('FULL');
  const [examSubjectKey, setExamSubjectKey] = useState<string>('');
  const [examDuration, setExamDuration] = useState('');
  const [examName, setExamName] = useState('');
  // BRANCH: single D/Y/B
  const [examCorrect, setExamCorrect] = useState('');
  const [examWrong, setExamWrong] = useState('');
  const [examBlank, setExamBlank] = useState('');
  // FULL: per-subject D/Y/B
  const [subjectScoreInputs, setSubjectScoreInputs] = useState<
    Record<string, { correct: string; wrong: string; blank: string }>
  >({});
  const [expandedFullSubjectKey, setExpandedFullSubjectKey] = useState<string>('');

  const totalExamDuration = useMemo(
    () => exams.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0),
    [exams],
  );

  const displayNames = useMemo(
    () => buildExamDisplayNames(exams, trackId),
    [exams, trackId],
  );

  // FULL: live totals from subject scores
  const fullTotals = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let blank = 0;
    for (const entry of Object.values(subjectScoreInputs)) {
      correct += Math.max(0, Number(entry.correct) || 0);
      wrong += Math.max(0, Number(entry.wrong) || 0);
      blank += Math.max(0, Number(entry.blank) || 0);
    }
    const net = calculateNet(trackId, correct, wrong);
    return { correct, wrong, blank, net };
  }, [subjectScoreInputs, trackId]);

  useEffect(() => {
    if (examType !== 'FULL') {
      return;
    }
    if (!subjectDefs.length) {
      setExpandedFullSubjectKey('');
      return;
    }
    const hasExpandedSubject = subjectDefs.some((s) => s.key === expandedFullSubjectKey);
    if (!hasExpandedSubject) {
      setExpandedFullSubjectKey(subjectDefs[0].key);
    }
  }, [examType, expandedFullSubjectKey, subjectDefs]);

  const resetForm = useCallback(() => {
    setExamType('FULL');
    setExamSubjectKey('');
    setExamDuration('');
    setExamName('');
    setExamCorrect('');
    setExamWrong('');
    setExamBlank('');
    setSubjectScoreInputs({});
    setExpandedFullSubjectKey(subjectDefs[0]?.key ?? '');
    setEditingExam(null);
    setShowForm(false);
  }, [subjectDefs]);

  const openAddForm = () => {
    resetForm();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowForm(true);
  };

  const openEditForm = (exam: ExamRecord) => {
    setEditingExam(exam);
    setExamType(exam.type);
    setExamSubjectKey(exam.subjectKey ?? '');
    setExamDuration(exam.durationMinutes ? String(exam.durationMinutes) : '');
    setExamName(exam.name ?? '');

    if (exam.type === 'FULL' && exam.subjectScores) {
      const inputs: Record<string, { correct: string; wrong: string; blank: string }> = {};
      for (const [key, val] of Object.entries(exam.subjectScores)) {
        inputs[key] = {
          correct: val.correct ? String(val.correct) : '',
          wrong: val.wrong ? String(val.wrong) : '',
          blank: val.blank ? String(val.blank) : '',
        };
      }
      setSubjectScoreInputs(inputs);
      const firstFilledSubjectKey = subjectDefs.find((s) => {
        const score = exam.subjectScores?.[s.key];
        return Boolean(score && (score.correct > 0 || score.wrong > 0 || score.blank > 0));
      })?.key;
      setExpandedFullSubjectKey(firstFilledSubjectKey ?? subjectDefs[0]?.key ?? '');
      setExamCorrect('');
      setExamWrong('');
      setExamBlank('');
    } else {
      setExamCorrect(exam.correctTotal ? String(exam.correctTotal) : '');
      setExamWrong(exam.wrongTotal ? String(exam.wrongTotal) : '');
      setExamBlank(exam.blankTotal ? String(exam.blankTotal) : '');
      setSubjectScoreInputs({});
      setExpandedFullSubjectKey(subjectDefs[0]?.key ?? '');
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowForm(true);
  };

  const handleSubjectScoreChange = (
    subjectKey: string,
    field: 'correct' | 'wrong' | 'blank',
    value: string,
  ) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    setSubjectScoreInputs((prev) => {
      const current = prev[subjectKey] ?? { correct: '', wrong: '', blank: '' };
      return {
        ...prev,
        [subjectKey]: {
          ...current,
          [field]: sanitized,
        },
      };
    });
  };

  const handleExamSave = () => {
    const dur = Number(examDuration) || undefined;
    const name = examName.trim() || undefined;

    if (examType === 'FULL') {
      // Build subjectScores
      const subjectScores: Record<string, { correct: number; wrong: number; blank: number }> = {};
      for (const s of subjectDefs) {
        const input = subjectScoreInputs[s.key];
        if (input) {
          subjectScores[s.key] = {
            correct: Math.max(0, Number(input.correct) || 0),
            wrong: Math.max(0, Number(input.wrong) || 0),
            blank: Math.max(0, Number(input.blank) || 0),
          };
        } else {
          subjectScores[s.key] = { correct: 0, wrong: 0, blank: 0 };
        }
      }
      const totals = sumSubjectScores(subjectScores);

      if (editingExam) {
        updateExam({
          ...editingExam,
          type: examType,
          subjectKey: undefined,
          name,
          subjectScores,
          correctTotal: totals.correctTotal,
          wrongTotal: totals.wrongTotal,
          blankTotal: totals.blankTotal,
          durationMinutes: dur,
        });
      } else {
        addExam({
          trackId,
          date,
          type: examType,
          name,
          subjectScores,
          correctTotal: totals.correctTotal,
          wrongTotal: totals.wrongTotal,
          blankTotal: totals.blankTotal,
          durationMinutes: dur,
        });
      }
    } else {
      // BRANCH
      const correctTotal = Math.max(0, Number(examCorrect) || 0);
      const wrongTotal = Math.max(0, Number(examWrong) || 0);
      const blankTotal = Math.max(0, Number(examBlank) || 0);

      if (editingExam) {
        updateExam({
          ...editingExam,
          type: examType,
          subjectKey: examSubjectKey || undefined,
          name,
          subjectScores: undefined,
          correctTotal,
          wrongTotal,
          blankTotal,
          durationMinutes: dur,
        });
      } else {
        addExam({
          trackId,
          date,
          type: examType,
          subjectKey: examSubjectKey || undefined,
          name,
          correctTotal,
          wrongTotal,
          blankTotal,
          durationMinutes: dur,
        });
      }
    }
    resetForm();
  };

  const handleExamDelete = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    removeExam(id);
  };

  return (
    <View style={styles.sheetSection}>
      <Text style={styles.sheetLabel}>DENEMELER</Text>

      {!showForm && exams.length > 0 ? (
        <View style={styles.examList}>
          {exams.map((exam) => {
            const net = calculateNet(trackId, exam.correctTotal, exam.wrongTotal);
            const displayName = displayNames.get(exam.id) ?? '';
            return (
              <View key={exam.id} style={styles.examRow}>
                <View style={styles.examRowInfo}>
                  <Text style={styles.examRowType}>{displayName}</Text>
                  <Text style={styles.examRowDetail}>
                    {exam.correctTotal}D {exam.wrongTotal}Y {exam.blankTotal}B
                    {' · '}
                    {net.toFixed(1)} net
                    {exam.durationMinutes ? ` · ${exam.durationMinutes} dk` : ''}
                  </Text>
                </View>
                <View style={styles.examRowActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => openEditForm(exam)}
                    style={({ pressed }) => [pressed ? { opacity: 0.6 } : null]}
                  >
                    <IconSymbol name="pencil" size={16} color={colors.textSecondary} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => handleExamDelete(exam.id)}
                    style={({ pressed }) => [pressed ? { opacity: 0.6 } : null]}
                  >
                    <IconSymbol name="trash" size={16} color={colors.textSecondary} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {!showForm && totalExamDuration > 0 ? (
        <View style={styles.examBadge}>
          <Text style={styles.examBadgeText}>
            Deneme süresi toplam süreye eklendi (+{totalExamDuration} dk)
          </Text>
        </View>
      ) : null}

      {showForm ? (
        <View style={styles.examForm}>
          {/* İsim input */}
          <TextInput
            value={examName}
            onChangeText={setExamName}
            placeholder="Deneme Adı (isteğe bağlı)"
            placeholderTextColor={colors.textMuted}
            style={styles.examNameInput}
          />

          <View style={styles.examFormRow}>
            <Chip
              label="Genel"
              selected={examType === 'FULL'}
              onPress={() => {
                setExamType('FULL');
                setExamCorrect('');
                setExamWrong('');
                setExamBlank('');
              }}
            />
            <Chip
              label="Branş"
              selected={examType === 'BRANCH'}
              onPress={() => {
                setExamType('BRANCH');
                setSubjectScoreInputs({});
              }}
            />
          </View>

          {examType === 'BRANCH' ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectScroll}>
                <View style={styles.subjectChipRow}>
                  {subjectDefs.map((s) => (
                    <Chip
                      key={s.key}
                      label={s.label}
                      selected={examSubjectKey === s.key}
                      onPress={() => setExamSubjectKey(s.key)}
                    />
                  ))}
                </View>
              </ScrollView>

              <View style={styles.examInputRow}>
                <View style={styles.examInputGroup}>
                  <Text style={styles.examInputLabel}>Doğru</Text>
                  <ExamStepper value={examCorrect} onChange={setExamCorrect} />
                </View>
                <View style={styles.examInputGroup}>
                  <Text style={styles.examInputLabel}>Yanlış</Text>
                  <ExamStepper value={examWrong} onChange={setExamWrong} />
                </View>
                <View style={styles.examInputGroup}>
                  <Text style={styles.examInputLabel}>Boş</Text>
                  <ExamStepper value={examBlank} onChange={setExamBlank} />
                </View>
              </View>
            </>
          ) : (
            <>
              {/* FULL: Canlı toplam */}
              <View style={styles.examTotalBanner}>
                <Text style={styles.examTotalText}>
                  Toplam: {fullTotals.correct}D {fullTotals.wrong}Y {fullTotals.blank}B – {fullTotals.net.toFixed(1)} net
                </Text>
              </View>

              {/* FULL: Tek açık ders (accordion) */}
              <View style={styles.subjectScoreList}>
                {subjectDefs.map((s) => (
                  <View
                    key={s.key}
                    style={[
                      styles.subjectScoreRow,
                      expandedFullSubjectKey === s.key ? styles.subjectScoreRowActive : null,
                    ]}
                  >
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setExpandedFullSubjectKey(s.key)}
                      style={({ pressed }) => [
                        styles.subjectScoreHeader,
                        pressed ? { opacity: 0.75 } : null,
                      ]}
                    >
                      <View style={styles.subjectScoreHeaderInfo}>
                        <Text style={styles.subjectScoreLabel}>{s.label}</Text>
                        <Text style={styles.subjectScoreSummary}>
                          {Number(subjectScoreInputs[s.key]?.correct ?? 0)}D
                          {' · '}
                          {Number(subjectScoreInputs[s.key]?.wrong ?? 0)}Y
                          {' · '}
                          {Number(subjectScoreInputs[s.key]?.blank ?? 0)}B
                        </Text>
                      </View>
                      <Text style={styles.subjectScoreHeaderAction}>
                        {expandedFullSubjectKey === s.key ? 'Açık' : 'Düzenle'}
                      </Text>
                    </Pressable>

                    {expandedFullSubjectKey === s.key ? (
                      <View style={styles.subjectScoreInputs}>
                        <View style={styles.subjectScoreField}>
                          <Text style={styles.subjectScoreFieldLabel}>Doğru</Text>
                          <ExamStepper
                            value={subjectScoreInputs[s.key]?.correct ?? ''}
                            onChange={(v) => handleSubjectScoreChange(s.key, 'correct', v)}
                          />
                        </View>
                        <View style={styles.subjectScoreField}>
                          <Text style={styles.subjectScoreFieldLabel}>Yanlış</Text>
                          <ExamStepper
                            value={subjectScoreInputs[s.key]?.wrong ?? ''}
                            onChange={(v) => handleSubjectScoreChange(s.key, 'wrong', v)}
                          />
                        </View>
                        <View style={styles.subjectScoreField}>
                          <Text style={styles.subjectScoreFieldLabel}>Boş</Text>
                          <ExamStepper
                            value={subjectScoreInputs[s.key]?.blank ?? ''}
                            onChange={(v) => handleSubjectScoreChange(s.key, 'blank', v)}
                          />
                        </View>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={styles.examInputRow}>
            <View style={styles.examInputGroup}>
              <Text style={styles.examInputLabel}>Süre (dk)</Text>
              <TextInput
                value={examDuration}
                onChangeText={(v) => setExamDuration(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="—"
                placeholderTextColor={colors.textMuted}
                style={styles.examInput}
              />
            </View>
          </View>

          <View style={styles.examFormActions}>
            <Pressable
              accessibilityRole="button"
              onPress={resetForm}
              style={({ pressed }) => [
                styles.examCancelBtn,
                pressed ? { opacity: 0.7 } : null,
              ]}
            >
              <Text style={styles.examCancelText}>Vazgeç</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handleExamSave}
              style={({ pressed }) => [
                styles.examSaveBtn,
                pressed ? { opacity: 0.7 } : null,
              ]}
            >
              <Text style={styles.examSaveText}>
                {editingExam ? 'Güncelle' : 'Ekle'}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={openAddForm}
          style={({ pressed }) => [
            styles.addExamButton,
            pressed ? { opacity: 0.7 } : null,
          ]}
        >
          <IconSymbol name="plus" size={16} color={colors.accentDeep} />
          <Text style={styles.addExamText}>Deneme Ekle</Text>
        </Pressable>
      )}
    </View>
  );
}

function ExamStepper({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const adjust = (delta: number) => {
    const current = Number(value) || 0;
    const next = Math.max(0, current + delta);
    onChange(next === 0 ? '' : String(next));
  };

  return (
    <View style={styles.questionStepper}>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.stepperButton, pressed ? styles.stepperButtonPressed : null]}
        onPress={() => adjust(-1)}
      >
        <Text style={styles.stepperButtonText}>-</Text>
      </Pressable>
      <TextInput
        value={value}
        onChangeText={(v) => onChange(v.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        placeholder="—"
        placeholderTextColor={colors.textMuted}
        style={styles.examStepperInput}
      />
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.stepperButton, pressed ? styles.stepperButtonPressed : null]}
        onPress={() => adjust(1)}
      >
        <Text style={styles.stepperButtonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {},
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
  // Exam styles
  examList: {
    gap: spacing.sm,
  },
  examRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.capsule,
  },
  examRowInfo: {
    flex: 1,
    gap: 2,
  },
  examRowType: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  examRowDetail: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  examRowActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  examBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  examBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accentDeep,
  },
  addExamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentDeep,
    borderStyle: 'dashed',
  },
  addExamText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accentDeep,
  },
  examForm: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.capsule,
  },
  examFormRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  subjectScroll: {
    marginVertical: spacing.xs,
  },
  subjectChipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  examInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  examInputGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  examInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  examInput: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    textAlign: 'center',
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  examStepperInput: {
    minWidth: 44,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    fontSize: 14,
  },
  examFormActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  examCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  examCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  examSaveBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentDeep,
  },
  examSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.surface,
  },
  examNameInput: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    fontSize: 14,
  },
  examTotalBanner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  examTotalText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentDeep,
    textAlign: 'center',
  },
  subjectScoreList: {
    gap: spacing.sm,
  },
  subjectScoreRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  subjectScoreRowActive: {
    borderColor: colors.accentDeep,
    backgroundColor: colors.accentSoft,
  },
  subjectScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  subjectScoreHeaderInfo: {
    flex: 1,
    gap: 2,
  },
  subjectScoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subjectScoreSummary: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  subjectScoreHeaderAction: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentDeep,
  },
  subjectScoreInputs: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  subjectScoreField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  subjectScoreFieldLabel: {
    minWidth: 54,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
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
