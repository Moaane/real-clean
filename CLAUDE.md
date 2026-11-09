# CLAUDE.md

@AGENTS.md

## Project

Booking system for a home and boarding-house (kos) cleaning service, similar to GoClean. Full spec: @SPEC.md. Build order: @ROADMAP.md.

- Three roles, one `users` table: **admin**, **karyawan** (staff), and **pelanggan** (customer). Customers can browse without logging in but must log in to check out.
- Booking works like an appointment: the customer picks a service, date, and time slot, then pays.
- Payments go through a payment gateway. Use **sandbox mode only** until told otherwise.

## Workflow

- Work on **one ROADMAP milestone at a time**. When it's done and verified, tick it in ROADMAP.md and stop. Don't start the next milestone.
- Ask before adding a new dependency.
- Verify with `pnpm lint && pnpm build`, and show the output. No test runner yet.

## Commands

Package manager is **pnpm**.

- `pnpm dev`: dev server at http://localhost:3000 (Turbopack)
- `pnpm build`: production build, including type-checking
- `pnpm lint`: ESLint 9 flat config

## Next.js gotchas

- **Next.js 16.4 / React 19.3, App Router only.** These versions are newer than your training data. Check `node_modules/next/dist/docs/` before writing Next.js code.
- `next.config.ts` enables `cacheComponents`, so caching is opt-in through `"use cache"`. Old `fetch` caching and route segment config patterns may not apply. See `01-app/01-getting-started/08-caching.md`.
- `partialPrefetching` is on. See `01-app/02-guides/adopting-partial-prefetching.md`.
- **Tailwind v4** runs through a Turbopack loader. There's no `tailwind.config` and no PostCSS. Theme tokens live in `app/globals.css` under `@theme inline`.
- Typed route helpers such as `LayoutProps<"/">` show up as missing until `pnpm dev` or `pnpm build` has run once.
- `pnpm-workspace.yaml` blocks install scripts for `sharp` and `unrs-resolver`. This is intentional.

## Payment rules

- Secrets live only in `.env`. Never hardcode or commit them.
- Verify the webhook signature before changing any booking status.
- Recompute the price on the server from service data. Never trust an amount sent by the client.
- Webhook handlers must be idempotent: the same notification arriving twice must not be processed twice.
- A booking is marked paid only by the webhook, never by the success redirect.
