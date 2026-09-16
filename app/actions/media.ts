'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { MediaItem } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from './catalogs';
import { DEMO_BLOCKED, isDemoMode } from '@/lib/demo';
import { DEMO_MEDIA } from '@/lib/demo-data';

export type MediaBucket = 'catalog-logos' | 'brand-logos' | 'product-images';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function uploadImage(
  bucket: MediaBucket,
  file: File,
  catalogId: string | null
): Promise<ActionResult<{ url: string; path: string }>> {
  if (isDemoMode()) return DEMO_BLOCKED;

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: 'Only JPG, PNG, and WEBP images are supported.' };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { success: false, error: 'Image must be smaller than 5MB.' };
  }

  const supabase = createServerSupabaseClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${catalogId || 'shared'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
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
