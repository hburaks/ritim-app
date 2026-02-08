Ticket 6: Konular Ekranı (Chips + 3-State Mood) — Soru bağlantısı yok

Amaç:
Öğrenci konular için sadece “his” işaretleyebilsin.
Bu ekran dashboard gibi olmamalı; sade ve sessiz olmalı.
Konuların yanında soru sayısı veya herhangi bir metrik gösterilmeyecek.

---

Kapsam:

1) Topics Data + Store

- Konu listesi sınıfa göre (7/8) hazır bir seed ile gelebilir (hardcode kabul).
- Her konu için:
  - id
  - subject (MAT/TURK/FEN/INK)
  - title

Mood state:
- 'GOOD' (İyi)
- 'HARD' (Zor)
- 'NONE' (—)

Store fonksiyonları:
- setMood(topicId, mood)
- toggleMood(topicId, mood) -> aynı mood seçilirse NONE’a dönsün
- getMood(topicId)

Not:
- Mood store in-memory olabilir (persist şart değil).
- Records ile hiçbir bağlantı yok.

---

2) TopicsScreen UI

Üst açıklama:
"Bu hisler sadece senin için. Nerelere daha fazla odaklanman gerektiğini görmene yardımcı olur."
Minik açıklama:
"Durumlar: Zor · İyi · —"

Ders filtre chips:
[Tümü] [Mat] [Türk] [Fen] [İnkılap]
- Chip seçimiyle liste filtrelenir.

Liste satırı:
"Konu Adı    [tek durum etiketi]"

Davranış:
- Her konu satırına taplandıkça mood döngüsü: NONE → HARD → GOOD → NONE
- Aynı anda sadece seçili durum etiketi görünür (diğer seçenekler sağ/sol görünmez)
- Zor (HARD) durum: satır arka planı renklidir
- İyi (GOOD) durum: konu başlığı üstü çizilir
- Orta (NONE) durum: ekstra görsel vurgulama yok
- Konu ekranı read-only:
  - yorum yok
  - detay sayfası yok
  - görev yok

---

3) Navigation
- Home’daki “Konular →” TopicsScreen’e gider.

---

Kurallar:
- Yeni UI component üretme.
- Mevcut Chip, TextLink, theme tokens kullanılacak.
- Playground’a dokunma.
- Push/persistence ekleme yok.

---

Kabul kriterleri:
- Filtreler doğru çalışır.
- Mood set/toggle çalışır ve UI hemen güncellenir.
- Konu satırlarında hiçbir sayı/metrik görünmez.
- Ekran sade kalır (grafik yok, ekstra metrik yok).
