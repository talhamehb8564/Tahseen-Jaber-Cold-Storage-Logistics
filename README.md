# Tahseen Jaber Cold Storage & Logistics — Website

Marketing and operations site for a temperature-controlled cold storage and
cold-chain logistics facility at Uuayrij Industrial Area, Baghdad, Iraq.

- **Framework:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Motion:** Framer Motion (`motion`), GSAP + ScrollTrigger
- **3D:** React Three Fiber / Drei (a single interactive chamber viewport)
- **Data:** Drizzle ORM over PostgreSQL — the site runs in **demo mode with no
  database** until `DATABASE_URL` is configured (all simulated surfaces are
  labelled `SIMULATION`)
- **Theme:** light — white ground, navy `#0F294D` primary, copper `#B66A3C`
  accents, dark-navy `#122033` text

## Local development

```bash
npm install
cp .env.example .env.local   # fill in what you need (all optional in demo mode)
npm run dev                  # http://localhost:3000
```

Typecheck and production build:

```bash
npm run typecheck
npm run build && npm start
```

## Deploy to Vercel

The repo is a standard Next.js App Router project — no special configuration
is required.

1. Push this repository to GitHub (done — `main` carries the site).
2. In Vercel: **Add New → Project → Import** the Git repository.
   Framework preset, build command (`next build`) and output are detected
   automatically. No `vercel.json` is needed; security headers and redirects
   live in `next.config.ts`.
3. **Environment variables** — in *Project → Settings → Environment Variables*,
   add what applies (see `.env.example` for the full annotated list):

   | Variable | Required | Notes |
   |---|---|---|
   | `NEXT_PUBLIC_SITE_URL` | recommended | Final domain, e.g. `https://yourdomain.com`. Falls back to the Vercel-provided `VERCEL_URL` automatically. |
   | `AUTH_SECRET` | for portal/admin login | ≥32 chars, e.g. `openssl rand -base64 48`. Without it, sign-in is disabled (the public site is unaffected). |
   | `DATABASE_URL` | for live data | PostgreSQL connection string. Omit to run in demo mode. |
   | `DATA_SOURCE_MODE` | optional | Keep `demo` until real facility integrations exist. |
   | `EMAIL_SERVER` / `EMAIL_FROM` / `ADMIN_NOTIFY_EMAIL` | optional | SMTP for inquiry alerts; omitted → alerts are skipped, inquiries still recorded. |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional | Enables "Continue with Google". |

4. Deploy. Every push to `main` triggers a production deploy; every open PR
   gets a preview URL.

**Zero-config path:** even with *no* environment variables set, the site builds
and serves the public pages, request-storage form (rate-limited, recorded to
the database only if configured) and demo-labelled operations dashboards.

## Repo layout

```
src/
  app/            # routes: /, about, facility, solutions, products,
                  # logistics, contact, request-storage, login,
                  # portal/*, admin/* and the API routes
  components/     # section components, imagery, three.js chamber, UI kit
  lib/            # site config, catalog, demo data, auth, email, rate limits
public/assets/    # photography (all AI-generated illustrative imagery)
```

## Notes

- All operational photography is AI-generated illustrative imagery; sections
  that present simulated data are badged `SIMULATION` and labelled accordingly.
- Fonts are self-hosted; the app makes no requests to third-party origins
  (see the CSP in `next.config.ts`).
