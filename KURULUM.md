# Ses Can Yapı — Panel ve Katalog Kılavuzu

Bu dosyada iki şey var:

1. **Paneli nasıl kullanacaksınız** (ürün ve fiyat girişi)
2. **Canlıya nasıl alınır** (ürünlerin siteyi gezen herkese görünmesi)

---

## 1. Panel nasıl kullanılır

Panel adresi: sitenin sonuna `/panel.html` ekleyin.
Örnek: `https://heyinora-max.github.io/sescanyapi/panel.html`

Yerel bilgisayarda denemek için klasördeki **baslat.cmd** dosyasına çift tıklayın;
tarayıcı kendiliğinden açılır.

**Demo şifresi:** `sescan2026`
(Canlıya alındıktan sonra bunun yerine size verilen e-posta ve şifre kullanılır.)

### Ürün eklemek

1. Panelde ürün grupları alt alta listelidir: *Boya Malzemeleri Ürünleri*, *Çimento Ürünleri*...
2. Ürünü hangi gruba koyacaksanız o satırdaki **Ürün Ekle** düğmesine basın.
3. Açılan pencerede doldurun:
   - **Görsel** — dosyayı sürükleyip bırakabilir, telefondan fotoğraf çekebilirsiniz. Büyük fotoğraflar otomatik küçültülür.
   - **Ürün adı** — zorunlu olan tek alan.
   - **Marka**, **Fiyat**, **Birim** (torba, palet, m², adet...), **Stok durumu**
   - **Açıklama** — ürün sayfasında yazdığınız gibi görünür, satır atlayabilirsiniz.
   - **En Çok Satanlar'a ekle** — işaretlerseniz anasayfadaki şeritte çıkar.
4. Aynı gruba arka arkaya ürün gireceksiniz diye **Kaydet ve Yeni Ekle** düğmesi var:
   pencere kapanmaz, marka/birim/stok aynı kalır, sadece ad ve fiyatı yazıp devam edersiniz.

### Fiyat güncellemek

Grubu açın, listedeki fiyat kutusuna yeni fiyatı yazın. Bu kadar.

- Yazmayı bıraktıktan yaklaşık bir saniye sonra **kendiliğinden kaydedilir**.
- İsterseniz `Enter`'a basın, aynı şey olur.
- Kutu yeşile döndüğünde kayıt tamamlanmıştır.
- Kutudan çıkmadan sayfayı kapatsanız bile değişiklik kaybolmaz.

Fiyatı boş bırakırsanız sitede **"Fiyat için teklif alın"** yazar — telefondan fiyat vermek
istediğiniz ürünler için kullanışlıdır.

### Diğer işler

| Ne yapmak istiyorsunuz | Nereden |
|---|---|
| Yeni ürün grubu açmak | Üstteki **Yeni Grup** düğmesi |
| Grup adını/açıklamasını değiştirmek | Grup satırındaki kalem simgesi |
| Grubu silmek | Grup satırındaki çöp kutusu (içindeki ürünler de silinir) |
| Ürünü düzenlemek / silmek | Ürün satırının sağındaki kalem ve çöp kutusu |
| En çok satanlara almak | Ürün satırındaki yıldız |
| Ürünü siteden gizlemek | Ürünü düzenleyin, **Sitede yayında** işaretini kaldırın |
| Ürün aramak | Üstteki arama kutusu |
| Yedek almak | **Yedek İndir** — bilgisayarınıza JSON dosyası iner |

---

## 2. Canlıya alma (Supabase)

**Neden gerekli:** Şu an panel *demo modunda*. Girdiğiniz ürünler yalnızca ürünü girdiğiniz
tarayıcıda duruyor; siteyi gezen müşteriler göremiyor. Aşağıdaki adımlar bir kez yapılır,
yaklaşık 10 dakika sürer ve ücretsizdir.

### Adım 1 — Supabase projesi açın

1. [supabase.com](https://supabase.com) adresine girip ücretsiz hesap açın.
2. **New project** deyin. Bölge olarak **Frankfurt (eu-central-1)** seçin (Türkiye'ye en yakını).
3. Veritabanı şifresini bir yere not edin.

### Adım 2 — Tabloları oluşturun

1. Sol menüden **SQL Editor** > **New query**.
2. Bu klasördeki `sql/supabase-kurulum.sql` dosyasının **tamamını** yapıştırın.
3. **Run** deyin. "Success" yazmalı.

### Adım 3 — Panel kullanıcısını oluşturun

1. Sol menüden **Authentication** > **Users** > **Add user** > **Create new user**.
2. Panele girecek kişinin e-postasını ve bir şifre yazın.
3. **Auto Confirm User** seçeneğini işaretleyin, kaydedin.

### Adım 4 — Anahtarları siteye yazın

1. Sol menüden **Project Settings** > **API**.
2. **Project URL** ve **anon public** anahtarını kopyalayın.
3. `js/config.js` dosyasını açıp ilk iki satırı doldurun:

```js
supabaseUrl:     "https://xxxxxxxx.supabase.co",
supabaseAnonKey: "eyJhbGciOi...",
```

4. Dosyayı kaydedip siteyi yayınlayın (GitHub'a gönderin).

Bu kadar. Panelde artık sarı "Demo modu" şeridi yerine yeşil **Canlı** rozeti görünecek ve
giriş ekranı şifre yerine e-posta + şifre isteyecek.

### Demo modda girdiğiniz ürünleri taşımak

Canlıya geçmeden önce demo modda ürün girdiyseniz kaybolmasınlar diye:

1. Canlıya geçmeden **önce** panelde **Yedek İndir** deyin.
2. Adımları tamamlayıp canlı panele giriş yapın.
3. **Yedek Yükle** ile indirdiğiniz dosyayı seçin.

---

## 3. Teknik notlar

- Site saf HTML/CSS/JS — derleme adımı, npm, framework yok. Dosyayı değiştirip yüklemek yeterli.
- Tüm veri okuma/yazma `js/veri.js` üzerinden geçer. Supabase bağlı değilse aynı arayüz
  `localStorage`'a yazar; bu yüzden sayfalarda hiçbir değişiklik gerekmeden canlıya geçilir.
- `js/config.js` tek ayar dosyasıdır: Supabase bilgileri, WhatsApp numarası, para birimi, KDV notu.
- Güvenlik: `anon` anahtarıyla **yazma kapalıdır**. Ürün yazma/silme yalnızca Supabase
  kullanıcısı olarak giriş yapılınca mümkündür (RLS politikaları `sql/supabase-kurulum.sql` içinde).
- Görseller yüklenmeden önce tarayıcıda en uzun kenarı 1000px olacak şekilde küçültülüp
  JPEG'e çevrilir; telefondan çekilen büyük fotoğraflar siteyi yavaşlatmaz.
- Sepet bir ödeme sepeti değil, **teklif sepetidir**: liste WhatsApp mesajına dönüşür.

### Dosya düzeni

```
panel.html      yönetim paneli          js/panel.js    css/panel.css
katalog.html    ürün kataloğu           js/katalog.js  css/katalog.css
urun.html       ürün detay sayfası      js/urun.js
sepet.html      teklif sepeti           js/sepet-sayfa.js
                                        js/sepet.js    sepet mantığı (her sayfada)
                                        js/kart.js     ortak ürün kartı
                                        js/veri.js     veri katmanı
                                        js/config.js   ayarlar
sql/supabase-kurulum.sql                canlıya alma betiği
```
