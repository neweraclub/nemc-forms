'use client';

import React from 'react';
import {
  Stethoscope,
  GraduationCap,
  UserCheck,
  Globe,
  Target,
  Building2,
  Microscope,
  Users,
  ClipboardList,
  Syringe,
  Pill,
  HeartPulse,
  Award,
  Sparkles,
  FileText,
  Mail,
  Phone,
  Hash,
  CircleDot,
  CheckSquare,
  Calendar,
  Paperclip,
  Scale,
  HelpCircle,
  LucideProps,
} from 'lucide-react';

interface DynamicIconProps extends Omit<LucideProps, 'name'> {
  name?: string | null;
  className?: string;
}

export function RoleIcon({ name, className = 'w-4 h-4', ...props }: DynamicIconProps) {
  const key = (name || '').trim().toLowerCase();

  switch (key) {
    case 'student':
    case 'graduation-cap':
      return <GraduationCap className={className} {...props} />;
    case 'resident':
    case 'stethoscope':
      return <Stethoscope className={className} {...props} />;
    case 'professor':
    case 'user-check':
    case 'school':
      return <UserCheck className={className} {...props} />;
    case 'other':
    case 'globe':
      return <Globe className={className} {...props} />;
    case 'hospital':
      return <Building2 className={className} {...props} />;
    case 'microscope':
      return <Microscope className={className} {...props} />;
    case 'team':
    case 'users':
      return <Users className={className} {...props} />;
    case 'clipboard':
      return <ClipboardList className={className} {...props} />;
    case 'syringe':
      return <Syringe className={className} {...props} />;
    case 'pill':
      return <Pill className={className} {...props} />;
    case 'caduceus':
    case 'heart-pulse':
      return <HeartPulse className={className} {...props} />;
    case 'award':
    case 'badge':
      return <Award className={className} {...props} />;
    case 'sparkles':
      return <Sparkles className={className} {...props} />;
    case 'target':
    default:
      return <Target className={className} {...props} />;
  }
}

export function FieldTypeIcon({
  type,
  className = 'w-4 h-4',
  ...props
}: {
  type: string;
  className?: string;
} & LucideProps) {
  switch (type) {
    case 'short_text':
      return <FileText className={className} {...props} />;
    case 'long_text':
      return <FileText className={className} {...props} />;
    case 'email':
      return <Mail className={className} {...props} />;
    case 'phone':
      return <Phone className={className} {...props} />;
    case 'number':
      return <Hash className={className} {...props} />;
    case 'radio':
      return <CircleDot className={className} {...props} />;
    case 'checkboxes':
      return <CheckSquare className={className} {...props} />;
    case 'select':
      return <CheckSquare className={className} {...props} />;
    case 'date':
      return <Calendar className={className} {...props} />;
    case 'file':
      return <Paperclip className={className} {...props} />;
    case 'consent':
      return <Scale className={className} {...props} />;
    default:
      return <HelpCircle className={className} {...props} />;
  }
}
