# Week Screen - Hafta Detay

**Dosya:** `screens/WeekScreen.tsx`
**Route:** `/week/[weekStart]`

```
┌──────────────────────────────────┐
│         SafeAreaView             │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Hafta              ← Geri │  │
│  │ (title)          (TextLink)│  │
│  │                            │  │
│  │ 03.02 - 09.02             │  │
│  │ (subtitle / weekLabel)     │  │
│  │                            │  │
│  │ ● ● ○ ● ○ ○ ○            │  │
│  │ (DotRow)                   │  │
│  └────────────────────────────┘  │
│    (header)                      │
│                                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │ Pzt          120 dk · 10  │  │
│  │ ─────────────────────────  │  │
│  │ Sal          90 dk · 8    │  │
│  │ ─────────────────────────  │  │
│  │ Car          —            │  │
│  │ ─────────────────────────  │  │
│  │ Per          60 dk · 5    │  │
│  │ ─────────────────────────  │  │
│  │ Cum          —            │  │
│  │ ─────────────────────────  │  │
│  │ Cmt          —            │  │
│  │ ─────────────────────────  │  │
│  │ Paz          —            │  │
│  │                            │  │
│  └────────────────────────────┘  │
│    (list)                        │  │
│                                  │
└──────────────────────────────────┘
```

## Acilan Modaller

### Gun Detay BottomSheet
Bir gune tiklandiginda acilir:
```
┌──────────────────────────────────┐
│          (overlay)               │
│                                  │
│  ┌────────────────────────────┐  │
│  │       ═══ (handle)         │  │
│  │  Pazartesi                 │  │
│  │  (title)                   │  │
│  │                            │  │
│  │  Toplam: 120 dk · 10 soru │  │
│  │  (detailSummary)           │  │
│  │                            │  │
│  │  Matematik          5     │  │
│  │  Türkçe             3     │  │
│  │  Fen                2     │  │
│  │  (breakdownList)           │  │
│  │                            │  │
│  │  Duzenle →                │  │
│  │  (editLink)                │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```
- "Duzenle" tiklaninca -> `DayEntrySheet` acilir
- Silme onayı -> `ConfirmDialog`
