# Smart Kitchen AI — Mimari ve Teknik Doküman

## 1. Genel mimari

```
 Tarayıcı (React 19 / Next.js App Router)
   │  Sunucu bileşenleri ilk veriyi doğrudan servis katmanından alır (ek API isteği yok)
   │  İstemci bileşenleri değişiklikleri REST API ile yapar (fetch + JSON)
   ▼
 Next.js sunucusu
   ├── middleware.ts ............ korumalı sayfalar için JWT imza kontrolü → /giris yönlendirmesi
   ├── app/api/**/route.ts ...... 31 REST uç noktası (route() sarmalayıcısı: CSRF, hata yönetimi)
   ├── lib/services/* ........... iş mantığı (her sorgu userId ile sınırlandırılır)
   ├── lib/recommend.ts ......... öneri algoritması (saf, birim testli)
   ├── lib/ai/* ................. OpenAI | Gemini | Anthropic istemcisi (yalnızca sunucuda)
   └── db/* (Drizzle ORM) ........ PostgreSQL
 Dosya sistemi: uploads/<userId>/<analysisId>.<ext>  (public dışında)
```

**Katmanlar:** `route.ts` (HTTP + doğrulama + yetki) → `services` (iş kuralları) → `db` (Drizzle). Sayfalar ve API aynı servisleri paylaşır; böylece mantık tek yerdedir.

## 2. Veritabanı şeması (PostgreSQL)

Spesifikasyondaki 16 tablonun tamamı + `password_reset_tokens`:

| Tablo | Amaç | Önemli kısıtlar |
|---|---|---|
| `users` | Kullanıcı | `email` UNIQUE, `password_hash` (bcrypt), `token_version` |
| `password_reset_tokens` | Şifre sıfırlama | jetonun **SHA-256 özeti** saklanır, `expires_at`, `used_at` |
| `user_preferences` | Diyet/alerji tercihleri | `user_id` UNIQUE FK, `allergens text[]` |
| `ingredient_categories` | 11 malzeme kategorisi | `slug` UNIQUE |
| `ingredients` | 132 malzemelik katalog | `name`/`slug` UNIQUE, `aliases[]`, `allergens[]`, `is_meat`, `is_animal_product`, `grams_per_piece` |
| `user_ingredients` | Kullanıcı envanteri | FK users (CASCADE), FK ingredients (SET NULL), `quantity numeric(10,2)`, `unit` enum, `storage` enum, `expires_at date`; indeksler `(user_id)`, `(user_id, expires_at)`, `(user_id, ingredient_id)` |
| `recipe_categories` | 10 kategori (2'si türetilmiş/sanal) | `slug` UNIQUE |
| `recipes` | 102 tarif | `slug` UNIQUE, diyet bayrakları ve `allergens[]` malzemelerden türetilir, `nutrition jsonb` (boş) |
| `recipe_ingredients` | Tarif malzemeleri | UNIQUE `(recipe_id, ingredient_id)`, `is_essential`, `is_optional` |
| `recipe_steps` | Hazırlanış adımları | UNIQUE `(recipe_id, order)` |
| `favorites` | Favoriler | UNIQUE `(user_id, recipe_id)` |
| `shopping_lists` / `shopping_list_items` | Alışveriş listesi | liste kullanıcı başına UNIQUE; `from_recipes[]` |
| `image_analyses` / `image_detected_ingredients` | Fotoğraf analizi ve sonuçları | `status` enum, `confidence real`, `uncertain`, `alternatives[]` |
| `chat_sessions` / `chat_messages` | Asistan sohbetleri | `recipe_ids int[]` (doğrulanmış tarifler), `mode` ("ai" / "fallback") |

Enum'lar: `unit` (15 ölçü birimi: adet, g, kg, ml, L, yemek/tatlı/çay kaşığı, su/çay bardağı, paket, demet, diş, tutam, dilim), `storage_area`, `difficulty`, `ingredient_source`, `analysis_status`, `chat_role`.

Migration: `drizzle/0000_init.sql` · Seed: `src/db/seed/` (idempotent upsert).

## 3. Öneri algoritması (`src/lib/recommend.ts`)

Her tarif için:

1. **Envanter toplama:** Kullanıcının aynı malzemeye ait kayıtları birleştirilir. **Tarihi geçmiş ürünler hariç tutulur** (tüketim önerisi yapılmaz).
2. **Zorunlu malzeme kümesi:** İsteğe bağlı malzemeler ve her zaman mevcut sayılan `su` hariç.
3. **Uyumluluk yüzdesi** = `sahip olunan zorunlu malzeme / zorunlu malzeme × 100` (yuvarlanmış).
   Örnek: Menemen (yumurta, domates, biber, soğan, tuz), kullanıcıda soğan yok → 4/5 = **%80**.
4. **Miktar yeterliliği:** Tarif miktarı porsiyona göre ölçeklenir ve envanterdeki miktar, birim dönüştürülerek karşılaştırılır
   (hacim↔hacim, kütle↔kütle; adet↔gram `grams_per_piece` ile; kütle↔hacim yalnızca yoğunluğu tanımlı malzemelerde). Dönüşüm güvenilir değilse sonuç `null` (bilinmiyor) — tahmin yapılmaz.
5. **Hazırlanabilirlik:** `HAZIR` · `MIKTAR_YETERSIZ` · `EKSIK_MALZEME` · `ANA_MALZEME_EKSIK` (ana malzeme eksikse uyum yüksek olsa bile ayrıca belirtilir).
6. **Tercihler:** vejetaryen/vegan/glutensiz/laktozsuz çakışması ve alerjen çakışması olan tarifler varsayılan olarak çıkarılır, sayısı raporlanır (`excludedByPreferences`).
7. **Sıralama puanı:**
   `puan = uyum − 5×(yetersiz miktar) − 25×(ana malzeme eksik) + 4×(7 gün içinde SKT'si dolan kullanılan ürün) + 4×(2 gün içinde dolan) + tercih bonusları`
   (pratik: ≤30 dk +10; düşük bütçe: (3 − maliyet seviyesi)×5; sağlıklı: çorba/salata +5, tatlı −5)
8. **Sıralama seçenekleri:** önerilen (puan) · en yüksek uyum · en az eksik · en kısa süre · en ekonomik · SKT yaklaşanları kullananlar. "Sadece tüm malzemeleri olanlar" filtresi.

Karmaşıklık: O(T × M) (T = tarif, M = tarif başına malzeme); 102 tarif bellekte 60 sn önbelleklenir.

## 4. Görsel analiz akışı

1. `POST /api/image-analysis` (multipart). Kontroller: uzantı, **dosya imzası (magic bytes)** — JPEG/PNG/WEBP, boyut (varsayılan 8 MB). Dosya adı kullanıcıdan alınmaz.
2. AI yapılandırılmamışsa **503 `AI_NOT_CONFIGURED`** — kayıt açılmaz, taklit sonuç üretilmez.
3. Görsel base64 olarak, katı **JSON şemalı** bir istemle modele gönderilir (OpenAI: `response_format: json_schema`; Gemini: JSON MIME; Anthropic: JSON talimatı).
4. Sonuç **Zod ile doğrulanır**; güven < 0.25 olanlar atılır, < 0.6 olanlar `uncertain` işaretlenir, adlar katalogla eşleştirilir (eş anlamlılar, çoğul ekleri), tekrarlar birleştirilir.
5. Kullanıcı onay ekranında düzenler; emin olunamayanlar **varsayılan olarak seçili gelmez**. Onaylananlar `source=IMAGE` ile envantere eklenir.
6. Görsel, yalnızca sahibine `GET /api/image-analysis/:id/image` üzerinden sunulur.

## 5. AI mutfak asistanı

- Kullanıcının envanterine yalnızca sunucudaki `assistant.ts` erişir (userId ile sınırlı sorgular).
- Mesajdan niyet çıkarılır (kategori, süre, ekonomik, SKT, haftalık plan, "evde X, Y var").
- Algoritmayla seçilen **aday tarif listesi** (slug, uyum %, eksikler) modele bağlam olarak verilir; model yalnızca bu slug'ları seçebilir.
- Dönen slug'lar sunucuda veritabanıyla **doğrulanır**; uydurulanlar atılır. Kartlar "doğrulanmış tarif" etiketiyle gösterilir.
- Anahtar yoksa ya da servis hata verirse yanıt algoritmayla üretilir ve bu durum yanıtta açıkça yazar (`mode = "fallback"`).

## 6. Güvenlik

| Konu | Uygulama |
|---|---|
| Şifreler | bcrypt, 12 tur; kullanıcı yoksa da sahte karşılaştırma (zamanlama saldırısına karşı) |
| Oturum | HS256 JWT, HttpOnly + SameSite=Lax (+ production'da Secure) çerez, 7 gün; `token_version` ile şifre değişiminde tüm eski oturumlar iptal |
| Yetkilendirme | Her API'de `requireUser`; tüm sorgular `user_id` koşulu içerir; başka kullanıcının kaydı **404** döner (varlığı sızdırılmaz) |
| CSRF | Durum değiştiren isteklerde `Origin` başlığı kontrolü + SameSite çerez |
| SQL injection | Drizzle parametreli sorgular; LIKE joker karakterleri kaçışlanır |
| XSS | React metin düğümleri; asistan Markdown'ı `dangerouslySetInnerHTML` kullanmadan işlenir |
| Dosya yükleme | Tür + imza + boyut kontrolü, rastgele dosya adı, public dışında saklama, `nosniff` |
| API anahtarları | Yalnızca sunucu ortam değişkenleri; istemciye hiçbir zaman gönderilmez |
| Hız sınırı | giriş (8/15 dk), kayıt, şifre sıfırlama, görsel analiz (20/saat), sohbet (30/10 dk) |
| Hata mesajları | İstemciye genel mesaj; loglarda yalnızca kısa hata özeti (şifre, jeton, anahtar loglanmaz) |
| Şifre sıfırlama | 256-bit rastgele jeton, veritabanında SHA-256 özeti, 30 dk, tek kullanımlık; hesap varlığı sızdırılmaz |
| Başlıklar | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` |

## 7. REST API

| Yöntem | Yol | Açıklama |
|---|---|---|
| POST | `/api/auth/register` · `/login` · `/logout` | Kayıt, giriş, çıkış |
| GET | `/api/auth/me` | Oturumdaki kullanıcı |
| POST | `/api/auth/forgot-password` · `/reset-password` · `/change-password` | Şifre işlemleri |
| GET/PUT/DELETE | `/api/profile` | Profil görüntüle/güncelle, hesabı sil |
| GET/PUT | `/api/preferences` | Beslenme tercihleri, alerjiler |
| GET/POST | `/api/ingredients` | Envanter listesi (q, category, storage, sort, page) / ekle (birleştirmeli) |
| GET/PUT/DELETE | `/api/ingredients/:id` | Tek kayıt |
| GET | `/api/catalog?q=` | Malzeme kataloğu araması (otomatik tamamlama) |
| GET/POST | `/api/image-analysis` | Analiz geçmişi / fotoğraf yükle ve analiz et |
| GET | `/api/image-analysis/:id` · `/:id/image` | Analiz sonucu / görsel |
| POST | `/api/image-analysis/:id/confirm` | Onaylananları envantere ekle |
| GET | `/api/recipes` · `/api/recipes/:slug` | Tarif listesi / detay (oturum varsa uyum bilgisiyle) |
| POST | `/api/recipes/recommend` | Kişiselleştirilmiş öneriler |
| GET/POST | `/api/favorites` · DELETE `/api/favorites/:recipeId` | Favoriler |
| GET/POST | `/api/shopping-list` · PATCH/DELETE `/:id` | Alışveriş listesi |
| POST | `/api/shopping-list/from-recipe` · `/actions` | Tariften eksikleri ekle · satın alınanları temizle/envantere aktar |
| GET | `/api/expiry` · `/api/dashboard` | SKT özeti · panel verisi |
| GET | `/api/ai/status` · `/api/ai/sessions` · GET/DELETE `/api/ai/sessions/:id` | AI durumu, sohbet geçmişi |
| POST | `/api/ai/chat` | Asistana mesaj |

Hata biçimi: `{ "error": "Türkçe mesaj", "code": "VALIDATION", "fields": { "email": "..." } }` — 400/401/403/404/409/413/415/429/500/503.

## 8. Sayfalar (20)

`/` tanıtım · `/kayit` · `/giris` · `/sifremi-unuttum` (+ `/sifre-sifirla`) · `/panel` · `/envanter` · `/envanter/ekle` · `/fotograf` · `/fotograf/:id` (AI analizi) · `/fotograf/:id/onayla` · `/oneriler/yemek` · `/oneriler/tatli` · `/oneriler/corba-kahvalti` · `/tarifler/:slug` · `/asistan` · `/favoriler` · `/alisveris` · `/son-kullanma` · `/profil` · `/ayarlar` (+ `/tarifler` tüm tarifler).

Her sayfada yükleniyor iskeletleri, boş durum, hata + "tekrar dene", başarı bildirimleri (toast) bulunur.
