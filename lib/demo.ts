/**
 * Demo mode runs the UI against static fixture data when Supabase
 * credentials are not configured. Enable by leaving
 * NEXT_PUBLIC_SUPABASE_URL empty (the default before setup).
 */
export function isDemoMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return !url || url.includes('YOUR-PROJECT-REF');
}

export const DEMO_USER_EMAIL = 'demo@catalog-cms.local';

export const DEMO_BLOCKED = {
  success: false as const,
  error: 'Demo mode — connect Supabase to save changes. Browse the UI freely for now.',
};
