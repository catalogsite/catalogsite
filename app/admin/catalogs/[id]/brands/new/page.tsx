import { BrandForm } from '@/components/admin/BrandForm';

export default function NewBrandPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Add Brand</h1>
      </div>
      <BrandForm catalogId={params.id} />
    </div>
  );
}
