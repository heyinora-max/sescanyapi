/* =========================================================
   Ses Can Yapı — TEK AYAR DOSYASI
   ---------------------------------------------------------
   Canlıya almak için yapılacak tek iş: aşağıdaki supabaseUrl ve
   supabaseAnonKey alanlarını doldurmak. Adımlar KURULUM.md'de.

   BOŞ bırakılırsa site DEMO modunda çalışır: panelden girilen
   ürünler yalnızca o tarayıcıda durur, ziyaretçiler göremez.
   ========================================================= */
window.AYAR = {
  // --- Supabase (canlı veritabanı) ---
  supabaseUrl:     "",   // örn: https://abcdefgh.supabase.co
  supabaseAnonKey: "",   // Project Settings > API > anon public
  gorselKovasi:    "urun-gorselleri",

  // --- Panel girişi ---
  // Supabase bağlıyken: panele Supabase kullanıcısının e-posta + şifresiyle girilir.
  // Demo modda: aşağıdaki şifre kullanılır.
  demoSifre: "sescan2026",

  // --- İletişim / teklif ---
  whatsapp: "905493601161",
  telefon:  "0549 360 11 61",

  // --- Fiyat gösterimi ---
  paraBirimi: "₺",
  kdvOrani:   20,      // teklif metninde KDV hesabı için
  kdvNotu:    "+KDV",  // fiyatların yanında görünen not
};
