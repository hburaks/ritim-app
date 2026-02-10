## T2.1 – Home Ekranı Faz-2 UI Güncellemesi

> **Durum: TAMAMLANDI**
> T2.4 kapsamında "Koça bağlan" satırı tıklanabilir yapıldı (Pressable + router.push('/coach-connect')).
> Alt metin eklendi: "Davet koduyla koçuna bağlan"

### Amaç
Mevcut Faz-1 Home ekranını bozmadan Faz-2 giriş noktalarını eklemek.

### Kapsam

1. Mevcut settings butonu aynen korunacak  
2. Koçsuz kullanıcılar için Home’a “Koça bağlan” satırı eklenecek  
3. Koçlu kullanıcılar için “Koçundan Not” paneli eklenecek  
4. Bugün kartı alt metinleri yeni kararlara göre güncellenecek

### Gereksinimler

- Koç notu paneli yalnızca:
  - kullanıcı koçlu ise  
  - ve aktif not varsa görünmeli

- “Koça bağlan” satırı yalnızca:
  - kullanıcı koçsuz ise görünmeli

- Faz-1 fonksiyonelliği kesinlikle bozulmamalı

### ASCII Layout – Koçsuz Kullanıcı

+--------------------------------------------------+
| BUGÜN                                      ⚙️    |
| Haftalık ritmini hızlıca gör                     |
+--------------------------------------------------+

              Bu hafta
           [ o o o o o o o ]

----------------------------------------------------

Bugün Odak Kaydı

Bugün henüz odak kaydı oluşturmadın

[ BUGÜN ODAKLANDIM ]

----------------------------------------------------

> Günler
> Konular
> Koça bağlan


### ASCII Layout – Koçlu Kullanıcı

+--------------------------------------------------+
| BUGÜN                                      ⚙️    |
| Haftalık ritmini hızlıca gör                     |
+--------------------------------------------------+

🧑‍🏫 Koçundan Not
"Bu hafta matematik tekrarına odaklanalım."
----------------------------------------------------

              Bu hafta
           [ o o o o o o o ]

----------------------------------------------------

Bugün Odak Kaydı

Bugünkü çalışmanı kaydettin

[ KAYDI DÜZENLE ]

----------------------------------------------------

> Günler
> Konular


### Done Kriterleri

- Settings butonu mevcut haliyle çalışıyor  
- Koçsuz kullanıcı “Koça bağlan” seçeneğini görüyor  
- Koçlu kullanıcı koç notunu görüyor  
- Metinler güncel kararlarla uyumlu  
- Faz-1 akışında hiçbir kırılma yok
