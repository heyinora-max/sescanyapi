/* =========================================================
   Ses Can Yapı — TEKLİF SEPETİ
   ---------------------------------------------------------
   Bu bir ödeme sepeti değil: müşteri ihtiyaç listesini toplar,
   liste WhatsApp mesajına dönüşür ve teklif olarak gönderilir.
   Sepet tarayıcıda durur (localStorage) — sunucuya gitmez.
   ========================================================= */
(function () {
  "use strict";

  const ANAHTAR = "sescan_sepet";
  const A = window.AYAR || {};

  function oku() {
    try {
      const l = JSON.parse(localStorage.getItem(ANAHTAR) || "[]");
      return Array.isArray(l) ? l : [];
    } catch (e) { return []; }
  }

  function yaz(liste) {
    try { localStorage.setItem(ANAHTAR, JSON.stringify(liste)); } catch (e) { /* kota — sepet küçüktür, olası değil */ }
    rozetTazele();
    document.dispatchEvent(new CustomEvent("sepet:degisti", { detail: liste }));
  }

  const Sepet = {
    liste: oku,

    adet() {
      return oku().reduce((t, k) => t + (Number(k.adet) || 0), 0);
    },

    tutar() {
      return oku().reduce((t, k) => t + (k.fiyat ? Number(k.fiyat) * (Number(k.adet) || 0) : 0), 0);
    },

    // Fiyatı olmayan ürünler toplama giremez; müşteri "toplam yanlış" demesin diye ayrı sayıyoruz
    fiyatsizVar() {
      return oku().some((k) => !k.fiyat);
    },

    ekle(urun, adet) {
      adet = Math.max(1, Number(adet) || 1);
      const l = oku();
      const v = l.find((k) => String(k.id) === String(urun.id));
      if (v) v.adet = (Number(v.adet) || 0) + adet;
      else l.push({
        id: urun.id, ad: urun.ad, marka: urun.marka || "",
        fiyat: urun.fiyat == null ? null : Number(urun.fiyat),
        birim: urun.birim || "", gorsel: urun.gorsel || "", adet: adet,
      });
      yaz(l);
      return this.adet();
    },

    adetYaz(id, adet) {
      adet = Number(adet) || 0;
      let l = oku();
      if (adet <= 0) l = l.filter((k) => String(k.id) !== String(id));
      else {
        const v = l.find((k) => String(k.id) === String(id));
        if (v) v.adet = adet;
      }
      yaz(l);
    },

    cikar(id) { yaz(oku().filter((k) => String(k.id) !== String(id))); },

    bosalt() { yaz([]); },

    /* Sepeti okunabilir bir teklif metnine çevirir.
       WhatsApp tek satır kabul ettiği için satır sonlarını kendimiz koyuyoruz. */
    teklifMetni(musteri) {
      const l = oku();
      if (!l.length) return "";
      const para = (n) => new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
      const pb = A.paraBirimi || "TL";

      const satirlar = l.map((k, i) => {
        const bas = (i + 1) + ") " + k.ad + (k.marka ? " (" + k.marka + ")" : "");
        const mik = "   Miktar: " + k.adet + (k.birim ? " " + k.birim : " adet");
        if (!k.fiyat) return bas + "\n" + mik + "\n   Fiyat: teklif bekleniyor";
        return bas + "\n" + mik + "\n   Birim: " + para(k.fiyat) + " " + pb +
               "   Tutar: " + para(k.fiyat * k.adet) + " " + pb;
      });

      let metin = "Merhaba, aşağıdaki ürünler için teklif rica ediyorum:\n\n" + satirlar.join("\n\n");

      const tutar = this.tutar();
      if (tutar > 0) {
        metin += "\n\n----------------------\nAra toplam: " + para(tutar) + " " + pb;
        if (this.fiyatsizVar()) metin += "\n(Fiyatı belirtilmemiş kalemler toplama dahil değildir.)";
        metin += "\nKDV hariçtir.";
      }
      if (musteri && (musteri.ad || musteri.telefon || musteri.not)) {
        metin += "\n----------------------";
        if (musteri.ad) metin += "\nAd Soyad / Firma: " + musteri.ad;
        if (musteri.telefon) metin += "\nTelefon: " + musteri.telefon;
        if (musteri.not) metin += "\nNot: " + musteri.not;
      }
      return metin;
    },

    whatsappBaglantisi(musteri) {
      const no = A.whatsapp || "905493601161";
      return "https://wa.me/" + no + "?text=" + encodeURIComponent(this.teklifMetni(musteri));
    },
  };

  /* Başlıktaki sepet rozeti — her sayfada bulunur, sayı 0 ise gizlenir */
  function rozetTazele() {
    const n = Sepet.adet();
    document.querySelectorAll("[data-sepet-rozet]").forEach((el) => {
      el.textContent = n;
      el.hidden = n === 0;
    });
  }

  document.addEventListener("DOMContentLoaded", rozetTazele);
  // Başka sekmede sepet değişirse bu sekme de güncellensin
  window.addEventListener("storage", (e) => { if (e.key === ANAHTAR) rozetTazele(); });

  window.Sepet = Sepet;
})();
