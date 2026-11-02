import { getAdminFormsWithFields, getAllAdminSubmissions } from '@/lib/supabase/admin';
import { AdminStatsClient } from './AdminStatsClient';

export const metadata = {
  title: 'Statistiques & Rapports — Administration New Era Medical Club',
};

export const dynamic = 'force-dynamic';

export default async function AdminStatsPage() {
  const formsData = await getAdminFormsWithFields();
  const submissions = await getAllAdminSubmissions();

  return <AdminStatsClient formsData={formsData} submissions={submissions} />;
}
