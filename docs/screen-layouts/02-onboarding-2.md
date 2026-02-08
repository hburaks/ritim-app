# Onboarding 2 - Ilk Gun Kaydi

**Dosya:** `screens/Onboarding2Screen.tsx`
**Route:** `/onboarding-2`

```
┌──────────────────────────────────┐
│         SafeAreaView             │
│                                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │  Bu hafta                  │  │
│  │  (dotTitle)                │  │
│  │                            │  │
│  │  ● ○ ○ ○ ○ ○ ○            │  │
│  │  (DotRow - activeIndex=-1) │  │
│  │                            │  │
│  │  Her odaklandığında bir    │  │
│  │  gün dolacak.             │  │
│  │  (description)             │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│           (spacer)               │
│                                  │
│  ┌────────────────────────────┐  │
│  │   İLK GÜNÜ DOLDURALIM     │  │
│  │     (PrimaryButton)        │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

## Acilan Modal
- Butona basilinca `DayEntrySheet` acilir (bkz. `10-day-entry-sheet.md`)
- Kayit yapilinca onboarding tamamlanir, bildirim izni istenir, `/` adresine yonlendirilir
