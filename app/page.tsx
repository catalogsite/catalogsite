import { redirect } from 'next/navigation';

// Root just sends visitors to the admin dashboard (which itself redirects
// to /login if there's no session). Public catalogs live at /catalog/[slug].
export default function RootPage() {
  redirect('/admin');
}
