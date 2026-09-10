/* =========================================================
   Ses Can Yapı — ORTAK ÜRÜN KARTI
   ---------------------------------------------------------
   Katalog, ürün detayı (benzer ürünler) ve anasayfadaki
   "En Çok Satanlar" şeridi aynı kartı kullanır ki bir yerde
   yapılan görsel düzeltme her yerde geçerli olsun.
   ========================================================= */
(function () {
  "use strict";

  const A = window.AYAR || {};

  function kacisliMetin(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* Arka plan görselini HTML özniteliğine güvenle yazar.
     Öznitelik çift tırnakla sarılı olduğu için url() içinde çift tırnak
     kullanılamaz — CSS tarafında tek tırnak, HTML tarafında &#39; gerekir. */
  function arkaPlan(yol) {
    const css = String(yol || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    return 'style="background-image:url(&#39;' + kacisliMetin(css) + '&#39;)"';
  }

  const STOK = {
    stokta:   { yazi: "Stokta",        sinif: "var" },
    siparis:  { yazi: "Siparişe bağlı", sinif: "siparis" },
    tukendi:  { yazi: "Tükendi",       sinif: "yok" },
  };

  function fiyatBlogu(u) {
    if (u.fiyat == null || u.fiyat === "") {
      return '<div class="ukart__fiyat ukart__fiyat--yok">Fiyat için teklif alın</div>';
    }
    const para = window.Veri ? window.Veri.paraYaz(u.fiyat) : u.fiyat;
    return '<div class="ukart__fiyat">' +
             '<b>' + para + " " + kacisliMetin(A.paraBirimi || "TL") + "</b>" +
             (A.kdvNotu ? '<span class="kdv">' + kacisliMetin(A.kdvNotu) + "</span>" : "") +
             (u.birim ? '<span class="birim">/ ' + kacisliMetin(u.birim) + "</span>" : "") +
           "</div>";
  }

  /* Görsel yoksa boş kutu yerine grup baş harfi — katalog delik deşik görünmesin */
  function gorselBlogu(u) {
    if (u.gorsel) {
      return '<div class="ukart__gorsel" ' + arkaPlan(u.gorsel) + "></div>";
    }
    const harf = kacisliMetin((u.ad || "?").trim().charAt(0).toLocaleUpperCase("tr"));
    return '<div class="ukart__gorsel ukart__gorsel--bos"><span>' + harf + "</span></div>";
  }

  function kartHtml(u) {
    const stok = STOK[u.stok] || STOK.stokta;
    const bag = "urun.html?id=" + encodeURIComponent(u.id);
    return (
      '<article class="ukart" data-id="' + kacisliMetin(u.id) + '">' +
        '<a class="ukart__ust" href="' + bag + '">' +
          gorselBlogu(u) +
          (u.cokSatan ? '<span class="ukart__rozet">Çok Satan</span>' : "") +
          '<span class="ukart__stok ' + stok.sinif + '">' + stok.yazi + "</span>" +
        "</a>" +
        '<div class="ukart__govde">' +
          (u.marka ? '<span class="ukart__marka">' + kacisliMetin(u.marka) + "</span>" : '<span class="ukart__marka">&nbsp;</span>') +
          '<h3><a href="' + bag + '">' + kacisliMetin(u.ad) + "</a></h3>" +
          fiyatBlogu(u) +
          '<div class="ukart__islem">' +
            '<button class="btn btn-primary ukart__ekle" type="button" data-ekle="' + kacisliMetin(u.id) + '">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6L5 3H2"/><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/></svg>' +
              "Teklife Ekle" +
            "</button>" +
            '<a class="btn btn-outline ukart__detay" href="' + bag + '">İncele</a>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  /* Bir listeyi kaba basar ve "Teklife Ekle" düğmelerini bağlar */
  function bas(kap, urunler, bosMesaj) {
    if (!kap) return;
    if (!urunler || !urunler.length) {
      kap.innerHTML = '<div class="bos-kutu">' + kacisliMetin(bosMesaj || "Bu seçime uygun ürün bulunamadı.") + "</div>";
      return;
    }
    kap.innerHTML = urunler.map(kartHtml).join("");
  }

  /* Tıklama olayını tek yerde dinliyoruz (delegasyon) — kartlar
     yeniden çizildiğinde olay bağlamayı unutma riski kalmıyor. */
  document.addEventListener("click", async (e) => {
    const dugme = e.target.closest("[data-ekle]");
    if (!dugme) return;
    e.preventDefault();
    const u = await window.Veri.urun(dugme.getAttribute("data-ekle"));
    if (!u) return;
    window.Sepet.ekle(u, 1);
    window.Kart.bildir(u.ad + " teklif sepetine eklendi.");
    dugme.classList.add("eklendi");
    setTimeout(() => dugme.classList.remove("eklendi"), 900);
  });

  /* Kısa bilgi balonu — sepete eklendi gibi geri bildirimler için */
  let zamanlayici = null;
  function bildir(mesaj) {
    let el = document.getElementById("bildirim");
    if (!el) {
      el = document.createElement("div");
      el.id = "bildirim";
      el.className = "bildirim";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg><span>' +
      kacisliMetin(mesaj) + '</span><a href="sepet.html">Sepete git</a>';
    el.classList.add("gorun");
    clearTimeout(zamanlayici);
    zamanlayici = setTimeout(() => el.classList.remove("gorun"), 3200);
  }

  /* Alt bilgideki "Katalog" sütunu — grup listesi panelden değişebildiği
     için sabit yazmak yerine her sayfada veriden dolduruyoruz. */
  document.addEventListener("DOMContentLoaded", async () => {
    const kap = document.getElementById("footer-gruplar");
    if (!kap || !window.Veri) return;
    try {
      const gruplar = await window.Veri.gruplar();
      kap.innerHTML =
        '<li><a href="katalog.html">Tüm Ürünler</a></li>' +
        gruplar.slice(0, 6).map((g) =>
          '<li><a href="katalog.html?grup=' + encodeURIComponent(g.slug) + '">' + kacisliMetin(g.ad) + "</a></li>"
        ).join("");
    } catch (e) { /* alt bilgi kritik değil, sessiz geç */ }
  });

  window.Kart = { html: kartHtml, bas: bas, bildir: bildir, kacis: kacisliMetin, arkaPlan: arkaPlan, STOK: STOK };
})();
