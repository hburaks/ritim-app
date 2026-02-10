## T2.2 – Ayarlar Ekranı: Koç Ayarları Bölümü (Faz-2)

> **Durum: TAMAMLANDI**
> T2.4 kapsamında logout'a Supabase signOut entegrasyonu eklendi.

### Amaç
Settings ekranına Faz-2 kapsamında koç yönetimi özelliklerini eklemek.
Koçsuz kullanıcıda “Koça bağlan” için ikinci bir entrypoint sağlamak; koçlu kullanıcıda görünen isim / koçtan ayrılma / logout akışlarını sunmak.

> Not: Home’da settings butonu zaten var. Bu ticket sadece Settings ekranının içeriğini günceller.

---

### Kapsam

#### 1) KOÇ bölümü (duruma göre iki görünüm)
- Koçsuz: Koça bağlan CTA
- Koçlu: Bağlı koç bilgisi + görünen isim + isim değiştir + bağlantıyı kes

#### 2) HESAP bölümü
- Logout (koçlu/koçsuz her durumda görünür)

#### 3) Onay dialogları
- “Koçla bağlantıyı kes” için confirm

---

### ASCII Layout – Koçsuz Kullanıcı (offline mod, hesap yok)

+--------------------------------------------------+
| AYARLAR                                          |
+--------------------------------------------------+

KOÇ
Şu anda bir koça bağlı değilsin.
[ KOÇA BAĞLAN ]   -> T2.3 akışına gider (Kod gir -> ...)

----------------------------------------------------

HESAP
[ ÇIKIŞ YAP ]     -> (Eğer login yoksa gizlenebilir veya disabled olabilir)

---

### ASCII Layout – Koçlu Kullanıcı (Google login var, koça bağlı)

+--------------------------------------------------+
| AYARLAR                                          |
+--------------------------------------------------+

KOÇ
Bağlı Koç: {CoachName}

Görünen İsim: {DisplayName}
[ GÖRÜNEN İSMİ DEĞİŞTİR ]   -> input dialog

[ KOÇLA BAĞLANTIYI KES ]    -> confirm dialog

----------------------------------------------------

HESAP
Google: {email}
[ ÇIKIŞ YAP ]

---

### İş Kuralları / Davranışlar

#### A) Koça Bağlan (Koçsuz)
- “KOÇA BAĞLAN” tıklanınca T2.3 akışına gider
- Koçsuz modda kullanıcı login olmadan da app’i kullanmaya devam eder (Faz-1)

#### B) Görünen İsim Değiştir (Koçlu)
- Basit input dialog:
  - Başlık: “Görünen isim”
  - Placeholder: mevcut isim
  - CTA: “Kaydet”
- Kaydet sonrası:
  - Local state güncellenir
  - (Backend entegrasyonu T2.4+/T2.5’te; bu ticket UI + state iskeleti)

#### C) Koçla Bağlantıyı Kes (Koçlu)
- Confirm dialog metni:
  - Başlık: “Koçla bağlantıyı kes?”
  - Açıklama: “Koçun ilerlemeni artık göremeyecek.”
  - Butonlar: [Vazgeç] [Bağlantıyı Kes]
- Onaylanınca:
  - Kullanıcı koçsuz moda döner
  - Home’daki koç notu paneli kaybolur
  - Home’da “Koça bağlan” satırı görünür

#### D) Çıkış Yap (Koçlu)
- Logout sonrası:
  - auth session temizlenir
  - kullanıcı koçsuz moda döner
  - local kayıtlar korunur (silinmez)
- Koçsuz kullanıcıda login yoksa:
  - “Çıkış Yap” satırı gizlenebilir veya disabled olabilir (uygulamadaki mevcut davranışa uyumlu yap)

---

### Done Kriterleri (Acceptance)

- Settings ekranında KOÇ bölümü:
  - koçsuz kullanıcıda “Koça Bağlan” CTA gösteriyor
  - koçlu kullanıcıda koç bilgisi + görünen isim + iki aksiyon butonu gösteriyor
- “Görünen ismi değiştir” dialogu çalışıyor (UI/state)
- “Koçla bağlantıyı kes” confirm dialogu çalışıyor ve state’i koçsuza döndürüyor
- “Çıkış yap” koçlu kullanıcıda session’ı temizliyor ve koçsuz state’e döndürüyor
- Home ile state tutarlılığı var:
  - koçlu -> koç notu paneli görünür
  - koçsuz -> “Koça bağlan” satırı görünür

---

### Notlar
- Bu ticket backend entegrasyonu yapmaz; UI + local state hazırlığıdır.
- Backend bağlama: T2.4/T2.5 ile tamamlanacak.
