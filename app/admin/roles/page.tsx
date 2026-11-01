import { getTargetRolesAction } from '@/app/actions/roleActions';
import { getAdminForms } from '@/lib/supabase/admin';
import { RolesManagerClient } from './RolesManagerClient';

export const metadata = {
  title: 'Publics Cibles & Rôles — Administration New Era Medical Club',
  description: 'Définissez les catégories et publics cibles pour orienter les formulaires.',
};

export const dynamic = 'force-dynamic';

export default async function AdminRolesPage() {
  const [rolesRes, formsSummaries] = await Promise.all([
    getTargetRolesAction(),
    getAdminForms(),
  ]);

  const forms = formsSummaries.map((f) => f.form);

  return (
    <RolesManagerClient
      initialRoles={rolesRes.roles || []}
      forms={forms}
    />
  );
}
