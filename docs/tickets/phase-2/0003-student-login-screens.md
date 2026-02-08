## T2.3 – Koça Bağlan Akışı UI (Kod → Login → İsim)

### Amaç
Öğrencinin koça bağlanabilmesi için gerekli tüm ekranların ve akışın UI tarafını hazırlamak.

> Önemli kural:
> Önce davet kodu girilecek, kod geçerliyse login ekranına geçilecek.
> Kod girmeyen öğrenci Google login yapamayacak.

---

### Akış Sırası

1. Kullanıcı “Koça bağlan”a tıklar  
2. Davet kodu ekranı açılır  
3. Kod doğrulanır (şimdilik mock)  
4. Kod geçerliyse Google login ekranına yönlendirilir  
5. Login başarılı olursa “Görünen isim” ekranı açılır  
6. “Bağlan” ile akış tamamlanır

Bu ticket yalnızca UI + state akışını kapsar.
Backend doğrulama T2.4’te yapılacaktır.

---

## SCREEN 1 – Davet Kodu Girişi

### ASCII Layout

+----------------------------------+
| KOÇA BAĞLAN                      |
+----------------------------------+

Davet kodunu gir

[ __________ ]

[ DEVAM ET ]

---

### Davranış

- Input boşken DEVAM ET disabled
- 6–8 haneli alfanumerik kod formatı
- “DEVAM ET” basınca:
  - geçici olarak mock doğrulama yapılır
  - kod geçerliyse Screen 2’ye geçer

### Hata State’leri (Mock)

- “Kod geçerli değil”
- “Bu davet kodunun süresi dolmuş”
- “Bu davet kodu daha önce kullanılmış”
- “Koç yeni öğrenci kabul edemiyor”

Bu mesajlar şimdilik UI seviyesinde gösterilecek.

---

## SCREEN 2 – Google Login

### ASCII Layout

+----------------------------------+
| KOÇA BAĞLAN                      |
+----------------------------------+

Kod doğrulandı ✅

Koçlu mod için giriş yap

[ GOOGLE İLE GİRİŞ YAP ]

---

### Davranış

- Eğer kullanıcı zaten login ise:
  - Bu ekran otomatik atlanır
  - Doğrudan Screen 3’e geçilir

- Login başarısız olursa hata mesajı gösterilir
- Başarılı login sonrası Screen 3 açılır

---

## SCREEN 3 – Görünen İsim

### ASCII Layout

+----------------------------------+
| KOÇA BAĞLAN                      |
+----------------------------------+

Koçun seni hangi isimle görsün?

[ Hasan ]

[ BAĞLAN ]

---

### Davranış

- İsim alanı boş olamaz
- “BAĞLAN” basınca:

  Şimdilik mock başarı ekranına gider:

---

## SCREEN 4 – Başarı

### ASCII Layout

+----------------------------------+
| BAĞLANTI TAMAMLANDI              |
+----------------------------------+

Koçuna başarıyla bağlandın 🎉

Artık ilerlemen koçunla paylaşılacak.

[ ANA SAYFAYA DÖN ]

---

### Sonuç Davranışı

- “ANA SAYFAYA DÖN” basınca:
  - Home ekranı koçlu moda geçer
  - Koç notu paneli görünür (mock)
  - “Koça bağlan” satırı kaybolur

---

# Teknik Gereksinimler

- Akış tamamen navigasyon bazlı olmalı  
- State machine mantığıyla ilerlemeli  
- Geri tuşu davranışı düzgün çalışmalı:
  - Screen 3’ten geri → Screen 2
  - Screen 2’den geri → Screen 1

---

# Done Kriterleri

- Kullanıcı kod girişi ekranını görebiliyor  
- Kod girip DEVAM ET diyebiliyor  
- Google login ekranı açılıyor  
- Login sonrası isim ekranı geliyor  
- BAĞLAN diyince başarı ekranı açılıyor  
- Akış sonunda Home koçlu state’e geçiyor (mock data ile)

---

# Kapsam Dışı

- Gerçek backend invite doğrulama  
- Gerçek consume işlemi  
- Sync  
- Push

Bunlar T2.4 ve sonrası ticketlarda ele alınacak.
