/* =========================================================
   Ses Can Yapı — ÜRÜN DETAY SAYFASI  (urun.html?id=...)
   ========================================================= */
(function () {
  "use strict";

  const A = window.AYAR || {};
  const $ = (s) => document.querySelector(s);

  function stokEtiketi(u) {
    const s = (window.Kart.STOK[u.stok] || window.Kart.STOK.stokta);
    const sinif = { var: "stok-var", siparis: "stok-siparis", yok: "stok-yok" }[s.sinif];
    return '<span class="' + sinif + '">' + s.yazi + "</span>";
  }

  function fiyatKutusu(u, k) {
    if (u.fiyat == null || u.fiyat === "") {
      return '<div class="udetay__fiyat">' +
               '<div class="yok">Fiyat için teklif alın</div>' +
               "<p>Bu ürünün fiyatı miktara ve teslimat şekline göre belirleniyor. Sepete ekleyip teklif isteyin ya da doğrudan arayın.</p>" +
             "</div>";
    }
    return '<div class="udetay__fiyat">' +
             '<div class="tutar"><b>' + window.Veri.paraYaz(u.fiyat) + " " + k(A.paraBirimi || "TL") + "</b>" +
               (A.kdvNotu ? '<span class="kdv">' + k(A.kdvNotu) + "</span>" : "") +
               (u.birim ? '<span class="birim">/ ' + k(u.birim) + "</span>" : "") +
             "</div>" +
             "<p>Fiyatlar KDV hariçtir ve teklif niteliğindedir. Toplu alımlarda ayrıca fiyat çalışılır.</p>" +
           "</div>";
  }

  function ciz(u) {
    const k = window.Kart.kacis;
    const gorsel = u.gorsel
      ? '<img src="' + k(u.gorsel) + '" alt="' + k(u.ad) + '" loading="eager">'
      : '<div class="bos">' + k((u.ad || "?").trim().charAt(0).toLocaleUpperCase("tr")) + "</div>";

    $("#icerik").innerHTML =
      '<div class="udetay">' +
        '<div class="udetay__gorsel">' + gorsel +
          (u.cokSatan ? '<span class="ukart__rozet">Çok Satan</span>' : "") +
        "</div>" +
        "<div>" +
          (u.marka ? '<div class="udetay__marka">' + k(u.marka) + "</div>" : "") +
          "<h1>" + k(u.ad) + "</h1>" +
          '<div class="udetay__meta">' +
            (u.grupAd ? "<span>" + k(u.grupAd) + "</span>" : "") +
            (u.birim ? "<span>Birim: " + k(u.birim) + "</span>" : "") +
            stokEtiketi(u) +
          "</div>" +
          fiyatKutusu(u, k) +
          '<div class="udetay__sepet">' +
            '<div class="adetci">' +
              '<button type="button" data-adet="-1" aria-label="Azalt"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14"/></svg></button>' +
              '<input type="number" id="adet" value="1" min="1" step="1" aria-label="Miktar">' +
              '<button type="button" data-adet="1" aria-label="Artır"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg></button>' +
            "</div>" +
            '<button class="btn btn-primary btn-lg" type="button" id="sepete">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6L5 3H2"/><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/></svg>' +
              "Teklif Sepetine Ekle" +
            "</button>" +
            '<a class="btn btn-outline btn-lg" href="tel:+905493601161">Hemen Ara</a>' +
          "</div>" +
          '<div class="udetay__aciklama">' +
            "<h2>Ürün Açıklaması</h2>" +
            (u.aciklama
              ? "<p>" + k(u.aciklama) + "</p>"
              : '<p class="yok">Bu ürün için henüz açıklama girilmemiş. Detay için bizi arayabilirsiniz.</p>') +
          "</div>" +
        "</div>" +
      "</div>";

    document.title = u.ad + " — Ses Can Yapı";
    $("#crumb-ad").textContent = u.ad;
    const cg = $("#crumb-grup");
    if (u.grupAd) {
      cg.textContent = u.grupAd;
      cg.href = "katalog.html?grup=" + encodeURIComponent(u.grupSlug || "");
    } else {
      cg.textContent = "Ürün";
    }

    // miktar kutusu
    const adet = $("#adet");
    document.querySelectorAll("[data-adet]").forEach((b) =>
      b.addEventListener("click", () => {
        const yeni = (parseInt(adet.value, 10) || 1) + parseInt(b.getAttribute("data-adet"), 10);
        adet.value = Math.max(1, yeni);
      })
    );
    adet.addEventListener("change", () => { adet.value = Math.max(1, parseInt(adet.value, 10) || 1); });

    $("#sepete").addEventListener("click", () => {
      window.Sepet.ekle(u, parseInt(adet.value, 10) || 1);
      window.Kart.bildir(u.ad + " teklif sepetine eklendi.");
    });

    yapisalVeri(u);
  }

  /* Google'ın ürünü fiyat, stok ve marka bilgisiyle tanıması için
     yapısal veri. Ürünler panelden girildiği için sayfa açılırken
     yazılıyor; sabit HTML'e gömmek mümkün değil. */
  function yapisalVeri(u) {
    const kok = location.origin + location.pathname.replace(/urun\.html$/, "");
    const veri = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: u.ad,
      url: location.href,
      description: u.aciklama || (u.ad + " — Ses Can Yapı Malzemeleri"),
      sku: String(u.id),
    };
    if (u.marka) veri.brand = { "@type": "Brand", name: u.marka };
    if (u.gorsel && !/^data:/.test(u.gorsel)) {
      veri.image = /^https?:/.test(u.gorsel) ? u.gorsel : kok + u.gorsel;
    }
    if (u.grupAd) veri.category = u.grupAd;
    if (u.fiyat != null && u.fiyat !== "") {
      veri.offers = {
        "@type": "Offer",
        price: String(u.fiyat),
        priceCurrency: "TRY",
        availability: u.stok === "tukendi"
          ? "https://schema.org/OutOfStock"
          : u.stok === "siparis"
            ? "https://schema.org/BackOrder"
            : "https://schema.org/InStock",
        url: location.href,
        seller: { "@type": "Organization", name: "Ses Can Yapı Malzemeleri" },
      };
    }

    const yol = [
      { "@type": "ListItem", position: 1, name: "Anasayfa", item: kok + "index.html" },
      { "@type": "ListItem", position: 2, name: "Katalog", item: kok + "katalog.html" },
    ];
    if (u.grupAd) {
      yol.push({ "@type": "ListItem", position: 3, name: u.grupAd,
                 item: kok + "katalog.html?grup=" + encodeURIComponent(u.grupSlug || "") });
    }
    yol.push({ "@type": "ListItem", position: yol.length + 1, name: u.ad, item: location.href });

    const etiket = document.createElement("script");
    etiket.type = "application/ld+json";
    etiket.textContent = JSON.stringify([
      veri,
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: yol },
    ]);
    document.head.appendChild(etiket);

    // Paylaşım ve arama sonucu için sayfa üst bilgileri
    const ac = u.aciklama
      ? u.aciklama.replace(/\s+/g, " ").slice(0, 155)
      : u.ad + (u.marka ? " — " + u.marka : "") + ". Ses Can Yapı Malzemeleri, Çerkezköy.";
    ustBilgi("name", "description", ac);
    ustBilgi("property", "og:title", u.ad + " — Ses Can Yapı");
    ustBilgi("property", "og:description", ac);
    ustBilgi("property", "og:url", location.href);
    if (veri.image) ustBilgi("property", "og:image", veri.image);
  }

  function ustBilgi(ozellik, ad, deger) {
    let et = document.head.querySelector("meta[" + ozellik + '="' + ad + '"]');
    if (!et) {
      et = document.createElement("meta");
      et.setAttribute(ozellik, ad);
      document.head.appendChild(et);
    }
    et.setAttribute("content", deger);
  }

  async function benzerleriCiz(u) {
    if (!u.grupId) return;
    const liste = (await window.Veri.urunler({ grup: u.grupSlug || u.grupId }))
      .filter((x) => String(x.id) !== String(u.id))
      .slice(0, 3);
    if (!liste.length) return;
    window.Kart.bas(document.getElementById("benzer"), liste);
    document.getElementById("benzer-bolum").hidden = false;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const id = new URLSearchParams(location.search).get("id");
    const k = window.Kart.kacis;
    try {
      await window.Veri.hazir();
      const u = id ? await window.Veri.urun(id) : null;
      if (!u) {
        $("#icerik").innerHTML =
          '<div class="bos-kutu">' +
            '<p style="font:800 22px/1.3 var(--font-head);color:var(--ink);margin-bottom:10px">Ürün bulunamadı</p>' +
            "<p style=\"margin-bottom:22px\">Bu ürün kaldırılmış ya da bağlantı hatalı olabilir.</p>" +
            '<a class="btn btn-primary btn-lg" href="katalog.html">Kataloğa dön</a>' +
          "</div>";
        return;
      }
      ciz(u);
      benzerleriCiz(u);
    } catch (hata) {
      $("#icerik").innerHTML = '<div class="bos-kutu">Ürün yüklenemedi: ' + k(hata.message) + "</div>";
    }
  });
})();
