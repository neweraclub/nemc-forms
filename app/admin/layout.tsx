import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminLayoutClient } from './AdminLayoutClient';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect('/login');
  }

  return <AdminLayoutClient user={session}>{children}</AdminLayoutClient>;
}
