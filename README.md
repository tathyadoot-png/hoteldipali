# Hotel Dipali — Website

Static marketing website for Hotel Dipali, Sagar (Madhya Pradesh, India). Built with Next.js (App Router, static export) and Tailwind CSS v4.

## Requirements

- Node.js 24.x (see `.nvmrc`)
- pnpm only (the version in `package.json` → `packageManager`). `npm install` and
  `yarn` are refused by the `preinstall` guard (`only-allow pnpm`); never commit a
  `package-lock.json`.

## Commands

```bash
pnpm install       # install dependencies
pnpm dev           # start the dev server
pnpm build         # static export to /out
pnpm preview       # serve /out on http://localhost:4173
pnpm lint          # run ESLint
pnpm typecheck     # run tsc --noEmit
pnpm test:e2e      # run Playwright against the preview build
```

See [CLAUDE.md](CLAUDE.md) for the permanent project rules and [docs/PLAN.md](docs/PLAN.md) for the living project plan.
