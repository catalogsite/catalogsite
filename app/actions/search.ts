'use server';

import { getPublicCatalog, searchCatalog, type CatalogSearchResult } from '@/lib/public-data';

export async function searchCatalogAction(
  catalogSlug: string,
  query: string,
  basePath: '/catalog' | '/embed/catalog' = '/catalog'
): Promise<CatalogSearchResult[]> {
  const catalog = await getPublicCatalog(catalogSlug);
  if (!catalog) return [];
  return searchCatalog(catalog, query, basePath);
}
