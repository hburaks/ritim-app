# DayEntrySheet - Gun Girisi Bottom Sheet

**Dosya:** `components/DayEntrySheet.tsx`
**Kullanildigi ekranlar:** HomeScreen, WeekScreen, Onboarding2Screen

```
┌──────────────────────────────────┐
│          (overlay)               │
│                                  │
│                                  │
│  ┌────────────────────────────┐  │
│  │       ═══ (handle)         │  │
│  │                            │  │
│  │  Bugün / İlk gün    (🗑) │  │
│  │  (title)        (delete?)  │  │
│  │                            │  │
│  │  ── Süre ────────────────  │  │
│  │                            │  │
│  │  (−)   45 dk   (+)        │  │
│  │  (durationRow)             │  │
│  │                            │  │
│  │  [20dk][30dk][60dk]        │  │
│  │  [90dk][120dk][180dk]      │  │
│  │  (duration chips)          │  │
│  │                            │  │
│  │  ── Tür ─────────────────  │  │
│  │                            │  │
│  │  [Konu] [Soru] [Karışık]  │  │
│  │  (type chips)              │  │
│  │                            │  │
│  │  ── Soru Sayısı ────────  │  │
│  │  (sadece Soru/Karışık)     │  │
│  │                            │  │
│  │  Matematik   (−) [__] (+)  │  │
│  │  Türkçe      (−) [__] (+)  │  │
│  │  Fen         (−) [__] (+)  │  │
│  │  İnkılap     (−) [__] (+)  │  │
│  │  İngilizce   (−) [__] (+)  │  │
│  │  (questionList)            │  │
│  │                            │  │
│  │  ┌────────────────────┐    │  │
│  │  │      KAYDET        │    │  │
│  │  └────────────────────┘    │  │
│  │  (PrimaryButton)           │  │
│  │                            │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

## Notlar
- BottomSheet bilesenini sarar
- Tur "KONU" seciliyken soru sayisi bolumu gizlenir
- Tur "SORU" veya "KARISIK" seciliyken derse gore soru sayisi girisi gosterilir
- Sure: min 5dk, max 180dk, 5'er adim (+/- butonlari)
- Soru stepper: 5'er adim (+/- butonlari), el ile de girilebilir
- Silme butonu (cop kutusu ikonu) sadece mevcut kayit varsa gosterilir
- Silme butonu tiklaninca sheet kapanir, 240ms sonra ConfirmDialog acilir
