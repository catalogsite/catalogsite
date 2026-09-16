import { Sidebar } from '@/components/admin/Sidebar';
import { Topbar } from '@/components/admin/Topbar';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DEMO_USER_EMAIL, isDemoMode } from '@/lib/demo';

// Auth enforcement happens in middleware.ts. This layout just reads the
// current user to show their email in the top bar.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let email: string | undefined = DEMO_USER_EMAIL;

  if (!isDemoMode()) {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email;
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        {isDemoMode() && (
          <div className="bg-amber-50 px-4 py-2 text-center text-xs text-amber-900 border-b border-amber-100">
            Demo mode — browsing sample WATCH AIM data. Saves are disabled until you connect Supabase.
            Public catalog:{' '}
            <a href="/catalog/watch-aim" className="font-medium underline">
              /catalog/watch-aim
            </a>
          </div>
        )}
        <Topbar email={email} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
