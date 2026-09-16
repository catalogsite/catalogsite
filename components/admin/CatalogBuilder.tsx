'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { createFullCatalog } from '@/app/actions/catalogs';
import { slugify, cn } from '@/lib/utils';
import { Plus, Trash2, ChevronRight, ChevronLeft, Package, Tags, Library, Check } from 'lucide-react';
import { toast } from 'sonner';

type BuilderProduct = {
  key: string;
  name: string;
  description: string;
  image_url: string;
  price: string;
  sku: string;
};

type BuilderBrand = {
  key: string;
  name: string;
  description: string;
  logo_url: string;
  products: BuilderProduct[];
};

function newKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyProduct(): BuilderProduct {
  return { key: newKey(), name: '', description: '', image_url: '', price: '', sku: '' };
}

function emptyBrand(): BuilderBrand {
  return { key: newKey(), name: '', description: '', logo_url: '', products: [emptyProduct()] };
}

const STEPS = [
  { id: 1, label: 'Catalog', icon: Library },
  { id: 2, label: 'Brands & products', icon: Tags },
  { id: 3, label: 'Review & share', icon: Package },
] as const;

export function CatalogBuilder() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [published, setPublished] = useState(true);
  const [brands, setBrands] = useState<BuilderBrand[]>([emptyBrand()]);

  const productCount = useMemo(
    () => brands.reduce((sum, b) => sum + b.products.filter((p) => p.name.trim()).length, 0),
    [brands]
  );

  function updateBrand(key: string, patch: Partial<BuilderBrand>) {
    setBrands((prev) => prev.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  }

  function updateProduct(brandKey: string, productKey: string, patch: Partial<BuilderProduct>) {
    setBrands((prev) =>
      prev.map((b) =>
        b.key !== brandKey
          ? b
          : { ...b, products: b.products.map((p) => (p.key === productKey ? { ...p, ...patch } : p)) }
      )
    );
  }

  function validateStep1(): string | null {
    if (name.trim().length < 2) return 'Catalog name must be at least 2 characters.';
    if (!slugify(slug || name)) return 'Enter a valid catalog slug.';
    return null;
  }

  function validateStep2(): string | null {
    const namedBrands = brands.filter((b) => b.name.trim());
    if (namedBrands.length === 0) return 'Add at least one brand with a name.';
    for (const brand of namedBrands) {
      if (brand.products.every((p) => !p.name.trim())) {
        return `Add at least one product under ${brand.name}.`;
      }
    }
    return null;
  }

  function goNext() {
    setError(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
    }
    if (step === 2) {
      const err = validateStep2();
      if (err) {
        setError(err);
        return;
      }
    }
    setStep((s) => Math.min(3, s + 1));
  }

  function handleCreate() {
    setError(null);
    const step1Error = validateStep1();
    if (step1Error) {
      setError(step1Error);
      setStep(1);
      return;
    }
    const step2Error = validateStep2();
    if (step2Error) {
      setError(step2Error);
      setStep(2);
      return;
    }

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        slug: slugify(slug || name),
        description: description.trim(),
        logo_url: logoUrl || '',
        published,
        brands: brands
          .filter((b) => b.name.trim())
          .map((b) => ({
            name: b.name.trim(),
            description: b.description.trim(),
            logo_url: b.logo_url || '',
            products: b.products
              .filter((p) => p.name.trim())
              .map((p) => ({
                name: p.name.trim(),
                description: p.description.trim(),
                image_url: p.image_url || '',
                price: p.price.trim() ? Number(p.price) : null,
                sku: p.sku.trim(),
                external_url: '',
              })),
          })),
      };

      const result = await createFullCatalog(payload);
      if (!result.success || !result.data) {
        setError(result.error || 'Could not create catalog.');
        if (result.data?.id) {
          toast.error(result.error || 'Partial create — open the catalog to finish.');
          router.push(`/admin/catalogs/${result.data.id}/share`);
        }
        return;
      }

      toast.success('Catalog created — copy the share link for your customer.');
      router.push(`/admin/catalogs/${result.data.id}/share`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <li
              key={s.id}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
                active && 'border-neutral-900 bg-neutral-900 text-white',
                done && 'border-neutral-300 bg-neutral-50 text-neutral-700',
                !active && !done && 'border-neutral-200 text-neutral-400'
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              {s.id}. {s.label}
            </li>
          );
        })}
      </ol>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {step === 1 && (
        <Card>
          <CardContent className="max-w-xl space-y-5">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Catalog details</h2>
              <p className="text-sm text-neutral-500">Name, public URL, logo, and description for the whole catalog.</p>
            </div>

            <div>
              <Label htmlFor="catalog-name">Catalog name</Label>
              <Input
                id="catalog-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                placeholder="WATCH AIM"
              />
            </div>

            <div>
              <Label htmlFor="catalog-slug">Public URL slug</Label>
              <Input
                id="catalog-slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="watch-aim"
              />
              <p className="mt-1 text-xs text-neutral-400">
                Customer link: /catalog/{slug || 'your-slug'}
              </p>
            </div>

            <div>
              <Label htmlFor="catalog-description">Description</Label>
              <Textarea
                id="catalog-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A curated selection of brands and products."
              />
            </div>

            <div>
              <Label>Catalog logo</Label>
              <ImageUploader
                bucket="catalog-logos"
                catalogId={null}
                label="logo"
                value={logoUrl}
                onChange={setLogoUrl}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={published} onCheckedChange={setPublished} />
              <span className="text-sm text-neutral-700">Publish immediately (customers can open the share link)</span>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Brands & products</h2>
              <p className="text-sm text-neutral-500">
                Add every brand with its products, photos, and descriptions in one place.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setBrands((prev) => [...prev, emptyBrand()])}>
              <Plus className="h-4 w-4" /> Add brand
            </Button>
          </div>

          {brands.map((brand, brandIndex) => (
            <Card key={brand.key}>
              <CardContent className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-neutral-900">Brand {brandIndex + 1}</h3>
                  {brands.length > 1 && (
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => setBrands((prev) => prev.filter((b) => b.key !== brand.key))}
                    >
                      Remove brand
                    </button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Brand name</Label>
                    <Input
                      value={brand.name}
                      onChange={(e) => updateBrand(brand.key, { name: e.target.value })}
                      placeholder="ROLEX"
                    />
                  </div>
                  <div>
                    <Label>Brand logo</Label>
                    <ImageUploader
                      bucket="brand-logos"
                      catalogId={null}
                      label="logo"
                      value={brand.logo_url || null}
                      onChange={(url) => updateBrand(brand.key, { logo_url: url || '' })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Brand description</Label>
                  <Textarea
                    value={brand.description}
                    onChange={(e) => updateBrand(brand.key, { description: e.target.value })}
                    placeholder="Short brand story for the public page."
                  />
                </div>

                <div className="space-y-3 border-t border-neutral-100 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-neutral-800">Products</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateBrand(brand.key, { products: [...brand.products, emptyProduct()] })
                      }
                    >
                      <Plus className="h-3.5 w-3.5" /> Add product
                    </Button>
                  </div>

                  {brand.products.map((product, productIndex) => (
                    <div key={product.key} className="rounded-md border border-neutral-200 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-neutral-500">Product {productIndex + 1}</p>
                        {brand.products.length > 1 && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs text-red-600"
                            onClick={() =>
                              updateBrand(brand.key, {
                                products: brand.products.filter((p) => p.key !== product.key),
                              })
                            }
                          >
                            <Trash2 className="h-3 w-3" /> Remove
                          </button>
                        )}
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={product.name}
                            onChange={(e) => updateProduct(brand.key, product.key, { name: e.target.value })}
                            placeholder="Submariner"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Price</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={product.price}
                              onChange={(e) => updateProduct(brand.key, product.key, { price: e.target.value })}
                              placeholder="12000"
                            />
                          </div>
                          <div>
                            <Label>SKU</Label>
                            <Input
                              value={product.sku}
                              onChange={(e) => updateProduct(brand.key, product.key, { sku: e.target.value })}
                              placeholder="ROL001"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={product.description}
                          onChange={(e) => updateProduct(brand.key, product.key, { description: e.target.value })}
                          placeholder="What the customer should know about this product."
                        />
                      </div>

                      <div>
                        <Label>Product image</Label>
                        <ImageUploader
                          bucket="product-images"
                          catalogId={null}
                          label="image"
                          value={product.image_url || null}
                          onChange={(url) => updateProduct(brand.key, product.key, { image_url: url || '' })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {step === 3 && (
        <Card>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Review</h2>
              <p className="text-sm text-neutral-500">
                Create the full catalog now. You can edit anything later, then send the customer share link.
              </p>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-md bg-neutral-50 p-3">
                <dt className="text-xs text-neutral-500">Catalog</dt>
                <dd className="font-medium text-neutral-900">{name || '—'}</dd>
                <dd className="text-xs text-neutral-400">/catalog/{slugify(slug || name) || '…'}</dd>
              </div>
              <div className="rounded-md bg-neutral-50 p-3">
                <dt className="text-xs text-neutral-500">Status</dt>
                <dd className="font-medium text-neutral-900">{published ? 'Published (shareable)' : 'Draft'}</dd>
              </div>
              <div className="rounded-md bg-neutral-50 p-3">
                <dt className="text-xs text-neutral-500">Brands</dt>
                <dd className="font-medium text-neutral-900">{brands.filter((b) => b.name.trim()).length}</dd>
              </div>
              <div className="rounded-md bg-neutral-50 p-3">
                <dt className="text-xs text-neutral-500">Products</dt>
                <dd className="font-medium text-neutral-900">{productCount}</dd>
              </div>
            </dl>

            <ul className="space-y-2 text-sm text-neutral-600">
              {brands
                .filter((b) => b.name.trim())
                .map((b) => (
                  <li key={b.key} className="rounded-md border border-neutral-200 px-3 py-2">
                    <span className="font-medium text-neutral-900">{b.name}</span>
                    <span className="text-neutral-400">
                      {' '}
                      · {b.products.filter((p) => p.name.trim()).length} products
                    </span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={() => (step === 1 ? router.back() : setStep((s) => s - 1))} disabled={pending}>
          <ChevronLeft className="h-4 w-4" />
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>

        {step < 3 ? (
          <Button type="button" onClick={goNext}>
            Continue <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={handleCreate} disabled={pending}>
            {pending ? 'Creating catalog…' : 'Create catalog & get share link'}
          </Button>
        )}
      </div>
    </div>
  );
}
