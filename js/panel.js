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

  /* ---------------- giriş ---------------- */

  function girisKur() {
    const canli = window.Veri.CANLI;
    $("#alan-eposta").hidden = !canli;
    $("#g-eposta").required = canli;
    $("#giris-alt-yazi").textContent = canli
      ? "Ürün ve fiyat girişi için e-posta ve şifrenizle giriş yapın."
      : "Ürün ve fiyat girişi için şifrenizi girin.";

    $("#giris-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const hata = $("#giris-hata");
      const dugme = $("#giris-dugme");
      hata.hidden = true;
      dugme.disabled = true;
      dugme.textContent = "Giriş yapılıyor...";
      try {
        await window.Veri.girisYap($("#g-eposta").value.trim(), $("#g-sifre").value);
        $("#g-sifre").value = "";
        await paneliAc();
      } catch (h) {
        hata.textContent = h.message || "Giriş yapılamadı.";
        hata.hidden = false;
      } finally {
        dugme.disabled = false;
        dugme.textContent = "Giriş Yap";
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

  function grupBlogu(g) {
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
              "<h3>" + kacis(g.ad) + " Ürünleri</h3>" +
              "<span>" + toplam + " ürün" + (durum.arama && urunler.length !== toplam ? " · aramada " + urunler.length : "") + "</span>" +
            "</span>" +
          "</button>" +
          '<div class="grup__islem">' +
            '<button class="d d--ana d--kucuk" type="button" data-urun-ekle="' + kacis(g.id) + '">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>' +
              "Ürün Ekle" +
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
    kap.innerHTML = liste.map(grupBlogu).join("");
  }

  /* Tek bir grubu yeniden çizer — tüm listeyi tazelemek yerine, açık
     grupların kaydırma konumu ve odak bozulmasın diye. */
  function grubuTazele(grupId) {
    const eski = document.querySelector('.grup[data-grup="' + CSS.escape(grupId) + '"]');
    const g = durum.gruplar.find((x) => x.id === grupId);
    if (!eski || !g) { gruplariCiz(); return; }
    eski.outerHTML = grupBlogu(g);
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
      d.addEventListener("click", () => { urunKipiKapat(); grupKipiKapat(); })
    );
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!$("#kip-urun").hidden) urunKipiKapat();
      if (!$("#kip-grup").hidden) grupKipiKapat();
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
