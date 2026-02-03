import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet } from '../components/BottomSheet';
import { Chip } from '../components/Chip';
import { DotRow } from '../components/DotRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextLink } from '../components/TextLink';
import { colors, radius, spacing } from '../lib/theme/tokens';

const CHIP_OPTIONS = ['Tümü', 'Mat', 'Türk', 'Fen', 'İnk'];

export function PlaygroundScreen() {
  const [selectedChip, setSelectedChip] = useState(CHIP_OPTIONS[0]);
  const [activeDay, setActiveDay] = useState(3);
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Playground</Text>

        <Section title="Primary Button">
          <PrimaryButton label="Bugün odaklandım" onPress={() => setSheetVisible(true)} />
          <PrimaryButton label="Disabled" disabled />
        </Section>

        <Section title="Text Link">
          <View style={styles.row}>
            <TextLink label="Günler →" />
            <TextLink label="Konular →" />
          </View>
        </Section>

        <Section title="Chip">
          <View style={styles.rowWrap}>
            {CHIP_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={selectedChip === option}
                onPress={() => setSelectedChip(option)}
              />
            ))}
          </View>
        </Section>

        <Section title="Dot Row">
          <View style={styles.dotRowHeader}>
            <Text style={styles.sectionMeta}>Bu hafta</Text>
            <Text style={styles.sectionMetaMuted}>Pzt başlangıç</Text>
          </View>
          <DotRow activeIndex={activeDay} onChange={setActiveDay} />
        </Section>

        <Section title="Bottom Sheet">
          <PrimaryButton label="Sheet Aç" onPress={() => setSheetVisible(true)} />
        </Section>
      </ScrollView>

      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title="Gün girişi"
      >
        <Text style={styles.sheetText}>
          Bu alan günlük giriş formu için ayrıldı. Şimdilik sadece örnek içerik
          gösteriyor.
        </Text>
        <PrimaryButton label="Kapat" onPress={() => setSheetVisible(false)} />
      </BottomSheet>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dotRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionMeta: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  sectionMetaMuted: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  sheetText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.lg,
  },
});
