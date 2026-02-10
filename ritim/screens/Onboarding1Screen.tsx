import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Chip } from '@/components/Chip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing } from '@/lib/theme/tokens';
import { TRACKS, type TrackId } from '@/lib/track/tracks';
import { useOnboarding } from '@/state/onboarding';
import { useSettings } from '@/state/settings';

export function Onboarding1Screen() {
  const router = useRouter();
  const { completed, hydrated } = useOnboarding();
  const { settings, updateSettings } = useSettings();
  const [selectedTrack, setSelectedTrack] = useState<TrackId | null>(
    settings.activeTrack
  );

  const handleSelectTrack = (trackId: TrackId) => {
    setSelectedTrack(trackId);
    updateSettings({ activeTrack: trackId });
  };

  useEffect(() => {
    if (settings.activeTrack) {
      setSelectedTrack(settings.activeTrack);
    }
  }, [settings.activeTrack]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (completed) {
      router.replace('/');
    }
  }, [completed, hydrated, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>
            Bu uygulama odaklanma ritmi kazanmanı kolaylaştırmak için var.
          </Text>

          <View style={styles.section}>
            <Text style={styles.subtitle}>Çalışma alanını seç</Text>
            <Text style={styles.sectionHint}>Bu, dersleri ve konuları belirler.</Text>
            <View style={styles.chipRow}>
              {TRACKS.map((track) => (
                <Chip
                  key={track.id}
                  label={track.shortLabel}
                  selected={selectedTrack === track.id}
                  onPress={() => handleSelectTrack(track.id)}
                />
              ))}
            </View>
          </View>

          <Text style={styles.helper}>
            Günde sadece 1 kez girmen yeterli. 30 saniyeden kısa sürer.
          </Text>
        </View>

        <PrimaryButton
          label="Devam"
          disabled={!selectedTrack}
          onPress={() => router.push('/onboarding-2')}
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
    justifyContent: 'space-between',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
  },
  content: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  subtitle: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionHint: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  helper: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
