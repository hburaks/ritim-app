# Playground Screen - Bilesen Vitrin

**Dosya:** `screens/PlaygroundScreen.tsx`
**Route:** `/playground`

```
┌──────────────────────────────────┐
│         SafeAreaView             │
│  ┌────────────────────────────┐  │
│  │ ScrollView                 │  │
│  │                            │  │
│  │  Playground                │  │
│  │  (title)                   │  │
│  │                            │  │
│  │  ── Primary Button ──────  │  │
│  │  ┌────────────────────┐    │  │
│  │  │ ┌────────────────┐ │    │  │
│  │  │ │Bugün odaklandım│ │    │  │
│  │  │ └────────────────┘ │    │  │
│  │  │ ┌────────────────┐ │    │  │
│  │  │ │   Disabled     │ │    │  │
│  │  │ └────────────────┘ │    │  │
│  │  └────────────────────┘    │  │
│  │    (sectionCard)           │  │
│  │                            │  │
│  │  ── Text Link ────────── │  │
│  │  ┌────────────────────┐    │  │
│  │  │ Günler →  Konular →│    │  │
│  │  └────────────────────┘    │  │
│  │                            │  │
│  │  ── Chip ─────────────── │  │
│  │  ┌────────────────────┐    │  │
│  │  │[Tümü][Mat][Türk]   │    │  │
│  │  │[Fen][İnk]          │    │  │
│  │  └────────────────────┘    │  │
│  │                            │  │
│  │  ── Dot Row ──────────── │  │
│  │  ┌────────────────────┐    │  │
│  │  │Bu hafta  Pzt başlng│    │  │
│  │  │● ● ● ◐ ○ ○ ○      │    │  │
│  │  └────────────────────┘    │  │
│  │                            │  │
│  │  ── Bottom Sheet ──────  │  │
│  │  ┌────────────────────┐    │  │
│  │  │ ┌────────────────┐ │    │  │
│  │  │ │   Sheet Aç     │ │    │  │
│  │  │ └────────────────┘ │    │  │
│  │  └────────────────────┘    │  │
│  │                            │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

## Notlar
- Gelistirici/tasarim amaciyla bilesen vitrini
- Her section bir kart icinde gosterilir (sectionCard)
- BottomSheet ornek icerikle acilir
