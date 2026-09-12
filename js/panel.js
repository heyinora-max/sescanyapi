/* =========================================================
   Ses Can Yapı — YÖNETİM PANELİ
   ---------------------------------------------------------
   Amaç: ürünleri ve fiyatları teknik bilgi gerektirmeden girmek.
   Tasarım kararları:
     - Her ürün grubu bir satır; açılınca o grubun ürünleri gelir.
     - Fiyat listede doğrudan düzenlenir; yazdıktan kısa süre sonra
       kendiliğinden kaydedilir (Enter beklemeden de kaydolur).
     - "Kaydet ve Yeni Ekle" formu açık bırakır; aynı gruba arka
       arkaya ürün girmek en sık yapılan iş.
   ========================================================= */
(function () {
  "use strict";

  const A = window.AYAR || {};
  const $ = (s) => document.querySelector(s);
  const pb = A.paraBirimi || "TL";

  const durum = {
    gruplar: [],
    urunler: [],
    acik: new Set(),      // açık duran grup kimlikleri
    arama: "",
    ben: { eposta: "", yonetici: true },   // oturumdaki kullanıcı ve yazma yetkisi
    kayitKipi: false,                      // giriş ekranı: giriş mi, hesap oluşturma mı
  };

  /* ---------------- bildirim ---------------- */

  function bildir(mesaj, kotu) {
    const kap = $("#bildirimler");
    const el = document.createElement("div");
    el.className = "bildi " + (kotu ? "bildi--kotu" : "bildi--iyi");
    el.setAttribute("role", "status");
    el.innerHTML = kotu
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg><span></span>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M20 6L9 17l-5-5"/></svg><span></span>';
    el.querySelector("span").textContent = mesaj;
    kap.appendChild(el);
    setTimeout(() => el.remove(), kotu ? 6000 : 3000);
  }

  /* Arka plan görselini HTML özniteliğine güvenle yazar: öznitelik çift
     tırnaklı olduğu için url() içinde tek tırnak (&#39;) kullanmak gerekir. */
  function arkaPlan(yol) {
    const css = String(yol || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    return 'style="background-image:url(&#39;' + kacis(css) + '&#39;)"';
  }

  function kacis(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* "Boya Malzemeleri" -> "Boya Malzemeleri Ürünleri", ama adı zaten
     "... Ürünleri" ile biten gruplarda ikinci kez eklemez. */
  function grupBasligi(ad) {
    const t = String(ad || "").trim();
    return /ürünler[i]?$/i.test(t) ? t : t + " Ürünleri";
  }

  /* ---------------- giriş ---------------- */

  /* Giriş ekranı iki iş görüyor: giriş ve ilk şifre oluşturma. */
  function girisEkraniniYaz() {
    const canli = window.Veri.CANLI;
    const kayit = durum.kayitKipi;
    $("#giris-alt-yazi").textContent = !canli
      ? "Ürün ve fiyat girişi için şifrenizi girin."
      : kayit
        ? "Listeye eklenen e-postanızla kendi şifrenizi belirleyin."
        : "Ürün ve fiyat girişi için e-posta ve şifrenizle giriş yapın.";
    $("#giris-dugme").textContent = kayit ? "Hesabı Oluştur" : "Giriş Yap";
    $("#gecis-yazi").textContent = kayit ? "Şifreniz zaten var mı?" : "İlk kez mi giriyorsunuz?";
    $("#gecis-dugme").textContent = kayit ? "Giriş yapın" : "Şifrenizi oluşturun";
    $("#g-sifre").setAttribute("autocomplete", kayit ? "new-password" : "current-password");
    $("#giris-hata").hidden = true;
  }

  function girisKur() {
    const canli = window.Veri.CANLI;
    $("#alan-eposta").hidden = !canli;
    $("#g-eposta").required = canli;
    girisEkraniniYaz();

    // Canlı yayında, listeye eklenmiş kişi şifresini kendisi belirleyebilir
    $("#giris-gecis").hidden = !canli;
    $("#gecis-dugme").addEventListener("click", () => {
      durum.kayitKipi = !durum.kayitKipi;
      girisEkraniniYaz();
    });

    $("#giris-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const hata = $("#giris-hata");
      const dugme = $("#giris-dugme");
      const eposta = $("#g-eposta").value.trim();
      const sifre = $("#g-sifre").value;
      hata.hidden = true;
      dugme.disabled = true;
      dugme.textContent = durum.kayitKipi ? "Hesap oluşturuluyor..." : "Giriş yapılıyor...";
      try {
        if (durum.kayitKipi) {
          if (sifre.length < 6) throw new Error("Şifre en az 6 karakter olmalı.");
          const sonuc = await window.Veri.kayitOl(eposta, sifre);
          $("#g-sifre").value = "";
          if (!sonuc.girildi) {
            durum.kayitKipi = false;
            girisEkraniniYaz();
            hata.textContent = "Hesap oluşturuldu. E-postanıza gelen doğrulama bağlantısına " +
                               "tıkladıktan sonra buradan giriş yapabilirsiniz.";
            hata.hidden = false;
            return;
          }
        } else {
          await window.Veri.girisYap(eposta, sifre);
          $("#g-sifre").value = "";
        }
        await paneliAc();
      } catch (h) {
        hata.textContent = h.message || "İşlem tamamlanamadı.";
        hata.hidden = false;
      } finally {
        dugme.disabled = false;
        dugme.textContent = durum.kayitKipi ? "Hesabı Oluştur" : "Giriş Yap";
      }
    });

    $("#cikis").addEventListener("click", () => {
      window.Veri.cikisYap();
      location.reload();
    });
  }

  async function paneliAc() {
    $("#giris").hidden = true;
    $("#panel").hidden = false;

    const canli = window.Veri.CANLI;
    const rozet = $("#mod-rozet");
    rozet.textContent = canli ? "Canlı" : "Demo";
    rozet.className = "rozet " + (canli ? "rozet--canli" : "rozet--demo");
    $("#mod-yazi").textContent = canli ? "Canlı yayın" : "Demo modu";
    $("#demo-uyari").hidden = canli;

    // Yazma yetkisi veritabanından sorulur; yetkisiz kullanıcı uyarı görür
    try { durum.ben = await window.Veri.kimim(); }
    catch (h) { durum.ben = { eposta: "", yonetici: !canli }; }
    $("#yetki-uyari").hidden = !canli || durum.ben.yonetici;
    $("#kullanici-ac").hidden = !canli || !durum.ben.yonetici;

    await veriTazele();
  }

  /* ---------------- veri ---------------- */

  async function veriTazele() {
    const v = await window.Veri.hazir(true);
    durum.gruplar = v.gruplar;
    durum.urunler = v.urunler;
    ozetiCiz();
    gruplariCiz();
  }

  function ozetiCiz() {
    $("#say-urun").textContent = durum.urunler.length;
    $("#say-grup").textContent = durum.gruplar.length;
    $("#say-fiyatsiz").textContent = durum.urunler.filter((u) => u.fiyat == null || u.fiyat === "").length;
    $("#say-coksatan").textContent = durum.urunler.filter((u) => u.cokSatan).length;
  }

  function grubunUrunleri(grupId) {
    let l = durum.urunler.filter((u) => u.grupId === grupId);
    if (durum.arama) {
      const kelimeler = window.Veri.normalize(durum.arama).split(/\s+/).filter(Boolean);
      l = l.filter((u) => {
        const havuz = window.Veri.normalize([u.ad, u.marka, u.aciklama].join(" "));
        return kelimeler.every((k) => havuz.indexOf(k) >= 0);
      });
    }
    return l;
  }

  /* ---------------- çizim ---------------- */

  function urunSatiri(u) {
    const gorsel = u.gorsel
      ? '<div class="satir__g" ' + arkaPlan(u.gorsel) + "></div>"
      : '<div class="satir__g bos">' + kacis((u.ad || "?").trim().charAt(0).toLocaleUpperCase("tr")) + "</div>";

    const fiyat = u.fiyat == null || u.fiyat === "" ? "" : window.Veri.paraYaz(u.fiyat);

    return (
      '<div class="satir" data-urun="' + kacis(u.id) + '">' +
        gorsel +
        "<div>" +
          (u.marka ? '<div class="satir__marka">' + kacis(u.marka) + "</div>" : "") +
          '<div class="satir__ad">' + kacis(u.ad) + "</div>" +
          (u.yayinda === false ? '<div class="satir__yok">Yayında değil</div>' : "") +
        "</div>" +
        '<div class="fiyat-kutu">' +
          '<input type="text" inputmode="decimal" value="' + kacis(fiyat) + '" placeholder="Fiyat girin" ' +
                 'data-fiyat="' + kacis(u.id) + '" aria-label="Fiyat">' +
          '<span class="pb">' + kacis(pb) + "</span>" +
        "</div>" +
        '<select data-stok="' + kacis(u.id) + '" aria-label="Stok durumu">' +
          '<option value="stokta"' + (u.stok === "stokta" || !u.stok ? " selected" : "") + ">Stokta</option>" +
          '<option value="siparis"' + (u.stok === "siparis" ? " selected" : "") + ">Siparişe bağlı</option>" +
          '<option value="tukendi"' + (u.stok === "tukendi" ? " selected" : "") + ">Tükendi</option>" +
        "</select>" +
        '<button class="yildiz ' + (u.cokSatan ? "acik" : "") + '" type="button" data-coksatan="' + kacis(u.id) + '" ' +
                'title="En Çok Satanlar" aria-label="En Çok Satanlar">' +
          '<svg viewBox="0 0 24 24" fill="' + (u.cokSatan ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="1.8">' +
          '<path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6.1L12 16.8 6.7 19.7l1.1-6.1L3.4 9.4l6-.8z"/></svg>' +
        "</button>" +
        '<div class="satir__islem">' +
          '<button class="mini" type="button" data-kopyala="' + kacis(u.id) + '" title="Kopyala" aria-label="Kopyala">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
          "</button>" +
          '<button class="mini" type="button" data-duzenle="' + kacis(u.id) + '" title="Düzenle" aria-label="Düzenle">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>' +
          "</button>" +
          '<button class="mini sil" type="button" data-sil="' + kacis(u.id) + '" title="Sil" aria-label="Sil">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>' +
          "</button>" +
        "</div>" +
      "</div>"
    );
  }

  function grupBlogu(g, sira, toplamGrup) {
    // Taşıma düğmeleri listenin ucundayken kapalı olsun
    const ilkMi = sira === 0;
    const sonMu = toplamGrup != null && sira === toplamGrup - 1;
    const urunler = grubunUrunleri(g.id);
    const acik = durum.acik.has(g.id);
    const toplam = durum.urunler.filter((u) => u.grupId === g.id).length;

    const gorsel = g.gorsel
      ? '<div class="grup__gorsel" ' + arkaPlan(g.gorsel) + "></div>"
      : "";

    let govde = "";
    if (acik) {
      govde =
        '<div class="grup__govde">' +
          (urunler.length
            ? '<div class="satir satir--bas"><span></span><span>Ürün</span><span>Fiyat</span><span>Stok</span><span>Çok satan</span><span></span></div>' +
              urunler.map(urunSatiri).join("")
            : '<div class="grup__bos">' +
                (durum.arama
                  ? "Aramanıza uyan ürün yok."
                  : "Bu grupta henüz ürün yok. Sağdaki <b>Ürün Ekle</b> düğmesiyle başlayın.") +
              "</div>") +
        "</div>";
    }

    return (
      '<section class="grup ' + (acik ? "acik" : "") + '" data-grup="' + kacis(g.id) + '">' +
        '<div class="grup__bas">' +
          '<button class="grup__ac" type="button" data-ac="' + kacis(g.id) + '" aria-expanded="' + acik + '">' +
            '<span class="grup__ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg></span>' +
            gorsel +
            '<span class="grup__yazi">' +
              "<h3>" + kacis(grupBasligi(g.ad)) + "</h3>" +
              "<span>" + toplam + " ürün" + (durum.arama && urunler.length !== toplam ? " · aramada " + urunler.length : "") + "</span>" +
            "</span>" +
          "</button>" +
          '<div class="grup__islem">' +
            '<button class="d d--ana d--kucuk" type="button" data-urun-ekle="' + kacis(g.id) + '">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>' +
              "Ürün Ekle" +
            "</button>" +
            '<button class="mini" type="button" data-yukari="' + kacis(g.id) + '" title="Yukarı taşı" aria-label="Yukarı taşı"' + (ilkMi ? " disabled" : "") + ">" +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>' +
            "</button>" +
            '<button class="mini" type="button" data-asagi="' + kacis(g.id) + '" title="Aşağı taşı" aria-label="Aşağı taşı"' + (sonMu ? " disabled" : "") + ">" +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>' +
            "</button>" +
            '<button class="mini" type="button" data-toplu-fiyat="' + kacis(g.id) + '" title="Toplu fiyat güncelle" aria-label="Toplu fiyat güncelle">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 5L5 19"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>' +
            "</button>" +
            '<button class="mini" type="button" data-grup-duzenle="' + kacis(g.id) + '" title="Grubu düzenle" aria-label="Grubu düzenle">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>' +
            "</button>" +
            '<button class="mini sil" type="button" data-grup-sil="' + kacis(g.id) + '" title="Grubu sil" aria-label="Grubu sil">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>' +
            "</button>" +
          "</div>" +
        "</div>" +
        govde +
      "</section>"
    );
  }

  function gruplariCiz() {
    const kap = $("#gruplar");
    if (!durum.gruplar.length) {
      kap.innerHTML =
        '<div class="bos-panel"><b>Henüz ürün grubu yok</b>' +
        "<p>Başlamak için yukarıdaki <b>Yeni Grup</b> düğmesine basın.</p></div>";
      return;
    }
    // Aramada, eşleşme çıkan gruplar kendiliğinden açılsın
    let liste = durum.gruplar;
    if (durum.arama) {
      liste = liste.filter((g) => grubunUrunleri(g.id).length > 0);
      liste.forEach((g) => durum.acik.add(g.id));
      if (!liste.length) {
        kap.innerHTML = '<div class="bos-panel"><b>Sonuç yok</b><p>Aramanıza uyan ürün bulunamadı.</p></div>';
        return;
      }
    }
    kap.innerHTML = liste.map((g, i) => grupBlogu(g, i, liste.length)).join("");
  }

  /* Tek bir grubu yeniden çizer — tüm listeyi tazelemek yerine, açık
     grupların kaydırma konumu ve odak bozulmasın diye. */
  function grubuTazele(grupId) {
    const eski = document.querySelector('.grup[data-grup="' + CSS.escape(grupId) + '"]');
    const g = durum.gruplar.find((x) => x.id === grupId);
    if (!eski || !g) { gruplariCiz(); return; }
    const sira = durum.gruplar.indexOf(g);
    eski.outerHTML = grupBlogu(g, sira, durum.gruplar.length);
  }

  /* ---------------- fiyat: anında kaydetme ----------------
     Kutudan çıkmadan sekme kapanırsa değişiklik kaybolmasın diye
     hem yazarken (gecikmeli) hem odak kaybında kaydediyoruz.      */

  const bekleyen = new Map();   // urunId -> { zamanlayici, deger }

  async function fiyatKaydet(id, ham, kutu) {
    const bilgi = bekleyen.get(id);
    if (bilgi) { clearTimeout(bilgi.zamanlayici); bekleyen.delete(id); }

    const urun = durum.urunler.find((u) => String(u.id) === String(id));
    if (!urun) return;

    const yeni = ham.trim() === "" ? null : window.Veri.fiyatOku(ham);
    if (ham.trim() !== "" && yeni === null) {
      bildir("Fiyat okunamadı: " + ham, true);
      if (kutu) kutu.value = urun.fiyat == null ? "" : window.Veri.paraYaz(urun.fiyat);
      return;
    }
    if (yeni === urun.fiyat) return;

    try {
      await window.Veri.urunKaydet({ ...urun, fiyat: yeni });
      urun.fiyat = yeni;
      ozetiCiz();
      if (kutu) {
        kutu.value = yeni == null ? "" : window.Veri.paraYaz(yeni);
        kutu.classList.add("kaydedildi");
        setTimeout(() => kutu.classList.remove("kaydedildi"), 1200);
      }
    } catch (h) {
      bildir("Fiyat kaydedilemedi: " + h.message, true);
    }
  }

  function fiyatBekletVeKaydet(id, deger, kutu) {
    const onceki = bekleyen.get(id);
    if (onceki) clearTimeout(onceki.zamanlayici);
    const zamanlayici = setTimeout(() => fiyatKaydet(id, deger, kutu), 900);
    bekleyen.set(id, { zamanlayici, deger, kutu });
  }

  // Sayfa kapanırken bekleyen fiyatları hemen yaz
  function bekleyenleriBosalt() {
    bekleyen.forEach((bilgi, id) => {
      clearTimeout(bilgi.zamanlayici);
      fiyatKaydet(id, bilgi.deger, bilgi.kutu);
    });
  }
  window.addEventListener("beforeunload", (e) => {
    if (!bekleyen.size) return;
    bekleyenleriBosalt();
    e.preventDefault();
    e.returnValue = "";
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) bekleyenleriBosalt(); });

  /* ---------------- ürün kipi ---------------- */

  let gorselSecili = "";

  function grupSecenekleri(secili) {
    $("#u-grup").innerHTML = durum.gruplar
      .map((g) => '<option value="' + kacis(g.id) + '"' + (g.id === secili ? " selected" : "") + ">" + kacis(g.ad) + "</option>")
      .join("");
  }

  function markaOnerileri() {
    const set = new Set(durum.urunler.map((u) => (u.marka || "").trim()).filter(Boolean));
    $("#marka-listesi").innerHTML = [...set].sort(window.Veri.karsilastir)
      .map((m) => '<option value="' + kacis(m) + '"></option>').join("");
  }

  function gorselGoster(kaynak) {
    gorselSecili = kaynak || "";
    const var_ = !!gorselSecili;
    $("#gorsel-onizleme").hidden = !var_;
    $("#gorsel-alan").hidden = var_;
    if (var_) $("#gorsel-img").src = gorselSecili;
    $("#u-gorsel").value = gorselSecili;
  }

  function urunKipiAc(urun, grupId) {
    grupSecenekleri(grupId || (urun && urun.grupId) || (durum.gruplar[0] && durum.gruplar[0].id));
    markaOnerileri();

    $("#urun-kip-baslik").textContent = urun ? "Ürünü Düzenle" : "Ürün Ekle";
    $("#u-id").value = urun ? urun.id : "";
    $("#u-ad").value = urun ? urun.ad : "";
    $("#u-marka").value = urun ? urun.marka || "" : "";
    $("#u-fiyat").value = urun && urun.fiyat != null ? window.Veri.paraYaz(urun.fiyat) : "";
    $("#u-birim").value = urun ? urun.birim || "" : "";
    $("#u-stok").value = urun ? urun.stok || "stokta" : "stokta";
    $("#u-aciklama").value = urun ? urun.aciklama || "" : "";
    $("#u-coksatan").checked = !!(urun && urun.cokSatan);
    $("#u-yayinda").checked = urun ? urun.yayinda !== false : true;
    $("#u-kaydet-yeni").hidden = !!urun;      // düzenlemede "yeni ekle" anlamsız
    $("#gorsel-durum").hidden = true;
    gorselGoster(urun ? urun.gorsel : "");

    $("#kip-urun").hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#u-ad").focus(), 60);
  }

  function urunKipiKapat() {
    $("#kip-urun").hidden = true;
    document.body.style.overflow = "";
  }

  function formuTemizle(grupId) {
    $("#u-id").value = "";
    $("#u-ad").value = "";
    $("#u-fiyat").value = "";
    $("#u-aciklama").value = "";
    $("#u-coksatan").checked = false;
    gorselGoster("");
    if (grupId) $("#u-grup").value = grupId;
    $("#u-ad").focus();
    // marka, birim ve stok bilerek korunuyor: aynı gruba arka arkaya
    // ürün girerken çoğunlukla aynı kalıyorlar.
  }

  async function urunuKaydet(yenidenAc) {
    const ad = $("#u-ad").value.trim();
    if (!ad) { $("#u-ad").focus(); bildir("Ürün adı zorunlu.", true); return; }

    const id = $("#u-id").value;
    const kayit = {
      id: id || undefined,
      grupId: $("#u-grup").value,
      ad: ad,
      marka: $("#u-marka").value.trim(),
      fiyat: $("#u-fiyat").value.trim() === "" ? null : window.Veri.fiyatOku($("#u-fiyat").value),
      birim: $("#u-birim").value.trim(),
      stok: $("#u-stok").value,
      aciklama: $("#u-aciklama").value.trim(),
      gorsel: $("#u-gorsel").value,
      cokSatan: $("#u-coksatan").checked,
      yayinda: $("#u-yayinda").checked,
    };
    if ($("#u-fiyat").value.trim() !== "" && kayit.fiyat === null) {
      bildir("Fiyat okunamadı. Örnek: 1250,50", true);
      $("#u-fiyat").focus();
      return;
    }

    const dugmeler = [$("#u-kaydet"), $("#u-kaydet-yeni")];
    dugmeler.forEach((d) => (d.disabled = true));
    try {
      await window.Veri.urunKaydet(kayit);
      const grupId = kayit.grupId;
      durum.acik.add(grupId);
      await veriTazele();
      bildir(id ? "Ürün güncellendi." : ad + " eklendi.");
      if (yenidenAc) formuTemizle(grupId);
      else urunKipiKapat();
    } catch (h) {
      bildir("Kaydedilemedi: " + h.message, true);
    } finally {
      dugmeler.forEach((d) => (d.disabled = false));
    }
  }

  /* ---------------- görsel seçimi ---------------- */

  async function gorseliIsle(dosya) {
    if (!dosya) return;
    const durumEl = $("#gorsel-durum");
    durumEl.hidden = false;
    durumEl.className = "gorsel-durum";
    durumEl.textContent = "Görsel hazırlanıyor...";
    try {
      const yol = await window.Veri.gorselYukle(dosya);
      gorselGoster(yol);
      durumEl.textContent = "Görsel hazır.";
      setTimeout(() => { durumEl.hidden = true; }, 1600);
    } catch (h) {
      durumEl.className = "gorsel-durum hata";
      durumEl.textContent = h.message || "Görsel yüklenemedi.";
    }
  }

  function gorselOlaylari() {
    const alan = $("#gorsel-alan");
    const dosyaKutu = $("#gorsel-dosya");

    alan.addEventListener("click", () => dosyaKutu.click());
    dosyaKutu.addEventListener("change", () => {
      gorseliIsle(dosyaKutu.files[0]);
      dosyaKutu.value = "";   // aynı dosya tekrar seçilebilsin
    });

    ["dragenter", "dragover"].forEach((o) =>
      alan.addEventListener(o, (e) => { e.preventDefault(); alan.classList.add("uzerinde"); })
    );
    ["dragleave", "drop"].forEach((o) =>
      alan.addEventListener(o, (e) => { e.preventDefault(); alan.classList.remove("uzerinde"); })
    );
    alan.addEventListener("drop", (e) => {
      const d = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (d) gorseliIsle(d);
    });

    $("#gorsel-kaldir").addEventListener("click", () => gorselGoster(""));
  }

  /* ---------------- grup kipi ---------------- */

  function grupKipiAc(grup) {
    $("#grup-kip-baslik").textContent = grup ? "Grubu Düzenle" : "Yeni Grup";
    $("#g-id").value = grup ? grup.id : "";
    $("#g-ad").value = grup ? grup.ad : "";
    $("#g-aciklama").value = grup ? grup.aciklama || "" : "";
    $("#g-gorsel").value = grup ? grup.gorsel || "" : "";
    $("#kip-grup").hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#g-ad").focus(), 60);
  }

  function grupKipiKapat() {
    $("#kip-grup").hidden = true;
    document.body.style.overflow = "";
  }


  /* Grup sırası hem katalog sol sütununu hem anasayfadaki kutuları
     belirliyor; müşteri en çok sattığı grubu öne alabilsin diye. */
  async function grubuTasi(grupId, yon) {
    const i = durum.gruplar.findIndex((g) => g.id === grupId);
    const j = i + yon;
    if (i < 0 || j < 0 || j >= durum.gruplar.length) return;
    const a = durum.gruplar[i], b = durum.gruplar[j];
    try {
      // Sıra numaraları veride seyrek olabilir; komşuyla takas etmek
      // yerine listedeki konumu yazmak sırayı her zaman tutarlı kılar.
      await window.Veri.grupKaydet({ ...a, sira: j });
      await window.Veri.grupKaydet({ ...b, sira: i });
      await veriTazele();
    } catch (h) {
      bildir("Sıra değiştirilemedi: " + h.message, true);
    }
  }


  /* =========================================================
     PANEL KULLANICILARI
     ---------------------------------------------------------
     Yazma yetkisi veritabanındaki yonetici listesine bağlı. Liste
     buradan yönetilir; müşterinin Supabase arayüzüne girmesi gerekmez.
     ========================================================= */

  async function kullanicilariCiz() {
    const kap = $("#kullanici-liste");
    kap.innerHTML = '<div class="kullanici-bos">Yükleniyor...</div>';
    try {
      const liste = await window.Veri.yoneticiler();
      if (!liste.length) {
        kap.innerHTML = '<div class="kullanici-bos">Listede kimse yok.</div>';
        return;
      }
      kap.innerHTML = liste.map((y) => {
        const ben = y.eposta.toLowerCase() === (durum.ben.eposta || "").toLowerCase();
        return (
          '<div class="kullanici-satir">' +
            '<div class="kullanici-satir__ad">' +
              "<b>" + kacis(y.eposta) + "</b>" +
              (y.ad ? "<span>" + kacis(y.ad) + "</span>" : "") +
            "</div>" +
            (ben ? '<span class="rozet-ben">Siz</span>' : "") +
            (ben ? "" :
              '<button class="mini sil" type="button" data-kullanici-sil="' + kacis(y.eposta) + '" ' +
                      'title="Listeden çıkar" aria-label="Listeden çıkar">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>' +
              "</button>") +
          "</div>"
        );
      }).join("");
    } catch (h) {
      kap.innerHTML = '<div class="kullanici-bos">Liste okunamadı: ' + kacis(h.message) + "</div>";
    }
  }

  function kullaniciKipiAc() {
    $("#k-eposta").value = "";
    $("#k-ad").value = "";
    $("#kullanici-durum").textContent = "";
    $("#kip-kullanici").hidden = false;
    document.body.style.overflow = "hidden";
    kullanicilariCiz();
  }

  function kullaniciKipiKapat() {
    $("#kip-kullanici").hidden = true;
    document.body.style.overflow = "";
  }

  /* =========================================================
     TOPLU GİRİŞ — Excel/CSV aktarma
     ---------------------------------------------------------
     Müşteri yüzlerce ürünü tek tek girmek yerine Excel'de hazırlayıp
     tek dosyayla aktarabilsin diye. Excel Türkçe kurulumda CSV'yi
     noktalı virgülle yazar; ayırıcı başlık satırından anlaşılır.
     ========================================================= */

  const SUTUNLAR = [
    { alan: "grup",     baslik: "Grup",       ornek: "Boya Malzemeleri" },
    { alan: "ad",       baslik: "Ürün Adı",   ornek: "Filli Boya Momento 15 L" },
    { alan: "marka",    baslik: "Marka",      ornek: "Filli Boya" },
    { alan: "fiyat",    baslik: "Fiyat",      ornek: "2450,50" },
    { alan: "birim",    baslik: "Birim",      ornek: "kutu" },
    { alan: "stok",     baslik: "Stok",       ornek: "Stokta" },
    { alan: "aciklama", baslik: "Açıklama",   ornek: "15 litre. 90-110 m² kapatır." },
    { alan: "cokSatan", baslik: "Çok Satan",  ornek: "Hayır" },
  ];

  const STOK_KARSILIK = {
    "stokta": "stokta", "var": "stokta", "evet": "stokta",
    "siparis": "siparis", "siparise bagli": "siparis", "siparis uzerine": "siparis",
    "tukendi": "tukendi", "yok": "tukendi", "bitti": "tukendi",
  };

  function evetMi(deger) {
    const t = window.Veri.normalize(deger || "");
    return t === "evet" || t === "e" || t === "x" || t === "1" || t === "var" || t === "true";
  }

  /* Tırnak içindeki ayırıcıyı ve çift tırnak kaçışını doğru okur. */
  function csvCoz(metin, ayirici) {
    const satirlar = [];
    let alan = "", satir = [], tirnakta = false;
    for (let i = 0; i < metin.length; i++) {
      const c = metin[i];
      if (tirnakta) {
        if (c === '"') {
          if (metin[i + 1] === '"') { alan += '"'; i++; } else tirnakta = false;
        } else alan += c;
        continue;
      }
      if (c === '"') { tirnakta = true; continue; }
      if (c === ayirici) { satir.push(alan); alan = ""; continue; }
      if (c === "\n" || c === "\r") {
        if (c === "\r" && metin[i + 1] === "\n") i++;
        satir.push(alan); satirlar.push(satir); alan = ""; satir = [];
        continue;
      }
      alan += c;
    }
    if (alan !== "" || satir.length) { satir.push(alan); satirlar.push(satir); }
    return satirlar.filter((r) => r.some((h) => String(h).trim() !== ""));
  }

  function ayiriciBul(ilkSatir) {
    const say = (c) => (ilkSatir.split(c).length - 1);
    return say(";") > say(",") ? ";" : ",";
  }

  /* Başlıkları alan adlarına eşler; büyük/küçük ve Türkçe harf farkını yok sayar. */
  function basliklariEsle(basliklar) {
    const harita = {};
    basliklar.forEach((b, i) => {
      const t = window.Veri.normalize(b);
      const bulunan = SUTUNLAR.find((s) => window.Veri.normalize(s.baslik) === t || s.alan === t);
      if (bulunan) harita[bulunan.alan] = i;
    });
    return harita;
  }

  const csv = { satirlar: [], yeniGruplar: [] };

  function sablonMetni() {
    const ayr = ";";   // Excel'in Türkçe kurulumunda beklediği ayırıcı
    const bas = SUTUNLAR.map((s) => s.baslik).join(ayr);
    const ornek1 = SUTUNLAR.map((s) => s.ornek).join(ayr);
    const ornek2 = ["Tuğla", "Delikli Tuğla 19x19x13", "Derya", "14,75", "adet", "Stokta",
                    "Palette 240 adet.", "Evet"].join(ayr);
    // BOM: Excel dosyayı UTF-8 olarak açsın, Türkçe harfler bozulmasın
    return "﻿" + [bas, ornek1, ornek2].join("\r\n") + "\r\n";
  }

  function dosyaIndir(ad, icerik, tur) {
    const bag = document.createElement("a");
    bag.href = URL.createObjectURL(new Blob([icerik], { type: tur }));
    bag.download = ad;
    bag.click();
    setTimeout(() => URL.revokeObjectURL(bag.href), 1000);
  }

  function csvHata(mesaj) {
    $("#csv-onizleme").hidden = false;
    $("#csv-ozet").textContent = "";
    $("#csv-tablo").innerHTML = "";
    const h = $("#csv-hatalar");
    h.hidden = false;
    h.innerHTML = "<b>Dosya aktarılamadı</b>" + kacis(mesaj);
    $("#csv-aktar").disabled = true;
    $("#csv-durum").textContent = "";
  }

  async function csvOku(dosya) {
    const durumEl = $("#csv-durum");
    durumEl.textContent = "Dosya okunuyor...";
    let metin = await dosya.text();
    if (metin.charCodeAt(0) === 0xFEFF) metin = metin.slice(1);

    const ilkSonu = metin.indexOf("\n");
    const ilkSatir = metin.slice(0, ilkSonu < 0 ? metin.length : ilkSonu);
    const satirlar = csvCoz(metin, ayiriciBul(ilkSatir));
    if (satirlar.length < 2) { csvHata("Dosyada başlık satırından sonra veri yok."); return; }

    const harita = basliklariEsle(satirlar[0]);
    if (harita.ad === undefined) {
      csvHata("«Ürün Adı» sütunu bulunamadı. Şablonu indirip sütun başlıklarını değiştirmeden kullanın.");
      return;
    }

    const gruplarAd = new Map();
    durum.gruplar.forEach((g) => gruplarAd.set(window.Veri.normalize(g.ad), g));

    const kabul = [], hatalar = [], yeniGrupAdlari = new Set();
    satirlar.slice(1).forEach((r, i) => {
      const al = (alan) => (harita[alan] === undefined ? "" : String(r[harita[alan]] || "").trim());
      const ad = al("ad");
      if (!ad) { hatalar.push((i + 2) + ". satır: ürün adı boş, atlandı."); return; }

      const grupAd = al("grup");
      const grup = grupAd ? gruplarAd.get(window.Veri.normalize(grupAd)) : null;
      if (grupAd && !grup) yeniGrupAdlari.add(grupAd.trim());
      if (!grupAd && !durum.gruplar.length) {
        hatalar.push((i + 2) + ". satır: grup boş ve sistemde hiç grup yok.");
        return;
      }

      const fiyatHam = al("fiyat");
      let fiyat = null;
      if (fiyatHam) {
        fiyat = window.Veri.fiyatOku(fiyatHam);
        if (fiyat === null) hatalar.push((i + 2) + ". satır: fiyat okunamadı («" + fiyatHam + "»), boş bırakıldı.");
      }

      kabul.push({
        ad: ad,
        grupAd: grupAd.trim(),
        marka: al("marka"),
        fiyat: fiyat,
        birim: al("birim"),
        stok: STOK_KARSILIK[window.Veri.normalize(al("stok"))] || "stokta",
        aciklama: al("aciklama"),
        cokSatan: evetMi(al("cokSatan")),
      });
    });

    csv.satirlar = kabul;
    csv.yeniGruplar = [...yeniGrupAdlari];
    csvOnizle(hatalar);
    durumEl.textContent = "";
  }

  function csvOnizle(hatalar) {
    $("#csv-onizleme").hidden = false;
    $("#csv-aktar").disabled = csv.satirlar.length === 0;

    const fiyatli = csv.satirlar.filter((u) => u.fiyat != null).length;
    $("#csv-ozet").innerHTML =
      "<b>" + csv.satirlar.length + " ürün</b> aktarılmaya hazır · " +
      fiyatli + " tanesinde fiyat var" +
      (csv.yeniGruplar.length ? " · <b>" + csv.yeniGruplar.length + " yeni grup</b>" : "");

    const h = $("#csv-hatalar");
    if (hatalar.length) {
      h.hidden = false;
      h.innerHTML = "<b>" + hatalar.length + " satırda uyarı var</b>" +
        hatalar.slice(0, 12).map(kacis).join("<br>") +
        (hatalar.length > 12 ? "<br>… ve " + (hatalar.length - 12) + " tane daha" : "");
    } else h.hidden = true;

    const grupAlani = $("#csv-yeni-grup-alan");
    grupAlani.hidden = csv.yeniGruplar.length === 0;
    $("#csv-yeni-grup-ad").textContent = csv.yeniGruplar.join(", ");

    const ilk = csv.satirlar.slice(0, 25);
    $("#csv-tablo").innerHTML =
      "<table><thead><tr><th>Grup</th><th>Ürün</th><th>Marka</th><th>Fiyat</th><th>Birim</th></tr></thead><tbody>" +
      ilk.map((u) =>
        "<tr><td>" + kacis(u.grupAd || "—") + "</td><td>" + kacis(u.ad) + "</td><td>" +
        kacis(u.marka || "—") + '</td><td class="sayi">' +
        (u.fiyat == null ? "—" : window.Veri.paraYaz(u.fiyat)) + "</td><td>" +
        kacis(u.birim || "—") + "</td></tr>"
      ).join("") +
      "</tbody></table>" +
      (csv.satirlar.length > ilk.length
        ? '<div class="onizleme__devam">… ve ' + (csv.satirlar.length - ilk.length) + " ürün daha</div>"
        : "");
  }

  async function csvAktar() {
    const dugme = $("#csv-aktar");
    const durumEl = $("#csv-durum");
    dugme.disabled = true;

    try {
      // Önce yeni gruplar — ürünler onlara bağlanacak
      if (csv.yeniGruplar.length && $("#csv-yeni-grup").checked) {
        for (let i = 0; i < csv.yeniGruplar.length; i++) {
          const ad = csv.yeniGruplar[i];
          durumEl.textContent = "Grup oluşturuluyor: " + ad;
          await window.Veri.grupKaydet({
            slug: window.Veri.slug(ad), ad: ad, aciklama: "", gorsel: "",
            sira: durum.gruplar.length + i,
          });
        }
        await veriTazele();
      }

      const adlaGrup = new Map();
      durum.gruplar.forEach((g) => adlaGrup.set(window.Veri.normalize(g.ad), g));
      const varsayilanGrup = durum.gruplar[0];

      let eklenen = 0, atlanan = 0;
      for (let i = 0; i < csv.satirlar.length; i++) {
        const u = csv.satirlar[i];
        const grup = (u.grupAd && adlaGrup.get(window.Veri.normalize(u.grupAd))) || varsayilanGrup;
        if (!grup) { atlanan++; continue; }
        durumEl.textContent = (i + 1) + " / " + csv.satirlar.length + " aktarılıyor...";
        await window.Veri.urunKaydet({
          grupId: grup.id, ad: u.ad, marka: u.marka, fiyat: u.fiyat, birim: u.birim,
          stok: u.stok, aciklama: u.aciklama, gorsel: "", cokSatan: u.cokSatan, yayinda: true,
        });
        eklenen++;
        durum.acik.add(grup.id);
      }

      await veriTazele();
      excelKipiKapat();
      bildir(eklenen + " ürün aktarıldı." + (atlanan ? " " + atlanan + " satır atlandı." : ""));
    } catch (h) {
      bildir("Aktarma yarıda kaldı: " + h.message, true);
      await veriTazele();
    } finally {
      dugme.disabled = false;
      durumEl.textContent = "";
    }
  }

  function excelKipiAc() {
    csv.satirlar = []; csv.yeniGruplar = [];
    $("#csv-onizleme").hidden = true;
    $("#csv-hatalar").hidden = true;
    $("#csv-aktar").disabled = true;
    $("#csv-durum").textContent = "";
    $("#kip-excel").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function excelKipiKapat() {
    $("#kip-excel").hidden = true;
    document.body.style.overflow = "";
  }

  /* Paneldeki tüm ürünleri Excel'de açılabilir CSV olarak indirir. */
  function csvDisaAktar() {
    const ayr = ";";
    const kacisCsv = (d) => {
      const t = String(d == null ? "" : d);
      return /[";\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
    };
    const grupAdi = new Map(durum.gruplar.map((g) => [g.id, g.ad]));
    const satirlar = [SUTUNLAR.map((s) => s.baslik).join(ayr)];
    durum.urunler.forEach((u) => {
      satirlar.push([
        grupAdi.get(u.grupId) || "", u.ad, u.marka || "",
        u.fiyat == null ? "" : window.Veri.paraYaz(u.fiyat),
        u.birim || "",
        u.stok === "siparis" ? "Siparişe bağlı" : u.stok === "tukendi" ? "Tükendi" : "Stokta",
        u.aciklama || "", u.cokSatan ? "Evet" : "Hayır",
      ].map(kacisCsv).join(ayr));
    });
    dosyaIndir("sescanyapi-urunler-" + new Date().toISOString().slice(0, 10) + ".csv",
               "﻿" + satirlar.join("\r\n") + "\r\n", "text/csv;charset=utf-8");
    bildir(durum.urunler.length + " ürün Excel dosyasına aktarıldı.");
  }

  /* =========================================================
     TOPLU FİYAT GÜNCELLEME
     ---------------------------------------------------------
     Yapı malzemesinde zamlar grup grup geliyor; tek tek yazmak
     yerine gruba yüzde uygulanır. Fiyatı boş ürüne dokunulmaz.
     ========================================================= */

  function topluFiyatAc(grupId) {
    const g = durum.gruplar.find((x) => x.id === grupId);
    if (!g) return;
    const kapsam = durum.urunler.filter((u) => u.grupId === grupId && u.fiyat != null);
    $("#f-grup-id").value = grupId;
    $("#f-oran").value = "";
    $("#f-onizleme").hidden = true;
    $("#f-aciklama").innerHTML =
      "<b>" + kacis(g.ad) + "</b> grubundaki <b>" + kapsam.length + " üründe</b> fiyat güncellenecek." +
      (kapsam.length ? "" : " Bu grupta fiyatı girilmiş ürün yok.");
    $("#kip-fiyat").hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#f-oran").focus(), 60);
  }

  function topluFiyatKapat() {
    $("#kip-fiyat").hidden = true;
    document.body.style.overflow = "";
  }

  function yeniFiyat(eski, yon, oran) {
    const carpan = yon === "indirim" ? 1 - oran / 100 : 1 + oran / 100;
    return Math.max(0, Math.round(eski * carpan * 100) / 100);
  }

  function topluFiyatOnizle() {
    const grupId = $("#f-grup-id").value;
    const oran = window.Veri.fiyatOku($("#f-oran").value);
    const kutu = $("#f-onizleme");
    if (!grupId || oran === null || oran <= 0) { kutu.hidden = true; return; }
    const yon = $("#f-yon").value;
    const kapsam = durum.urunler.filter((u) => u.grupId === grupId && u.fiyat != null);
    if (!kapsam.length) { kutu.hidden = true; return; }
    const ornek = kapsam[0];
    kutu.hidden = false;
    kutu.innerHTML =
      "Örnek: <b>" + kacis(ornek.ad) + "</b> " + window.Veri.paraYaz(ornek.fiyat) +
      " → <b>" + window.Veri.paraYaz(yeniFiyat(ornek.fiyat, yon, oran)) + "</b>";
  }

  async function topluFiyatUygula() {
    const grupId = $("#f-grup-id").value;
    const oran = window.Veri.fiyatOku($("#f-oran").value);
    if (oran === null || oran <= 0) { bildir("Oranı sayı olarak yazın. Örnek: 10", true); return; }
    const yon = $("#f-yon").value;
    const kapsam = durum.urunler.filter((u) => u.grupId === grupId && u.fiyat != null);
    if (!kapsam.length) { topluFiyatKapat(); return; }

    const g = durum.gruplar.find((x) => x.id === grupId);
    const soru = g.ad + " grubundaki " + kapsam.length + " ürüne %" + oran + " " +
                 (yon === "indirim" ? "indirim" : "zam") + " uygulanacak. Onaylıyor musunuz?";
    if (!confirm(soru)) return;

    try {
      for (const u of kapsam) {
        await window.Veri.urunKaydet({ ...u, fiyat: yeniFiyat(u.fiyat, yon, oran) });
      }
      await veriTazele();
      topluFiyatKapat();
      bildir(kapsam.length + " ürünün fiyatı güncellendi.");
    } catch (h) {
      bildir("Güncellenemedi: " + h.message, true);
      await veriTazele();
    }
  }

  /* ---------------- olaylar ---------------- */

  function olaylariBagla() {
    // --- panel gövdesi (delegasyon) ---
    $("#gruplar").addEventListener("click", async (e) => {
      const ac = e.target.closest("[data-ac]");
      if (ac) {
        const id = ac.getAttribute("data-ac");
        if (durum.acik.has(id)) durum.acik.delete(id); else durum.acik.add(id);
        grubuTazele(id);
        return;
      }

      const ekle = e.target.closest("[data-urun-ekle]");
      if (ekle) { urunKipiAc(null, ekle.getAttribute("data-urun-ekle")); return; }

      const gd = e.target.closest("[data-grup-duzenle]");
      if (gd) { grupKipiAc(durum.gruplar.find((g) => g.id === gd.getAttribute("data-grup-duzenle"))); return; }

      const gs = e.target.closest("[data-grup-sil]");
      if (gs) {
        const g = durum.gruplar.find((x) => x.id === gs.getAttribute("data-grup-sil"));
        const adet = durum.urunler.filter((u) => u.grupId === g.id).length;
        const uyari = adet
          ? g.ad + " grubu ve içindeki " + adet + " ürün silinecek. Bu işlem geri alınamaz. Emin misiniz?"
          : g.ad + " grubu silinsin mi?";
        if (!confirm(uyari)) return;
        try {
          await window.Veri.grupSil(g.id);
          await veriTazele();
          bildir(g.ad + " silindi.");
        } catch (h) { bildir("Silinemedi: " + h.message, true); }
        return;
      }

      const yuk = e.target.closest("[data-yukari]");
      if (yuk) { grubuTasi(yuk.getAttribute("data-yukari"), -1); return; }

      const asa = e.target.closest("[data-asagi]");
      if (asa) { grubuTasi(asa.getAttribute("data-asagi"), 1); return; }

      const tf = e.target.closest("[data-toplu-fiyat]");
      if (tf) { topluFiyatAc(tf.getAttribute("data-toplu-fiyat")); return; }

      const kop = e.target.closest("[data-kopyala]");
      if (kop) {
        const u = durum.urunler.find((x) => String(x.id) === kop.getAttribute("data-kopyala"));
        if (!u) return;
        // Aynı gruba benzer ürün girerken en sık yapılan iş: kopyasını açıp
        // sadece ölçüyü/fiyatı değiştirmek. Kayıt değil, dolu form açılır.
        urunKipiAc({ ...u, id: "", ad: u.ad + " (kopya)" }, u.grupId);
        $("#urun-kip-baslik").textContent = "Ürünü Kopyala";
        $("#u-id").value = "";
        $("#u-kaydet-yeni").hidden = false;
        setTimeout(() => { const a = $("#u-ad"); a.focus(); a.select(); }, 80);
        return;
      }

      const duz = e.target.closest("[data-duzenle]");
      if (duz) {
        urunKipiAc(durum.urunler.find((u) => String(u.id) === duz.getAttribute("data-duzenle")));
        return;
      }

      const sil = e.target.closest("[data-sil]");
      if (sil) {
        const u = durum.urunler.find((x) => String(x.id) === sil.getAttribute("data-sil"));
        if (!u || !confirm(u.ad + " silinsin mi? Bu işlem geri alınamaz.")) return;
        try {
          await window.Veri.urunSil(u.id);
          await veriTazele();
          bildir(u.ad + " silindi.");
        } catch (h) { bildir("Silinemedi: " + h.message, true); }
        return;
      }

      const yildiz = e.target.closest("[data-coksatan]");
      if (yildiz) {
        const u = durum.urunler.find((x) => String(x.id) === yildiz.getAttribute("data-coksatan"));
        if (!u) return;
        try {
          await window.Veri.urunKaydet({ ...u, cokSatan: !u.cokSatan });
          u.cokSatan = !u.cokSatan;
          yildiz.classList.toggle("acik", u.cokSatan);
          yildiz.querySelector("svg").setAttribute("fill", u.cokSatan ? "currentColor" : "none");
          ozetiCiz();
          bildir(u.cokSatan ? u.ad + " en çok satanlara eklendi." : u.ad + " en çok satanlardan çıkarıldı.");
        } catch (h) { bildir("Kaydedilemedi: " + h.message, true); }
      }
    });

    // fiyat kutuları
    $("#gruplar").addEventListener("input", (e) => {
      const kutu = e.target.closest("[data-fiyat]");
      if (kutu) fiyatBekletVeKaydet(kutu.getAttribute("data-fiyat"), kutu.value, kutu);
    });
    $("#gruplar").addEventListener("focusout", (e) => {
      const kutu = e.target.closest("[data-fiyat]");
      if (kutu) fiyatKaydet(kutu.getAttribute("data-fiyat"), kutu.value, kutu);
    });
    $("#gruplar").addEventListener("keydown", (e) => {
      const kutu = e.target.closest("[data-fiyat]");
      if (kutu && e.key === "Enter") { e.preventDefault(); kutu.blur(); }
    });

    // stok kutusu
    $("#gruplar").addEventListener("change", async (e) => {
      const sec = e.target.closest("[data-stok]");
      if (!sec) return;
      const u = durum.urunler.find((x) => String(x.id) === sec.getAttribute("data-stok"));
      if (!u) return;
      try {
        await window.Veri.urunKaydet({ ...u, stok: sec.value });
        u.stok = sec.value;
        bildir(u.ad + " stok durumu güncellendi.");
      } catch (h) { bildir("Kaydedilemedi: " + h.message, true); }
    });

    // --- araç çubuğu ---
    let bekle;
    $("#panel-ara").addEventListener("input", (e) => {
      clearTimeout(bekle);
      bekle = setTimeout(() => { durum.arama = e.target.value.trim(); gruplariCiz(); }, 220);
    });

    $("#grup-ekle").addEventListener("click", () => grupKipiAc(null));

    // --- panel kullanıcıları ---
    $("#kullanici-ac").addEventListener("click", kullaniciKipiAc);

    $("#kullanici-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const eposta = $("#k-eposta").value.trim();
      if (!eposta) return;
      $("#kullanici-durum").textContent = "Ekleniyor...";
      try {
        await window.Veri.yoneticiEkle(eposta, $("#k-ad").value.trim());
        $("#k-eposta").value = ""; $("#k-ad").value = "";
        await kullanicilariCiz();
        bildir(eposta + " listeye eklendi. Panelden kendi şifresini oluşturabilir.");
      } catch (h) {
        bildir("Eklenemedi: " + h.message, true);
      } finally {
        $("#kullanici-durum").textContent = "";
      }
    });

    $("#kullanici-liste").addEventListener("click", async (e) => {
      const d = e.target.closest("[data-kullanici-sil]");
      if (!d) return;
      const eposta = d.getAttribute("data-kullanici-sil");
      if (!confirm(eposta + " listeden çıkarılsın mı? Bu kişi artık ürün ekleyip değiştiremez.")) return;
      try {
        await window.Veri.yoneticiSil(eposta);
        await kullanicilariCiz();
        bildir(eposta + " listeden çıkarıldı.");
      } catch (h) { bildir("Çıkarılamadı: " + h.message, true); }
    });

    // --- Excel / CSV aktarma ---
    $("#excel-ac").addEventListener("click", excelKipiAc);
    $("#sablon-indir").addEventListener("click", () => {
      dosyaIndir("sescanyapi-urun-sablonu.csv", sablonMetni(), "text/csv;charset=utf-8");
      bildir("Şablon indirildi. Excel'de açıp ürünlerinizi yazın.");
    });

    const csvAlan = $("#csv-alan");
    const csvKutu = $("#csv-dosya");
    csvAlan.addEventListener("click", () => csvKutu.click());
    csvKutu.addEventListener("change", () => {
      const d = csvKutu.files[0];
      csvKutu.value = "";
      if (d) csvOku(d).catch((h) => csvHata(h.message || "Dosya okunamadı."));
    });
    ["dragenter", "dragover"].forEach((o) =>
      csvAlan.addEventListener(o, (e) => { e.preventDefault(); csvAlan.classList.add("uzerinde"); })
    );
    ["dragleave", "drop"].forEach((o) =>
      csvAlan.addEventListener(o, (e) => { e.preventDefault(); csvAlan.classList.remove("uzerinde"); })
    );
    csvAlan.addEventListener("drop", (e) => {
      const d = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (d) csvOku(d).catch((h) => csvHata(h.message || "Dosya okunamadı."));
    });
    $("#csv-aktar").addEventListener("click", csvAktar);
    $("#csv-disa").addEventListener("click", csvDisaAktar);

    // --- toplu fiyat ---
    $("#fiyat-form").addEventListener("submit", (e) => { e.preventDefault(); topluFiyatUygula(); });
    $("#f-oran").addEventListener("input", topluFiyatOnizle);
    $("#f-yon").addEventListener("change", topluFiyatOnizle);

    $("#yedek-al").addEventListener("click", async () => {
      try {
        const veri = await window.Veri.yedekAl();
        const bag = document.createElement("a");
        bag.href = URL.createObjectURL(new Blob([JSON.stringify(veri, null, 2)], { type: "application/json" }));
        bag.download = "sescanyapi-yedek-" + new Date().toISOString().slice(0, 10) + ".json";
        bag.click();
        URL.revokeObjectURL(bag.href);
        bildir("Yedek indirildi.");
      } catch (h) { bildir("Yedek alınamadı: " + h.message, true); }
    });

    $("#yedek-yukle-dugme").addEventListener("click", () => $("#yedek-dosya").click());
    $("#yedek-dosya").addEventListener("change", async (e) => {
      const dosya = e.target.files[0];
      e.target.value = "";
      if (!dosya) return;
      if (!confirm("Yedekteki gruplar ve ürünler mevcut listeye eklenecek. Devam edilsin mi?")) return;
      try {
        const metin = await dosya.text();
        await window.Veri.yedekYukle(JSON.parse(metin));
        await veriTazele();
        bildir("Yedek yüklendi.");
      } catch (h) { bildir("Yedek yüklenemedi: " + h.message, true); }
    });

    // --- ürün kipi ---
    $("#urun-form").addEventListener("submit", (e) => { e.preventDefault(); urunuKaydet(false); });
    $("#u-kaydet-yeni").addEventListener("click", () => urunuKaydet(true));

    // --- grup kipi ---
    $("#grup-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const ad = $("#g-ad").value.trim();
      if (!ad) return;
      const id = $("#g-id").value;
      const eski = id ? durum.gruplar.find((g) => g.id === id) : null;
      try {
        await window.Veri.grupKaydet({
          id: id || undefined,
          slug: eski ? eski.slug : window.Veri.slug(ad),
          ad: ad,
          aciklama: $("#g-aciklama").value.trim(),
          gorsel: $("#g-gorsel").value.trim(),
          sira: eski ? eski.sira : durum.gruplar.length,
        });
        await veriTazele();
        grupKipiKapat();
        bildir(id ? "Grup güncellendi." : ad + " grubu eklendi.");
      } catch (h) { bildir("Kaydedilemedi: " + h.message, true); }
    });

    // kip kapatma: perde, çarpı, Vazgeç ve Esc
    document.querySelectorAll("[data-kapat]").forEach((d) =>
      d.addEventListener("click", () => {
        urunKipiKapat(); grupKipiKapat(); excelKipiKapat(); topluFiyatKapat(); kullaniciKipiKapat();
      })
    );
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!$("#kip-urun").hidden) urunKipiKapat();
      if (!$("#kip-grup").hidden) grupKipiKapat();
      if (!$("#kip-excel").hidden) excelKipiKapat();
      if (!$("#kip-fiyat").hidden) topluFiyatKapat();
      if (!$("#kip-kullanici").hidden) kullaniciKipiKapat();
    });

    gorselOlaylari();
  }

  /* ---------------- açılış ---------------- */

  document.addEventListener("DOMContentLoaded", async () => {
    girisKur();
    olaylariBagla();
    if (window.Veri.oturumVar()) {
      try { await paneliAc(); }
      catch (h) { bildir("Veriler yüklenemedi: " + h.message, true); }
    }
  });
})();
