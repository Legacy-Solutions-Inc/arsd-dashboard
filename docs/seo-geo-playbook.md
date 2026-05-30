# SEO/GEO Implementation Playbook — Next.js App Router

> **Reusable methodology.** Pair this playbook with a per-project plan under `docs/superpowers/plans/`. The playbook explains *what* and *why*; the plan executes *how* and *where*.

## Purpose and Scope

This playbook is a reusable methodology for implementing search-engine optimization (SEO) and generative-engine optimization (GEO) on Next.js 14+ App Router projects. SEO targets traditional crawlers (Googlebot, Bingbot) and the index-and-rank model that drives the classic SERP. GEO targets retrieval-and-citation crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) and the answer-engine model that powers ChatGPT, Claude, Perplexity, AI Overviews, and Gemini. The two optimizations overlap structurally (both reward clean metadata, structured data, and authoritative content) but diverge on emphasis: SEO rewards crawlable links and ranking signals; GEO rewards extractable facts, entity disambiguation, and citation-worthy attribution. The patterns here are weighted roughly 50/50 between the two so a single implementation pass earns both surfaces.

## How to Use This Playbook

Treat this document as the reference manual and the per-project plan as the runbook. When starting an SEO/GEO pass on a project, generate a tailored plan at `docs/superpowers/plans/YYYY-MM-DD-<project-slug>-seo-geo-implementation.md`. The plan should mirror the task structure used by `superpowers:executing-plans` (numbered tasks with `- [ ]` substeps and a final `**Verification:**` line) so each task is dispatchable one-at-a-time to a fresh executor session. The playbook never changes during an implementation; the plan does. Update the playbook only when you learn a new pattern that should apply across future projects.

## Foundations: What SEO and GEO Actually Optimize

### SEO

SEO optimizes for the crawl → index → rank → click loop. The crawler reads the site, the indexer stores it, the ranker orders results for a query, and the user clicks (or doesn't). Optimization happens at every step: clean robots and sitemap to be crawled; clean metadata and canonical URLs to be indexed without duplication; clean signals (titles, headings, internal links, structured data, Core Web Vitals) to be ranked; clean SERP presentation (titles, descriptions, rich results) to be clicked. Failure modes: indexation gaps, duplicate content, thin pages, slow loads, missing structured data, hostile UX patterns that suppress rankings.

### GEO

GEO optimizes for the retrieve → cite loop. AI engines retrieve passages and decide whether to cite the source verbatim, paraphrase it, or ignore it. Citation depends on three signals: extractability (can the engine parse a clean factual claim from the page?), authority (does the entity behind the claim resolve to a known, disambiguable identity?), and freshness (is the claim dated and current?). Optimization happens at the passage level (definitions-first sentences, attributed statistics, comparison tables, FAQ patterns), the entity level (Organization/Person schema with `sameAs` to canonical knowledge graphs), and the metadata level (`dateModified`, `author`, `publisher`). Failure modes: vague claims, unattributed statistics, generic naming that fails entity disambiguation, missing or stale freshness signals, content trapped behind client-side JS that retrieval crawlers can't render.

## SEO Implementation Patterns (Next.js App Router)

### Static and Dynamic `metadata` / `generateMetadata`

Every public route should export `metadata` (static) or `generateMetadata` (dynamic). Static for marketing pages; dynamic for content pulled from a database or CMS. The Metadata API replaces manual `<head>` management — never set `<title>` or `<meta>` directly in JSX inside an App Router route.

```ts
// Static export — use for marketing pages with stable copy
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Construction Services in Iloilo — ARSD',
  description: 'PCAB-licensed general contractor offering five construction services across Western Visayas.',
  alternates: { canonical: 'https://arsd.co/our-services' },
};
```

```ts
// Dynamic — resolve at request time from DB
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: 'Not Found' };
  return {
    title: `${project.name} | ARSD Construction Projects`,
    description: `${project.name} in ${project.location} — completed by ARSD Construction Corporation.`,
    alternates: { canonical: `https://arsd.co/projects/${project.slug}` },
  };
}
```

Constraint: a route can only export `metadata` from a server component. If a page is `"use client"`, split it into a server shell that exports `metadata` and renders a `<PageClient />` component holding the interactive content. This is the dominant refactor when retrofitting SEO into an existing app.

The root `layout.tsx` should set `metadataBase` and default `title.template` so per-page titles compose cleanly:

```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Example — One-line brand statement',
    template: '%s | Example',
  },
  description: 'Default site description used when a route doesn\'t set its own.',
};
```

### Canonical URLs via `alternates.canonical`

Every indexable route must declare an absolute canonical. Without it, parameterized variants (`?utm_source=`, trailing slashes, capitalization differences) split signal across duplicates.

```ts
export const metadata: Metadata = {
  alternates: { canonical: 'https://example.com/services' },
};
```

For dynamic routes, compose from the resolved slug, not from `params` raw. Never leave `canonical` unset on an indexable page.

### `app/robots.ts` and `app/sitemap.ts`

Generate `/robots.txt` and `/sitemap.xml` programmatically from the App Router so they stay in sync with the route tree.

```ts
// src/app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://example.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/sign-in', '/sign-up', '/dashboard/', '/api/', '/auth/'],
      },
      { userAgent: 'GPTBot', allow: ['/'] },
      { userAgent: 'ClaudeBot', allow: ['/'] },
      { userAgent: 'PerplexityBot', allow: ['/'] },
      { userAgent: 'Google-Extended', allow: ['/'] },
      { userAgent: 'CCBot', disallow: ['/'] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
```

```ts
// src/app/sitemap.ts — async, multi-source
import type { MetadataRoute } from 'next';
import { createApiSupabaseClient } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://example.com';
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/services`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
  ];

  const supabase = createApiSupabaseClient();
  const { data } = await supabase
    .from('projects')
    .select('slug, updated_at')
    .eq('is_deleted', false)
    .not('slug', 'is', null);

  const dynamicPages: MetadataRoute.Sitemap = (data ?? []).map((p) => ({
    url: `${baseUrl}/projects/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticPages, ...dynamicPages];
}
```

For DB-backed sitemaps, use a Supabase client variant that doesn't require browser cookies (e.g., the API or service-role client) so the route runs cleanly during build and at request time.

### Open Graph and Twitter Card Metadata, Including `opengraph-image.tsx`

Every shareable page needs Open Graph and Twitter Card tags so social and AI scrapers pull a meaningful preview. Define defaults in root layout; override per page where the title/description differ from defaults.

```ts
// root layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  openGraph: {
    siteName: 'Example',
    type: 'website',
    locale: 'en_PH',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@example',
  },
};
```

Use file-based OG images for zero-config preview generation. Place `opengraph-image.tsx` at the route segment you want it to apply to (root for sitewide default; per-page for overrides):

```tsx
// src/app/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Example — One-line brand statement';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#111', color: '#fff', fontSize: 72, fontWeight: 700 }}>
        Example
      </div>
    ),
    { ...size },
  );
}
```

Mirror with `twitter-image.tsx` if you need a different aspect ratio or branding for X/Twitter.

### JSON-LD Structured Data: Organization, LocalBusiness, Article, Product, Service, FAQPage, HowTo, BreadcrumbList

Inject JSON-LD via `<script type="application/ld+json">` inside the page (or a wrapping server component). Use `@id` to cross-reference schemas — this is how a `Service` declares its provider is the same `Organization` defined in the root layout.

```tsx
// src/app/layout.tsx — Organization at root
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': 'https://example.com/#organization',
      name: 'Example Corp',
      url: 'https://example.com',
      logo: 'https://example.com/logo.png',
      foundingDate: '1998',
      sameAs: [
        'https://www.wikidata.org/wiki/Q...',
        'https://www.linkedin.com/company/example',
        'https://www.crunchbase.com/organization/example',
      ],
    }),
  }}
/>
```

Pick the type that matches the page intent:
- **Organization** — root layout; the canonical brand entity. Use everywhere.
- **LocalBusiness** (or a child like `GeneralContractor`, `Restaurant`, `Dentist`) — physical location pages with address, hours, geo. Use on `/contact` or a dedicated location page.
- **Service** — service-line pages. Link `provider` to the Organization `@id`. Use one per service.
- **Product** — items for sale with price/availability.
- **Article** / **BlogPosting** — editorial content. Required for AI-citation eligibility on long-form content. Always include `datePublished`, `dateModified`, `author`.
- **FAQPage** — Q&A blocks. Schema text must match visible text exactly or Google will demote it.
- **HowTo** — step-by-step procedures with images.
- **BreadcrumbList** — navigation trail. Add to every non-home page.
- **CreativeWork** — generic fallback for portfolio/case-study pages that don't fit Article or Product.

Multiple schemas on one page are fine and encouraged (e.g., a project page can have BreadcrumbList + CreativeWork + Organization reference simultaneously).

### `next/image` and `next/font` for Core Web Vitals

`next/image` handles responsive sizing, lazy loading, WebP/AVIF conversion, and CLS prevention. Never use raw `<img>` for content images.

```tsx
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Descriptive alt text — not the filename"
  fill
  priority // only on above-the-fold images that block LCP
  sizes="(min-width: 1024px) 50vw, 100vw"
  className="object-cover"
/>
```

Set `priority` on the hero/LCP image only — overuse defeats lazy loading. For remote images, configure `images.remotePatterns` in `next.config.js`.

`next/font` self-hosts Google Fonts at build time, eliminating render-blocking font requests:

```ts
// src/app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

// apply: <body className={inter.variable}>
```

Use `display: 'swap'` to prevent FOIT and improve LCP.

### Semantic HTML and Heading Hierarchy Rules

One `<h1>` per page, matching the page's primary topic. Descend to `<h2>` for section headings, `<h3>` for subsections. Skip levels (h2 → h4) only when the visual design demands it AND the document outline still makes sense.

Common mistake: wrapping a brand logo in `<h1>` inside the sitewide navbar. Every page then has two `<h1>` elements (page H1 + nav H1), confusing the outline. Use `<span>` or `<p>` with display-heading classes for branding inside navigation.

Use semantic landmarks: `<header>`, `<main>`, `<footer>`, `<nav>`, `<article>`, `<aside>`. Crawlers and screen readers both rely on these.

### Internal Linking and Breadcrumb Patterns

Link related content liberally with descriptive anchor text. Avoid "click here" or naked URLs — anchor text is a ranking signal.

Add a breadcrumb component to every non-home page and emit matching `BreadcrumbList` JSON-LD:

```tsx
<nav aria-label="Breadcrumb">
  <ol className="flex gap-2 text-sm">
    <li><Link href="/">Home</Link></li>
    <li>/</li>
    <li><Link href="/projects">Projects</Link></li>
    <li>/</li>
    <li aria-current="page">{project.name}</li>
  </ol>
</nav>

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.com/' },
        { '@type': 'ListItem', position: 2, name: 'Projects', item: 'https://example.com/projects' },
        { '@type': 'ListItem', position: 3, name: project.name, item: `https://example.com/projects/${project.slug}` },
      ],
    }),
  }}
/>
```

### Redirects via `next.config.js` and Middleware (When to Use Which)

Use `next.config.js` `redirects()` for static, declarative URL maps (renamed routes, old-to-new path changes, trailing-slash normalization):

```js
// next.config.js
module.exports = {
  async redirects() {
    return [
      { source: '/old-services', destination: '/services', permanent: true },
      { source: '/blog/:slug*', destination: '/insights/:slug*', permanent: true },
    ];
  },
};
```

Use `middleware.ts` for dynamic decisions that require runtime context (auth state, geo, A/B routing). Middleware runs on every matched request — keep it lean.

Always use `permanent: true` (HTTP 308) for SEO redirects to preserve link equity; `permanent: false` (307) for temporary redirects.

### Hreflang for Multilingual Sites

For sites with regional or language variants, declare alternates so search engines serve the right version to each audience:

```ts
export const metadata: Metadata = {
  alternates: {
    canonical: 'https://example.com/en/services',
    languages: {
      'en-PH': 'https://example.com/en/services',
      'tl-PH': 'https://example.com/tl/services',
      'x-default': 'https://example.com/services',
    },
  },
};
```

Each language variant must reciprocally declare the others, including `x-default`.

### `noindex`/`nofollow` via `metadata.robots`

Pages that should not be indexed (staging, internal tools, auth flows, search-results pages, pagination beyond N) declare it via the Metadata API:

```ts
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};
```

Set this on a layout file to cover an entire route subtree. Common pattern: a server `layout.tsx` at `app/(auth)/` and `app/dashboard/` that exports `metadata.robots` with `index: false`.

## GEO Implementation Patterns

### `llms.txt` and `llms-full.txt`

`llms.txt` is the AI-engine equivalent of `robots.txt` — a machine-readable, opinionated summary of a site's most important content for retrieval crawlers. Place it at the root: `public/llms.txt` (Next.js serves files in `public/` from the URL root) or generate it via `src/app/llms.txt/route.ts`.

```ts
// src/app/llms.txt/route.ts
export const dynamic = 'force-static';

export function GET() {
  const body = `# Example Corp

> One-paragraph site summary that an LLM should use when answering questions about Example Corp.

## About
- [About Example](https://example.com/about): Founding date, mission, credentials.
- [Our Services](https://example.com/services): Five service lines we offer.

## Services
- [Building Construction](https://example.com/services#building): Description.
- [Land Development](https://example.com/services#land): Description.

## Resources
- [FAQ](https://example.com/#faq): Common questions and answers.
- [Contact](https://example.com/contact): Phone, email, address.
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
```

`llms-full.txt` is the expanded variant containing the full text content of the linked pages — useful when an engine wants to ingest the entire site in one fetch. Generate it from the same content sources to keep them in sync.

### AI-Crawler Directives in `robots.ts`

Each major AI engine ships its own user-agent. Decide allow/disallow per engine, not as a blanket policy. Allow retrieval bots (the ones that fetch when answering a user query) so the brand surfaces in AI answers; consider disallowing training-only bots if you don't want your content in model weights.

| User-agent | Operator | Purpose | Default recommendation |
|------------|----------|---------|------------------------|
| `GPTBot` | OpenAI | Training + browse | Allow |
| `OAI-SearchBot` | OpenAI | SearchGPT crawler | Allow |
| `ChatGPT-User` | OpenAI | User-triggered fetches | Allow |
| `ClaudeBot` | Anthropic | Training + browse | Allow |
| `Claude-Web` | Anthropic | User-triggered fetches | Allow |
| `anthropic-ai` | Anthropic | Legacy training crawler | Allow |
| `PerplexityBot` | Perplexity | Citation crawler | Allow |
| `Google-Extended` | Google | Gemini training opt-out | Allow (also affects AI Overviews) |
| `CCBot` | Common Crawl | Bulk corpus | Often disallowed (training-only, downstream of many actors) |
| `Bytespider` | ByteDance | Training | Often disallowed |

For brand sites optimizing for citation visibility, allowing all retrieval bots and selectively disallowing training-only bots is the typical posture. For sites with proprietary content, the opposite.

### Entity Grounding via `sameAs`

AI engines disambiguate entities by following `sameAs` links to canonical knowledge graphs. A bare `Organization` schema with no `sameAs` is an unanchored entity — the engine can't reliably resolve it to a single real-world thing.

```ts
sameAs: [
  'https://www.wikidata.org/wiki/Q...',          // strongest signal — the canonical KG
  'https://en.wikipedia.org/wiki/Example_Corp',  // if a page exists
  'https://www.linkedin.com/company/example',
  'https://www.crunchbase.com/organization/example',
  'https://github.com/example',
  'https://www.facebook.com/example',
  'https://www.google.com/maps/place/...',       // Google Maps Place URL grounds local entities
  'https://twitter.com/example',
];
```

Industry-specific identifiers (PCAB license verification page, GS1 GTIN registry, NPI for healthcare) belong here too. The more authoritative cross-references, the more confident the engine's disambiguation.

### E-E-A-T Signal Patterns: Author Schema, dateModified, Expert Bios, Credentials

Experience, Expertise, Authoritativeness, Trustworthiness — Google's quality framework. AI engines apply equivalent heuristics when deciding whether a page is citation-worthy.

Every editorial page should declare `author`, `datePublished`, `dateModified`:

```ts
{
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Article title',
  datePublished: '2026-05-19',
  dateModified: '2026-05-19',
  author: {
    '@type': 'Person',
    name: 'Author Name',
    url: 'https://example.com/team/author-name',
    jobTitle: 'Senior Engineer',
    sameAs: ['https://www.linkedin.com/in/author-name'],
  },
  publisher: { '@id': 'https://example.com/#organization' },
}
```

For trust-anchored businesses (medical, legal, financial, construction), publish dedicated `/team/[slug]` or `/about` pages with `Person` schema for each named expert. Include credentials (`hasCredential`), affiliations, publications. Cross-reference via `@id` from any content that person authored.

### Citation-Friendly Content Patterns: Definitions-First Sentences, Attributed Statistics, Comparison Tables

AI engines preferentially cite passages they can quote without further context. Three patterns work:

**Definitions-first.** Start a paragraph by defining the entity or concept, then expand. "ARSD Construction Corporation is a PCAB Category A licensed general contractor founded in 1998 in Iloilo City, Philippines." This sentence is self-contained, factual, and quotable.

**Attributed statistics.** Every number should declare its source and date. "ARSD has completed 500+ construction projects across Western Visayas as of May 2026 (internal records)." A naked "500+ projects completed" is harder to cite because the engine can't verify or contextualize it.

**Comparison tables.** AI engines love structured comparisons because they map cleanly to extractive prompts ("X vs Y"). Use a `<table>` element with a clear thead and tbody. Mark up notable comparisons with `Table` schema where applicable.

### FAQ and HowTo Schema as AI-Extraction Surfaces

FAQ and HowTo are the highest-leverage GEO schema types because they map one-to-one to the question-answer shape AI engines emit.

```tsx
// Visible FAQ — must match schema text exactly
<section id="faq">
  <h2>Frequently Asked Questions</h2>
  {faqs.map((faq) => (
    <details key={faq.q}>
      <summary>{faq.q}</summary>
      <p>{faq.a}</p>
    </details>
  ))}
</section>

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    }),
  }}
/>
```

Critical: the schema text must match the visible text exactly. Google demotes pages where the FAQ schema's `Answer.text` differs from what users see. Use a single source array (`HOMEPAGE_FAQS`) rendered both into the DOM and the schema to guarantee parity.

HowTo follows the same pattern for processes:

```ts
{
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to request a construction quote from ARSD',
  step: [
    { '@type': 'HowToStep', name: 'Call our office', text: 'Dial (033) 337 7347 during business hours.' },
    { '@type': 'HowToStep', name: 'Describe your project', text: 'Provide location, scope, and timeline.' },
    { '@type': 'HowToStep', name: 'Site assessment', text: 'We schedule a site visit and provide a written quote.' },
  ],
}
```

### Canonical Entity Naming in Titles and First Sentences

The entity's canonical name should appear in the `<title>`, the H1, and the first visible sentence of each significant page. AI engines weight these positions heavily when resolving which entity a page is "about."

Bad: "Services — ARSD"
Good: "Construction Services in Iloilo — ARSD Construction Corporation"

Bad opening: "Welcome to our services page."
Good opening: "ARSD Construction Corporation, a PCAB Category A licensed general contractor based in Iloilo City, offers five construction services across Western Visayas."

### Factual Density and Answer-Shaped Paragraphs

Pages that read like marketing copy ("award-winning solutions for a brighter future") cite poorly. Pages that read like a Wikipedia entry ("Founded in 1998, ARSD holds PCAB License No. 36037 and has completed 500+ projects in Western Visayas") cite well.

Optimize for facts per paragraph: dates, numbers, named entities, credentials, locations. One factual claim per sentence; one topical claim per paragraph. Avoid filler adjectives ("innovative", "leading", "best-in-class") — they don't survive citation extraction.

### Structured Data Types AI Engines Preferentially Cite

Empirically observed citation preference by content type:

| Content type | Preferred schema | Why |
|--------------|------------------|-----|
| Brand/company page | Organization + LocalBusiness | Resolves the entity |
| Service/product page | Service or Product | Maps to "what does X offer?" |
| FAQ section | FAQPage | One-to-one to Q&A extraction |
| How-to / process | HowTo | One-to-one to step extraction |
| Article / case study | Article + Person (author) | Carries authority signals |
| Portfolio entry | CreativeWork + LocalBusiness creator | Anchors to entity |
| Testimonial / review | Review + AggregateRating | Trust signal |
| Comparison content | (no native type — use a clean `<table>` + plain prose) | Engines extract directly |
| Glossary / definition | DefinedTerm | Direct citation surface |

Always link related schemas via `@id`. A Service that references its `provider` by `@id` to the root Organization is doing entity grounding and structured-data optimization in one move.

## Verification and Tooling

After implementation, verify each layer.

**Structured data**
- [Schema.org Validator](https://validator.schema.org/) — paste page URL or raw JSON-LD; catches type errors and missing required fields.
- [Google Rich Results Test](https://search.google.com/test/rich-results) — confirms eligibility for Google rich result types (FAQ, HowTo, Article, etc.).

**Crawl + indexing**
- [robots.txt Tester](https://www.google.com/webmasters/tools/robots-testing-tool) (in Search Console) — confirms specific URLs are allowed/disallowed as intended.
- Manual `curl https://example.com/sitemap.xml` — confirms valid XML and expected URL count.
- [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html) — catches schema violations.

**Performance / Core Web Vitals**
- [PageSpeed Insights](https://pagespeed.web.dev/) — Lighthouse + CrUX real-world data.
- Search Console → Core Web Vitals report — production data over time.

**Indexation and presentation**
- Google Search Console → URL Inspection → submit each canonical URL.
- Bing Webmaster Tools → submit sitemap.
- `site:example.com` Google search — confirms indexed page count.

**AI-engine spot checks**
Roughly monthly, for each target query:
- ChatGPT (with web access enabled): "Tell me about [brand]" / "[primary service in primary location]"
- Perplexity: same prompts
- Google AI Overviews: same prompts via google.com
- Gemini / Bard: same prompts
- Claude (with web access): same prompts

Record whether the brand is cited, paraphrased, or absent. Track the trend, not single results — citation behavior varies by session.

## Common Pitfalls

1. **Setting metadata in JSX `<head>` instead of via the Metadata API.** In App Router this silently doesn't work as expected; Next.js dedupes against its own metadata, leading to confusing duplicates or missing tags. *Fix: use `export const metadata` or `generateMetadata` only.*

2. **Client-component pages without a server shell.** A `"use client"` page cannot export `metadata`. Pages that need both interactivity and metadata must be split into a server `page.tsx` that exports metadata and renders a client `<PageClient />` child. *Fix: server-shell + client-island pattern.*

3. **FAQ schema text not matching visible text.** Google compares the rendered DOM against the schema and demotes pages where they diverge. *Fix: render both from a single source array.*

4. **Missing `metadataBase`.** Without it, relative URLs in Open Graph images resolve to localhost and break social previews. *Fix: set `metadataBase: new URL('https://example.com')` in root layout.*

5. **Multiple `<h1>` per page.** Brand logos wrapped in `<h1>` inside the navbar create a second H1 on every page, confusing the document outline. *Fix: use `<span>` or `<p>` with display-heading classes for branding.*

6. **`sameAs` array with one or zero entries.** Insufficient for entity disambiguation by AI engines. *Fix: add at minimum Wikidata, LinkedIn, Google Maps Place URL, and industry-specific identifiers.*

7. **Stat counters that animate from 0 with no real value.** When the page is crawled or screenshot, the visible number is "0+" — useless content. *Fix: pre-fill with the target value as the static prop; animate visually only.*

8. **Yahoo/Gmail/generic email addresses in `LocalBusiness.email`.** Hurts E-A-T and trust signals. *Fix: branded email at the verified domain.*

9. **Inline `<img>` instead of `<Image>` from `next/image`.** Loses lazy loading, responsive sizing, CLS prevention, and modern format conversion. *Fix: replace all content `<img>` with `<Image>`.*

10. **`priority` on every image.** Defeats lazy loading and tanks LCP on pages with many images. *Fix: `priority` only on the LCP candidate (typically one hero image per page).*

11. **Treating `robots.txt` as a security boundary.** Disallowing `/dashboard/` in robots.txt does NOT prevent crawling — it asks politely. Bad actors and some legitimate crawlers ignore it. *Fix: enforce auth at the route handler / middleware layer; use `noindex` metadata for the SEO concern only.*

12. **No `dateModified` on content pages.** AI engines weight freshness; missing modification dates push pages toward "stale until proven otherwise." *Fix: emit `dateModified` from a real timestamp (CMS field, file mtime, build time, or DB column) on every article and case study.*

13. **Sitemap with `lastModified: new Date()` for every URL.** Tells crawlers "everything changed today, every day" — they learn to ignore it. *Fix: use real per-resource modification timestamps.*

14. **Allowing `CCBot` while disallowing GPTBot.** Inverted posture — CCBot feeds many downstream actors with less control; GPTBot at least signs queries. *Fix: align AI-crawler directives with actual content-distribution intent.*

## When to Deviate

The playbook's defaults assume a public marketing site optimizing for both classical search and AI engines. Override when:

- **Authenticated SaaS surfaces.** `/app/*` and `/dashboard/*` routes shouldn't be indexed or crawled by AI engines. Apply `noindex, nofollow` at the layout and disallow in `robots.ts`. Skip JSON-LD entirely on these routes.
- **Staging or preview environments.** Globally `noindex`. Block all crawlers in `robots.ts`. Disable sitemap. Use a different `metadataBase` to prevent canonical leaks.
- **Sites with proprietary content (legal, medical IP, paywalled research).** Disallow training crawlers (`CCBot`, `GPTBot`, `ClaudeBot`, `anthropic-ai`); allow citation crawlers only if you want excerpts surfaced. Consider gating the most sensitive content behind auth so robots policy isn't the only line of defense.
- **Single-page applications behind auth.** GEO patterns don't apply if content isn't publicly retrievable. Skip the GEO half of the playbook; focus on SEO of the public marketing shell.
- **Sites under URL migration.** Pause sitemap submission and rich-result work until redirects are validated and Search Console shows the new URLs being discovered. Don't compound rank loss with structured-data churn during transition.
- **Highly regulated content.** Some industries (pharma, finance) restrict what claims can appear in marketing copy. Coordinate with compliance before adopting the "factual density" and "comparison tables" recommendations — both can surface unverified claims if applied carelessly.
