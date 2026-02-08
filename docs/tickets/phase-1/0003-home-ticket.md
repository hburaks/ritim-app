Sıradaki iş: Records Store + Home 2-state

1) Record model + store kur:
- DailyRecord: date (YYYY-MM-DD), focusMinutes, activityType, questionCount?, subjectBreakdown?
- Store: records listesi, upsert, getByDate, weekDots (7 gün için dolu/boş)

2) Onboarding sheet kaydet:
- Kaydet’e basınca store’a bugünün kaydını yaz.
- Onboarding bitti flag’i set edilsin.
- Home’a geçince bugün kayıt var state’i görünmeli.

3) HomeScreen uygula:
- Üstte DotRow: bu haftanın 7 günü (dolu/boş store’dan).
- Eğer bugün kayıt yoksa:
  - PrimaryButton: “Bugün odaklandım” -> DayEntrySheet aç.
- Eğer bugün kayıt varsa:
  - “Bugün: 45 dk · Soru · 60” satırı + “Düzenle →”
  - Satıra tıklayınca DayEntrySheet edit modunda aç.

4) DayEntrySheet:
- Onboarding’deki sheet logic’ini ortak hale getir (reuse).
- Edit modunda mevcut değerleri doldur.
- Kaydet upsert yapsın.

Kurallar:
- Yeni UI component üretme (mevcut Button/Chip/DotRow/BottomSheet kullan).
- Storage yok (persist sonra).
- Gün hesapları local date ile.
