import { listMedia } from '@/app/actions/media';
import { listCatalogsWithCounts } from '@/app/actions/catalogs';
import { MediaLibrary } from '@/components/admin/MediaLibrary';

export default async function MediaPage() {
  const [items, catalogs] = await Promise.all([listMedia(), listCatalogsWithCounts()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Media Library</h1>
        <p className="text-sm text-neutral-500">Every logo and product image you&apos;ve uploaded, in one place.</p>
      </div>
      <MediaLibrary items={items} catalogs={catalogs} />
    </div>
  );
}
