'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { slugify } from '@/lib/utils';
import { createBrand, updateBrand } from '@/app/actions/brands';
import type { Brand } from '@/lib/types';
import { toast } from 'sonner';

export function BrandForm({ catalogId, brand }: { catalogId: string; brand?: Brand }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(brand?.name || '');
  const [slug, setSlug] = useState(brand?.slug || '');
  const [slugTouched, setSlugTouched] = useState(!!brand);
  const [published, setPublished] = useState(brand?.published ?? true);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = brand ? await updateBrand(brand.id, catalogId, formData) : await createBrand(catalogId, formData);
      if (!result.success) {
        setError(result.error || 'Something went wrong.');
        return;
      }
      toast.success(brand ? 'Brand updated successfully' : 'Brand created successfully');
      router.push(`/admin/catalogs/${catalogId}/brands`);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="max-w-xl space-y-5">
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div>
        <Label htmlFor="name">Brand name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          placeholder="ROLEX"
          required
        />
      </div>

      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          placeholder="rolex"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={brand?.description || ''} placeholder="Swiss luxury watchmaker since 1905." />
      </div>

      <div>
        <Label>Brand logo</Label>
        <ImageUploader bucket="brand-logos" catalogId={catalogId} name="logo_url" initialUrl={brand?.logo_url} label="logo" />
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={published} onCheckedChange={setPublished} name="published" />
        <span className="text-sm text-neutral-700">Published (visible on the public catalog)</span>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : brand ? 'Save changes' : 'Add Brand'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
