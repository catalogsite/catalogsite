import { getCatalogById } from '@/app/actions/catalogs';
import { getExistingImportContext } from '@/app/actions/import';
import { CatalogTabs } from '@/components/admin/CatalogTabs';
import { CsvImporter } from '@/components/admin/CsvImporter';
import { notFound } from 'next/navigation';

export default async function ImportPage({ params }: { params: { id: string } }) {
  const catalog = await getCatalogById(params.id);
  if (!catalog) notFound();
  const { brandNames, productKeys } = await getExistingImportContext(params.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">{catalog.name}</h1>
        <p className="text-sm text-neutral-500">/catalog/{catalog.slug}</p>
      </div>
      <CatalogTabs catalogId={catalog.id} active="import" />

      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Bulk Product Import</h2>
        <p className="text-sm text-neutral-500">
          Prefer filling a spreadsheet? Upload a CSV of products here. For adding photos while you build, use{' '}
          <a href="/admin/catalogs/new" className="font-medium text-neutral-900 underline">
            Create full catalog
          </a>{' '}
          instead.
        </p>
      </div>

      <CsvImporter catalogId={catalog.id} existingBrandNames={brandNames} existingProductKeys={productKeys} />
    </div>
  );
}
