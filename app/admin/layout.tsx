import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminToastContainer } from './AdminToast';

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

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#18181B] flex flex-col lg:flex-row">
      <AdminSidebar user={session} />
      <AdminToastContainer />

      <main className="flex-1 lg:pl-64 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
