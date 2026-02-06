Sıradaki iş: Records Store + Home Screen Mantığı

Amaç:
Onboarding’den sonra gerçek uygulama davranışını başlatmak.
Gün kayıtlarını merkezi bir store’da tutmak ve Home ekranını “bugün kayıt var/yok” durumuna göre çalışır hale getirmek.

---

1) Record Model + Store

Aşağıdaki modeli ve basit store’u oluştur:

Model:
DailyRecord
- date: string (YYYY-MM-DD)
- focusMinutes: number
- activityType: 'KONU' | 'SORU' | 'KARISIK'
- questionCount?: number
- subjectBreakdown?: Record<string, number>

Store fonksiyonları:
- upsertRecord(record)
- getRecordByDate(date)
- hasRecordForDate(date)
- getWeekDots(weekStartDate) -> [true/false x7]

Kurallar:
- Tarih hesapları local date ile.
- Haftalar Pazartesi başlangıçlı kabul edilsin.
- Storage yok (şimdilik in-memory).

---

2) Onboarding Sheet Entegrasyonu

- Onboarding2’deki “İlk günü doldurma” sheet’i kaydet’e basınca:
  - Bugünün kaydını store’a upsert etsin.
  - Onboarding tamamlandı flag’i set edilsin.
  - Navigation Home ekranına geçsin.

---

3) HomeScreen Uygulaması

HomeScreen iki state’i desteklemeli:

A) Bugün kayıt YOK ise:
- Üstte DotRow (store’dan gelen 7 günlük dolu/boş).
- PrimaryButton: “Bugün odaklandım”
- Butona basınca DayEntrySheet açılır (create mode).

B) Bugün kayıt VAR ise:
- Üstte DotRow.
- “Bugün: {focusMinutes} dk · {activityType} · {questionCount}”
  (questionCount yoksa sadece dk + tür göster)
- “Düzenle →” satırı.
- Satıra basınca DayEntrySheet edit mode açılır.

---

4) DayEntrySheet’in Genelleştirilmesi

- Onboarding’de kullanılan sheet’i ortak bileşen gibi kullan.
- create ve edit modlarını desteklesin.
- Edit modunda mevcut kayıt değerleri otomatik dolsun.
- Kaydet:
  - upsertRecord çağrılır
  - sheet kapanır
  - HomeScreen anında güncellenir

---

5) Navigation

- Onboarding tamamlandıysa uygulama doğrudan HomeScreen ile açılmalı.
- Onboarding bitmeden Home’a gidilmemeli.

---

KURALLAR (çok önemli):

- Yeni UI component üretme.
- Mevcut: PrimaryButton, Chip, DotRow, BottomSheet kullanılacak.
- Playground ekranına dokunma.
- Kalıcı storage ekleme (bir sonraki iş).
- Push logic ekleme (şimdilik yok).

---

Kabul Kriterleri:

- Bugün kayıt yokken Home’da doğru state görünür.
- Kayıt eklenince DotRow’daki ilgili gün dolu olur.
- Edit yapınca güncelleme anında yansır.
- Onboarding sonrası Home otomatik açılır.
- Tüm UI theme tokens ile uyumlu kalır.
