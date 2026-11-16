import { getPublicCatalog, getPublicBrand, getPublicProduct } from '@/lib/public-data';
import { absoluteUrl, formatPrice } from '@/lib/utils';
import { productLinkWithEnquiry, watchDisplayName } from '@/lib/whatsapp';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { ProductActionButton } from '@/components/catalog/ProductActionButton';
import { notFound } from 'next/navigation';

interface Params {
  slug: string;
  brand: string;
  product: string;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const catalog = await getPublicCatalog(params.slug);
  if (!catalog) return {};
  const brand = await getPublicBrand(catalog.id, params.brand);
  if (!brand) return {};
  const product = await getPublicProduct(brand.id, params.product);
  if (!product) return {};

  const title = `${product.name} — ${brand.name}`;
  const description = product.description || `${product.name} from ${brand.name}, part of the ${catalog.name} catalog.`;
  const url = absoluteUrl(`/catalog/${catalog.slug}/${brand.slug}/${product.slug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: product.image_url ? [{ url: product.image_url }] : undefined },
  };
}

export default async function PublicProductPage({ params }: { params: Params }) {
  const catalog = await getPublicCatalog(params.slug);
  if (!catalog) notFound();
  const brand = await getPublicBrand(catalog.id, params.brand);
  if (!brand) notFound();
  const product = await getPublicProduct(brand.id, params.product);
  if (!product) notFound();

  const price = formatPrice(product.price);
  // Always link the customer-facing page (not /embed), so the link opens on its own.
  const productPageUrl = absoluteUrl(`/catalog/${catalog.slug}/${brand.slug}/${product.slug}`);
  const viewProductHref = product.external_url
    ? productLinkWithEnquiry(product.external_url, watchDisplayName(brand.name, product.name), productPageUrl)
    : null;

  return (
    <div style={{ backgroundColor: catalog.background_color, color: catalog.text_color, minHeight: '100vh' }}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link href={`/catalog/${catalog.slug}/${brand.slug}`} className="mb-8 inline-flex items-center gap-1.5 text-sm opacity-60 hover:opacity-100">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {brand.name}
        </Link>

        <div className="grid gap-10 md:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-xl bg-neutral-50">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} width={600} height={600} className="h-full w-full object-cover" priority />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-16 w-16 text-neutral-300" />
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-wide opacity-50">{brand.name}</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h1>
            {price && <p className="mt-3 text-xl font-semibold">{price}</p>}
            {product.sku && <p className="mt-1 text-xs opacity-50">SKU: {product.sku}</p>}
            {product.description && <p className="mt-5 text-sm leading-relaxed opacity-80">{product.description}</p>}

            {viewProductHref && <ProductActionButton href={viewProductHref} className="mt-6" />}
            
          </div>
        </div>
      </div>
    </div>
  );
}