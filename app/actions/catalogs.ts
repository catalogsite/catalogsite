'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { catalogSchema, fullCatalogSchema, type FullCatalogInput } from '@/lib/validations';
import { slugify } from '@/lib/utils';
import type { Catalog, CatalogWithCounts } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { DEMO_BLOCKED, isDemoMode } from '@/lib/demo';
import { demoCatalogsWithCounts, demoGetCatalog, demoGetCatalogBySlug } from '@/lib/demo-data';

export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function listCatalogsWithCounts(): Promise<CatalogWithCounts[]> {
  if (isDemoMode()) return demoCatalogsWithCounts();

  const supabase = createServerSupabaseClient();
  const { data: catalogs, error } = await supabase
    .from('catalogs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !catalogs) return [];

  const results: CatalogWithCounts[] = [];
  for (const catalog of catalogs as Catalog[]) {
    const { count: brandCount } = await supabase
      .from('brands')
      .select('id', { count: 'exact', head: true })
      .eq('catalog_id', catalog.id);

    const { data: brandIds } = await supabase.from('brands').select('id').eq('catalog_id', catalog.id);
    let productCount = 0;
    if (brandIds && brandIds.length > 0) {
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .in('brand_id', brandIds.map((b) => b.id));
      productCount = count || 0;
    }

    results.push({ ...catalog, brand_count: brandCount || 0, product_count: productCount });
  }
  return results;
}

export async function getCatalogById(id: string): Promise<Catalog | null> {
  if (isDemoMode()) return demoGetCatalog(id);

  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from('catalogs').select('*').eq('id', id).single();
  return data;
}

export async function getCatalogBySlug(slug: string, opts?: { requirePublished?: boolean }): Promise<Catalog | null> {
  if (isDemoMode()) return demoGetCatalogBySlug(slug, opts?.requirePublished);

  const supabase = createServerSupabaseClient();
  let query = supabase.from('catalogs').select('*').eq('slug', slug);
  if (opts?.requirePublished) query = query.eq('published', true);
  const { data } = await query.single();
  return data;
}

export async function createCatalog(formData: FormData): Promise<ActionResult<{ id: string }>> {
  if (isDemoMode()) return DEMO_BLOCKED;

  const raw = {
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || '') || slugify(String(formData.get('name') || '')),
    description: String(formData.get('description') || ''),
  };

  const parsed = catalogSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const supabase = createServerSupabaseClient();
  const logoUrl = String(formData.get('logo_url') || '') || null;
  const published = formData.get('published') === 'on' || formData.get('published') === 'true';

  const { data, error } = await supabase
    .from('catalogs')
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      logo_url: logoUrl,
      published,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') return { success: false, error: 'That slug is already in use.' };
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/catalogs');
  return { success: true, data: { id: data.id } };
}

/**
 * Creates a catalog with all brands and products in one request.
 * Used by the one-shot Catalog Builder so admins don't add items one-by-one.
 */
export async function createFullCatalog(
  input: FullCatalogInput
): Promise<ActionResult<{ id: string; slug: string }>> {
  if (isDemoMode()) return DEMO_BLOCKED;

  const parsed = fullCatalogSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const data = parsed.data;
  const supabase = createServerSupabaseClient();

  const { data: catalog, error: catalogError } = await supabase
    .from('catalogs')
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      logo_url: data.logo_url || null,
      published: data.published,
    })
    .select('id, slug')
    .single();

  if (catalogError || !catalog) {
    if (catalogError?.code === '23505') return { success: false, error: 'That catalog slug is already in use.' };
    return { success: false, error: catalogError?.message || 'Could not create catalog.' };
  }

  const usedBrandSlugs = new Set<string>();

  for (let brandIndex = 0; brandIndex < data.brands.length; brandIndex++) {
    const brandInput = data.brands[brandIndex];
    let brandSlug = slugify(brandInput.name);
    if (!brandSlug) brandSlug = `brand-${brandIndex + 1}`;
    if (usedBrandSlugs.has(brandSlug)) brandSlug = `${brandSlug}-${brandIndex + 1}`;
    usedBrandSlugs.add(brandSlug);

    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .insert({
        catalog_id: catalog.id,
        name: brandInput.name,
        slug: brandSlug,
        description: brandInput.description || null,
        logo_url: brandInput.logo_url || null,
        published: true,
        display_order: brandIndex,
      })
      .select('id')
      .single();

    if (brandError || !brand) {
      return {
        success: false,
        error: `Catalog was created, but brand "${brandInput.name}" failed: ${brandError?.message || 'unknown error'}. You can finish editing it under Catalogs.`,
        data: { id: catalog.id, slug: catalog.slug },
      };
    }

    const usedProductSlugs = new Set<string>();
    const productRows = brandInput.products
      .filter((p) => p.name.trim())
      .map((productInput, productIndex) => {
        let productSlug = slugify(productInput.name);
        if (!productSlug) productSlug = `product-${productIndex + 1}`;
        if (usedProductSlugs.has(productSlug)) productSlug = `${productSlug}-${productIndex + 1}`;
        usedProductSlugs.add(productSlug);

        return {
          brand_id: brand.id,
          name: productInput.name,
          slug: productSlug,
          description: productInput.description || null,
          image_url: productInput.image_url || null,
          price: productInput.price ?? null,
          sku: productInput.sku || null,
          external_url: productInput.external_url || null,
          published: true,
          display_order: productIndex,
        };
      });

    if (productRows.length > 0) {
      const { error: productsError } = await supabase.from('products').insert(productRows);
      if (productsError) {
        return {
          success: false,
          error: `Catalog and brand "${brandInput.name}" were created, but some products failed: ${productsError.message}. Finish them under Catalogs.`,
          data: { id: catalog.id, slug: catalog.slug },
        };
      }
    }
  }

  revalidatePath('/admin/catalogs');
  revalidatePath(`/catalog/${catalog.slug}`);
  revalidatePath(`/embed/catalog/${catalog.slug}`);
  return { success: true, data: { id: catalog.id, slug: catalog.slug } };
}

export async function updateCatalog(id: string, formData: FormData): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_BLOCKED;

  const raw = {
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    description: String(formData.get('description') || ''),
    primary_color: String(formData.get('primary_color') || '#111111'),
    secondary_color: String(formData.get('secondary_color') || '#6b7280'),
    background_color: String(formData.get('background_color') || '#ffffff'),
    text_color: String(formData.get('text_color') || '#111111'),
    card_style: (String(formData.get('card_style') || 'rounded') as 'rounded' | 'square' | 'minimal'),
    grid_columns: String(formData.get('grid_columns') || '4'),
  };

  const parsed = catalogSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const supabase = createServerSupabaseClient();
  const logoUrl = formData.get('logo_url');

  const update: Record<string, unknown> = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    primary_color: parsed.data.primary_color,
    secondary_color: parsed.data.secondary_color,
    background_color: parsed.data.background_color,
    text_color: parsed.data.text_color,
    card_style: parsed.data.card_style,
    grid_columns: parsed.data.grid_columns,
  };
  if (logoUrl !== null) update.logo_url = String(logoUrl) || null;

  const { error } = await supabase.from('catalogs').update(update).eq('id', id);
  if (error) {
    if (error.code === '23505') return { success: false, error: 'That slug is already in use.' };
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/catalogs');
  revalidatePath(`/admin/catalogs/${id}/edit`);
  revalidatePath(`/catalog/${parsed.data.slug}`);
  return { success: true };
}

export async function togglePublishCatalog(id: string, published: boolean): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_BLOCKED;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('catalogs').update({ published }).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/catalogs');
  return { success: true };
}

export async function deleteCatalog(id: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_BLOCKED;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('catalogs').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/catalogs');
  return { success: true };
}
