import { getProductById } from '@/app/actions/products';
import { ProductForm } from '@/components/admin/ProductForm';
import { notFound } from 'next/navigation';

export default async function EditProductPage({ params }: { params: { id: string; brandId: string; productId: string } }) {
  const product = await getProductById(params.productId);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">Edit {product.name}</h1>
      <ProductForm catalogId={params.id} brandId={params.brandId} product={product} />
    </div>
  );
}
