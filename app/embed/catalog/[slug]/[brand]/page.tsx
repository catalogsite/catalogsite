import { getPublicCatalog, getPublicBrand, getPublicProducts } from '@/lib/public-data';
import { CatalogGrid } from '@/components/catalog/CatalogGrid';
import { ProductCard } from '@/components/catalog/ProductCard';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Tag } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function EmbedBrandPage({ params }: { params: { slug: string; brand: string } }) {
  const catalog = await getPublicCatalog(params.slug);
  if (!catalog) notFound();
  const brand = await getPublicBrand(catalog.id, params.brand);
  if (!brand) notFound();
  const products = await getPublicProducts(brand.id);

  return (
    <div style={{ backgroundColor: catalog.background_color, color: catalog.text_color, minHeight: '100vh' }}>
      <div className="mx-auto max-w-6xl px-3 py-8 sm:px-5">
        <Link href={`/embed/catalog/${catalog.slug}`} className="mb-6 inline-flex items-center gap-1.5 text-sm opacity-60 hover:opacity-100">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {catalog.name}
        </Link>

        <header className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-neutral-50">
            {brand.logo_url ? (
              <Image src={brand.logo_url} alt={brand.name} width={80} height={80} className="h-full w-full object-cover" />
            ) : (
              <Tag className="h-8 w-8 text-neutral-300" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{brand.name}</h1>
          {brand.description && <p className="mt-2 max-w-xl text-sm opacity-70">{brand.description}</p>}
        </header>

        {products.length === 0 ? (
          <p className="py-16 text-center text-sm opacity-50">No products published for {brand.name} yet.</p>
        ) : (
          <CatalogGrid columns={catalog.grid_columns}>
            {products.map((product) => (
              <ProductCard key={product.id} catalogSlug={catalog.slug} brandSlug={brand.slug} product={product} cardStyle={catalog.card_style} basePath="/embed/catalog" />
            ))}
          </CatalogGrid>
        )}
      </div>
    </div>
  );
}
