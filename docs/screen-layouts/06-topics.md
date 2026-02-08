# Topics Screen - Konular

**Dosya:** `screens/TopicsScreen.tsx`
**Route:** `/topics`

```
┌──────────────────────────────────┐
│         SafeAreaView             │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Konular            ← Geri │  │
│  │ (title)          (TextLink)│  │
│  │                            │  │
│  │ Sınıf: 8                  │  │
│  │ (subtitle - opsiyonel)     │  │
│  │                            │  │
│  │ Bu hisler sadece senin     │  │
│  │ için. Nerelere daha fazla  │  │
│  │ odaklanman gerektiğini     │  │
│  │ görmene yardımcı olur.    │  │
│  │ (description)              │  │
│  │                            │  │
│  │ Durumlar: Zor · İyi · —   │  │
│  │ (moodHint)                 │  │
│  └────────────────────────────┘  │
│    (header)                      │
│                                  │
│  ┌────────────────────────────┐  │
│  │ [Tümü] [Mat] [Türk]       │  │
│  │ [Fen] [İnkılap]           │  │
│  │ (filters - Chip row)       │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │ Doğal Sayılar    [Zor][İyi]│  │
│  │ ─────────────────────────  │  │
│  │ Tam Sayılar      [Zor][İyi]│  │
│  │ ─────────────────────────  │  │
│  │ Rasyonel Sayılar [Zor][İyi]│  │
│  │ ─────────────────────────  │  │
│  │ ...                        │  │
│  │                            │  │
│  └────────────────────────────┘  │
│    (list)                        │
│                                  │
└──────────────────────────────────┘
```

## Notlar
- Filtre chip'leri ile derse gore filtreleme (Tumu, Mat, Turk, Fen, Inkilap)
- Her konu satirinda "Zor" ve "Iyi" chip'leri toggle olarak calisir
- "Zor" secilmis satirlar arka plan rengi degisir (backgroundMuted)
- "Iyi" secilmis satirlarda baslik ustu cizili ve soluk gosterilir
- Mood durumu: HARD, GOOD veya null (secilmemis)
