import { ProductForm } from '@/components/admin/ProductForm';

export default function NewProductPage({ params }: { params: { id: string; brandId: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">Add Product</h1>
      <ProductForm catalogId={params.id} brandId={params.brandId} />
    </div>
  );
}
