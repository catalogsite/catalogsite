import { listCatalogsWithCounts } from '@/app/actions/catalogs';
import { LinkButton } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CatalogRowActions } from '@/components/admin/CatalogRowActions';
import { Library, Plus } from 'lucide-react';
import Image from 'next/image';

export default async function CatalogsPage() {
  const catalogs = await listCatalogsWithCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Catalogs</h1>
          <p className="text-sm text-neutral-500">Create a full catalog once, edit anytime, then share a link with customers.</p>
        </div>
        <LinkButton href="/admin/catalogs/new">
          <Plus className="h-4 w-4" /> Create full catalog
        </LinkButton>
      </div>

      {catalogs.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No catalogs yet."
          description="Build a full catalog with brands, products, and images in one go — then share the customer link."
          action={
            <LinkButton href="/admin/catalogs/new" size="sm">
              <Plus className="h-4 w-4" /> Create full catalog
            </LinkButton>
          }
        />
      ) : (
        <div className="space-y-3">
          {catalogs.map((catalog) => (
            <Card key={catalog.id}>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
                    {catalog.logo_url ? (
                      <Image src={catalog.logo_url} alt={catalog.name} width={56} height={56} className="h-full w-full object-cover" />
                    ) : (
                      <Library className="h-6 w-6 text-neutral-300" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-neutral-900">{catalog.name}</h2>
                      <Badge tone={catalog.published ? 'success' : 'muted'}>{catalog.published ? 'Published' : 'Draft'}</Badge>
                    </div>
                    <p className="text-sm text-neutral-500">
                      {catalog.brand_count} Brands · {catalog.product_count} Products
                    </p>
                    <p className="text-xs text-neutral-400">/catalog/{catalog.slug}</p>
                  </div>
                </div>
                <CatalogRowActions catalog={catalog} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
