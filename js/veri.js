/* =========================================================
   Ses Can Yapı — VERİ KATMANI
   ---------------------------------------------------------
   Sitedeki hiçbir sayfa veriyi doğrudan okumaz; hepsi buradan geçer.
   İki kaynak vardır ve dışarıya aynı arayüzü sunar:

     supabase : js/config.js dolu ise — herkes aynı ürünleri görür
     demo     : config boş ise — veriler tarayıcıda (localStorage)

   Böylece Supabase bağlandığında sayfaların hiçbirinde değişiklik
   gerekmez; sadece config.js doldurulur.
   ========================================================= */
(function () {
  "use strict";

  const A = window.AYAR || {};
  const CANLI = !!(A.supabaseUrl && A.supabaseAnonKey);

  const ANAHTAR = {
    gruplar: "sescan_gruplar",
    urunler: "sescan_urunler",
    oturum:  "sescan_panel_oturum",
    jeton:   "sescan_sb_jeton",
  };

  /* ---------- küçük yardımcılar ---------- */

  const TR = { "ç":"c","Ç":"c","ğ":"g","Ğ":"g","ı":"i","İ":"i","ö":"o","Ö":"o","ş":"s","Ş":"s","ü":"u","Ü":"u" };

  function slug(s) {
    return String(s || "")
      .replace(/[çÇğĞıİöÖşŞüÜ]/g, (h) => TR[h])
      .toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "grup";
  }

  function kimlik() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // Arama ve sıralamada Türkçe harfler doğru davransın
  const karsilastir = new Intl.Collator("tr").compare;

  function normalize(s) {
    return String(s || "").replace(/[çÇğĞıİöÖşŞüÜ]/g, (h) => TR[h]).toLowerCase();
  }

  function paraYaz(n) {
    if (n === null || n === undefined || n === "" || isNaN(n)) return "";
    return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n));
  }

  // "1.250,50 TL" gibi bir metinden sayıyı çıkarır
  function fiyatOku(s) {
    if (s === null || s === undefined) return null;
    const t = String(s).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    if (t === "" || isNaN(Number(t))) return null;
    return Number(t);
  }

  /* ---------- başlangıç ürün grupları ----------
     Panelden düzenlenebilir; buradakiler yalnızca ilk açılış içindir. */
  const VARSAYILAN_GRUPLAR = [
    { slug:"tugla",       ad:"Tuğla",                  aciklama:"Delikli tuğla, asmolen ve duvar tuğlası çeşitleri.",       gorsel:"assets/products/cat-tugla.jpg" },
    { slug:"cimento",     ad:"Çimento",                aciklama:"Torba çimento, hazır sıva ve harç ürünleri.",              gorsel:"assets/products/cat-cimento.jpg" },
    { slug:"gazbeton",    ad:"Gaz Beton",              aciklama:"Hafif duvar blokları ve yapıştırıcıları.",                 gorsel:"assets/products/cat-gazbeton.jpg" },
    { slug:"cati",        ad:"Çatı Malzemeleri",       aciklama:"Onduline, OSB, strafor ve çatı aksesuarları.",             gorsel:"assets/products/cat-cati.jpg" },
    { slug:"alci",        ad:"Alçı & Alçı Levha",      aciklama:"Saten, kartonpiyer, alçı levha ve profil sistemleri.",     gorsel:"assets/products/cat-alci.jpg" },
    { slug:"su-yalitim",  ad:"Su Yalıtım",             aciklama:"Membran, likit yalıtım ve su izolasyon ürünleri.",         gorsel:"assets/products/cat-suyalitim.jpg" },
    { slug:"mantolama",   ad:"Mantolama Sistemleri",   aciklama:"EPS/XPS levha, yapıştırıcı, sıva ve dış cephe boyası.",    gorsel:"assets/products/cat-mantolama.jpg" },
    { slug:"boya",        ad:"Boya Malzemeleri",       aciklama:"İç cephe, dış cephe boyaları, astar, fırça ve rulo.",      gorsel:"" },
    { slug:"insaat",      ad:"İnşaat Malzemeleri",     aciklama:"Demir, kum, çakıl, kalıp ve genel şantiye malzemeleri.",   gorsel:"" },
    { slug:"hirdavat",    ad:"Hırdavat & El Aletleri", aciklama:"El aletleri, vida, dübel, kesici ve bağlantı elemanları.", gorsel:"" },
    { slug:"yapi-kimya",  ad:"Yapı Kimyasalları",      aciklama:"Yapıştırıcı, derz dolgu, kür ve katkı malzemeleri.",       gorsel:"" },
    { slug:"tesisat",     ad:"Tesisat Ürünleri",       aciklama:"PPRC, PVC boru, ek parça ve tesisat armatürleri.",         gorsel:"" },
    { slug:"is-guvenlik", ad:"İş Güvenliği Ürünleri",  aciklama:"Baret, eldiven, gözlük ve şantiye güvenlik ürünleri.",     gorsel:"" },
  ];

  /* =========================================================
     GÖRSEL — yüklemeden önce küçültülür
     Telefondan çekilen 5 MB fotoğraf hem depoyu şişirir hem sayfayı
     yavaşlatır; en uzun kenarı 1000px yapıp JPEG olarak kaydediyoruz.
     ========================================================= */
  function gorselKucult(dosya, enBuyukKenar, kalite) {
    enBuyukKenar = enBuyukKenar || 1000;
    kalite = kalite || 0.82;
    return new Promise(function (coz, hata) {
      if (!dosya || !dosya.type || dosya.type.indexOf("image/") !== 0) {
        return hata(new Error("Bu bir görsel dosyası değil."));
      }
      const okuyucu = new FileReader();
      okuyucu.onerror = () => hata(new Error("Görsel okunamadı."));
      okuyucu.onload = () => {
        const img = new Image();
        img.onerror = () => hata(new Error("Görsel açılamadı."));
        img.onload = () => {
          let g = img.width, y = img.height;
          const oran = Math.min(1, enBuyukKenar / Math.max(g, y));
          g = Math.round(g * oran); y = Math.round(y * oran);
          const tuval = document.createElement("canvas");
          tuval.width = g; tuval.height = y;
          const ctx = tuval.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, g, y);            // saydam PNG siyah çıkmasın
          ctx.drawImage(img, 0, 0, g, y);
          const dataUrl = tuval.toDataURL("image/jpeg", kalite);
          tuval.toBlob(
            (blob) => (blob ? coz({ blob: blob, dataUrl: dataUrl })
                            : hata(new Error("Görsel dönüştürülemedi."))),
            "image/jpeg", kalite
          );
        };
        img.src = okuyucu.result;
      };
      okuyucu.readAsDataURL(dosya);
    });
  }

  /* =========================================================
     DEMO KAYNAĞI — localStorage
     ========================================================= */
  const Demo = {
    _oku(anahtar, varsayilan) {
      try {
        const ham = localStorage.getItem(anahtar);
        return ham ? JSON.parse(ham) : varsayilan;
      } catch (e) { return varsayilan; }
    },
    _yaz(anahtar, deger) {
      try {
        localStorage.setItem(anahtar, JSON.stringify(deger));
        return true;
      } catch (e) {
        // Kotayı sessizce yutmak en kötüsü — çağıran görsün.
        throw new Error("Tarayıcı deposu doldu. Görselleri küçültün ya da canlı veritabanına geçin.");
      }
    },

    async hazirla() {
      const gruplar = this._oku(ANAHTAR.gruplar, null);
      if (!gruplar || !gruplar.length) {
        this._yaz(ANAHTAR.gruplar, VARSAYILAN_GRUPLAR.map((g, i) => ({ id: g.slug, sira: i, ...g })));
      }
      return true;
    },

    async gruplar() {
      return this._oku(ANAHTAR.gruplar, []).slice().sort((a, b) => (a.sira || 0) - (b.sira || 0));
    },
    async urunler() {
      return this._oku(ANAHTAR.urunler, []);
    },

    async grupKaydet(g) {
      const liste = this._oku(ANAHTAR.gruplar, []);
      const i = liste.findIndex((x) => x.id === g.id);
      if (i >= 0) liste[i] = { ...liste[i], ...g };
      else liste.push({ ...g, id: g.id || slug(g.ad) + "-" + kimlik().slice(-4), sira: liste.length });
      this._yaz(ANAHTAR.gruplar, liste);
      return g;
    },
    async grupSil(id) {
      this._yaz(ANAHTAR.gruplar, this._oku(ANAHTAR.gruplar, []).filter((x) => x.id !== id));
      this._yaz(ANAHTAR.urunler, this._oku(ANAHTAR.urunler, []).filter((u) => u.grupId !== id));
      return true;
    },
    async urunKaydet(u) {
      const liste = this._oku(ANAHTAR.urunler, []);
      const i = liste.findIndex((x) => x.id === u.id);
      if (i >= 0) liste[i] = { ...liste[i], ...u, guncelleme: new Date().toISOString() };
      else liste.unshift({ ...u, id: u.id || kimlik(), olusturma: new Date().toISOString() });
      this._yaz(ANAHTAR.urunler, liste);
      return u;
    },
    async urunSil(id) {
      this._yaz(ANAHTAR.urunler, this._oku(ANAHTAR.urunler, []).filter((x) => x.id !== id));
      return true;
    },
    async gorselYukle(dosya) {
      const sonuc = await gorselKucult(dosya);
      return sonuc.dataUrl;   // demo modda görsel kaydın içinde durur
    },
    async girisYap(_kullanici, sifre) {
      if (sifre !== (A.demoSifre || "sescan2026")) throw new Error("Şifre hatalı.");
      sessionStorage.setItem(ANAHTAR.oturum, "1");
      return true;
    },
    cikisYap() { sessionStorage.removeItem(ANAHTAR.oturum); },
    oturumVar() { return sessionStorage.getItem(ANAHTAR.oturum) === "1"; },
  };

  /* =========================================================
     SUPABASE KAYNAĞI — REST üzerinden, ek kütüphane yok
     ========================================================= */
  const Sb = {
    get _kok() { return String(A.supabaseUrl).replace(/\/+$/, ""); },

    _jeton() {
      try { return JSON.parse(localStorage.getItem(ANAHTAR.jeton) || "null"); } catch (e) { return null; }
    },

    _baslik(yazma) {
      const j = this._jeton();
      const h = {
        apikey: A.supabaseAnonKey,
        Authorization: "Bearer " + ((j && j.access_token) || A.supabaseAnonKey),
      };
      if (yazma) {
        h["Content-Type"] = "application/json";
        h.Prefer = "return=representation";
      }
      return h;
    },

    async _istek(yol, secenek) {
      const y = await fetch(this._kok + yol, secenek || {});
      if (!y.ok) {
        let mesaj = y.status + " " + y.statusText;
        try {
          const j = await y.json();
          mesaj = j.message || j.error_description || j.error || j.hint || mesaj;
        } catch (e) { /* gövde JSON değilse durum metnini kullan */ }
        if (y.status === 401 || y.status === 403) {
          mesaj = "Yetki yok — panele yeniden giriş yapın. (" + mesaj + ")";
        }
        throw new Error(mesaj);
      }
      return y.status === 204 ? null : y.json();
    },

    _rest(yol, secenek) { return this._istek("/rest/v1" + yol, secenek); },

    async hazirla() { return true; },

    async gruplar() {
      const s = await this._rest("/gruplar?select=*&order=sira.asc", { headers: this._baslik() });
      return s.map((g) => ({
        id: g.id, slug: g.slug, ad: g.ad, aciklama: g.aciklama || "",
        gorsel: g.gorsel || "", sira: g.sira || 0,
      }));
    },

    async urunler() {
      const s = await this._rest("/urunler?select=*&order=olusturma.desc&limit=2000", { headers: this._baslik() });
      return s.map((u) => ({
        id: u.id, grupId: u.grup_id, ad: u.ad, marka: u.marka || "",
        fiyat: u.fiyat === null || u.fiyat === undefined ? null : Number(u.fiyat),
        birim: u.birim || "", stok: u.stok || "stokta",
        aciklama: u.aciklama || "", gorsel: u.gorsel || "",
        cokSatan: !!u.cok_satan, yayinda: u.yayinda !== false,
        olusturma: u.olusturma, guncelleme: u.guncelleme,
      }));
    },

    async grupKaydet(g) {
      const govde = {
        slug: g.slug, ad: g.ad, aciklama: g.aciklama || "",
        gorsel: g.gorsel || "", sira: g.sira || 0,
      };
      if (g.id) {
        return this._rest("/gruplar?id=eq." + encodeURIComponent(g.id),
          { method: "PATCH", headers: this._baslik(true), body: JSON.stringify(govde) });
      }
      return this._rest("/gruplar", { method: "POST", headers: this._baslik(true), body: JSON.stringify(govde) });
    },

    async grupSil(id) {
      await this._rest("/urunler?grup_id=eq." + encodeURIComponent(id), { method: "DELETE", headers: this._baslik(true) });
      await this._rest("/gruplar?id=eq." + encodeURIComponent(id), { method: "DELETE", headers: this._baslik(true) });
      return true;
    },

    async urunKaydet(u) {
      const govde = {
        grup_id: u.grupId, ad: u.ad, marka: u.marka || "", fiyat: u.fiyat,
        birim: u.birim || "", stok: u.stok || "stokta", aciklama: u.aciklama || "",
        gorsel: u.gorsel || "", cok_satan: !!u.cokSatan, yayinda: u.yayinda !== false,
      };
      if (u.id) {
        govde.guncelleme = new Date().toISOString();
        return this._rest("/urunler?id=eq." + encodeURIComponent(u.id),
          { method: "PATCH", headers: this._baslik(true), body: JSON.stringify(govde) });
      }
      return this._rest("/urunler", { method: "POST", headers: this._baslik(true), body: JSON.stringify(govde) });
    },

    async urunSil(id) {
      await this._rest("/urunler?id=eq." + encodeURIComponent(id), { method: "DELETE", headers: this._baslik(true) });
      return true;
    },

    async gorselYukle(dosya) {
      const sonuc = await gorselKucult(dosya);
      const ad = kimlik() + ".jpg";
      const kova = A.gorselKovasi || "urun-gorselleri";
      const j = this._jeton();
      const y = await fetch(this._kok + "/storage/v1/object/" + kova + "/" + ad, {
        method: "POST",
        headers: {
          apikey: A.supabaseAnonKey,
          Authorization: "Bearer " + ((j && j.access_token) || A.supabaseAnonKey),
          "Content-Type": "image/jpeg",
          "x-upsert": "true",
        },
        body: sonuc.blob,
      });
      if (!y.ok) {
        let m = y.status + " " + y.statusText;
        try { const jj = await y.json(); m = jj.message || jj.error || m; } catch (e) {}
        throw new Error("Görsel yüklenemedi: " + m);
      }
      return this._kok + "/storage/v1/object/public/" + kova + "/" + ad;
    },

    async girisYap(eposta, sifre) {
      const y = await fetch(this._kok + "/auth/v1/token?grant_type=password", {
        method: "POST",
        headers: { apikey: A.supabaseAnonKey, "Content-Type": "application/json" },
        body: JSON.stringify({ email: eposta, password: sifre }),
      });
      const j = await y.json().catch(() => ({}));
      if (!y.ok) throw new Error(j.error_description || j.msg || j.message || "E-posta ya da şifre hatalı.");
      if (j.expires_in && !j.expires_at) j.expires_at = Math.floor(Date.now() / 1000) + j.expires_in;
      localStorage.setItem(ANAHTAR.jeton, JSON.stringify(j));
      return true;
    },
    cikisYap() { localStorage.removeItem(ANAHTAR.jeton); },
    oturumVar() {
      const j = this._jeton();
      if (!j || !j.access_token) return false;
      // expires_at saniye cinsinden; 60 sn pay bırakıyoruz
      if (j.expires_at && Date.now() / 1000 > j.expires_at - 60) return false;
      return true;
    },
  };

  const K = CANLI ? Sb : Demo;   // etkin kaynak

  /* =========================================================
     ORTAK ARAYÜZ — sayfalar yalnızca bunu görür
     ========================================================= */
  let onbellek = null;

  async function yukle(zorla) {
    if (onbellek && !zorla) return onbellek;
    await K.hazirla();
    const sonuc = await Promise.all([K.gruplar(), K.urunler()]);
    const gruplar = sonuc[0], urunler = sonuc[1];
    const grupHarita = new Map(gruplar.map((g) => [g.id, g]));
    urunler.forEach((u) => {
      const g = grupHarita.get(u.grupId);
      u.grupAd = g ? g.ad : "";
      u.grupSlug = g ? g.slug : "";
    });
    onbellek = { gruplar, urunler, grupHarita };
    return onbellek;
  }

  function sirala(liste, nasil) {
    const l = liste.slice();
    const buyuk = Number.MAX_VALUE, kucuk = -Number.MAX_VALUE;
    switch (nasil) {
      // Fiyatı girilmemiş ürünler her iki yönde de sona düşsün
      case "fiyat-artan":  return l.sort((a, b) => (a.fiyat == null ? buyuk : a.fiyat) - (b.fiyat == null ? buyuk : b.fiyat));
      case "fiyat-azalan": return l.sort((a, b) => (b.fiyat == null ? kucuk : b.fiyat) - (a.fiyat == null ? kucuk : a.fiyat));
      case "ad":           return l.sort((a, b) => karsilastir(a.ad, b.ad));
      case "cok-satan":    return l.sort((a, b) => (b.cokSatan ? 1 : 0) - (a.cokSatan ? 1 : 0));
      default:             return l;   // "yeni" — kaynak zaten yeniden eskiye sıralı
    }
  }

  const Veri = {
    CANLI,
    mod: CANLI ? "supabase" : "demo",
    slug, kimlik, paraYaz, fiyatOku, normalize, karsilastir, gorselKucult,
    VARSAYILAN_GRUPLAR,

    hazir: (zorla) => yukle(zorla),
    tazele: () => yukle(true),

    async gruplar() { return (await yukle()).gruplar; },

    async grup(idVeyaSlug) {
      const g = await yukle();
      return g.gruplar.find((x) => String(x.id) === String(idVeyaSlug) || x.slug === idVeyaSlug) || null;
    },

    /* Katalog filtresi — alanların hepsi isteğe bağlı:
       { grup, marka, arama, sirala, cokSatan, limit, hepsi } */
    async urunler(f) {
      f = f || {};
      const veri = await yukle();
      let l = veri.urunler.filter((u) => f.hepsi || u.yayinda !== false);

      if (f.grup) {
        const g = await this.grup(f.grup);
        l = g ? l.filter((u) => u.grupId === g.id) : [];
      }
      if (f.marka) {
        const m = normalize(f.marka);
        l = l.filter((u) => normalize(u.marka) === m);
      }
      if (f.cokSatan) l = l.filter((u) => u.cokSatan);
      if (f.arama) {
        const kelimeler = normalize(f.arama).split(/\s+/).filter(Boolean);
        l = l.filter((u) => {
          const havuz = normalize([u.ad, u.marka, u.aciklama, u.grupAd].join(" "));
          return kelimeler.every((k) => havuz.indexOf(k) >= 0);
        });
      }
      l = sirala(l, f.sirala);
      return f.limit ? l.slice(0, f.limit) : l;
    },

    async urun(id) {
      const veri = await yukle();
      return veri.urunler.find((u) => String(u.id) === String(id)) || null;
    },

    /* Markaya göre filtre kutusu için: marka + kaç ürün */
    async markalar(grupIdVeyaSlug) {
      const l = await this.urunler(grupIdVeyaSlug ? { grup: grupIdVeyaSlug } : {});
      const say = new Map();
      l.forEach((u) => {
        const m = (u.marka || "").trim();
        if (m) say.set(m, (say.get(m) || 0) + 1);
      });
      return [...say.entries()]
        .map((c) => ({ ad: c[0], adet: c[1] }))
        .sort((a, b) => karsilastir(a.ad, b.ad));
    },

    /* Sol sütundaki grup listesi + ürün sayıları */
    async grupSayilari() {
      const veri = await yukle();
      const say = new Map();
      veri.urunler.filter((u) => u.yayinda !== false)
        .forEach((u) => say.set(u.grupId, (say.get(u.grupId) || 0) + 1));
      return veri.gruplar.map((g) => ({ ...g, adet: say.get(g.id) || 0 }));
    },

    /* --- yazma (panel) --- */
    async grupKaydet(g) { const s = await K.grupKaydet(g); onbellek = null; return s; },
    async grupSil(id)   { const s = await K.grupSil(id);   onbellek = null; return s; },
    async urunKaydet(u) { const s = await K.urunKaydet(u); onbellek = null; return s; },
    async urunSil(id)   { const s = await K.urunSil(id);   onbellek = null; return s; },
    gorselYukle(d)      { return K.gorselYukle(d); },

    /* --- oturum --- */
    girisYap: (k, s) => K.girisYap(k, s),
    cikisYap: () => K.cikisYap(),
    oturumVar: () => K.oturumVar(),

    /* --- yedek --- */
    async yedekAl() {
      const veri = await yukle(true);
      return { surum: 1, tarih: new Date().toISOString(), gruplar: veri.gruplar, urunler: veri.urunler };
    },
    async yedekYukle(veri) {
      if (!veri || !Array.isArray(veri.gruplar) || !Array.isArray(veri.urunler)) {
        throw new Error("Yedek dosyası okunamadı.");
      }
      for (const g of veri.gruplar) await K.grupKaydet(g);
      for (const u of veri.urunler) await K.urunKaydet(u);
      onbellek = null;
      return true;
    },
  };

  window.Veri = Veri;
})();
