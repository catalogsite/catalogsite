import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

type Tone = 'default' | 'success' | 'muted' | 'warning';
const toneClasses: Record<Tone, string> = {
  default: 'bg-neutral-900 text-white',
  success: 'bg-emerald-100 text-emerald-700',
  muted: 'bg-neutral-100 text-neutral-600',
  warning: 'bg-amber-100 text-amber-700',
};

export function Badge({ className, tone = 'default', ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', toneClasses[tone], className)}
      {...props}
    />
  );
}
