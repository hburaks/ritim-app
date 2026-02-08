import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

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
  getWeekDates,
  useRecords,
} from '@/state/records';
import { useSettings } from '@/state/settings';

export function HomeScreen() {
  const router = useRouter();
  const { completed, hydrated } = useOnboarding();
  const { settings } = useSettings();
  const {
    selectTodayRecord,
    selectWeekDots,
    upsertRecord,
    removeRecord,
    todayKey,
    refreshTodayKey,
  } = useRecords();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const pendingDeleteRef = useRef<string | null>(null);
  const openConfirmAfterCloseRef = useRef(false);

  const today = todayKey;
  const todayRecord = selectTodayRecord(todayKey);
  const weekDots = useMemo(() => selectWeekDots(todayKey), [selectWeekDots, todayKey]);
  const weekDates = useMemo(() => getWeekDates(todayKey), [todayKey]);
  const todayIndex = useMemo(() => weekDates.indexOf(today), [today, weekDates]);
  const coachNote = useMemo(() => settings.coachNote?.trim() ?? null, [settings.coachNote]);
  const coachConnected = settings.coachConnected || !!coachNote || !!settings.coachName;
  const showCoachNote = coachConnected && !!coachNote;
  const showCoachConnect = !coachConnected;

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (!completed) {
      router.replace('/onboarding-1');
    }
  }, [completed, hydrated, router]);

  useFocusEffect(
    useCallback(() => {
      refreshTodayKey();
    }, [refreshTodayKey])
  );

  const hasRecord = !!todayRecord;
  const illustrationOpacity = useSharedValue(hasRecord ? 1 : 0);

  useEffect(() => {
    illustrationOpacity.value = withTiming(hasRecord ? 1 : 0, {
      duration: 400,
      easing: Easing.inOut(Easing.ease),
    });
  }, [hasRecord]);

  const entryExistStyle = useAnimatedStyle(() => ({
    opacity: illustrationOpacity.value,
  }));

  const noEntryStyle = useAnimatedStyle(() => ({
    opacity: 1 - illustrationOpacity.value,
  }));

  const todayStatus = useMemo(
    () =>
      todayRecord
        ? 'Bugünkü çalışmanı kaydettin'
        : 'Bugün henüz odak kaydı oluşturmadın',
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
            <Text style={styles.subtitle}>Haftalık ritmini hızlıca gör</Text>
          </View>
          <IconButton
            accessibilityLabel="Ayarlar"
            onPress={() => router.push('/settings')}
          >
            <IconSymbol name="gearshape" size={18} color={colors.iconMuted} />
          </IconButton>
        </View>

        {showCoachNote ? (
          <SurfaceCard style={styles.coachNoteCard} variant="flat">
            <Text style={styles.coachNoteTitle}>Koçundan Not</Text>
            <Text style={styles.coachNoteBody}>{coachNote}</Text>
          </SurfaceCard>
        ) : null}

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
          <View style={styles.illustrationContainer}>
            <Animated.Image
              source={require('@/assets/images/no-entry-state-home-screen-illustration.png')}
              style={[styles.weekIllustration, styles.illustrationAbsolute, noEntryStyle]}
              resizeMode="contain"
            />
            <Animated.Image
              source={require('@/assets/images/entry-exist-state-home-screen-illustration.png')}
              style={[styles.weekIllustration, styles.illustrationAbsolute, entryExistStyle]}
              resizeMode="contain"
            />
          </View>
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
              <Text style={styles.navSubtitle}>Konu hakkındaki hissini işaretle</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.iconMuted} />
          </Pressable>
          {showCoachConnect ? (
            <View style={styles.navRow}>
              <Text style={styles.navTitle}>Koça bağlan</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.iconMuted} />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <DayEntrySheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onCloseComplete={handleSheetCloseComplete}
        title={todayRecord ? 'Bugün' : 'Odak Girişi'}
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
  coachNoteCard: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.accentBeigeSoft,
  },
  coachNoteTitle: {
    color: colors.textStrong,
    fontSize: 13,
    fontWeight: '700',
  },
  coachNoteBody: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  mainStack: {
    gap: spacing.xs,
  },
  statusBlock: {
    gap: spacing.md,
    alignItems: 'center',
  },
  illustrationContainer: {
    width: '100%',
    height: 300,
  },
  weekIllustration: {
    width: '100%',
    height: 300,
    borderRadius: 18,
  },
  illustrationAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
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
