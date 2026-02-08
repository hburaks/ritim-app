# Onboarding 1 - Sinif Secimi

**Dosya:** `screens/Onboarding1Screen.tsx`
**Route:** `/onboarding-1`

```
┌──────────────────────────────────┐
│         SafeAreaView             │
│                                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │  Bu uygulama odaklanma     │  │
│  │  ritmi kazanmanı           │  │
│  │  kolaylaştırmak için var.  │  │
│  │           (title)          │  │
│  │                            │  │
│  │  Kaçıncı sınıftasın? (7/8)│  │
│  │         (subtitle)         │  │
│  │                            │  │
│  │  ┌─────┐  ┌─────┐         │  │
│  │  │  7  │  │  8  │         │  │
│  │  └─────┘  └─────┘         │  │
│  │     (Chip)   (Chip)       │  │
│  │                            │  │
│  │  Günde sadece 1 kez       │  │
│  │  girmen yeterli.          │  │
│  │  30 saniyeden kısa sürer. │  │
│  │         (helper)          │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│           (spacer)               │
│                                  │
│  ┌────────────────────────────┐  │
│  │         DEVAM              │  │
│  │     (PrimaryButton)        │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

## Notlar
- `justifyContent: 'space-between'` ile icerik ust, buton alt kisimda
- Sinif secilmeden "Devam" butonu disabled
- Onboarding tamamlandiysa otomatik `/` adresine yonlendirir
