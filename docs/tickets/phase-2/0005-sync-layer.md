## T2.5 – Sync Layer (Local → Cloud, 30 Gün Penceresi)

**Durum: TAMAMLANDI**

### Amaç
Koça bağlanan öğrencilerin günlük kayıtlarını güvenli ve tutarlı şekilde buluta senkronize etmek.

Temel prensipler:

- Local-first mimari korunur
- Koç bağlantısı yoksa hiçbir cloud işlemi yapılmaz
- Varsayılan senkronizasyon penceresi: **son 30 gün**
- Conflict çözümü: **Local Always Wins**

---

## İş Kuralları

### 1) Sync Penceresi

- Varsayılan pencere: **bugünden geriye doğru 30 gün**
- 30 günden eski kayıtlar:
  - cloud'a gönderilmez
  - koç tarafından görülmez

> Bu bilinçli bir ürün kararıdır: koçluk için anlamlı pencere 30 gün kabul edilir.

---

### 2) Ne Zaman Sync Yapılır?

Aşağıdaki durumların tamamı yalnızca **koç bağlantısı varken + session varken** çalışır:

#### A) İlk Bağlanma Anı (Initial Sync)

Koça bağlanma tamamlandığında (`CoachConnectScreen.handleConsume` başarılı):

- Local'de bulunan **son 30 günün tüm kayıtları** cloud'a gönderilir
- Batch upsert yapılır (tek Supabase çağrısı)
- Fire-and-forget: kullanıcı bloklanmaz

---

#### B) Günlük Kullanım (Ongoing Sync)

Koç bağlantısı varken (`RecordsProvider` içindeki hook'lar):

| Aksiyon | Davranış |
|-------|---------|
| Yeni kayıt ekleme | upsert |
| Son 30 gün içindeki kaydı düzenleme | upsert |
| Son 30 gün içindeki kaydı silme | delete |
| 30+ gün öncesini düzenleme | cloud'a yansıtılmaz |

---

### 3) Koç Bağlantısı Kesilince

- `shouldSync()` guard fonksiyonu `coachConnected === false` olduğunda `false` döner
- Ek bir `stopSync()` fonksiyonuna gerek yok — guard yeterli
- Yeni upsert/delete yapılmaz

---

### 4) Conflict Stratejisi

- **Local Always Wins**

Açıklama:

- Cloud'daki kayıtlar yalnızca birer kopyadır
- Aynı güne ait kayıt değişirse:
  - Local kayıt cloud'un üzerine yazılır (upsert ON CONFLICT user_id, date)
- Cloud'dan local'e veri çekilmez

---

## Teknik Uygulama

### 1) Supabase `daily_records` Tablosu

Migration ile oluşturuldu. Şema:

| Kolon | Tip | Notlar |
|-------|-----|--------|
| id | UUID | PK, gen_random_uuid() |
| user_id | UUID | FK → auth.users(id), ON DELETE CASCADE |
| date | DATE | |
| focus_minutes | INTEGER | DEFAULT 0 |
| activity_type | TEXT | CHECK: KONU, SORU, KARISIK |
| question_count | INTEGER | nullable |
| subject_breakdown | JSONB | nullable |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

- **UNIQUE(user_id, date)** — upsert desteği
- **RLS aktif**:
  - `Users can manage own records`: kullanıcı kendi kayıtlarını CRUD yapabilir
  - `Coaches can read student records`: koçlar `coach_students` tablosundaki öğrencilerin kayıtlarını okuyabilir

**Field mapping** (Local → Cloud):

| Local (DailyRecord) | Cloud (daily_records) |
|---|---|
| date | date |
| focusMinutes | focus_minutes |
| activityType | activity_type |
| questionCount | question_count |
| subjectBreakdown | subject_breakdown |
| — | created_at (otomatik) |
| — | updated_at (upsert'te now() set edilir) |

---

### 2) Değiştirilen / Oluşturulan Dosyalar

| Dosya | Değişiklik |
|------|-----|
| `lib/supabase/sync.ts` | **Yeni** — sync fonksiyonları |
| `state/records.tsx` | upsert/remove'a sync hook eklendi, useAuth import |
| `screens/CoachConnectScreen.tsx` | Initial sync tetikleme, useRecords import |

> `state/sync.tsx` (SyncProvider) **oluşturulmadı** — guard fonksiyonu ile RecordsProvider içinden yönetim yeterli.

---

### 3) Fonksiyonlar (`lib/supabase/sync.ts`)

#### A) `shouldSync(recordDate, coachConnected, session): boolean`
3 koşul kontrol eder:
1. `coachConnected === true`
2. `session !== null`
3. `recordDate` son 30 gün içinde

#### B) `syncRecord(record, session): Promise<void>`
- Tek kayıt upsert (ON CONFLICT user_id, date)
- `updated_at: new Date().toISOString()` set eder
- Silent: hata → console.warn

#### C) `deleteRecordFromCloud(date, session): Promise<void>`
- Tarih + user_id bazlı silme
- Silent hata yönetimi

#### D) `syncInitialLast30Days(recordsByDate, session): Promise<void>`
- Son 30 gün içindeki tüm kayıtları filtreler
- Batch upsert (tek Supabase çağrısı)

#### E) `toCloudRecord(record, userId)` (internal helper)
- camelCase → snake_case dönüşümü
- `updated_at` ekleme

---

### 4) Entegrasyon Noktaları

| Mevcut Olay | Dosya | Yeni Davranış |
|------------|-------|--------------|
| `upsertRecord()` | `state/records.tsx` | dispatch + fire-and-forget `syncRecord` |
| `removeRecord()` | `state/records.tsx` | dispatch + fire-and-forget `deleteRecordFromCloud` |
| `handleConsume()` başarılı | `screens/CoachConnectScreen.tsx` | fire-and-forget `syncInitialLast30Days` |
| Coach disconnect | — | `shouldSync` guard otomatik durdurur |

---

### 5) Hata Yönetimi

- Tüm sync çağrıları **fire-and-forget** (await yok)
- Hata → `console.warn` ile loglanır
- Kullanıcıya gösterilmez
- Offline-first: kullanıcı deneyimi bloklanmaz

> **Not**: Retry mantığı (3x retry + kuyruk) bu iterasyonda uygulanmadı. Basit fire-and-forget yaklaşımı tercih edildi. İhtiyaç halinde eklenebilir.

---

### 6) Güvenlik

- Sadece authenticated kullanıcılar kendi kayıtlarını upsert edebilir
- RLS kuralları: `user_id = auth.uid()`
- Koçlar sadece SELECT yapabilir (coach_students ilişkisi üzerinden)

---

## Done Kriterleri

- [x] Supabase'de `daily_records` tablosu oluşturuldu (migration)
- [x] RLS policy'leri aktif (user + coach)
- [x] Koça bağlanınca son 30 gün kayıtları cloud'a gidiyor
- [x] Yeni kayıt eklenince upsert yapılıyor
- [x] Son 30 gün içi düzenleme cloud'a yansıyor
- [x] 30+ gün öncesi düzenleme cloud'a gitmiyor
- [x] Kayıt silinince cloud'dan da siliniyor
- [x] Koçtan ayrılınca sync duruyor (guard fonksiyonu)
- [x] Offline durumda kullanıcı bloklanmıyor (fire-and-forget)
- [x] Restart sonrası koçlu state devam ediyorsa sync çalışıyor
- [x] Local Always Wins kuralı uygulanıyor (upsert ON CONFLICT)
- [x] TypeScript hatasız (`tsc --noEmit` geçiyor)

---

## Kapsam Dışı

- Tam arşiv senkronizasyonu
- Çoklu cihaz desteği
- Web erişimi
- Premium öğrenci senkronizasyonu
- Koç notları
- Retry mantığı (3x retry + kuyruk)

---

## Gelecek Genişleme (Not)

İleride "Premium Öğrenci" özelliği eklenirse:

```ts
if (user.isPremiumStudent) {
   syncWindow = ALL_TIME
}
```

mantığıyla kolayca genişletilebilir.

---
