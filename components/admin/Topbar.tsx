import { logout } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function Topbar({ email }: { email?: string | null }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6">
      <div className="md:hidden text-sm font-semibold">Catalog CMS</div>
      <div className="ml-auto flex items-center gap-4">
        <span className="text-sm text-neutral-500">{email}</span>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </form>
      </div>
    </header>
  );
}
