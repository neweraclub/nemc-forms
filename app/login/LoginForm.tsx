'use client';

import React, { useActionState } from 'react';
import { loginAction, LoginActionResult } from '@/app/actions/authActions';

const initialState: LoginActionResult = {
  success: false,
};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#F87171]/50 text-xs sm:text-sm font-medium text-[#B91C1C]"
        >
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-xs sm:text-sm font-semibold text-[#18181B] mb-1.5"
        >
          Adresse email universitaire ou superadmin
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          placeholder="admin@new-era-medical-club-univ-ouargla.dz"
          className="w-full min-h-[46px] px-3.5 py-2.5 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20 transition"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs sm:text-sm font-semibold text-[#18181B] mb-1.5"
        >
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full min-h-[46px] px-3.5 py-2.5 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20 transition"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="brand-gradient-btn w-full min-h-[48px] px-6 py-2.5 rounded-lg text-sm font-semibold text-white shadow-xs focus:ring-2 focus:ring-[#3B33FF] disabled:opacity-50 mt-2"
      >
        {isPending ? 'Vérification en cours...' : 'Se connecter au tableau de bord'}
      </button>
    </form>
  );
}
