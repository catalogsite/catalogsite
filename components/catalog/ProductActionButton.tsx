import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Green "Inquire on WhatsApp" button on product pages. */
export function ProductActionButton({ href, className }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1EBE5A] sm:w-fit',
        className
      )}
    >
      <MessageCircle className="h-4 w-4" /> Inquire on WhatsApp
    </a>
  );
}