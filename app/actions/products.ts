'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { productSchema } from '@/lib/validations';
import type { Product } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from './catalogs';
import { DEMO_BLOCKED, isDemoMode } from '@/lib/demo';
import { demoGetProduct, demoListProducts } from '@/lib/demo-data';

export async function listProducts(brandId: string): Promise<Product[]> {
  if (isDemoMode()) return demoListProducts(brandId);

  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('brand_id', brandId)
    .order('display_order', { ascending: true });
  return data || [];
}

export async function getProductById(id: string): Promise<Product | null> {
  if (isDemoMode()) return demoGetProduct(id);

  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from('products').select('*').eq('id', id).single();
  return data;
}

function parsePrice(raw: FormDataEntryValue | null): number | null {
  const str = String(raw ?? '').trim();
  if (!str) return null;
  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}

export async function createProduct(
  brandId: string,
  catalogId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  if (isDemoMode()) return DEMO_BLOCKED;

  const raw = {
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    description: String(formData.get('description') || ''),
    sku: String(formData.get('sku') || ''),
    external_url: String(formData.get('external_url') || ''),
    published: formData.get('published') === 'on',
  };
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };

  const supabase = createServerSupabaseClient();
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('brand_id', brandId);

  const { data, error } = await supabase
    .from('products')
    .insert({
      brand_id: brandId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      image_url: String(formData.get('image_url') || '') || null,
      price: parsePrice(formData.get('price')),
      sku: parsed.data.sku || null,
      external_url: parsed.data.external_url || null,
      published: parsed.data.published ?? true,
      display_order: count || 0,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') return { success: false, error: 'A product with that slug already exists for this brand.' };
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/catalogs/${catalogId}/brands/${brandId}/products`);
  return { success: true, data: { id: data.id } };
}

export async function updateProduct(
  id: string,
  brandId: string,
  catalogId: string,
  formData: FormData
): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_BLOCKED;

  const raw = {
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    description: String(formData.get('description') || ''),
    sku: String(formData.get('sku') || ''),
    external_url: String(formData.get('external_url') || ''),
    published: formData.get('published') === 'on',
  };
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };

  const supabase = createServerSupabaseClient();
  const imageUrl = formData.get('image_url');
  const update: Record<string, unknown> = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    price: parsePrice(formData.get('price')),
    sku: parsed.data.sku || null,
    external_url: parsed.data.external_url || null,
    published: parsed.data.published ?? true,
  };
  if (imageUrl !== null) update.image_url = String(imageUrl) || null;

  const { error } = await supabase.from('products').update(update).eq('id', id);
  if (error) {
    if (error.code === '23505') return { success: false, error: 'A product with that slug already exists for this brand.' };
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/catalogs/${catalogId}/brands/${brandId}/products`);
  return { success: true };
}

export async function deleteProduct(id: string, brandId: string, catalogId: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_BLOCKED;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/admin/catalogs/${catalogId}/brands/${brandId}/products`);
  return { success: true };
}

export async function reorderProducts(brandId: string, catalogId: string, orderedIds: string[]): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_BLOCKED;

  const supabase = createServerSupabaseClient();
  const updates = orderedIds.map((id, index) =>
    supabase.from('products').update({ display_order: index }).eq('id', id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { success: false, error: failed.error.message };

  revalidatePath(`/admin/catalogs/${catalogId}/brands/${brandId}/products`);
  return { success: true };
}
