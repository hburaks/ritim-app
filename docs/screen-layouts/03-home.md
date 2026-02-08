# Home Screen - Ana Ekran

**Dosya:** `screens/HomeScreen.tsx`
**Route:** `/` (index)

```
┌──────────────────────────────────┐
│         SafeAreaView             │
│  ┌────────────────────────────┐  │
│  │  ScrollView                │  │
│  │                            │  │
│  │  ┌──────────────────┬───┐  │  │
│  │  │ BUGÜN            │(⚙)│  │  │
│  │  │ Ritmini gözden   │   │  │  │
│  │  │ geçir            │   │  │  │
│  │  └──────────────────┴───┘  │  │
│  │    (minimalHeader)         │  │
│  │                            │  │
│  │  ┌────────────────────┐    │  │
│  │  │  HAFTALIK RİTİM    │    │  │
│  │  │   (sectionTitle)   │    │  │
│  │  │                    │    │  │
│  │  │ ┌────────────────┐ │    │  │
│  │  │ │● ● ○ ● ○ ○ ◐  │ │    │  │
│  │  │ │  (DotRow)      │ │    │  │
│  │  │ └────────────────┘ │    │  │
│  │  │   (dotCapsule)     │    │  │
│  │  └────────────────────┘    │  │
│  │                            │  │
│  │  ┌────────────────────┐    │  │
│  │  │ [illustration.png] │    │  │
│  │  │    (300px height)  │    │  │
│  │  └────────────────────┘    │  │
│  │                            │  │
│  │  ┌────────────────────┐    │  │
│  │  │ Bugün Odak Kaydı   │    │  │
│  │  │ (cardTitle)        │    │  │
│  │  │                    │    │  │
│  │  │ Kayit varsa:       │    │  │
│  │  │ (●) Bugün          │    │  │
│  │  │     odaklandın     │    │  │
│  │  │                    │    │  │
│  │  │ Kayit yoksa:       │    │  │
│  │  │ Bugün henüz odak   │    │  │
│  │  │ kaydı yok          │    │  │
│  │  │                    │    │  │
│  │  │ ┌────────────────┐ │    │  │
│  │  │ │ BUGÜN ODAKLANDIM│ │    │  │
│  │  │ │ veya            │ │    │  │
│  │  │ │ KAYDI DÜZENLE   │ │    │  │
│  │  │ └────────────────┘ │    │  │
│  │  └────────────────────┘    │  │
│  │    (focusCard)             │  │
│  │                            │  │
│  │  ──────────────────────    │  │
│  │         (divider)          │  │
│  │                            │  │
│  │  ┌──────────────────┬──┐   │  │
│  │  │ Günler           │ >│   │  │
│  │  │ Geçmişini        │  │   │  │
│  │  │ görüntüle        │  │   │  │
│  │  └──────────────────┴──┘   │  │
│  │                            │  │
│  │  ┌──────────────────┬──┐   │  │
│  │  │ Konular          │ >│   │  │
│  │  │ Konu hissi       │  │   │  │
│  │  │ işaretle         │  │   │  │
│  │  └──────────────────┴──┘   │  │
│  │    (navSection)            │  │
│  │                            │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

## Acilan Modaller
- "BUGÜN ODAKLANDIM / KAYDI DÜZENLE" -> `DayEntrySheet` (bkz. `10-day-entry-sheet.md`)
- Silme onayı -> `ConfirmDialog` (bkz. `12-confirm-dialog.md`)
- Ayarlar ikonu -> `/settings` ekranina navigasyon
- "Günler" -> `/days` ekranina navigasyon
- "Konular" -> `/topics` ekranina navigasyon
