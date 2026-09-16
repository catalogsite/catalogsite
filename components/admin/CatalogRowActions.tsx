'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, LinkButton } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { togglePublishCatalog, deleteCatalog } from '@/app/actions/catalogs';
import { absoluteUrl } from '@/lib/utils';
import { Copy, Eye, Pencil, Share2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CatalogWithCounts } from '@/lib/types';

export function CatalogRowActions({ catalog }: { catalog: CatalogWithCounts }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function copyShareLink() {
    const url = absoluteUrl(`/catalog/${catalog.slug}`);
    navigator.clipboard.writeText(url);
    toast.success('Customer share link copied');
  }

  function togglePublish() {
    startTransition(async () => {
      const result = await togglePublishCatalog(catalog.id, !catalog.published);
      if (!result.success) {
        toast.error(result.error || 'Could not update catalog');
        return;
      }
      toast.success(catalog.published ? 'Catalog unpublished' : 'Catalog published successfully');
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <LinkButton href={`/admin/catalogs/${catalog.id}/brands`} variant="outline" size="sm">
        <Pencil className="h-3.5 w-3.5" /> Manage
      </LinkButton>
      <LinkButton href={`/catalog/${catalog.slug}`} variant="outline" size="sm">
        <Eye className="h-3.5 w-3.5" /> Preview
      </LinkButton>
      <Button variant="outline" size="sm" onClick={copyShareLink}>
        <Copy className="h-3.5 w-3.5" /> Copy share link
      </Button>
      <LinkButton href={`/admin/catalogs/${catalog.id}/share`} variant="outline" size="sm">
        <Share2 className="h-3.5 w-3.5" /> Share
      </LinkButton>
      <Button variant="outline" size="sm" onClick={togglePublish} disabled={pending}>
        {catalog.published ? 'Unpublish' : 'Publish'}
      </Button>
      <ConfirmDialog
        title={`Delete "${catalog.name}"?`}
        description="This permanently deletes the catalog and every brand and product in it."
        onConfirm={async () => {
          const result = await deleteCatalog(catalog.id);
          if (!result.success) toast.error(result.error || 'Could not delete catalog');
          else {
            toast.success('Catalog deleted');
            router.refresh();
          }
        }}
        trigger={
          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        }
      />
    </div>
  );
}
