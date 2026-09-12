/* =========================================================
   Ses Can Yapı — ANASAYFA
   ---------------------------------------------------------
   İki iş yapar:
     1) "Ürün Gruplarımız" kutuları — panelde tanımlı gruplardan
        üretilir. Müşteri panelden yeni grup açtığında anasayfada
        kendiliğinden görünür; burada elle liste tutulmaz.
     2) "En Çok Satanlar" şeridi — panelde yıldızlanan ürünler.
   ========================================================= */
(function () {
  "use strict";

  /* Bilinen gruplara editoryal üst etiket ve marka satırı.
     Listede olmayan gruplar için grubun kendi açıklaması kullanılır. */
  const EK = {
    "tugla":       { rozet: "Kaba Yapı",   alt: "Derya · Beşer · Efor" },
    "cimento":     { rozet: "Bağlayıcı",   alt: "Traçim · Adoçim" },
    "gazbeton":    { rozet: "Hafif Duvar", alt: "STT Türk Gazbeton" },
    "cati":        { rozet: "Çatı",        alt: "Onduline · OSB · Strafor" },
    "alci":        { rozet: "İnce İş",     alt: "Dalsan · ABS · ALL Alçı" },
    "su-yalitim":  { rozet: "Yalıtım",     alt: "Penguen Membran" },
    "mantolama":   { rozet: "Dış Cephe",   alt: "Fawori · Dalmaçyalı · Lion" },
    "boya":        { rozet: "İnce İş",     alt: "Filli Boya · Fawori" },
    "insaat":      { rozet: "Şantiye",     alt: "Demir · Kum · Çakıl · Kalıp" },
    "hirdavat":    { rozet: "Hırdavat",    alt: "El aleti · Vida · Dübel" },
    "yapi-kimya":  { rozet: "Kimyasal",    alt: "Kalekim · Yapıştırıcı · Derz" },
    "tesisat":     { rozet: "Tesisat",     alt: "PPRC · PVC · Ek parça" },
    "is-guvenlik": { rozet: "Güvenlik",    alt: "Baret · Eldiven · Gözlük" },
    "elektrik":    { rozet: "Elektrik",    alt: "Kablo · Priz · Sigorta" },
  };

  const OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function k(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function kutu(g) {
    const ek = EK[g.slug] || {};
    const alt = ek.alt || g.aciklama || "";
    const gorsel = g.gorsel
      ? '<div class="tile__img" style="background-image:url(&#39;' + k(g.gorsel) + '&#39;)"></div>'
      : '<div class="tile__img tile__img--bos"></div>';
    return (
      '<a class="tile reveal" href="katalog.html?grup=' + encodeURIComponent(g.slug) + '">' +
        gorsel +
        (ek.rozet ? '<span class="tile__badge">' + k(ek.rozet) + "</span>" : "") +
        '<div class="tile__body"><h3>' + k(g.ad) + "</h3>" +
        (alt ? "<p>" + k(alt) + "</p>" : "") +
        '<span class="tile__link">Ürünleri Gör ' + OK + "</span></div>" +
      "</a>"
    );
  }

  async function gruplariBas() {
    const kap = document.getElementById("grup-kutulari");
    if (!kap) return;
    const gruplar = await window.Veri.gruplar();
    if (!gruplar.length) return;
    // "Bize sorun" kutusu HTML'de duruyor; gruplar onun önüne eklenir.
    kap.insertAdjacentHTML("afterbegin", gruplar.map(kutu).join(""));
    // Kartlar .reveal ile geliyor (opacity:0); gözlemciye tanıtılmazsa
    // görünmez kalırlar. main.js yüklenmediyse doğrudan açıyoruz.
    if (window.Gorunur) window.Gorunur.tazele();
    else kap.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  }

  async function cokSatanlariBas() {
    const bolum = document.getElementById("cok-satan-bolum");
    if (!bolum) return;
    let liste = await window.Veri.urunler({ cokSatan: true, limit: 6 });
    // Henüz hiç yıldızlanmamışsa en son eklenenleri göster;
    // katalog boşsa bölümü hiç açma.
    if (!liste.length) liste = await window.Veri.urunler({ limit: 6 });
    if (!liste.length) return;
    window.Kart.bas(document.getElementById("cok-satan"), liste);
    bolum.hidden = false;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      await window.Veri.hazir();
      await gruplariBas();
      await cokSatanlariBas();
    } catch (e) {
      /* anasayfanın geri kalanı çalışmaya devam etsin */
    }
  });
})();
