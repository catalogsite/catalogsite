'use client';
import { cn } from '@/lib/utils';

export function Switch({
  checked,
  onCheckedChange,
  name,
  className,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  name?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-neutral-900' : 'bg-neutral-200',
        className
      )}
    >
      <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
      {name && <input type="checkbox" name={name} checked={checked} readOnly className="hidden" />}
    </button>
  );
}
