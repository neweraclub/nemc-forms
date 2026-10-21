import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createServiceRoleServerClient } from './supabase/server';

export interface AdminUserSession {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'superadmin' | 'admin' | 'professor';
}

const COOKIE_NAME = 'nemc_admin_session';
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'nemc_super_secret_session_signing_key_2026_univ_ouargla';

// Static default credentials fallback
const STATIC_ADMIN_EMAIL =
  process.env.STATIC_ADMIN_EMAIL || 'admin@new-era-medical-club-univ-ouargla.dz';
const STATIC_ADMIN_PASSWORD = process.env.STATIC_ADMIN_PASSWORD || 'admin123';

/**
 * Sign session payload into token: base64(payload).signature
 */
export function signSession(payload: AdminUserSession): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

/**
 * Verify and decode session token
 */
export function verifySession(token: string): AdminUserSession | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(data)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    return parsed as AdminUserSession;
  } catch {
    return null;
  }
}

/**
 * Authenticates against Supabase users table and static credentials fallback
 */
export async function authenticateAdmin(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: AdminUserSession; error?: string }> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput;

  // 1. Check Static Admin Credentials first
  if (
    STATIC_ADMIN_EMAIL &&
    STATIC_ADMIN_PASSWORD &&
    email === STATIC_ADMIN_EMAIL.toLowerCase() &&
    password === STATIC_ADMIN_PASSWORD
  ) {
    return {
      success: true,
      user: {
        id: '00000000-0000-0000-0000-000000000099',
        email: STATIC_ADMIN_EMAIL,
        first_name: 'Lead',
        last_name: 'Superadmin',
        role: 'superadmin',
      },
    };
  }

  // 2. Query Supabase public.users table
  const serviceClient = createServiceRoleServerClient();
  if (serviceClient) {
    try {
      const { data: user, error } = await serviceClient
        .from('users')
        .select('*')
        .ilike('email', email)
        .maybeSingle();

      if (error || !user) {
        return {
          success: false,
          error: 'Adresse email ou mot de passe incorrect.',
        };
      }

      if (!user.is_active) {
        return {
          success: false,
          error: 'Ce compte utilisateur a été désactivé.',
        };
      }

      // Check role: must be superadmin to access full admin dashboard
      if (user.role !== 'superadmin') {
        return {
          success: false,
          error: 'Accès restreint. Seuls les superadministrateurs ont accès au tableau de bord.',
        };
      }

      // Compare password hash
      const isValid = bcrypt.compareSync(password, user.password_hash);
      if (!isValid) {
        return {
          success: false,
          error: 'Adresse email ou mot de passe incorrect.',
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
        },
      };
    } catch (err) {
      console.error('[Auth Error]', err);
    }
  }

  return {
    success: false,
    error: 'Adresse email ou mot de passe incorrect.',
  };
}

/**
 * Gets currently logged in admin session from cookie
 */
export async function getAdminSession(): Promise<AdminUserSession | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie || !cookie.value) return null;
  return verifySession(cookie.value);
}

/**
 * Sets admin session cookie (HTTP-only)
 */
export async function setAdminSession(user: AdminUserSession) {
  const token = signSession(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clears admin session cookie
 */
export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
