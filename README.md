# ReferKit

**Referral programs for indie SaaS** — add a referral loop in a weekend. Viral growth without the complexity.

## What it does
- Track referrals with unique links
- Auto-reward referrers (credits, discounts, cash)
- Embeddable referral widget (vanilla JS, 3KB)
- Dashboard with conversion tracking

## Stack
- **Next.js 14** + TypeScript + TailwindCSS + shadcn/ui
- **PostgreSQL** + Drizzle ORM
- **Vanilla JS widget** (esbuild, <5KB)

## Structure
```
apps/web      — Dashboard + API routes
apps/widget   — Embed widget
packages/db   — Schema + client
packages/config — Shared configs
```
