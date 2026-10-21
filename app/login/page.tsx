import Image from 'next/image';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from './LoginForm';

export const metadata = {
  title: 'Connexion Superadmin — Club Médical New Era',
  description: 'Portail d’administration sécurisé pour le Club Médical New Era.',
};

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect('/admin');
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#FAF6EE]">
      <div className="w-full max-w-md bg-white border border-[#E6DFD5] rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#E6DFD5] bg-white p-1 shrink-0 flex items-center justify-center shadow-xs">
            <Image
              src="/logo_light_mode.png"
              alt="Club Médical New Era Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#52525B] block">
              Club Médical New Era
            </span>
            <span className="text-[11px] text-[#71717A] block">
              Faculté de Médecine &bull; Univ. Ouargla
            </span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] mb-1">
          Espace Superadmin
        </h1>
        <p className="text-xs text-[#52525B] mb-6">
          Connectez-vous pour gérer les formulaires, modifier les questions et consulter les statistiques.
        </p>

        <LoginForm />

        <div className="mt-8 pt-4 border-t border-[#E6DFD5] bg-[#FAF8F5] p-3 rounded-lg text-xs text-[#71717A] space-y-1">
          <p className="font-semibold text-[#18181B]">Comptes autorisés :</p>
          <p>&bull; Compte Superadmin de votre table PostgreSQL <code>users</code></p>
          <p>&bull; Ou identifiants statiques configurés dans <code>.env.local</code> (défaut : <code>admin@new-era-medical-club-univ-ouargla.dz</code> / <code>admin123</code>)</p>
        </div>
      </div>
    </main>
  );
}
