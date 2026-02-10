## T2.4 – Backend Entegrasyonu: Invite Verify + Consume (Kod → Login → Bağlan)

> **Durum: TAMAMLANDI**
> T2.3 ile birlikte uygulandı. Mock aşaması atlanıp direkt gerçek backend bağlandı.

### Amaç
Koça bağlan akışını gerçek backend ile çalışır hale getirmek.
Davet kodu önce doğrulanacak (verify), Google login sonrası ilişki kurulurken kod tüketilecek (consume).

> Kritik kural:
> - Kod girilmeden login yok
> - Kod doğrulama = verify (tüketmez)
> - Koça bağlanma tamamlanınca = consume (tek kullanımlık)

---

### Kapsam

1) Supabase tabloları (invites + coach_students + profiles)
2) verify_invite RPC fonksiyonu
3) consume_invite RPC fonksiyonu
4) React Native (Expo) tarafında gerçek verify/consume entegrasyonu
5) Google OAuth entegrasyonu (expo-auth-session)
6) Hata kodlarını UI'ya mapleme
7) RLS politikaları (MVP)

---

## 1) Veri Modeli

### Supabase Projesi
- Proje: `ritim-app` (emygghuiusxpfcpnhhhu)
- Bölge: eu-central-1 (Frankfurt)

### profiles
| Alan | Tip | Not |
|------|-----|-----|
| id | uuid (PK) | auth.users(id) referansı, ON DELETE CASCADE |
| role | text | 'student' \| 'coach' |
| display_name | text, nullable | |
| created_at | timestamptz | default now() |

### invites
| Alan | Tip | Not |
|------|-----|-----|
| id | uuid (PK) | gen_random_uuid() |
| coach_id | uuid | profiles(id) referansı |
| code | text, unique | |
| expires_at | timestamptz | |
| status | text | 'active' \| 'used' \| 'revoked' \| 'expired' |
| used_by_student_id | uuid, nullable | profiles(id) referansı |
| used_at | timestamptz, nullable | |
| created_at | timestamptz | default now() |

### coach_students
| Alan | Tip | Not |
|------|-----|-----|
| coach_id | uuid | profiles(id) referansı |
| student_id | uuid | profiles(id) referansı |
| created_at | timestamptz | default now() |
| | | PK: (coach_id, student_id) |
| | | UNIQUE(student_id) → 1 öğrenci = 1 koç |

> Not: daily_records ve coach_notes bu ticket kapsamı değil.

---

## 2) VERIFY Akışı (Kod Doğrulama – tüketmez)

### RPC: `verify_invite(invite_code text) → jsonb`
- **Security definer**, `set search_path = ''`
- **Erişim:** anon + authenticated
- Kodu kontrol eder, tüketmez
- Expired ama status hâlâ active ise status'u otomatik 'expired' yapar

### Verify Response
Başarılı:
```json
{ "ok": true, "coach_id": "uuid", "coach_display_name": "Ahmet Yılmaz" }
```

Başarısız:
```json
{ "ok": false, "error_code": "INVALID_CODE" }
```

### Error Codes + UI Mesajları

| error_code | UI Mesajı |
|-----------|-----------|
| INVALID_CODE | Davet kodu geçerli değil. |
| EXPIRED | Bu davet kodunun süresi dolmuş. |
| USED | Bu davet kodu daha önce kullanılmış. |
| REVOKED | Bu davet kodu iptal edilmiş. |
| COACH_LIMIT | Koç şu an yeni öğrenci kabul edemiyor. |
| NETWORK_ERROR | Bağlantı hatası. Lütfen tekrar dene. |

---

## 3) CONSUME Akışı (Login sonrası ilişki kurar, kodu tüketir)

### RPC: `consume_invite(invite_code text, student_display_name text) → jsonb`
- **Security definer**, `set search_path = ''`
- **Erişim:** sadece authenticated (anon'dan revoke edildi)
- **FOR UPDATE** row lock ile race condition koruması

### Kontroller (sırasıyla)
1. Auth kontrolü (auth.uid() null mı?)
2. Öğrenci zaten koçlu mu? → ALREADY_CONNECTED
3. Kod var mı? → INVALID_CODE
4. Kod active mi? → status döner (used/revoked/expired)
5. Süresi geçmiş mi? → EXPIRED (status güncellenir)

### Başarılı İşlemler
1. profiles tablosuna upsert (id, role='student', display_name)
2. coach_students tablosuna insert (coach_id, student_id)
3. invites tablosunda status='used', used_by_student_id, used_at güncelle

### Consume Response
Başarılı:
```json
{ "ok": true, "coach_id": "uuid" }
```

Başarısız:
```json
{ "ok": false, "error_code": "ALREADY_CONNECTED" }
```

### Ek Error Codes (consume'a özel)
| error_code | UI Mesajı |
|-----------|-----------|
| ALREADY_CONNECTED | Zaten bir koça bağlısın. |
| AUTH_REQUIRED | Giriş yapman gerekiyor. |

---

## 4) React Native (Expo) Entegrasyonu

### Yeni Dosyalar
| Dosya | Amaç |
|-------|-------|
| `lib/supabase/client.ts` | Supabase client (AsyncStorage session, detectSessionInUrl: false) |
| `lib/supabase/auth.ts` | Google OAuth (expo-auth-session + expo-web-browser + makeRedirectUri) |
| `lib/supabase/invites.ts` | verifyInvite(), consumeInvite(), getErrorMessage() |
| `state/auth.tsx` | AuthProvider (session context, onAuthStateChange) |
| `.env` | EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY |

### Değiştirilen Dosyalar
| Dosya | Değişiklik |
|-------|------------|
| `app/_layout.tsx` | AuthProvider en dış katmana eklendi |
| `screens/CoachConnectScreen.tsx` | Gerçek verify/consume + Google OAuth |
| `screens/SettingsScreen.tsx` | Logout'a Supabase signOut eklendi |
| `screens/HomeScreen.tsx` | "Koça bağlan" satırı tıklanabilir yapıldı (Pressable) |
| `.gitignore` | `.env` eklendi |

### Paketler (yeni)
- `@supabase/supabase-js`
- `expo-auth-session`
- `expo-crypto`

### Google OAuth Akışı
1. `signInWithOAuth({ provider: 'google', skipBrowserRedirect: true })`
2. `WebBrowser.openAuthSessionAsync(url, redirectTo)` → in-app browser
3. Redirect sonrası token'lar parse edilir
4. `supabase.auth.setSession({ access_token, refresh_token })`

### Edge Case'ler
- Verify ok → kullanıcı login ekranında vazgeçip çıkabilir → kod tüketilmediği için sorun yok
- Verify ok → başka biri consume ederse → Consume USED hatası döner
- Zaten login ise → login adımı otomatik atlanır

---

## 5) Güvenlik / RLS

### RLS Politikaları (uygulandı)
- **profiles:** kullanıcı kendi profilini okur/günceller/ekler
- **invites:** direkt erişim yok (tüm erişim RPC üzerinden, RLS aktif policy yok)
- **coach_students:** öğrenci kendi kaydını okur, koç kendi öğrencilerini okur
- **RPC'ler:** security definer ile çalışır (RLS bypass)

### Google OAuth Konfigürasyonu
- Google Cloud Console → OAuth 2.0 credentials (Web application)
- Supabase Dashboard → Auth → Providers → Google aktif
- Redirect URL: `ritim://` (app.json scheme ile eşleşir)
- Supabase callback: `https://<ref>.supabase.co/auth/v1/callback`

---

## Done Kriterleri (Acceptance)

- [x] Davet kodu ekranında DEVAM ET gerçek verify çağırıyor
- [x] Verify başarısızsa doğru hata mesajı gösteriliyor
- [x] Verify başarılıysa Google login ekranına geçiliyor (zaten login ise atlanıyor)
- [x] Google OAuth ile giriş yapılabiliyor
- [x] Login sonrası isim girilip BAĞLAN denince consume çalışıyor
- [x] Consume başarılıysa: coach_students kaydı oluşuyor, invite used oluyor, öğrenci koçlu moda geçiyor
- [x] Consume başarısızsa (örn USED, ALREADY_CONNECTED): kullanıcıya anlamlı hata gösteriliyor
- [x] 1 öğrenci = 1 koç kuralı enforce ediliyor (unique constraint + ALREADY_CONNECTED kontrolü)
- [x] Logout Supabase session'ı temizliyor

---

## Kapsam Dışı (Bu ticketta yapılmadı)

- daily_records sync (T2.5/T2.6)
- coach_notes çekme/gösterme (T2.7+)
- koç tarafı invite üretme UI (Coach ticketları)
- push bildirimleri
