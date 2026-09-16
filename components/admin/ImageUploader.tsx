'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { uploadImage, type MediaBucket } from '@/app/actions/media';
import { Button } from '@/components/ui/button';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

export function ImageUploader({
  bucket,
  catalogId,
  name,
  initialUrl,
  label = 'Image',
  value,
  onChange,
}: {
  bucket: MediaBucket;
  catalogId: string | null;
  name?: string; // hidden input name when used inside a classic <form>
  initialUrl?: string | null;
  label?: string;
  /** Controlled mode for the catalog builder */
  value?: string | null;
  onChange?: (url: string | null) => void;
}) {
  const isControlled = onChange !== undefined;
  const [internalUrl, setInternalUrl] = useState<string | null>(initialUrl || null);
  const url = isControlled ? value ?? null : internalUrl;
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function setUrl(next: string | null) {
    if (isControlled) onChange?.(next);
    else setInternalUrl(next);
  }

  async function handleFile(file: File) {
    setLoading(true);
    const result = await uploadImage(bucket, file, catalogId);
    setLoading(false);
    if (!result.success || !result.data) {
      toast.error(result.error || 'Upload failed');
      return;
    }
    setUrl(result.data.url);
  }

  return (
    <div>
      {name && <input type="hidden" name={name} value={url || ''} />}
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-300 bg-neutral-50">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          ) : url ? (
            <Image src={url} alt={label} width={80} height={80} className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-5 w-5 text-neutral-300" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={loading}>
            {url ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
          </Button>
          {url && (
            <button
              type="button"
              onClick={() => setUrl(null)}
              className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-red-600"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          )}
          <p className="text-xs text-neutral-400">JPG, PNG or WEBP, up to 5MB.</p>
        </div>
      </div>
    </div>
  );
}
