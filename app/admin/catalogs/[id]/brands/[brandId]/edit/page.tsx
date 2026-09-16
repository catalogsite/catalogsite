import { getBrandById } from '@/app/actions/brands';
import { BrandForm } from '@/components/admin/BrandForm';
import { notFound } from 'next/navigation';

export default async function EditBrandPage({ params }: { params: { id: string; brandId: string } }) {
  const brand = await getBrandById(params.brandId);
  if (!brand) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Edit {brand.name}</h1>
      </div>
      <BrandForm catalogId={params.id} brand={brand} />
    </div>
  );
}
