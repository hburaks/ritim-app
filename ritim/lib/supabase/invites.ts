import { supabase } from './client';

export type VerifyResult =
  | { ok: true; coach_id: string; coach_display_name: string }
  | { ok: false; error_code: string };

export type ConsumeResult =
  | { ok: true; coach_id: string }
  | { ok: false; error_code: string };

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CODE: 'Davet kodu geçerli değil.',
  EXPIRED: 'Bu davet kodunun süresi dolmuş.',
  USED: 'Bu davet kodu daha önce kullanılmış.',
  REVOKED: 'Bu davet kodu iptal edilmiş.',
  COACH_LIMIT: 'Koç şu an yeni öğrenci kabul edemiyor.',
  ALREADY_CONNECTED: 'Zaten bir koça bağlısın.',
  AUTH_REQUIRED: 'Giriş yapman gerekiyor.',
  NETWORK_ERROR: 'Bağlantı hatası. Lütfen tekrar dene.',
};

export function getErrorMessage(errorCode: string): string {
  return ERROR_MESSAGES[errorCode] ?? 'Beklenmeyen bir hata oluştu.';
}

export async function verifyInvite(code: string): Promise<VerifyResult> {
  const { data, error } = await supabase.rpc('verify_invite', {
    invite_code: code.trim(),
  });

  if (error) {
    return { ok: false, error_code: 'NETWORK_ERROR' };
  }

  return data as VerifyResult;
}

export async function consumeInvite(
  code: string,
  displayName: string,
): Promise<ConsumeResult> {
  const { data, error } = await supabase.rpc('consume_invite', {
    invite_code: code.trim(),
    student_display_name: displayName.trim(),
  });

  if (error) {
    return { ok: false, error_code: 'NETWORK_ERROR' };
  }

  return data as ConsumeResult;
}
