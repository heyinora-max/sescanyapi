-- =========================================================
-- Ses Can Yapı — Yönetici listesi ve yazma kilidi
-- ---------------------------------------------------------
-- NEDEN GEREKLİ
-- İlk kurulumda yazma politikaları "to authenticated" idi: Supabase'de
-- hesabı olan herkes ürün ekleyip silebilirdi. Publishable anahtar
-- sitenin kaynağında açıkta durduğu için, dışarıdan biri kendi kendine
-- kayıt olup katalogu değiştirebilirdi.
--
-- Bu betik yazmayı bir yönetici listesine bağlar: yalnızca e-postası
-- public.yoneticiler tablosunda olan kullanıcı yazabilir. Kayıt olmak
-- artık tek başına hiçbir yetki vermiyor.
--
-- Baştan sona yeniden çalıştırılabilir.
-- =========================================================

-- ---------- 1) YETKİ SORGUSU ----------
-- Politikaların içinden yoneticiler tablosunu doğrudan sorgulamak
-- özyineleme üretir; bu yüzden security definer bir fonksiyon.
-- Tablodan ÖNCE tanımlanıyor: politikalar buna dayanıyor.

create table if not exists public.yoneticiler (
  eposta    text primary key,
  ad        text default '',
  ekleyen   text default '',
  olusturma timestamptz not null default now()
);

create or replace function public.yonetici_mi()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.yoneticiler y
    where lower(y.eposta) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.yonetici_mi() from public;
grant execute on function public.yonetici_mi() to authenticated, anon;

-- ---------- 2) YÖNETİCİ LİSTESİ POLİTİKALARI ----------
-- Liste herkese açık okunmaz: yalnızca yöneticiler görür ve
-- yalnızca yöneticiler yeni yönetici ekler.

alter table public.yoneticiler enable row level security;

drop policy if exists "yoneticiler_okuma" on public.yoneticiler;
drop policy if exists "yoneticiler_yazma" on public.yoneticiler;

create policy "yoneticiler_okuma" on public.yoneticiler
  for select to authenticated
  using (public.yonetici_mi());

create policy "yoneticiler_yazma" on public.yoneticiler
  for all to authenticated
  using (public.yonetici_mi())
  with check (public.yonetici_mi());

-- ---------- 3) İLK YÖNETİCİ ----------
-- Panele girecek kişi. Buradaki e-posta ile Supabase kullanıcısının
-- e-postası birebir aynı olmalı.

insert into public.yoneticiler (eposta, ad, ekleyen)
values ('info@sescanyapi.com', 'Ses Can Yapı', 'kurulum')
on conflict (eposta) do nothing;

-- ---------- 4) YAZMA POLİTİKALARINI DARALT ----------
-- Okuma herkese açık kalıyor (katalog herkese görünmeli).
-- Yazma yalnızca yönetici listesindeki kullanıcıya açık.

drop policy if exists "gruplar_yazma" on public.gruplar;
create policy "gruplar_yazma" on public.gruplar
  for all to authenticated
  using (public.yonetici_mi())
  with check (public.yonetici_mi());

drop policy if exists "urunler_yazma" on public.urunler;
create policy "urunler_yazma" on public.urunler
  for all to authenticated
  using (public.yonetici_mi())
  with check (public.yonetici_mi());

drop policy if exists "urun_gorsel_yazma" on storage.objects;
create policy "urun_gorsel_yazma" on storage.objects
  for all to authenticated
  using (bucket_id = 'urun-gorselleri' and public.yonetici_mi())
  with check (bucket_id = 'urun-gorselleri' and public.yonetici_mi());

-- ---------- 5) KONTROL ----------

select
  (select count(*) from public.yoneticiler)                                  as yonetici_sayisi,
  (select string_agg(eposta, ', ') from public.yoneticiler)                  as yoneticiler,
  (select count(*) from pg_policies where schemaname = 'public')             as public_politika,
  (select count(*) from pg_policies
     where schemaname = 'storage' and policyname like 'urun_gorsel%')        as storage_politika;
