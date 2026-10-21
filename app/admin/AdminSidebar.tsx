'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AdminUserSession } from '@/lib/auth';
import { logoutAction } from '@/app/actions/authActions';

interface AdminSidebarProps {
  user: AdminUserSession;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navigatingHref, setNavigatingHref] = useState<string | null>(null);

  React.useEffect(() => {
    setNavigatingHref(null);
  }, [pathname]);

  const navItems = [
    {
      label: 'Formulaires',
      href: '/admin',
      active:
        pathname === '/admin' ||
        (pathname.startsWith('/admin/') &&
          !pathname.startsWith('/admin/stats') &&
          !pathname.startsWith('/admin/forms/new') &&
          !pathname.startsWith('/admin/emails') &&
          !pathname.startsWith('/admin/docs')),
      icon: (
        <svg className="w-4 h-4 mr-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: 'Créer un formulaire',
      href: '/admin/forms/new',
      active: pathname === '/admin/forms/new',
      icon: (
        <svg className="w-4 h-4 mr-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      label: 'Emails IA (Gemini)',
      href: '/admin/emails',
      active: pathname.startsWith('/admin/emails'),
      icon: (
        <svg className="w-4 h-4 mr-2.5 shrink-0 text-[#E53888]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      label: 'Statistiques',
      href: '/admin/stats',
      active: pathname.startsWith('/admin/stats'),
      icon: (
        <svg className="w-4 h-4 mr-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: 'Documentation',
      href: '/docs',
      active: pathname === '/docs' || pathname.startsWith('/admin/docs'),
      icon: (
        <svg className="w-4 h-4 mr-2.5 shrink-0 text-[#3B33FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-white border-b border-[#E6DFD5] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#E6DFD5] bg-white p-0.5 shrink-0 flex items-center justify-center">
            <Image
              src="/logo_light_mode.png"
              alt="New Era Medical Club Logo"
              width={28}
              height={28}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#18181B] block">
              New Era Medical Club
            </span>
            <span className="text-[10px] text-[#71717A] block">Administration</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 border border-[#E6DFD5] rounded-lg text-[#18181B] hover:bg-[#FAF8F5]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar Overlay on Mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-[#E6DFD5] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-[#E6DFD5]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#E6DFD5] bg-white p-1 shrink-0 flex items-center justify-center shadow-xs">
                <Image
                  src="/logo_light_mode.png"
                  alt="New Era Medical Club Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#52525B] block">
                  Club Médical
                </span>
                <span className="text-sm font-extrabold text-[#18181B] tracking-tight block">
                  New Era
                </span>
              </div>
            </div>
            <h2 className="text-base font-bold text-[#18181B]">Espace Superadmin</h2>
            <div className="mt-1.5 inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#3B33FF]/10 text-[#3B33FF]">
              {user.role}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isNavigating = navigatingHref === item.href;
              const isSelected = isNavigating || (!navigatingHref && item.active);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => {
                    setMobileOpen(false);
                    if (pathname !== item.href) {
                      setNavigatingHref(item.href);
                    }
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition duration-150 ${
                    isSelected
                      ? 'bg-[#18181B] text-white shadow-xs'
                      : 'text-[#3F3F46] hover:bg-[#FAF8F5] hover:text-[#18181B]'
                  }`}
                >
                  <span className="flex items-center">
                    {item.icon}
                    {item.label}
                  </span>
                  {isNavigating && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout Footer */}
        <div className="p-4 border-t border-[#E6DFD5] bg-[#FAF8F5]">
          <div className="mb-3">
            <div className="text-xs font-bold text-[#18181B] truncate">
              {user.first_name} {user.last_name}
            </div>
            <div className="text-[11px] text-[#71717A] truncate font-mono">
              {user.email}
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full min-h-[38px] px-3 py-1.5 border border-[#E6DFD5] bg-white hover:bg-[#FEE2E2] text-xs font-semibold text-[#DC2626] rounded-lg transition text-center"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
