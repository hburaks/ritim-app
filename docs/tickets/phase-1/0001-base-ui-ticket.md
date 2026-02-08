# Ticket: 0001 Base UI Kit (Button / Chip / DotRow / Sheet)

## Context
- Referans: docs/ritim-contract.md
- Referans: docs/ux-faz1.md
- Amaç: Faz-1 ekranları için tekrar kullanılabilir minimal UI parçaları oluşturmak.

## Goal
- Aşağıdaki bileşenleri üret ve örnek kullanımı için küçük bir "Playground" screen oluştur.

## Scope (Do)
- [ ] PrimaryButton component (enabled/disabled)
- [ ] TextLink component (örn "Günler →")
- [ ] Chip component (selected/unselected)
- [ ] DotRow component (7 adet ●/○, tıklanabilir, dolu dot hafif animasyon)
- [ ] BottomSheet component (basit modal/panel; drag şart değil; slide-up animasyon)

## Out of scope (Do NOT)
- [ ] Onboarding ekranları (sonraki ticket)
- [ ] Storage / notifications / business logic
- [ ] Yeni tasarım sistemi uydurma (@design klasörünün içindeki yapı kullanılacak.)

## Acceptance criteria
- [ ] Bileşenler tek tek import edilebilir
- [ ] DotRow 7 gün gösterir, aktif gün set edilebilir
- [ ] Chip seçili durumda belirgin ama sakin görünür
- [ ] PrimaryButton disabled state net
- [ ] BottomSheet aç/kapa animasyonlu ve ekranı karartır (sakin)

## Files allowed to change
- src/components/*
- src/screens/PlaygroundScreen.* (veya benzeri tek demo ekran)
- src/app/navigation.* (demo ekranı route'lamak için gerekiyorsa)

## Notes
- Renkler / spacing design klasörü içerisindeki style guide tan referans alınacak.
- Hardcode tasarım token'ları şimdilik component içinde olabilir (sonra theme ticketı gelir).
