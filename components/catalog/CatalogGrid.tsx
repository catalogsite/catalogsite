import { cn } from '@/lib/utils';

const COLS: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  5: 'sm:grid-cols-2 lg:grid-cols-5',
  6: 'sm:grid-cols-3 lg:grid-cols-6',
};

export function CatalogGrid({ columns = 4, children }: { columns?: number; children: React.ReactNode }) {
  return <div className={cn('grid grid-cols-2 gap-4 sm:gap-6', COLS[columns] || COLS[4])}>{children}</div>;
}
