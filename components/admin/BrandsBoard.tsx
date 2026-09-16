'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { SortableList } from '@/components/admin/SortableList';
import { Badge } from '@/components/ui/badge';
import { Button, LinkButton } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { reorderBrands, deleteBrand, duplicateBrand } from '@/app/actions/brands';
import { Tags, Copy, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { BrandWithProductCount } from '@/lib/types';

export function BrandsBoard({ catalogId, brands }: { catalogId: string; brands: BrandWithProductCount[] }) {
  const router = useRouter();

  return (
    <SortableList
      items={brands.map((b) => ({ ...b }))}
      onReorder={async (orderedIds) => {
        const result = await reorderBrands(catalogId, orderedIds);
        if (!result.success) toast.error(result.error || 'Could not save the new order');
        router.refresh();
      }}
      renderItem={(brand, handle) => (
        <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3">
          {handle}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
            {brand.logo_url ? (
              <Image src={brand.logo_url} alt={brand.name} width={48} height={48} className="h-full w-full object-cover" />
            ) : (
              <Tags className="h-5 w-5 text-neutral-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/admin/catalogs/${catalogId}/brands/${brand.id}/products`} className="truncate font-medium text-neutral-900 hover:underline">
                {brand.name}
              </Link>
              <Badge tone={brand.published ? 'success' : 'muted'}>{brand.published ? 'Published' : 'Draft'}</Badge>
            </div>
            <p className="text-xs text-neutral-500">{brand.product_count} products</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <LinkButton href={`/admin/catalogs/${catalogId}/brands/${brand.id}/products`} variant="outline" size="sm">
              Products
            </LinkButton>
            <LinkButton href={`/admin/catalogs/${catalogId}/brands/${brand.id}/edit`} variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
            </LinkButton>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                const result = await duplicateBrand(brand.id, catalogId);
                if (!result.success) toast.error(result.error || 'Could not duplicate brand');
                else {
                  toast.success('Brand duplicated');
                  router.refresh();
                }
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <ConfirmDialog
              title={`Delete "${brand.name}"?`}
              description="This also deletes every product under this brand."
              onConfirm={async () => {
                const result = await deleteBrand(brand.id, catalogId);
                if (!result.success) toast.error(result.error || 'Could not delete brand');
                else {
                  toast.success('Brand deleted');
                  router.refresh();
                }
              }}
              trigger={
                <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        </div>
      )}
    />
  );
}
