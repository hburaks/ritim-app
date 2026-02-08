import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { DotRow } from '@/components/DotRow';
import { IconButton } from '@/components/IconButton';
import { SurfaceCard } from '@/components/SurfaceCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { colors, radius, spacing } from '@/lib/theme/tokens';
import { getWeekDates, parseDateKey, useRecords } from '@/state/records';

const INITIAL_WEEK_COUNT = 6;
const WEEK_PAGE_SIZE = 4;

export function DaysScreen() {
  const router = useRouter();
  const { getWeekDots, getRecordByDate, selectHasAnyRecords, todayKey } = useRecords();
  const [weekCount, setWeekCount] = useState(INITIAL_WEEK_COUNT);

  const weeks = useMemo(() => {
    const baseDate = parseDateKey(todayKey);
    return Array.from({ length: weekCount }, (_, offset) => {
      const reference = new Date(baseDate);
      reference.setDate(baseDate.getDate() - offset * 7);
      const dates = getWeekDates(reference);
      const startDate = dates[0];
      const dots = getWeekDots(startDate);
      const hasAny = dates.some((date) => Boolean(getRecordByDate(date)));

      return {
        offset,
        startDate,
        dots,
        hasAny,
      };
    });
  }, [getRecordByDate, getWeekDots, todayKey, weekCount]);

  const navigateToWeek = (weekStart: string) => {
    router.push({ pathname: '/week/[weekStart]', params: { weekStart } });
  };

  const handleEndReached = useCallback(() => {
    setWeekCount((current) => current + WEEK_PAGE_SIZE);
  }, []);

  const hasAnyRecords = selectHasAnyRecords();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Günler</Text>
          <IconButton accessibilityLabel="Geri" onPress={() => router.back()}>
            <IconSymbol
              name="chevron.right"
              size={18}
              color={colors.textSecondary}
              style={styles.backIcon}
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
            hasAnyRecords ? null : (
              <Text style={styles.emptyText}>
                Henüz kayıt yok. İlk kaydını eklemek için ana ekrana dön.
              </Text>
            )
          }
          renderItem={({ item, index }) => {
            const label = index === 0 ? 'Bu hafta' : `-${item.offset} hafta`;
            return (
              <Pressable
                accessibilityRole="button"
                onPress={() => navigateToWeek(item.startDate)}
                style={({ pressed }) => [
                  pressed ? styles.weekBlockPressed : null,
                ]}
              >
                <SurfaceCard style={styles.weekBlock}>
                  <Text style={styles.weekLabel}>{label}</Text>
                  <View style={styles.dotCapsule}>
                    <DotRow activeIndex={-1} filled={item.dots} />
                  </View>
                  {item.hasAny ? null : (
                    <Text style={styles.weekSummary}>—</Text>
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
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backIcon: {
    transform: [{ rotate: '180deg' }],
  },
  weeksList: {
    gap: spacing.lg,
  },
  weekBlock: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  weekBlockPressed: {
    opacity: 0.75,
  },
  weekLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  dotCapsule: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.capsule,
  },
  weekSummary: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
});
