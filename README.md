# Smart Kitchen AI 🍳

**Yapay Zekâ Destekli Akıllı Mutfak, Malzeme Tanıma ve Yemek Öneri Platformu**
Üniversite bitirme projesi.

Kullanıcı evindeki malzemeleri elle ya da **fotoğraf yükleyerek** sisteme tanıtır. Sistem, **102 özgün Türk mutfağı tarifini** kullanıcının gerçek envanteriyle karşılaştırıp **gerçek uyumluluk yüzdesi**, eksik malzemeler ve hazırlanabilirlik durumuyla kişiselleştirilmiş öneriler üretir. Son kullanma tarihi takibiyle gıda israfını azaltır, eksikleri alışveriş listesine aktarır ve sohbet tabanlı bir **mutfak asistanı** sunar.

---

## İçindekiler
1. [Özellikler](#özellikler)
2. [Teknoloji yığını](#teknoloji-yığını)
3. [Kurulum](#kurulum)
4. [Yapay zekâ anahtarı (isteğe bağlı)](#yapay-zekâ-anahtarı)
5. [Komutlar](#komutlar)
6. [Testler](#testler)
7. [Proje yapısı](#proje-yapısı)
8. [Bilinen sınırlamalar ve dürüst notlar](#bilinen-sınırlamalar-ve-dürüst-notlar)

İnternette yayınlama: [`docs/YAYINLAMA.md`](docs/YAYINLAMA.md) · Ayrıntılı teknik doküman: [`docs/MIMARI.md`](docs/MIMARI.md) · Jüri sunumu için demo senaryosu: [`docs/SUNUM.md`](docs/SUNUM.md)

---

## Özellikler

| Alan | Durum |
|---|---|
| Kayıt / giriş / çıkış, şifremi unuttum, şifre değiştirme, profil düzenleme, hesap silme | ✅ |
| Kullanıcı verilerinin tam izolasyonu (her sorgu kullanıcı kimliğiyle sınırlı) | ✅ testli |
| Mutfak envanteri: ekle, sil, miktar değiştir, ara, kategori/saklama alanı filtresi, SKT'ye göre sırala, sayfalama | ✅ |
| Aynı malzeme tekrar eklenince birim dönüştürülerek miktar birleştirme | ✅ |
| Fotoğraf yükleme (JPG/JPEG/PNG/WEBP), imza (magic bytes) ve boyut kontrolü | ✅ |
| Gerçek görsel analiz (OpenAI / Gemini / Anthropic), güven skoru, emin olunamayan ürün işareti, alternatifler | ✅ (API anahtarı gerekir) |
| Algılanan ürünleri onaylama ekranı: ad düzeltme, silme, eksik ekleme | ✅ |
| 102 tarif, 10 kategori (8 gerçek + Vejetaryen/Pratik türetilmiş), alerjenler malzemelerden hesaplanır | ✅ |
| Öneri algoritması: uyum %, miktar yeterliliği, ana malzeme, SKT, diyet ve alerji, 6 sıralama | ✅ testli |
| Tarif detayı: porsiyona göre miktar ölçekleme, eldeki/eksik malzemeler, adım adım tarif | ✅ |
| Favoriler, akıllı alışveriş listesi (birleştirme, tariften ekleme, envantere aktarma) | ✅ |
| Son kullanma takibi (3 grup) ve bu ürünleri değerlendiren tarifler | ✅ |
| AI mutfak asistanı (gerçek envanter, doğrulanmış tarif kartları, sohbet geçmişi) | ✅ (anahtarsız modda algoritmayla, bu durum açıkça belirtilerek) |
| Responsive tasarım (masaüstü kenar çubuğu, mobil alt navigasyon) | ✅ tarayıcıda kontrol edildi |

---

## Teknoloji yığını

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js Route Handlers (REST API, 31 uç nokta), katmanlı servis yapısı
- **Veritabanı:** PostgreSQL 16 + **Drizzle ORM** (migration + seed)
- **Kimlik doğrulama:** bcrypt (12 tur) + JWT (HS256, `jose`) HttpOnly çerez, oturum sürümü ile iptal
- **Doğrulama:** Zod
- **Yapay zekâ:** OpenAI, Google Gemini veya Anthropic API (sağlayıcı bağımsız istemci, yalnızca sunucu tarafında)
- **Test:** Vitest (birim + gerçek PostgreSQL üzerinde entegrasyon), Playwright (uçtan uca tarayıcı testi)

> **Neden Prisma değil Drizzle?** Spesifikasyon "Prisma ORM veya uygun alternatif" diyordu. Geliştirme ortamında Prisma'nın yerel motor dosyaları (binaries.prisma.sh) indirilemediği için, saf JavaScript olan ve migration'ları aynı şekilde yöneten Drizzle ORM seçildi. Böylece her şey gerçekten çalıştırılıp test edilebildi.

---

## Kurulum

### Gereksinimler
- **Node.js 20+** (22 önerilir)
- **PostgreSQL 14+** — kendi kurulumunuz ya da Docker

### 1) Bağımlılıklar
```bash
npm install
```

### 2) Veritabanı
**Docker ile (en kolay):**
```bash
docker compose up -d        # smartkitchen ve smartkitchen_test veritabanlarını oluşturur
```
**Ya da mevcut PostgreSQL ile:**
```sql
CREATE DATABASE smartkitchen;
CREATE DATABASE smartkitchen_test;   -- yalnızca testler için
```

### 3) Ortam değişkenleri
```bash
cp .env.example .env
```
`.env` içinde en azından şunları ayarlayın:
- `DATABASE_URL` — PostgreSQL bağlantınız
- `AUTH_SECRET` — en az 32 karakter rastgele değer:
  `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`

### 4) Şema + başlangıç verisi
```bash
npm run db:setup     # migration'ları uygular, 132 malzeme + 102 tarif + demo kullanıcı yükler
```

### 5) Çalıştırma
```bash
npm run dev          # geliştirme: http://localhost:3000
# veya
npm run build && npm start   # production
```

**Demo hesabı:** `demo@smartkitchen.ai` / `Demo12345!` (20 ürünlü hazır envanter, bazılarının SKT'si yakın/geçmiş). Demo kullanıcı istemiyorsanız: `SEED_DEMO_USER=false npm run db:seed`.

---

## Yapay zekâ anahtarı

Fotoğrafla tanıma ve dil modeli tabanlı asistan için `.env` dosyasına **bir** anahtar eklemeniz yeterli:

```env
OPENAI_API_KEY="sk-..."           # varsayılan model: gpt-4o-mini
# veya
GEMINI_API_KEY="..."              # varsayılan model: gemini-2.5-flash (Google AI Studio'da ücretsiz katman mevcut)
# veya
ANTHROPIC_API_KEY="..."           # varsayılan model: claude-haiku-4-5
```
Birden fazla tanımlıysa `AI_PROVIDER=openai|gemini|anthropic` ile seçin. Model adları `.env` üzerinden değiştirilebilir.

**Anahtar yoksa ne olur?** Uygulama çökmez ve hiçbir AI sonucu taklit edilmez:
- Fotoğraf yükleme ekranı açık bir uyarı gösterir ve manuel eklemeye yönlendirir (API 503 `AI_NOT_CONFIGURED` döner).
- Asistan, yanıtlarını öneri algoritmasıyla üretir ve **her yanıtta bunu açıkça belirtir**.
- Panel ve Ayarlar sayfalarında servis durumu gösterilir.

---

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm start` | Production derleme / çalıştırma |
| `npm run typecheck` | TypeScript tip kontrolü |
| `npm run db:migrate` | Migration'ları uygula (`drizzle/` klasörü) |
| `npm run db:seed` | Katalog, tarifler ve demo kullanıcı (idempotent; favorileri silmez) |
| `npm run db:setup` | migrate + seed |
| `npm run db:generate` | Şema değişikliğinden yeni migration üret |
| `npm run db:studio` | Drizzle Studio ile veritabanını görüntüle |
| `npm test` | Tüm birim + entegrasyon testleri |
| `npm run test:e2e` | Tarayıcı testi (sunucu çalışırken; Python Playwright gerekir) |

---

## Testler

```bash
npm test
```
Testler `smartkitchen_test` veritabanını kullanır (`TEST_DATABASE_URL` ile değiştirilebilir); her dosya çalışmadan önce migration + seed yapar ve kullanıcı tablolarını temizler.

**Son çalıştırma: 57/57 test geçti** (5 dosya)

| Dosya | Kapsam |
|---|---|
| `tests/unit/recommend.test.ts` (13) | Uyum % (spesifikasyondaki Menemen 4/5 = %80 örneği), ana malzeme eksikliği, isteğe bağlı malzemeler, tarihi geçmiş ürünler, birim dönüştürerek miktar yeterliliği, porsiyon ölçekleme, diyet/alerjen filtreleri, 6 sıralama |
| `tests/unit/units-expiry.test.ts` (7) | Birim dönüşümleri, SKT grupları, Türkçe slug |
| `tests/integration/auth.test.ts` (9) | Kayıt, giriş, çıkış, sahte çerez, CSRF, şifre sıfırlama (tek kullanımlık jeton, eski oturumların iptali), şifre değiştirme, hız sınırı |
| `tests/integration/kitchen.test.ts` (17) | Envanter CRUD, birleştirme, arama/filtre/sayfalama, **kullanıcı izolasyonu**, SQL enjeksiyonu denemesi, gerçek veriden uyum %, öneriler, favoriler, alışveriş listesi, SKT, dashboard |
| `tests/integration/ai.test.ts` (11) | Dosya imza/uzantı/boyut kontrolü, görsel analizin istek biçimi ve sonuç normalizasyonu, onaylama, görselin yalnızca sahibine sunulması, sağlayıcı hatası, asistanın uydurma tarifleri filtrelemesi, sohbet izolasyonu |

**Uçtan uca tarayıcı testi** (`tests/e2e/e2e_flow.py`, 25 adım): kayıt → malzeme ekleme (otomatik tamamlama, birleştirme) → envanter düzenleme/silme → tarif uyumu → porsiyon ölçekleme → favori → alışveriş listesi → envantere aktarma → asistan → alerji uyarısı → çıkış → şifremi unuttum. Son çalıştırmada tüm adımlar geçti, sayfa hatası yok. Ayrıca 17 sayfa 1440 px ve 390 px genişlikte açıldı; yatay taşma ve konsol hatası bulunmadı.

> **AI testleri hakkında dürüst not:** Geliştirme ortamında gerçek bir API anahtarı yoktu. AI testlerinde sağlayıcıya giden HTTP çağrısı mock'lanır; isteğin biçimi (model, base64 görsel, JSON şeması) ve dönen yanıtın işlenmesi gerçek kodla test edilir. Gerçek bir modelle canlı deneme, anahtar eklendikten sonra yapılmalıdır (bkz. `docs/SUNUM.md`).

---

## Proje yapısı

```
smart-kitchen-ai/
├── drizzle/                     # SQL migration dosyaları
├── docs/                        # MIMARI.md, SUNUM.md
├── public/                      # statik dosyalar (ikon)
├── src/
│   ├── app/
│   │   ├── (marketing)/         # Tanıtım sayfası (/)
│   │   ├── (auth)/              # giris, kayit, sifremi-unuttum, sifre-sifirla
│   │   ├── (app)/               # Oturum gerektiren sayfalar (panel, envanter, fotograf, oneriler, tarifler, asistan, ...)
│   │   └── api/                 # REST API (31 uç nokta)
│   ├── components/              # UI tasarım sistemi, tarif bileşenleri, uygulama kabuğu
│   ├── db/                      # Şema, bağlantı, migrate, seed (katalog + 102 tarif)
│   ├── lib/
│   │   ├── ai/                  # provider (OpenAI/Gemini/Anthropic), vision, assistant
│   │   ├── auth/                # bcrypt, JWT, oturum
│   │   ├── services/            # iş mantığı (inventory, recipes, shopping, analysis, ...)
│   │   ├── recommend.ts         # öneri algoritması (saf fonksiyonlar)
│   │   ├── units.ts, expiry.ts  # birim dönüşümü, SKT mantığı
│   │   ├── validation.ts        # Zod şemaları
│   │   └── api.ts               # hata yönetimi, yetkilendirme, CSRF, hız sınırı
│   └── middleware.ts            # korumalı sayfa yönlendirmesi
├── tests/                       # unit, integration, e2e
├── uploads/                     # yüklenen fotoğraflar (public dışında, yetkili uçtan sunulur)
├── docker-compose.yml
└── .env.example
```

---

## Bilinen sınırlamalar ve dürüst notlar

- **E-posta gönderimi yok.** "Şifremi unuttum" gerçek, tek kullanımlık ve 30 dakika geçerli bir jeton üretir; ancak SMTP servisi entegre edilmediği için bağlantı yalnızca **geliştirme modunda** (`npm run dev`, `SHOW_RESET_LINK_IN_DEV=true`) ekranda gösterilir. Production'da güvenlik gereği gösterilmez. Gerçek kullanım için `src/app/api/auth/forgot-password/route.ts` içine bir e-posta servisi (ör. Nodemailer/Resend) eklenmelidir.
- **Tarif görselleri illüstrasyondur.** Kaynağı/lisansı doğrulanamayan fotoğrafları gerçekmiş gibi kullanmamak için kartlar kategoriye özel çizimlerle gösterilir. `recipes.image_url` alanı doldurulursa gerçek fotoğraf otomatik kullanılır (ör. `public/recipes/menemen.jpg` → `/recipes/menemen.jpg`).
- **Besin değerleri gösterilmiyor.** Spesifikasyon gereği yalnızca güvenilir kaynak varsa gösterilmeli; tahmini değer üretilmedi (`recipes.nutrition` alanı hazır).
- **Tarifler** proje için hazırlanmış, yaygın bilinen Türk mutfağı tarifleridir; miktarlar ev ölçüleridir. Maliyet seviyesi (ekonomik sıralama) malzeme bazlı yaklaşık bir göstergedir, gerçek fiyat değildir.
- **Hız sınırlayıcı** bellek içidir (tek sunucu için yeterli; çok sunuculu kurulumda Redis gibi paylaşımlı bir depo gerekir).
- Kütle↔hacim dönüşümü yalnızca yoğunluğu tanımlı malzemelerde yapılır; diğerlerinde miktar yeterliliği "bilinmiyor" sayılır, tahmin yürütülmez.
