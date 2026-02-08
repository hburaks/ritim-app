# BottomSheet - Alt Panel

**Dosya:** `components/BottomSheet.tsx`
**Kullanildigi yerler:** DayEntrySheet, WeekScreen detay, PlaygroundScreen

```
┌──────────────────────────────────┐
│                                  │
│    (overlay - animated opacity)  │
│    (tiklaninca onClose cagirilir)│
│                                  │
│                                  │
│                                  │
│  ┌────────────────────────────┐  │
│  │       ════ (handle)        │  │
│  │       (44x5px, rounded)    │  │
│  │                            │  │
│  │  ┌────────────────┬─────┐  │  │
│  │  │ Title          │(hdr)│  │  │
│  │  │ (opsiyonel)    │Right│  │  │
│  │  └────────────────┴─────┘  │  │
│  │    (headerRow)             │  │
│  │                            │  │
│  │  {children}                │  │
│  │                            │  │
│  │                            │  │
│  └────────────────────────────┘  │
│    (sheet - animated translateY) │
└──────────────────────────────────┘
```

## Notlar
- Modal olarak render edilir (transparent)
- Acilis/kapanis animasyonu: translateY + overlay opacity
- Acilis: 260ms translateY, 220ms opacity
- Kapanis: 220ms translateY, 200ms opacity
- Sheet yuksekligi: 360px sabit
- borderTopLeftRadius + borderTopRightRadius ile yuvarlak ust koseler
