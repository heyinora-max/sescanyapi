-- =========================================================
-- Ses Can Yapı — Supabase kurulumu
-- ---------------------------------------------------------
-- Nasıl çalıştırılır:
--   supabase.com > projeniz > sol menüde SQL Editor > New query
--   bu dosyanın tamamını yapıştırın > Run
--
-- Bu betik baştan sona yeniden çalıştırılabilir: var olan tabloyu
-- silmez, eksik olanı oluşturur. Ürünleriniz kaybolmaz.
-- =========================================================

-- ---------- 1) TABLOLAR ----------

create table if not exists public.gruplar (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique,
  ad        text not null,
  aciklama  text default '',
  gorsel    text default '',
  sira      integer default 0,
  olusturma timestamptz not null default now()
);

create table if not exists public.urunler (
  id         uuid primary key default gen_random_uuid(),
  grup_id    uuid references public.gruplar(id) on delete cascade,
  ad         text not null,
  marka      text default '',
  fiyat      numeric(12,2),          -- boş olabilir: "Fiyat için teklif alın"
  birim      text default '',
  stok       text default 'stokta',  -- stokta | siparis | tukendi
  aciklama   text default '',
  gorsel     text default '',
  cok_satan  boolean default false,
  yayinda    boolean default true,
  olusturma  timestamptz not null default now(),
  guncelleme timestamptz not null default now()
);

-- Katalog sorguları grup ve çok satan üzerinden gittiği için indeks
create index if not exists urunler_grup_idx      on public.urunler (grup_id);
create index if not exists urunler_olusturma_idx on public.urunler (olusturma desc);
create index if not exists urunler_coksatan_idx  on public.urunler (cok_satan) where cok_satan;

-- ---------- 2) GÜVENLİK (RLS) ----------
-- Herkes okuyabilir (site ziyaretçileri), yalnızca giriş yapmış
-- kullanıcı yazabilir (panel). Anon anahtarla yazma KAPALIDIR.

alter table public.gruplar enable row level security;
alter table public.urunler enable row level security;

drop policy if exists "gruplar_okuma"  on public.gruplar;
drop policy if exists "gruplar_yazma"  on public.gruplar;
drop policy if exists "urunler_okuma"  on public.urunler;
drop policy if exists "urunler_yazma"  on public.urunler;

create policy "gruplar_okuma" on public.gruplar
  for select using (true);

create policy "gruplar_yazma" on public.gruplar
  for all to authenticated using (true) with check (true);

create policy "urunler_okuma" on public.urunler
  for select using (true);

create policy "urunler_yazma" on public.urunler
  for all to authenticated using (true) with check (true);

-- ---------- 3) GÖRSEL DEPOSU ----------

insert into storage.buckets (id, name, public)
values ('urun-gorselleri', 'urun-gorselleri', true)
on conflict (id) do update set public = true;

drop policy if exists "urun_gorsel_okuma" on storage.objects;
drop policy if exists "urun_gorsel_yazma" on storage.objects;

create policy "urun_gorsel_okuma" on storage.objects
  for select using (bucket_id = 'urun-gorselleri');

create policy "urun_gorsel_yazma" on storage.objects
  for all to authenticated
  using (bucket_id = 'urun-gorselleri')
  with check (bucket_id = 'urun-gorselleri');

-- ---------- 4) BAŞLANGIÇ ÜRÜN GRUPLARI ----------
-- Panelden değiştirilebilir, silinebilir, yenisi eklenebilir.

insert into public.gruplar (slug, ad, aciklama, gorsel, sira) values
  ('tugla',       'Tuğla',                  'Delikli tuğla, asmolen ve duvar tuğlası çeşitleri.',       'assets/products/cat-tugla.jpg',      0),
  ('cimento',     'Çimento',                'Torba çimento, hazır sıva ve harç ürünleri.',              'assets/products/cat-cimento.jpg',    1),
  ('gazbeton',    'Gaz Beton',              'Hafif duvar blokları ve yapıştırıcıları.',                 'assets/products/cat-gazbeton.jpg',   2),
  ('cati',        'Çatı Malzemeleri',       'Onduline, OSB, strafor ve çatı aksesuarları.',             'assets/products/cat-cati.jpg',       3),
  ('alci',        'Alçı & Alçı Levha',      'Saten, kartonpiyer, alçı levha ve profil sistemleri.',     'assets/products/cat-alci.jpg',       4),
  ('su-yalitim',  'Su Yalıtım',             'Membran, likit yalıtım ve su izolasyon ürünleri.',         'assets/products/cat-suyalitim.jpg',  5),
  ('mantolama',   'Mantolama Sistemleri',   'EPS/XPS levha, yapıştırıcı, sıva ve dış cephe boyası.',    'assets/products/cat-mantolama.jpg',  6),
  ('boya',        'Boya Malzemeleri',       'İç cephe, dış cephe boyaları, astar, fırça ve rulo.',      'assets/products/cat-boya.jpg',        7),
  ('insaat',      'İnşaat Malzemeleri',     'Demir, kum, çakıl, kalıp ve genel şantiye malzemeleri.',   'assets/products/cat-insaat.jpg',      8),
  ('hirdavat',    'Hırdavat & El Aletleri', 'El aletleri, vida, dübel, kesici ve bağlantı elemanları.', 'assets/products/cat-hirdavat.jpg',    9),
  ('yapi-kimya',  'Yapı Kimyasalları',      'Yapıştırıcı, derz dolgu, kür ve katkı malzemeleri.',       'assets/products/cat-yapikimya.jpg',  10),
  ('tesisat',     'Tesisat Ürünleri',       'PPRC, PVC boru, ek parça ve tesisat armatürleri.',         'assets/products/cat-tesisat.jpg',    11),
  ('is-guvenlik', 'İş Güvenliği Ürünleri',  'Baret, eldiven, gözlük ve şantiye güvenlik ürünleri.',     'assets/products/cat-isguvenlik.jpg', 12),
  ('elektrik',    'Elektrik Malzemeleri',   'Kablo, spiral boru, priz, anahtar, sigorta ve pano malzemeleri.', 'assets/products/cat-elektrik.jpg', 13)
on conflict (slug) do nothing;

-- ---------- 5) SON ADIM (SQL DIŞINDA) ----------
-- 1. Authentication > Users > "Add user" ile panele girecek kişi için
--    e-posta + şifre oluşturun. ("Auto Confirm User" işaretli olsun.)
-- 2. Project Settings > API sayfasından Project URL ve anon public
--    anahtarını kopyalayıp js/config.js içine yazın.
-- 3. Paneli açıp o e-posta ve şifreyle giriş yapın.
