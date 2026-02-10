import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Chip } from '@/components/Chip';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SurfaceCard } from '@/components/SurfaceCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getSubjectsForActiveTrack, getTopicsSourceForActiveTrack } from '@/lib/track/selectors';
import { colors, radius, spacing } from '@/lib/theme/tokens';
import { useSettings } from '@/state/settings';
import { TopicMood, useTopics } from '@/state/topics';

export function TopicsScreen() {
  const router = useRouter();
  const { settings } = useSettings();
  const topicsSource = settings.activeTrack
    ? getTopicsSourceForActiveTrack(settings.activeTrack)
    : 'EMPTY';
  const isEmptyTrack = topicsSource === 'EMPTY';

  const { topics, getMood, setMood } = useTopics();
  const subjectDefs = useMemo(
    () => (settings.activeTrack ? getSubjectsForActiveTrack(settings.activeTrack) : []),
    [settings.activeTrack]
  );
  const [activeSubjectKey, setActiveSubjectKey] = useState<string | null>(null);

  useEffect(() => {
    setActiveSubjectKey(subjectDefs[0]?.key ?? null);
  }, [subjectDefs]);

  const activeSubject = useMemo(() => {
    if (!activeSubjectKey) {
      return null;
    }
    return subjectDefs.find((subject) => subject.key === activeSubjectKey) ?? null;
  }, [activeSubjectKey, subjectDefs]);

  const filteredTopics = useMemo(() => {
    if (!activeSubjectKey) {
      return [];
    }
    return topics.filter((topic) => topic.subjectKey === activeSubjectKey);
  }, [topics, activeSubjectKey]);

  const listTitle = activeSubject ? `${activeSubject.label} Konuları` : 'Konular';

  const hasAnyMood = useMemo(() => {
    return topics.some((topic) => getMood(topic.id) !== 'NONE');
  }, [topics, getMood]);
  const hasTopicsForActiveSubject = filteredTopics.length > 0;
  const subjectLabelByKey = useMemo(
    () => Object.fromEntries(subjectDefs.map((subject) => [subject.key, subject.label] as const)),
    [subjectDefs]
  );

  const getNextMood = (current: TopicMood): TopicMood => {
    if (current === 'NONE') return 'GOOD';
    if (current === 'GOOD') return 'HARD';
    return 'NONE';
  };

  const getMoodLabel = (mood: TopicMood) => {
    if (mood === 'GOOD') return 'İyi';
    if (mood === 'HARD') return 'Kötü';
    return 'Orta';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.minimalHeader}>
          <View>
            <Text style={styles.title}>KONULAR</Text>
            <Text style={styles.subtitle}>Konu hakkındaki hissini işaretle</Text>
          </View>
          <IconButton accessibilityLabel="Geri" onPress={() => router.back()}>
            <IconSymbol
              name="chevron.right"
              size={18}
              color={colors.textSecondary}
              style={styles.backIcon}
            />
          </IconButton>
        </View>

        {isEmptyTrack ? (
          <SurfaceCard style={styles.emptyTrackCard} variant="outlined">
            <Text style={styles.emptyTrackTitle}>Bu track için konular yakında.</Text>
            <Text style={styles.emptyTrackHint}>
              Şimdilik soru/deneme kayıtlarını kullanabilirsin.
            </Text>
            <PrimaryButton
              label="Track'i Değiştir"
              onPress={() => router.push('/settings')}
              style={styles.emptyTrackButton}
            />
          </SurfaceCard>
        ) : (
          <>
            <View style={styles.filterBlock}>
              <Text style={styles.sectionTitle}>FİLTRE</Text>
              <View style={styles.filterCapsule}>
                {subjectDefs.map((subject) => (
                  <Chip
                    key={subject.key}
                    label={subject.label}
                    selected={activeSubjectKey === subject.key}
                    onPress={() => setActiveSubjectKey(subject.key)}
                  />
                ))}
              </View>
            </View>

            {hasAnyMood || !hasTopicsForActiveSubject ? null : (
              <SurfaceCard style={styles.emptyCard} variant="outlined">
                <Text style={styles.emptyTitle}>Henüz bir his yok</Text>
                <Text style={styles.emptyHint}>
                  İstersen konuların üstüne durum işaretleyerek ritmini
                  görünür hale getirebilirsin.
                </Text>
              </SurfaceCard>
            )}

            <SurfaceCard style={styles.listCard}>
              <View style={styles.listHeader}>
                <View>
                  <Text style={styles.listTitle}>{listTitle}</Text>
                  <Text style={styles.listSubtitle}>
                    Toplam {filteredTopics.length} konu
                  </Text>
                </View>
              </View>
              {hasTopicsForActiveSubject ? (
                filteredTopics.map((topic) => {
                  const mood = getMood(topic.id);
                  return (
                    <View
                      key={topic.id}
                      style={[
                        styles.rowBase,
                      ]}
                    >
                      <View style={styles.rowText}>
                        <Text style={styles.rowSubject}>
                          {subjectLabelByKey[topic.subjectKey] ?? topic.subject}
                        </Text>
                        <Text
                          style={[
                            styles.rowTitle,
                            mood === 'GOOD' ? styles.rowTitleGood : null,
                            mood === 'NONE' ? styles.rowTitleMuted : null,
                          ]}
                        >
                          {topic.title}
                        </Text>
                      </View>
                      <View style={styles.moodActions}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Durumu değiştir: ${getMoodLabel(mood)}`}
                          onPress={() =>
                            setMood(topic.id, getNextMood(mood))
                          }
                          style={({ pressed }) => [
                            styles.moodButton,
                            mood === 'HARD' ? styles.moodButtonHard : null,
                            mood === 'GOOD' ? styles.moodButtonGood : null,
                            mood === 'NONE' ? styles.moodButtonNone : null,
                            pressed ? styles.moodButtonPressed : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.moodButtonText,
                              mood === 'HARD' ? styles.moodButtonTextHard : null,
                              mood === 'GOOD' ? styles.moodButtonTextGood : null,
                              mood === 'NONE' ? styles.moodButtonTextNone : null,
                            ]}
                          >
                            {getMoodLabel(mood)}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              ) : (
                <>
                  <Text style={styles.emptyListText}>Bu dersin konuları yakında.</Text>
                  <Text style={styles.emptyListHint}>
                    Şimdilik kayıt ekranından süre/soru girişi yapabilirsin.
                  </Text>
                </>
              )}
            </SurfaceCard>
          </>
        )}
      </ScrollView>
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
  backIcon: {
    transform: [{ rotate: '180deg' }],
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  filterBlock: {
    gap: spacing.sm,
  },
  filterCapsule: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  emptyCard: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyHint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  listCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  listSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  emptyListText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyListHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  rowBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  rowSubject: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  rowTitle: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '700',
  },
  rowTitleGood: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    textDecorationColor: colors.neutral400,
  },
  rowTitleMuted: {
    color: colors.textMuted,
  },
  moodActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  moodButton: {
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  moodButtonPressed: {
    opacity: 0.85,
  },
  moodButtonHard: {
    backgroundColor: colors.accentDeep,
    borderColor: colors.accentDeep,
  },
  moodButtonGood: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.borderStrong,
  },
  moodButtonNone: {
    backgroundColor: colors.chipBackground,
    borderColor: colors.border,
  },
  moodButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  moodButtonTextHard: {
    color: colors.surface,
  },
  moodButtonTextGood: {
    color: colors.textSecondary,
  },
  moodButtonTextNone: {
    color: colors.textSecondary,
  },
  emptyTrackCard: {
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  emptyTrackTitle: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyTrackHint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyTrackButton: {
    marginTop: spacing.sm,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
  },
});
