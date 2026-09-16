'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { SortableList } from '@/components/admin/SortableList';
import { Badge } from '@/components/ui/badge';
import { Button, LinkButton } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { reorderProducts, deleteProduct } from '@/app/actions/products';
import { formatPrice } from '@/lib/utils';
import { Package, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/lib/types';

export function ProductsBoard({
  catalogId,
  brandId,
  products,
}: {
  catalogId: string;
  brandId: string;
  products: Product[];
}) {
  const router = useRouter();

  return (
    <SortableList
      items={products.map((p) => ({ ...p }))}
      onReorder={async (orderedIds) => {
        const result = await reorderProducts(brandId, catalogId, orderedIds);
        if (!result.success) toast.error(result.error || 'Could not save the new order');
        router.refresh();
      }}
      renderItem={(product, handle) => (
        <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3">
          {handle}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} width={48} height={48} className="h-full w-full object-cover" />
            ) : (
              <Package className="h-5 w-5 text-neutral-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/catalogs/${catalogId}/brands/${brandId}/products/${product.id}/edit`}
                className="truncate font-medium text-neutral-900 hover:underline"
              >
                {product.name}
              </Link>
              <Badge tone={product.published ? 'success' : 'muted'}>{product.published ? 'Published' : 'Draft'}</Badge>
            </div>
            <p className="text-xs text-neutral-500">
              {[product.sku, formatPrice(product.price)].filter(Boolean).join(' · ') || 'No SKU or price set'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <LinkButton href={`/admin/catalogs/${catalogId}/brands/${brandId}/products/${product.id}/edit`} variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
            </LinkButton>
            <ConfirmDialog
              title={`Delete "${product.name}"?`}
              onConfirm={async () => {
                const result = await deleteProduct(product.id, brandId, catalogId);
                if (!result.success) toast.error(result.error || 'Could not delete product');
                else {
                  toast.success('Product deleted');
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
