import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { LinkButton } from '@/components/ui/button';
import { Library, Tags, Package, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from '@/lib/date';
import { isDemoMode } from '@/lib/demo';
import { demoStats } from '@/lib/demo-data';

async function getStats() {
  if (isDemoMode()) return demoStats();

  const supabase = createServerSupabaseClient();
  const [{ count: catalogs }, { count: publishedCatalogs }, { count: brands }, { count: products }, { count: publishedProducts }] =
    await Promise.all([
      supabase.from('catalogs').select('id', { count: 'exact', head: true }),
      supabase.from('catalogs').select('id', { count: 'exact', head: true }).eq('published', true),
      supabase.from('brands').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('published', true),
    ]);

  const { data: recentCatalogs } = await supabase
    .from('catalogs')
    .select('id, name, slug, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5);

  return {
    catalogs: catalogs || 0,
    publishedCatalogs: publishedCatalogs || 0,
    brands: brands || 0,
    products: products || 0,
    publishedProducts: publishedProducts || 0,
    recentCatalogs: recentCatalogs || [],
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: 'Total Catalogs', value: stats.catalogs, icon: Library },
    { label: 'Total Brands', value: stats.brands, icon: Tags },
    { label: 'Total Products', value: stats.products, icon: Package },
    { label: 'Published Items', value: stats.publishedCatalogs + stats.publishedProducts, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500">Build catalogs once, edit anytime, share a link with customers.</p>
        </div>
        <LinkButton href="/admin/catalogs/new">Create full catalog</LinkButton>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100">
                <c.icon className="h-5 w-5 text-neutral-700" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-neutral-900">{c.value}</p>
                <p className="text-xs text-neutral-500">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Recently updated catalogs</h2>
          {stats.recentCatalogs.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No catalogs yet.{' '}
              <Link href="/admin/catalogs" className="font-medium text-neutral-900 underline">
                Create your first one
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {stats.recentCatalogs.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2.5">
                  <Link href={`/admin/catalogs/${c.id}/brands`} className="text-sm font-medium text-neutral-900 hover:underline">
                    {c.name}
                  </Link>
                  <span className="text-xs text-neutral-400">Updated {formatDistanceToNow(c.updated_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
