import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import slugifyLib from 'slugify';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return slugifyLib(input, { lower: true, strict: true, trim: true });
}

export function formatPrice(price: number | null | undefined, currency = 'USD'): string | null {
  if (price === null || price === undefined) return null;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
  } catch {
    return `${price}`;
  }
}

export function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
