'use client';

import { useMemo, useState } from 'react';
import { CatalogGrid } from './CatalogGrid';
import { BrandCard } from './BrandCard';
import { cn } from '@/lib/utils';
import type { Brand, CardStyle } from '@/lib/types';

export function CatalogBrowser({
  catalogSlug,
  brands,
  cardStyle,
  gridColumns,
  basePath = '/catalog',
}: {
  catalogSlug: string;
  brands: Brand[];
  cardStyle: CardStyle;
  gridColumns: number;
  basePath?: string;
}) {
  const [filter, setFilter] = useState<string>('all');

  const visibleBrands = useMemo(() => (filter === 'all' ? brands : brands.filter((b) => b.id === filter)), [brands, filter]);

  if (brands.length === 0) {
    return <p className="py-16 text-center text-sm text-neutral-400">No brands published yet — check back soon.</p>;
  }

  return (
    <div className="space-y-8">
      {brands.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </FilterPill>
          {brands.map((b) => (
            <FilterPill key={b.id} active={filter === b.id} onClick={() => setFilter(b.id)}>
              {b.name}
            </FilterPill>
          ))}
        </div>
      )}

      <CatalogGrid columns={gridColumns}>
        {visibleBrands.map((brand) => (
          <BrandCard key={brand.id} catalogSlug={catalogSlug} brand={brand} cardStyle={cardStyle} basePath={basePath} />
        ))}
      </CatalogGrid>
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
        active ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
      )}
    >
      {children}
    </button>
  );
}
