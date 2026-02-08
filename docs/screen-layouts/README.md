# Ritim App - Ekran Layout'lari

Bu klasor uygulamadaki tum ekranlarin ve modal bilesenlerin ASCII layout dokumanlarini icerir.

## Ekranlar

| # | Dosya | Ekran | Route |
|---|-------|-------|-------|
| 01 | [onboarding-1](01-onboarding-1.md) | Sinif Secimi | `/onboarding-1` |
| 02 | [onboarding-2](02-onboarding-2.md) | Ilk Gun Kaydi | `/onboarding-2` |
| 03 | [home](03-home.md) | Ana Ekran | `/` |
| 04 | [days](04-days.md) | Gunler | `/days` |
| 05 | [week](05-week.md) | Hafta Detay | `/week/[weekStart]` |
| 06 | [topics](06-topics.md) | Konular | `/topics` |
| 07 | [settings](07-settings.md) | Ayarlar | `/settings` |
| 08 | [playground](08-playground.md) | Bilesen Vitrin | `/playground` |

## Modal / Sheet Bilesenleri

| # | Dosya | Bilesen |
|---|-------|---------|
| 10 | [day-entry-sheet](10-day-entry-sheet.md) | Gun Girisi Bottom Sheet |
| 11 | [bottom-sheet](11-bottom-sheet.md) | Alt Panel (genel) |
| 12 | [confirm-dialog](12-confirm-dialog.md) | Onay Diyalogu |

## Navigasyon Akisi

```
onboarding-1 → onboarding-2 → / (home)
                                  │
                          ┌───────┼───────┐
                          ▼       ▼       ▼
                        /days   /topics  /settings
                          │
                          ▼
                   /week/[weekStart]
```

## Kullanilan Ortak Bilesenler
- `PrimaryButton` - Ana aksiyon butonu
- `TextLink` - Metin baglantisi
- `Chip` - Secim chip'i (filtre/secim)
- `DotRow` - Haftalik ritim nokta gostergesi
- `BottomSheet` - Alt panel modal
- `DayEntrySheet` - Gun girisi formu (BottomSheet sarar)
- `ConfirmDialog` - Onay diyalogu
- `IconSymbol` - SF Symbols ikonu
