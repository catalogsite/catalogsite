import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { DEMO_USER_EMAIL, isDemoMode } from '@/lib/demo';

export default async function SettingsPage() {
  let email = DEMO_USER_EMAIL;

  if (!isDemoMode()) {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email || '';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500">Account details. Per-catalog design settings live on each catalog&apos;s page.</p>
      </div>

      <Card className="max-w-md">
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs font-medium text-neutral-500">Signed in as</p>
            <p className="text-sm text-neutral-900">{email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">Admin accounts</p>
            <p className="text-sm text-neutral-600">
              {isDemoMode()
                ? 'Demo mode is active. Connect Supabase (see README) to enable real authentication.'
                : 'Add or remove admins from the Supabase dashboard under Authentication → Users. There is no public sign-up form by design.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
