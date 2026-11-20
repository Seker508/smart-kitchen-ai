# Uçtan uca tarayıcı testi (Playwright/Python). Çalıştırma: pip install playwright && playwright install chromium
# Sunucu çalışırken: python tests/e2e/e2e_flow.py   (E2E_BASE ile adres değiştirilebilir)
import asyncio, json, os, time
from playwright.async_api import async_playwright, expect
BASE=os.environ.get("E2E_BASE", "http://localhost:3000"); OUT=os.environ.get("E2E_OUT", "."); log=[]; errs=[]
def ok(m): log.append("✓ "+m)
async def run():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=["--no-sandbox"])
        ctx=await b.new_context(viewport={"width":1366,"height":900},locale="tr-TR"); pg=await ctx.new_page()
        pg.on("pageerror",lambda e: errs.append(str(e)))
        email=f"e2e{int(time.time())}@example.com"
        # Kayıt (önce hatalı)
        await pg.goto(BASE+"/kayit"); await pg.click("button[type=submit]")
        await expect(pg.get_by_text("Ad en az 2 karakter olmalıdır.", exact=True)).to_be_visible(); ok("kayıt formu doğrulama hataları")
        await pg.fill("#firstName","Elif"); await pg.fill("#lastName","Kaya"); await pg.fill("#email",email); await pg.fill("#password","Sifre1234")
        await pg.click("button[type=submit]"); await pg.wait_for_url("**/panel"); ok("kayıt → panel")
        await expect(pg.get_by_text("Mutfağın henüz boş")).to_be_visible(); ok("boş envanter durumu")
        # Malzeme ekleme (otomatik tamamlama)
        await pg.goto(BASE+"/envanter/ekle")
        for name in ["yumur","domat","sivri"]:
            await pg.fill("#name",name); await pg.wait_for_selector("#catalog-list button"); await pg.click("#catalog-list button >> nth=0")
            await pg.fill("#qty","4"); await pg.get_by_role("button",name="Ekle ve devam et").click()
            await expect(pg.locator("#name")).to_have_value(""); ok("eklendi: "+name)
        await pg.fill("#name","yumurta"); await pg.wait_for_timeout(600)
        await pg.click("#catalog-list button >> nth=0", timeout=5000); await pg.fill("#qty","2"); await pg.get_by_role("button",name="Ekle ve devam et").click()
        await expect(pg.get_by_text("miktar güncellendi")).to_be_visible(); ok("aynı ürün tekrar eklenince miktar birleşti")
        await pg.fill("#name","tuz"); await pg.wait_for_timeout(400); await pg.click("#catalog-list button >> nth=0")
        await pg.fill("#qty","100"); await pg.get_by_role("button",name="Ekle",exact=True).click(); await pg.wait_for_url("**/envanter")
        await expect(pg.get_by_text("4 kayıt")).to_be_visible(); ok("envanter listesi 4 kayıt")
        row=pg.locator("tr",has_text="Yumurta"); await expect(row).to_contain_text("6 adet"); ok("yumurta miktarı 6")
        await row.get_by_label("yumurta miktarını artır").click(); await expect(row).to_contain_text("7 adet")
        await pg.reload(); await expect(pg.locator("tr",has_text="Yumurta")).to_contain_text("7 adet"); ok("+/- miktar güncellemesi kalıcı")
        await pg.fill("input[aria-label='Ürün ara']","biber"); await expect(pg.get_by_text("1 kayıt")).to_be_visible(); ok("arama")
        await pg.locator("tr",has_text="Sivri Biber").get_by_label("sivri biber sil").click()
        await pg.get_by_role("dialog").get_by_role("button",name="Sil").click(); await expect(pg.get_by_text("Eşleşen ürün yok")).to_be_visible(); ok("silme + onay diyaloğu")
        # Tarif: Menemen uyum
        await pg.goto(BASE+"/tarifler/menemen"); await expect(pg.get_by_text("Malzeme uyumu: %60")).to_be_visible(); ok("Menemen uyumu %60 (3/5) gerçek veriden")
        await pg.get_by_role("button",name="+").first.click() if False else None
        await pg.get_by_label("Porsiyonu artır").click(); await pg.get_by_label("Porsiyonu artır").click()
        await expect(pg.locator("li",has_text="Yumurta").first).to_contain_text("8 adet"); ok("porsiyon 4 → yumurta 8 adet")
        await pg.get_by_role("button",name="Favorilere ekle").click(); await expect(pg.get_by_text("Favorilere eklendi")).to_be_visible(); ok("favori ekleme")
        await pg.get_by_role("button",name="Eksikleri alışveriş listesine ekle").click(); await expect(pg.get_by_text("eksik malzeme listeye eklendi")).to_be_visible(); ok("eksikler alışveriş listesine")
        await pg.goto(BASE+"/alisveris"); await expect(pg.get_by_text("Tarif: Menemen").first).to_be_visible()
        await pg.get_by_label("sivri biber satın alındı olarak işaretle").click(); await pg.get_by_role("button",name="Envantere aktar").click()
        await expect(pg.get_by_text("1 ürün envantere aktarıldı")).to_be_visible(); ok("satın alınan → envantere aktarıldı")
        await pg.goto(BASE+"/favoriler"); await expect(pg.get_by_text("Menemen")).to_be_visible(); ok("favoriler sayfası")
        # Öneriler + filtre
        await pg.goto(BASE+"/oneriler/corba-kahvalti"); await pg.get_by_role("tab",name="Kahvaltılıklar").click()
        await pg.get_by_label("Sadece tüm malzemeleri olanlar").check(); await pg.wait_for_timeout(800)
        await pg.screenshot(path=OUT+"/e2e-oneriler.png"); ok("öneri filtreleri")
        # Asistan (AI anahtarı yok → algoritma modu)
        await pg.goto(BASE+"/asistan"); await pg.get_by_text("Elimdeki malzemelerle tatlı öner.").click()
        await expect(pg.get_by_label("Yanıt hazırlanıyor")).to_have_count(0, timeout=20000)
        cards=pg.locator("a[href^='/tarifler/']", has_text="doğrulanmış tarif")
        await expect(cards.first).to_be_visible(); log.append(f"  asistan {await cards.count()} tarif kartı döndürdü")
        await expect(pg.get_by_text("Öneri algoritması", exact=True)).to_be_visible(); await pg.screenshot(path=OUT+"/e2e-asistan.png"); ok("asistan yanıtı + doğrulanmış tarif kartları")
        # Fotoğraf: anahtar yok uyarısı
        await pg.goto(BASE+"/fotograf"); await expect(pg.get_by_text("Görsel analiz şu an kullanılamıyor")).to_be_visible(); ok("fotoğraf: API anahtarı yok uyarısı")
        # Profil tercihleri
        await pg.goto(BASE+"/profil"); await pg.get_by_role("button",name="Yumurta").click(); await pg.get_by_role("button",name="Tercihleri kaydet").click()
        await expect(pg.get_by_text("Tercihlerin kaydedildi")).to_be_visible()
        await pg.goto(BASE+"/tarifler/menemen"); await expect(pg.get_by_text("Dikkat: alerjilerinle çakışıyor")).to_be_visible(); ok("alerji tercihi → tarifte uyarı")
        # Şifremi unuttum
        await pg.goto(BASE+"/ayarlar"); await pg.get_by_role("main").get_by_role("button",name="Çıkış yap").click(); await pg.wait_for_url("**/giris"); ok("çıkış")
        await pg.goto(BASE+"/panel"); await pg.wait_for_url("**/giris?next=%2Fpanel"); ok("oturumsuz korumalı sayfa → giriş")
        await pg.goto(BASE+"/sifremi-unuttum"); await pg.fill("#email",email); await pg.click("button[type=submit]")
        await expect(pg.get_by_text("Talebin alındı")).to_be_visible()
        assert await pg.get_by_text("Şifre sıfırlama bağlantısını aç").count()==0
        ok("şifremi unuttum: production'da bağlantı ekranda gösterilmiyor (güvenli)")
        await b.close()
try: asyncio.run(run())
except Exception as e: errs.append("HATA: "+str(e)[:600])
print("\n".join(log)); print("pageerrors/hatalar:", json.dumps(errs,ensure_ascii=False))
