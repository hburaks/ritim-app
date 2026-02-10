T2.7 — Denemeler Altyapısı + Geçmiş Ekranı + Koça Sync

Durum: YAPILACAK

Amaç

Deneme kayıtlarını track-aware şekilde eklemek ve yönetmek

Denemeyi günlük kayıt ekranından hızlıca girmek

Denemeleri ayrı store’da tutmak

Deneme geçmişini ayrı ekranda listeleyip düzenleyebilmek

Koça bağlıyken son 30 gün denemelerini Supabase’e sync etmek

Deneme süresini günün toplam süresine otomatik eklemek

Net Kararlar (Bağlayıcı)
Giriş Noktası

Deneme girişi DayEntrySheet içinde yapılır.

Aynı gün birden fazla deneme girilebilir.

Denemenin tarihi:

Hangi gün düzenleniyorsa o günün denemesidir

Ayrı tarih seçimi yoktur

Track Davranışı

Denemeler track bazlıdır

Öğrenci yalnızca aktif track’in denemelerini görür

Track değişince:

Başka track’in denemeleri görünmez (ama silinmez)

Yeni girilen denemeler yeni track’e yazılır

Süre (Duration) Kuralı

Deneme ekranında durationMinutes alanı olacak

Kullanıcı deneme süresi girerse:

Kural:

Bu süre, otomatik olarak o günün focus_minutes alanına eklenir

UI’da açıkça:

🟢 “Deneme süresi toplam süreye eklendi”

badge’i gösterilir.

Geçmiş Ekranı

Ayrı bir Deneme Geçmişim ekranı olacak

Bu ekranda:

Aktif track’in tüm denemeleri listelenir

Eski denemeler düzenlenebilir

Denemeler silinebilir

Düzenleme ekranı:

DayEntrySheet içindeki deneme edit UI’ının aynısıdır

Yani kullanıcı günlük kayıt düzenler gibi deneme düzenler

Sync Kuralları

Sync davranışı daily_records ile tamamen aynı:

Kullanıcı login olmuşsa

Koça bağlıysa

Ve kayıt son 30 güne aitse
→ Supabase’e sync edilir

Koç Davranışı

Denemeler koça da gönderilir

Koç panelinde:

Öğrencinin denemelerini görebilir

Varsayılan filtre: öğrencinin aktif track’i

(Koç tarafında track seçimi ileride ayrı ticket)

Veri Modeli
Local Model – ExamRecord
type ExamRecord = {
  id: string
  trackId: TrackId
  date: string        // YYYY-MM-DD
  type: 'FULL' | 'BRANCH'
  subjectKey?: string
  durationMinutes?: number

  correct?: number
  wrong?: number
  blank?: number

  createdAt: number
  updatedAt: number
}


Önemli:

Denemeler DailyRecord içine gömülmez

Tamamen ayrı bir store’da tutulur

Local Storage Tasarımı
Yeni Dosyalar
ritim/state/exams.tsx
ritim/lib/storage/examsStorage.ts
ritim/lib/exam/types.ts

Storage Key
ritim.exams.v1

Helper API

upsertExam(exam: ExamRecord)

deleteExam(examId: string)

listExamsByTrack(trackId)

listExamsByTrackAndDate(trackId, date)

listExamsForLast30Days(trackId)

Supabase Tarafı
Yeni Tablo: exam_records

Kolonlar:

column	type
id	uuid (pk)
user_id	uuid
track_id	text
date	text
type	text
subject_key	text
duration_minutes	int
correct	int
wrong	int
blank	int
updated_at	timestamp
Sync Conflict Key
UNIQUE(user_id, id)

Index
(user_id, track_id, date desc)

UI / UX
1) DayEntrySheet Güncellemeleri

Yeni bölüm:

DENEME

Liste (0..n)

Her item:

FULL veya BRANCH + ders adı

Sağda küçük sil ikonu

Altında:

[ + Deneme Ekle ]

Deneme Ekle Formu

Alanlar:

Tür: FULL / BRANCH

(BRANCH ise) Ders seçimi

Süre (dakika)

Doğru / Yanlış / Boş (opsiyonel)

Kaydedince:

ExamRecord store’a yazılır

Eğer süre girildiyse:

Günün focus_minutes’ine eklenir

Badge görünür:

🟢 “Deneme süresi toplam süreye eklendi”

2) Yeni Ekran: “Deneme Geçmişim”

Amaç:

Aktif track’in tüm denemelerini görmek ve düzenlemek

Özellikler:

Liste:

Tarihe göre sıralı

Kart görünümü

Kart içinde:

Tarih

Tür

Ders

Süre

Doğru/Yanlış/Boş

Aksiyonlar:

Düzenle → aynı bottomsheet

Sil

Filtre:

Ek filtre UI yok (aktif track otomatik filtre)

Kod Entegrasyon Noktaları
Etkilenecek Dosyalar

DayEntrySheet.tsx

HomeScreen.tsx (badge gösterimi)

ritim/state/exams.tsx

ritim/lib/storage/examsStorage.ts

ritim/lib/supabase/sync.ts

SettingsScreen.tsx (gerekirse navigation)

Yeni: ExamHistoryScreen.tsx

Acceptance (Done Kriterleri)

 DayEntrySheet içinde “Deneme” bölümü var

 Aynı güne birden fazla deneme eklenebiliyor

 Deneme silinebiliyor

 Deneme süresi girilince günün toplam süresine ekleniyor

 “Toplam süreye eklendi” badge’i görünüyor

 Track değişince farklı track denemeleri görünmüyor

 Deneme Geçmişim ekranı var

 Geçmişteki denemeler düzenlenebiliyor

 Local storage kalıcı çalışıyor

 Login + koç bağlı + last 30 days koşulunda Supabase’e sync oluyor

Test Senaryoları

LGS7’de bugüne FULL deneme ekle → listede gör

Aynı güne BRANCH(Mat) ekle → ikisi de gör

Süre gir → toplam süre artmış olsun + badge gör

Deneme sil → sadece o silinsin

Track’i LGS8 yap → LGS7 denemeleri görünmesin

Geçmiş ekranında denemeyi aç → düzenle → kaydet

İnternetsiz ekle → online olunca sync olsun

Koça bağlı hesapta denemeler cloud’a düşsün

Kapsam Dışı

Koç paneli UI (T2.10)

Denemeler için gelişmiş filtreleme

TYT/AYT konuları

Analytics / rapor ekranı