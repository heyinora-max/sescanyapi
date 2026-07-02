# Ses Can Yapı — Web Sitesi (absalci.com.tr düzeni)

absalci.com.tr'nin gerçek tasarımına (açık/beyaz havadar kurumsal tema, tam genişlik
görsel slider hero, fotoğraf ürün kartları, koyu footer) sadık kalınarak Ses Can Yapı
markasına uyarlanmış statik site. Saf HTML/CSS/JS — bağımlılık yok.

## Sayfalar
- `index.html` — Anasayfa (hero slider + özellik şeridi, ürün kartları, 3-adım, destek kartları, hakkımızda, çözüm ortakları, teklif CTA)
- `urunler.html` — 7 ürün grubu (fotoğraflı satırlar + markalar)
- `hakkimizda.html` — kurumsal + değerler + çözüm ortakları
- `iletisim.html` — teklif formu (WhatsApp'a yönlenir) + iletişim + harita

## Yer tutucular (gerçeğiyle değiştir)
- **İletişim:** `js/main.js` içindeki `SITE` objesi + HTML'lerdeki telefon `0549 360 11 61`, e-posta `info@sescanyapi.com`, adres `Çerkezköy, Tekirdağ`, saatler.
- **Görseller:** Hero slider, ürün kartları ve hakkımızda görselleri şu an Unsplash'ten (geçici). Kendi fotoğraflarınızı `assets/` içine koyup HTML'deki `background-image`/`src` URL'lerini değiştirin.
- **Logo:** `assets/logo.svg` — gerçek logonuzla değiştirin.
- **Harita:** `iletisim.html` içindeki Google Maps iframe `src`'sini gerçek konumla güncelleyin.
- **Marka logoları:** Çözüm ortakları şu an yazı olarak; isterseniz gerçek logo görselleriyle değiştirilebilir.

## Lokal önizleme
```bash
cd sescan-absalci-klon
python3 -m http.server 4181
# http://localhost:4181/index.html
```

## Deploy
Klasörü olduğu gibi Netlify / Vercel / GitHub Pages / paylaşımlı hosting'e atın. Build yok.

## Not
`../sescan-absalci` klasörü BAŞKA bir tasarım denemesidir (organik/sıcak tema).
absalci'ye sadık olan **bu klasördür** (`sescan-absalci-klon`).


## Canlı yayın
- **Canlı adres:** https://heyinora-max.github.io/sescanyapi/  (GitHub Pages, repo: heyinora-max/sescanyapi)
- Geliştirme localde yapılır (`python3 -m http.server 4181`), hazır olunca `git push` ile canlı 1-2 dk'da güncellenir.

## Teknik notlar (2026-07 PRO turu)
- Tüm görseller YEREL (hotlink yok). Kategori görselleri Wikimedia Commons'tan; atıflar `assets/IMAGE-CREDITS.txt`.
- SEO: JSON-LD (HardwareStore), canonical+OG her sayfada, sitemap.xml, robots.txt, site.webmanifest, 404.html, kare favicon (assets/icon.svg + PNG).
- UX: SSS (iletisim), count-up istatistik (index), slider zamanlama çubuğu, scroll-progress, yukarı-dön.
- DİKKAT: `.pagehead` görseli inline `background-image` ile verilir — CSS `var(--x)` içinde url KULLANMA (stylesheet'e göre çözülür, 404 verir; bu bug yaşandı ve düzeltildi).
- Cache-bust: css/js `?v=N` — stil/JS değişince N'i artır.
