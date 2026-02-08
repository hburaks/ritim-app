# Days Screen - Gunler

**Dosya:** `screens/DaysScreen.tsx`
**Route:** `/days`

```
┌──────────────────────────────────┐
│         SafeAreaView             │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Günler            ← Geri  │  │
│  │ (title)          (TextLink)│  │
│  └────────────────────────────┘  │
│    (headerRow)                   │
│                                  │
│  ┌────────────────────────────┐  │
│  │ ┌──────────────────────┐   │  │
│  │ │ Bu hafta             │   │  │
│  │ │ (weekLabel)          │   │  │
│  │ │                      │   │  │
│  │ │ ● ● ○ ● ○ ○ ○       │   │  │
│  │ │ (DotRow)             │   │  │
│  │ │                      │   │  │
│  │ │ 120 dk · 45 soru     │   │  │
│  │ │ (weekSummary)        │   │  │
│  │ └──────────────────────┘   │  │
│  │       (weekBlock)          │  │
│  │                            │  │
│  │ ┌──────────────────────┐   │  │
│  │ │ -1 hafta             │   │  │
│  │ │ ○ ● ● ○ ● ○ ●       │   │  │
│  │ │ 90 dk · 30 soru      │   │  │
│  │ └──────────────────────┘   │  │
│  │                            │  │
│  │ ┌──────────────────────┐   │  │
│  │ │ -2 hafta             │   │  │
│  │ │ ○ ○ ○ ○ ○ ○ ○       │   │  │
│  │ │ —                    │   │  │
│  │ └──────────────────────┘   │  │
│  │                            │  │
│  │ ┌──────────────────────┐   │  │
│  │ │ -3 hafta             │   │  │
│  │ │ ○ ○ ○ ○ ○ ○ ○       │   │  │
│  │ │ —                    │   │  │
│  │ └──────────────────────┘   │  │
│  │                            │  │
│  └────────────────────────────┘  │
│    (weeksList)                   │
│                                  │
└──────────────────────────────────┘
```

## Notlar
- 4 hafta gosterilir (bu hafta + onceki 3 hafta)
- Her hafta blogu tiklanabilir -> `/week/[weekStart]` ekranina navigasyon
- Hafta bloklari border + border-radius ile kart gorunumunde
- Kayit yoksa ozet kisminda "—" gosterilir
