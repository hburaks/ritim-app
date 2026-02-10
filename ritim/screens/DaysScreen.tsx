import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { DotRow } from '@/components/DotRow';
import { IconButton } from '@/components/IconButton';
import { SurfaceCard } from '@/components/SurfaceCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { colors, radius, spacing } from '@/lib/theme/tokens';
import { getWeekDates, getWeekStartKey, parseDateKey, useRecords } from '@/state/records';
import { useSettings } from '@/state/settings';

const INITIAL_WEEK_COUNT = 6;
const WEEK_PAGE_SIZE = 4;

const MONTH_NAMES = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];

function formatDateRange(startDateKey: string): string {
  const dates = getWeekDates(startDateKey);
  const start = parseDateKey(dates[0]);
  const end = parseDateKey(dates[6]);
  const startStr = `${start.getDate()} ${MONTH_NAMES[start.getMonth()]}`;
  const endStr = `${end.getDate()} ${MONTH_NAMES[end.getMonth()]}`;
  return `${startStr} – ${endStr}`;
}

export function DaysScreen() {
  const router = useRouter();
  const { settings } = useSettings();
  const { getWeekDots, getTrackRange, selectHasAnyRecords, todayKey } = useRecords();
  const activeTrack = settings.activeTrack;
  const trackRange = useMemo(
    () => (activeTrack ? getTrackRange(activeTrack) : { minDate: undefined, maxDate: undefined }),
    [activeTrack, getTrackRange]
  );
  const totalWeeksForTrack = useMemo(() => {
    if (!activeTrack) {
      return 0;
    }
    if (!trackRange.minDate) {
      return INITIAL_WEEK_COUNT;
    }
    const currentWeekStart = getWeekStartKey(todayKey);
    const oldestWeekStart = getWeekStartKey(trackRange.minDate);
    return getWeekDiffInclusive(oldestWeekStart, currentWeekStart);
  }, [activeTrack, todayKey, trackRange.minDate]);
  const initialVisibleWeeks = useMemo(
    () => Math.min(INITIAL_WEEK_COUNT, Math.max(0, totalWeeksForTrack)),
    [totalWeeksForTrack]
  );
  const [weekCount, setWeekCount] = useState(INITIAL_WEEK_COUNT);
  const prevTrackRef = React.useRef(activeTrack);
  const activeDayIndex = useMemo(() => {
    const weekday = parseDateKey(todayKey).getDay();
    return weekday === 0 ? 6 : weekday - 1;
  }, [todayKey]);

  useEffect(() => {
    if (prevTrackRef.current !== activeTrack) {
      setWeekCount(initialVisibleWeeks);
      prevTrackRef.current = activeTrack;
    }
  }, [activeTrack, initialVisibleWeeks]);

  useEffect(() => {
    setWeekCount((current) => Math.min(current, totalWeeksForTrack));
  }, [totalWeeksForTrack]);

  const weeks = useMemo(() => {
    if (!activeTrack || weekCount <= 0) {
      return [];
    }
    const baseDate = parseDateKey(todayKey);
    return Array.from({ length: weekCount }, (_, offset) => {
      const reference = new Date(baseDate);
      reference.setDate(baseDate.getDate() - offset * 7);
      const dates = getWeekDates(reference);
      const startDate = dates[0];
      const dots = getWeekDots(activeTrack, startDate);
      const filledCount = dots.filter(Boolean).length;

      return {
        offset,
        startDate,
        dots,
        filledCount,
      };
    });
  }, [activeTrack, getWeekDots, todayKey, weekCount]);

  const navigateToWeek = (weekStart: string) => {
    router.push({ pathname: '/week/[weekStart]', params: { weekStart } });
  };

  const handleEndReached = useCallback(() => {
    if (!activeTrack) {
      return;
    }
    setWeekCount((current) => {
      if (current >= totalWeeksForTrack) {
        return current;
      }
      return Math.min(totalWeeksForTrack, current + WEEK_PAGE_SIZE);
    });
  }, [activeTrack, totalWeeksForTrack]);

  const hasAnyRecords = activeTrack ? selectHasAnyRecords(activeTrack) : false;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>GÜNLER</Text>
            <Text style={styles.subtitle}>Geçmişini gözden geçir</Text>
          </View>
          <IconButton accessibilityLabel="Geri" onPress={() => router.back()}>
            <IconSymbol
              name="chevron.left"
              size={18}
              color={colors.iconMuted}
            />
          </IconButton>
        </View>

        <FlatList
          data={weeks}
          keyExtractor={(item) => item.startDate}
          contentContainerStyle={styles.weeksList}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            activeTrack ? (
              hasAnyRecords ? null : (
                <SurfaceCard style={styles.emptyCard}>
                  <View style={styles.emptyIconWrap}>
                    <IconSymbol name="calendar" size={28} color={colors.textMuted} />
                  </View>
                  <Text style={styles.emptyTitle}>Henüz kayıt yok</Text>
                  <Text style={styles.emptyText}>
                    İlk kaydını eklemek için ana ekrana dön.
                  </Text>
                </SurfaceCard>
              )
            ) : (
              <SurfaceCard style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <IconSymbol name="calendar" size={28} color={colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>Track seçimi bekleniyor</Text>
                <Text style={styles.emptyText}>
                  Kayıtları görebilmek için bir çalışma alanı seç.
                </Text>
              </SurfaceCard>
            )
          }
          renderItem={({ item, index }) => {
            const label = index === 0 ? 'BU HAFTA' : `${item.offset} HAFTA ÖNCE`;
            const dateRange = formatDateRange(item.startDate);
            const hasFilled = item.filledCount > 0;

            return (
              <Pressable
                accessibilityRole="button"
                onPress={() => navigateToWeek(item.startDate)}
                style={({ pressed }) => [
                  pressed ? styles.weekBlockPressed : null,
                ]}
              >
                <SurfaceCard style={styles.weekBlock}>
                  <View style={styles.weekHeader}>
                    <View style={styles.weekHeaderLeft}>
                      <Text style={styles.weekLabel}>{label}</Text>
                      <Text style={styles.weekDateRange}>{dateRange}</Text>
                    </View>
                    <IconSymbol name="chevron.right" size={14} color={colors.iconMuted} />
                  </View>

                  <View style={styles.dotCapsule}>
                    <DotRow
                      activeIndex={index === 0 ? activeDayIndex : -1}
                      filled={item.dots}
                      size={12}
                      gap={6}
                      pressablePadding={2}
                      activeColor={colors.textPrimary}
                      inactiveColor={colors.dotInactive}
                      highlightIndex={index === 0 ? activeDayIndex : undefined}
                      highlightColor={colors.dotHighlight}
                    />
                  </View>

                  {hasFilled ? (
                    <View style={styles.weekFooter}>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${(item.filledCount / 7) * 100}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.weekFilledText}>
                        {item.filledCount}/7 gün
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.weekEmptyText}>Kayıt yok</Text>
                  )}
                </SurfaceCard>
              </Pressable>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function getWeekDiffInclusive(startWeek: string, endWeek: string): number {
  const start = parseDateKey(startWeek);
  const end = parseDateKey(endWeek);
  const diffMs = end.getTime() - start.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, diffWeeks + 1);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.lg,
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
  weeksList: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.capsule,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  weekBlock: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  weekBlockPressed: {
    opacity: 0.75,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekHeaderLeft: {
    gap: spacing.xs,
  },
  weekLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  weekDateRange: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  dotCapsule: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.capsule,
  },
  weekFooter: {
    gap: spacing.sm,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.capsule,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accentDeep,
  },
  weekFilledText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  weekEmptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});
