import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Chip } from '@/components/Chip';
import { IconButton } from '@/components/IconButton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SurfaceCard } from '@/components/SurfaceCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { colors, radius, spacing } from '@/lib/theme/tokens';
import { getSubjectsForActiveTrack } from '@/lib/track/selectors';
import { buildExamDisplayNames } from '@/lib/exams/examName';
import { useExams } from '@/state/exams';
import { useSettings } from '@/state/settings';
import type { ExamRecord } from '@/types/exam';
import { calculateNet } from '@/types/exam';

type ExamTypeFilter = 'ALL' | 'FULL' | 'BRANCH';
type SortOption = 'DATE_DESC' | 'DATE_ASC' | 'NET_DESC';

const MONTH_NAMES = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];

const TYPE_FILTERS: Array<{ value: ExamTypeFilter; label: string }> = [
  { value: 'ALL', label: 'Hepsi' },
  { value: 'FULL', label: 'FULL' },
  { value: 'BRANCH', label: 'Branş' },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'DATE_DESC', label: 'Yeni' },
  { value: 'DATE_ASC', label: 'Eski' },
  { value: 'NET_DESC', label: 'Net' },
];

export function ExamsScreen() {
  const router = useRouter();
  const { settings } = useSettings();
  const { getExamsForTrack, removeExam } = useExams();
  const activeTrack = settings.activeTrack;
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDeleteExam, setPendingDeleteExam] = useState<{ id: string; name: string } | null>(null);
  const [typeFilter, setTypeFilter] = useState<ExamTypeFilter>('ALL');
  const [branchSubjectFilter, setBranchSubjectFilter] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('DATE_DESC');
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Record<string, boolean>>({});

  const exams = useMemo(
    () => (activeTrack ? getExamsForTrack(activeTrack) : []),
    [activeTrack, getExamsForTrack],
  );

  const subjectDefs = useMemo(
    () => (activeTrack ? getSubjectsForActiveTrack(activeTrack) : []),
    [activeTrack],
  );

  const subjectLabelByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const subject of subjectDefs) {
      map.set(subject.key, subject.label);
    }
    return map;
  }, [subjectDefs]);

  const displayNames = useMemo(
    () => (activeTrack ? buildExamDisplayNames(exams, activeTrack) : new Map<string, string>()),
    [exams, activeTrack],
  );

  useEffect(() => {
    if (typeFilter !== 'BRANCH' && branchSubjectFilter) {
      setBranchSubjectFilter(null);
    }
  }, [typeFilter, branchSubjectFilter]);

  const getExamNet = (exam: ExamRecord) => {
    if (!activeTrack) return 0;
    return calculateNet(activeTrack, exam.correctTotal, exam.wrongTotal);
  };

  const filteredExams = useMemo(() => {
    const list = [...exams];

    let filtered = list;
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter((exam) => exam.type === typeFilter);
    }

    if (typeFilter === 'BRANCH' && branchSubjectFilter) {
      filtered = filtered.filter(
        (exam) => exam.type === 'BRANCH' && exam.subjectKey === branchSubjectFilter,
      );
    }

    if (sortOption === 'DATE_DESC') {
      filtered.sort((a, b) => b.date.localeCompare(a.date) || b.createdAtMs - a.createdAtMs);
    } else if (sortOption === 'DATE_ASC') {
      filtered.sort((a, b) => a.date.localeCompare(b.date) || a.createdAtMs - b.createdAtMs);
    } else {
      filtered.sort((a, b) => {
        const netDiff = getExamNet(b) - getExamNet(a);
        if (Math.abs(netDiff) > 0.0001) return netDiff;
        return b.date.localeCompare(a.date) || b.createdAtMs - a.createdAtMs;
      });
    }

    return filtered;
  }, [exams, typeFilter, branchSubjectFilter, sortOption, activeTrack]);

  const getSubjectLabel = (key: string) => {
    return subjectLabelByKey.get(key) ?? key;
  };

  const getBreakdownRows = (exam: ExamRecord) => {
    if (!exam.subjectScores) return [];

    const subjectScores = exam.subjectScores;
    const orderedKeys: string[] = [];

    for (const subject of subjectDefs) {
      if (subjectScores[subject.key]) {
        orderedKeys.push(subject.key);
      }
    }

    for (const key of Object.keys(subjectScores)) {
      if (!orderedKeys.includes(key)) {
        orderedKeys.push(key);
      }
    }

    return orderedKeys
      .map((key) => ({ key, scores: subjectScores[key] }))
      .filter((row) => row.scores.correct > 0 || row.scores.wrong > 0 || row.scores.blank > 0);
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setPendingDeleteExam({ id, name });
    setConfirmVisible(true);
  };

  const handleDeleteConfirm = () => {
    if (!pendingDeleteExam) {
      setConfirmVisible(false);
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    removeExam(pendingDeleteExam.id);
    setPendingDeleteExam(null);
    setConfirmVisible(false);
  };

  const handleDeleteCancel = () => {
    setPendingDeleteExam(null);
    setConfirmVisible(false);
  };

  const toggleBreakdown = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedBreakdowns((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatDate = (dateKey: string) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    return `${day} ${MONTH_NAMES[(month ?? 1) - 1]} ${year}`;
  };

  const renderItem = ({ item }: { item: ExamRecord }) => {
    if (!activeTrack) return null;
    const net = getExamNet(item);
    const displayName = displayNames.get(item.id) ?? '';
    const breakdownRows = getBreakdownRows(item);
    const canToggleBreakdown = item.type === 'FULL' && breakdownRows.length > 0;
    const breakdownExpanded = !!expandedBreakdowns[item.id];

    return (
      <SurfaceCard style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
            <Text style={styles.cardType}>{displayName}</Text>
          </View>

          <View style={styles.cardHeaderRight}>
            <View
              style={[
                styles.typeBadge,
                item.type === 'FULL' ? styles.typeBadgeFull : styles.typeBadgeBranch,
              ]}
            >
              <Text style={styles.typeBadgeText}>{item.type}</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sil"
              onPress={() => handleDeleteRequest(item.id, displayName)}
              style={({ pressed }) => [styles.deleteButton, pressed ? { opacity: 0.6 } : null]}
            >
              <IconSymbol name="trash" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.scoreWrap}>
          <Text style={styles.scoreLine}>
            {item.correctTotal}D {item.wrongTotal}Y {item.blankTotal}B
            {item.durationMinutes ? ` · ${item.durationMinutes} dk` : ''}
          </Text>
          <Text style={styles.netLine}>{net.toFixed(1)} net</Text>
        </View>

        {canToggleBreakdown ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={breakdownExpanded ? 'Ders dağılımını gizle' : 'Ders dağılımını göster'}
            onPress={() => toggleBreakdown(item.id)}
            style={({ pressed }) => [styles.breakdownToggle, pressed ? { opacity: 0.7 } : null]}
          >
            <Text style={styles.breakdownToggleText}>
              {breakdownExpanded ? 'Ders dağılımını gizle' : 'Ders dağılımını göster'}
            </Text>
          </Pressable>
        ) : null}

        {canToggleBreakdown && breakdownExpanded ? (
          <View style={styles.breakdownSection}>
            {breakdownRows.map(({ key, scores }) => {
              const subjectNet = calculateNet(activeTrack, scores.correct, scores.wrong);
              return (
                <View key={key} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{getSubjectLabel(key)}</Text>
                  <Text style={styles.breakdownDetail}>
                    {scores.correct}D {scores.wrong}Y {scores.blank}B · {subjectNet.toFixed(1)} net
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </SurfaceCard>
    );
  };

  const emptyTitle = exams.length === 0 ? 'Henüz deneme yok' : 'Filtreye uygun deneme yok';
  const emptyText = exams.length === 0
    ? 'Günlük kaydını eklerken deneme girişi yapabilirsin.'
    : 'Filtreleri değiştirerek farklı denemeleri görüntüleyebilirsin.';
  const hasActiveControls =
    typeFilter !== 'ALL' || branchSubjectFilter !== null || sortOption !== 'DATE_DESC';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <IconButton accessibilityLabel="Geri" onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={18} color={colors.iconMuted} />
          </IconButton>

          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>DENEMELER</Text>
            <Text style={styles.subtitle}>Deneme geçmişini gözden geçir</Text>
          </View>
        </View>

        <SurfaceCard style={styles.controlsCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Toplam {exams.length} deneme</Text>
            {filteredExams.length !== exams.length ? (
              <Text style={styles.summaryMuted}>Gösterilen {filteredExams.length}</Text>
            ) : null}
          </View>

          <View style={styles.controlGroup}>
            <View style={styles.controlHeaderRow}>
              <Text style={styles.controlLabel}>Filtreler</Text>
              {hasActiveControls ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Filtre ve sıralamayı sıfırla"
                  onPress={() => {
                    setTypeFilter('ALL');
                    setBranchSubjectFilter(null);
                    setSortOption('DATE_DESC');
                  }}
                  style={({ pressed }) => [pressed ? { opacity: 0.7 } : null]}
                >
                  <Text style={styles.resetText}>Sıfırla</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.segmentRow}>
              {TYPE_FILTERS.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: typeFilter === option.value }}
                  onPress={() => setTypeFilter(option.value)}
                  style={({ pressed }) => [
                    styles.segmentOption,
                    typeFilter === option.value ? styles.segmentOptionActive : null,
                    pressed ? { opacity: 0.75 } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentOptionText,
                      typeFilter === option.value ? styles.segmentOptionTextActive : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {typeFilter === 'BRANCH' ? (
            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>Ders</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalChipContent}
              >
                <Chip
                  label="Hepsi"
                  selected={!branchSubjectFilter}
                  onPress={() => setBranchSubjectFilter(null)}
                />
                {subjectDefs.map((subject) => (
                  <Chip
                    key={subject.key}
                    label={subject.label}
                    selected={branchSubjectFilter === subject.key}
                    onPress={() => setBranchSubjectFilter(subject.key)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>Sıralama</Text>
            <View style={styles.segmentRow}>
              {SORT_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sortOption === option.value }}
                  onPress={() => setSortOption(option.value)}
                  style={({ pressed }) => [
                    styles.segmentOption,
                    sortOption === option.value ? styles.segmentOptionActive : null,
                    pressed ? { opacity: 0.75 } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentOptionText,
                      sortOption === option.value ? styles.segmentOptionTextActive : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.sortHint}>
              {sortOption === 'DATE_DESC'
                ? 'Tarih: yeni tarihten eskiye'
                : sortOption === 'DATE_ASC'
                  ? 'Tarih: eski tarihten yeniye'
                  : 'Net: yüksekten düşüğe'}
            </Text>
          </View>
        </SurfaceCard>

        <FlatList
          data={filteredExams}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <SurfaceCard style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <IconSymbol name="doc.text" size={28} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>{emptyTitle}</Text>
              <Text style={styles.emptyText}>{emptyText}</Text>
            </SurfaceCard>
          }
        />
      </View>

      <ConfirmDialog
        visible={confirmVisible}
        title="Deneme silinsin mi?"
        message={
          pendingDeleteExam
            ? `"${pendingDeleteExam.name}" denemesi silinecek.`
            : 'Bu deneme silinecek.'
        }
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
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
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTextWrap: {
    gap: 2,
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
  },
  controlsCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  summaryMuted: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  controlGroup: {
    gap: spacing.xs,
  },
  controlHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accentDeep,
  },
  horizontalChipContent: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.xl,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: colors.chipBackground,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
  },
  segmentOption: {
    flex: 1,
    minHeight: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  segmentOptionActive: {
    backgroundColor: colors.accentDeep,
  },
  segmentOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  segmentOptionTextActive: {
    color: colors.surface,
  },
  sortHint: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cardHeaderLeft: {
    flex: 1,
    gap: 2,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardDate: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cardType: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  typeBadgeFull: {
    backgroundColor: colors.accentSoft,
  },
  typeBadgeBranch: {
    backgroundColor: colors.accentBlueSoft,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textStrong,
    letterSpacing: 0.3,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.capsule,
  },
  scoreWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  scoreLine: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  netLine: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.accentDeep,
  },
  breakdownToggle: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  breakdownToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accentDeep,
  },
  breakdownSection: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  breakdownDetail: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
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
});
