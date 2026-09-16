'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'brands', label: 'Brands', path: (id: string) => `/admin/catalogs/${id}/brands` },
  { key: 'import', label: 'Bulk Import', path: (id: string) => `/admin/catalogs/${id}/import` },
  { key: 'edit', label: 'Settings', path: (id: string) => `/admin/catalogs/${id}/edit` },
  { key: 'share', label: 'Share', path: (id: string) => `/admin/catalogs/${id}/share` },
] as const;

export function CatalogTabs({ catalogId, active }: { catalogId: string; active: (typeof TABS)[number]['key'] }) {
  return (
    <div className="flex gap-1 border-b border-neutral-200">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.path(catalogId)}
          className={cn(
            'border-b-2 px-3 py-2 text-sm font-medium',
            active === tab.key ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-800'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
