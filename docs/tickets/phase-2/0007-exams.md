T2.7 — Denemeler (Exam Records) Altyapısı

Durum: YAPILACAK

Amaç

Uygulamaya “Deneme” kavramını eklemek:

Öğrenci aynı gün birden fazla deneme kaydı girebilsin

Denemeler aktif track’e bağlı olsun

Deneme süreleri günlük toplam süreye UI seviyesinde eklensin

Denemeler koça senkronize edilsin

Geçmiş denemeler düzenlenip silinebilsin

Bu ticket yalnızca altyapıyı ve temel akışları kapsar.
Filtreleme ve gelişmiş listeleme T2.8’de ele alınacak.

TEMEL PRENSİPLER
1) Denemeler bağımsız domain

DailyRecord içine gömülmez

Kendi store’u vardır: exams.tsx

Kendi storage katmanı vardır: examsStorage.ts

2) Günlük kayıtla ilişki – ama bağımsız veri

Deneme girişleri günlük kayıt ekranı içinden yapılır

Ancak verisel olarak günlük kayıttan bağımsız tutulur

3) Süre Hesaplama (Net Karar)

❗ Deneme süreleri DailyRecord.focusMinutes alanını ASLA değiştirmez.

Toplam süre yalnızca UI’da hesaplanır:

totalMinutes =
  dailyRecord.focusMinutes +
  sum(examsForThatDay.map(e => e.durationMinutes ?? 0))


Bu sayede:

Deneme silme/düzenleme veri tutarlılığını bozmaz

Sync tarafı sade kalır

“Çift hesaplama” hatası oluşmaz

4) Net Hesaplama (Track’e Göre)

Net hesaplama yalnızca UI’da yapılır, veritabanına yazılmaz.

Track	Kural
LGS7 / LGS8	3 yanlış 1 doğruyu götürür
TYT / AYT	4 yanlış 1 doğruyu götürür
function calculateNet(trackId, correct, wrong) {
  const divisor = trackId.startsWith("LGS") ? 3 : 4
  return correct - wrong / divisor
}


Ondalık gösterim UI tercihi: toFixed(2)

VERİ MODELİ
ExamRecord (Local Model)
type ExamType = 'FULL' | 'BRANCH'

type ExamRecord = {
  id: string            // uuid
  trackId: TrackId
  date: string          // YYYY-MM-DD
  type: ExamType

  subjectKey?: string   // sadece BRANCH için

  correct?: number
  wrong?: number
  blank?: number

  durationMinutes?: number

  isDeleted: boolean
  deletedAtMs?: number | null

  createdAtMs: number
  updatedAtMs: number
}

SİLME MANTIĞI (TOMBSTONE)
Çok Önemli Karar

Hard delete yok

Silme = tombstone

Silme işlemi:
isDeleted = true
deletedAtMs = now
updatedAtMs = now

UI davranışı

Varsayılan listeler: !isDeleted filtreli gösterilir

Silinen deneme görünmez

Sync sırasında silme bilgisi de cloud’a gider

Geri alma (opsiyonel)

Snackbar “Geri al” ile aynı UUID revive edilebilir

Bu overwrite değil, undelete olur

Yeniden ekleme

Silinen denemeyi “yeniden eklemek” = yeni UUID ile yeni kayıt

SUPABASE TARAFI
Yeni Tablo: exam_records

Alanlar:

id (uuid, PK)

user_id (fk → profiles)

track_id (text)

date (date)

type (text)

subject_key (text, nullable)

correct (int, nullable)

wrong (int, nullable)

blank (int, nullable)

duration_minutes (int, nullable)

is_deleted (boolean)

deleted_at (timestamptz, nullable)

created_at (timestamptz)

updated_at (timestamptz)

Index
CREATE INDEX ON exam_records (user_id, track_id, date DESC);

Unique

PK: id yeterli

Composite unique gerekli değil

SYNC DAVRANIŞI

Denemeler için sync kuralı, günlük kayıtlarla birebir aynıdır:

Push

Her local değişiklik → upsert

Initial Pull

Koça bağlanıldığında: son 30 gün denemeler çekilir

Delete Sync

Silme de upsert olarak gider (is_deleted=true)

Hard delete API yok

STORAGE KATMANI

Dosya: ritim/lib/storage/examsStorage.ts

AsyncStorage key: ritim.exams.v1

Format:

Record<string, ExamRecord>

STATE KATMANI

Dosya: ritim/state/exams.tsx

Fonksiyonlar:

addExam(exam)

updateExam(exam)

removeExam(id) → tombstone

getExamsForDate(trackId, date)

getExamsForTrack(trackId)

UI AKIŞLARI
1) Günlük Kayıt Ekranı (DayEntrySheet)
Yeni bölüm: DENEMELER
DENEMELER
-------------------------
+ Deneme Ekle

- TYT Full (80 dk)
- Matematik Branş (40 dk)


Her satırda:

Düzenle ikonu

Sil ikonu

Deneme Ekle / Düzenle Formu

Alanlar:

Deneme Türü

FULL

BRANCH → ders seçimi açılır

Süre (dakika)

Doğru

Yanlış

Boş

Süre Badge’i

Deneme kaydedildiğinde günlük ekranda:

🟢 “Deneme süresi toplam süreye eklendi”

2) Geçmiş Gün Düzenleme

Günler ekranından eski bir güne girildiğinde

O güne ait denemeler listelenir

Düzenlenebilir / silinebilir

3) Deneme Geçmişi Ekranı (MVP)

Yeni route:

/exams

Özellikler:

Sadece aktif track’in denemeleri

Tarihe göre sıralı

Tıklanınca düzenleme bottomsheet’i

Filtreleme detayları T2.8’de

TRACK DAVRANIŞI
Görünürlük Kuralı

Kullanıcı hangi track’teyse yalnızca o track’in denemeleri görünür

Örnek:

Bugün TYT denemesi girdi

Sonra AYT track’ine geçti

→ TYT denemeleri görünmez
(ama veride durur)

Bu davranış: ONAYLANDI

DOSYA LİSTESİ
Yeni

ritim/types/exam.ts

ritim/lib/storage/examsStorage.ts

ritim/state/exams.tsx

ritim/screens/ExamsScreen.tsx

Güncellenecek

DayEntrySheet.tsx

sync.ts

_layout.tsx (provider ekleme)

navigation routes

DONE KRİTERLERİ

 Deneme eklenebiliyor

 Aynı güne birden fazla deneme girilebiliyor

 Düzenleme / silme çalışıyor

 Toplam süre UI’da doğru hesaplanıyor

 Süre badge’i görünüyor

 Track bazlı filtreleme doğru

 Koça senkronize oluyor

 Geçmiş günlerde düzenlenebiliyor

 Net hesaplaması doğru

 TYT/AYT 4 yanlış, LGS 3 yanlış kuralı doğru

 Silme tombstone ile çalışıyor

TEST SENARYOLARI

LGS7’de FULL deneme ekle

Aynı güne ikinci deneme ekle

Süre gir → toplam süre doğru hesaplanıyor

Deneme sil → listeden kayboluyor

Track değiştir → diğer track’in denemeleri görünmüyor

Geri dön → önceki track denemeleri duruyor

Koça bağlıyken sync oluyor

Net hesabı doğru

Kapsam Dışı

Gelişmiş filtreler

Grafik/istatistik

TYT/AYT konu içerikleri

Koç paneli detay ekranı

(Bunlar T2.8 – T2.10)