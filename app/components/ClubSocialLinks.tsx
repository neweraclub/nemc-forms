import React from 'react';
import Image from 'next/image';

interface SocialLink {
  name: string;
  icon: string;
  url: string;
}

const SOCIAL_NETWORKS: SocialLink[] = [
  {
    name: 'Instagram',
    icon: '/instagram.png',
    url: 'https://instagram.com/newera.mc',
  },
  {
    name: 'Facebook',
    icon: '/facebook.png',
    url: 'https://facebook.com/newera.mc',
  },
  {
    name: 'Telegram',
    icon: '/telegram.png',
    url: 'https://t.me/newera_mc',
  },
  {
    name: 'TikTok',
    icon: '/tiktok.png',
    url: 'https://tiktok.com/@newera.mc',
  },
  {
    name: 'LinkedIn',
    icon: '/linkedin.png',
    url: 'https://linkedin.com/company/neweraclub',
  },
  {
    name: 'Site Web',
    icon: '/website.png',
    url: 'http://form.new-era-medical-club-univ-ouargla.dz',
  },
];

export function ClubSocialLinks({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 flex-wrap ${className}`} suppressHydrationWarning>
      {SOCIAL_NETWORKS.map((social) => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`Suivez New Era Medical Club sur ${social.name}`}
          className="w-7 h-7 rounded-lg border border-[#E6DFD5] bg-white hover:bg-[#FAF8F5] flex items-center justify-center p-1.5 transition opacity-80 hover:opacity-100 hover:scale-105"
        >
          <Image
            src={social.icon}
            alt={social.name}
            width={18}
            height={18}
            className="w-full h-full object-contain"
          />
        </a>
      ))}
    </div>
  );
}
