import { CatalogBuilder } from '@/components/admin/CatalogBuilder';

export default function NewCatalogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Create full catalog</h1>
        <p className="text-sm text-neutral-500">
          Add the catalog, brands, products, and images in one go — then share a customer link.
        </p>
      </div>
      <CatalogBuilder />
    </div>
  );
}
