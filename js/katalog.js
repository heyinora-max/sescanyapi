/* =========================================================
   Ses Can Yapı — KATALOG SAYFASI
   ---------------------------------------------------------
   Filtreler adres çubuğuna yazılır (?grup=...&marka=...&ara=...)
   böylece bir filtre bağlantısı WhatsApp ile paylaşılabilir ve
   geri tuşu beklendiği gibi çalışır.
   ========================================================= */
(function () {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const kacis = () => window.Kart.kacis;

  const el = {
    gruplar:   $("#gruplar"),
    markalar:  $("#markalar"),
    liste:     $("#liste"),
    sayac:     $("#sayac"),
    etiketler: $("#etiketler"),
    ara:       $("#ara"),
    sirala:    $("#sirala"),
    baslik:    $("#baslik"),
    aciklama:  $("#aciklama"),
    crumb:     $("#crumb-grup"),
    yan:       $("#yan"),
    filtreAc:  $("#filtre-ac"),
    markaTemizle: $("#marka-temizle"),
    footerGruplar: $("#footer-gruplar"),
  };

  const durum = { grup: "", markalar: new Set(), arama: "", sirala: "yeni", gosterilen: 24 };

  /* ---------- adres çubuğu ---------- */

  function adrestenOku() {
    const p = new URLSearchParams(location.search);
    durum.grup = p.get("grup") || "";
    durum.arama = p.get("ara") || "";
    durum.sirala = p.get("sirala") || "yeni";
    durum.markalar = new Set((p.get("marka") || "").split(",").map((s) => s.trim()).filter(Boolean));
    if (el.ara) el.ara.value = durum.arama;
    if (el.sirala) el.sirala.value = durum.sirala;
  }

  function adreseYaz() {
    const p = new URLSearchParams();
    if (durum.grup) p.set("grup", durum.grup);
    if (durum.markalar.size) p.set("marka", [...durum.markalar].join(","));
    if (durum.arama) p.set("ara", durum.arama);
    if (durum.sirala && durum.sirala !== "yeni") p.set("sirala", durum.sirala);
    const q = p.toString();
    history.replaceState(null, "", q ? "?" + q : location.pathname);
  }

  /* ---------- sol sütun ---------- */

  async function grupListesiCiz() {
    const gruplar = await window.Veri.grupSayilari();
    const k = kacis();
    const toplam = gruplar.reduce((t, g) => t + g.adet, 0);

    let html =
      '<a href="katalog.html" data-grup="" class="' + (durum.grup ? "" : "secili") + '">' +
        "<span>Tüm Ürünler</span><span class=\"adet\">" + toplam + "</span>" +
      "</a>";

    html += gruplar.map((g) =>
      '<a href="katalog.html?grup=' + encodeURIComponent(g.slug) + '" data-grup="' + k(g.slug) + '" class="' +
        (durum.grup === g.slug ? "secili" : "") + '">' +
        "<span>" + k(g.ad) + "</span><span class=\"adet\">" + g.adet + "</span>" +
      "</a>"
    ).join("");

    el.gruplar.innerHTML = html;

    // Alt bilgideki katalog sütunu da aynı listeden beslensin
    if (el.footerGruplar) {
      el.footerGruplar.innerHTML =
        '<li><a href="katalog.html">Tüm Ürünler</a></li>' +
        gruplar.slice(0, 6).map((g) =>
          '<li><a href="katalog.html?grup=' + encodeURIComponent(g.slug) + '">' + k(g.ad) + "</a></li>"
        ).join("");
    }
  }

  async function markaListesiCiz() {
    const markalar = await window.Veri.markalar(durum.grup || null);
    const k = kacis();

    if (!markalar.length) {
      el.markalar.innerHTML = '<div class="bos">Bu grupta henüz marka bilgisi girilmemiş.</div>';
    } else {
      el.markalar.innerHTML = markalar.map((m) =>
        "<label><input type=\"checkbox\" value=\"" + k(m.ad) + "\"" +
        (durum.markalar.has(m.ad) ? " checked" : "") + ">" +
        "<span>" + k(m.ad) + "</span><span class=\"adet\">" + m.adet + "</span></label>"
      ).join("");
    }
    el.markaTemizle.hidden = durum.markalar.size === 0;
  }

  /* ---------- başlık ---------- */

  async function basligiYaz() {
    const g = durum.grup ? await window.Veri.grup(durum.grup) : null;
    if (g) {
      document.title = g.ad + " — Ses Can Yapı Katalog";
      el.baslik.textContent = g.ad;
      el.crumb.textContent = g.ad;
      el.aciklama.textContent = g.aciklama || "Bu gruptaki ürünleri inceleyin, teklif sepetinize ekleyin.";
    } else {
      document.title = "Katalog — Ses Can Yapı | Ürün Grupları, Markalar ve Fiyatlar";
      el.baslik.textContent = "Ürün Kataloğu";
      el.crumb.textContent = "Katalog";
      el.aciklama.textContent = "Grubu seçin, markaya göre daraltın; ihtiyaç listenizi oluşturup tek seferde teklif isteyin.";
    }
  }

  /* ---------- seçili filtre etiketleri ---------- */

  async function etiketleriCiz() {
    const k = kacis();
    const parcalar = [];

    if (durum.grup) {
      const g = await window.Veri.grup(durum.grup);
      if (g) parcalar.push({ tur: "grup", deger: "", yazi: g.ad });
    }
    durum.markalar.forEach((m) => parcalar.push({ tur: "marka", deger: m, yazi: m }));
    if (durum.arama) parcalar.push({ tur: "arama", deger: "", yazi: '"' + durum.arama + '"' });

    el.etiketler.innerHTML = parcalar.map((p) =>
      '<span class="etiket">' + k(p.yazi) +
        '<button type="button" data-kaldir="' + p.tur + '" data-deger="' + k(p.deger) + '" aria-label="Filtreyi kaldır">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
        "</button>" +
      "</span>"
    ).join("");
  }

  /* ---------- ürün listesi ---------- */

  /* Katalog büyüdükçe tek seferde yüzlerce kart basmak sayfayı
     yavaşlatıyor; sayfa başına bu kadar kart basılıp gerisi
     "Daha fazla göster" ile açılıyor. */
  const SAYFA_ADEDI = 24;
  let tumListe = [];

  function dahaFazlaCiz() {
    const kap = document.getElementById("daha-fazla-kap");
    if (!kap) return;
    const kalan = tumListe.length - durum.gosterilen;
    if (kalan <= 0) { kap.hidden = true; kap.innerHTML = ""; return; }
    kap.hidden = false;
    kap.innerHTML =
      '<button class="btn btn-outline btn-lg" type="button" id="daha-fazla">' +
        "Daha fazla göster (" + kalan + " ürün)" +
      "</button>";
    document.getElementById("daha-fazla").addEventListener("click", () => {
      durum.gosterilen += SAYFA_ADEDI;
      kartlariBas();
    });
  }

  function kartlariBas() {
    let bos = "Bu seçime uygun ürün bulunamadı.";
    if (!durum.grup && !durum.arama && !durum.markalar.size) {
      bos = "Katalog henüz boş. Ürünler panelden eklendikçe burada görünecek.";
    }
    window.Kart.bas(el.liste, tumListe.slice(0, durum.gosterilen), bos);
    dahaFazlaCiz();

    el.sayac.textContent = !tumListe.length
      ? ""
      : durum.gosterilen >= tumListe.length
        ? tumListe.length + " ürün listeleniyor"
        : Math.min(durum.gosterilen, tumListe.length) + " / " + tumListe.length + " ürün gösteriliyor";
  }

  async function listeyiCiz() {
    let liste = await window.Veri.urunler({
      grup: durum.grup || null,
      arama: durum.arama || null,
      sirala: durum.sirala,
    });

    // Marka kutularında birden fazla seçim olabildiği için burada süzüyoruz
    if (durum.markalar.size) {
      const secili = new Set([...durum.markalar].map((m) => window.Veri.normalize(m)));
      liste = liste.filter((u) => secili.has(window.Veri.normalize(u.marka)));
    }

    tumListe = liste;
    durum.gosterilen = SAYFA_ADEDI;   // filtre her değiştiğinde baştan
    kartlariBas();
  }

  async function tazele(adresiGuncelle) {
    if (adresiGuncelle !== false) adreseYaz();
    await Promise.all([basligiYaz(), grupListesiCiz(), markaListesiCiz(), etiketleriCiz()]);
    await listeyiCiz();
  }

  /* ---------- olaylar ---------- */

  function olaylariBagla() {
    // grup bağlantıları — sayfa yenilenmeden filtre değiştir
    el.gruplar.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-grup]");
      if (!a) return;
      e.preventDefault();
      durum.grup = a.getAttribute("data-grup");
      durum.markalar.clear();          // grup değişince eski marka seçimi anlamsız
      tazele();
      window.scrollTo({ top: document.querySelector(".katalog").offsetTop - 120, behavior: "smooth" });
    });

    el.markalar.addEventListener("change", (e) => {
      const kutu = e.target.closest("input[type=checkbox]");
      if (!kutu) return;
      if (kutu.checked) durum.markalar.add(kutu.value);
      else durum.markalar.delete(kutu.value);
      el.markaTemizle.hidden = durum.markalar.size === 0;
      adreseYaz(); etiketleriCiz(); listeyiCiz();
    });

    el.markaTemizle.addEventListener("click", () => {
      durum.markalar.clear();
      tazele();
    });

    el.etiketler.addEventListener("click", (e) => {
      const b = e.target.closest("[data-kaldir]");
      if (!b) return;
      const tur = b.getAttribute("data-kaldir");
      if (tur === "grup") durum.grup = "";
      else if (tur === "arama") { durum.arama = ""; el.ara.value = ""; }
      else durum.markalar.delete(b.getAttribute("data-deger"));
      tazele();
    });

    // arama — her tuşta değil, yazma durunca çalışsın
    let bekle;
    el.ara.addEventListener("input", () => {
      clearTimeout(bekle);
      bekle = setTimeout(() => {
        durum.arama = el.ara.value.trim();
        adreseYaz(); etiketleriCiz(); listeyiCiz();
      }, 250);
    });
    el.ara.addEventListener("search", () => {   // temizleme (x) düğmesi
      durum.arama = el.ara.value.trim();
      adreseYaz(); etiketleriCiz(); listeyiCiz();
    });

    el.sirala.addEventListener("change", () => {
      durum.sirala = el.sirala.value;
      adreseYaz(); listeyiCiz();
    });

    // dar ekranda filtre sütununu aç/kapat
    el.filtreAc.addEventListener("click", () => {
      el.yan.classList.toggle("kapali");
      if (!el.yan.classList.contains("kapali")) el.yan.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // geri/ileri tuşları
    window.addEventListener("popstate", () => { adrestenOku(); tazele(false); });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    adrestenOku();
    olaylariBagla();
    try {
      await window.Veri.hazir();
      await tazele(false);
    } catch (hata) {
      el.liste.innerHTML = '<div class="bos-kutu">Katalog yüklenemedi: ' + kacis()(hata.message) + "</div>";
    }
  });
})();
