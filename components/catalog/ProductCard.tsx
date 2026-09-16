import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, cn } from '@/lib/utils';
import type { CardStyle, Product } from '@/lib/types';
import { Package } from 'lucide-react';

export function ProductCard({
  catalogSlug,
  brandSlug,
  product,
  cardStyle = 'rounded',
  basePath = '/catalog',
}: {
  catalogSlug: string;
  brandSlug: string;
  product: Product;
  cardStyle?: CardStyle;
  basePath?: string;
}) {
  const price = formatPrice(product.price);
  return (
    <Link
      href={`${basePath}/${catalogSlug}/${brandSlug}/${product.slug}`}
      className={cn(
        'group overflow-hidden border border-black/5 bg-white transition-shadow hover:shadow-md',
        cardStyle === 'rounded' && 'rounded-xl',
        cardStyle === 'square' && 'rounded-none',
        cardStyle === 'minimal' && 'border-transparent'
      )}
    >
      <div className="aspect-square w-full overflow-hidden bg-neutral-50">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-10 w-10 text-neutral-300" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium">{product.name}</h3>
        {price && <p className="mt-1 text-sm text-neutral-500">{price}</p>}
      </div>
    </Link>
  );
}
