# arsd.co SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Each task is self-contained — stop after every task and report results to the planner before proceeding.

**Goal:** Restore arsd.co's organic visibility by fixing the 2026-05-16 indexation emergency (only 2 of 6 pages in Google's index) and bringing the marketing site from 42/100 technical + 9.95/20 on-page to a rankable baseline, then layer GEO optimization for AI-engine citations.

**Architecture:** The marketing site lives in the same Next.js 14 App Router codebase as the dashboard. Marketing routes are at the root segment (`src/app/page.tsx`, `src/app/our-services/page.tsx`, `src/app/projects/page.tsx`, `src/app/about-us/page.tsx`, `src/app/contact-us/page.tsx`). Dashboard routes live under `src/app/dashboard/**` and auth routes under `src/app/(auth)/**`. New SEO files (`robots.ts`, `sitemap.ts`) go at `src/app/` root. Critical: every change must keep the dashboard build green — `npx tsc --noEmit` clean is the gate after every task.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase Auth, Vercel hosting. Next.js Metadata API for title/description/robots, `app/robots.ts` + `app/sitemap.ts` for crawl directives.

**Background:** Two audits ran 2026-05-16 (see `~/.claude/projects/-Users-rafaeliiiprudente-Documents-coding-projects-arsd-dashboard/memory/project_arsd_co_seo_audit_2026_05_16.md` for full results):
- **technical-seo-checker** → 42/100 Critical. Root cause: no robots.txt, no sitemap.xml, no JSON-LD, dashboard auth route `/sign-up` indexed.
- **on-page-seo-auditor** → 9.95/20 Fail. Worst pages: `/projects` (7.25, empty portfolio) and `/our-services` (9.5, duplicate H1). Real entity data lives on `/about-us` but doesn't cascade.

**No commits, no pushes.** The user commits manually. Every task ends with code in the working tree only.

**Testing note:** No Jest/Vitest/Playwright is wired. Per `.claude/rules/code-quality.md`, verification is `npx tsc --noEmit` + `npm run build` + manual smoke. Each task documents its own smoke check.

---

## File Structure

| File | Responsibility | New / Modified / Deleted |
|---|---|---|
| `src/app/robots.ts` | Next.js robots.txt generator — allow marketing, disallow dashboard/auth/api, declare sitemap, AI-crawler stance | **New** |
| `src/app/sitemap.ts` | Next.js sitemap.xml generator — enumerate 5 marketing URLs + future project slugs | **New** |
| `src/app/dashboard/layout.tsx` | Add `metadata.robots = { index: false, follow: false }` to dashboard layout | **Modified** |
| `src/app/(auth)/layout.tsx` | Add `metadata.robots = { index: false, follow: false }` to auth layout (covers `/sign-up`, `/sign-in`, `/forgot-password`, `/reset-password`) | **Modified** |
| `src/app/layout.tsx` | Add Organization JSON-LD, sitewide footer credentials, branded `<title>` + meta defaults | **Modified** |
| `src/app/page.tsx` | Homepage H1 rewrite, real stats (replace "0+"), image alt fixes, FAQ block, page metadata, Service JSON-LD reference | **Modified** |
| `src/app/our-services/page.tsx` | Unique H1, page metadata, Service ×5 JSON-LD, FAQ block, per-service deep-link targets | **Modified** |
| `src/app/projects/page.tsx` | Populate with 6 real project tiles, page metadata, BreadcrumbList JSON-LD | **Modified** |
| `src/app/projects/[slug]/page.tsx` | New dynamic route for individual project pages with Project + BreadcrumbList schema | **New** |
| `src/app/about-us/page.tsx` | Unique H1, founder bio placeholder, page metadata, PCAB expiry verify markup | **Modified** |
| `src/app/contact-us/page.tsx` | Real NAP (phone, email), Google Maps embed, LocalBusiness JSON-LD, page metadata | **Modified** |
| `src/components/Navbar.tsx` (or equivalent) | Remove `/sign-in` link from public marketing nav | **Modified** |
| `src/data/projects.ts` | New static data file for the 6 featured projects (and any future ones) | **New** |

**Out of scope** (do not touch in this plan):
- Dashboard functionality, RBAC, warehouse module, accomplishment reports — pure marketing-site SEO work.
- Supabase config, environment variables, cron jobs.
- Google Search Console + Bing Webmaster Tools setup (operator action, documented in Task 12 as a post-deploy manual step).
- Vercel domain/redirect config.
- PCAB license verification with the actual licensing board (operator action, flagged in Task 7 as a manual step).

---

## Critical Path

```
Phase 0 (Task 1)           — VERIFY    blocks all subsequent SEO work
  ↓
Phase 1 (Tasks 2-5)        — UNBLOCK   ship robots/sitemap, noindex dashboard
  ↓
Phase 2 (Tasks 6-8)        — TRUST     fix placeholder data, footer credentials
  ↓
Phase 3 (Tasks 9-11)       — STRUCTURE H1s, metadata, JSON-LD
  ↓
Phase 4 (Tasks 12-14)      — DEPTH     /projects population, FAQs, map
  ↓
Phase 5 (Task 15)          — SUBMIT    Search Console + monitoring
  ↓
Phase 6 (Task 16, deferred) — GEO       implement geo-content-optimizer output (separate session)
```

Halt and report to planner after each task. Tasks 1, 2-3, 5 are blocking — nothing else can ship without them. The plan is otherwise mostly parallelizable within a phase.

---

## Task 1: Verify no stray `noindex` on marketing pages

**Why first:** The technical-seo-checker flagged this as the prerequisite verification. If a layout has an inherited `<meta name="robots" content="noindex">`, every subsequent SEO task is wasted effort until it's removed.

**Files:**
- Read: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/our-services/page.tsx`, `src/app/projects/page.tsx`, `src/app/about-us/page.tsx`, `src/app/contact-us/page.tsx`, and any layout files in the route tree above them

- [ ] **Step 1.1: Audit every layout from root to each marketing page**

Read each `layout.tsx` in the chain. For each, search for any of:
- `export const metadata` containing `robots: { index: false }` or `robots: 'noindex'`
- `<meta name="robots" content="noindex">` in JSX
- `noindex` literal anywhere in the file

- [ ] **Step 1.2: Audit each marketing `page.tsx`**

Same search on each of the 5 page files.

- [ ] **Step 1.3: Report findings to planner**

Produce a table: file | has-noindex (yes/no) | exact line if yes. Stop and report. Do not proceed to Task 2 until planner confirms the table.

**Verification:** N/A — read-only task.

---

## Task 2: Ship `src/app/robots.ts`

**Files:**
- Create: `src/app/robots.ts`

- [ ] **Step 2.1: Create the file with this exact structure**

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://arsd.co';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/sign-up',
          '/sign-in',
          '/forgot-password',
          '/reset-password',
          '/pending-approval',
          '/dashboard/',
          '/api/',
          '/auth/',
        ],
      },
      // AI crawler stance: allow retrieval bots so the brand surfaces in AI answers; block CCBot (training-only)
      { userAgent: 'GPTBot', allow: ['/'] },
      { userAgent: 'ClaudeBot', allow: ['/'] },
      { userAgent: 'Claude-Web', allow: ['/'] },
      { userAgent: 'PerplexityBot', allow: ['/'] },
      { userAgent: 'Google-Extended', allow: ['/'] },
      { userAgent: 'CCBot', disallow: ['/'] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
```

- [ ] **Step 2.2: Verify build**

Run `npx tsc --noEmit`. Expect zero errors.

- [ ] **Step 2.3: Run dev server and confirm output**

```bash
npm run dev
# in another terminal:
curl -s http://localhost:3000/robots.txt
```

Expected output includes the `User-agent: *` block with the disallow list, the AI-crawler rules, and the `Sitemap: https://arsd.co/sitemap.xml` line. Stop the dev server when done.

**Verification:** `curl http://localhost:3000/robots.txt` returns 200 with correct content; `npx tsc --noEmit` clean.

---

## Task 3: Ship `src/app/sitemap.ts`

**Files:**
- Create: `src/app/sitemap.ts`

- [ ] **Step 3.1: Create the file**

```ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://arsd.co';
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`,             lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${baseUrl}/our-services`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/projects`,     lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${baseUrl}/about-us`,     lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/contact-us`,   lastModified: now, changeFrequency: 'yearly',  priority: 0.7 },
  ];

  // Project slugs are added in Task 12 once `/projects/[slug]` exists.
  // Keep this file simple — if/when projects exist, import them and `.map()` to sitemap entries here.

  return staticPages;
}
```

- [ ] **Step 3.2: Verify build**

Run `npx tsc --noEmit`. Expect zero errors.

- [ ] **Step 3.3: Confirm output via dev server**

`curl -s http://localhost:3000/sitemap.xml` — expect a valid XML sitemap with the 5 URLs.

**Verification:** sitemap.xml returns valid XML at the right URLs; `npx tsc --noEmit` clean.

---

## Task 4: Add `noindex` metadata to dashboard + auth layouts

**Why:** Removes `/sign-up` from Google's index (currently 1 of only 2 indexed URLs) and prevents any future dashboard/auth route from leaking.

**Amended 2026-05-16 after first attempt:** Discovery surfaced two blockers — `/pending-approval` sits outside `(auth)/`, and `dashboard/layout.tsx` is a client component (cannot export `metadata`). Resolved by: (1) relocating `/pending-approval` into `(auth)/`, and (2) splitting the dashboard layout into a server shell + client island.

**Files:**
- Move: `src/app/pending-approval/` → `src/app/(auth)/pending-approval/` (URL unchanged — route groups don't affect URLs)
- Create: `src/app/dashboard/DashboardLayoutClient.tsx` (the current client-component layout, renamed)
- Replace: `src/app/dashboard/layout.tsx` with a server-component shell that exports `metadata` and renders `<DashboardLayoutClient>{children}</DashboardLayoutClient>`
- Create: `src/app/(auth)/layout.tsx` (new passthrough layout with `metadata.robots = noindex`)

- [ ] **Step 4.1: Verify no hardcoded file-path references to `src/app/pending-approval`**

Run `grep -rn "app/pending-approval" src/ supabase/ middleware.ts 2>/dev/null`. URL-string references (`"/pending-approval"`) are fine — those refer to the route, not the file path. Only file-system path references (dynamic imports, relative imports) would break. Report any hits before moving.

- [ ] **Step 4.2: Move `/pending-approval` into `(auth)/`**

`mv src/app/pending-approval src/app/(auth)/pending-approval`. The URL stays `/pending-approval` because route-group folders (parentheses) are stripped from URLs.

- [ ] **Step 4.3: Read `src/app/dashboard/layout.tsx` and rename to `DashboardLayoutClient.tsx`**

Capture the full current content first (it's a client component with `useRBAC` + Sidebar + SkipLink). Then `mv src/app/dashboard/layout.tsx src/app/dashboard/DashboardLayoutClient.tsx`. Keep `"use client"` at the top — it stays a client component, just renamed. Export name should still be the default export; rename the function from `DashboardLayout` to `DashboardLayoutClient` for clarity.

- [ ] **Step 4.4: Create the new server-component `src/app/dashboard/layout.tsx`**

```ts
import type { Metadata } from 'next';
import DashboardLayoutClient from './DashboardLayoutClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
```

This is a SERVER component (no `"use client"`), which is what allows the `metadata` export. The client-side RBAC/Sidebar logic remains untouched inside `DashboardLayoutClient`.

- [ ] **Step 4.5: Create `src/app/(auth)/layout.tsx`**

```ts
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

This layout exists solely to scope `noindex` to every page under `(auth)/` (now covers `sign-up`, `sign-in`, `forgot-password`, `reset-password`, `pending-approval`).

- [ ] **Step 4.6: Verify**

`npx tsc --noEmit` then `npm run build`. Both must be clean. Note: `dashboard/warehouse/layout.tsx` inherits the new `robots` metadata automatically since Next.js metadata composes — no change needed there.

**Verification:** Build clean. `curl http://localhost:3000/sign-up` and `curl http://localhost:3000/dashboard` (or the redirect target) both show `<meta name="robots" content="noindex, nofollow, nocache">`. `curl http://localhost:3000/` and `curl http://localhost:3000/our-services` show NO meta-robots line (marketing pages must remain indexable).

---

## Task 5: Remove `/sign-in` link from public marketing nav

**Why:** Compounds Task 4. As long as the nav links to the auth surface, crawlers treat it as commercially relevant. On-page audit pattern #11.

**Files:**
- Modify: `src/components/Navbar.tsx` (confirm exact path — could be `src/components/Navbar/` or `src/app/components/navbar.tsx`)

- [ ] **Step 5.1: Locate the marketing nav component**

Grep for "Sign In" / "sign-in" / "sign-up" in `src/components/` and `src/app/`. Identify the file rendering the public marketing nav (NOT the dashboard nav).

- [ ] **Step 5.2: Remove the link**

Remove or comment out (with a one-line "removed for SEO — see plan 2026-05-16" inline note ONLY if the codebase already uses that style; otherwise just delete) the `/sign-in` link from the public nav. Leave the dashboard nav untouched.

- [ ] **Step 5.3: Verify**

`npx tsc --noEmit`. Manually load `http://localhost:3000/` and confirm no Sign In link in the header/footer. Confirm `/sign-in` still works when typed directly into the URL.

**Verification:** Public marketing pages do not link to auth surfaces; auth pages still reachable by direct URL.

---

## Task 6: Replace placeholder phone + email on `/contact-us`

**Why:** Audit pattern #3 + #8. `+63 33 123 4567` and `arsd_iloilo@yahoo.com` are E-A-T poison.

**Files:**
- Modify: `src/app/contact-us/page.tsx`

- [ ] **Step 6.1: Replace ALL three placeholder phone strings**

Find every occurrence of `+63 33 123 4567`, `+63 917 123 4567`, `(033) 123-4567` and replace with the real number `+63 33 337-7347` (Dun & Bradstreet verified). If only one is shown to users, remove the others entirely.

Use the international format `+63 33 337-7347` for `tel:` href links and the displayed format. Match whatever pattern is already used elsewhere.

- [ ] **Step 6.2: Replace the yahoo email**

Find `arsd_iloilo@yahoo.com` and replace with `contact@arsd.co` (placeholder branded email). Add a planner-facing note in the task report: "User needs to confirm correct branded email (contact@arsd.co or info@arsd.co) and ensure DNS+inbox exist before this is shippable."

- [ ] **Step 6.3: Verify**

`npx tsc --noEmit`. Manually load `/contact-us` and visually confirm new values appear.

**Verification:** No `123 4567` strings anywhere in the page; no yahoo.com email.

---

## Task 7: Replace "0+" placeholder stat counters with real numbers

**Why:** Audit pattern #2. Real numbers are 500+ projects, 100+ clients, 25+ years (sourced from `/about-us`).

**Files:**
- Modify: `src/app/page.tsx` (homepage)
- Modify: `src/app/projects/page.tsx`

- [ ] **Step 7.1: Locate stat-counter components**

Grep for `0+` or `0\+` in homepage and projects page. Identify the stat-counter element(s).

- [ ] **Step 7.2: Replace with real values**

- "0+ Projects Completed" → "500+ Projects Completed"
- "0+ Years Experience" → "25+ Years Experience"
- "0+ Satisfied Clients" → "100+ Satisfied Clients"

Keep the animated-counter behavior if one exists; just change the target value.

- [ ] **Step 7.3: PCAB license expiry check**

Open `src/app/about-us/page.tsx`. Find the PCAB license entry — page shows expiry "Aug 22, 2025" but current date is 2026-05-16. Add a `<!-- TODO: verify PCAB renewal status with operator before publish -->` HTML comment next to the date. Do NOT change the date silently. Add this as an item in the task report.

- [ ] **Step 7.4: Verify**

`npx tsc --noEmit`. Visit `/` and `/projects`, confirm new numbers.

**Verification:** No literal "0+" anywhere in the two pages; PCAB TODO comment in place.

---

## Task 8: Add PCAB license + branded contact info to sitewide footer

**Why:** Audit pattern #10. License # only on `/about-us`; should be visible everywhere as a trust signal.

**Files:**
- Modify: the sitewide footer component (locate via grep — likely `src/components/Footer.tsx` or similar)
- Modify: `src/app/page.tsx` (homepage) — if Quick Win #2 fixed image alt typos, do it now too

- [ ] **Step 8.1: Locate the footer**

Grep for "Figueroa" or "Iloilo" or "ARSD Construction Corporation" in `src/components/`. Identify the footer that renders on all marketing pages.

- [ ] **Step 8.2: Add the trust block to the footer**

Add a section containing:
- PCAB License No. 36037, Category A (with the same TODO comment from Task 7 about expiry verification)
- SEC Registration: CS 2007 28366
- PhilGEPS Cert: 2010-63063

Keep visual styling consistent with what's already there. Below the existing content is fine.

- [ ] **Step 8.3: Image alt typos — OPERATOR SQL ACTION (deferred from code)**

**Finding from 2026-05-16 execution:** the homepage featured-projects array is fetched LIVE from Supabase via a `featuredProjects` query in `src/app/page.tsx`. Alt text is `alt={project.name}` — the typos `"Propose Warehouse Complex"` and `"4 Storey BEU Complex Extention"` live in the database `name` column, not in any static file. No source-code change can fix them.

Operator must run the corrective SQL against the ARSD prod Supabase project (MCP can't reach it per memory `reference_supabase_mcp_gap.md`). See the operator post-deploy checklist at the bottom of this plan for the exact SQL.

This finding also implies Task 12 (populate `/projects`) needs amendment — projects are DB-driven, not static. The current Task 12 spec assumes a `src/data/projects.ts` static array; revisit when we reach it.

- [ ] **Step 8.4: Verify**

`npx tsc --noEmit`. Visit any marketing page and confirm footer shows credentials.

**Verification:** Credentials visible in footer on all 5 marketing pages. Alt typo verification is post-SQL operator action.

---

## Task 9: Rewrite H1s + add per-page metadata (title, description, canonical)

**Why:** On-page audit dimensions A, B, C all fail or warn across all pages. Duplicate H1 on `/our-services` and `/about-us` is the single biggest on-page issue.

**Amended 2026-05-16 after discovery:** 3 of 5 pages (`/projects`, `/about-us`, `/contact-us`) are `"use client"` components — cannot export `metadata`. Same fix as Task 4: server-shell + client-island split per page. Also, the homepage H1 lives in `src/components/hero.tsx` (a separate client component), not in `src/app/page.tsx`.

**Files:**
- Modify: `src/app/page.tsx` (server — add metadata export)
- Modify: `src/components/hero.tsx` (edit H1 inline)
- Modify: `src/app/our-services/page.tsx` (server — add metadata + H1 edit)
- Create: `src/app/projects/ProjectsPageClient.tsx` (move current client content)
- Replace: `src/app/projects/page.tsx` with server shell (metadata + render client)
- Create: `src/app/about-us/AboutUsPageClient.tsx`
- Replace: `src/app/about-us/page.tsx` with server shell
- Create: `src/app/contact-us/ContactUsPageClient.tsx`
- Replace: `src/app/contact-us/page.tsx` with server shell

- [ ] **Step 9.1: Add or extend `metadata` export on each page**

For each page, add (or merge with existing) a Next.js Metadata API block. Exact values per page:

**`src/app/page.tsx`** (homepage):
```ts
export const metadata: Metadata = {
  title: 'ARSD Construction Corporation — PCAB-Licensed General Contractor in Iloilo Since 1998',
  description: 'PCAB Category A licensed general contractor in Iloilo City, Philippines. 25+ years, 500+ completed projects. Building construction, land development, waterproofing, aggregates.',
  alternates: { canonical: 'https://arsd.co/' },
  openGraph: {
    title: 'ARSD Construction Corporation — Iloilo General Contractor',
    description: 'PCAB Category A. 25+ years. 500+ projects across Western Visayas.',
    url: 'https://arsd.co/',
    siteName: 'ARSD Construction Corporation',
    type: 'website',
  },
};
```

**`src/app/our-services/page.tsx`**:
```ts
export const metadata: Metadata = {
  title: 'Construction Services in Iloilo — Building, Land Development, Waterproofing | ARSD',
  description: 'Five construction services from a PCAB-licensed Iloilo contractor: building construction, design & plan preparation, land development, waterproofing, and aggregates supply.',
  alternates: { canonical: 'https://arsd.co/our-services' },
};
```

**`src/app/projects/page.tsx`**:
```ts
export const metadata: Metadata = {
  title: 'Completed Construction Projects in Iloilo & the Philippines | ARSD Construction',
  description: '500+ completed construction projects by ARSD Construction Corporation across Western Visayas — residential, commercial, industrial.',
  alternates: { canonical: 'https://arsd.co/projects' },
};
```

**`src/app/about-us/page.tsx`**:
```ts
export const metadata: Metadata = {
  title: 'About ARSD Construction — Iloilo\'s PCAB-Licensed Contractor Since 1998',
  description: 'Founded 1998 in Iloilo City. SEC-registered (CS 2007 28366), PCAB Category A licensed (No. 36037), PhilGEPS-certified. 25+ years and 500+ projects of structural-integrity-first construction.',
  alternates: { canonical: 'https://arsd.co/about-us' },
};
```

**`src/app/contact-us/page.tsx`**:
```ts
export const metadata: Metadata = {
  title: 'Contact ARSD Construction — Iloilo City General Contractor',
  description: 'Get in touch with ARSD Construction Corporation at Figueroa St., Arevalo, Iloilo City. Phone +63 33 337-7347. Request a construction quote for projects across Western Visayas.',
  alternates: { canonical: 'https://arsd.co/contact-us' },
};
```

- [ ] **Step 9.2: Rewrite the H1 on each page**

Find the `<h1>` in each page and replace with:
- `/` → `Iloilo Construction Company — PCAB-Licensed General Contractor Since 1998`
- `/our-services` → `Construction Services in Iloilo: Building, Land Development, Waterproofing & Aggregates`
- `/projects` → `Completed Construction Projects in Iloilo & the Philippines`
- `/about-us` → `About ARSD Construction — Iloilo's PCAB-Licensed Contractor Since 1998`
- `/contact-us` → `Contact ARSD Construction — Iloilo City General Contractor`

Critical: ensure no two pages share an H1 after these changes.

- [ ] **Step 9.3: Verify**

`npx tsc --noEmit`. `npm run build`. Visit each page, view-source, confirm `<title>` reflects the new metadata, `<meta name="description">` matches, `<link rel="canonical">` is present, and the H1 in the rendered HTML matches.

**Verification:** All 5 pages have unique titles, descriptions, canonicals, and H1s. Build clean.

---

## Task 10: Add Organization JSON-LD to root layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 10.1: Add a JSON-LD `<script>` to the root layout `<body>` (or `<head>`)**

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ARSD Construction Corporation',
      url: 'https://arsd.co',
      logo: 'https://arsd.co/logo.png', // verify actual logo path before publish
      foundingDate: '1998',
      sameAs: [
        'https://www.facebook.com/arsdconstruction', // verify actual FB URL
      ],
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Figueroa St., Bonifacio, Arevalo',
        addressLocality: 'Iloilo City',
        addressRegion: 'Western Visayas',
        postalCode: '5000',
        addressCountry: 'PH',
      },
      contactPoint: [{
        '@type': 'ContactPoint',
        telephone: '+63-33-337-7347',
        contactType: 'customer service',
        areaServed: 'PH',
      }],
    }),
  }}
/>
```

- [ ] **Step 10.2: Verify**

`npx tsc --noEmit`. Visit any page, view-source, confirm the `<script type="application/ld+json">` is present and the JSON validates (paste into https://validator.schema.org/ as a manual check).

**Verification:** Org schema valid; build clean.

---

## Task 11: Add LocalBusiness + Service ×5 JSON-LD

**Files:**
- Modify: `src/app/contact-us/page.tsx` (LocalBusiness)
- Modify: `src/app/our-services/page.tsx` (Service ×5)

- [ ] **Step 11.1: LocalBusiness JSON-LD on `/contact-us`**

Add inside the page component:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'GeneralContractor',
      '@id': 'https://arsd.co/#localbusiness',
      name: 'ARSD Construction Corporation',
      image: 'https://arsd.co/logo.png',
      telephone: '+63-33-337-7347',
      email: 'contact@arsd.co',
      url: 'https://arsd.co',
      priceRange: '$$',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Figueroa St., Bonifacio, Arevalo',
        addressLocality: 'Iloilo City',
        addressRegion: 'Western Visayas',
        postalCode: '5000',
        addressCountry: 'PH',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 10.7202,  // approximate — operator should confirm exact office coords
        longitude: 122.5621,
      },
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '08:00', closes: '17:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '08:00', closes: '12:00' },
      ],
      areaServed: { '@type': 'AdministrativeArea', name: 'Western Visayas, Philippines' },
      hasCredential: [
        { '@type': 'EducationalOccupationalCredential', credentialCategory: 'PCAB License', name: 'PCAB Category A No. 36037' },
        { '@type': 'EducationalOccupationalCredential', credentialCategory: 'SEC Registration', name: 'CS 2007 28366' },
        { '@type': 'EducationalOccupationalCredential', credentialCategory: 'PhilGEPS Certificate', name: '2010-63063' },
      ],
    }),
  }}
/>
```

- [ ] **Step 11.2: Service ×5 JSON-LD on `/our-services`**

Add an array of 5 Service objects. Use this template per service:

```ts
{
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: '<service name>',
  provider: { '@type': 'Organization', name: 'ARSD Construction Corporation', '@id': 'https://arsd.co/#localbusiness' },
  areaServed: { '@type': 'AdministrativeArea', name: 'Western Visayas, Philippines' },
  description: '<one-sentence description from the page copy>',
}
```

The 5 services: Building Construction, Design & Plan Preparation, Land Development, Waterproofing, Supply Aggregates. Pull each description from the existing page body text.

- [ ] **Step 11.3: Verify**

`npx tsc --noEmit`. Validate both pages' JSON-LD via https://validator.schema.org/.

**Verification:** Both pages have valid JSON-LD; build clean.

---

## Task 12: Populate `/projects` with real project tiles + create `/projects/[id]` dynamic route

**Why:** Audit pattern #4. The portfolio page is empty. Without real project content, structured data on this page is hollow, and there's no AI-citable proof of competency.

**AMENDED 2026-05-16:** Task 8 discovered projects are fetched LIVE from Supabase (DB-driven), not a static array. The original `src/data/projects.ts` approach is dropped. Projects are pulled from the same Supabase table the homepage already queries. No static data file is needed or created.

**Files:**
- Modify: `src/app/projects/page.tsx` (server shell — pass DB rows to client island)
- Modify: `src/app/projects/ProjectsPageClient.tsx` (accept + render tiles from server)
- Create: `src/app/projects/[id]/page.tsx` (dynamic route for individual projects — use DB `id` unless the table has a `slug` column)
- Modify: `src/app/sitemap.ts` (query Supabase for project IDs/slugs at build time)

**COMPLETED 2026-05-17:** 22 DB-driven project detail pages SSG pre-rendered at `/projects/[slug]`. Listing page is dynamic (server-fetch with cookies-aware client). Sitemap now async, includes all project slugs with `updated_at` as lastModified. Schema: projects table has a `slug` column (used as URL segment). Gallery modal removed from ProjectsPageClient; cards now link to detail routes. Build clean, 0 tsc errors.

- [x] **Step 12.1: Discover the schema**

Read `src/app/page.tsx` to find:
- Exact Supabase query that fetches the featured-projects list (table name, column names selected)
- Whether the table has a `slug` column or only `id`
- The image URL column name (the homepage already renders project images)

Also read `src/types/supabase.ts` and grep for the table name found above to confirm column list.

Report the table name + column list before writing any code.

- [ ] **Step 12.2: Update the `/projects` server shell to pass DB rows to the client island**

In `src/app/projects/page.tsx` (the server shell created in Task 9), add a server-side Supabase query to fetch ALL projects (not just featured). Use `supabase/server.ts` client pattern (same as other server components). Pass the results as a prop to `<ProjectsPageClient projects={projects} />`.

Update `ProjectsPageClient.tsx` to accept and render the `projects` prop as cards, each linking to `/projects/[id]` (or `/projects/[slug]` if a slug column exists). Use the same visual card treatment as the homepage featured-projects section.

- [ ] **Step 12.3: Create `src/app/projects/[id]/page.tsx`**

Dynamic route for individual project detail pages. Since projects are DB-driven with no guaranteed static slug column, use the numeric `id` as the URL segment unless Step 12.1 reveals a `slug` column.

```tsx
// Pseudocode — adapt column names from Step 12.1 discovery
import { createServerSupabaseClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic'; // or use generateStaticParams if small record count

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createServerSupabaseClient();
  const { data: project } = await supabase.from('<table>').select('name, description').eq('id', params.id).single();
  if (!project) return {};
  return {
    title: `${project.name} — ARSD Construction Project`,
    description: `${project.description ?? project.name} — completed by ARSD Construction Corporation, PCAB-licensed general contractor in Iloilo.`,
    alternates: { canonical: `https://arsd.co/projects/${params.id}` },
  };
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: project } = await supabase.from('<table>').select('*').eq('id', params.id).single();
  if (!project) notFound();

  return (
    <article>
      <h1>{project.name}</h1>
      {/* Render image, location, type, description, scope */}
      {/* BreadcrumbList JSON-LD: Home > Projects > project.name */}
      {/* CreativeWork JSON-LD */}
    </article>
  );
}
```

Implement BreadcrumbList (`Home > Projects > <project name>`) and a basic `CreativeWork` schema (same pattern as Task 11).

If the project count is small (≤50), add `generateStaticParams` that queries Supabase for all IDs to enable static pre-rendering. If large, skip `generateStaticParams` and use `dynamic = 'force-dynamic'`.

- [ ] **Step 12.4: Update `src/app/sitemap.ts` to include project URLs**

Import the server Supabase client and query for all project IDs (or slugs). Append sitemap entries with `changeFrequency: 'monthly'` and `priority: 0.6`.

Note: `sitemap.ts` runs at build time in Next.js App Router — the Supabase query here must use a client that works without a browser session. Use `createApiSupabaseClient` or `createServiceSupabaseClient` from `src/lib/supabase.ts` (the API variant has no cookies dependency and is safe for build-time calls).

- [ ] **Step 12.5: Verify**

`npx tsc --noEmit`. `npm run build`. Visit `/projects` and confirm real tiles render with project names from the DB. Click one tile, confirm `/projects/[id]` renders the correct project with H1, description, and JSON-LD. `curl /sitemap.xml` confirms project URLs appear.

**Verification:** DB-driven project tiles render on listing page; individual project routes work; build clean; project URLs in sitemap.

---

## Task 13: Add FAQ blocks + FAQPage JSON-LD on `/` and `/our-services`

**COMPLETED 2026-05-17:** 5-Q homepage FAQ + 6-Q services FAQ added with `<details>`/`<summary>` disclosure pattern. FAQPage JSON-LD scripts added on both pages. Programmatic text-match check (all 11 Q&As) confirms visible text is byte-for-byte identical to schema strings. Build clean — / stayed dynamic, /our-services stayed static at 2.05 kB.


**Why:** Audit pattern #5. Zero FAQ content sitewide kills featured-snippet and AI-citation eligibility. The schema must match the visible FAQ block exactly (Google penalizes mismatch).

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/our-services/page.tsx`

- [ ] **Step 13.1: Add FAQ section to homepage**

Add a visible FAQ section before the footer with 5 Q&As (text copy below). Match existing visual treatment.

1. **Is ARSD Construction Corporation PCAB-licensed?**
   Yes. ARSD holds PCAB Category A License No. 36037 from the Philippine Contractors Accreditation Board, qualifying us for large-scale general construction contracts.
2. **How long has ARSD Construction been in business?**
   ARSD Construction Corporation was founded in 1998 in Iloilo City and has completed 500+ projects across Western Visayas over 25+ years.
3. **Where does ARSD operate?**
   We are based in Iloilo City, Philippines, and primarily serve clients across Western Visayas. Contact us for projects elsewhere in the Philippines.
4. **What types of construction does ARSD handle?**
   Building construction, design & plan preparation, land development, waterproofing, and supply of aggregates. See `/our-services` for full scope.
5. **How can I request a project quote?**
   Call +63 33 337-7347 or visit our office at Figueroa St., Bonifacio, Arevalo, Iloilo City. You can also submit the contact form at `/contact-us`.

- [ ] **Step 13.2: Add matching FAQPage JSON-LD**

```ts
{
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: '...', acceptedAnswer: { '@type': 'Answer', text: '...' } },
    // ...one per Q&A
  ],
}
```

Critical: every question and answer text in the schema must match the visible page text verbatim.

- [ ] **Step 13.3: Add FAQ block to `/our-services`**

Six Q&As about scope, project minimums, lead times, license validity, service-area boundaries, design-build availability. Match the same schema-must-match-visible-text rule.

- [ ] **Step 13.4: Verify**

`npx tsc --noEmit`. Validate FAQPage JSON-LD with https://validator.schema.org/. Manually compare visible text vs. schema text — they must be identical strings.

**Verification:** FAQ block visible on both pages; schema valid; text matches.

---

## Task 14: Embed Google Maps on `/contact-us`

**COMPLETED 2026-05-17:** Existing "Map Section" reshaped to spec in ContactUsPageClient.tsx. Section sits below the contact form. Heading hierarchy: "Location" eyebrow → "Find Us" h2 → subhead. Iframe now uses placeholder Google Maps query URL (operator TODO comment in JSX above iframe), height bumped to 400px, accessibility (title + aria-label) added. Build clean, /contact-us stayed static at 7.59 kB.


**Files:**
- Modify: `src/app/contact-us/page.tsx`

- [ ] **Step 14.1: Add map embed**

Use a Google Maps `<iframe>` embed pointing at the actual office location. Wrap in a labeled section ("Find Us"). Use `loading="lazy"` and a reasonable height (e.g., 400px).

The exact embed URL can be obtained from Google Maps → Share → Embed a map for "Figueroa St., Arevalo, Iloilo City". Add a `// TODO: operator to paste real Google Maps share URL` comment around the iframe `src` if uncertain.

- [ ] **Step 14.2: Verify**

Visit `/contact-us`, confirm map renders.

**Verification:** Map visible; no console errors.

---

## Task 15: Final build + report

**COMPLETED 2026-05-17 — ENTIRE PLAN (Tasks 1-14) PASS.** Build clean (tsc 0 errors, `npm run build` exit 0). 27 sitemap URLs (5 marketing + 22 SSG project pages). All marketing pages have unique page-H1, metadata, canonical, and planned JSON-LD types. /robots.txt + /sitemap.xml serve correctly. /sign-up + /dashboard→/sign-in confirmed noindex. Working tree uncommitted, ready for operator to commit + ship. 2 in-code TODOs (map iframe URL, PCAB renewal status); ~10 operator post-deploy actions documented above. Backlog: navbar wraps brand logo in `<h1>` (pre-existing, every marketing page has 3 h1s — recommend demoting to `<a>` or `<div role="banner">`).


- [ ] **Step 15.1: Clean build**

```bash
npx tsc --noEmit
npm run build
```

Both must be clean.

- [ ] **Step 15.2: Smoke test all 5 marketing pages + 6 project pages locally**

Start dev server. For each URL:
- HTTP 200
- H1 renders
- No console errors
- View-source: `<title>` correct, `<meta name="description">` present, canonical present, JSON-LD parses

- [ ] **Step 15.3: Produce report to planner**

A markdown report listing:
- All files modified/created
- Build + smoke status (Pass/Fail per page)
- Open TODOs flagged in code comments (PCAB expiry, branded email, map iframe URL, image paths)
- Operator-action checklist (Search Console submit, Bing Webmaster Tools, license verification, real project images)

**Do not commit. Do not push. Hand the working tree back to the operator.**

---

## Task 16: GEO content optimization (deferred — separate session)

**Why deferred:** This task implements the output of the `geo-content-optimizer` skill audit (separate executor session, prompt already drafted). It depends on Tasks 1-13 shipping first — GEO content placed on a non-indexed page does nothing.

**Files (anticipated):**
- Modify: `src/app/page.tsx`, `src/app/our-services/page.tsx`, `src/app/about-us/page.tsx` (insert GEO-optimized content blocks per the geo-content-optimizer output)

**Trigger:** Operator runs the geo-content-optimizer audit prompt (already drafted in planner conversation), receives the rewritten content blocks, then issues a new plan/task for an executor session to apply them.

This task is a stub — do not implement until the geo-content-optimizer output exists and Tasks 1-15 are deployed.

---

## Operator post-deploy actions (manual, after Tasks 1-15 ship to production)

These are NOT executor tasks — they're operator actions in external systems.

1. **Submit sitemap** in Google Search Console → Sitemaps → submit `https://arsd.co/sitemap.xml`
2. **Request indexing** via URL Inspection for the 4 currently-missing pages (`/our-services`, `/projects`, `/about-us`, `/contact-us`) — manual one-time push
3. **Set up Bing Webmaster Tools**, submit same sitemap
4. **Verify PCAB license status** with the licensing board (expiry shown as Aug 22, 2025); update site if renewed, remove credential block if lapsed
5. **Create branded email** (`contact@arsd.co` or `info@arsd.co`); ensure DNS MX + inbox before the email goes live on the site
6. **Replace project image placeholders** in `src/data/projects.ts` with real photos for the 6 projects (note: Task 8 finding revealed projects are DB-driven; Task 12 will be amended to read from Supabase rather than static file)
6b. **Fix project name typos in Supabase** (from Task 8 deferral):
```sql
-- Locate the projects table
SELECT table_schema, table_name FROM information_schema.columns
WHERE column_name = 'name' AND table_schema NOT IN ('pg_catalog', 'information_schema')
  AND table_name LIKE '%project%';
-- Apply corrections (substitute the table_name found above)
BEGIN;
UPDATE <table_name> SET name = 'Proposed Warehouse Complex' WHERE name = 'Propose Warehouse Complex';
UPDATE <table_name> SET name = '4-Storey BEU Complex Extension' WHERE name = '4 Storey BEU Complex Extention';
COMMIT;
```
7. **Confirm office coordinates** for the LocalBusiness `geo` field (latitude/longitude in Task 11)
8. **Run PageSpeed Insights baseline** (`https://pagespeed.web.dev/report?url=https://arsd.co/`) once organic traffic exists to populate CrUX
9. **Run securityheaders.com check** (`https://securityheaders.com/?q=arsd.co`) — add HSTS preload + CSP if missing
10. **Monitor monthly** — Search Console indexed-page count, crawl stats, CWV trend, position tracking on "construction company Iloilo" + brand query
