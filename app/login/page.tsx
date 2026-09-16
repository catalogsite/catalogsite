import { login } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isDemoMode } from '@/lib/demo';
import { redirect } from 'next/navigation';

export default function LoginPage({ searchParams }: { searchParams: { redirectTo?: string; error?: string } }) {
  if (isDemoMode()) {
    redirect('/admin');
  }

  async function action(formData: FormData) {
    'use server';
    const result = await login(formData);
    if (result?.error) {
      const params = new URLSearchParams({ error: result.error });
      const { redirect } = await import('next/navigation');
      redirect(`/login?${params.toString()}`);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-900">Catalog CMS</h1>
        <p className="mt-1 text-sm text-neutral-500">Sign in to manage your catalogs.</p>

        {searchParams?.error && (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.error}</div>
        )}

        <form action={action} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@company.com" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
        <p className="mt-6 text-xs text-neutral-400">
          Admin accounts are created in the Supabase dashboard (Authentication → Users). There is no public sign-up.
        </p>
      </div>
    </div>
  );
}
