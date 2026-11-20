# İnternette yayınlama (Railway)

Proje Railway için hazırdır (`railway.json`): derleme `npm run build`, başlatma `npm run start:prod`
(migration + seed + `next start`). Kod değişikliği gerekmez.

## 1. Hesap ve proje
1. railway.com → **Login** → GitHub ya da e-posta ile kayıt ol (deneme sürümü kredi kartı istemez).
2. Proje klasöründe terminal aç:
   ```bash
   npx @railway/cli login      # tarayıcı açılır, onayla
   npx @railway/cli init       # proje adı: smart-kitchen-ai
   ```

## 2. Veritabanı
Railway panelinde projeyi aç → **Create** (ya da **+ New**) → **Database** → **PostgreSQL**. Servisin adı `Postgres` olarak kalsın.

## 3. Kodu yükle
```bash
npx @railway/cli up
```
İlk yüklemede uygulama servisi oluşur. Ortam değişkenleri henüz eklenmediği için ilk deploy hata verebilir; bu normal.

## 4. Ortam değişkenleri
Panelde uygulama servisi → **Variables** → **Raw Editor**:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
AUTH_SECRET=<en az 32 karakter rastgele değer>
UPLOAD_DIR=/data/uploads
GEMINI_API_KEY=<isteğe bağlı>
```

## 5. Fotoğraflar için disk (volume)
Uygulama servisine sağ tık → **Attach Volume** (ya da Settings → Volumes) → mount path: `/data`.

## 6. Alan adı
Uygulama servisi → **Settings** → **Networking** → **Generate Domain**. Çıkan adresi (ör. `https://smart-kitchen-ai-production.up.railway.app`)
`APP_URL` değişkeni olarak ekle. Değişkenler kaydedilince servis yeniden başlar.

## 7. Güncelleme
Kodda değişiklik yaptıktan sonra yine `npx @railway/cli up`.

Sorun olursa: servis → **Deployments** → **View logs**.
