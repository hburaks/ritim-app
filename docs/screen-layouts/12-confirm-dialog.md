# ConfirmDialog - Onay Diyalogu

**Dosya:** `components/ConfirmDialog.tsx`
**Kullanildigi ekranlar:** HomeScreen, WeekScreen

```
┌──────────────────────────────────┐
│                                  │
│    (overlay - rgba koyu)         │
│    (tiklaninca onCancel)         │
│                                  │
│     ┌──────────────────────┐     │
│     │                      │     │
│     │  Kaydı sil?          │     │
│     │  (title)             │     │
│     │                      │     │
│     │  Bu günün kaydı      │     │
│     │  tamamen silinecek.  │     │
│     │  (message)           │     │
│     │                      │     │
│     │  ┌────────┐┌───────┐ │     │
│     │  │ Vazgeç ││  Sil  │ │     │
│     │  │(cancel)││(confm)│ │     │
│     │  └────────┘└───────┘ │     │
│     │   (actions row)      │     │
│     │                      │     │
│     └──────────────────────┘     │
│       (card - %84 genislik)      │
│                                  │
└──────────────────────────────────┘
```

## Notlar
- Iki mod destekler: `modal` (varsayilan) ve `inline`
- Modal modda React Native `Modal` ile render edilir
- Inline modda absoluteFill ile pozisyonlanir
- Kart genisligi: %84
- Butonlar yan yana, esit genislikte (flex: 1)
- Vazgec: border'li, beyaz arka plan
- Sil/Onayla: koyu arka plan, beyaz yazi
