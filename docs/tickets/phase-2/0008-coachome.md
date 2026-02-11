T2.8 — Coach Mode Entry + CoachHome (Öğrenci Seçimi ve Liste MVP)

Durum: YAPILACAK

Amaç

Koç moduna Ayarlar’dan geçilebilsin ve koç, önce öğrenci seçimi yapıp ardından öğrencilerin özet kartlarını görebilsin.

MVP odak:

Öğrenci listesi

Favoriler (local)

Son aktivite / streak (aynı alan)

Bu hafta toplam süre + FULL deneme sayısı

Öğrencinin aktif track bilgisini gösterme

Not: Metrikler backend’de “summary” olarak tutulmayacak. Koç ekranında runtime hesaplanacak (daily_records + exam_records).

Net Kararlar

Koç modu Ayarlar ekranından açılır.

CoachHome’a girince default öğrenci seçili gelmez; önce “Öğrenci seç” (liste) ekranı açılır.

Öğrenci kartları:

Son aktivite (veya “streak” metni) tek satırda gösterilir (ikisi aynı anda gösterilmez).

“Son deneme skoru” yalnız FULL denemelerden gelir. BRANCH koç kartı metriklerine girmez.

Favoriler sadece local (AsyncStorage).

Öğrenci kartında aktif track chip’i gösterilir.

Öğrencinin aktif track bilgisi backend’e sync edilecek (koç doğru track’i görsün).

UI Akışı (MVP)
1) Settings → Coach Mode

Dosya: ritim/screens/SettingsScreen.tsx

“Koç Modu” satırı / butonu

Basınca: /coach root’a yönlendir (Coach stack)

2) Coach: Öğrenci Seçim Ekranı (ilk ekran)

Yeni route/screen: ritim/app/coach/index.tsx → CoachSelectStudentScreen

Liste: tüm bağlı öğrenciler

Arama (opsiyonel, hızlı)

Her öğrenci satırı:

isim

aktif track chip

“son aktivite: X gün önce” (varsa)

⭐ favori toggle

Seçince: /coach/student/[studentId]

3) Coach: Öğrenci Kartları / Home

Yeni screen: CoachHomeScreen (ister /coach/home, ister student seçince açılan ekran)

Eğer ürün akışında “liste + kartlar aynı” olacaksa:

Bu ekran zaten liste kartlarını gösterir ve tıklayınca öğrenci detail’e gider.

Kart içeriği (minimal):

Öğrenci adı + ⭐

Track chip (LGS8/TYT/…)

Son aktivite / streak (tek satır):

örn: “Son aktivite: 2 gün önce” veya “Streak: 5 gün”

Mini metrik satırı:

“Bu hafta: 240 dk · 1 FULL deneme”

Data / Hesaplama Kuralları
Son Aktivite / Streak

lastActivityAt = max(

öğrencinin daily_records’undaki son kayıt tarihi (track filtreli),

öğrencinin exam_records’undaki son FULL deneme tarihi (track filtreli)
)

Streak göstereceksek:

streak = art arda günlerde aktivite var mı? (track filtreli)

UI’da tek satır: ya streak ya last activity (ürün kararına göre).

Basit MVP: sadece last activity yeterli; streak hesaplama “v2” olabilir. (Ama sen “streak yerine last activity aynı şey” dediğin için bu satır aynı komponentte çözülecek.)

Haftalık süre + FULL deneme sayısı

Haftalık pencere: son 7 gün (today dahil)

weeklyMinutes = sum(daily.focusMinutes) + sum(FULL exam.durationMinutes)

weeklyFullExamCount = FULL exam sayısı (duration olmasa da sayılır)

Track filtresi

Koç kartı metrikleri: öğrencinin aktif track’i üzerinden hesaplanır.

Track değişirse kart metrikleri otomatik o track’e göre hesaplanır.

Backend / Supabase Gereksinimleri
1) Öğrencinin activeTrack sync’i

Hedef: Koç, öğrencinin aktif track’ini görebilsin.

profiles (veya mevcut uygun tablo) içine:

active_track text null (TrackId)

Öğrenci settings değişince sync edilir.

2) Koçun öğrenci listesi

coach_students üzerinden koça bağlı öğrenci id’leri çekilir.

3) Ham veri çekimi (koç ekranı için)

Koç tarafında şu sorgular gerekir:

daily_records: studentId + track_id + date (son 7/30 gün)

exam_records: studentId + track_id + date + type + duration_minutes + totals (son 7/30 gün), sadece type=FULL filtrelenebilir

MVP performans: ilk açılışta 7 gün yeter. Detay ekranlarda 30 gün/6 hafta istenirse genişletilir.

Favoriler (Local)

Yeni storage: ritim.coach.favorites.v1

Record<studentId, true>

Liste sıralama:

Favoriler üstte

Son aktivite eski olan üstte (uzun süredir giriş yok → yukarı)

Dosya / Değişiklik Listesi
Yeni

ritim/screens/coach/CoachSelectStudentScreen.tsx (veya app route içinde)

ritim/screens/coach/CoachHomeScreen.tsx (liste kartları burada)

ritim/lib/coach/coachMetrics.ts (computeLastActivity, computeWeeklyMinutes, computeWeeklyFullExamCount)

ritim/lib/storage/coachFavoritesStorage.ts

ritim/lib/storage/storageKeys.ts → COACH_FAVORITES_KEY

Güncellenecek

ritim/screens/SettingsScreen.tsx → Coach Mode giriş

ritim/lib/supabase/* → koç sorguları (gerekli helperlar)

(Backend) profiles veya uygun tablo → active_track alanı + RLS

Acceptance (Done)

 Settings’ten Koç Modu’na girilebiliyor.

 Koç moduna girince öğrenci seçmeden devam edilmiyor (default seçili yok).

 Öğrenci listesinde isim + aktif track + son aktivite görülüyor.

 Favori ⭐ local çalışıyor; favoriler üstte.

 Kartta “Bu hafta: X dk · Y FULL deneme” doğru.

 Son deneme skoru/metrikleri sadece FULL denemelerden etkileniyor.

 Öğrencinin aktif track’i koç ekranında doğru görünüyor (backend’e sync).

Kapsam Dışı

Koçun not yazması + öğrenciye bildirim (ayrı ticket)

Koç dashboard / grafikler

Öğrenci detail ekranında geniş raporlama (ayrı ticket)

Streak algoritmasını derinleştirme (v2)