'use client';

import React, { useState, useActionState } from 'react';
import { loginAction, LoginActionResult } from '@/app/actions/authActions';

const initialState: LoginActionResult = {
  success: false,
};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

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
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full min-h-[46px] pl-3.5 pr-11 py-2.5 text-sm text-[#18181B] bg-white border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:ring-2 focus:ring-[#3B33FF]/20 transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#71717A] hover:text-[#18181B] transition focus:outline-hidden"
          >
            {showPassword ? (
              /* Eye Slash Icon (Hide) */
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              /* Eye Icon (Show) */
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
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
