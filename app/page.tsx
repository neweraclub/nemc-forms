import Link from 'next/link';
import Image from 'next/image';
import { ClubSocialLinks } from '@/app/components/ClubSocialLinks';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col justify-between p-4 sm:p-8 md:p-12 max-w-5xl mx-auto">
      {/* Top Bar */}
      <header className="flex items-center justify-between pb-6 border-b border-[#E6DFD5]">
        <div className="flex items-center gap-3">
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
            <span className="text-xs sm:text-sm font-bold tracking-tight text-[#18181B] block">
              New Era Medical Club
            </span>
            <span className="text-[10px] sm:text-[11px] text-[#71717A] block">
              Faculté de Médecine &bull; Univ. Ouargla
            </span>
          </div>
        </div>
        <Link
          href="/admin"
          className="text-xs font-semibold text-[#52525B] hover:text-[#18181B] transition underline underline-offset-4"
        >
          Espace Administration
        </Link>
      </header>

      {/* Main Hero Card with Cover Banner */}
      <div className="my-8 sm:my-12">
        <div className="relative w-full h-44 sm:h-64 md:h-72 rounded-2xl overflow-hidden border border-[#E6DFD5] shadow-xs mb-8 bg-[#FAF8F5]">
          <Image
            src="/cover.png"
            alt="New Era Medical Club Banner"
            fill
            priority
            className="object-cover"
          />
        </div>

        <div className="max-w-2xl">
          <p className="text-xs sm:text-sm font-semibold text-[#3B33FF] tracking-wide uppercase mb-2">
            Plateforme Officielle de Formulaires
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#18181B] tracking-tight leading-tight mb-4">
            Candidatures & Inscriptions Étudiantes
          </h1>
          <p className="text-base sm:text-lg text-[#52525B] leading-relaxed mb-8">
            Remplissez vos formulaires de candidature en toute simplicité, sur mobile (questions 3 par 3) comme sur ordinateur (affichage double volet), avec sauvegarde automatique de vos réponses.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              href="/f/recrutement-2026"
              className="brand-gradient-btn min-h-[48px] px-8 py-3.5 rounded-lg text-sm sm:text-base font-semibold text-white shadow-xs text-center inline-flex items-center justify-center"
            >
              Formulaire de Recrutement 2026
            </Link>
            <Link
              href="/admin"
              className="min-h-[48px] px-6 py-3.5 rounded-lg text-sm font-semibold text-[#18181B] bg-white border border-[#E6DFD5] hover:bg-[#FAF8F5] transition text-center inline-flex items-center justify-center"
            >
              Tableau de Bord Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-6 border-t border-[#E6DFD5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#71717A]">
        <div>
          <div>New Era Medical Club &bull; Université Kasdi Merbah Ouargla</div>
          <div className="text-[11px] text-[#A1A1AA] mt-0.5">Tous droits réservés.</div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-[11px] font-semibold text-[#52525B]">Rejoignez-nous :</span>
          <ClubSocialLinks />
        </div>
      </footer>
    </main>
  );
}
