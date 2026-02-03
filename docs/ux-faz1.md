# UX Spec (Faz-1) — Öğrenci

Bu doküman ekranları, state'leri ve navigasyon akışını tanımlar.

## Ekran listesi
- ONB-1: Karşılama + Sınıf Seçimi
- ONB-2: Closure öğretimi + "İlk günü dolduralım"
- HOME: Ana ekran
- SHEET-DAY: Gün giriş/düzenleme bottom sheet
- DAYS: Günler (stacked weeks)
- WEEK: Hafta içi gün listesi
- SHEET-DAY-DETAIL: Gün detayı bottom sheet
- TOPICS: Konular (chips + liste + mood)

---

## ONB-1 (Karşılama + Sınıf)
Metin:
- "Bu uygulama odaklanma ritmi kazanmanı kolaylaştırmak için var."
- "Kaçıncı sınıftasın? (7/8)"
- "Günde sadece 1 kez girmen yeterli. 30 saniyeden kısa sürer."
Buton:
- [Devam] (sınıf seçmeden disabled)

Aksiyon:
- Sınıf seçilir → Devam aktifleşir → ONB-2

---

## ONB-2 (Closure öğretimi)
Görsel:
- "Bu hafta:" + 7 boş daire ○ ○ ○ ○ ○ ○ ○
Metin:
- "Her odaklandığında bir gün dolacak."
Buton:
- [İlk günü dolduralım]

Aksiyon:
- Buton → SHEET-DAY açılır (ilk kayıt)

---

## HOME (Ana ekran)
### HOME State A: Bugün kayıt YOK
- Üstte: "Bu hafta" dots (●/○)
- Primary CTA: [Bugün odaklandım]
- Pasif linkler: "Günler →" , "Konular →"

CTA:
- "Bugün odaklandım" → SHEET-DAY (create)

### HOME State B: Bugün kayıt VAR
- Üstte: "Bu hafta" dots
- Bugün özeti: "45 dk · Soru · 60"
- "Düzenle →" (satırın tamamı tıklanabilir)
- Linkler: Günler, Konular

Aksiyon:
- Bugün satırı → SHEET-DAY (edit)

### HOME Dots
- Dots satırı tıklanınca → DAYS ekranı

---

## SHEET-DAY (Gün giriş/düzenleme)
Alanlar:
- Hangi gün? (default: Bugün, dropdown ile geçmiş gün seçimi mümkün)
- Süre: -/+ 5 dk (min 5, max 180) + preset chips (20/30/45/60/90)
- Tür: Konu / Soru / Karışık
- Opsiyonel detaylar:
  - Konu: subject? + topic?
  - Soru: questionCount (zorunlu) + subject? + topic?
  - Karışık: questionCount? + subject? + topic? (opsiyonel)
Buton:
- [Kaydet]

Kaydet sonrası:
- Sheet kapanır, HOME güncellenir, dots dolu olur.

---

## DAYS (Günler / stacked weeks)
Liste:
- Bu hafta + dots + küçük toplam satırı (örn "185 dk · 240 soru")
- -1 hafta + dots + küçük toplam
- -2 hafta + dots + küçük toplam
- "Daha eski →" (ileride)

Aksiyon:
- Bir haftaya tık → WEEK ekranı

---

## WEEK (Hafta gün listesi)
Satırlar:
- Pzt  45 dk · 60 soru
- Sal  30 dk · 40 soru
- Çar  —
- ...

Aksiyon:
- Güne tık → SHEET-DAY-DETAIL

---

## SHEET-DAY-DETAIL (Gün detayı)
Göster:
- Gün adı
- Toplam: "60 dk · 80 soru"
- Ders kırılımı (varsa):
  - Mat 40
  - Türk 25
  - Fen 15
- "Düzenle →" → SHEET-DAY (edit o gün)

---

## TOPICS (Konular)
Üst açıklama:
- "Bu hisler sadece senin için. Nerelere daha fazla odaklanman gerektiğini görmene yardımcı olur."

Filtre chips:
- [Tümü] [Mat] [Türk] [Fen] [İnkılap]

Liste satırı:
- "Tam Sayılar   120   🙂/😐/—"

Mood kuralı:
- Tek tap set
- aynı mood'a tekrar tap → reset (—)

Read-only:
- yorum yok, detay yok, görev yok

---

## Push davranışı (referans)
Push yalnızca HOME'a götürür, forma değil.
Push metinleri contract'ta.
