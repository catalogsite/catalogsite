import { redirect } from 'next/navigation';

/** Old Google Sites Embed route — keep working for existing bookmarks. */
export default function EmbedRedirect({ params }: { params: { id: string } }) {
  redirect(`/admin/catalogs/${params.id}/share`);
}
