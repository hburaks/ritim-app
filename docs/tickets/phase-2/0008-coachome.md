T2.8 — Coach Mode Entry + CoachHome (Öğrenci Seçimi ve Liste MVP)

Durum: YAPILACAK

Context

Uygulamada koç modu Phase-2’de açılıyor. Koç, Ayarlar’dan koç moduna geçebilecek ve önce öğrenci seçecek, ardından öğrenci kartlarını liste halinde görecek.

MVP odak:

Öğrenci seçimi (default öğrenci yok)

Öğrenci listesi + kartlar

Favoriler (local)

Son aktivite (streak yerine tek satır)

“Bu hafta: toplam dk + FULL deneme sayısı”

Öğrencinin aktif track bilgisini gösterme (backend’den)

Tombstone kayıtlar görünmeyecek (is_deleted=true filtrelenecek)

N+1 sorgu yapılmayacak (batch fetch + client-side agregasyon)

Not: Metrikler backend’de “summary” olarak tutulmayacak; koç ekranında runtime hesaplanacak (daily_records + exam_records).

Net Kararlar

Koç modu Ayarlar ekranından açılır.

Coach alanına girince default öğrenci seçili gelmez; önce liste/seleksiyon yapılır.

Öğrenci kartları yalnızca öğrencinin aktif track’i üzerinden hesaplanır.

Son aktivite = daily_records veya FULL exam_records içindeki en güncel tarih (track filtreli, tombstone hariç).

“Son deneme skoru” kart MVP’de YOK (ileride eklenebilir). Şimdilik sadece:

“Bu hafta: X dk · Y FULL deneme”

Favoriler sadece local (AsyncStorage).

Tombstone:

daily_records.is_deleted = false

exam_records.is_deleted = false

N+1 yasak: öğrenci başına query yok. Koç ekranı açılışında batch fetch yapılır.

UI Akışı (MVP)
1) Settings → Coach Mode

Dosya: ritim/screens/SettingsScreen.tsx

Yeni satır: “Koç Modu”

Basınca route: /coach

2) Coach Root → Öğrenci Seçimi (ilk ekran)

Yeni route: ritim/app/coach/index.tsx
Yeni screen: ritim/screens/coach/CoachSelectStudentScreen.tsx

Ekran içeriği:

Başlık: “Öğrenci Seç”

Liste (card row):

Öğrenci adı

Aktif track chip (LGS7/LGS8/TYT/AYT)

“Son aktivite: X gün önce” (varsa)

⭐ favori toggle (local)

Opsiyonel: arama input (isime göre)

Seçince: /coach/student/[studentId]

Not: Bu ekran aynı zamanda “CoachHome liste ekranı” olabilir; MVP’de ayrı bir “home” ekranına gerek yok. Seçim yapınca detay route’a geçilir.

3) Coach Student Home (Seçilen öğrenci özet)

Yeni route: ritim/app/coach/student/[studentId].tsx
Yeni screen: ritim/screens/coach/CoachStudentHomeScreen.tsx

Gösterilecekler (minimal):

Üst: Öğrenci adı + track chip

Satır: “Son aktivite: X gün önce” (tek satır, streak yok)

Satır: “Bu hafta: 240 dk · 1 FULL deneme”

Alt: (MVP) sadece listelere giriş linkleri (sonra T2.9/T3 ile genişler)

Data / Hesaplama Kuralları
A) Track filtresi

Koç kart metrikleri öğrencinin active_track değerine göre hesaplanır.

activeTrack = profiles.active_track (TrackId)

Tüm query’lerde track_id = activeTrack

B) Tombstone filtresi

daily_records: is_deleted = false

exam_records: is_deleted = false

exam_records ayrıca: type = 'FULL'

C) Son Aktivite (lastActivityAt)

Son aktivite = max(

track filtreli daily_records içinde en büyük date

track filtreli FULL exam_records içinde en büyük date
)

UI:

“Son aktivite: {diffDays} gün önce”

Eğer hiç kayıt yoksa: “Henüz kayıt yok”

D) Haftalık metrik (son 7 gün)

Pencere: bugün dahil son 7 gün (local today 기준)

weeklyMinutes = sum(daily.focus_minutes) + sum(fullExam.duration_minutes)

duration_minutes null ise 0 say

weeklyFullExamCount = count(full exams) (duration olsa da olmasa da sayılır)

N+1 Problem Çözümü (Zorunlu)
Batch Fetch Stratejisi (MVP)

Koç ekranı açılışında şu adımlar tek seferde yapılır:

coach_students → coach’un bağlı öğrenci ID listesi

profiles → id in (studentIds) için: id, name, active_track

daily_records → user_id in (studentIds) için son 30 gün:

filtre: is_deleted=false, date >= today-30

alanlar: user_id, track_id, date, focus_minutes

exam_records → user_id in (studentIds) için son 30 gün:

filtre: is_deleted=false, type='FULL', date >= today-30

alanlar: user_id, track_id, date, duration_minutes

Sonra client-side:

studentId bazlı grupla

her student için active_track’e göre filtrele

lastActivity ve weekly metrikleri hesapla

30 gün çekmek: “son aktivite” + “son 7 gün” için yeterli. İleride detay ekranlar büyürse genişletilir.

Backend / Supabase Gereksinimleri
1) profiles.active_track (öğrenciden sync)

Migration:

ALTER TABLE public.profiles ADD COLUMN active_track text NULL;

Sync:

Öğrenci activeTrack değişince profiles.active_track update edilir.

2) RLS Policies (kritik)

Koç ham veri okuyacağı için şu SELECT policy’leri şart:

daily_records:

Student: kendi kayıtlarını manage edebilir

Coach: coach_students üzerinden bağlı olduğu öğrencilerin kayıtlarını SELECT edebilir

exam_records:

Student: kendi kayıtlarını manage edebilir

Coach: bağlı öğrencilerin exam kayıtlarını SELECT edebilir

profiles:

Student: kendi profilini update edebilir (active_track)

Coach: bağlı öğrencilerin active_track ve isim alanlarını SELECT edebilir

3) Coach Mode Guard

/coach route’a girildiğinde:

coach_students içinde coach_id = auth.uid() kaydı yoksa:

empty state: “Koç hesabı değil / bağlı öğrencin yok”

geri dön butonu

Favoriler (Local)

Yeni storage: ritim.coach.favorites.v1
Format: Record<studentId, true>

Sıralama:

Favoriler üstte

Favoriler içinde: son aktivitesi en eski olan üstte

Favori olmayanlarda da aynı

Dosya / Değişiklik Listesi
Yeni

ritim/screens/coach/CoachSelectStudentScreen.tsx

ritim/screens/coach/CoachStudentHomeScreen.tsx

ritim/lib/coach/coachMetrics.ts

computeLastActivity(...)

computeWeeklyMinutes(...)

computeWeeklyFullExamCount(...)

filterByActiveTrackAndNotDeleted(...)

ritim/lib/storage/coachFavoritesStorage.ts

ritim/lib/storage/storageKeys.ts → COACH_FAVORITES_KEY

Güncellenecek

ritim/screens/SettingsScreen.tsx → Coach Mode giriş satırı

ritim/lib/supabase/* → koç batch fetch helper’ları (tek yerden)

public.profiles migration → active_track

RLS policy’ler (daily_records, exam_records, profiles)

Acceptance (Done)

 Settings’ten Koç Modu’na girilebiliyor.

 /coach açılınca öğrenci seçmeden devam edilmiyor.

 Koç hesabı değilse (coach_students boş) empty state görünüyor.

 Öğrenci listesinde isim + aktif track chip + son aktivite görünüyor.

 Tombstone kayıtlar metriklere dahil edilmiyor (is_deleted=false).

 “Bu hafta: X dk · Y FULL deneme” doğru hesaplanıyor (track filtreli).

 Favoriler ⭐ local çalışıyor; favoriler üstte sıralanıyor.

 N+1 yok: koç ekranı açılışında öğrenci başına query atılmıyor (batch fetch).

 Öğrencinin aktif track’i backend’den doğru görünüyor (profiles.active_track).

Kapsam Dışı

Koçun not yazması + öğrenciye bildirim (ayrı ticket)

Koç dashboard / grafikler

Öğrenci detay raporlama (ayrı ticket)

Streak algoritmasını detaylandırma (v2)

“Son deneme skoru” kart metrikleri (v2)