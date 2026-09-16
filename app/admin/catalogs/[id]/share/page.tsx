import { getCatalogById } from '@/app/actions/catalogs';
import { CatalogTabs } from '@/components/admin/CatalogTabs';
import { CustomerSharePanel } from '@/components/admin/CustomerSharePanel';
import { notFound } from 'next/navigation';

export default async function SharePage({ params }: { params: { id: string } }) {
  const catalog = await getCatalogById(params.id);
  if (!catalog) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">{catalog.name}</h1>
        <p className="text-sm text-neutral-500">
          Share this catalog with customers — they only see the catalog, not your admin site.
        </p>
      </div>
      <CatalogTabs catalogId={catalog.id} active="share" />

      <CustomerSharePanel catalogSlug={catalog.slug} published={catalog.published} />

      <div className="overflow-hidden rounded-lg border border-neutral-200">
        <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-2 text-xs font-medium text-neutral-500">
          Live preview (customer view)
        </div>
        <iframe src={`/catalog/${catalog.slug}`} className="h-[600px] w-full" title="Customer catalog preview" />
      </div>
    </div>
  );
}
