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
