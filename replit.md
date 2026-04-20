# Workspace

## Overview

pnpm workspace monorepo using TypeScript. This is the BloodSync blood donation web application.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Tailwind CSS v4, shadcn/ui, Framer Motion
- **Design**: Dark mode only, Glassmorphism UI

## Application: BloodSync

A blood donation web app connecting donors with people in need.

### Features
- **Home** — Hero with live stats (total donors, donations, blood groups)
- **Find Donors** — Filterable donor grid; requires login to request a donor's contact
- **Register as Donor** — Donor signup with email/password (Supabase Auth) + donor profile
- **Register as User** (`/register-user`) — Normal user signup with email/password
- **Login** (`/login`) — Unified Supabase Auth login + Admin PIN tab; role-based redirect
- **User Profile** (`/user-profile`) — Normal user dashboard listing their blood requests
- **Donor Dashboard** (`/donor-dashboard`) — Donor profile, availability toggle, verification upload
- **Admin Dashboard** (`/dashboard`) — Stats, donor CRUD, verification review (PIN-gated)

### Auth & Roles (Supabase Auth)
- **AuthProvider** (`src/lib/auth.tsx`) wraps the app, listens to `onAuthStateChange`, exposes `user`, `profile`, `signUp`, `signInWithPassword`, `signOut`.
- Role lives in `public.profiles.role` (`'admin' | 'donor' | 'normal'`).
- Post-login routing helper `routeForRole`: admin → `/dashboard`, donor → `/donor-dashboard`, normal → `/user-profile`.
- Donor signup: creates auth user → upserts profile (role='donor') → inserts donors row with `auth_uid` linking to `auth.users.id`.
- To promote a user to admin, run in Supabase SQL editor:
  `update public.profiles set role = 'admin' where email = 'you@example.com';`
- **Important Supabase setting**: Auth → Providers → Email → disable "Confirm email" so signups can log in immediately.

### Database Tables (Supabase)
- **profiles** — id (=auth.users.id), email, full_name, role
- **donors** — name, blood_group, district, whatsapp_number, smoker, last_donation_date, is_willing_to_donate, total_requests_received, successful_donations, **auth_uid** (FK → auth.users)
- **requests** — donor_id, requester_identifier (legacy), **requester_uid** (FK → auth.users), status
- **donations_verification** — donor_id, recipient_details, proof_document_url, verification_status

### Schema bootstrap
Run `init.sql` once against the Supabase project (SQL Editor or psql). It is idempotent and adds new columns/policies in place.

### Known follow-ups
- The Admin Dashboard (`/dashboard`) still reads from the legacy `@workspace/api-server` (Express + Drizzle) instead of Supabase, so donors registered through the new Supabase flow will not appear there yet. Migrating its data layer to Supabase is the next logical step.
- Donors registered before the auth migration have `auth_uid = NULL` and cannot log into `/donor-dashboard` until they re-register or are claimed manually.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
