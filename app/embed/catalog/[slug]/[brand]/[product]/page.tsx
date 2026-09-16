import { getPublicCatalog, getPublicBrand, getPublicProduct } from '@/lib/public-data';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Package, ExternalLink } from 'lucide-react';
import { notFound } from 'next/navigation';

interface Params {
  slug: string;
  brand: string;
  product: string;
}

export default async function EmbedProductPage({ params }: { params: Params }) {
  const catalog = await getPublicCatalog(params.slug);
  if (!catalog) notFound();
  const brand = await getPublicBrand(catalog.id, params.brand);
  if (!brand) notFound();
  const product = await getPublicProduct(brand.id, params.product);
  if (!product) notFound();

  const price = formatPrice(product.price);

  return (
    <div style={{ backgroundColor: catalog.background_color, color: catalog.text_color, minHeight: '100vh' }}>
      <div className="mx-auto max-w-4xl px-3 py-8 sm:px-5">
        <Link href={`/embed/catalog/${catalog.slug}/${brand.slug}`} className="mb-6 inline-flex items-center gap-1.5 text-sm opacity-60 hover:opacity-100">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {brand.name}
        </Link>

        <div className="grid gap-8 sm:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-xl bg-neutral-50">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} width={500} height={500} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-14 w-14 text-neutral-300" />
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-wide opacity-50">{brand.name}</p>
            <h1 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">{product.name}</h1>
            {price && <p className="mt-3 text-lg font-semibold">{price}</p>}
            {product.sku && <p className="mt-1 text-xs opacity-50">SKU: {product.sku}</p>}
            {product.description && <p className="mt-4 text-sm leading-relaxed opacity-80">{product.description}</p>}
            {product.external_url && (
              <a
                href={product.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
              >
                View Product <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
