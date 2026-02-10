## T2.3 – Koça Bağlan Akışı UI (Kod → Login → İsim)

> **Durum: TAMAMLANDI**
> T2.3 ve T2.4 birlikte uygulandı. Mock aşaması atlanıp direkt gerçek backend'e bağlandı.

### Amaç
Öğrencinin koça bağlanabilmesi için gerekli tüm ekranların ve akışın UI tarafını hazırlamak.

> Önemli kural:
> Önce davet kodu girilecek, kod geçerliyse login ekranına geçilecek.
> Kod girmeyen öğrenci Google login yapamayacak.

---

### Akış Sırası

1. Kullanıcı "Koça bağlan"a tıklar (Home veya Settings'ten)
2. Davet kodu ekranı açılır
3. Kod doğrulanır → `verifyInvite(code)` (Supabase RPC)
4. Kod geçerliyse Google login ekranına yönlendirilir (zaten login ise atlanır)
5. Login başarılı olursa "Görünen isim" ekranı açılır
6. "Bağlan" ile akış tamamlanır → `consumeInvite(code, name)` (Supabase RPC)

---

### Teknik Uygulama

**Mimari:** Tek ekran (`CoachConnectScreen.tsx`) içinde step-based akış.
Ayrı route/sayfa yerine `step` state'i kullanılıyor: `'code' | 'login' | 'name' | 'success'`

**Dosyalar:**
- `screens/CoachConnectScreen.tsx` – 4 adımlı akış
- `lib/supabase/invites.ts` – verifyInvite(), consumeInvite(), getErrorMessage()
- `lib/supabase/auth.ts` – signInWithGoogle() (expo-auth-session + expo-web-browser)
- `lib/supabase/client.ts` – Supabase client singleton
- `state/auth.tsx` – AuthProvider (session context)

---

## STEP 1 – Davet Kodu Girişi

### Layout

```
+----------------------------------+
| ← KOÇA BAĞLAN                   |
+----------------------------------+

  [Card]
  Davet kodunu gir
  Koçundan aldığın davet kodunu aşağıya yaz.
  [ __________ ]
  (hata mesajı)

  [ DEVAM ET ]
```

### Davranış

- Input boşken veya 4 karakterden kısayken DEVAM ET disabled
- autoCapitalize="characters", maxLength=8
- "DEVAM ET" basınca → `verifyInvite(code)` çağrılır
- Loading state: buton ActivityIndicator gösterir
- Başarılı → session varsa Step 3'e, yoksa Step 2'ye geçer
- Başarısız → hata mesajı gösterir

### Hata Mesajları

| error_code | UI Mesajı |
|-----------|-----------|
| INVALID_CODE | Davet kodu geçerli değil. |
| EXPIRED | Bu davet kodunun süresi dolmuş. |
| USED | Bu davet kodu daha önce kullanılmış. |
| REVOKED | Bu davet kodu iptal edilmiş. |
| COACH_LIMIT | Koç şu an yeni öğrenci kabul edemiyor. |
| NETWORK_ERROR | Bağlantı hatası. Lütfen tekrar dene. |

---

## STEP 2 – Google Login

### Layout

```
+----------------------------------+
| ← KOÇA BAĞLAN                   |
+----------------------------------+

  [Card]
  ✓ Kod doğrulandı – Koç: {coach_display_name}
  ─────
  Giriş yap
  Koçlu mod için Google hesabınla giriş yap.
  (hata mesajı)

  [ GOOGLE İLE GİRİŞ YAP ]
```

### Davranış

- Eğer kullanıcı zaten login ise (session var):
  - Bu adım otomatik atlanır (verify sonrası direkt Step 3'e geçer)
- Butona basınca → `signInWithGoogle()` çağrılır
  - expo-auth-session ile in-app browser açılır
  - Google hesap seçimi yapılır
  - Redirect ile token'lar alınır
- Login başarısız olursa hata mesajı gösterilir:
  - `browser_cancel` → "Giriş iptal edildi."
  - `browser_dismiss` → "Giriş penceresi kapatıldı."
  - `missing_tokens` → "Giriş bilgileri alınamadı. Lütfen tekrar dene."
  - Diğer → "Giriş yapılamadı. Lütfen tekrar dene."
- Başarılı login sonrası Step 3 açılır

---

## STEP 3 – Görünen İsim

### Layout

```
+----------------------------------+
| ← KOÇA BAĞLAN                   |
+----------------------------------+

  [Card]
  Koçun seni hangi isimle görsün?
  Bu isim yalnızca koçun tarafından görülecek.
  [ __________ ]
  (hata mesajı)

  [ BAĞLAN ]
```

### Davranış

- İsim alanı boş olamaz (boşken BAĞLAN disabled)
- maxLength=40
- "BAĞLAN" basınca → `consumeInvite(code, displayName)` çağrılır
- Başarılı:
  - Settings state güncellenir (coachConnected, coachName, displayName, accountEmail)
  - Step 4'e geçilir
- Başarısız → hata mesajı gösterilir (örn: kod bu arada used oldu)

---

## STEP 4 – Başarı

### Layout

```
+----------------------------------+
|   BAĞLANTI TAMAMLANDI            |
+----------------------------------+

  [Card]
  ✓ (checkmark.circle.fill icon)
  Koçuna başarıyla bağlandın
  Artık ilerlemen koçunla paylaşılacak.

  [ ANA SAYFAYA DÖN ]
```

### Davranış

- Geri tuşu yok (sadece ANA SAYFAYA DÖN)
- "ANA SAYFAYA DÖN" basınca:
  - `router.dismissAll()` + `router.replace('/')`
  - Home ekranı koçlu moda geçer
  - "Koça bağlan" satırı kaybolur

---

## Navigasyon Kuralları

- Step 3 → geri → Step 2 (veya Step 1 eğer session zaten vardıysa)
- Step 2 → geri → Step 1
- Step 1 → geri → önceki ekran (Settings veya Home)
- Step 4'te geri tuşu yok

---

## Done Kriterleri

- [x] Kullanıcı kod girişi ekranını görebiliyor
- [x] Kod girip DEVAM ET diyebiliyor
- [x] Verify başarılıysa Google login ekranı açılıyor (zaten login ise atlanıyor)
- [x] Google OAuth ile giriş yapılabiliyor
- [x] Login sonrası isim ekranı geliyor
- [x] BAĞLAN diyince consume çalışıyor
- [x] Başarı ekranı gösteriliyor
- [x] Akış sonunda Home koçlu state'e geçiyor
- [x] Hata mesajları doğru gösteriliyor

---

## Kapsam Dışı

- daily_records sync
- coach_notes çekme/gösterme
- Koç tarafı invite üretme UI
- Push bildirimleri

Bunlar sonraki ticketlarda ele alınacak.
