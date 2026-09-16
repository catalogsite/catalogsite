-- =========================================================
-- Catalog CMS — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`)
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- Table: admins
-- Mirrors auth.users for admins allowed into the dashboard.
-- Row is created by the handle_new_user trigger below.
-- ---------------------------------------------------------
create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Table: catalogs
-- ---------------------------------------------------------
create table if not exists public.catalogs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  logo_url text,
  description text,
  published boolean not null default false,
  primary_color text default '#111111',
  secondary_color text default '#6b7280',
  background_color text default '#ffffff',
  text_color text default '#111111',
  card_style text default 'rounded',        -- 'rounded' | 'square' | 'minimal'
  grid_columns int not null default 4,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists catalogs_slug_idx on public.catalogs (slug);
create index if not exists catalogs_published_idx on public.catalogs (published);

-- ---------------------------------------------------------
-- Table: brands
-- ---------------------------------------------------------
create table if not exists public.brands (
  id uuid primary key default uuid_generate_v4(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  name text not null,
  slug text not null,
  logo_url text,
  description text,
  display_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (catalog_id, slug)
);
create index if not exists brands_catalog_id_idx on public.brands (catalog_id);
create index if not exists brands_display_order_idx on public.brands (catalog_id, display_order);

-- ---------------------------------------------------------
-- Table: products
-- ---------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  slug text not null,
  image_url text,
  description text,
  price numeric(12,2),
  sku text,
  external_url text,
  display_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, slug)
);
create index if not exists products_brand_id_idx on public.products (brand_id);
create index if not exists products_display_order_idx on public.products (brand_id, display_order);
create index if not exists products_sku_idx on public.products (sku);
-- simple text search across name + sku
create index if not exists products_search_idx on public.products
  using gin (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(sku,'')));

-- ---------------------------------------------------------
-- Table: media_library
-- Tracks uploaded images independent of where they end up used,
-- so the admin Media page can list / reuse / delete them.
-- ---------------------------------------------------------
create table if not exists public.media_library (
  id uuid primary key default uuid_generate_v4(),
  catalog_id uuid references public.catalogs(id) on delete cascade,
  bucket text not null,           -- 'catalog-logos' | 'brand-logos' | 'product-images'
  path text not null,             -- storage object path
  url text not null,              -- public URL
  file_name text not null,
  size_bytes bigint,
  associated_type text,           -- 'catalog' | 'brand' | 'product' | null
  associated_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists media_catalog_id_idx on public.media_library (catalog_id);

-- ---------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_catalogs on public.catalogs;
create trigger set_updated_at_catalogs before update on public.catalogs
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_brands on public.brands;
create trigger set_updated_at_brands before update on public.brands
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_products on public.products;
create trigger set_updated_at_products before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Auto-create an admins row whenever a Supabase Auth user is created.
-- (Admin accounts are created via Supabase Auth invite / dashboard —
-- this app has no public sign-up form.)
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.admins (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- Row Level Security
-- Rule of thumb: anyone can READ published rows; only an
-- authenticated admin (a row in public.admins) can write, and
-- an admin can also read drafts for the preview screens.
-- =========================================================
alter table public.catalogs enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.media_library enable row level security;
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean as $$
  select exists (select 1 from public.admins where id = auth.uid());
$$ language sql stable security definer;

-- admins: an admin can read their own row
create policy "admins can read own row" on public.admins
  for select using (auth.uid() = id);

-- catalogs
create policy "public can read published catalogs" on public.catalogs
  for select using (published = true or public.is_admin());
create policy "admins can insert catalogs" on public.catalogs
  for insert with check (public.is_admin());
create policy "admins can update catalogs" on public.catalogs
  for update using (public.is_admin());
create policy "admins can delete catalogs" on public.catalogs
  for delete using (public.is_admin());

-- brands
create policy "public can read published brands" on public.brands
  for select using (
    published = true and exists (select 1 from public.catalogs c where c.id = catalog_id and c.published = true)
    or public.is_admin()
  );
create policy "admins can insert brands" on public.brands
  for insert with check (public.is_admin());
create policy "admins can update brands" on public.brands
  for update using (public.is_admin());
create policy "admins can delete brands" on public.brands
  for delete using (public.is_admin());

-- products
create policy "public can read published products" on public.products
  for select using (
    published = true and exists (
      select 1 from public.brands b join public.catalogs c on c.id = b.catalog_id
      where b.id = brand_id and b.published = true and c.published = true
    )
    or public.is_admin()
  );
create policy "admins can insert products" on public.products
  for insert with check (public.is_admin());
create policy "admins can update products" on public.products
  for update using (public.is_admin());
create policy "admins can delete products" on public.products
  for delete using (public.is_admin());

-- media_library: admin-only in both directions (never shown publicly)
create policy "admins can read media" on public.media_library
  for select using (public.is_admin());
create policy "admins can insert media" on public.media_library
  for insert with check (public.is_admin());
create policy "admins can delete media" on public.media_library
  for delete using (public.is_admin());

-- =========================================================
-- Storage buckets
-- =========================================================
insert into storage.buckets (id, name, public)
values
  ('catalog-logos', 'catalog-logos', true),
  ('brand-logos', 'brand-logos', true),
  ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public read for all three buckets (they only ever hold published-style
-- marketing imagery, never anything private).
create policy "public read catalog-logos" on storage.objects
  for select using (bucket_id = 'catalog-logos');
create policy "public read brand-logos" on storage.objects
  for select using (bucket_id = 'brand-logos');
create policy "public read product-images" on storage.objects
  for select using (bucket_id = 'product-images');

-- Only admins can write
create policy "admins write catalog-logos" on storage.objects
  for insert with check (bucket_id = 'catalog-logos' and public.is_admin());
create policy "admins write brand-logos" on storage.objects
  for insert with check (bucket_id = 'brand-logos' and public.is_admin());
create policy "admins write product-images" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

create policy "admins delete catalog-logos" on storage.objects
  for delete using (bucket_id = 'catalog-logos' and public.is_admin());
create policy "admins delete brand-logos" on storage.objects
  for delete using (bucket_id = 'brand-logos' and public.is_admin());
create policy "admins delete product-images" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());
