import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { DayEntrySheet } from '@/components/DayEntrySheet';
import { DotRow } from '@/components/DotRow';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SurfaceCard } from '@/components/SurfaceCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { colors, radius, spacing } from '@/lib/theme/tokens';
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
  const pendingDeleteRef = useRef<string | null>(null);
  const openConfirmAfterCloseRef = useRef(false);

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
    if (!todayRecord) {
      Alert.alert('Silinecek kayıt yok', 'Bugün için kayıt bulunamadı.');
      return;
    }
    setSheetVisible(false);
    pendingDeleteRef.current = todayRecord.date;
    openConfirmAfterCloseRef.current = true;
  };

  const handleSheetCloseComplete = () => {
    if (!openConfirmAfterCloseRef.current) {
      return;
    }
    openConfirmAfterCloseRef.current = false;
    setConfirmVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.minimalHeader}>
          <View>
            <Text style={styles.title}>BUGÜN</Text>
            <Text style={styles.subtitle}>Ritmini gözden geçir</Text>
          </View>
          <IconButton
            accessibilityLabel="Ayarlar"
            onPress={() => router.push('/settings')}
          >
            <IconSymbol name="gearshape" size={18} color={colors.iconMuted} />
          </IconButton>
        </View>

        <View style={styles.mainStack}>
          <View style={styles.statusBlock}>
            <Text style={styles.sectionTitle}>HAFTALIK RİTİM</Text>
            <View style={styles.dotCapsule}>
              <DotRow
                activeIndex={todayIndex}
                filled={weekDots}
                size={14}
                gap={6}
                pressablePadding={2}
                activeColor={colors.textPrimary}
                inactiveColor={colors.dotInactive}
                highlightIndex={todayIndex}
                highlightColor={colors.dotHighlight}
              />
            </View>
          </View>
          <Image
            source={
              todayRecord
                ? require('@/assets/images/entry-exist-state-home-screen-illustration.png')
                : require('@/assets/images/no-entry-state-home-screen-illustration.png')
            }
            style={styles.weekIllustration}
            resizeMode="contain"
          />
          <SurfaceCard style={styles.focusCard}>
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
          </SurfaceCard>
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
            <IconSymbol name="chevron.right" size={16} color={colors.iconMuted} />
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
            <IconSymbol name="chevron.right" size={16} color={colors.iconMuted} />
          </Pressable>
        </View>
      </ScrollView>

      <DayEntrySheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onCloseComplete={handleSheetCloseComplete}
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
          pendingDeleteRef.current = null;
          openConfirmAfterCloseRef.current = false;
        }}
        onConfirm={() => {
          if (pendingDeleteRef.current) {
            removeRecord(pendingDeleteRef.current);
          } else {
            Alert.alert('Silinecek kayıt yok', 'Bugün için kayıt bulunamadı.');
          }
          setConfirmVisible(false);
          pendingDeleteRef.current = null;
          openConfirmAfterCloseRef.current = false;
        }}
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
  mainStack: {
    gap: spacing.xs,
  },
  statusBlock: {
    gap: spacing.md,
    alignItems: 'center',
  },
  weekIllustration: {
    width: '100%',
    height: 300,
    borderRadius: 18,
  },
  dotCapsule: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.capsule,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  focusCard: {
    padding: spacing.xs,
    gap: spacing.lg,
  },
  cardHeader: {
    gap: spacing.xs,
  },
  cardTitle: {
    color: colors.textStrong,
    fontSize: 13,
    fontWeight: '700',
  },
  cardValue: {
    color: colors.textSecondary,
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
    backgroundColor: colors.statusBadge,
  },
  statusBadgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  cardButton: {
    marginTop: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.accentDeep,
    height: 58,
    alignSelf: 'stretch',
  },
  cardButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
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
    color: colors.navTitle,
    fontSize: 15,
    fontWeight: '600',
  },
  navSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
});
