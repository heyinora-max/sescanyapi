/* =========================================================
   Ses Can Yapı — TEKLİF SEPETİ SAYFASI
   ========================================================= */
(function () {
  "use strict";

  const A = window.AYAR || {};
  const $ = (s) => document.querySelector(s);
  const pb = A.paraBirimi || "TL";

  // Müşteri bilgileri sayfa yenilense de kaybolmasın
  const BILGI = "sescan_teklif_bilgi";

  function bilgiOku() {
    try { return JSON.parse(localStorage.getItem(BILGI) || "{}"); } catch (e) { return {}; }
  }
  function bilgiYaz(b) {
    try { localStorage.setItem(BILGI, JSON.stringify(b)); } catch (e) {}
  }
  function bilgiAl() {
    return {
      ad: $("#m-ad").value.trim(),
      telefon: $("#m-tel").value.trim(),
      not: $("#m-not").value.trim(),
    };
  }

  function kalemHtml(kalem) {
    const k = window.Kart.kacis;
    const gorsel = kalem.gorsel
      ? '<div class="skalem__g" ' + window.Kart.arkaPlan(kalem.gorsel) + "></div>"
      : '<div class="skalem__g bos">' + k((kalem.ad || "?").trim().charAt(0).toLocaleUpperCase("tr")) + "</div>";

    const birimYazi = kalem.fiyat != null
      ? window.Veri.paraYaz(kalem.fiyat) + " " + k(pb) + (kalem.birim ? " / " + k(kalem.birim) : "")
      : "Fiyat için teklif bekleniyor";

    const tutar = kalem.fiyat != null
      ? window.Veri.paraYaz(kalem.fiyat * kalem.adet) + " " + k(pb)
      : "—";

    return (
      '<div class="skalem" data-id="' + k(kalem.id) + '">' +
        '<a href="urun.html?id=' + encodeURIComponent(kalem.id) + '">' + gorsel + "</a>" +
        "<div>" +
          (kalem.marka ? '<div class="skalem__marka">' + k(kalem.marka) + "</div>" : "") +
          '<div class="skalem__ad"><a href="urun.html?id=' + encodeURIComponent(kalem.id) + '">' + k(kalem.ad) + "</a></div>" +
          '<div class="skalem__fiyat">' + birimYazi + "</div>" +
        "</div>" +
        '<div class="skalem__sag">' +
          '<div class="adetci">' +
            '<button type="button" data-adim="-1" aria-label="Azalt"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14"/></svg></button>' +
            '<input type="number" value="' + kalem.adet + '" min="1" step="1" aria-label="Miktar">' +
            '<button type="button" data-adim="1" aria-label="Artır"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg></button>' +
          "</div>" +
          '<div class="skalem__tutar">' + tutar + "</div>" +
          '<button class="skalem__sil" type="button" data-sil aria-label="Kaldır">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>' +
          "</button>" +
        "</div>" +
      "</div>"
    );
  }

  function ciz() {
    const liste = window.Sepet.liste();
    const dolu = liste.length > 0;
    $("#sepet-alan").hidden = !dolu;
    $("#sepet-bos").hidden = dolu;
    if (!dolu) return;

    $("#kalemler").innerHTML = liste.map(kalemHtml).join("");

    const tutar = window.Sepet.tutar();
    $("#ozet-kalem").textContent = liste.length;
    $("#ozet-adet").textContent = window.Sepet.adet();
    $("#ozet-tutar").textContent = window.Veri.paraYaz(tutar) + " " + pb;

    $("#ozet-not").textContent = window.Sepet.fiyatsizVar()
      ? "Fiyatı girilmemiş kalemler ara toplama dahil değildir. Fiyatlar KDV hariçtir ve teklif niteliğindedir."
      : "Fiyatlar KDV hariçtir ve teklif niteliğindedir. Son fiyat, miktar ve teslimat şekline göre netleşir.";

    baglantiTazele();
  }

  function baglantiTazele() {
    $("#wa-gonder").href = window.Sepet.whatsappBaglantisi(bilgiAl());
  }

  document.addEventListener("DOMContentLoaded", () => {
    const b = bilgiOku();
    $("#m-ad").value = b.ad || "";
    $("#m-tel").value = b.telefon || "";
    $("#m-not").value = b.not || "";

    ciz();

    // kalem listesi — tıklama ve miktar değişimleri
    $("#kalemler").addEventListener("click", (e) => {
      const satir = e.target.closest(".skalem");
      if (!satir) return;
      const id = satir.getAttribute("data-id");

      if (e.target.closest("[data-sil]")) { window.Sepet.cikar(id); ciz(); return; }

      const adim = e.target.closest("[data-adim]");
      if (adim) {
        const kutu = satir.querySelector("input");
        const yeni = Math.max(1, (parseInt(kutu.value, 10) || 1) + parseInt(adim.getAttribute("data-adim"), 10));
        window.Sepet.adetYaz(id, yeni);
        ciz();
      }
    });

    $("#kalemler").addEventListener("change", (e) => {
      const kutu = e.target.closest("input[type=number]");
      if (!kutu) return;
      const satir = kutu.closest(".skalem");
      window.Sepet.adetYaz(satir.getAttribute("data-id"), Math.max(1, parseInt(kutu.value, 10) || 1));
      ciz();
    });

    $("#bosalt").addEventListener("click", () => {
      if (!confirm("Teklif sepetindeki tüm kalemler silinsin mi?")) return;
      window.Sepet.bosalt();
      ciz();
    });

    // müşteri bilgileri — yazdıkça sakla ve WhatsApp bağlantısını tazele
    ["#m-ad", "#m-tel", "#m-not"].forEach((s) =>
      $(s).addEventListener("input", () => { bilgiYaz(bilgiAl()); baglantiTazele(); })
    );

    $("#kopyala").addEventListener("click", async () => {
      const metin = window.Sepet.teklifMetni(bilgiAl());
      if (!metin) return;
      try {
        await navigator.clipboard.writeText(metin);
        window.Kart.bildir("Liste panoya kopyalandı.");
      } catch (e) {
        // Clipboard izni yoksa (http üzerinden açıldıysa) eski yöntem
        const alan = document.createElement("textarea");
        alan.value = metin;
        alan.style.position = "fixed";
        alan.style.opacity = "0";
        document.body.appendChild(alan);
        alan.select();
        try { document.execCommand("copy"); window.Kart.bildir("Liste panoya kopyalandı."); }
        catch (e2) { alert(metin); }
        alan.remove();
      }
    });

    // Başka sekmede sepet değişirse burası da tazelensin
    document.addEventListener("sepet:degisti", ciz);
    window.addEventListener("storage", (e) => { if (e.key === "sescan_sepet") ciz(); });
  });
})();
