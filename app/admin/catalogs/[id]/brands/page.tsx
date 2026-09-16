import { getCatalogById } from '@/app/actions/catalogs';
import { listBrandsWithProductCount } from '@/app/actions/brands';
import { CatalogTabs } from '@/components/admin/CatalogTabs';
import { BrandsBoard } from '@/components/admin/BrandsBoard';
import { EmptyState } from '@/components/ui/empty-state';
import { LinkButton } from '@/components/ui/button';
import { Tags, Plus } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function BrandsPage({ params }: { params: { id: string } }) {
  const catalog = await getCatalogById(params.id);
  if (!catalog) notFound();
  const brands = await listBrandsWithProductCount(params.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">{catalog.name}</h1>
        <p className="text-sm text-neutral-500">/catalog/{catalog.slug}</p>
      </div>
      <CatalogTabs catalogId={catalog.id} active="brands" />

      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">Drag the handle to reorder how brands appear on the public catalog.</p>
        <LinkButton href={`/admin/catalogs/${catalog.id}/brands/new`} size="sm">
          <Plus className="h-4 w-4" /> Add Brand
        </LinkButton>
      </div>

      {brands.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No brands yet."
          description="Add your first brand to start building this catalog."
          action={
            <LinkButton href={`/admin/catalogs/${catalog.id}/brands/new`} size="sm">
              <Plus className="h-4 w-4" /> Add Brand
            </LinkButton>
          }
        />
      ) : (
        <BrandsBoard catalogId={catalog.id} brands={brands} />
      )}
    </div>
  );
}
