'use client';

import React, { useEffect, useState } from 'react';

export interface ToastPayload {
  id?: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

const STORAGE_KEY = 'nemc_admin_toast_flash';

/**
 * Trigger an admin notification toast anywhere in client code.
 * Works across page reloads and transitions via sessionStorage flash fallback.
 */
export function showAdminToast(payload: ToastPayload) {
  if (typeof window === 'undefined') return;

  const toastData = {
    ...payload,
    id: payload.id || Math.random().toString(36).substring(2, 9),
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toastData));
  } catch {
    // sessionStorage quota or disabled
  }

  window.dispatchEvent(new CustomEvent('nemc_admin_toast', { detail: toastData }));
}

export function AdminToastContainer() {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    // Check sessionStorage on mount / route transition
    const initTimer = setTimeout(() => {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          sessionStorage.removeItem(STORAGE_KEY);
          const parsed = JSON.parse(stored) as ToastPayload;
          setToast(parsed);
        }
      } catch {
        // ignore
      }
    }, 0);

    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastPayload>;
      if (customEvent.detail) {
        setToast(customEvent.detail);
        // Clear flash if handled
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('nemc_admin_toast', handleToastEvent);
    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('nemc_admin_toast', handleToastEvent);
    };
  }, []);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 5500);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <aside
      aria-label="Notifications d'administration"
      className="fixed top-5 right-5 z-[9999] max-w-md w-[calc(100vw-2.5rem)] pointer-events-auto transition-all duration-300"
    >
      <div
        className={`p-4 rounded-2xl border shadow-xl backdrop-blur-md flex items-start gap-3.5 ${
          isSuccess
            ? 'bg-white/95 border-[#86EFAC] text-[#14532D] shadow-[#16A34A]/10'
            : isError
            ? 'bg-white/95 border-[#FECACA] text-[#7F1D1D] shadow-[#DC2626]/10'
            : 'bg-white/95 border-[#E6DFD5] text-[#18181B] shadow-black/10'
        }`}
        role="alert"
      >
        {/* Icon */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isSuccess
              ? 'bg-[#DCFCE7] text-[#16A34A]'
              : isError
              ? 'bg-[#FEF2F2] text-[#DC2626]'
              : 'bg-[#F4F4F5] text-[#52525B]'
          }`}
        >
          {isSuccess ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : isError ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pt-0.5">
          {toast.title && (
            <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5">
              {toast.title}
            </h4>
          )}
          <p className="text-xs sm:text-sm font-medium leading-snug break-words">
            {toast.message}
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setToast(null)}
          className="text-[#71717A] hover:text-[#18181B] p-1 rounded-lg hover:bg-black/5 transition"
          aria-label="Fermer la notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
