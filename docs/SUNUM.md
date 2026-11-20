# Jüri Sunumu — Demo Senaryosu (≈10 dk)

## Hazırlık (sunumdan önce)
1. `npm run db:setup` ile temiz veri yükleyin (demo kullanıcının SKT'leri bugüne göre ayarlanır).
2. `.env` dosyasına bir AI anahtarı ekleyin (Gemini'nin ücretsiz katmanı yeterlidir) ve **bir gün önce gerçek bir buzdolabı fotoğrafıyla deneyin**.
3. `npm run build && npm start` — production modunda daha hızlıdır.
4. Telefonda göstermek için: aynı ağda `http://<bilgisayar-ip>:3000`.

## Akış
1. **Tanıtım sayfası (1 dk)** — problem: israf ve "bugün ne pişirsem?". Örnek kartların veritabanından geldiğini söyleyin.
2. **Giriş → Panel (1 dk)** — `demo@smartkitchen.ai / Demo12345!`. Gerçek sayılar: farklı ürün, hemen yapılabilir tarif, SKT uyarıları.
3. **Fotoğrafla tanıma (2 dk)** — fotoğraf yükleyin → güven skorları, "emin olunamayanlar" bölümü → onay ekranında bir ürünün adını değiştirin, birini silin, eksik bir ürün ekleyin → onayla.
4. **Öneri algoritması (2 dk)** — Menemen detayında uyum yüzdesi; envanterden soğanı silip yüzdenin %80'e düştüğünü gösterin (spesifikasyondaki örnek). Porsiyonu değiştirip miktarların ölçeklendiğini, "Eksikleri listeye ekle"yi gösterin.
5. **İsraf azaltma (1 dk)** — Son kullanma sayfasında üç grup; tarihi geçmiş ürünlerin önerilere katılmadığını vurgulayın.
6. **AI asistan (1.5 dk)** — "Evde yumurta, süt ve un var. Ne yapabilirim?" ve "haftalık yemek planı". Kartların veritabanıyla doğrulandığını anlatın.
7. **Kişiselleştirme (0.5 dk)** — Profilde "Yumurta" alerjisini seçin → Menemen'de alerji uyarısı, önerilerde gizlenme.
8. **Mobil (0.5 dk)** — tarayıcı geliştirici araçlarında mobil görünüm.
9. **Kalite (0.5 dk)** — `npm test` çıktısı: 57 test; kullanıcı izolasyonu ve güvenlik testleri.

## Olası jüri soruları
- **Uyum yüzdesi nasıl hesaplanıyor?** → `docs/MIMARI.md` §3. Zorunlu malzemelere göre; ana malzeme eksikliği ayrıca işaretleniyor; miktarlar birim dönüştürülerek karşılaştırılıyor.
- **Yapay zekâ yanlış tanırsa?** → Hiçbir ürün onaysız eklenmiyor; düşük güvenliler varsayılan seçili değil; alternatifler gösteriliyor.
- **Model tarif uydurursa?** → Model yalnızca aday listeden slug seçebiliyor, sunucu doğruluyor; uydurulanlar kart olarak gösterilmiyor.
- **Neden Drizzle?** → Prisma'nın yerel motor dosyaları geliştirme ortamında indirilemedi; spesifikasyon alternatife izin veriyordu. Migration + seed + ilişkisel şema aynı.
- **Güvenlik?** → bcrypt, HttpOnly JWT + oturum sürümü, CSRF origin kontrolü, parametreli sorgular, dosya imza kontrolü, hız sınırı (MIMARI §6).
- **Besin değerleri neden yok?** → Güvenilir kaynak olmadan uydurmak yerine bilinçli olarak gösterilmedi.

## Gelecek çalışmalar
E-posta servisi (şifre sıfırlama), gerçek tarif fotoğrafları (lisanslı), USDA/TürKomp ile besin değerleri, barkod okuma, aile/ortak mutfak paylaşımı, PWA ve bildirimler.
