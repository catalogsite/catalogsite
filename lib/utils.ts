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

function isLocalhostUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/** Public site origin for share links, OG tags, etc. */
export function getSiteOrigin(): string {
  // Browser: always use the host the admin is actually on (works after deploy even if env is wrong)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || '';

  // Prefer an explicit non-localhost public URL
  if (configured && !isLocalhostUrl(configured)) {
    return configured;
  }

  // Vercel production custom domain (no protocol)
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/\/$/, '');
  if (productionHost) {
    return `https://${productionHost}`;
  }

  // Any Vercel deployment URL
  const vercelHost = process.env.VERCEL_URL?.replace(/\/$/, '');
  if (vercelHost) {
    return `https://${vercelHost}`;
  }

  return configured || 'http://localhost:3000';
}

export function absoluteUrl(path: string): string {
  const base = getSiteOrigin();
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
