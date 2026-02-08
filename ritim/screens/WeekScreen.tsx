import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BottomSheet } from '@/components/BottomSheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DayEntrySheet } from '@/components/DayEntrySheet';
import { DotRow } from '@/components/DotRow';
import { TextLink } from '@/components/TextLink';
import { colors, spacing } from '@/lib/theme/tokens';
import { ActivityType, DailyRecord, getWeekDates, useRecords } from '@/state/records';

const DAY_LABELS = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'] as const;
const DAY_LONG_LABELS = [
  'Pazartesi',
  'Sali',
  'Carsamba',
  'Persembe',
  'Cuma',
  'Cumartesi',
  'Pazar',
] as const;

export function WeekScreen() {
  const router = useRouter();
  const { weekStart } = useLocalSearchParams<{ weekStart?: string }>();
  const { getWeekDots, getRecordByDate, upsertRecord, removeRecord } = useRecords();
  const [detailVisible, setDetailVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const deleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const weekStartDate = typeof weekStart === 'string' ? weekStart : undefined;
  const weekDates = useMemo(() => {
    const reference = weekStartDate ? parseDateString(weekStartDate) : new Date();
    return getWeekDates(reference);
  }, [weekStartDate]);
  const weekDots = useMemo(() => getWeekDots(weekStartDate), [getWeekDots, weekStartDate]);

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[weekDates.length - 1];
    return `${formatDateShort(start)} - ${formatDateShort(end)}`;
  }, [weekDates]);

  const rows = useMemo(() => {
    return weekDates.map((date, index) => {
      const record = getRecordByDate(date);
      return {
        date,
        label: DAY_LABELS[index] ?? '',
        record,
      };
    });
  }, [getRecordByDate, weekDates]);

  const selectedRecord = selectedDate ? getRecordByDate(selectedDate) : undefined;

  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
    };
  }, []);

  const handleRowPress = (date: string) => {
    setSelectedDate(date);
    setDetailVisible(true);
  };

  const handleEdit = () => {
    setDetailVisible(false);
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
    upsertRecord({
      date: selectedDate,
      ...values,
    });
    setEditVisible(false);
  };

  const handleDeleteRequest = () => {
    if (!selectedDate) {
      return;
    }
    setEditVisible(false);
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
    }
    deleteTimeoutRef.current = setTimeout(() => {
      setConfirmVisible(true);
    }, 240);
  };

  const detailTitle = selectedDate
    ? DAY_LONG_LABELS[getWeekdayIndex(selectedDate)]
    : '';

  const detailSummary = selectedRecord ? formatSummary(selectedRecord) : '—';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Hafta</Text>
            <TextLink
              label="← Geri"
              onPress={() => router.back()}
              textStyle={styles.backLink}
            />
          </View>
          <Text style={styles.subtitle}>{weekLabel}</Text>
          <DotRow activeIndex={-1} filled={weekDots} />
        </View>

        <View style={styles.list}>
          {rows.map((row) => (
            <Pressable
              key={row.date}
              accessibilityRole="button"
              onPress={() => handleRowPress(row.date)}
              style={({ pressed }) => [
                styles.listRow,
                pressed ? styles.listRowPressed : null,
              ]}
            >
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>
                {row.record ? formatSummary(row.record) : '—'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <BottomSheet
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        title={detailTitle}
      >
        <View style={styles.detailContent}>
          <Text style={styles.detailSummary}>Toplam: {detailSummary}</Text>
          {selectedRecord?.subjectBreakdown ? (
            <View style={styles.breakdownList}>
              {Object.entries(selectedRecord.subjectBreakdown).map(([subject, value]) => (
                <View key={subject} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{subject}</Text>
                  <Text style={styles.breakdownValue}>{value}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Pressable accessibilityRole="button" onPress={handleEdit}>
            <Text style={styles.editLink}>Duzenle →</Text>
          </Pressable>
        </View>
      </BottomSheet>

      <DayEntrySheet
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        title={detailTitle || 'Gun'}
        onSave={handleSave}
        initialValues={selectedRecord}
        onDeletePress={selectedRecord && selectedDate ? handleDeleteRequest : undefined}
      />

      <ConfirmDialog
        visible={confirmVisible}
        title="Kaydı sil?"
        message="Bu günün kaydı tamamen silinecek."
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => {
          if (selectedDate) {
            removeRecord(selectedDate);
          }
          setConfirmVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

function formatSummary(record: DailyRecord) {
  const questionTotal = getQuestionTotal(record);
  return questionTotal > 0
    ? `${record.focusMinutes} dk · ${questionTotal} soru`
    : `${record.focusMinutes} dk`;
}

function getWeekdayIndex(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  const dayIndex = date.getDay();
  return dayIndex === 0 ? 6 : dayIndex - 1;
}

function formatDateShort(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) {
    return dateString;
  }
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${dd}.${mm}`;
}

function parseDateString(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const parsed = new Date(year, (month ?? 1) - 1, day ?? 1);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
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
  header: {
    gap: spacing.sm,
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
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  list: {
    gap: spacing.sm,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
  },
  listRowPressed: {
    opacity: 0.75,
  },
  rowLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  rowValue: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  detailContent: {
    gap: spacing.md,
  },
  detailSummary: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  breakdownList: {
    gap: spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  breakdownValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  editLink: {
    color: colors.accentDark,
    fontSize: 14,
    fontWeight: '600',
  },
});
