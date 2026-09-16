# Catalog CMS

Replaces manually-built Google Sites brand/product cards with a real CMS. Manage catalogs, brands, and
products in an admin dashboard; get one public URL per catalog; embed that URL into Google Sites once.
New brands/products you add later show up automatically — no more touching the Google Site.

## 1. What's included

- **Admin dashboard** (`/admin`, auth-protected): catalogs, brands, products, drag-and-drop reordering,
  image upload, CSV bulk import, media library, Google Sites embed instructions.
- **Public catalog** (`/catalog/[slug]`, `/catalog/[slug]/[brand]`, `/catalog/[slug]/[brand]/[product]`):
  responsive, searchable, SEO metadata, only shows published content.
- **Embed version** (`/embed/catalog/[slug]` and nested routes): stripped-down layout sized for an
  iframe, with the `frame-ancestors` header set so Google Sites can embed it.
- **Multi-catalog support**: the schema and UI are generic (Catalog → Brand → Product) so the same app
  works for watches, electronics, furniture, etc. WATCH AIM is just the seeded demo data.
- Supabase Postgres schema with Row Level Security (`supabase/schema.sql`), Supabase Auth for the admin
  login, and Supabase Storage for logos/product images.

## 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the contents of `supabase/schema.sql`. This creates all tables, indexes, RLS
   policies, and the three storage buckets (`catalog-logos`, `brand-logos`, `product-images`).
3. Create your admin login: **Authentication → Users → Add user** (email + password). The
   `on_auth_user_created` trigger automatically adds them to `public.admins`, which is what RLS checks
   to allow writes.
4. Copy your Project URL, anon key, and service role key from **Project Settings → API**.

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=          # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # anon public key
SUPABASE_SERVICE_ROLE_KEY=         # service role key — server-side only, used by seed script + uploads
NEXT_PUBLIC_SITE_URL=              # e.g. http://localhost:3000, or your production domain
AI_API_KEY=                        # optional, only if you wire up the AI description feature
```

**Never** expose `SUPABASE_SERVICE_ROLE_KEY` in client code — it's only read in server actions.

## 4. Run locally

```bash
npm install
npm run seed     # optional: creates the WATCH AIM demo catalog with 6 brands, ~25 products
npm run dev
```

Visit `http://localhost:3000/login`, sign in with the admin user you created, and you'll land on
`/admin`. The public catalog is at `http://localhost:3000/catalog/watch-aim` once seeded (or once you
create + publish your own catalog).

## 5. Deploy to Vercel

1. Push this project to a Git repo and import it in Vercel.
2. Add the same environment variables from `.env.local` in the Vercel project settings.
3. Set `NEXT_PUBLIC_SITE_URL` to your production domain (e.g. `https://catalog.yourcompany.com`) — this
   is what the "Copy URL" and embed instructions use.
4. Deploy. Run `npm run seed` locally against production env vars if you want the demo data there too
   (or just create catalogs through the admin UI).

## 6. Creating your first real catalog

1. Log into `/admin` → **Catalogs → Create Catalog**. Give it a name; the slug auto-fills.
2. You're dropped into **Brands** for that catalog — add brands (name, logo, description).
3. Open a brand → **Add Product**, or use **Bulk Import** to upload a CSV (download the template first;
   only `brand_name` and `product_name` are required — everything else is optional).
4. Drag brands/products to reorder them; toggle **Publish/Unpublish** per item or for the whole catalog.
5. Go to the catalog's **Google Sites Embed** tab, copy the embed URL.

## 7. Embedding into Google Sites

1. Open Google Sites, edit your site.
2. **Insert → Embed → By URL**, paste the embed URL (`/embed/catalog/your-slug`).
3. Insert, then drag the corner to resize the block.
4. Publish the Google Site.

New brands/products you publish later appear automatically — the Google Site itself never needs
editing again.

## 8. Limitations / what's simplified in this MVP

- **Auth** is single-tier (any row in `public.admins` can manage everything). Per-catalog admin
  permissions aren't implemented — add a `catalog_id` join table + extra RLS checks if you need that.
- **AI-assisted product descriptions** are intentionally not implemented — the spec asked for this to be
  optional and isolated behind an abstraction; there's no AI call wired in yet, only `AI_API_KEY` reserved
  in `.env.example` for when you add it.
- **Image optimization** relies on Next.js's built-in `<Image>` component; there's no separate
  compression pipeline before upload.
- **CSV image matching by filename** (e.g. suggesting `rolex-submariner.jpg` for Rolex → Submariner) is
  not implemented — the CSV import expects an explicit `image_url` column, or you attach images to
  products individually afterward.
- No Google Sheets/Shopify/WooCommerce import — the CSV importer and server-action structure are built so
  those can be added as additional `app/actions/import-*.ts` files later without touching the schema.
- This hasn't been run against a live Supabase project in this environment (no credentials available
  here) — you'll want to click through the admin flow once against your own project before relying on it.

## 9. What to build next

- Per-catalog admin roles/permissions if more than one marketing person will use this.
- AI-assisted product descriptions (isolated service call, gated behind a button in the product form).
- Filename-based image matching in the bulk-import flow.
- Additional import sources (Google Sheets, Shopify, WooCommerce) reusing the `confirmImport` pattern.
- Image compression on upload (e.g. via `sharp` in a server action) if source photos are very large.

## Project structure

```
app/
  actions/          server actions (catalogs, brands, products, media, import, auth, search)
  admin/            authenticated dashboard routes
  catalog/[slug]/…  public catalog, brand, product pages
  embed/catalog/…   iframe-friendly versions of the same pages
  login/            admin sign-in
components/
  ui/               small local design-system primitives (button, input, card, etc.)
  admin/            dashboard-only components (forms, sortable lists, CSV importer, media library)
  catalog/          public-facing components (BrandCard, ProductCard, search, filters)
lib/
  supabase/         browser/server/admin Supabase clients + middleware session refresh
  types.ts          shared TypeScript types mirroring the DB schema
  validations.ts    Zod schemas
  public-data.ts    read-only data access for the public site (relies on RLS)
  csv-import.ts     pure CSV validation/dedupe logic
supabase/
  schema.sql        tables, indexes, RLS policies, storage buckets
scripts/seed.ts     demo data loader
```
