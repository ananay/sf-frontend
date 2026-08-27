# Contacts frontend

This repository contains the Next.js web client for the Contacts application. It uses
the App Router, TypeScript, Tailwind CSS, Zod, Jest, Testing Library, MSW, and
Playwright. The browser talks to this application; server components and server
actions talk to the FastAPI service through `API_BASE_URL`.

## Working locally

- Install exact dependencies with `npm ci`.
- Copy `.env.local.example` to `.env.local` and point `API_BASE_URL` at a running
  Contacts API.
- Start the development server with `npm run dev`.
- Before handing off a change, run `npm run lint`, `npm run typecheck`,
  `npm test -- --runInBand`, and `npm run build`.
- Run `npm run test:e2e` when a change affects complete user flows and a disposable
  backend is available.

## Architecture

- Routes and server actions live in `src/app/`.
- Reusable application components live in `src/components/`; small visual primitives
  live in `src/components/ui/`.
- Contact types, validation, formatting, query parsing, and API access live in
  `src/lib/contacts/`.
- `src/lib/apiClient.ts` owns base URL resolution, timeouts, and HTTP error types.
- Tests mirror the source tree under `src/__tests__/`. Network behavior is represented
  with MSW handlers in `src/__tests__/mocks/`.

## Conventions

- Keep API calls on the server unless a browser-only interaction truly requires a
  client request. Never expose server credentials through `NEXT_PUBLIC_*` variables.
- Keep contact field limits and messages aligned with the backend contract. Prefer the
  shared Zod schema over one-off validation in components.
- Preserve URL-backed list state for searching, sorting, pagination, and page size.
- Use semantic Tailwind tokens from `src/app/globals.css`; do not hard-code colors that
  bypass the light and dark themes.
- Prefer accessible roles, labels, and native controls. Tests should query the same
  accessible surface a user operates.
- Mock HTTP at the network boundary with MSW. Do not replace `fetch` directly.
- Keep server actions responsible for translating API failures into useful field or
  form errors.

## Delivery

`.github/workflows/ci.yml` runs linting, type checking, Jest, and a production build.
For same-repository pull requests, the Vercel CLI creates a preview only after those
checks pass. The workflow expects `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and
`VERCEL_PROJECT_ID` as GitHub Actions secrets, while `API_BASE_URL` belongs in the
Vercel project's Preview environment.
