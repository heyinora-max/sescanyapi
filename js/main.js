/* Ses Can Yapı — site interactions
   ---------------------------------------------------------
   İLETİŞİM BİLGİLERİ TEK YERDEN: SITE objesini düzenle (yer tutucu). */
const SITE = {
  phone: "0549 360 11 61",
  phoneRaw: "+905493601161",
  whatsapp: "905493601161",
  email: "info@sescanyapi.com",
  address: "Çerkezköy, Tekirdağ",
  hours: "Pzt–Cmt: 08:00 – 19:00",
};

document.addEventListener("DOMContentLoaded", () => {
  // header shadow on scroll
  const header = document.querySelector(".header");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // mobile drawer
  const drawer = document.getElementById("drawer");
  const openBtn = document.querySelector(".nav__toggle");
  const closeBtn = document.querySelector(".drawer__close");
  const scrim = document.querySelector(".drawer__scrim");
  const setDrawer = (open) => {
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  openBtn && openBtn.addEventListener("click", () => setDrawer(true));
  closeBtn && closeBtn.addEventListener("click", () => setDrawer(false));
  scrim && scrim.addEventListener("click", () => setDrawer(false));
  drawer && drawer.querySelectorAll("a.link").forEach((a) => a.addEventListener("click", () => setDrawer(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setDrawer(false); });

  // hero slider
  const slider = document.querySelector(".slider");
  if (slider) {
    const slides = [...slider.querySelectorAll(".slide")];
    const dots = [...slider.querySelectorAll(".slider__dots button")];
    let i = 0, timer;
    const go = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle("active", k === i));
      dots.forEach((d, k) => d.classList.toggle("active", k === i));
    };
    const start = () => { timer = setInterval(() => go(i + 1), 6000); };
    const reset = () => { clearInterval(timer); start(); };
    dots.forEach((d, k) => d.addEventListener("click", () => { go(k); reset(); }));
    const prev = slider.querySelector(".slider__arrow.prev");
    const next = slider.querySelector(".slider__arrow.next");
    prev && prev.addEventListener("click", () => { go(i - 1); reset(); });
    next && next.addEventListener("click", () => { go(i + 1); reset(); });
    go(0); start();
  }

  // partners marquee — logo dosyası varsa göster, yoksa yazıya düş
  // Logo eklemek için: assets/partners/<slug>.png (veya .svg) koyup PARTNERS'taki logo alanını güncelle
  const PARTNERS = [
    { name: "Adoçim", file: "adocim.png" },
    { name: "Traçim", file: "tracim.png" },
    { name: "Sim Standart", file: "" },
    { name: "Onduline", file: "onduline.svg" },
    { name: "STT Türk Gazbeton", file: "" },
    { name: "Derya", file: "derya.jpg" },
    { name: "Beşer", file: "beser.png" },
    { name: "Efor Tuğla", file: "efor.png" },
    { name: "ABS Alçı", file: "" },
    { name: "Kalekim", file: "kalekim.svg" },
    { name: "ALL Alçı", file: "all-alci.png" },
    { name: "Dalsan", file: "dalsan.png" },
    { name: "Filli Boya", file: "filli-boya.png" },
    { name: "Dalmaçyalı", file: "" },
    { name: "Lion Yalıtım", file: "" },
    { name: "Fawori", file: "fawori.svg" },
  ];
  const track = document.getElementById("partners-track");
  if (track) {
    const makeItem = (p) => {
      const el = document.createElement("div");
      el.className = "mlogo";
      const span = document.createElement("span");
      span.innerHTML = p.name + (p.sub ? `<small>${p.sub}</small>` : "");
      if (p.file) {
        const img = document.createElement("img");
        img.src = `assets/partners/${p.file}`;
        img.alt = p.name;
        img.loading = "lazy";
        span.style.display = "none";
        img.addEventListener("error", () => { img.remove(); span.style.display = "flex"; });
        el.append(img, span);
      } else {
        el.classList.add("mlogo--text");
        el.append(span);
      }
      return el;
    };
    // kesintisiz döngü için iki kopya
    [...PARTNERS, ...PARTNERS].forEach((p) => track.appendChild(makeItem(p)));
  }

  // ürün gruplarına WhatsApp "stok & fiyat sor" butonu (urunler sayfası)
  const WA_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2zm5.8 14.2c-.2.7-1.4 1.3-1.9 1.4-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.6-.6-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.3.5c-.1.2-.3.3-.1.6.1.3.6 1 1.3 1.7.9.8 1.6 1 1.9 1.2.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.6-.1l1.8.9c.2.1.4.2.5.3.1.2.1.7-.1 1.3z"/></svg>';
  document.querySelectorAll(".prod__body").forEach((body) => {
    const h = body.querySelector("h3");
    if (!h) return;
    const name = h.textContent.trim();
    const msg = `Merhaba, *${name}* için stok durumu ve fiyat bilgisi almak istiyorum.`;
    const wrap = document.createElement("div");
    wrap.className = "prod__cta";
    const a = document.createElement("a");
    a.className = "wa-ask";
    a.target = "_blank";
    a.rel = "noopener";
    a.href = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(msg)}`;
    a.innerHTML = `${WA_ICON} Stok & fiyat için WhatsApp'tan sorun`;
    wrap.appendChild(a);
    body.appendChild(wrap);
  });

  // scroll reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // contact form -> WhatsApp
  const form = document.getElementById("teklif-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const lines = [
        "*Yeni Teklif Talebi — Ses Can Yapı*",
        `Ad Soyad: ${d.get("ad") || "-"}`,
        `Telefon: ${d.get("telefon") || "-"}`,
        `Ürün Grubu: ${d.get("urun") || "-"}`,
        `Mesaj: ${d.get("mesaj") || "-"}`,
      ];
      window.open(`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
    });
  }
});
