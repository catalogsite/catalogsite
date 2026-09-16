import { getPublicCatalog, getPublicBrand, getPublicProducts } from '@/lib/public-data';
import { CatalogGrid } from '@/components/catalog/CatalogGrid';
import { ProductCard } from '@/components/catalog/ProductCard';
import { absoluteUrl } from '@/lib/utils';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Tag } from 'lucide-react';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { slug: string; brand: string } }): Promise<Metadata> {
  const catalog = await getPublicCatalog(params.slug);
  if (!catalog) return {};
  const brand = await getPublicBrand(catalog.id, params.brand);
  if (!brand) return {};

  const title = `${brand.name} — ${catalog.name}`;
  const description = brand.description || `Browse ${brand.name} products in the ${catalog.name} catalog.`;
  const url = absoluteUrl(`/catalog/${catalog.slug}/${brand.slug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: brand.logo_url ? [{ url: brand.logo_url }] : undefined },
  };
}

export default async function PublicBrandPage({ params }: { params: { slug: string; brand: string } }) {
  const catalog = await getPublicCatalog(params.slug);
  if (!catalog) notFound();
  const brand = await getPublicBrand(catalog.id, params.brand);
  if (!brand) notFound();
  const products = await getPublicProducts(brand.id);

  return (
    <div style={{ backgroundColor: catalog.background_color, color: catalog.text_color, minHeight: '100vh' }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link href={`/catalog/${catalog.slug}`} className="mb-8 inline-flex items-center gap-1.5 text-sm opacity-60 hover:opacity-100">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {catalog.name}
        </Link>

        <header className="mb-10 flex flex-col items-center text-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-neutral-50">
            {brand.logo_url ? (
              <Image src={brand.logo_url} alt={brand.name} width={96} height={96} className="h-full w-full object-cover" />
            ) : (
              <Tag className="h-10 w-10 text-neutral-300" />
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{brand.name}</h1>
          {brand.description && <p className="mt-3 max-w-xl text-sm opacity-70">{brand.description}</p>}
          <p className="mt-2 text-xs uppercase tracking-wide opacity-40">{products.length} products</p>
        </header>

        {products.length === 0 ? (
          <p className="py-16 text-center text-sm opacity-50">No products published for {brand.name} yet.</p>
        ) : (
          <CatalogGrid columns={catalog.grid_columns}>
            {products.map((product) => (
              <ProductCard key={product.id} catalogSlug={catalog.slug} brandSlug={brand.slug} product={product} cardStyle={catalog.card_style} />
            ))}
          </CatalogGrid>
        )}
      </div>
    </div>
  );
}
