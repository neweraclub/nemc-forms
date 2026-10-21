'use server';

import { authenticateAdmin, setAdminSession, clearAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export interface LoginActionResult {
  success: boolean;
  error?: string;
}

export async function loginAction(
  prevState: LoginActionResult | null,
  formData: FormData
): Promise<LoginActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return {
      success: false,
      error: 'Veuillez saisir votre adresse email et votre mot de passe.',
    };
  }

  const res = await authenticateAdmin(email, password);
  if (!res.success || !res.user) {
    return {
      success: false,
      error: res.error || 'Identifiants invalides.',
    };
  }

  await setAdminSession(res.user);
  redirect('/admin');
}

export async function logoutAction() {
  await clearAdminSession();
  redirect('/login');
}
