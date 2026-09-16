'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { MediaItem } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from './catalogs';
import { DEMO_BLOCKED, isDemoMode } from '@/lib/demo';
import { DEMO_MEDIA } from '@/lib/demo-data';

export type MediaBucket = 'catalog-logos' | 'brand-logos' | 'product-images';

const ALLOWED_BUCKETS: MediaBucket[] = ['catalog-logos', 'brand-logos', 'product-images'];
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Accepts FormData only — File objects cannot be passed as bare Server Action
 * arguments in production (Next.js serialization error).
 *
 * Expected fields: file, bucket, catalogId (optional)
 */
export async function uploadImage(formData: FormData): Promise<ActionResult<{ url: string; path: string }>> {
  if (isDemoMode()) return DEMO_BLOCKED;

  const fileEntry = formData.get('file');
  const bucketRaw = String(formData.get('bucket') || '');
  const catalogIdRaw = String(formData.get('catalogId') || '').trim();
  const catalogId = catalogIdRaw || null;

  if (!fileEntry || typeof fileEntry === 'string') {
    return { success: false, error: 'No image file provided.' };
  }

  const file = fileEntry as File;
  if (!file.size) {
    return { success: false, error: 'No image file provided.' };
  }

  if (!ALLOWED_BUCKETS.includes(bucketRaw as MediaBucket)) {
    return { success: false, error: 'Invalid upload bucket.' };
  }
  const bucket = bucketRaw as MediaBucket;

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: 'Only JPG, PNG, and WEBP images are supported.' };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { success: false, error: 'Image must be smaller than 5MB.' };
  }

  const supabase = createServerSupabaseClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${catalogId || 'shared'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) return { success: false, error: uploadError.message };

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
  const url = publicUrlData.publicUrl;

  await supabase.from('media_library').insert({
    catalog_id: catalogId,
    bucket,
    path,
    url,
    file_name: file.name,
    size_bytes: file.size,
  });

  revalidatePath('/admin/media');
  return { success: true, data: { url, path } };
}

export async function listMedia(catalogId?: string): Promise<MediaItem[]> {
  if (isDemoMode()) {
    return catalogId ? DEMO_MEDIA.filter((m) => m.catalog_id === catalogId) : DEMO_MEDIA;
  }

  const supabase = createServerSupabaseClient();
  let query = supabase.from('media_library').select('*').order('created_at', { ascending: false });
  if (catalogId) query = query.eq('catalog_id', catalogId);
  const { data } = await query;
  return data || [];
}

export async function deleteMedia(id: string, bucket: MediaBucket, path: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_BLOCKED;

  const supabase = createServerSupabaseClient();
  await supabase.storage.from(bucket).remove([path]);
  const { error } = await supabase.from('media_library').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/media');
  return { success: true };
}
