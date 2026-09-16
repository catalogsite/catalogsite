import { getBrandById } from '@/app/actions/brands';
import { listProducts } from '@/app/actions/products';
import { ProductsBoard } from '@/components/admin/ProductsBoard';
import { EmptyState } from '@/components/ui/empty-state';
import { LinkButton } from '@/components/ui/button';
import { Package, Plus, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ProductsPage({ params }: { params: { id: string; brandId: string } }) {
  const brand = await getBrandById(params.brandId);
  if (!brand) notFound();
  const products = await listProducts(params.brandId);

  return (
    <div className="space-y-6">
      <Link href={`/admin/catalogs/${params.id}/brands`} className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to brands
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
          {brand.logo_url ? (
            <Image src={brand.logo_url} alt={brand.name} width={56} height={56} className="h-full w-full object-cover" />
          ) : (
            <Package className="h-6 w-6 text-neutral-300" />
          )}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{brand.name}</h1>
          <p className="text-sm text-neutral-500">{products.length} products</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">Drag to reorder how products appear under this brand.</p>
        <LinkButton href={`/admin/catalogs/${params.id}/brands/${params.brandId}/products/new`} size="sm">
          <Plus className="h-4 w-4" /> Add Product
        </LinkButton>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet."
          description={`Add your first product under ${brand.name}.`}
          action={
            <LinkButton href={`/admin/catalogs/${params.id}/brands/${params.brandId}/products/new`} size="sm">
              <Plus className="h-4 w-4" /> Add Product
            </LinkButton>
          }
        />
      ) : (
        <ProductsBoard catalogId={params.id} brandId={params.brandId} products={products} />
      )}
    </div>
  );
}
