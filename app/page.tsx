import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col justify-between p-6 sm:p-12 max-w-4xl mx-auto">
      {/* Top Bar */}
      <header className="flex items-center justify-between pb-6 border-b border-[#E6DFD5]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#3B33FF]" />
          <span className="text-sm font-bold tracking-tight text-[#18181B]">
            CLUB MÉDICAL NEW ERA
          </span>
        </div>
        <Link
          href="/admin"
          className="text-xs font-semibold text-[#52525B] hover:text-[#18181B] transition underline underline-offset-4"
        >
          Espace Administration
        </Link>
      </header>

      {/* Main Hero Card */}
      <div className="my-auto py-12">
        <p className="text-xs sm:text-sm font-semibold text-[#3B33FF] tracking-wide uppercase mb-2">
          Plateforme Officielle de Formulaires
        </p>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#18181B] tracking-tight leading-tight max-w-2xl mb-4">
          Candidatures & Inscriptions Étudiantes
        </h1>
        <p className="text-base sm:text-lg text-[#52525B] max-w-xl leading-relaxed mb-8">
          Remplissez vos formulaires de candidature en toute simplicité, sur mobile comme sur ordinateur, avec sauvegarde automatique de vos réponses.
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

      {/* Footer */}
      <footer className="pt-6 border-t border-[#E6DFD5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#71717A]">
        <div>Club Médical New Era &bull; Tous droits réservés.</div>
        <div className="font-mono text-[11px]">Next.js &bull; Supabase &bull; Nodemailer</div>
      </footer>
    </main>
  );
}
