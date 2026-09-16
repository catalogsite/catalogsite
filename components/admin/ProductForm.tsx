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
import { createProduct, updateProduct } from '@/app/actions/products';
import type { Product } from '@/lib/types';
import { toast } from 'sonner';

export function ProductForm({
  catalogId,
  brandId,
  product,
}: {
  catalogId: string;
  brandId: string;
  product?: Product;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(product?.name || '');
  const [slug, setSlug] = useState(product?.slug || '');
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [published, setPublished] = useState(product?.published ?? true);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = product
        ? await updateProduct(product.id, brandId, catalogId, formData)
        : await createProduct(brandId, catalogId, formData);
      if (!result.success) {
        setError(result.error || 'Something went wrong.');
        return;
      }
      toast.success(product ? 'Product updated successfully' : 'Product created successfully');
      router.push(`/admin/catalogs/${catalogId}/brands/${brandId}/products`);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="max-w-xl space-y-5">
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div>
        <Label htmlFor="name">Product name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          placeholder="Rolex Submariner"
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
          placeholder="submariner"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={product?.description || ''} placeholder="Luxury dive watch, water resistant to 300m." />
      </div>

      <div>
        <Label>Product image</Label>
        <ImageUploader bucket="product-images" catalogId={catalogId} name="image_url" initialUrl={product?.image_url} label="image" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price (optional)</Label>
          <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={product?.price ?? ''} placeholder="12000" />
        </div>
        <div>
          <Label htmlFor="sku">SKU / Product code (optional)</Label>
          <Input id="sku" name="sku" defaultValue={product?.sku || ''} placeholder="ROL001" />
        </div>
      </div>

      <div>
        <Label htmlFor="external_url">External URL (optional)</Label>
        <Input id="external_url" name="external_url" type="url" defaultValue={product?.external_url || ''} placeholder="https://..." />
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={published} onCheckedChange={setPublished} name="published" />
        <span className="text-sm text-neutral-700">Published (visible on the public catalog)</span>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : product ? 'Save changes' : 'Add Product'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
