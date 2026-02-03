# Ritim Contract (Faz-1)

Bu doküman Faz-1’in değişmez kurallarını tanımlar. Kod, tasarım ve agent işleri bu kuralları bozamaz.

## 1) Ürün amacı
- Amaç: öğrencinin "odaklanma ritmi" kazanmasını kolaylaştırmak.
- Ürün yargılamaz, kıyaslamaz, performans/dashboards üretmez.
- Tek ana aksiyon: "Bugün odaklandım" (veya bugün kaydı varsa "Düzenle").

## 2) Faz-1 scope (VAR)
- Onboarding (2 ekran)
- Ana ekran (2 state: bugün kayıt yok / var)
- Gün giriş/düzenleme bottom sheet
- Günler (stacked weeks → hafta → gün listesi → gün detayı sheet)
- Konular (ders filtre chips + konu listesi + 3-state mood)
- Local storage (koç yoksa cloud yok)
- Push (yalnızca local scheduling)

## 3) Faz-1 scope (YOK)
- Denemeler
- Yanlış defteri
- Hedefler
- Grafikler / dashboardlar
- Streak / rekor / gamification
- Ayarlar ekranı (bildirim ayarı dahil)
- Koç ekranları (şimdilik bu repo/sprintte yok)

## 4) Closure (tamamlama) kuralları
- Haftalık görünüm: 7 gün (Pazartesi başlangıç varsayımı).
- Closure dots: dolu ● / boş ○
- Dolu/boş farkı şekil ile anlaşılır; renk tek başına bilgi taşımaz.
- Ana ekrandaki dots tıklanabilir: Günler ekranına götürür.

## 5) Gün kaydı veri modeli
Bir "DailyRecord" minimum alanları:
- date: YYYY-MM-DD (local date)
- focusMinutes: number (5..180, step 5)
- activityType: 'KONU' | 'SORU' | 'KARISIK'
Opsiyoneller:
- questionCount?: number (SORU seçiliyse zorunlu; diğerlerinde opsiyonel)
- subject?: 'MAT' | 'TURK' | 'FEN' | 'INK'
- topic?: string (free text)

Ders dağılımı (opsiyonel, Faz-1 için basit):
- Day detail sheet'te ders başına soru sayısı gösterilebilir (varsa).
- Yoksa sadece toplam dk + toplam soru (questionCount) göster.

## 6) Konu mood kuralları (3 state)
Konu satırında:
- 🙂 Rahat
- 😐 Zorlanıyorum
- — Seçilmemiş
Kurallar:
- Tek tap ile mood set edilir.
- Aynı mood'a tekrar tap → sıfırlar (—).
- Konu ekranı read-only: yorum yok, detay sayfa yok, görev yok.

## 7) Push kuralları (Faz-1)
- Günlük hatırlatma: 20:30
  - Yalnızca o gün kayıt girilmediyse çalışır.
  - Metin: "Bugün odaklandın mı?"
- 3. gün mesajı: (2 gün üst üste kayıt yoksa) 3. gün akşam tek push
  - Günlük push yerine geçer (aynı gün tek push)
  - Metin: "2 gündür kayıt yok. Ritmi korumak için bugün kısa bir odak yeter."
- Sabah push yok.
- Günde maksimum 1 push.
- Push tap → ana ekrana gider (direkt forma değil).

## 8) Dil ve ton
- Sakin, kısa, yargısız.
- Ünlem, baskı, suçluluk dili yok.
- "Odak" ve "Ritim" merkezde.
