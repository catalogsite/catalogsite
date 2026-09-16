'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { slugify } from '@/lib/utils';
import { createCatalog, updateCatalog } from '@/app/actions/catalogs';
import type { Catalog } from '@/lib/types';
import { toast } from 'sonner';

export function CatalogForm({ catalog }: { catalog?: Catalog }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(catalog?.name || '');
  const [slug, setSlug] = useState(catalog?.slug || '');
  const [slugTouched, setSlugTouched] = useState(!!catalog);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = catalog ? await updateCatalog(catalog.id, formData) : await createCatalog(formData);
      if (!result.success) {
        setError(result.error || 'Something went wrong.');
        return;
      }
      toast.success(catalog ? 'Catalog updated successfully' : 'Catalog created successfully');
      if (!catalog && result.data) {
        router.push(`/admin/catalogs/${result.data.id}/share`);
      } else {
        router.push('/admin/catalogs');
      }
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="max-w-xl space-y-5">
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div>
        <Label htmlFor="name">Catalog name</Label>
        <Input id="name" name="name" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="WATCH AIM" required />
      </div>

      <div>
        <Label htmlFor="slug">Slug (used in the public URL)</Label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          placeholder="watch-aim"
          required
        />
        <p className="mt-1 text-xs text-neutral-400">Public URL: /catalog/{slug || 'your-slug'}</p>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={catalog?.description || ''} placeholder="A curated catalog of watch brands." />
      </div>

      <div>
        <Label>Logo</Label>
        <ImageUploader bucket="catalog-logos" catalogId={catalog?.id || null} name="logo_url" initialUrl={catalog?.logo_url} label="logo" />
      </div>

      {catalog && (
        <div className="rounded-lg border border-neutral-200 p-4">
          <h3 className="mb-3 text-sm font-semibold text-neutral-900">Design settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primary_color">Accent color</Label>
              <Input id="primary_color" name="primary_color" type="color" defaultValue={catalog.primary_color} className="h-10 w-full p-1" />
            </div>
            <div>
              <Label htmlFor="secondary_color">Secondary color</Label>
              <Input id="secondary_color" name="secondary_color" type="color" defaultValue={catalog.secondary_color} className="h-10 w-full p-1" />
            </div>
            <div>
              <Label htmlFor="background_color">Background color</Label>
              <Input id="background_color" name="background_color" type="color" defaultValue={catalog.background_color} className="h-10 w-full p-1" />
            </div>
            <div>
              <Label htmlFor="text_color">Text color</Label>
              <Input id="text_color" name="text_color" type="color" defaultValue={catalog.text_color} className="h-10 w-full p-1" />
            </div>
            <div>
              <Label htmlFor="card_style">Card style</Label>
              <select id="card_style" name="card_style" defaultValue={catalog.card_style} className="h-10 w-full rounded-md border border-neutral-300 px-3 text-sm">
                <option value="rounded">Rounded</option>
                <option value="square">Square</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
            <div>
              <Label htmlFor="grid_columns">Grid columns (desktop)</Label>
              <select id="grid_columns" name="grid_columns" defaultValue={String(catalog.grid_columns)} className="h-10 w-full rounded-md border border-neutral-300 px-3 text-sm">
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : catalog ? 'Save changes' : 'Create catalog'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
