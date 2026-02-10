# T2.6 — Track System (MVP) + Ders & Topics Kaynağı Tekilleştirme

**Durum: TAMAMLANDI**

## Amaç
Uygulamada 'aktif track' kavramını finalize etmek ve hem 'ders seçeneklerini' hem de 'topics (konu) listesini' tek bir kaynaktan yönetmek.

Deneme ve soru girişleri, seçili track'e göre doğru dersleri göstermeli. Konular ekranı (topics) da aynı track'e göre doğru içeriği göstermeli. Faz-1 sade UX bozulmamalı.

> MVP: Custom yok. Sabit track: 'LGS7', 'LGS8', 'TYT', 'AYT'.

---

## Kararlar (Net)
- Tek kullanıcı = tek aktif track (aynı anda iki track gösterimi yok).
- Track ilk seçimi onboarding'de yapılır (grade seçimi yerine).
- Track değişimi 'Ayarlar' ekranından da yapılabilir.
- `activeTrack` null olabilir; null iken onboarding tamamlanamaz, main app açılmaz.
- Track değişince:
  - UI'da ders seçenekleri ve topics içeriği değişir.
  - DayEntrySheet açıksa otomatik kapanır (eski track'in state'i kalmasın).
  - Eski kayıtlar ve eski topic işaretleri silinmez.
  - Ekranlar yalnızca aktif track'in içeriğini gösterir.
- Track seçimi AsyncStorage üzerinden mevcut settings store ile persist edilir.
- Migration yok — eski grade storage okunmaz.

---

## Uygulanan Yapı

### Track Tanımları
**Dosya:** `ritim/lib/track/tracks.ts`
- `TrackId`: `'LGS7' | 'LGS8' | 'TYT' | 'AYT'`
- `SubjectDef`: `{ key: string; label: string }` — key stabil slug, label Türkçe
- `TrackDef`: `{ id, label, shortLabel, subjects }`
- `TRACKS` dizisi: tüm track tanımları
- `getTrackById(id)`: TrackId ile TrackDef döndürür

Subject key'leri (stabil slug):
- LGS: `mat`, `turkce`, `fen`, `inkilap`, `ingilizce`, `din`
- TYT: `turkce`, `mat`, `fen`, `sosyal`
- AYT: `mat`, `fizik`, `kimya`, `biyoloji`, `edebiyat`, `tarih`, `cografya`

### Selectors
**Dosya:** `ritim/lib/track/selectors.ts`
- `getSubjectsForActiveTrack(trackId)`: `SubjectDef[]` — null kabul etmez
- `getTopicsSourceForActiveTrack(trackId)`: `'TOPICS_7' | 'TOPICS_8' | 'EMPTY'`

### Settings State
**Dosya:** `ritim/state/settings.tsx`
- `AppSettings.activeTrack: TrackId | null` — default `null`

**Dosya:** `ritim/lib/storage/settingsStorage.ts`
- `LegacySettingsPayload`'a `activeTrack?: string` eklendi
- `resolveActiveTrack()`: whitelist kontrolü — geçersiz değerlerde `null` döner

### Onboarding
**Dosya:** `ritim/screens/Onboarding1Screen.tsx`
- Grade seçimi kaldırıldı, track seçimi eklendi
- Soru: "Çalışma alanını seç" + alt metin: "Bu, dersleri ve konuları belirler."
- 4 chip: LGS 7 / LGS 8 / TYT / AYT (`track.shortLabel`)
- Seçim: `updateSettings({ activeTrack: selectedTrack })`
- `activeTrack` null iken "Devam" butonu disabled

### TopicsProvider
**Dosya:** `ritim/state/topics.tsx`
- `grade?: '7' | '8'` prop yerine `trackId: TrackId` prop
- Topics: `LGS7→TOPICS_7`, `LGS8→TOPICS_8`, `TYT/AYT→[]`

### Layout Bridge
**Dosya:** `ritim/app/_layout.tsx`
- `TopicsProviderBridge`: `useOnboarding` yerine `useSettings` kullanır
- `activeTrack` null ise TopicsProvider render edilmez, children (onboarding) render olmaya devam eder
- Onboarding tamamlandığında `activeTrack` kesin dolu

### TopicsScreen Empty State
**Dosya:** `ritim/screens/TopicsScreen.tsx`
- TYT/AYT'de filter ve topic listesi yerine empty state gösterilir:
  - "Bu track için konular yakında."
  - "Şimdilik soru/deneme kayıtlarını kullanabilirsin."
  - `[Track'i Değiştir]` butonu → `/settings`

### DayEntrySheet Dinamik Dersler
**Dosya:** `ritim/components/DayEntrySheet.tsx`
- Hardcoded `SUBJECT_OPTIONS` kaldırıldı
- `getSubjectsForActiveTrack()` ile dinamik `subjectDefs` kullanılıyor
- UI'da `s.label` render, storage'a `s.key` kaydediliyor
- `subjectBreakdown` key'leri stabil slug (`'mat'`, `'turkce'` vs.)
- Track değişince sheet açıksa otomatik kapanır (`onClose` çağrılır)

### Settings Track Picker
**Dosya:** `ritim/screens/SettingsScreen.tsx`
- KOÇ bölümünden **önce** "ÇALIŞMA ALANI" section
- `Aktif Track` satırı: sağda mevcut track label + chevron
- Tıklanınca BottomSheet: 4 seçenek, radio-button tarzı
- Seçim → `updateSettings({ activeTrack: track.id })` + sheet kapanır

---

## Dosya / Değişiklik Listesi

### Yeni
- `ritim/lib/track/tracks.ts` — Track tanımları, stabil subject key'ler, `getTrackById()`
- `ritim/lib/track/selectors.ts` — `getSubjectsForActiveTrack()`, `getTopicsSourceForActiveTrack()`

### Güncellenen
- `ritim/state/settings.tsx` — `activeTrack: TrackId | null` eklendi
- `ritim/lib/storage/settingsStorage.ts` — `resolveActiveTrack()` whitelist kontrolü
- `ritim/screens/Onboarding1Screen.tsx` — Grade seçimi → Track seçimi
- `ritim/state/topics.tsx` — `grade` prop → `trackId` prop
- `ritim/app/_layout.tsx` — Bridge `useSettings` kullanıyor, null guard
- `ritim/screens/TopicsScreen.tsx` — TYT/AYT empty state
- `ritim/components/DayEntrySheet.tsx` — Dinamik ders listesi, stabil key'ler
- `ritim/screens/SettingsScreen.tsx` — Çalışma Alanı section + track picker BottomSheet

---

## Done Kriterleri (Acceptance)
- [x] Settings'te 'Aktif Track' satırı görünüyor.
- [x] Track picker ile LGS7/LGS8/TYT/AYT seçilebiliyor.
- [x] Seçim persist ediliyor (app restart sonrası aynı kalıyor).
- [x] Ders seçenekleri (DayEntrySheet) aktif track'e göre değişiyor.
- [x] Topics ekranı:
  - [x] LGS7'de TOPICS_7 gösteriyor
  - [x] LGS8'de TOPICS_8 gösteriyor
  - [x] TYT/AYT'de empty state gösteriyor ve Settings'e yönlendiriyor
- [x] Onboarding'de track seçimi zorunlu (null iken devam edilemez).
- [x] `activeTrack` null ise TopicsProvider render edilmiyor (crash yok).
- [x] DayEntrySheet track değişince otomatik kapanıyor.
- [x] `subjectBreakdown` key'leri stabil slug.

---

## Kapsam Dışı (Bu ticket'ta YOK)
- Supabase tablolarına 'track_id' kolonları eklemek (daily_records / exam_records) — T2.7/T2.8.
- Deneme kayıtları, deneme listesi, filtreleme — T2.7.
- Koç dashboard — T2.9.
- Custom track / custom ders listesi — Faz-3+.
- TYT/AYT topics datası — ayrı ticket.

---

## Test Senaryoları
1. Temiz kurulumda `activeTrack` null → onboarding açılır, track seçmeden devam edilemez.
2. Track seçilince settings'e persist edilir, app restart sonrası korunur.
3. Settings'ten track değişimi → ders listesi ve topics anında güncellenir.
4. TYT/AYT'de topics empty state, "Track'i Değiştir" butonu çalışır.
5. `subjectBreakdown` key'leri stabil slug (`'mat'`, `'turkce'`).
6. Track değiştirince DayEntrySheet açıksa kapanır.
7. Koçlu/koçsuz mod fark etmeksizin track seçilebiliyor.
8. Track değiştirince mevcut local kayıtlar bozulmuyor.
