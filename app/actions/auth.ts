'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDemoMode } from '@/lib/demo';

export interface AuthResult {
  error?: string;
}

export async function login(formData: FormData): Promise<AuthResult> {
  if (isDemoMode()) {
    redirect('/admin');
  }

  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Invalid email or password.' };
  }

  redirect('/admin');
}

export async function logout() {
  if (isDemoMode()) {
    redirect('/login');
  }

  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/login');
}
