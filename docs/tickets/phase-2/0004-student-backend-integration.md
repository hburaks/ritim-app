## T2.4 – Backend Entegrasyonu: Invite Verify + Consume (Kod → Login → Bağlan)

### Amaç
Koça bağlan akışını gerçek backend ile çalışır hale getirmek.
Davet kodu önce doğrulanacak (verify), Google login sonrası ilişki kurulurken kod tüketilecek (consume).

> Kritik kural:
> - Kod girilmeden login yok
> - Kod doğrulama = verify (tüketmez)
> - Koça bağlanma tamamlanınca = consume (tek kullanımlık)

---

### Kapsam

1) Supabase tabloları / alanları (invites + coach_students + profiles minimum)  
2) Verify endpoint / RPC / function  
3) Consume endpoint / RPC / function  
4) Flutter tarafında T2.3 akışını gerçek verify/consume ile bağlama  
5) Hata kodlarını UI’ya mapleme

---

## 1) Veri Modeli (Minimum)

### invites (minimum alanlar)
- id (uuid)
- coach_id (uuid)
- code (text, unique)
- expires_at (timestamptz)
- status (text)  // 'active' | 'used' | 'revoked' | 'expired'
- used_by_student_id (uuid, nullable)
- used_at (timestamptz, nullable)
- created_at (timestamptz)

### coach_students
- coach_id (uuid)
- student_id (uuid)
- created_at (timestamptz)
- UNIQUE(student_id)  // 1 öğrenci = 1 koç

### profiles (minimum)
- id (uuid)  // auth.user.id
- role (text) // 'student' | 'coach'
- display_name (text, nullable)
- created_at (timestamptz)

> Not: daily_records ve coach_notes bu ticket kapsamı değil (sync ve notlar sonraki ticketlarda).

---

## 2) VERIFY Akışı (Kod Doğrulama – tüketmez)

### UI Konumu
T2.3 SCREEN 1 (Davet Kodu) -> DEVAM ET

### Beklenen Davranış
- Kod var mı?
- Aktif mi?
- Süresi geçmemiş mi?
- Kullanılmamış mı?
- Koçun aktif/limit kuralları ihlal ediyor mu? (minimum: status + expires)

### ASCII (SCREEN 1 referans)

+----------------------------------+
| KOÇA BAĞLAN                      |
+----------------------------------+
Davet kodunu gir
[ __________ ]
[ DEVAM ET ]

DEVAM ET -> verify(code)

### Verify Response
Başarılı ise:
- `ok: true`
- `coach_id`
- (opsiyonel) `coach_display_name` (UI’da göstermek istersen)

Başarısız ise:
- `ok: false`
- `error_code`:
  - INVALID_CODE
  - EXPIRED
  - USED
  - REVOKED
  - COACH_LIMIT (opsiyonel)

### UI Hata Mesajı Map

- INVALID_CODE  -> "Davet kodu geçerli değil."
- EXPIRED       -> "Bu davet kodunun süresi dolmuş."
- USED          -> "Bu davet kodu daha önce kullanılmış."
- REVOKED       -> "Bu davet kodu iptal edilmiş."
- COACH_LIMIT   -> "Koç şu an yeni öğrenci kabul edemiyor."

---

## 3) CONSUME Akışı (Login sonrası ilişki kurar, kodu tüketir)

### UI Konumu
T2.3 SCREEN 3 (Görünen İsim) -> BAĞLAN

### Beklenen Davranış
- Kullanıcı login olmuş olmalı (auth session var)
- Kod tekrar kontrol edilir (race condition için)
- Kod ACTIVE + expires_at geçmemiş olmalı
- Kod USED değilse:
  - coach_students ilişki kaydı oluştur
  - profiles.role = 'student' (yoksa oluştur)
  - profiles.display_name = input
  - invites.status = 'used'
  - used_by_student_id = current_user_id
  - used_at = now()

### ASCII (SCREEN 3 referans)

+----------------------------------+
| KOÇA BAĞLAN                      |
+----------------------------------+
Koçun seni hangi isimle görsün?
[ Hasan ]
[ BAĞLAN ]  -> consume(code, display_name)

---

## 4) Flutter Entegrasyonu

### Değişiklikler
- T2.3 mock verify kaldırılır, gerçek verify çağrılır
- Login ekranına geçiş yalnız verify ok=true ise
- BAĞLAN butonunda consume çağrılır
- Consume ok=true ise Success ekranı gösterilir
- Consume hata verirse Screen 3’te hata mesajı gösterilir
  (örn: kod bu arada used oldu)

### Edge Case’ler
- Verify ok -> kullanıcı login ekranında vazgeçip çıkabilir
  - Kod tüketilmediği için sorun yok
- Verify ok -> başka biri consume ederse
  - Consume USED hatası dönmeli

---

## 5) Güvenlik / RLS Notları (Minimum)

- invites tablosu:
  - verify fonksiyonu anon erişime açık olabilir (sadece code ile kontrol)
  - consume fonksiyonu auth required olmalı

- coach_students:
  - insert yalnız consume fonksiyonu üzerinden olmalı

- profiles:
  - öğrenci kendi profile’ını update edebilir (display_name)

> Detaylı RLS politikaları ayrı ticket’a bölünebilir, ama bu ticket MVP seviyesinde çalışır hale getirmeli.

---

## Done Kriterleri (Acceptance)

- Davet kodu ekranında DEVAM ET gerçek verify çağırıyor
- Verify başarısızsa doğru hata mesajı gösteriliyor
- Verify başarılıysa Google login ekranına geçiliyor
- Login sonrası isim girilip BAĞLAN denince consume çalışıyor
- Consume başarılıysa:
  - coach_students kaydı oluşuyor
  - invite used oluyor
  - öğrenci koçlu moda geçiyor
- Consume başarısızsa (örn USED):
  - kullanıcıya anlamlı hata gösteriliyor
- 1 öğrenci = 1 koç kuralı enforce ediliyor (unique constraint veya backend kontrolü)

---

## Kapsam Dışı (Bu ticketta yapılmayacak)

- daily_records sync (T2.5/T2.6)
- coach_notes çekme/gösterme (T2.7+)
- koç tarafı invite üretme UI (Coach ticketları)
- push bildirimleri
