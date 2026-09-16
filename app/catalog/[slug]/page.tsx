import { getPublicCatalog, getPublicBrands } from '@/lib/public-data';
import { SearchBar } from '@/components/catalog/SearchBar';
import { CatalogBrowser } from '@/components/catalog/CatalogBrowser';
import { absoluteUrl } from '@/lib/utils';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const catalog = await getPublicCatalog(params.slug);
  if (!catalog) return {};

  const title = catalog.name;
  const description = catalog.description || `Browse the ${catalog.name} catalog.`;
  const url = absoluteUrl(`/catalog/${catalog.slug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: catalog.logo_url ? [{ url: catalog.logo_url }] : undefined,
    },
  };
}

export default async function PublicCatalogPage({ params }: { params: { slug: string } }) {
  const catalog = await getPublicCatalog(params.slug);
  if (!catalog) notFound();
  const brands = await getPublicBrands(catalog.id);

  return (
    <div style={{ backgroundColor: catalog.background_color, color: catalog.text_color, minHeight: '100vh' }}>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <header className="mb-10 flex flex-col items-center text-center">
          {catalog.logo_url && (
            <Image src={catalog.logo_url} alt={catalog.name} width={96} height={96} className="mb-4 h-24 w-24 rounded-full object-cover" />
          )}
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{catalog.name}</h1>
          {catalog.description && <p className="mt-3 max-w-xl text-sm opacity-70">{catalog.description}</p>}
          <div className="mt-6 w-full">
            <SearchBar catalogSlug={catalog.slug} />
          </div>
        </header>

        <CatalogBrowser catalogSlug={catalog.slug} brands={brands} cardStyle={catalog.card_style} gridColumns={catalog.grid_columns} />
      </div>
    </div>
  );
}
