Ticket 7: Local Push Notifications (Ritim Kuralları)

Amaç:
Kullanıcı ritmi kaybetmesin diye yerel bildirimleri doğru kurallarla planlamak.
Faz-1’de server yok, sadece local scheduling.

---

Kapsam:

1) Notification Utility

src/lib/notifications/ritimNotifications.ts oluştur.

Fonksiyonlar:
- requestPermissionsIfNeeded()
- scheduleDailyReminderIfNeeded(todayHasRecord: boolean)
- scheduleThirdDayReminderIfNeeded(lastTwoDaysMissing: boolean)
- cancelAllRitimNotifications()
- rescheduleAllBasedOnRecords(records)

Kurallar:
- Günlük hatırlatma: 20:30
  - Sadece o gün kayıt yoksa
  - Metin: "Bugün odaklandın mı?"
- 3. gün mesajı:
  - Eğer 2 gün üst üste kayıt yoksa, 3. gün akşam tek push
  - Günlük push yerine geçer (aynı gün max 1 push)
  - Metin: "2 gündür kayıt yok. Ritmi korumak için bugün kısa bir odak yeter."
- Sabah push yok
- Push tap -> Home açılacak (deep link zorunlu değil; app açılması yeter)

Not:
- Zaman hesapları local date/time.
- Aynı gün duplicate schedule olmamalı.
- Scheduling değişince eski planlar iptal edilip yeniden planlanabilir (basit yaklaşım).
- Web’de bildirim API’si yok: web platformunda no-op olacak (uyarı basılmaz).

---

2) Uygulama entegrasyonu

- App açılışında permission istenir (ilk açılışta nazik).
- Kayıt eklenince/düzenlenince notifications yeniden hesaplanır:
  - bugün kayıt varsa -> o günün 20:30 push iptal olmalı
  - 2 gün yoksa -> 3. gün mesajı planlanmalı

---

3) UI değişikliği yok (minimum)
- Ayarlar ekranı ekleme yok.
- Kullanıcıya sadece OS izin promptu gelir.

---

Kurallar:
- Yeni UI component üretme.
- Playground’a dokunma.
- Gereksiz analytics ekleme yok.

---

Kabul kriterleri:
- Bugün kayıt yokken 20:30 günlük bildirim planlanır.
- Bugün kayıt girilince günlük bildirim iptal olur.
- 2 gün üst üste kayıt yoksa 3. gün mesajı planlanır ve o gün tek bildirim olur.
- Tekrarlı scheduling (duplicate) oluşmaz.
