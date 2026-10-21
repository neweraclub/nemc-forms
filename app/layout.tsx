import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      'http://form.new-era-medical-club-univ-ouargla.dz'
  ),
  title: 'Club Médical New Era — Formulaires & Recrutement',
  description:
    'Plateforme officielle de candidatures et formulaires pour le Club Médical New Era.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FAF6EE',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${plusJakarta.variable} h-full`}>
      <body className="min-h-full font-sans bg-[#FAF6EE] text-[#18181B] antialiased selection:bg-[#E53888]/20 selection:text-[#18181B]">
        {children}
      </body>
    </html>
  );
}
