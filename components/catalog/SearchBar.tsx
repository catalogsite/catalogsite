'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, Tag, Package } from 'lucide-react';
import { searchCatalogAction } from '@/app/actions/search';
import type { CatalogSearchResult } from '@/lib/public-data';

export function SearchBar({ catalogSlug, basePath = '/catalog' }: { catalogSlug: string; basePath?: '/catalog' | '/embed/catalog' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      startTransition(async () => {
        const data = await searchCatalogAction(catalogSlug, query, basePath);
        setResults(data);
        setOpen(true);
      });
    }, 250);
    return () => clearTimeout(timer.current);
  }, [query, catalogSlug, basePath]);

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 shadow-sm">
        <Search className="h-4 w-4 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search brands, products, or SKU…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
        />
        {query && (
          <button onClick={() => setQuery('')} aria-label="Clear search">
            <X className="h-4 w-4 text-neutral-400" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
          {pending ? (
            <div className="px-4 py-3 text-sm text-neutral-400">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-neutral-400">No matches for &ldquo;{query}&rdquo;</div>
          ) : (
            <ul className="max-h-80 divide-y divide-neutral-100 overflow-auto">
              {results.map((r, i) => (
                <li key={i}>
                  <Link
                    href={r.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-50">
                      {r.imageUrl ? (
                        <Image src={r.imageUrl} alt={r.name} width={36} height={36} className="h-full w-full object-cover" />
                      ) : r.type === 'brand' ? (
                        <Tag className="h-4 w-4 text-neutral-300" />
                      ) : (
                        <Package className="h-4 w-4 text-neutral-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">{r.name}</p>
                      <p className="text-xs text-neutral-400">{r.subtitle ? `${r.subtitle} · Product` : 'Brand'}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
