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
