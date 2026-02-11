import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
import { TextLink } from '@/components/TextLink';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { TrackId } from '@/lib/track/tracks';
import { colors, radius, spacing } from '@/lib/theme/tokens';
import { useExams } from '@/state/exams';
import { useOnboarding } from '@/state/onboarding';
import {
  ActivityType,
  getWeekDates,
  useRecords,
} from '@/state/records';
import { useSettings } from '@/state/settings';

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  KONU: 'Konu',
  SORU: 'Soru',
  KARISIK: 'Karışık',
};

const COACH_NOTE_PREVIEW_LINES = 3;
const ILLUSTRATION_HEIGHT_MIN = 220;
const ILLUSTRATION_HEIGHT_MAX = 300;

export function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
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
  const [coachNoteExpanded, setCoachNoteExpanded] = useState(false);
  const pendingDeleteRef = useRef<{ trackId: TrackId; date: string } | null>(null);
  const openConfirmAfterCloseRef = useRef(false);

  const today = todayKey;
  const { getExamsForDate } = useExams();
  const activeTrack = settings.activeTrack;
  const todayRecord = activeTrack ? selectTodayRecord(activeTrack, todayKey) : undefined;
  const weekDots = useMemo(
    () => (activeTrack ? selectWeekDots(activeTrack, todayKey) : Array(7).fill(false)),
    [activeTrack, selectWeekDots, todayKey]
  );
  const weekDates = useMemo(() => getWeekDates(todayKey), [todayKey]);
  const todayIndex = useMemo(() => weekDates.indexOf(today), [today, weekDates]);
  const coachNote = useMemo(() => settings.coachNote?.trim() ?? null, [settings.coachNote]);
  const coachConnected = settings.coachConnected || !!coachNote || !!settings.coachName;
  const showCoachNote = coachConnected && !!coachNote;
  const showCoachConnect = !coachConnected;
  const canOpenDayEntry = Boolean(todayRecord || activeTrack);
  const shouldCollapseCoachNote = Boolean(
    coachNote && coachNote.length > 120
  );

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

  useEffect(() => {
    setCoachNoteExpanded(false);
  }, [coachNote]);

  const hasRecord = !!todayRecord;
  const illustrationOpacity = useSharedValue(hasRecord ? 1 : 0);
  const illustrationHeight = useMemo(() => {
    const scaledHeight = Math.round(width * (hasRecord ? 0.58 : 0.7));
    return Math.max(
      ILLUSTRATION_HEIGHT_MIN,
      Math.min(ILLUSTRATION_HEIGHT_MAX, scaledHeight)
    );
  }, [hasRecord, width]);

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

  const todayStatus = useMemo(() => {
    return todayRecord
      ? 'Bugünkü çalışmanı kaydettin'
      : 'Bugün henüz odak kaydı oluşturmadın';
  }, [todayRecord]);

  const todaySummary = useMemo(() => {
    if (!todayRecord) {
      return null;
    }
    const parts = [
      `${todayRecord.focusMinutes} dk`,
      ACTIVITY_LABELS[todayRecord.activityType],
    ];
    if (todayRecord.questionCount && todayRecord.questionCount > 0) {
      parts.push(`${todayRecord.questionCount} soru`);
    }
    return parts.join(' · ');
  }, [todayRecord]);
  const todayExamCount = useMemo(() => {
    if (!activeTrack) {
      return 0;
    }
    return getExamsForDate(activeTrack, today).length;
  }, [activeTrack, getExamsForDate, today]);
  const todayExamInfo = useMemo(() => {
    if (!todayRecord || todayExamCount <= 0) {
      return null;
    }
    if (todayExamCount === 1) {
      return 'Ayrıca 1 deneme var';
    }
    return `Ayrıca ${todayExamCount} deneme var`;
  }, [todayExamCount, todayRecord]);

  const navItems: Array<{
    key: string;
    title: string;
    subtitle: string;
    href: '/days' | '/topics' | '/exams' | '/coach-connect';
  }> = [
    {
      key: 'days',
      title: 'Günler',
      subtitle: 'Geçmişini görüntüle',
      href: '/days' as const,
    },
    {
      key: 'topics',
      title: 'Konular',
      subtitle: 'Konu hakkındaki hissini işaretle',
      href: '/topics' as const,
    },
    {
      key: 'exams',
      title: 'Denemeler',
      subtitle: 'Deneme geçmişini gör',
      href: '/exams' as const,
    },
  ];

  if (showCoachConnect) {
    navItems.push({
      key: 'coach-connect',
      title: 'Koça bağlan',
      subtitle: 'Davet koduyla koçuna bağlan',
      href: '/coach-connect' as const,
    });
  }

  const handleSave = (values: {
    focusMinutes: number;
    activityType: ActivityType;
    questionCount?: number;
    subjectBreakdown?: Record<string, number>;
  }) => {
    const trackId = todayRecord?.trackId ?? activeTrack;
    if (!trackId) {
      return;
    }
    upsertRecord({
      date: today,
      trackId,
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
    pendingDeleteRef.current = {
      trackId: todayRecord.trackId,
      date: todayRecord.date,
    };
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
            <Text
              style={styles.coachNoteBody}
              numberOfLines={
                coachNoteExpanded || !shouldCollapseCoachNote
                  ? undefined
                  : COACH_NOTE_PREVIEW_LINES
              }
            >
              {coachNote}
            </Text>
            {shouldCollapseCoachNote ? (
              <TextLink
                label={coachNoteExpanded ? 'Daha az göster' : 'Devamını gör'}
                onPress={() => setCoachNoteExpanded((prev) => !prev)}
                textStyle={styles.coachNoteToggleText}
                style={styles.coachNoteToggle}
              />
            ) : null}
          </SurfaceCard>
        ) : null}

        <View style={styles.mainStack}>
          <View style={styles.statusBlock}>
            <Text style={styles.sectionTitle}>HAFTALIK RİTİM</Text>
            <View style={styles.dotCapsule}>
              <DotRow
                activeIndex={todayIndex}
                filled={weekDots}
                onChange={() => router.push('/days')}
                accessibilityLabel="Günler ekranını aç"
                accessibilityHint="Haftalık gün listesini açar"
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
          <View style={[styles.illustrationContainer, { height: illustrationHeight }]}>
            <Animated.Image
              source={require('@/assets/images/no-entry-state-home-screen-illustration.png')}
              style={[
                styles.weekIllustration,
                { height: illustrationHeight },
                styles.illustrationAbsolute,
                noEntryStyle,
              ]}
              resizeMode="contain"
            />
            <Animated.Image
              source={require('@/assets/images/entry-exist-state-home-screen-illustration.png')}
              style={[
                styles.weekIllustration,
                { height: illustrationHeight },
                styles.illustrationAbsolute,
                entryExistStyle,
              ]}
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
                <View style={styles.statusCopy}>
                  <Text style={styles.statusSummary}>{todaySummary}</Text>
                  <Text style={styles.statusText}>{todayStatus}</Text>
                  {todayExamInfo ? (
                    <Text style={styles.statusMeta}>{todayExamInfo}</Text>
                  ) : null}
                </View>
              </View>
            ) : (
              <Text style={styles.cardValue}>{todayStatus}</Text>
            )}
            <PrimaryButton
              label={todayRecord ? 'KAYDI DÜZENLE' : 'BUGÜN ODAKLANDIM'}
              onPress={() => setSheetVisible(true)}
              disabled={!canOpenDayEntry}
              style={styles.cardButton}
              textStyle={styles.cardButtonText}
            />
            {!canOpenDayEntry ? (
              <Text style={styles.cardHelperText}>
                Devam etmek için önce bir çalışma alanı seç.
              </Text>
            ) : null}
          </SurfaceCard>
        </View>

        <View style={styles.divider} />

        <View style={styles.navSection}>
          {navItems.map((item, index) => {
            const isLast = index === navItems.length - 1;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                onPress={() => router.push(item.href)}
                style={({ pressed }) => [
                  styles.navRow,
                  !isLast ? styles.navRowDivider : null,
                  pressed ? styles.navRowPressed : null,
                ]}
              >
                <View style={styles.navTextWrap}>
                  <Text style={styles.navTitle}>{item.title}</Text>
                  <Text style={styles.navSubtitle}>{item.subtitle}</Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.iconMuted} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <DayEntrySheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onCloseComplete={handleSheetCloseComplete}
        title={todayRecord ? 'Bugün' : 'Odak Girişi'}
        date={today}
        trackId={todayRecord?.trackId ?? activeTrack}
        onSave={handleSave}
        initialValues={todayRecord}
        onDeletePress={todayRecord ? handleDeleteRequest : undefined}
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
    fontSize: 14,
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
  coachNoteToggle: {
    alignSelf: 'flex-start',
  },
  coachNoteToggleText: {
    color: colors.textStrong,
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
  },
  weekIllustration: {
    width: '100%',
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
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  statusCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  statusSummary: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '600',
  },
  statusBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.statusBadge,
    marginTop: 1,
  },
  statusBadgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  statusMeta: {
    color: colors.textSecondary,
    fontSize: 13,
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
  cardHelperText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  navSection: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  navRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navRowPressed: {
    backgroundColor: colors.backgroundMuted,
  },
  navTextWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  navTitle: {
    color: colors.navTitle,
    fontSize: 15,
    fontWeight: '600',
  },
  navSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
