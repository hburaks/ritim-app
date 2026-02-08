// T2.3: Mock verify/consume fonksiyonları
// T2.4'te gerçek Supabase RPC çağrılarıyla değiştirilecek

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

// Mock: T2.4'te supabase.rpc('verify_invite', ...) ile değiştirilecek
export async function verifyInvite(code: string): Promise<VerifyResult> {
  await delay(600);

  const upper = code.trim().toUpperCase();

  if (upper === 'TEST01') {
    return { ok: true, coach_id: 'mock-coach-id', coach_display_name: 'Ahmet Yılmaz' };
  }
  if (upper === 'EXPIRED') {
    return { ok: false, error_code: 'EXPIRED' };
  }
  if (upper === 'USED01') {
    return { ok: false, error_code: 'USED' };
  }
  if (upper === 'REVOKED') {
    return { ok: false, error_code: 'REVOKED' };
  }
  if (upper === 'LIMIT1') {
    return { ok: false, error_code: 'COACH_LIMIT' };
  }

  return { ok: false, error_code: 'INVALID_CODE' };
}

// Mock: T2.4'te supabase.rpc('consume_invite', ...) ile değiştirilecek
export async function consumeInvite(
  _code: string,
  _displayName: string,
): Promise<ConsumeResult> {
  await delay(400);
  return { ok: true, coach_id: 'mock-coach-id' };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
