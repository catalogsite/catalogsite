import { getPublicCatalog, getPublicBrands } from '@/lib/public-data';
import { SearchBar } from '@/components/catalog/SearchBar';
import { CatalogBrowser } from '@/components/catalog/CatalogBrowser';
import Image from 'next/image';
import { notFound } from 'next/navigation';

// Embed mode: no outer nav, no admin chrome, sized to fill whatever iframe
// Google Sites gives it. See next.config.mjs for the frame-ancestors header
// that allows this route to be embedded cross-origin.
export default async function EmbedCatalogPage({ params }: { params: { slug: string } }) {
  const catalog = await getPublicCatalog(params.slug);
  if (!catalog) notFound();
  const brands = await getPublicBrands(catalog.id);

  return (
    <div style={{ backgroundColor: catalog.background_color, color: catalog.text_color, minHeight: '100vh' }}>
      <div className="mx-auto max-w-6xl px-3 py-8 sm:px-5">
        <header className="mb-8 flex flex-col items-center text-center">
          {catalog.logo_url && (
            <Image src={catalog.logo_url} alt={catalog.name} width={72} height={72} className="mb-3 h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20" />
          )}
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{catalog.name}</h1>
          {catalog.description && <p className="mt-2 max-w-xl text-sm opacity-70">{catalog.description}</p>}
          <div className="mt-5 w-full">
            <SearchBar catalogSlug={catalog.slug} basePath="/embed/catalog" />
          </div>
        </header>

        <CatalogBrowser
          catalogSlug={catalog.slug}
          brands={brands}
          cardStyle={catalog.card_style}
          gridColumns={catalog.grid_columns}
          basePath="/embed/catalog"
        />

        <p className="mt-10 text-center text-[11px] opacity-30">Powered by Catalog CMS</p>
      </div>
    </div>
  );
}
