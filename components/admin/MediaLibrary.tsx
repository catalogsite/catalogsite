'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { uploadImage, deleteMedia, type MediaBucket } from '@/app/actions/media';
import { UploadCloud, Copy, Trash2, ImageOff } from 'lucide-react';
import { toast } from 'sonner';
import type { Catalog, MediaItem } from '@/lib/types';

const BUCKET_LABELS: Record<MediaBucket, string> = {
  'catalog-logos': 'Catalog logo',
  'brand-logos': 'Brand logo',
  'product-images': 'Product image',
};

export function MediaLibrary({ items, catalogs }: { items: MediaItem[]; catalogs: Catalog[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [bucket, setBucket] = useState<MediaBucket>('product-images');
  const [catalogId, setCatalogId] = useState<string>(catalogs[0]?.id || '');
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList) {
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('bucket', bucket);
      if (catalogId) formData.set('catalogId', catalogId);
      const result = await uploadImage(formData);
      if (!result.success) toast.error(`${file.name}: ${result.error}`);
    }
    setUploading(false);
    toast.success('Upload complete');
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-neutral-600">Image type</label>
          <select value={bucket} onChange={(e) => setBucket(e.target.value as MediaBucket)} className="h-9 rounded-md border border-neutral-300 px-2 text-sm">
            {Object.entries(BUCKET_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-neutral-600">Catalog</label>
          <select value={catalogId} onChange={(e) => setCatalogId(e.target.value)} className="h-9 rounded-md border border-neutral-300 px-2 text-sm">
            {catalogs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || !catalogId}
        >
          <UploadCloud className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload images'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center">
          <ImageOff className="mb-3 h-8 w-8 text-neutral-400" />
          <p className="text-sm font-medium text-neutral-900">No media uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <div className="aspect-square bg-neutral-50">
                <Image src={item.url} alt={item.file_name} width={200} height={200} className="h-full w-full object-cover" />
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-medium text-neutral-700">{item.file_name}</p>
                <p className="text-[10px] text-neutral-400">{BUCKET_LABELS[item.bucket]}</p>
              </div>
              <div className="absolute inset-x-0 top-0 flex justify-end gap-1 bg-gradient-to-b from-black/40 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 bg-white/90 hover:bg-white"
                  onClick={() => {
                    navigator.clipboard.writeText(item.url);
                    toast.success('URL copied');
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <ConfirmDialog
                  title="Delete this image?"
                  onConfirm={async () => {
                    const result = await deleteMedia(item.id, item.bucket, item.path);
                    if (!result.success) toast.error(result.error || 'Could not delete image');
                    else router.refresh();
                  }}
                  trigger={
                    <Button size="icon" variant="ghost" className="h-7 w-7 bg-white/90 text-red-600 hover:bg-white">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
