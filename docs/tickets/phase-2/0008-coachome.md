T2.8 — Coach Mode Entry + CoachHome (Öğrenci Liste MVP)

Durum: TAMAMLANDI

Context

Koç modu Phase-2 kapsamında açılıyor. Amaç:

Koçun uygulama içinden kendi öğrencilerini görebilmesi

Basit, dashboardlaşmayan bir MVP

Performanslı ve güvenilir metrikler

Offline-first mimariye uyumlu ama koç tarafında DB tabanlı çalışma

MVP kapsamında:

Tek ekran liste

Runtime hesaplanan metrikler

Tombstone filtreleme

N+1 sorgu olmaması

---

NET ÜRÜN KARARLARI

Koç Kimdir?

Koç ayrı bir auth hesabı değildir.

Koç, normal Supabase kullanıcısıdır.

Koç erişimi yalnızca coach_students ilişkisi üzerinden belirlenir.

Profiles tablosunda role alanı MVP kapsamında guard için kullanılmaz.

Guard Mantığı

Auth yoksa: koç ekranına girilemez → "Koç Modu için giriş yap" CTA gösterilir

Auth var ama coach_students boşsa: empty state → "Bağlı öğrencin yok"

Auth var ve bağlı öğrenci varsa: CoachHome açılır

Koç – Öğrenci İlişki Kuralları

1 koç – çok öğrenci

1 öğrenci – aynı anda en fazla 1 koç

Veri modeli:

coach_students tablosunda student_id UNIQUE

Öğrenci koç değiştirebilir

Öğrenci verisi koçtan bağımsızdır

Eski koç ilişki kopunca öğrencinin verilerini artık göremez

Yeni koç aynı verileri görür

---

KOÇ MODUNA GEÇİŞ AKIŞI

Settings Üzerinden

Settings ekranında buton: "Koç Moduna Geç" (HAKKINDA bölümünden hemen önce)

Butona basılınca /coach route açılır

CoachHomeScreen guard akışı:

Auth yoksa → Google OAuth CTA

Auth varsa → batch fetch → liste veya empty state

---

COACH HOME EKRANI – MVP TANIMI

MVP'de yalnızca tek ekran vardır:

Öğrenci liste ekranı (FlatList)

Detay ekranı yok

Arama input yok

Profiles Alan Sözleşmesi

Öğrenci adı için tek kaynak: profiles.display_name

Tüm koç ekranı sorguları display_name üzerinden çalışır

---

ACTIVE TRACK SENKRONİZASYONU

Koç metrikleri öğrencinin aktif track bilgisine göre hesaplanır.

Kural

profiles.active_track alanı Supabase tarafında tutulur

Aşağıdaki anlarda update edilir:

Settings ekranında track değiştirildiğinde (SettingsScreen.tsx → updateActiveTrack)

CoachConnect bağlantı başarılı olduğunda (mevcut active_track sync)

Davranış

Sync başarısız olursa: best-effort (sessizce logla, retry yok)

Kritik veri değildir, koç ekranı için metadata niteliğindedir

Tip Güvenliği

DB'den gelen active_track değeri client tarafında whitelist ile doğrulanır (coachApi.ts → validateTrackId)

Geçerli: LGS7 | LGS8 | TYT | AYT → kullan

Geçersiz veya null → null say, chip'te "—" göster

---

METRİK HESAPLAMA KURALLARI

Tombstone

Aşağıdaki kayıtlar hesaba katılmaz:

daily_records.is_deleted = true olanlar filtrelenir (batch fetch'te is_deleted=false filtresi)

exam_records.is_deleted = true olanlar filtrelenir (batch fetch'te is_deleted=false filtresi)

Track Filtresi

Tüm metrikler:

Öğrencinin profiles.active_track değeri üzerinden

Sadece o track id ile hesaplanır (coachMetrics.ts → filterDailyByTrack / filterExamsByTrack)

Son Aktivite

Tanım (coachMetrics.ts → computeLastActivity):

max(
  track filtreli daily_records.date,
  track filtreli FULL exam_records.date
)

Gösterim (coachMetrics.ts → formatLastActivity):

Bugün

Dün

X gün önce

Eğer son 30 gün içinde hiç kayıt yoksa:

Mesaj: "Son 30 günde aktivite yok"

Haftalık Metrik (Son 7 Gün)

Zaman penceresi:

Bugün dahil son 7 gün [today - 6 ... today]

Cihaz local timezone bazlı

Timezone kuralı:

date alanı YYYY-MM-DD string olduğundan hesaplama string karşılaştırma ile yapılır

UTC Date'e çevirip kaydırma yapılmaz — "1 gün kayması" bug'ını engeller

Local today: getLocalToday() (coachMetrics.ts)

Hesap (coachMetrics.ts):

weeklyMinutes = sum(daily.focus_minutes) + sum(fullExam.duration_minutes veya 0)

weeklyFullExamCount = count(type = FULL)

---

N+1 YASAĞI – BATCH FETCH STRATEJİSİ

Koç ekranı açılışında öğrenci başına ayrı sorgu atılamaz.

Toplam query sayısı sabit (4 adet), öğrenci sayısı artsa da query sayısı artmaz.

Implementasyon: coachApi.ts → fetchCoachData()

1) coach_students → coach_id = auth.uid() → studentIds listesi
2) profiles → id in studentIds (parallel)
3) daily_records → user_id in studentIds, date >= today-30, is_deleted=false (parallel)
4) exam_records → user_id in studentIds, date >= today-30, is_deleted=false, type=FULL (parallel)

Query 2-3-4 Promise.all ile paralel çalışır.

Kısa Devre: coach_students boş gelirse → null return, diğer query'ler atılmaz.

Ardından tüm hesaplamalar client-side yapılır.

---

ÖĞRENCİ – KOÇ BAĞLANTI AKIŞI (Initial Sync)

CoachConnect ekranı öğrenci tarafına aittir.

Öğrenci koça bağlandığında (CoachConnectScreen.tsx → handleConsume):

syncInitialLast30Days (daily records) — zaten mevcuttu

syncInitialExamsLast30Days (exam records) — eklendi

updateActiveTrack (profiles.active_track sync) — eklendi

Her üçü de Promise.all ile paralel tetiklenir.

Pending Mekanizması

Eğer initial sync (daily + exams) başarısız olursa:

pending_initial_sync = true flag set edilir (pendingSyncStorage.ts)

Storage key: ritim.v1.pendingInitialSync (ayrı AsyncStorage key)

Retry tetikleyicisi: _layout.tsx → PendingSyncRetry component

session mevcut + exams hydrated + settings hydrated ise flag kontrol edilir

flag=true ise sync tekrar tetiklenir

Başarılı olunca flag temizlenir

---

AUTH SESSION KAYBI / LOGOUT HANDLING

A) Logout olunca

Auth session gider → sync job'ları çalışmayı bırakır

Sync katmanında: getSession() null ise sessizce return

CoachHome: auth yoksa "Koç Modu için giriş yap" CTA'sı gösterilir

Local storage temizlenmez (local-first felsefesi korunur, sadece auth token gider)

B) Tekrar login olunca

Aynı hesapla login → local data aynen durur, sync kaldığı yerden devam eder

Coach mode'a tekrar girilebilir

C) Farklı hesapla login olursa

NOT: MVP'de bu kontrol henüz implemente edilmedi. İleride eklenebilir.

Planlanan davranış: pasif mesaj gösterilir, local storage sıfırlama yapılmaz.

---

UI AKIŞI

1) Settings Ekranı

Dosya: ritim/screens/SettingsScreen.tsx

"Koç Moduna Geç" butonu HAKKINDA bölümünden önce eklendi

Alt metin: "Öğrencilerini görüntüle ve takip et."

Track değişikliğinde active_track sync tetiklenir

2) Coach Route

ritim/app/coach/_layout.tsx — Stack layout (headerShown: false)

ritim/app/coach/index.tsx — CoachHomeScreen render

ritim/app/_layout.tsx — coach Screen eklendi

3) CoachHome Ekranı (ritim/screens/coach/CoachHomeScreen.tsx)

Guard katmanları (sırasıyla):
  1. Auth loading → spinner
  2. Auth yoksa → "Koç Modu için giriş yap" CTA + Google OAuth butonu
  3. Data loading → spinner
  4. Error → hata mesajı + "TEKRAR DENE" butonu
  5. coach_students boş → "Bağlı öğrencin yok" empty state
  6. Data var → FlatList ile öğrenci kartları

Her öğrenci kartında:
  display_name (numberOfLines=1)
  active_track chip (shortLabel, geçersizse "—")
  "Son aktivite: X gün önce" metni
  "Bu hafta: X dk · Y FULL deneme" metni
  Favori yıldızı toggle (star/star.fill)

Sıralama:
  Favoriler üstte
  İçlerinde son aktivitesi en eski olan önce (null = en eski)

Loading – Error – Refresh:
  İlk açılış: ActivityIndicator
  Hata: SurfaceCard + retry butonu
  Pull-to-refresh: RefreshControl ile batch fetch tekrar

---

BACKEND GEREKSİNİMLERİ (TAMAMLANDI)

Migration: add_active_track_to_profiles

ALTER TABLE public.profiles ADD COLUMN active_track text NULL;

RLS Policy: "Coaches can read student profiles"

CREATE POLICY "Coaches can read student profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.coach_students cs
    WHERE cs.student_id = profiles.id AND cs.coach_id = auth.uid()
  ));

Mevcut RLS (zaten vardı, değişiklik gerekmedi):

daily_records: "Coaches can read student records" ✓
exam_records: "Coaches can read student exam records" ✓
profiles: "Users can update own profile" ✓ (active_track yazımı için)

---

FAVORİLER (LOCAL)

Dosya: ritim/lib/storage/coachFavoritesStorage.ts

Storage key: ritim.coach.favorites.v1

Format: Record<studentId, true>

API: getFavorites(), toggleFavorite(studentId)

Sıralama (CoachHomeScreen içinde):

Favoriler üstte

Her grup içinde: son aktivitesi en eski olan önce

---

DOSYA DEĞİŞİKLİK LİSTESİ

Yeni (7 dosya)

ritim/app/coach/_layout.tsx — Coach stack layout
ritim/app/coach/index.tsx — Coach route entry
ritim/screens/coach/CoachHomeScreen.tsx — Ana koç ekranı
ritim/lib/coach/coachApi.ts — Batch fetch, active_track update, tip doğrulama
ritim/lib/coach/coachMetrics.ts — Metrik hesaplama (lastActivity, weekly, filtering)
ritim/lib/storage/coachFavoritesStorage.ts — Favori toggle + persist
ritim/lib/storage/pendingSyncStorage.ts — Pending initial sync flag

Güncellenmiş (6 dosya)

ritim/app/_layout.tsx — coach Screen + PendingSyncRetry component
ritim/screens/SettingsScreen.tsx — "Koç Moduna Geç" butonu + active_track sync
ritim/screens/CoachConnectScreen.tsx — syncInitialExamsLast30Days + active_track sync + pending flag
ritim/state/exams.tsx — getAllExams() getter eklendi
ritim/lib/storage/storageKeys.ts — COACH_FAVORITES_KEY + PENDING_INITIAL_SYNC_KEY
docs/tickets/phase-2/0008-coachome.md — Ticket güncellendi

Supabase (2 değişiklik)

Migration: add_active_track_to_profiles (profiles.active_track kolonu)
RLS: "Coaches can read student profiles" policy

---

ACCEPTANCE CRITERIA

[x] Settings ekranından Koç Moduna geçilebiliyor
[x] Login değilse "Koç Modu için giriş yap" CTA çıkıyor
[x] Login sonrası /coach açılıyor
[x] coach_students boşsa empty state gösteriliyor
[x] Öğrenci listesi doğru geliyor
[x] display_name ve active_track doğru görünüyor (geçersiz track → "—")
[x] Tombstone kayıtlar hariç tutuluyor (batch fetch'te is_deleted=false filtresi)
[x] Haftalık metrik doğru hesaplanıyor (track filtreli, string date karşılaştırma)
[x] N+1 sorgu yok (4 sabit query, öğrenci sayısından bağımsız)
[x] Loading, error ve pull-to-refresh çalışıyor
[x] Son 30 gün dışı aktivite "Son 30 günde aktivite yok" mesajıyla gösteriliyor
[x] syncInitialExamsLast30Days CoachConnect'ten çağrılıyor
[x] pendingInitialSync flag ile retry mekanizması çalışıyor (_layout.tsx)
[x] active_track Settings'te track değişikliğinde sync ediliyor
[x] active_track CoachConnect bağlantı sonrası sync ediliyor
[ ] Farklı hesapla login uyarısı (MVP'de implemente edilmedi, ileride eklenecek)

---

KAPSAM DIŞI

Koç tarafı davet kodu üretimi

Öğrenci detay ekranı

Arama input

Streak algoritması

Son deneme skoru kartı

Bildirim sistemi

Disconnect yönetimi UI

Farklı hesap login uyarısı (ayrı ticket olarak planlanabilir)
