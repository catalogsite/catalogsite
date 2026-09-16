import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Brand, Catalog, Product } from '@/lib/types';
import { isDemoMode } from '@/lib/demo';
import {
  demoGetBrandBySlug,
  demoGetCatalogBySlug,
  demoGetProductBySlug,
  demoListProducts,
  DEMO_BRANDS,
  demoSearch,
} from '@/lib/demo-data';

export async function getPublicCatalog(slug: string): Promise<Catalog | null> {
  if (isDemoMode()) return demoGetCatalogBySlug(slug, true);

  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from('catalogs').select('*').eq('slug', slug).eq('published', true).maybeSingle();
  return data;
}

export async function getPublicBrands(catalogId: string): Promise<Brand[]> {
  if (isDemoMode()) {
    return DEMO_BRANDS.filter((b) => b.catalog_id === catalogId && b.published).sort(
      (a, b) => a.display_order - b.display_order
    );
  }

  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('brands')
    .select('*')
    .eq('catalog_id', catalogId)
    .eq('published', true)
    .order('display_order', { ascending: true });
  return data || [];
}

export async function getPublicBrand(catalogId: string, brandSlug: string): Promise<Brand | null> {
  if (isDemoMode()) {
    const brand = demoGetBrandBySlug(catalogId, brandSlug);
    return brand?.published ? brand : null;
  }

  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('brands')
    .select('*')
    .eq('catalog_id', catalogId)
    .eq('slug', brandSlug)
    .eq('published', true)
    .maybeSingle();
  return data;
}

export async function getPublicProducts(brandId: string): Promise<Product[]> {
  if (isDemoMode()) return demoListProducts(brandId).filter((p) => p.published);

  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('brand_id', brandId)
    .eq('published', true)
    .order('display_order', { ascending: true });
  return data || [];
}

export async function getPublicProduct(brandId: string, productSlug: string): Promise<Product | null> {
  if (isDemoMode()) {
    const product = demoGetProductBySlug(brandId, productSlug);
    return product?.published ? product : null;
  }

  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('brand_id', brandId)
    .eq('slug', productSlug)
    .eq('published', true)
    .maybeSingle();
  return data;
}

export interface CatalogSearchResult {
  type: 'brand' | 'product';
  name: string;
  href: string;
  imageUrl: string | null;
  subtitle?: string;
}

/** Searches published brands + product names/SKUs within one catalog. */
export async function searchCatalog(catalog: Catalog, query: string, basePath = '/catalog'): Promise<CatalogSearchResult[]> {
  if (!query.trim()) return [];
  if (isDemoMode()) return demoSearch(catalog, query, basePath);

  const supabase = createServerSupabaseClient();
  const like = `%${query.trim()}%`;

  const [{ data: brands }, { data: products }] = await Promise.all([
    supabase
      .from('brands')
      .select('*')
      .eq('catalog_id', catalog.id)
      .eq('published', true)
      .ilike('name', like)
      .limit(10),
    supabase
      .from('products')
      .select('*, brands!inner(id, slug, name, catalog_id, published)')
      .eq('brands.catalog_id', catalog.id)
      .eq('brands.published', true)
      .eq('published', true)
      .or(`name.ilike.${like},sku.ilike.${like}`)
      .limit(15),
  ]);

  const brandResults: CatalogSearchResult[] = (brands || []).map((b: Brand) => ({
    type: 'brand',
    name: b.name,
    href: `${basePath}/${catalog.slug}/${b.slug}`,
    imageUrl: b.logo_url,
  }));

  const productResults: CatalogSearchResult[] = (products || []).map((p: any) => ({
    type: 'product',
    name: p.name,
    href: `${basePath}/${catalog.slug}/${p.brands.slug}/${p.slug}`,
    imageUrl: p.image_url,
    subtitle: p.brands.name,
  }));

  return [...brandResults, ...productResults];
}
