// ==============================================================================
// NEW ERA CLUB (Club Médical New Era) — Data Types
// ==============================================================================

export type FormStatus = 'draft' | 'open' | 'closed';
export type FormLayout = 'single' | 'stepped';

export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'phone'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkboxes'
  | 'date'
  | 'file'
  | 'consent';

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface FieldShowIf {
  field: string;
  equals?: string | number | boolean;
  notEquals?: string | number | boolean;
  in?: Array<string | number>;
}

export interface FormFieldRecord {
  id: string;
  form_id: string;
  position: number;
  type: FieldType;
  key: string;
  label: string;
  help_text?: string | null;
  placeholder?: string | null;
  required: boolean;
  options?: FieldOption[] | null;
  validation?: FieldValidation | null;
  show_if?: FieldShowIf | null;
  created_at?: string;
}

export interface FormRecord {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  status: FormStatus;
  opens_at?: string | null;
  closes_at?: string | null;
  max_responses?: number | null;
  confirmation_message?: string | null;
  notify_emails?: string[] | null;
  send_receipt: boolean;
  receipt_email_field?: string | null;
  custom_email_subject?: string | null;
  custom_email_html?: string | null;
  layout: FormLayout;
  created_at?: string;
  updated_at?: string;
}

export interface SubmissionRecord {
  id: string;
  form_id: string;
  answers: Record<string, unknown>;
  submitter_email?: string | null;
  created_at: string;
  email_status: 'pending' | 'sent' | 'failed' | 'not_requested';
  ip_hash?: string | null;
  user_agent?: string | null;
  idempotency_key?: string | null;
}

export interface FormStateEvaluation {
  isAvailable: boolean;
  code: 'available' | 'draft' | 'closed' | 'not_yet_open' | 'expired' | 'capacity_reached';
  message: string;
  detail?: string;
}
