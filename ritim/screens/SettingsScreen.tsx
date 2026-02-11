import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

import { BottomSheet } from '@/components/BottomSheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SurfaceCard } from '@/components/SurfaceCard';
import { TextLink } from '@/components/TextLink';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  cancelAllRitimNotifications,
  cancelScheduledReminder,
  requestPermissionsIfNeeded,
} from '@/lib/notifications/ritimNotifications';
import { signOut } from '@/lib/supabase/auth';
import { colors, radius, spacing } from '@/lib/theme/tokens';
import { TRACKS, getTrackById, type TrackId } from '@/lib/track/tracks';
import { updateActiveTrack } from '@/lib/coach/coachApi';
import {
  normalizeReminderTime,
  useSettings,
} from '@/state/settings';
import { useAuth } from '@/state/auth';

export function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const { session } = useAuth();
  const [timeSheetVisible, setTimeSheetVisible] = useState(false);
  const [displayNameSheetVisible, setDisplayNameSheetVisible] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [disconnectVisible, setDisconnectVisible] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [trackSheetVisible, setTrackSheetVisible] = useState(false);

  const reminderTime = useMemo(
    () => normalizeReminderTime(settings.reminderTime),
    [settings.reminderTime]
  );
  const reminderEnabled = settings.remindersEnabled;
  const coachNote = useMemo(() => settings.coachNote?.trim() ?? null, [settings.coachNote]);
  const coachName = useMemo(() => settings.coachName?.trim() ?? null, [settings.coachName]);
  const displayName = useMemo(() => settings.displayName?.trim() ?? null, [settings.displayName]);
  const accountEmail = useMemo(() => settings.accountEmail?.trim() ?? null, [settings.accountEmail]);
  const coachConnected = settings.coachConnected || !!coachNote || !!coachName;
  const hasAccount = !!accountEmail;
  const activeTrackLabel = useMemo(
    () => (settings.activeTrack ? getTrackById(settings.activeTrack).label : '—'),
    [settings.activeTrack]
  );

  const handleTrackSelect = (trackId: TrackId) => {
    updateSettings({ activeTrack: trackId });
    setTrackSheetVisible(false);
    // Best-effort sync to profiles.active_track
    if (session) {
      updateActiveTrack(trackId).catch(console.warn);
    }
  };

  const versionLabel =
    Constants.expoConfig?.version ??
    Constants.manifest?.version ??
    '1.0.0';

  const handleToggle = async (nextValue: boolean) => {
    setPermissionMessage(null);
    if (!nextValue) {
      updateSettings({ remindersEnabled: false, scheduledNotificationId: null });
      await cancelScheduledReminder(settings.scheduledNotificationId);
      await cancelAllRitimNotifications();
      return;
    }

    const granted = await requestPermissionsIfNeeded();
    if (!granted) {
      updateSettings({ remindersEnabled: false, scheduledNotificationId: null });
      setPermissionMessage('Bildirim izni kapalı. Ayarlardan açabilirsin.');
      return;
    }

    updateSettings({ remindersEnabled: true });
  };

  const handleTimePress = () => {
    if (!reminderEnabled) {
      return;
    }
    setTimeSheetVisible(true);
  };

  const handleFeedback = () => {
    const email = 'contact.arklabs@gmail.com';
    const subject = encodeURIComponent('Ritim Geri Bildirim');
    const mailto = `mailto:${email}?subject=${subject}`;
    Linking.openURL(mailto).catch(() => {
      Alert.alert('Geri bildirim', 'Mail uygulaması açılamadı.');
    });
  };

  const handleCoachConnect = () => {
    router.push('/coach-connect');
  };

  const handleCoachMode = () => {
    router.push('/coach');
  };

  const handleDisplayNameOpen = () => {
    setDisplayNameDraft(displayName ?? '');
    setDisplayNameSheetVisible(true);
  };

  const handleDisplayNameSave = () => {
    const nextName = displayNameDraft.trim();
    updateSettings({ displayName: nextName.length ? nextName : null });
    setDisplayNameSheetVisible(false);
  };

  const handleDisconnectConfirm = () => {
    updateSettings({
      coachConnected: false,
      coachNote: null,
      coachName: null,
    });
    setDisconnectVisible(false);
  };

  const handleLogout = async () => {
    await signOut();
    updateSettings({
      accountEmail: null,
      coachConnected: false,
      coachNote: null,
      coachName: null,
      displayName: null,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <IconButton accessibilityLabel="Geri" onPress={() => router.back()}>
            <IconSymbol
              name="chevron.right"
              size={18}
              color={colors.textSecondary}
              style={styles.backIcon}
            />
          </IconButton>
          <Text style={styles.title}>Ayarlar</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ÇALIŞMA ALANI</Text>
          <SurfaceCard style={styles.card}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setTrackSheetVisible(true)}
              style={({ pressed }) => [
                styles.row,
                pressed ? styles.rowPressed : null,
              ]}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Aktif Track</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{activeTrackLabel}</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.iconMuted} />
              </View>
            </Pressable>
          </SurfaceCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KOÇ</Text>
          <SurfaceCard style={[styles.card, styles.coachCard]}>
            {coachConnected ? (
              <>
                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>Bağlı Koç</Text>
                    <Text style={styles.rowSubtitle}>{coachName ?? '—'}</Text>
                  </View>
                </View>
                <View style={styles.rowDivider} />
                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>Görünen İsim</Text>
                    <Text style={styles.rowSubtitle}>{displayName ?? '—'}</Text>
                  </View>
                </View>
                <View style={styles.rowDivider} />
                <Pressable
                  accessibilityRole="button"
                  onPress={handleDisplayNameOpen}
                  style={({ pressed }) => [
                    styles.row,
                    pressed ? styles.rowPressed : null,
                  ]}
                >
                  <Text style={styles.rowTitle}>Görünen ismi değiştir</Text>
                  <IconSymbol name="chevron.right" size={16} color={colors.iconMuted} />
                </Pressable>
                <View style={styles.rowDivider} />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDisconnectVisible(true)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed ? styles.rowPressed : null,
                  ]}
                >
                  <Text style={[styles.rowTitle, styles.destructiveText]}>
                    Koçla bağlantıyı kes
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>Koç bağlantısı yok</Text>
                    <Text style={styles.rowSubtitle}>
                      Şu anda bir koça bağlı değilsin.
                    </Text>
                  </View>
                </View>
                <View style={styles.coachCta}>
                  <PrimaryButton label="KOÇA BAĞLAN" onPress={handleCoachConnect} />
                </View>
              </>
            )}
          </SurfaceCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HESAP</Text>
          <SurfaceCard style={styles.card}>
            {hasAccount ? (
              <>
                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>Google</Text>
                    <Text style={styles.rowSubtitle}>{accountEmail}</Text>
                  </View>
                </View>
                <View style={styles.rowDivider} />
              </>
            ) : (
              <>
                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>Giriş yapılmadı</Text>
                    <Text style={styles.rowSubtitle}>
                      Hesap bağlantısı bulunamadı.
                    </Text>
                  </View>
                </View>
                <View style={styles.rowDivider} />
              </>
            )}
            <Pressable
              accessibilityRole="button"
              disabled={!hasAccount}
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.row,
                pressed ? styles.rowPressed : null,
                !hasAccount ? styles.rowDisabled : null,
              ]}
            >
              <Text style={styles.rowTitle}>Çıkış yap</Text>
            </Pressable>
          </SurfaceCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HATIRLATICILAR</Text>
          <SurfaceCard style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Günlük hatırlatıcı</Text>
                <Text style={styles.rowSubtitle}>
                  Her gün kısa bir hatırlatma gönderir.
                </Text>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={handleToggle}
                trackColor={{ false: colors.neutral300, true: colors.accentSoft }}
                thumbColor={reminderEnabled ? colors.accentDeep : colors.neutral100}
                ios_backgroundColor={colors.neutral300}
              />
            </View>
            <View style={styles.rowDivider} />
            <Pressable
              accessibilityRole="button"
              disabled={!reminderEnabled}
              onPress={handleTimePress}
              style={({ pressed }) => [
                styles.row,
                pressed && reminderEnabled ? styles.rowPressed : null,
                !reminderEnabled ? styles.rowDisabled : null,
              ]}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Saat</Text>
              </View>
              <View style={styles.rowRight}>
                <Text
                  style={[
                    styles.rowValue,
                    !reminderEnabled ? styles.rowValueDisabled : null,
                  ]}
                >
                  {reminderTime}
                </Text>
                <IconSymbol name="chevron.right" size={16} color={colors.iconMuted} />
              </View>
            </Pressable>
          </SurfaceCard>
          {permissionMessage ? (
            <Text style={styles.helperText}>{permissionMessage}</Text>
          ) : null}
        </View>


        <View style={styles.section}>
          <SurfaceCard style={styles.card}>
            <Pressable
              accessibilityRole="button"
              onPress={handleCoachMode}
              style={({ pressed }) => [
                styles.row,
                pressed ? styles.rowPressed : null,
              ]}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Koç Moduna Geç</Text>
                <Text style={styles.rowSubtitle}>
                  Öğrencilerini görüntüle ve takip et.
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.iconMuted} />
            </Pressable>
          </SurfaceCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HAKKINDA</Text>
          <SurfaceCard style={styles.card}>
            <View style={styles.aboutHeader}>
              <Text style={styles.appName}>Ritim</Text>
              <Text style={styles.appVersion}>Sürüm: {versionLabel}</Text>
            </View>
            <View style={styles.rowDivider} />
            <TextLink
              label="Geri bildirim"
              onPress={handleFeedback}
              style={styles.linkRow}
              textStyle={styles.linkText}
            />
            <View style={styles.rowDivider} />
            <TextLink
              label="Gizlilik"
              onPress={() => setPrivacyVisible(true)}
              style={styles.linkRow}
              textStyle={styles.linkText}
            />
          </SurfaceCard>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={disconnectVisible}
        title="Koçla bağlantıyı kes?"
        message="Koçun ilerlemeni artık göremeyecek."
        confirmLabel="Bağlantıyı Kes"
        cancelLabel="Vazgeç"
        onCancel={() => setDisconnectVisible(false)}
        onConfirm={handleDisconnectConfirm}
      />

      <BottomSheet
        visible={timeSheetVisible}
        onClose={() => setTimeSheetVisible(false)}
        title="Saat"
      >
        <View style={styles.sheetActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setTimeSheetVisible(false)}
            style={({ pressed }) => [
              styles.sheetCancel,
              pressed ? styles.sheetActionPressed : null,
            ]}
          >
            <Text style={styles.sheetCancelText}>Vazgeç</Text>
          </Pressable>
          <PrimaryButton
            label="Kaydet"
            onPress={() => setTimeSheetVisible(false)}
            style={styles.sheetSave}
            textStyle={styles.sheetSaveText}
          />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={displayNameSheetVisible}
        onClose={() => setDisplayNameSheetVisible(false)}
        title="Görünen isim"
      >
        <View style={styles.sheetField}>
          <Text style={styles.sheetLabel}>GÖRÜNEN İSİM</Text>
          <TextInput
            value={displayNameDraft}
            onChangeText={setDisplayNameDraft}
            placeholder={displayName ?? 'Adın'}
            placeholderTextColor={colors.textMuted}
            style={styles.sheetInput}
          />
        </View>
        <View style={styles.sheetActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDisplayNameSheetVisible(false)}
            style={({ pressed }) => [
              styles.sheetCancel,
              pressed ? styles.sheetActionPressed : null,
            ]}
          >
            <Text style={styles.sheetCancelText}>Vazgeç</Text>
          </Pressable>
          <PrimaryButton
            label="Kaydet"
            onPress={handleDisplayNameSave}
            style={styles.sheetSave}
            textStyle={styles.sheetSaveText}
          />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={privacyVisible}
        onClose={() => setPrivacyVisible(false)}
        title="Gizlilik"
      >
        <View style={styles.privacyBody}>
          <Text style={styles.privacyText}>
            Gizlilik metni şimdilik doldurulacak.
          </Text>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={trackSheetVisible}
        onClose={() => setTrackSheetVisible(false)}
        title="Çalışma Alanı"
      >
        <View style={styles.trackList}>
          {TRACKS.map((track) => {
            const isActive = settings.activeTrack === track.id;
            return (
              <Pressable
                key={track.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
                onPress={() => handleTrackSelect(track.id)}
                style={({ pressed }) => [
                  styles.trackOption,
                  isActive ? styles.trackOptionActive : null,
                  pressed ? styles.trackOptionPressed : null,
                ]}
              >
                <View style={[styles.trackRadio, isActive ? styles.trackRadioActive : null]} />
                <Text style={[styles.trackOptionText, isActive ? styles.trackOptionTextActive : null]}>
                  {track.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.xl,
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backIcon: {
    transform: [{ rotate: '180deg' }],
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  card: {
    paddingVertical: spacing.sm,
  },
  coachCard: {
    paddingBottom: spacing.lg,
  },
  coachCta: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  rowTitle: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '700',
  },
  destructiveText: {
    color: colors.textPrimary,
  },
  rowSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  rowValueDisabled: {
    color: colors.textMuted,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  rowPressed: {
    opacity: 0.75,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  aboutHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  appName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textStrong,
  },
  appVersion: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  linkRow: {
    alignSelf: 'stretch',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  sheetField: {
    gap: spacing.sm,
  },
  sheetLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  sheetInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 15,
    backgroundColor: colors.surface,
  },
  sheetCancel: {
    flex: 1,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sheetCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sheetSave: {
    flex: 1,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.accentDeep,
  },
  sheetSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
  sheetActionPressed: {
    opacity: 0.8,
  },
  privacyBody: {
    gap: spacing.sm,
  },
  privacyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  trackList: {
    gap: spacing.sm,
  },
  trackOption: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  trackOptionActive: {
    borderColor: colors.accentDeep,
    backgroundColor: colors.accentSoft,
  },
  trackOptionPressed: {
    opacity: 0.85,
  },
  trackRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  trackRadioActive: {
    borderColor: colors.accentDeep,
    backgroundColor: colors.accentDeep,
  },
  trackOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  trackOptionTextActive: {
    color: colors.textPrimary,
  },
});
