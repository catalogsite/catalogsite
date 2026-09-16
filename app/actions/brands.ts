'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { brandSchema } from '@/lib/validations';
import type { Brand, BrandWithProductCount } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from './catalogs';
import { DEMO_BLOCKED, isDemoMode } from '@/lib/demo';
import { demoBrandsWithCounts, demoGetBrand } from '@/lib/demo-data';

export async function listBrandsWithProductCount(catalogId: string): Promise<BrandWithProductCount[]> {
  if (isDemoMode()) return demoBrandsWithCounts(catalogId);

  const supabase = createServerSupabaseClient();
  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .eq('catalog_id', catalogId)
    .order('display_order', { ascending: true });

  if (!brands) return [];

  const results: BrandWithProductCount[] = [];
  for (const brand of brands as Brand[]) {
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brand.id);
    results.push({ ...brand, product_count: count || 0 });
  }
  return results;
}

export async function getBrandById(id: string): Promise<Brand | null> {
  if (isDemoMode()) return demoGetBrand(id);

  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from('brands').select('*').eq('id', id).single();
  return data;
}

export async function createBrand(catalogId: string, formData: FormData): Promise<ActionResult<{ id: string }>> {
  if (isDemoMode()) return DEMO_BLOCKED;

  const raw = {
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    description: String(formData.get('description') || ''),
    published: formData.get('published') === 'on',
  };
  const parsed = brandSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };

  const supabase = createServerSupabaseClient();

  const { count } = await supabase
    .from('brands')
    .select('id', { count: 'exact', head: true })
    .eq('catalog_id', catalogId);

  const { data, error } = await supabase
    .from('brands')
    .insert({
      catalog_id: catalogId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      logo_url: String(formData.get('logo_url') || '') || null,
      published: parsed.data.published ?? true,
      display_order: count || 0,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') return { success: false, error: 'A brand with that slug already exists in this catalog.' };
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/catalogs/${catalogId}/brands`);
  return { success: true, data: { id: data.id } };
}

export async function updateBrand(id: string, catalogId: string, formData: FormData): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_BLOCKED;

  const raw = {
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    description: String(formData.get('description') || ''),
    published: formData.get('published') === 'on',
  };
  const parsed = brandSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };

  const supabase = createServerSupabaseClient();
  const logoUrl = formData.get('logo_url');
  const update: Record<string, unknown> = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    published: parsed.data.published ?? true,
  };
  if (logoUrl !== null) update.logo_url = String(logoUrl) || null;

  const { error } = await supabase.from('brands').update(update).eq('id', id);
  if (error) {
    if (error.code === '23505') return { success: false, error: 'A brand with that slug already exists in this catalog.' };
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/catalogs/${catalogId}/brands`);
  return { success: true };
}

export async function deleteBrand(id: string, catalogId: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_BLOCKED;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('brands').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/admin/catalogs/${catalogId}/brands`);
  return { success: true };
}

export async function duplicateBrand(id: string, catalogId: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_BLOCKED;

  const supabase = createServerSupabaseClient();
  const { data: brand } = await supabase.from('brands').select('*').eq('id', id).single();
  if (!brand) return { success: false, error: 'Brand not found.' };

  let newSlug = `${brand.slug}-copy`;
  let attempt = 1;
  while (true) {
    const { data: existing } = await supabase
      .from('brands')
      .select('id')
      .eq('catalog_id', catalogId)
      .eq('slug', newSlug)
      .maybeSingle();
    if (!existing) break;
    attempt += 1;
    newSlug = `${brand.slug}-copy-${attempt}`;
  }

  const { count } = await supabase
    .from('brands')
    .select('id', { count: 'exact', head: true })
    .eq('catalog_id', catalogId);

  const { data: newBrand, error } = await supabase
    .from('brands')
    .insert({
      catalog_id: catalogId,
      name: `${brand.name} (Copy)`,
      slug: newSlug,
      description: brand.description,
      logo_url: brand.logo_url,
      published: false,
      display_order: count || 0,
    })
    .select('id')
    .single();
  if (error || !newBrand) return { success: false, error: error?.message || 'Could not duplicate brand.' };

  const { data: products } = await supabase.from('products').select('*').eq('brand_id', id);
  if (products && products.length > 0) {
    const clones = products.map((p) => ({
      brand_id: newBrand.id,
      name: p.name,
      slug: p.slug,
      image_url: p.image_url,
      description: p.description,
      price: p.price,
      sku: p.sku,
      external_url: p.external_url,
      display_order: p.display_order,
      published: p.published,
    }));
    await supabase.from('products').insert(clones);
  }

  revalidatePath(`/admin/catalogs/${catalogId}/brands`);
  return { success: true };
}

export async function reorderBrands(catalogId: string, orderedIds: string[]): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_BLOCKED;

  const supabase = createServerSupabaseClient();
  const updates = orderedIds.map((id, index) =>
    supabase.from('brands').update({ display_order: index }).eq('id', id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { success: false, error: failed.error.message };

  revalidatePath(`/admin/catalogs/${catalogId}/brands`);
  return { success: true };
}
