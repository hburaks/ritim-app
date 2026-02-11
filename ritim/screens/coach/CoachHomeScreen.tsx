import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SurfaceCard } from '@/components/SurfaceCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  fetchCoachData,
  type CoachData,
  type StudentProfile,
} from '@/lib/coach/coachApi';
import {
  computeLastActivity,
  computeWeeklyFullExamCount,
  computeWeeklyMinutes,
  filterDailyByTrack,
  filterExamsByTrack,
  formatLastActivity,
  getLocalToday,
} from '@/lib/coach/coachMetrics';
import {
  getFavorites,
  toggleFavorite,
} from '@/lib/storage/coachFavoritesStorage';
import { signInWithGoogle } from '@/lib/supabase/auth';
import { colors, radius, spacing } from '@/lib/theme/tokens';
import { TRACKS } from '@/lib/track/tracks';
import { useAuth } from '@/state/auth';

// ─── Types ───

type StudentCardData = {
  id: string;
  displayName: string;
  trackLabel: string;
  lastActivityText: string;
  weeklyMinutes: number;
  weeklyFullExams: number;
  isFavorite: boolean;
  lastActivityDate: string | null;
};

// ─── Screen ───

export function CoachHomeScreen() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const [data, setData] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<string, true>>({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session) return;
    setError(null);
    setLoading(true);
    try {
      const result = await fetchCoachData(session);
      setData(result);
    } catch (err: any) {
      setError(err?.message ?? 'Veri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      setLoading(false);
      return;
    }
    getFavorites().then(setFavorites).catch(console.warn);
    loadData();
  }, [session, authLoading, loadData]);

  const handleToggleFavorite = useCallback(async (studentId: string) => {
    const updated = await toggleFavorite(studentId);
    setFavorites(updated);
  }, []);

  const handleLogin = useCallback(async () => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        setLoginError('Giriş yapılamadı. Lütfen tekrar dene.');
      }
    } finally {
      setLoginLoading(false);
    }
  }, []);

  const students = useMemo((): StudentCardData[] => {
    if (!data) return [];

    const today = getLocalToday();
    const trackMap = new Map(TRACKS.map((t) => [t.id, t.shortLabel]));

    const cards: StudentCardData[] = data.profiles.map((profile) => {
      const daily = filterDailyByTrack(data.dailyRecords, profile.id, profile.active_track);
      const exams = filterExamsByTrack(data.examRecords, profile.id, profile.active_track);

      const lastDate = computeLastActivity(daily, exams);
      const lastActivityText = formatLastActivity(lastDate, today);
      const weeklyMin = computeWeeklyMinutes(daily, exams, today);
      const weeklyExams = computeWeeklyFullExamCount(exams, today);

      return {
        id: profile.id,
        displayName: profile.display_name ?? '—',
        trackLabel: profile.active_track ? (trackMap.get(profile.active_track) ?? '—') : '—',
        lastActivityText,
        weeklyMinutes: weeklyMin,
        weeklyFullExams: weeklyExams,
        isFavorite: !!favorites[profile.id],
        lastActivityDate: lastDate,
      };
    });

    // Sort: favorites first, within each group oldest activity first
    cards.sort((a, b) => {
      const aFav = a.isFavorite ? 0 : 1;
      const bFav = b.isFavorite ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;

      // Oldest activity first (null = no activity = very old)
      const aDate = a.lastActivityDate ?? '';
      const bDate = b.lastActivityDate ?? '';
      if (aDate === bDate) return 0;
      return aDate < bDate ? -1 : 1;
    });

    return cards;
  }, [data, favorites]);

  // ─── Guard: Auth loading ───
  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accentDeep} />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Guard: Not logged in ───
  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Header onBack={() => router.back()} />
          <View style={styles.emptyContainer}>
            <SurfaceCard style={styles.emptyCard}>
              <IconSymbol name="person.crop.circle" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Koç Modu için giriş yap</Text>
              <Text style={styles.emptySubtitle}>
                Öğrencilerini görmek için Google hesabınla giriş yap.
              </Text>
              {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}
            </SurfaceCard>
            <PrimaryButton
              label={loginLoading ? undefined : 'GOOGLE İLE GİRİŞ YAP'}
              onPress={handleLogin}
              disabled={loginLoading}
              style={styles.actionButton}
              textStyle={styles.actionButtonText}
            >
              {loginLoading ? <ActivityIndicator color={colors.surface} /> : undefined}
            </PrimaryButton>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Guard: Loading ───
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Header onBack={() => router.back()} />
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accentDeep} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Guard: Error ───
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Header onBack={() => router.back()} />
          <View style={styles.emptyContainer}>
            <SurfaceCard style={styles.emptyCard}>
              <IconSymbol name="exclamationmark.triangle" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Bir hata oluştu</Text>
              <Text style={styles.emptySubtitle}>{error}</Text>
            </SurfaceCard>
            <PrimaryButton
              label="TEKRAR DENE"
              onPress={loadData}
              style={styles.actionButton}
              textStyle={styles.actionButtonText}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Guard: No students ───
  if (!data || students.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Header onBack={() => router.back()} />
          <View style={styles.emptyContainer}>
            <SurfaceCard style={styles.emptyCard}>
              <IconSymbol name="person.2" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Bağlı öğrencin yok</Text>
              <Text style={styles.emptySubtitle}>
                Öğrencilerin davet kodunu kullandığında burada görünecek.
              </Text>
            </SurfaceCard>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Student list ───
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header onBack={() => router.back()} />
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StudentCard
              student={item}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadData}
              tintColor={colors.accentDeep}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Header ───

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <IconButton accessibilityLabel="Geri" onPress={onBack}>
        <IconSymbol
          name="chevron.right"
          size={18}
          color={colors.textSecondary}
          style={styles.backIcon}
        />
      </IconButton>
      <Text style={styles.title}>Koç Modu</Text>
    </View>
  );
}

// ─── Student Card ───

function StudentCard({
  student,
  onToggleFavorite,
}: {
  student: StudentCardData;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <SurfaceCard style={styles.studentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {student.displayName}
          </Text>
          <View style={styles.trackChip}>
            <Text style={styles.trackChipText}>{student.trackLabel}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={student.isFavorite ? 'Favoriden çıkar' : 'Favoriye ekle'}
          onPress={() => onToggleFavorite(student.id)}
          hitSlop={8}
        >
          <IconSymbol
            name={student.isFavorite ? 'star.fill' : 'star'}
            size={22}
            color={student.isFavorite ? '#F59E0B' : colors.iconMuted}
          />
        </Pressable>
      </View>

      <View style={styles.cardMetrics}>
        <Text style={styles.metricText}>
          Son aktivite: {student.lastActivityText}
        </Text>
        <Text style={styles.metricText}>
          Bu hafta: {student.weeklyMinutes} dk · {student.weeklyFullExams} FULL deneme
        </Text>
      </View>
    </SurfaceCard>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  backIcon: {
    transform: [{ rotate: '180deg' }],
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  // ─── Empty states ───
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  emptyCard: {
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textStrong,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButton: {
    borderRadius: radius.full,
    backgroundColor: colors.accentDeep,
    height: 58,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
  },
  // ─── List ───
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  // ─── Student card ───
  studentCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardNameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textStrong,
    flexShrink: 1,
  },
  trackChip: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  trackChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accentDeep,
  },
  cardMetrics: {
    gap: spacing.xs,
  },
  metricText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
