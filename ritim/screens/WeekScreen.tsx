import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DayEntrySheet } from '@/components/DayEntrySheet';
import { DotRow } from '@/components/DotRow';
import { IconButton } from '@/components/IconButton';
import { SurfaceCard } from '@/components/SurfaceCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { colors, radius, spacing } from '@/lib/theme/tokens';
import { useExams } from '@/state/exams';
import { ActivityType, DailyRecord, getWeekDates, useRecords } from '@/state/records';
import { useSettings } from '@/state/settings';
import type { TrackId } from '@/lib/track/tracks';

const DAY_LONG_LABELS = [
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
  'Pazar',
] as const;

const MONTH_NAMES = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];

export function WeekScreen() {
  const router = useRouter();
  const { weekStart } = useLocalSearchParams<{ weekStart?: string }>();
  const { settings } = useSettings();
  const { getWeekDots, getRecord, upsertRecord, removeRecord, todayKey } = useRecords();
  const { getExamDurationForDate, getExamsForDate } = useExams();
  const [editVisible, setEditVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const pendingDeleteRef = useRef<{ trackId: TrackId; date: string } | null>(null);
  const openConfirmAfterCloseRef = useRef(false);
  const activeTrack = settings.activeTrack;

  const weekStartDate = useMemo(() => {
    if (typeof weekStart !== 'string') {
      return undefined;
    }
    return isValidDateKey(weekStart) ? weekStart : undefined;
  }, [weekStart]);
  const weekDates = useMemo(() => {
    const reference = weekStartDate ? parseDateString(weekStartDate) : new Date();
    return getWeekDates(reference);
  }, [weekStartDate]);
  const weekDots = useMemo(
    () => (activeTrack ? getWeekDots(activeTrack, weekStartDate) : Array(7).fill(false)),
    [activeTrack, getWeekDots, weekStartDate]
  );

  const weekLabel = useMemo(() => {
    const start = parseDateString(weekDates[0]);
    const end = parseDateString(weekDates[weekDates.length - 1]);
    const startStr = `${start.getDate()} ${MONTH_NAMES[start.getMonth()]}`;
    const endStr = `${end.getDate()} ${MONTH_NAMES[end.getMonth()]}`;
    return `${startStr} – ${endStr}`;
  }, [weekDates]);

  const rows = useMemo(() => {
    return weekDates.map((date, index) => {
      const record = activeTrack ? getRecord(activeTrack, date) : undefined;
      return {
        date,
        longLabel: DAY_LONG_LABELS[index] ?? '',
        dayNumber: parseDateString(date).getDate(),
        record,
      };
    });
  }, [activeTrack, getRecord, weekDates]);
  const highlightedDayIndex = useMemo(() => {
    const index = weekDates.indexOf(todayKey);
    return index >= 0 ? index : -1;
  }, [todayKey, weekDates]);

  const stats = useMemo(() => {
    let totalMinutes = 0;
    let totalQuestions = 0;
    let filledCount = 0;
    for (const row of rows) {
      if (row.record) {
        filledCount++;
        totalMinutes += row.record.focusMinutes;
        totalQuestions += getQuestionTotal(row.record);
      }
      if (activeTrack) {
        totalMinutes += getExamDurationForDate(activeTrack, row.date);
      }
    }
    return { totalMinutes, totalQuestions, filledCount };
  }, [rows, activeTrack, getExamDurationForDate]);

  const selectedRecord = selectedDate && activeTrack ? getRecord(activeTrack, selectedDate) : undefined;

  const handleRowPress = (date: string) => {
    if (!activeTrack) {
      return;
    }
    setSelectedDate(date);
    setEditVisible(true);
  };

  const handleSave = (values: {
    focusMinutes: number;
    activityType: ActivityType;
    questionCount?: number;
    subjectBreakdown?: Record<string, number>;
  }) => {
    if (!selectedDate) {
      return;
    }
    const trackId = selectedRecord?.trackId ?? activeTrack;
    if (!trackId) {
      return;
    }
    upsertRecord({
      date: selectedDate,
      trackId,
      ...values,
    });
    setEditVisible(false);
    setSelectedDate(null);
  };

  const handleDeleteRequest = () => {
    if (!selectedRecord) {
      return;
    }
    pendingDeleteRef.current = {
      trackId: selectedRecord.trackId,
      date: selectedRecord.date,
    };
    openConfirmAfterCloseRef.current = true;
    setEditVisible(false);
  };

  const handleSheetCloseComplete = () => {
    if (!openConfirmAfterCloseRef.current) {
      return;
    }
    openConfirmAfterCloseRef.current = false;
    setConfirmVisible(true);
  };

  const detailTitle = selectedDate ? DAY_LONG_LABELS[getWeekdayIndex(selectedDate)] : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>HAFTA</Text>
            <Text style={styles.subtitle}>{weekLabel}</Text>
          </View>
          <IconButton accessibilityLabel="Geri" onPress={() => router.back()}>
            <IconSymbol
              name="chevron.left"
              size={18}
              color={colors.iconMuted}
            />
          </IconButton>
        </View>

        <View style={styles.dotSection}>
          <Text style={styles.sectionLabel}>HAFTALIK RİTİM</Text>
          <View style={styles.dotCapsule}>
            <DotRow
              activeIndex={highlightedDayIndex}
              filled={weekDots}
              size={14}
              gap={6}
              pressablePadding={2}
              activeColor={colors.textPrimary}
              inactiveColor={colors.dotInactive}
              highlightIndex={highlightedDayIndex >= 0 ? highlightedDayIndex : undefined}
              highlightColor={colors.dotHighlight}
            />
          </View>
        </View>

        {stats.filledCount > 0 ? (
          <View style={styles.statsRow}>
            <SurfaceCard style={styles.statCard}>
              <Text style={styles.statValue}>{stats.filledCount}/7</Text>
              <Text style={styles.statLabel}>gün</Text>
            </SurfaceCard>
            <SurfaceCard style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalMinutes}</Text>
              <Text style={styles.statLabel}>dakika</Text>
            </SurfaceCard>
            {stats.totalQuestions > 0 && (
              <SurfaceCard style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalQuestions}</Text>
                <Text style={styles.statLabel}>soru</Text>
              </SurfaceCard>
            )}
          </View>
        ) : (
          <SurfaceCard style={styles.emptyWeekCard} variant="flat">
            <Text style={styles.emptyWeekTitle}>Bu haftada henüz kayıt yok</Text>
            <Text style={styles.emptyWeekText}>Bir güne dokunup ilk kaydını ekleyebilirsin.</Text>
          </SurfaceCard>
        )}

        <View style={styles.daysSection}>
          <Text style={styles.sectionLabel}>GÜNLER</Text>
          <View style={styles.daysList}>
            {rows.map((row) => {
              const hasRecord = Boolean(row.record);
              const isToday = row.date === todayKey;
              return (
                <Pressable
                  key={row.date}
                  accessibilityRole="button"
                  onPress={() => handleRowPress(row.date)}
                  style={({ pressed }) => [
                    pressed ? styles.dayRowPressed : null,
                  ]}
                >
                  <SurfaceCard
                    style={[styles.dayCard, isToday ? styles.dayCardToday : null]}
                    variant={hasRecord ? 'default' : 'flat'}
                  >
                    <View style={styles.dayLeft}>
                      <View
                        style={[
                          styles.dayIndicator,
                          hasRecord
                            ? styles.dayIndicatorFilled
                            : styles.dayIndicatorEmpty,
                          isToday ? styles.dayIndicatorToday : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayIndicatorText,
                            hasRecord
                              ? styles.dayIndicatorTextFilled
                              : styles.dayIndicatorTextEmpty,
                          ]}
                        >
                          {row.dayNumber}
                        </Text>
                      </View>
                      <View style={styles.dayInfo}>
                        <Text style={[styles.dayLabel, isToday ? styles.dayLabelToday : null]}>
                          {row.longLabel}
                        </Text>
                        {row.record ? (
                          <Text style={styles.daySummary}>
                            {formatSummary(row.record)}
                          </Text>
                        ) : (
                          <Text style={styles.dayEmpty}>Kayıt yok</Text>
                        )}
                      </View>
                    </View>
                    <IconSymbol
                      name="chevron.right"
                      size={13}
                      color={colors.iconMuted}
                    />
                  </SurfaceCard>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <DayEntrySheet
        visible={editVisible}
        onClose={() => {
          setEditVisible(false);
          setSelectedDate(null);
        }}
        onCloseComplete={handleSheetCloseComplete}
        title={detailTitle || 'Gün'}
        date={selectedDate ?? undefined}
        trackId={selectedRecord?.trackId ?? activeTrack}
        onSave={handleSave}
        initialValues={selectedRecord}
        onDeletePress={selectedRecord && selectedDate ? handleDeleteRequest : undefined}
      />

      <ConfirmDialog
        visible={confirmVisible}
        title="Kaydı sil?"
        message={(() => {
          const base = 'Bu günün kaydı tamamen silinecek.';
          if (!pendingDeleteRef.current) return base;
          const exams = getExamsForDate(pendingDeleteRef.current.trackId, pendingDeleteRef.current.date);
          if (exams.length === 0) return base;
          return `${base}\n\nBu güne ait ${exams.length} deneme silinmeyecek, Denemeler ekranından yönetebilirsiniz.`;
        })()}
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        onCancel={() => {
          setConfirmVisible(false);
          pendingDeleteRef.current = null;
          openConfirmAfterCloseRef.current = false;
        }}
        onConfirm={() => {
          if (pendingDeleteRef.current) {
            removeRecord(pendingDeleteRef.current.trackId, pendingDeleteRef.current.date);
          }
          setConfirmVisible(false);
          setEditVisible(false);
          setSelectedDate(null);
          pendingDeleteRef.current = null;
          openConfirmAfterCloseRef.current = false;
        }}
      />
    </SafeAreaView>
  );
}

function formatSummary(record: DailyRecord) {
  const questionTotal = getQuestionTotal(record);
  return questionTotal > 0
    ? `${record.focusMinutes} dk · ${questionTotal} soru`
    : `${record.focusMinutes} dk odak`;
}

function getWeekdayIndex(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  const dayIndex = date.getDay();
  return dayIndex === 0 ? 6 : dayIndex - 1;
}

function parseDateString(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const parsed = new Date(year, (month ?? 1) - 1, day ?? 1);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidDateKey(dateString: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  const parsed = parseDateString(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  return formatDateKey(parsed) === dateString;
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  dotSection: {
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  dotCapsule: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.capsule,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  emptyWeekCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  emptyWeekTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyWeekText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  daysSection: {
    gap: spacing.md,
  },
  daysList: {
    gap: spacing.sm,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  dayCardToday: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  dayRowPressed: {
    opacity: 0.75,
  },
  dayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dayIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIndicatorFilled: {
    backgroundColor: colors.accentDeep,
  },
  dayIndicatorEmpty: {
    backgroundColor: colors.capsule,
  },
  dayIndicatorToday: {
    borderWidth: 1,
    borderColor: colors.accentDeep,
  },
  dayIndicatorText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dayIndicatorTextFilled: {
    color: colors.surface,
  },
  dayIndicatorTextEmpty: {
    color: colors.textMuted,
  },
  dayInfo: {
    gap: 2,
  },
  dayLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  dayLabelToday: {
    color: colors.accentDeep,
  },
  daySummary: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  dayEmpty: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
