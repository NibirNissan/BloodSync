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
- **Find Donors** — Filterable donor grid by blood group and district
- **Register as Donor** — Multi-field signup form
- **Login** — Role-based login (Super Admin, Blood Donor, Normal User)
- **Dashboard** — Admin view with summary stats, blood group breakdown, recent activity

### User Roles
- **Super Admin** — Full access, can verify donations and manage users
- **Blood Donor** — Can update profile, track requests and verifications
- **Normal User (Guest)** — Can browse donors and submit requests

### Database Tables
- **donors** — name, blood_group, district, whatsapp_number, smoker, last_donation_date, is_willing_to_donate, total_requests_received, successful_donations
- **requests** — donor_id, requester_identifier, status (pending/accepted/completed/rejected)
- **donations_verification** — donor_id, recipient_details, proof_document_url, verification_status (pending/verified/rejected)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
