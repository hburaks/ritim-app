import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Chip } from '@/components/Chip';
import { TextLink } from '@/components/TextLink';
import { colors, spacing } from '@/lib/theme/tokens';
import { useOnboarding } from '@/state/onboarding';
import { TopicSubject, useTopics } from '@/state/topics';

const FILTER_OPTIONS: { label: string; value: TopicSubject | 'ALL' }[] = [
  { label: 'Tümü', value: 'ALL' },
  { label: 'Mat', value: 'MAT' },
  { label: 'Türk', value: 'TURK' },
  { label: 'Fen', value: 'FEN' },
  { label: 'İnkılap', value: 'INK' },
];

export function TopicsScreen() {
  const router = useRouter();
  const { grade } = useOnboarding();
  const { topics, getMood, toggleMood } = useTopics();
  const [activeFilter, setActiveFilter] = useState<'ALL' | TopicSubject>('ALL');

  const filteredTopics = useMemo(() => {
    if (activeFilter === 'ALL') {
      return topics;
    }
    return topics.filter((topic) => topic.subject === activeFilter);
  }, [topics, activeFilter]);

  const headerSubtitle = grade ? `Sınıf: ${grade}` : undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Konular</Text>
            <TextLink label="← Geri" onPress={() => router.back()} textStyle={styles.backLink} />
          </View>
          {headerSubtitle ? <Text style={styles.subtitle}>{headerSubtitle}</Text> : null}
          <Text style={styles.description}>
            Bu hisler sadece senin için. Nerelere daha fazla odaklanman gerektiğini
            görmene yardımcı olur.
          </Text>
          <Text style={styles.moodHint}>Durumlar: Zor · İyi · —</Text>
        </View>

        <View style={styles.filters}>
          {FILTER_OPTIONS.map((filter) => (
            <Chip
              key={filter.value}
              label={filter.label}
              selected={activeFilter === filter.value}
              onPress={() => setActiveFilter(filter.value)}
            />
          ))}
        </View>

        <View style={styles.list}>
          {filteredTopics.map((topic) => {
            const mood = getMood(topic.id);
            return (
              <View key={topic.id} style={[styles.row, mood === 'HARD' ? styles.rowHard : null]}>
                <Text style={[styles.rowTitle, mood === 'GOOD' ? styles.rowTitleDone : null]}>
                  {topic.title}
                </Text>
                <View style={styles.moodActions}>
                  <Chip
                    label="Zor"
                    selected={mood === 'HARD'}
                    onPress={() => toggleMood(topic.id, 'HARD')}
                  />
                  <Chip
                    label="İyi"
                    selected={mood === 'GOOD'}
                    onPress={() => toggleMood(topic.id, 'GOOD')}
                  />
                </View>
              </View>
            );
          })}
        </View>
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
  header: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  backLink: {
    color: colors.accentDark,
    fontSize: 14,
    fontWeight: '600',
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
  },
  rowHard: {
    backgroundColor: colors.backgroundMuted,
    borderRadius: 12,
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  rowTitleDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    textDecorationColor: colors.neutral400,
  },
  moodActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  moodHint: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
