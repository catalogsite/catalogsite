'use client';

import { useEffect, useState } from 'react';
import { CopyUrlBox } from '@/components/admin/CopyUrlBox';
import { LinkButton } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Link2, Share2 } from 'lucide-react';

/**
 * Builds customer share/embed URLs from the current browser origin so we never
 * show localhost after deploy, even if NEXT_PUBLIC_SITE_URL is still local.
 */
export function CustomerSharePanel({
  catalogSlug,
  published,
}: {
  catalogSlug: string;
  published: boolean;
}) {
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const publicUrl = origin ? `${origin}/catalog/${catalogSlug}` : `…/catalog/${catalogSlug}`;
  const embedUrl = origin ? `${origin}/embed/catalog/${catalogSlug}` : `…/embed/catalog/${catalogSlug}`;

  return (
    <div className="space-y-6">
      {!published && (
        <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This catalog is still a draft. Publish it from the Catalogs page before sharing — customers will get a 404 until it is published.
        </div>
      )}

      <Card className="border-neutral-900/10">
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white">
              <Share2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="text-sm font-semibold text-neutral-900">Customer share link</h2>
              <p className="text-sm text-neutral-500">
                Send this URL to anyone. They can browse brands and products in this catalog only. There is no login and no
                access to the CMS.
              </p>
            </div>
          </div>

          <CopyUrlBox url={publicUrl} />

          <div className="flex flex-wrap gap-2">
            <LinkButton href={`/catalog/${catalogSlug}`} variant="outline" size="sm" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> Open customer view
            </LinkButton>
          </div>

          <ul className="space-y-1.5 text-xs text-neutral-500">
            <li className="flex gap-2">
              <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Works for published catalogs only
            </li>
            <li className="flex gap-2">
              <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Customers never see /admin or your login page
            </li>
            <li className="flex gap-2">
              <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              New brands/products you publish appear here automatically
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-900">Embed URL (Google Sites)</h2>
            <p className="text-sm text-neutral-500">
              Use this if you want the catalog inside a Google Site iframe instead of sending a direct link.
            </p>
            <CopyUrlBox url={embedUrl} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">How to embed into Google Sites</h2>
            <ol className="space-y-2">
              {[
                'Open Google Sites and edit your site.',
                'Click Insert in the right-hand toolbar.',
                'Select Embed.',
                'Choose "By URL" and paste your embed URL above.',
                'Click Insert.',
                'Drag the corner of the inserted box to resize it.',
                'Click Publish on your Google Site.',
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-neutral-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-white">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
