# ClinicPal

A small clinic management app for patients and staff: appointment booking, examinations, prescriptions, medical certificates, referrals, stock inventory, and billing.

Built with Next.js 16 (App Router, React 19), Prisma + PostgreSQL, NextAuth (credentials), Tailwind CSS, react-hook-form + zod, and Vitest.

## Getting started

### Prerequisites

- Node.js 20+
- A PostgreSQL database

### Setup

```bash
npm install
```

Create `.env` in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/clinicpal"
NEXTAUTH_SECRET="<random-string>"
NEXTAUTH_URL="http://localhost:3000"
```

Create the database tables and seed demo data:

```bash
npx prisma db push
npx prisma db seed
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The seed creates a single built-in admin account: `admin@clinicpal.com` / `password123`. Everything else — staff, patients, appointments, stock — is created through the app. Override the defaults with `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` and `SEED_ADMIN_NAME`. Re-running the seed is safe: if the account already exists it is left alone (password included) and only re-activated as `ADMIN`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |

## Project structure

```
app/                  Next.js App Router routes (pages + /api routes)
  api/                Server-side handlers (auth, appointments, encounters,
                      stock, billing, notifications, PDF print)
  patient/            Patient portal (dashboard, appointments, profile)
  staff/              Staff portal (queue, patients, stock, revenue,
                      examination workspace)
components/           Reusable UI primitives (Button, TextField, Modal,
                      StatusBadge, StatCard, PageHeader, documents.*)
modules/              Domain services (appointments, billing, encounters,
                      patients, stock) — pure logic, called by /api handlers
lib/                  Cross-cutting helpers (auth, db, rbac, notifications,
                      PDF templates)
prisma/               Prisma schema and seed
tests/                Shared test helpers
```

## Domain model

- **Patients** book **Appointments** with **Staff** (roles: `RECEPTIONIST`, `NURSE`, `DOCTOR`, `ADMIN`).
- A `CONFIRMED` appointment can be opened by a `DOCTOR` as an **Encounter** with chief complaint, examination findings, diagnosis, and plan.
- During an encounter the doctor can issue **Prescriptions** (internal — drawn from stock, or external), **Medical Certificates**, and **Referrals**. Drafts can be deleted; once issued they are immutable and can be downloaded as PDFs.
- **Stock** is tracked with reorder thresholds; issuing an internal prescription debits the corresponding stock items.
- Completing an appointment can generate an **Invoice**; admins see month-to-date revenue metrics.

## Authentication & authorisation

- NextAuth with credentials provider; JWT sessions.
- Two account tables: `Patient` and `Staff`. The provider tries each and stamps the session `role`.
- `lib/rbac.ts` exposes `requireRole(roles)` for API handlers. Patient routes check `session.user.role === 'PATIENT'` directly.

## Forms

All forms use [react-hook-form](https://react-hook-form.com/) with [zod](https://zod.dev/) schemas via `@hookform/resolvers/zod`. Form value types are inferred with `z.infer<typeof schema>`. The prescription form uses `useFieldArray` for dynamic medication rows.

## Tests

Vitest with `jsdom` environment. Handlers are tested in isolation by mocking `@/lib/rbac`, `next-auth/next`, `@/lib/db`, and the service modules. PDF routes mock `@react-pdf/renderer`'s `renderToBuffer`. See `tests/helpers.ts` for the shared `setSession`, `setRbac`, `makeRequest`, `withParams`, and `expectJson` helpers.

```bash
npm test           # one-shot
npm run test:watch # watch mode
```

## Useful Prisma commands

```bash
npx prisma studio          # open the GUI
npx prisma db push         # apply schema.prisma to the database
npx prisma db push --force-reset  # drop everything and recreate from schema
npx prisma generate        # regenerate the client after schema changes
```
