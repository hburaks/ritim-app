Ticket 5: Local Persistence for Daily Records

Amaç:
DailyRecord verileri uygulama kapanıp açılınca kaybolmasın.
In-memory store kalacak ama başlangıçta storage’dan hydrate olacak ve her değişiklikte persist edecek.

Kapsam:

1) Storage katmanı
- src/lib/storage/recordsStorage.ts oluştur.
- Fonksiyonlar:
  - loadRecords(): Promise<DailyRecord[]>
  - saveRecords(records: DailyRecord[]): Promise<void>
- Şimdilik AsyncStorage kullan.
- Tek bir key kullan: "ritim.records.v1"

2) Store hydrate/persist
- App açılışında store loadRecords ile hydrate edilsin.
- Store’daki records değiştikçe debounce ile saveRecords çağrılsın (örn 300ms).
- Hata olursa crash etme, sadece console.warn.

3) UI davranışı
- Home ve Days ekranları storage’dan gelen kayıtlarla doğru state göstermeli.
- Onboarding tamamlandı flag’i de localde saklanmalı:
  - key: "ritim.onboardingDone.v1"
  - load/save fonksiyonları ekle.

Kurallar:
- Yeni UI component üretme.
- Business logic’i değiştirme (sadece kalıcılaştır).
- Tarih/hafta hesaplarına dokunma.
- Playground’a dokunma.

Kabul kriterleri:
- Kayıt ekle → uygulamayı kapat/aç → kayıt duruyor olmalı.
- Onboarding bitti → kapat/aç → direkt Home açılmalı.
- Storage hatalarında uygulama çalışmaya devam etmeli.
