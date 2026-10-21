import { Metadata } from 'next';
import { DocsClient } from './DocsClient';

export const metadata: Metadata = {
  title: 'Documentation & Guide d’utilisation — New Era Medical Club',
  description:
    'Documentation complète du système de formulaires, des 11 types de champs, de la navigation admin et du studio d’emails IA propulsé par Gemini 3.8 Flash.',
};

export default function DocsPage() {
  return <DocsClient />;
}
