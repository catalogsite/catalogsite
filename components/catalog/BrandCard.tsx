import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Brand, CardStyle } from '@/lib/types';
import { Tag } from 'lucide-react';

export function BrandCard({
  catalogSlug,
  brand,
  cardStyle = 'rounded',
  basePath = '/catalog',
}: {
  catalogSlug: string;
  brand: Brand;
  cardStyle?: CardStyle;
  basePath?: string;
}) {
  return (
    <Link
      href={`${basePath}/${catalogSlug}/${brand.slug}`}
      className={cn(
        'group flex flex-col items-center gap-3 border border-black/5 bg-white p-6 text-center transition-shadow hover:shadow-md',
        cardStyle === 'rounded' && 'rounded-xl',
        cardStyle === 'square' && 'rounded-none',
        cardStyle === 'minimal' && 'border-transparent bg-transparent hover:shadow-none'
      )}
    >
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-neutral-50">
        {brand.logo_url ? (
          <Image src={brand.logo_url} alt={brand.name} width={80} height={80} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <Tag className="h-8 w-8 text-neutral-300" />
        )}
      </div>
      <span className="text-sm font-semibold tracking-wide">{brand.name}</span>
    </Link>
  );
}
