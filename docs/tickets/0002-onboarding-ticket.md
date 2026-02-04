Bir sonraki iş:

Onboarding akışını uygula.

1) Onboarding1Screen:
- Metinleri docs/ux-faz1.md’ye birebir uygula.
- Sınıf seçimi (7 / 8).
- Devam butonu seçim olmadan disabled.

2) Onboarding2Screen:
- “Bu hafta” başlığı + DotRow (7 boş dot).
- Açıklama metni.
- “İlk günü dolduralım” PrimaryButton.

3) İlk günü doldurma:
- Mevcut BottomSheet component’ini kullan.
- Süre seçimi (default 45 dk).
- Tür seçimi (Konu / Soru / Karışık).
- Kaydet → sheet kapanır.

4) Navigation:
- Onboarding1 → Onboarding2 → Home.
- Onboarding tamamlandı flag’i ekle (kalıcı storage şart değil, şimdilik in-memory olabilir).

Kurallar:
- Playground’a dokunma.
- Yeni UI component üretme.
- Theme tokens ve base components kullan.
