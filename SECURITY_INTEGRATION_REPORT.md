# ReferKit — Security Audit & Integration Testing Report

**Sprint 4.4 | Audited by Sage WC15**
**Date:** 2026-03-01
**Repo:** https://github.com/ThreeStackHQ/referkit
**Auditor:** Sage (ThreeStack AI)

---

## Executive Summary

ReferKit is a referral program SaaS built on a Next.js + Drizzle ORM monorepo. As of Sprint 4.4, the project has a well-structured frontend (dashboard, landing page, widget) and a solid database schema. However, the backend API layer is **not yet implemented** — no `app/api/` routes exist. This means:

- Core functionality (tracking, attribution, commissions, payouts) cannot be integration tested end-to-end yet
- Several security findings relate to missing backend guards that must be implemented before production launch

**Overall Risk Level: 🔴 HIGH** (primarily due to missing auth enforcement + one critical secret leak)

---

## Part 1: Security Audit

### 1. Auth & Authorization

| Item | Status | Severity |
|------|--------|----------|
| NextAuth in dependencies (`next-auth@^5.0.0-beta.19`) | ✅ Present | — |
| `AUTH_SECRET` in `.env.example` | ✅ Present | — |
| `middleware.ts` protecting dashboard routes | ❌ Missing | 🔴 CRITICAL |
| Server-side session checks on any API route | ❌ No API routes exist | 🔴 CRITICAL |
| Dashboard pages gated by auth | ❌ Missing | 🔴 CRITICAL |

**Finding SEC-001 (CRITICAL): No Auth Enforcement**

All dashboard pages (`/campaigns`, `/referrers`, `/settings/webhooks`) are `'use client'` components with hardcoded mock data. There is no `middleware.ts` and no server-side session checks anywhere. Any unauthenticated user can access the dashboard by navigating directly.

**Recommendation:** Add `middleware.ts` at the Next.js root:
```ts
import { auth } from "@/auth";
export default auth;
export const config = { matcher: ["/(dashboard)/:path*"] };
```
All `/api` routes (once created) must call `const session = await auth(); if (!session) return NextResponse.json({error:"Unauthorized"},{status:401})`.

---

### 2. Referral Token Security

| Item | Status | Severity |
|------|--------|----------|
| Primary keys use UUID (`defaultRandom()`) | ✅ | — |
| `referralCode` schema comment suggests `"john-abc123"` format | ⚠️ Partial | 🟡 MEDIUM |
| Actual code generation function | ❌ Not implemented yet | — |

**Finding SEC-002 (MEDIUM): Referral Code Generation Not Implemented**

The DB schema notes `// e.g. "john-abc123"` for `referralCode`. The format appears to have a random suffix but the actual generation code does not exist (no API routes). When implementing, use a cryptographically random suffix — `nanoid(8)` or `crypto.randomBytes(6).toString('hex')` — to ensure non-guessability. Do NOT use sequential IDs or predictable formats.

**Recommendation:**
```ts
import { nanoid } from "nanoid";
const referralCode = `${slugify(name)}-${nanoid(8)}`;
```

---

### 3. Conversion Double-Attribution

| Item | Status | Severity |
|------|--------|----------|
| Unique constraint on `referredUserId + programId` | ❌ Missing from schema | 🔴 HIGH |
| Idempotency check in conversion API | ❌ No API exists | — |

**Finding SEC-003 (HIGH): No Double-Attribution Protection in Schema**

The `referrals` table has no unique constraint preventing the same `referredUserId` from being attributed twice to the same program. This allows a malicious actor (or retry storm) to generate duplicate commissions.

**Recommendation:** Add a database-level unique constraint:
```ts
// In schema.ts
import { uniqueIndex } from "drizzle-orm/pg-core";
export const referrals = pgTable("referrals", { ... }, (t) => ({
  uniqueConversion: uniqueIndex("referrals_program_user_idx").on(
    t.programId, t.referredUserId
  ),
}));
```
The API should also check before inserting and return a 409 if already attributed.

---

### 4. Commission Calculation

| Item | Status | Severity |
|------|--------|----------|
| Commission calculation API | ❌ Not implemented | — |
| `rewardValue` stored as `numeric` (safe from float errors) | ✅ | — |

No commission calculation logic exists yet. When implementing, ensure:
- `rewardValue` is read from the stored program config only (never from client request)
- Commission = `ROUND(conversionAmount * rewardValue / 100, 2)` using server-side `numeric`
- The conversion amount comes from a verified Stripe event, not a client-supplied value

---

### 5. Stripe Payouts & Webhook Verification

| Item | Status | Severity |
|------|--------|----------|
| `STRIPE_SECRET_KEY` in `.env.example` | ✅ | — |
| `STRIPE_WEBHOOK_SECRET` in `.env.example` | ✅ | — |
| Stripe webhook handler (`/api/stripe/webhook`) | ❌ Not implemented | 🔴 HIGH |
| `stripe.webhooks.constructEvent()` verification | ❌ Not implemented | 🔴 HIGH |
| Idempotency key on payout creation | ❌ Not implemented | — |

**Finding SEC-004 (HIGH): Stripe Webhook Handler Not Implemented**

No Stripe webhook handler exists. When implementing:
```ts
const sig = req.headers["stripe-signature"];
const event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
```
Use `idempotencyKey: event.id` on all Stripe API calls to prevent double-payouts.

---

### 6. Outgoing Webhook HMAC Signing

| Item | Status | Severity |
|------|--------|----------|
| `X-ReferKit-Signature` mentioned in UI | ✅ (UI only) | — |
| Actual HMAC signing in outgoing webhook sender | ❌ Not implemented | 🟡 MEDIUM |

**Finding SEC-005 (MEDIUM): HMAC Signing Not Implemented**

The Webhooks UI correctly describes the `X-ReferKit-Signature` header and exposes a secret for verification, but no server-side outgoing webhook dispatcher exists.

When implementing:
```ts
const signature = crypto
  .createHmac("sha256", webhook.secret)
  .update(JSON.stringify(payload))
  .digest("hex");
headers["X-ReferKit-Signature"] = `sha256=${signature}`;
```

---

### 7. 🚨 Hardcoded Secret in Client Bundle

| Item | Status | Severity |
|------|--------|----------|
| Webhook secret hardcoded in client component | ❌ **EXPOSED** | 🔴 CRITICAL |

**Finding SEC-006 (CRITICAL): Webhook Secret Leaked to Browser**

In `apps/web/src/app/(dashboard)/settings/webhooks/page.tsx`:

```ts
const REAL_SECRET = 'wh_live_d8f3a1c2b9e4f750a1c2b9e4'
```

This secret is stored in a `'use client'` component and will be compiled into the browser JavaScript bundle, making it visible to any user who inspects the page source. This completely defeats HMAC signature verification.

**Recommendation:** The webhook secret must be fetched from a server action or API route with auth, never hardcoded in client code:
```ts
// Server action
"use server";
export async function getWebhookSecret(webhookId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const webhook = await db.query.webhooks.findFirst({ where: eq(webhooks.id, webhookId) });
  return webhook?.secret; // returned only to authenticated user
}
```

---

### 8. CORS Policy

| Item | Status | Severity |
|------|--------|----------|
| CORS headers in `next.config.js` | ❌ Missing | 🟡 MEDIUM |
| Widget endpoint CORS | ❌ No API routes exist yet | — |

**Finding SEC-007 (MEDIUM): No CORS Configuration**

The widget API endpoint (`/api/widget/referrer`) will be called cross-origin from any customer's domain. Without explicit CORS headers, browsers will block these requests.

**Recommendation** (add to `next.config.js`):
```js
async headers() {
  return [{
    source: "/api/widget/:path*",
    headers: [
      { key: "Access-Control-Allow-Origin", value: "*" },
      { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
      { key: "Access-Control-Allow-Headers", value: "X-API-Key" },
    ],
  }];
}
```
Dashboard API routes should use `origin: process.env.NEXTAUTH_URL` (not `*`).

---

### 9. Widget XSS via innerHTML

| Item | Status | Severity |
|------|--------|----------|
| Widget injects `data.referralUrl` into `innerHTML` | ⚠️ Vulnerable | 🟡 MEDIUM |
| `data.totalReferrals`, `pendingReward`, `paidReward` injected | ⚠️ Same issue | 🟡 MEDIUM |

**Finding SEC-008 (MEDIUM): Widget XSS via Unescaped innerHTML**

In `apps/widget/src/index.ts`:
```ts
box.innerHTML = `...
  <div class="rk-url">${data.referralUrl}</div>
  ...
  <div class="rk-stat-val">${data.totalReferrals}</div>
  ...`;
```

If the API returns a crafted value (e.g., `referralUrl: '<img src=x onerror=alert(1)>'`), it will execute in the embedding page's context. Since the widget is embedded on customer sites, this is a **supply-chain XSS risk**.

**Recommendation:** Use `textContent` or a DOM helper instead of `innerHTML`:
```ts
const urlDiv = document.createElement("div");
urlDiv.className = "rk-url";
urlDiv.textContent = data.referralUrl; // safe
box.appendChild(urlDiv);
```

---

### 10. Input Validation (Zod)

| Item | Status | Severity |
|------|--------|----------|
| `zod@^3.23.8` in dependencies | ✅ | — |
| Zod usage on any API route | ❌ No API routes exist | — |

Zod is correctly included as a dependency. All future API routes must validate with Zod before processing. Example:
```ts
const schema = z.object({ programId: z.string().uuid(), amount: z.number().positive() });
const body = schema.parse(await req.json());
```

---

### Security Summary

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| SEC-001 | No auth middleware / route guards | 🔴 CRITICAL | ❌ Open |
| SEC-002 | Referral code generation not implemented | 🟡 MEDIUM | ❌ Open |
| SEC-003 | No double-attribution protection in schema | 🔴 HIGH | ❌ Open |
| SEC-004 | Stripe webhook handler not implemented | 🔴 HIGH | ❌ Open |
| SEC-005 | Outgoing webhook HMAC not implemented | 🟡 MEDIUM | ❌ Open |
| SEC-006 | Webhook secret hardcoded in client bundle | 🔴 CRITICAL | ❌ Open |
| SEC-007 | No CORS configuration for widget endpoint | 🟡 MEDIUM | ❌ Open |
| SEC-008 | Widget XSS via unescaped innerHTML | 🟡 MEDIUM | ❌ Open |

**Findings: 2 Critical · 2 High · 4 Medium · 0 Low**

---

## Part 2: Integration Testing

### Test Environment

All integration tests below represent **code review + static analysis** results, as no API routes are deployed or implemented. Where flows are partially implemented, the UI layer is tested. Where flows are not implemented, the finding is documented as a blocker.

---

### Integration Flow 1: Program Creation

**Expected:** Create program → set commission % → get embed code

| Step | Component | Status | Notes |
|------|-----------|--------|-------|
| Campaign creation form | `campaigns/new/page.tsx` | ✅ UI Complete | Form fields: name, description, reward type, value, dates, landing URL |
| Form submission to API | `/api/programs` (POST) | ❌ Not implemented | "Publish Campaign" button has no `onClick` handler wired to an API |
| Commission % storage | `programs.rewardValue` in schema | ✅ Schema ready | `numeric(10,2)` field, correct type |
| Embed code generation | No embed code page exists | ❌ Not implemented | No API key issuance flow exists |

**Result: ❌ BLOCKED** — UI is complete but no API wiring exists.

---

### Integration Flow 2: Affiliate Registration

**Expected:** Affiliate signs up → gets unique referral link

| Step | Component | Status | Notes |
|------|-----------|--------|-------|
| Affiliate signup form | — | ❌ Not implemented | No affiliate-facing signup page or form |
| Referrer record creation | `/api/referrers` (POST) | ❌ Not implemented | — |
| Referral code assignment | Schema: `referrers.referralCode` | ✅ Schema ready | Needs `nanoid` generation |
| Referral link generation | Widget: `referralUrl` field | ✅ Widget ready | URL format assumed `https://app.com/r/{code}` |

**Result: ❌ BLOCKED** — No affiliate-facing flow implemented.

---

### Integration Flow 3: Referral Tracking (Click → Cookie → Conversion)

**Expected:** Click referral link → cookie set → conversion tracked

| Step | Component | Status | Notes |
|------|-----------|--------|-------|
| Referral link landing page | — | ❌ Not implemented | No `/r/[code]` route exists |
| Cookie set on click | — | ❌ Not implemented | No cookie logic |
| Conversion attribution API | `/api/conversions` (POST) | ❌ Not implemented | — |
| `referrals` record created | Schema ready | ✅ Schema ready | `status: "pending"` default ✓ |
| Cookie window (`cookieDays`) | `programs.cookieDays` | ✅ Schema (default 30) | Not used yet |

**Result: ❌ BLOCKED** — Core tracking flow not implemented.

---

### Integration Flow 4: Commission Calculation

**Expected:** Conversion event → commission created with correct amount

| Step | Component | Status | Notes |
|------|-----------|--------|-------|
| Commission calculation logic | — | ❌ Not implemented | — |
| `rewardValue` used as source of truth | Schema field exists | ✅ Schema ready | Must be enforced server-side |
| `referrers.pendingReward` updated | Schema: `pendingReward` field | ✅ Schema ready | Needs atomic update |
| Double-attribution guard | — | ❌ Missing (SEC-003) | See security findings |

**Result: ❌ BLOCKED** — No calculation logic exists.

---

### Integration Flow 5: Payout Flow

**Expected:** Commission approved → Stripe payout triggered

| Step | Component | Status | Notes |
|------|-----------|--------|-------|
| Commission approval action | — | ❌ Not implemented | No approval UI or API |
| Stripe transfer API call | — | ❌ Not implemented | — |
| Stripe webhook handler | — | ❌ Not implemented (SEC-004) | — |
| `referrers.paidReward` updated | Schema field exists | ✅ Schema ready | — |

**Result: ❌ BLOCKED** — No payout backend implemented.

---

### Integration Flow 6: Webhook Delivery

**Expected:** Webhook fires on conversion/payout events

| Step | Component | Status | Notes |
|------|-----------|--------|-------|
| Webhook config UI | `settings/webhooks/page.tsx` | ✅ Complete | Event subscriptions, endpoint URL, secret display |
| Webhook endpoint storage | `webhooks` DB table | ❌ Missing | No `webhooks` table in schema.ts |
| Event dispatcher | — | ❌ Not implemented | — |
| HMAC signing | — | ❌ Not implemented (SEC-005) | — |
| Delivery retry (UI shows 5x) | Mock UI only | ⚠️ Mock data | Not backed by real delivery logic |

**Finding INT-001: `webhooks` table missing from DB schema** — The Webhooks Management UI (Sprint 4.3) was implemented without a corresponding database table. Schema needs a `webhooks` table with fields: `id`, `userId`, `endpointUrl`, `secret`, `events` (text[]), `isActive`, `createdAt`.

**Result: ❌ BLOCKED** — Webhook dispatcher not implemented; DB table missing.

---

### Integration Flow 7: Vanilla JS Widget

**Expected:** Widget loads, affiliate can see their stats

| Step | Component | Status | Notes |
|------|-----------|--------|-------|
| Widget bundle build | `esbuild` config | ✅ Configured | `dist/widget.js` output |
| Widget init via `data-*` attrs | `apps/widget/src/index.ts` | ✅ Implemented | Auto-init on `DOMContentLoaded` ✓ |
| `X-API-Key` auth header sent | Widget code | ✅ Implemented | Correct header usage |
| API call to `/api/widget/referrer` | Widget fetch | ⚠️ Broken | Route doesn't exist → 404 |
| Stats display (referrals, rewards) | Widget render | ✅ UI complete | Renders correctly with data |
| Copy-to-clipboard | Widget | ✅ Implemented | `navigator.clipboard` API ✓ |
| Light/dark theme support | Widget | ✅ Implemented | Configurable via `data-theme` |
| XSS in `innerHTML` injection | Widget render | ❌ Vulnerable (SEC-008) | See security findings |
| CORS for cross-origin fetch | `next.config.js` | ❌ Missing (SEC-007) | Browsers will block the fetch |

**Result: ⚠️ PARTIAL** — Widget code is well-implemented. Blocked by missing API route, CORS config, and innerHTML XSS.

---

### Integration Summary

| Flow | Status | Blocker |
|------|--------|---------|
| 1. Program Creation | ❌ Blocked | No API routes |
| 2. Affiliate Registration | ❌ Blocked | No affiliate flow |
| 3. Referral Tracking | ❌ Blocked | No tracking API / redirect handler |
| 4. Commission Calculation | ❌ Blocked | No calculation logic |
| 5. Payout Flow | ❌ Blocked | No Stripe backend |
| 6. Webhook Delivery | ❌ Blocked | Missing `webhooks` DB table + dispatcher |
| 7. Vanilla JS Widget | ⚠️ Partial | Missing API, CORS, XSS fix needed |

**0 / 7 integration flows pass end-to-end.**

---

## Part 3: Positive Findings

Despite the gaps above, the foundation is solid:

- ✅ **Database schema is well-designed** — UUID primary keys, proper foreign keys with cascade, `numeric` for monetary values (avoids float errors), appropriate indexes via unique constraints
- ✅ **Drizzle ORM** — Parameterized queries prevent SQL injection by default
- ✅ **NextAuth v5 included** — Auth library is the right choice; just needs wiring
- ✅ **Zod in dependencies** — Just needs to be used on API routes
- ✅ **Widget auto-init pattern** — Clean `data-*` attribute API
- ✅ **STRIPE_WEBHOOK_SECRET in env template** — Correct awareness of webhook signing
- ✅ **Monorepo structure** — Clean separation of `web`, `widget`, `db` packages

---

## Part 4: Priority Remediation Plan

### Sprint 4.5 (Must-fix before any production traffic)

1. **[SEC-006]** Remove `REAL_SECRET` from client component. Serve webhook secret via authenticated server action.
2. **[SEC-001]** Add `middleware.ts` with NextAuth session guard for `/(dashboard)/*`.
3. **[SEC-003]** Add unique index on `(programId, referredUserId)` in `referrals` table.
4. **[SEC-007]** Add CORS headers for `/api/widget/*` in `next.config.js`.
5. **[SEC-008]** Fix widget `innerHTML` XSS by using `textContent` / DOM manipulation.

### Sprint 4.6 (Backend API implementation)

6. Implement all API routes with Zod validation + auth session guards
7. Implement `/r/[code]` referral link redirect + cookie setting
8. Implement Stripe webhook handler with `constructEvent()` verification
9. Implement outgoing webhook dispatcher with HMAC-SHA256 signing
10. Add `webhooks` table to DB schema [INT-001]

---

*Report generated by Sage WC15 | ThreeStack AI Platform*
