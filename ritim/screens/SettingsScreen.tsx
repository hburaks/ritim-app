import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
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
import { colors, radius, spacing } from '@/lib/theme/tokens';
import { useRecords } from '@/state/records';
import {
  normalizeReminderTime,
  useSettings,
} from '@/state/settings';

export function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const { clearRecords } = useRecords();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [timeSheetVisible, setTimeSheetVisible] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [privacyVisible, setPrivacyVisible] = useState(false);

  const reminderTime = useMemo(
    () => normalizeReminderTime(settings.reminderTime),
    [settings.reminderTime]
  );
  const reminderEnabled = settings.remindersEnabled;

  useEffect(() => {
    if (!deleteMessage) {
      return undefined;
    }
    const handle = setTimeout(() => setDeleteMessage(null), 2500);
    return () => clearTimeout(handle);
  }, [deleteMessage]);

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
          <Text style={styles.sectionTitle}>VERİLER</Text>
          <SurfaceCard style={styles.card}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmVisible(true)}
              style={({ pressed }) => [
                styles.row,
                pressed ? styles.rowPressed : null,
              ]}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Tüm kayıtları sil</Text>
                <Text style={styles.rowSubtitle}>Bu işlem geri alınamaz.</Text>
              </View>
              <IconSymbol name="trash" size={18} color={colors.textSecondary} />
            </Pressable>
          </SurfaceCard>
          {deleteMessage ? (
            <Text style={styles.helperText}>{deleteMessage}</Text>
          ) : null}
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
        visible={confirmVisible}
        title="Tüm kayıtları sil?"
        message="Tüm kayıtların bu cihazdan silinecek."
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => {
          clearRecords();
          setConfirmVisible(false);
          setDeleteMessage('Tüm kayıtlar silindi.');
        }}
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
});
