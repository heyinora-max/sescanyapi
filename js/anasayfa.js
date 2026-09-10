/* =========================================================
   Ses Can Yapı — ANASAYFA: En Çok Satanlar şeridi
   ---------------------------------------------------------
   Panelde yıldızlanan ürünler burada görünür. Hiç yıldızlı ürün
   yoksa bölüm kendini gizler — anasayfada boş kutu kalmasın.
   ========================================================= */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async () => {
    const bolum = document.getElementById("cok-satan-bolum");
    if (!bolum) return;
    try {
      await window.Veri.hazir();
      let liste = await window.Veri.urunler({ cokSatan: true, limit: 6 });

      // Henüz hiç yıldızlanmamışsa en son eklenenleri göster;
      // katalog boşsa bölümü hiç açma.
      if (!liste.length) liste = await window.Veri.urunler({ limit: 6 });
      if (!liste.length) return;

      window.Kart.bas(document.getElementById("cok-satan"), liste);
      bolum.hidden = false;
    } catch (e) {
      /* anasayfanın geri kalanı çalışmaya devam etsin */
    }
  });
})();
