# Engineering Rules (Faz-1)

## 1) Repo hedefi
- Sadece Faz-1 öğrenci deneyimi.
- Küçük diff, küçük commit.
- "Contract" kurallarını bozma.

## 2) Klasör yapısı (öneri)
src/
  screens/
  components/
  features/
    onboarding/
    records/
    days/
    topics/
  lib/
    date/
    storage/
    notifications/
  store/

## 3) Kod kuralları
- Her PR/ticket 1 ana amaç.
- UI bileşenleri "dumb", state feature/store’da.
- Tarih/hafta hesapları tek yerde (src/lib/date).
- Notification scheduling tek yerde (src/lib/notifications).
- Storage erişimi tek yerde (src/lib/storage).

## 4) Naming
- Screen: HomeScreen, Onboarding1Screen
- Component: DotRow, PrimaryButton, Chip
- Feature state: useRecordsStore, useTopicsStore

## 5) Test (minimum)
- Tarih: week start, today key, last 2 days logic.
- Push: shouldScheduleDailyReminder(todayHasRecord=false) gibi saf fonksiyonlar.

## 6) Agent/Codex çalışma şekli
- Her ticket: kapsam + acceptance criteria + dosya sınırı içerir.
- Agent ek ekran/feature ekleyemez.
- Agent varsayım yaparsa kod içine TODO değil, ticket’ta sorulacak.
