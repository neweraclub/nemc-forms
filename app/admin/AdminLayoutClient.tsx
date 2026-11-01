'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AdminUserSession } from '@/lib/auth';
import { AdminSidebar } from './AdminSidebar';
import { AdminToastContainer } from './AdminToast';

interface AdminLayoutClientProps {
  user: AdminUserSession;
  children: React.ReactNode;
}

export function AdminLayoutClient({ user, children }: AdminLayoutClientProps) {
  const pathname = usePathname();

  // Automatically collapse sidebar on Form Builder pages to maximize workspace canvas
  const isFormBuilderPage =
    pathname.startsWith('/admin/forms/new') ||
    (pathname.startsWith('/admin/forms/') && pathname.endsWith('/edit'));

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(isFormBuilderPage);

  // Sync collapse state when navigating
  useEffect(() => {
    if (isFormBuilderPage) {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, [pathname, isFormBuilderPage]);

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#18181B] flex flex-col">
      {/* Toast notifications */}
      <AdminToastContainer />

      {/* Main Admin Sidebar */}
      <AdminSidebar
        user={user}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 min-h-screen transition-all duration-200 ${
          sidebarCollapsed ? 'lg:pl-0' : 'lg:pl-64'
        }`}
      >
        {/* Floating / Top Toggle Bar when Sidebar is Collapsed on desktop */}
        {sidebarCollapsed && (
          <div className="hidden lg:flex items-center justify-between px-6 py-2.5 bg-white/80 backdrop-blur-xs border-b border-[#E6DFD5] sticky top-0 z-30 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E6DFD5] bg-white text-xs font-semibold text-[#18181B] hover:bg-[#FAF8F5] transition shadow-2xs cursor-pointer"
                title="Afficher le menu latéral"
              >
                <svg className="w-4 h-4 text-[#3B33FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Menu Admin</span>
              </button>

              <span className="text-xs text-[#71717A] border-l border-[#E6DFD5] pl-3 font-medium">
                Mode plein écran actif • Espace de travail agrandi
              </span>
            </div>

            <div className="text-xs font-bold text-[#52525B]">
              New Era Medical Club
            </div>
          </div>
        )}

        <div
          className={`mx-auto py-6 sm:py-8 transition-all ${
            sidebarCollapsed
              ? 'w-full max-w-[1700px] px-4 sm:px-6 lg:px-10'
              : 'max-w-[1400px] px-4 sm:px-6 lg:px-8'
          }`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
