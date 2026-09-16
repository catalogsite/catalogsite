import { getCatalogById } from '@/app/actions/catalogs';
import { CatalogForm } from '@/components/admin/CatalogForm';
import { CatalogTabs } from '@/components/admin/CatalogTabs';
import { notFound } from 'next/navigation';

export default async function EditCatalogPage({ params }: { params: { id: string } }) {
  const catalog = await getCatalogById(params.id);
  if (!catalog) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">{catalog.name}</h1>
        <p className="text-sm text-neutral-500">/catalog/{catalog.slug}</p>
      </div>
      <CatalogTabs catalogId={catalog.id} active="edit" />
      <CatalogForm catalog={catalog} />
    </div>
  );
}
