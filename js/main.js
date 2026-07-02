/* Ses Can Yapı — site interactions
   ---------------------------------------------------------
   SITE.whatsapp: teklif formu ve wa.me link üretiminde kullanılır.
   NOT: Telefon/e-posta/adres metinleri HTML sayfalarında yazılıdır;
   numara değişirse HTML'lerde de arama-değiştirme yapın. */
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
    // zamanlama çubuğu
    const prog = document.createElement("div");
    prog.className = "slider__progress";
    prog.innerHTML = "<i></i>";
    slider.appendChild(prog);
    const bar = prog.firstElementChild;
    const runBar = () => { bar.classList.remove("run"); void bar.offsetWidth; bar.classList.add("run"); };
    let i = 0, timer;
    const go = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle("active", k === i));
      dots.forEach((d, k) => d.classList.toggle("active", k === i));
      runBar();
    };
    const start = () => { timer = setInterval(() => go(i + 1), 6000); };
    const reset = () => { clearInterval(timer); start(); };
    dots.forEach((d, k) => d.addEventListener("click", () => { go(k); reset(); }));
    const prev = slider.querySelector(".slider__arrow.prev");
    const next = slider.querySelector(".slider__arrow.next");
    prev && prev.addEventListener("click", () => { go(i - 1); reset(); });
    next && next.addEventListener("click", () => { go(i + 1); reset(); });
    go(0); start();
    // görünmeyen slaytların görselini gecikmeli yükle (ilk yükleme hızı)
    const lazyBgs = () => slider.querySelectorAll(".slide__bg[data-bg]").forEach((el) => {
      el.style.backgroundImage = `url('${el.dataset.bg}')`;
      el.removeAttribute("data-bg");
    });
    if (document.readyState === "complete") lazyBgs();
    else window.addEventListener("load", lazyBgs, { once: true });
    // sekme arka plandayken desenkron olmasın
    document.addEventListener("visibilitychange", () => { if (!document.hidden) { go(i); reset(); } });
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
        img.decoding = "async";
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

  // scroll reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // sayı animasyonu (count-up)
  const counters = document.querySelectorAll(".count[data-count]");
  if (counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        const el = e.target, target = parseInt(el.dataset.count, 10) || 0;
        const dur = 1200, t0 = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  // kaydırma ilerleme çizgisi + yukarı dön butonu (tüm sayfalara JS ile eklenir)
  const sp = document.createElement("div");
  sp.className = "scroll-progress";
  sp.innerHTML = "<i></i>";
  document.body.appendChild(sp);
  const spBar = sp.firstElementChild;

  const toTop = document.createElement("button");
  toTop.className = "to-top";
  toTop.setAttribute("aria-label", "Yukarı dön");
  toTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.body.appendChild(toTop);

  const onScrollUX = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    spBar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    toTop.classList.toggle("show", h.scrollTop > 600);
  };
  onScrollUX();
  window.addEventListener("scroll", onScrollUX, { passive: true });

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
