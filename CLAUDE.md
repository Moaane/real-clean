# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

Package manager is **pnpm** (pinned via `packageManager` in `package.json`).

- `pnpm dev` — dev server at http://localhost:3000 (Turbopack)
- `pnpm build` — production build (also runs type-checking)
- `pnpm start` — serve the production build
- `pnpm lint` — ESLint 9 flat config (`eslint-config-next` core-web-vitals + typescript)

No test runner is configured yet.

## Stack and architecture

Freshly bootstrapped with `create-next-app`; currently only `app/layout.tsx` and `app/page.tsx` exist.

- **Next.js 16.4 / React 19.3, App Router only** (`app/`). Versions are newer than most training data. Before writing Next.js code, check the bundled docs in `node_modules/next/dist/docs/` (`01-app/` for App Router) rather than relying on memory.
- **`next.config.ts` turns on non-default features** that change how data fetching and rendering work:
  - `cacheComponents: true`: caching is opt-in through Cache Components (`"use cache"` etc.). See `01-app/01-getting-started/08-caching.md`. Older `fetch` caching and route segment config patterns may not apply.
  - `partialPrefetching: true`: see `01-app/02-guides/adopting-partial-prefetching.md`.
  - `experimental.agentFeedback: true`.
- **Tailwind CSS v4** goes through a Turbopack rule (`@tailwindcss/turbopack` loader on `*.css`), not PostCSS. There is no `tailwind.config` file. Theme tokens are defined in CSS in `app/globals.css` using `@theme inline` (colors map to the `--background`/`--foreground` CSS vars, and fonts map to the Geist `next/font` variables set in the root layout). Dark mode uses `prefers-color-scheme`.
- Typed route helpers such as `LayoutProps<"/">` are global types that Next generates into `.next/types`. They show up as missing until `pnpm dev` or `pnpm build` has run once.
- Path alias `@/*` points to the repo root.
- `pnpm-workspace.yaml` sets `allowBuilds` to false for `sharp` and `unrs-resolver`, so their install scripts don't run.
