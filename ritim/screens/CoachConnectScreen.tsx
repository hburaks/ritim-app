import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SurfaceCard } from '@/components/SurfaceCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { signInWithGoogle } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import {
  consumeInvite,
  getErrorMessage,
  verifyInvite,
} from '@/lib/supabase/invites';
import { updateActiveTrack } from '@/lib/coach/coachApi';
import { setPendingInitialSync } from '@/lib/storage/pendingSyncStorage';
import { syncInitialLast30Days, syncInitialExamsLast30Days } from '@/lib/supabase/sync';
import { colors, radius, spacing } from '@/lib/theme/tokens';
import { useAuth } from '@/state/auth';
import { useExams } from '@/state/exams';
import { useRecords } from '@/state/records';
import { useSettings } from '@/state/settings';

type Step = 'code' | 'login' | 'name' | 'success';

type VerifiedCoach = {
  id: string;
  displayName: string;
};

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  browser_cancel: 'Giriş iptal edildi.',
  browser_dismiss: 'Giriş penceresi kapatıldı.',
  missing_tokens: 'Giriş bilgileri alınamadı. Lütfen tekrar dene.',
};

export function CoachConnectScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const { session } = useAuth();
  const { records } = useRecords();
  const { getAllExams } = useExams();

  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [verifiedCoach, setVerifiedCoach] = useState<VerifiedCoach | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nameBackTarget, setNameBackTarget] = useState<'code' | 'login'>('login');

  const handleBack = () => {
    setError(null);
    if (step === 'login') {
      setStep('code');
    } else if (step === 'name') {
      setStep(nameBackTarget);
    } else {
      router.back();
    }
  };

  const handleVerify = async () => {
    setError(null);
    setLoading(true);
    try {
      const normalizedCode = code.trim().toUpperCase();
      setCode(normalizedCode);
      const result = await verifyInvite(normalizedCode);
      if (result.ok) {
        setVerifiedCoach({ id: result.coach_id, displayName: result.coach_display_name });
        // Zaten login ise login adımını atla
        if (session) {
          setNameBackTarget('code');
          setStep('name');
        } else {
          setNameBackTarget('login');
          setStep('login');
        }
      } else {
        setError(getErrorMessage(result.error_code));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        setNameBackTarget('login');
        setStep('name');
      } else {
        const errorKey = typeof result.error === 'string' ? result.error : '';
        const msg = AUTH_ERROR_MESSAGES[errorKey] ?? 'Giriş yapılamadı. Lütfen tekrar dene.';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConsume = async () => {
    setError(null);
    setLoading(true);
    try {
      const normalizedCode = code.trim().toUpperCase();
      const trimmedDisplayName = displayName.trim();
      const result = await consumeInvite(normalizedCode, trimmedDisplayName);
      if (result.ok) {
        const {
          data: { session: freshSession },
        } = await supabase.auth.getSession();
        const effectiveSession = freshSession ?? session;

        updateSettings({
          coachConnected: true,
          coachName: verifiedCoach?.displayName ?? null,
          displayName: trimmedDisplayName,
          accountEmail: effectiveSession?.user?.email ?? null,
        });
        if (effectiveSession) {
          // Initial sync: daily + exams, with pending flag on failure
          Promise.all([
            syncInitialLast30Days(records, effectiveSession),
            syncInitialExamsLast30Days(getAllExams(), effectiveSession),
          ])
            .then(() => setPendingInitialSync(false))
            .catch((err) => {
              console.warn('[coach-connect] initial sync failed:', err);
              setPendingInitialSync(true);
            });
          // Sync active_track to profiles (best-effort)
          if (settings.activeTrack) {
            updateActiveTrack(settings.activeTrack).catch(console.warn);
          }
        }
        setStep('success');
      } else {
        setError(getErrorMessage(result.error_code));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    router.dismissAll();
    router.replace('/');
  };

  const showBackButton = step !== 'success';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            {showBackButton ? (
              <IconButton accessibilityLabel="Geri" onPress={handleBack}>
                <IconSymbol
                  name="chevron.right"
                  size={18}
                  color={colors.textSecondary}
                  style={styles.backIcon}
                />
              </IconButton>
            ) : (
              <View style={styles.backPlaceholder} />
            )}
            <Text style={styles.title}>
              {step === 'success' ? 'Bağlantı Tamamlandı' : 'Koça Bağlan'}
            </Text>
          </View>

          {step === 'code' && (
            <StepCode
              code={code}
              onChangeCode={setCode}
              onSubmit={handleVerify}
              loading={loading}
              error={error}
            />
          )}

          {step === 'login' && (
            <StepLogin
              coachName={verifiedCoach?.displayName ?? ''}
              onLogin={handleGoogleLogin}
              loading={loading}
              error={error}
            />
          )}

          {step === 'name' && (
            <StepName
              displayName={displayName}
              onChangeDisplayName={setDisplayName}
              onSubmit={handleConsume}
              loading={loading}
              error={error}
            />
          )}

          {step === 'success' && (
            <StepSuccess onGoHome={handleGoHome} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Step 1: Davet Kodu ───

function StepCode({
  code,
  onChangeCode,
  onSubmit,
  loading,
  error,
}: {
  code: string;
  onChangeCode: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}) {
  const trimmed = code.trim();
  const canSubmit = trimmed.length >= 4 && !loading;

  return (
    <View style={styles.stepContainer}>
      <SurfaceCard style={styles.card}>
        <Text style={styles.cardTitle}>Davet kodunu gir</Text>
        <Text style={styles.cardDescription}>
          Koçundan aldığın davet kodunu aşağıya yaz.
        </Text>
        <TextInput
          value={code}
          onChangeText={onChangeCode}
          placeholder="Örn: TEST01"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          style={styles.input}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </SurfaceCard>
      <PrimaryButton
        label={loading ? undefined : 'DEVAM ET'}
        onPress={onSubmit}
        disabled={!canSubmit}
        style={styles.actionButton}
        textStyle={styles.actionButtonText}
      >
        {loading ? <ActivityIndicator color={colors.surface} /> : undefined}
      </PrimaryButton>
    </View>
  );
}

// ─── Step 2: Google Login (Mock) ───

function StepLogin({
  coachName,
  onLogin,
  loading,
  error,
}: {
  coachName: string;
  onLogin: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <View style={styles.stepContainer}>
      <SurfaceCard style={styles.card}>
        <View style={styles.verifiedRow}>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>✓</Text>
          </View>
          <Text style={styles.verifiedText}>
            Kod doğrulandı – Koç: {coachName}
          </Text>
        </View>
        <View style={styles.cardDivider} />
        <Text style={styles.cardTitle}>Giriş yap</Text>
        <Text style={styles.cardDescription}>
          Koçlu mod için Google hesabınla giriş yap.
        </Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </SurfaceCard>
      <PrimaryButton
        label={loading ? undefined : 'GOOGLE İLE GİRİŞ YAP'}
        onPress={onLogin}
        disabled={loading}
        style={styles.actionButton}
        textStyle={styles.actionButtonText}
      >
        {loading ? <ActivityIndicator color={colors.surface} /> : undefined}
      </PrimaryButton>
    </View>
  );
}

// ─── Step 3: Görünen İsim ───

function StepName({
  displayName,
  onChangeDisplayName,
  onSubmit,
  loading,
  error,
}: {
  displayName: string;
  onChangeDisplayName: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}) {
  const trimmed = displayName.trim();
  const canSubmit = trimmed.length >= 1 && !loading;

  return (
    <View style={styles.stepContainer}>
      <SurfaceCard style={styles.card}>
        <Text style={styles.cardTitle}>Koçun seni hangi isimle görsün?</Text>
        <Text style={styles.cardDescription}>
          Bu isim yalnızca koçun tarafından görülecek.
        </Text>
        <TextInput
          value={displayName}
          onChangeText={onChangeDisplayName}
          placeholder="Adın"
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          maxLength={40}
          style={styles.input}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </SurfaceCard>
      <PrimaryButton
        label={loading ? undefined : 'BAĞLAN'}
        onPress={onSubmit}
        disabled={!canSubmit}
        style={styles.actionButton}
        textStyle={styles.actionButtonText}
      >
        {loading ? <ActivityIndicator color={colors.surface} /> : undefined}
      </PrimaryButton>
    </View>
  );
}

// ─── Step 4: Başarı ───

function StepSuccess({ onGoHome }: { onGoHome: () => void }) {
  return (
    <View style={styles.stepContainer}>
      <SurfaceCard style={styles.card}>
        <View style={styles.successIconContainer}>
          <IconSymbol name="checkmark.circle.fill" size={48} color={colors.accentDeep} />
        </View>
        <Text style={styles.successTitle}>Koçuna başarıyla bağlandın</Text>
        <Text style={styles.successDescription}>
          Artık ilerlemen koçunla paylaşılacak.
        </Text>
      </SurfaceCard>
      <PrimaryButton
        label="ANA SAYFAYA DÖN"
        onPress={onGoHome}
        style={styles.actionButton}
        textStyle={styles.actionButtonText}
      />
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
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
  backPlaceholder: {
    width: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepContainer: {
    gap: spacing.xl,
  },
  card: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textStrong,
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentDeep,
  },
  verifiedBadgeText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  verifiedText: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '600',
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
  successIconContainer: {
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textStrong,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
});
