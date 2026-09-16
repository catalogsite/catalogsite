'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';
import type { ProductCsvRow } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from './catalogs';
import { DEMO_BLOCKED, isDemoMode } from '@/lib/demo';
import { DEMO_BRANDS, DEMO_PRODUCTS } from '@/lib/demo-data';

export interface ConfirmImportOptions {
  catalogId: string;
  rows: ProductCsvRow[]; // only rows the client marked "valid" (duplicates/errors excluded)
  createMissingBrands: boolean;
}

export interface ConfirmImportSummary {
  productsCreated: number;
  brandsCreated: number;
  skipped: number;
}

/** Returns every brand name + all "brandSlug::productSlug" keys already in this catalog, for the preview step. */
export async function getExistingImportContext(catalogId: string) {
  if (isDemoMode()) {
    const brands = DEMO_BRANDS.filter((b) => b.catalog_id === catalogId);
    const brandIdToSlug = new Map(brands.map((b) => [b.id, b.slug]));
    const productKeys = DEMO_PRODUCTS.filter((p) => brandIdToSlug.has(p.brand_id)).map(
      (p) => `${brandIdToSlug.get(p.brand_id)}::${p.slug}`
    );
    return {
      brandNames: brands.map((b) => b.name),
      productKeys,
    };
  }

  const supabase = createServerSupabaseClient();
  const { data: brands } = await supabase.from('brands').select('id, name, slug').eq('catalog_id', catalogId);
  const brandList = brands || [];

  let productKeys: string[] = [];
  if (brandList.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('slug, brand_id')
      .in('brand_id', brandList.map((b) => b.id));
    const brandIdToSlug = new Map(brandList.map((b) => [b.id, b.slug]));
    productKeys = (products || []).map((p) => `${brandIdToSlug.get(p.brand_id)}::${p.slug}`);
  }

  return {
    brandNames: brandList.map((b) => b.name),
    productKeys,
  };
}

export async function confirmImport(options: ConfirmImportOptions): Promise<ActionResult<ConfirmImportSummary>> {
  if (isDemoMode()) return DEMO_BLOCKED;

  const { catalogId, rows, createMissingBrands } = options;
  const supabase = createServerSupabaseClient();

  const { data: existingBrands } = await supabase.from('brands').select('id, name, slug').eq('catalog_id', catalogId);
  const brandBySlug = new Map((existingBrands || []).map((b) => [b.slug, b]));

  let brandsCreated = 0;
  let productsCreated = 0;
  let skipped = 0;

  const { count: brandCountStart } = await supabase
    .from('brands')
    .select('id', { count: 'exact', head: true })
    .eq('catalog_id', catalogId);
  let nextBrandOrder = brandCountStart || 0;

  for (const row of rows) {
    const brandSlug = slugify(row.brand_name);
    let brand = brandBySlug.get(brandSlug);

    if (!brand) {
      if (!createMissingBrands) {
        skipped += 1;
        continue;
      }
      const { data: newBrand, error } = await supabase
        .from('brands')
        .insert({
          catalog_id: catalogId,
          name: row.brand_name.trim(),
          slug: brandSlug,
          published: true,
          display_order: nextBrandOrder++,
        })
        .select('id, name, slug')
        .single();
      if (error || !newBrand) {
        skipped += 1;
        continue;
      }
      brand = newBrand;
      brandBySlug.set(brandSlug, brand);
      brandsCreated += 1;
    }

    const productSlug = slugify(row.product_name);
    const { count: productCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brand.id);

    const price = row.price && row.price.trim() ? Number(row.price) : null;

    const { error: productError } = await supabase.from('products').insert({
      brand_id: brand.id,
      name: row.product_name.trim(),
      slug: productSlug,
      description: row.description?.trim() || null,
      price: Number.isFinite(price) ? price : null,
      sku: row.sku?.trim() || null,
      external_url: row.external_url?.trim() || null,
      image_url: row.image_url?.trim() || null,
      published: true,
      display_order: productCount || 0,
    });

    if (productError) {
      skipped += 1;
      continue;
    }
    productsCreated += 1;
  }

  revalidatePath(`/admin/catalogs/${catalogId}/brands`);
  return { success: true, data: { productsCreated, brandsCreated, skipped } };
}
