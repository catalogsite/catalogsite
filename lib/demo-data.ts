import type { Brand, Catalog, CatalogWithCounts, BrandWithProductCount, MediaItem, Product } from '@/lib/types';

const NOW = '2026-01-15T12:00:00.000Z';

function img(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/600`;
}

const BRAND_DEFS: { name: string; slug: string; products: { name: string; slug: string; price: number; sku: string }[] }[] = [
  {
    name: 'SEIKO',
    slug: 'seiko',
    products: [
      { name: 'Prospex', slug: 'prospex', price: 650, sku: 'SEI001' },
      { name: 'Presage', slug: 'presage', price: 480, sku: 'SEI002' },
      { name: 'Astron', slug: 'astron', price: 1200, sku: 'SEI003' },
      { name: 'Seiko 5 Sports', slug: 'seiko-5-sports', price: 320, sku: 'SEI004' },
    ],
  },
  {
    name: 'TUDOR',
    slug: 'tudor',
    products: [
      { name: 'Black Bay', slug: 'black-bay', price: 3800, sku: 'TUD001' },
      { name: 'Pelagos', slug: 'pelagos', price: 4200, sku: 'TUD002' },
      { name: 'Royal', slug: 'royal', price: 3100, sku: 'TUD003' },
      { name: 'Glamour', slug: 'glamour', price: 2900, sku: 'TUD004' },
    ],
  },
  {
    name: 'ROLEX',
    slug: 'rolex',
    products: [
      { name: 'Submariner', slug: 'submariner', price: 10500, sku: 'ROL001' },
      { name: 'Daytona', slug: 'daytona', price: 14500, sku: 'ROL002' },
      { name: 'Datejust', slug: 'datejust', price: 8200, sku: 'ROL003' },
      { name: 'GMT-Master II', slug: 'gmt-master-ii', price: 11200, sku: 'ROL004' },
      { name: 'Explorer', slug: 'explorer', price: 7500, sku: 'ROL005' },
    ],
  },
  {
    name: 'TISSOT',
    slug: 'tissot',
    products: [
      { name: 'PRX', slug: 'prx', price: 695, sku: 'TIS001' },
      { name: 'Le Locle', slug: 'le-locle', price: 575, sku: 'TIS002' },
      { name: 'Seastar', slug: 'seastar', price: 450, sku: 'TIS003' },
      { name: 'T-Touch', slug: 't-touch', price: 890, sku: 'TIS004' },
    ],
  },
  {
    name: 'PATEK PHILIPPE',
    slug: 'patek-philippe',
    products: [
      { name: 'Nautilus', slug: 'nautilus', price: 35000, sku: 'PAT001' },
      { name: 'Calatrava', slug: 'calatrava', price: 22000, sku: 'PAT002' },
      { name: 'Aquanaut', slug: 'aquanaut', price: 28000, sku: 'PAT003' },
    ],
  },
  {
    name: 'OMEGA',
    slug: 'omega',
    products: [
      { name: 'Speedmaster', slug: 'speedmaster', price: 6800, sku: 'OME001' },
      { name: 'Seamaster', slug: 'seamaster', price: 5400, sku: 'OME002' },
      { name: 'Constellation', slug: 'constellation', price: 6100, sku: 'OME003' },
      { name: 'De Ville', slug: 'de-ville', price: 4900, sku: 'OME004' },
    ],
  },
];

export const DEMO_CATALOG: Catalog = {
  id: 'demo-catalog-watch-aim',
  name: 'WATCH AIM',
  slug: 'watch-aim',
  logo_url: img('catalog-watch-aim'),
  description: 'A curated catalog of the world’s most respected watch brands.',
  published: true,
  primary_color: '#111111',
  secondary_color: '#6b7280',
  background_color: '#ffffff',
  text_color: '#111111',
  card_style: 'rounded',
  grid_columns: 4,
  created_at: NOW,
  updated_at: NOW,
};

export const DEMO_BRANDS: Brand[] = BRAND_DEFS.map((b, i) => ({
  id: `demo-brand-${b.slug}`,
  catalog_id: DEMO_CATALOG.id,
  name: b.name,
  slug: b.slug,
  logo_url: img(`brand-${b.slug}`),
  description: `${b.name} watches, part of the WATCH AIM catalog.`,
  display_order: i,
  published: true,
  created_at: NOW,
  updated_at: NOW,
}));

export const DEMO_PRODUCTS: Product[] = BRAND_DEFS.flatMap((b) =>
  b.products.map((p, i) => ({
    id: `demo-product-${b.slug}-${p.slug}`,
    brand_id: `demo-brand-${b.slug}`,
    name: p.name,
    slug: p.slug,
    image_url: img(`product-${b.slug}-${p.slug}`),
    description: `The ${p.name} from ${b.name} — a standout piece in their current lineup.`,
    price: p.price,
    sku: p.sku,
    external_url: null,
    display_order: i,
    published: true,
    created_at: NOW,
    updated_at: NOW,
  }))
);

export const DEMO_MEDIA: MediaItem[] = [
  ...DEMO_BRANDS.map((b) => ({
    id: `demo-media-brand-${b.slug}`,
    catalog_id: DEMO_CATALOG.id,
    bucket: 'brand-logos' as const,
    path: `demo/${b.slug}.jpg`,
    url: b.logo_url!,
    file_name: `${b.slug}-logo.jpg`,
    size_bytes: 120000,
    associated_type: 'brand' as const,
    associated_id: b.id,
    created_at: NOW,
  })),
  ...DEMO_PRODUCTS.slice(0, 8).map((p) => ({
    id: `demo-media-product-${p.slug}`,
    catalog_id: DEMO_CATALOG.id,
    bucket: 'product-images' as const,
    path: `demo/${p.slug}.jpg`,
    url: p.image_url!,
    file_name: `${p.slug}.jpg`,
    size_bytes: 180000,
    associated_type: 'product' as const,
    associated_id: p.id,
    created_at: NOW,
  })),
];

export function demoCatalogsWithCounts(): CatalogWithCounts[] {
  return [
    {
      ...DEMO_CATALOG,
      brand_count: DEMO_BRANDS.length,
      product_count: DEMO_PRODUCTS.length,
    },
  ];
}

export function demoBrandsWithCounts(catalogId: string): BrandWithProductCount[] {
  if (catalogId !== DEMO_CATALOG.id) return [];
  return DEMO_BRANDS.map((b) => ({
    ...b,
    product_count: DEMO_PRODUCTS.filter((p) => p.brand_id === b.id).length,
  }));
}

export function demoGetCatalog(id: string): Catalog | null {
  return id === DEMO_CATALOG.id ? DEMO_CATALOG : null;
}

export function demoGetCatalogBySlug(slug: string, requirePublished = false): Catalog | null {
  if (DEMO_CATALOG.slug !== slug) return null;
  if (requirePublished && !DEMO_CATALOG.published) return null;
  return DEMO_CATALOG;
}

export function demoGetBrand(id: string): Brand | null {
  return DEMO_BRANDS.find((b) => b.id === id) || null;
}

export function demoGetBrandBySlug(catalogId: string, slug: string): Brand | null {
  return DEMO_BRANDS.find((b) => b.catalog_id === catalogId && b.slug === slug) || null;
}

export function demoListProducts(brandId: string): Product[] {
  return DEMO_PRODUCTS.filter((p) => p.brand_id === brandId).sort((a, b) => a.display_order - b.display_order);
}

export function demoGetProduct(id: string): Product | null {
  return DEMO_PRODUCTS.find((p) => p.id === id) || null;
}

export function demoGetProductBySlug(brandId: string, slug: string): Product | null {
  return DEMO_PRODUCTS.find((p) => p.brand_id === brandId && p.slug === slug) || null;
}

export function demoSearch(catalog: Catalog, query: string, basePath = '/catalog') {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const brands = DEMO_BRANDS.filter((b) => b.catalog_id === catalog.id && b.name.toLowerCase().includes(q)).map((b) => ({
    type: 'brand' as const,
    name: b.name,
    href: `${basePath}/${catalog.slug}/${b.slug}`,
    imageUrl: b.logo_url,
  }));

  const products = DEMO_PRODUCTS.filter((p) => {
    const brand = DEMO_BRANDS.find((b) => b.id === p.brand_id);
    return brand?.catalog_id === catalog.id && (p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q));
  }).map((p) => {
    const brand = DEMO_BRANDS.find((b) => b.id === p.brand_id)!;
    return {
      type: 'product' as const,
      name: p.name,
      href: `${basePath}/${catalog.slug}/${brand.slug}/${p.slug}`,
      imageUrl: p.image_url,
      subtitle: brand.name,
    };
  });

  return [...brands.slice(0, 10), ...products.slice(0, 15)];
}

export function demoStats() {
  return {
    catalogs: 1,
    publishedCatalogs: 1,
    brands: DEMO_BRANDS.length,
    products: DEMO_PRODUCTS.length,
    publishedProducts: DEMO_PRODUCTS.length,
    recentCatalogs: [{ id: DEMO_CATALOG.id, name: DEMO_CATALOG.name, slug: DEMO_CATALOG.slug, updated_at: DEMO_CATALOG.updated_at }],
  };
}
