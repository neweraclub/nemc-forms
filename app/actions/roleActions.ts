'use server';

import { getAdminSession } from '@/lib/auth';
import { TargetRoleDefinition } from '@/types/form';
import {
  fetchCloudRoles,
  saveCloudRoles,
  deleteCloudRole,
} from '@/lib/supabase/cloud-registry';
import { revalidatePath } from 'next/cache';

export async function getTargetRolesAction(): Promise<{
  success: boolean;
  roles: TargetRoleDefinition[];
  error?: string;
}> {
  try {
    const roles = await fetchCloudRoles();
    return {
      success: true,
      roles: roles || [],
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('getTargetRolesAction error:', err);
    return { success: false, roles: [], error: msg };
  }
}

export async function saveTargetRoleAction(
  roleData: Omit<TargetRoleDefinition, 'created_at' | 'id'> & { id?: string; created_at?: string }
): Promise<{
  success: boolean;
  role?: TargetRoleDefinition;
  error?: string;
}> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
    }

    if (!roleData.name || !roleData.name.trim()) {
      return { success: false, error: 'Le nom du rôle ou public cible est obligatoire.' };
    }

    const currentRoles = (await fetchCloudRoles()) || [];
    const roleId = roleData.id || `role_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullRole: TargetRoleDefinition = {
      ...roleData,
      id: roleId,
      name: roleData.name.trim(),
      description: (roleData.description || '').trim(),
      color: roleData.color || '#3B33FF',
      icon: roleData.icon || 'target',
      created_at: roleData.created_at || new Date().toISOString(),
    };

    const existingIdx = currentRoles.findIndex((r) => r.id === roleId);
    if (existingIdx >= 0) {
      currentRoles[existingIdx] = fullRole;
    } else {
      currentRoles.push(fullRole);
    }

    const saved = await saveCloudRoles(currentRoles);
    if (!saved) {
      return { success: false, error: 'Échec de la sauvegarde dans la base de données.' };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/roles');
    return { success: true, role: fullRole };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('saveTargetRoleAction error:', err);
    return { success: false, error: msg };
  }
}

export async function deleteTargetRoleAction(roleId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
    }

    await deleteCloudRole(roleId);

    revalidatePath('/admin');
    revalidatePath('/admin/roles');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('deleteTargetRoleAction error:', err);
    return { success: false, error: msg };
  }
}
