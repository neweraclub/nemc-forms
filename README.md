# NEMC Forms — New Era Medical Club

Custom form engine and recruitment platform built specifically for **New Era Medical Club (NEW ERA CLUB)**. Designed for medical students filling in forms on mobile devices between lectures, with draft autosave, resilient submissions, and instant email receipts.

![New Era Medical Club](https://img.shields.io/badge/Club%20M%C3%A9dical-New%20Era-3B33FF)
![Next.js](https://img.shields.io/badge/Next.js-16%20(App%20Router)-black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-3ECF8E)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

## Architecture & Features

1. **Mobile-First Dynamic Form Rendering (`/f/[slug]`)**:
   - Stepped layout showing one focused question at a time with touch targets (≥ 44px).
   - Brand Gradient Progress Thread (`#3B33FF` → `#8B3EE1` → `#E53888` → `#F97316`) that dynamically fills as you advance.
   - Client-side `localStorage` autosave so a browser refresh or network drop never loses entered answers.
   - Dynamic conditional questions (`show_if`) evaluated seamlessly on client and re-verified on server.
   - Accessible inline error indicators with `aria-describedby` and explicit non-color indicators.

2. **Server Action Submissions (`app/actions/submitForm.ts`)**:
   - Runtime dynamic Zod schema compiled directly from database field definitions.
   - Rejection of unknown keys via `.strict()`.
   - Hidden honeypot field (`_hp`) for zero-friction bot mitigation.
   - Per-IP rate limiting storing HMAC SHA-256 hashed IPs (raw IPs are never persisted).
   - Idempotency key to protect against accidental double submissions.
   - Resilient two-phase persistence: submissions stand even if outbound SMTP experiences downtime (`email_status: 'failed'`).

3. **Nodemailer Email Integration (`lib/mailer.ts`)**:
   - Team notifications with complete question-by-question tabular summaries.
   - Submitter receipt with confirmation reference code.
   - HTML table layout inline-styled and tested for Gmail and Outlook, with plain-text fallbacks.
   - Strict HTML escaping to prevent injection attacks.

4. **Admin Dashboard (`/admin` and `/admin/[slug]`)**:
   - Active form metrics and submission tallies.
   - Live submission search across names, emails, and answers.
   - Detailed candidate modal drawer.
   - One-click CSV export with UTF-8 BOM encoding for Excel/Numbers compatibility.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions, TypeScript)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Email**: [Nodemailer](https://nodemailer.com/) (runtime: `nodejs`)
- **Typography**: Plus Jakarta Sans

---

## Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/neweraclub/nemc-forms.git
cd nemc-forms
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and configure your credentials:

```bash
cp .env.example .env.local
```

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anon key / JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase secret key (bypasses RLS for submission insertion) |
| `SMTP_HOST` | Outbound SMTP host (e.g., `mail.new-era-medical-club-univ-ouargla.dz`) |
| `SMTP_PORT` | SMTP port (`587` or `465`) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | Sender display string (e.g. `"New Era Medical Club <event@new-era-medical-club-univ-ouargla.dz>"`) |
| `NEXT_PUBLIC_SITE_URL` | Base public URL (`http://form.new-era-medical-club-univ-ouargla.dz`) |

### 3. Database Migration

Run the SQL migration in your Supabase SQL Editor:
1. Copy contents of `supabase/migrations/001_initial_schema.sql` and execute in the SQL Editor.
2. Copy contents of `supabase/seeds/001_recruitment_seed.sql` to populate the sample recruitment form.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) or test the form directly at [http://localhost:3000/f/recrutement-2026](http://localhost:3000/f/recrutement-2026).

---

## Scripts

- `npm run dev` — Starts local development server
- `npm run build` — Compiles optimized production bundle
- `npm run start` — Runs production server
- `npm run lint` — Runs ESLint checks
- `npx tsc --noEmit` — Runs TypeScript typechecking

---

## License

Built for **New Era Medical Club**. All rights reserved.
