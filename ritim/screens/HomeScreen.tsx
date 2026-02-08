import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { DayEntrySheet } from '@/components/DayEntrySheet';
import { DotRow } from '@/components/DotRow';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PrimaryButton } from '@/components/PrimaryButton';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { radius, spacing } from '@/lib/theme/tokens';
import { useOnboarding } from '@/state/onboarding';
import {
  ActivityType,
  getTodayDateString,
  getWeekDates,
  useRecords,
} from '@/state/records';

export function HomeScreen() {
  const router = useRouter();
  const { completed, hydrated } = useOnboarding();
  const { getRecordByDate, upsertRecord, removeRecord, getWeekDots } = useRecords();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDeleteDate, setPendingDeleteDate] = useState<string | null>(null);
  const deleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const today = getTodayDateString();
  const todayRecord = getRecordByDate(today);
  const weekDots = useMemo(() => getWeekDots(), [getWeekDots]);
  const weekDates = useMemo(() => getWeekDates(), [today]);
  const todayIndex = useMemo(() => weekDates.indexOf(today), [today, weekDates]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (!completed) {
      router.replace('/onboarding-1');
    }
  }, [completed, hydrated, router]);

  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
    };
  }, []);

  const todayStatus = useMemo(
    () =>
      todayRecord ? 'Bugün odaklandın' : 'Bugün henüz odak kaydı yok',
    [todayRecord]
  );

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

  const handleDeleteRequest = () => {
    setSheetVisible(false);
    setPendingDeleteDate(today);
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
    }
    deleteTimeoutRef.current = setTimeout(() => {
      setConfirmVisible(true);
    }, 240);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.minimalHeader}>
          <View>
            <Text style={styles.title}>BUGÜN</Text>
            <Text style={styles.subtitle}>Ritmini gözden geçir</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [
              styles.settingsButton,
              pressed ? styles.settingsButtonPressed : null,
            ]}
          >
            <IconSymbol name="gearshape" size={18} color={palette.iconMuted} />
          </Pressable>
        </View>

        <View style={styles.statusBlock}>
          <Text style={styles.sectionTitle}>HAFTALIK RİTİM</Text>
          <View style={styles.dotCapsule}>
            <DotRow
              activeIndex={todayIndex}
              filled={weekDots}
              size={14}
              gap={6}
              pressablePadding={2}
              activeColor={palette.ink}
              inactiveColor={palette.dotInactive}
              highlightIndex={todayIndex}
              highlightColor={palette.dotHighlight}
            />
          </View>
        </View>

        <View style={styles.focusCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Bugün Odak Kaydı</Text>
          </View>
          {todayRecord ? (
            <View style={styles.cardStatusRow}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>✓</Text>
              </View>
              <Text style={styles.statusText}>{todayStatus}</Text>
            </View>
          ) : (
            <Text style={styles.cardValue}>{todayStatus}</Text>
          )}
          <PrimaryButton
            label={todayRecord ? 'KAYDI DÜZENLE' : 'BUGÜN ODAKLANDIM'}
            onPress={() => setSheetVisible(true)}
            style={styles.cardButton}
            textStyle={styles.cardButtonText}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.navSection}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/days')}
            style={({ pressed }) => [
              styles.navRow,
              pressed ? styles.navRowPressed : null,
            ]}
          >
            <View>
              <Text style={styles.navTitle}>Günler</Text>
              <Text style={styles.navSubtitle}>Geçmişini görüntüle</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={palette.iconMuted} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/topics')}
            style={({ pressed }) => [
              styles.navRow,
              pressed ? styles.navRowPressed : null,
            ]}
          >
            <View>
              <Text style={styles.navTitle}>Konular</Text>
              <Text style={styles.navSubtitle}>Konu hissi işaretle</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={palette.iconMuted} />
          </Pressable>
        </View>
      </View>

      <DayEntrySheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title={todayRecord ? 'Bugün' : 'Yeni kayıt'}
        onSave={handleSave}
        initialValues={todayRecord}
        onDeletePress={todayRecord ? handleDeleteRequest : undefined}
      />

      <ConfirmDialog
        visible={confirmVisible}
        title="Kaydı sil?"
        message="Bu günün kaydı tamamen silinecek."
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        onCancel={() => {
          setConfirmVisible(false);
          setPendingDeleteDate(null);
        }}
        onConfirm={() => {
          if (pendingDeleteDate) {
            removeRecord(pendingDeleteDate);
          }
          setConfirmVisible(false);
          setPendingDeleteDate(null);
        }}
      />
    </SafeAreaView>
  );
}

const palette = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  ink: '#1A1A1A',
  muted: '#6B7280',
  mutedDark: '#374151',
  border: '#E5E7EB',
  dotInactive: '#E2E8F0',
  dotHighlight: '#94A3B8',
  capsule: '#F1F5F9',
  card: '#F9FAFB',
  navTitle: '#1F2937',
  iconMuted: '#9CA3AF',
  statusBadge: '#111827',
} as const;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  minimalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  settingsButtonPressed: {
    opacity: 0.7,
  },
  title: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  statusBlock: {
    gap: 10,
    alignItems: 'center',
  },
  dotCapsule: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: palette.capsule,
  },
  sectionTitle: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  focusCard: {
    padding: spacing.xl,
    borderRadius: 20,
    backgroundColor: palette.card,
    gap: spacing.lg,
    shadowColor: '#111827',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  cardHeader: {
    gap: spacing.xs,
  },
  cardTitle: {
    color: palette.mutedDark,
    fontSize: 13,
    fontWeight: '700',
  },
  cardValue: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.statusBadge,
  },
  statusBadgeText: {
    color: palette.surface,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  statusText: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  cardButton: {
    marginTop: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: palette.ink,
    height: 58,
    alignSelf: 'stretch',
  },
  cardButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.surface,
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
    marginHorizontal: spacing.md,
  },
  navSection: {
    gap: 20,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  navRowPressed: {
    opacity: 0.7,
  },
  navTitle: {
    color: palette.navTitle,
    fontSize: 15,
    fontWeight: '600',
  },
  navSubtitle: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '500',
  },
});
