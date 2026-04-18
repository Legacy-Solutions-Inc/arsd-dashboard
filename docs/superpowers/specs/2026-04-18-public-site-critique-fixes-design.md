# Public Site Critique Fixes — Design Spec
**Date:** 2026-04-18  
**Branch:** redesign/public-site-overhaul  
**Scope:** Fix all issues surfaced by /critique run on the public site redesign

---

## Context

A /critique pass on the redesigned public pages returned 18 findings (P0–P3). The redesigned pages (homepage, services, contact) are clean and consistent. The About Us page was never redesigned and is the primary offender — it uses a completely different visual language (light theme, glassmorphism, gradient icons, border-l-4 stripes). Secondary issues are the contact form's lack of validation/feedback and several minor polish items.

---

## Section 1: About Us Page Full Redesign

### Goal
Bring About Us into the established dark industrial design system used by all other public pages.

### Design System Reference
- Background: `#111111` base, `#1c1c1c` alternating sections
- Text: `#f0ede8` headings, `#a09890` body/muted
- Borders: `divide-[#2a2626]`, `border-[#2a2626]`
- Accent: `arsd-red` (#DC2626) — CTAs and key moments only
- Display font: `font-display` (Barlow Condensed, uppercase, weight 700–800)
- Body font: `font-body` (Figtree)
- Layout: `responsive-container` (not `container mx-auto`)
- Pattern: flat dividing-line grids instead of card boxes

### Banned Patterns to Remove
All of the following must be eliminated from `about-us/page.tsx` and any components it uses exclusively:
- `border-l-4` / `border-l-arsd-red` on cards (P0 absolute ban)
- `blur-3xl` / `blur-2xl` decorative glow orbs
- `bg-gradient-to-br from-arsd-red to-red-600 rounded-xl` gradient icon containers
- `group-hover:scale-110 transition-transform` on icons
- `shadow-xl hover:shadow-2xl` stacking
- `from-slate-900 via-slate-800 to-slate-900` gradient section backgrounds
- `from-blue-500/20` blue accent (off-brand)
- `inline-flex ... rounded-full` pill badge section labels → replace with `<SectionEyebrow />`
- `bg-white`, `bg-gray-50`, `text-gray-900`, `text-gray-600` (light theme)
- `container mx-auto px-4 sm:px-6` → replace with `responsive-container`
- `text-center` as the dominant layout pattern across sections

### Section-by-Section Layout

**Hero**
- Pattern: matches contact page hero (text-left, no image in hero block)
- `SectionEyebrow` label ("About ARSD") + large h1 ("Building Excellence Since 1998") + subtext
- Background: `bg-[#111111]`, padding `py-20 sm:py-28`
- No gradient background, no pill badge, no blur orbs, no image

**Our Story**
- Pattern: two-column grid (`lg:grid-cols-2 gap-12`)
- Left: `SectionEyebrow` + h2 + story paragraphs from `ABOUT_US_DATA.story.paragraphs`
- Right: flat `grid grid-cols-2 divide-x divide-y divide-[#2a2626] border border-[#2a2626]` achievements grid
  - Each cell: `p-6 text-center`, number in `font-display text-4xl text-[#f0ede8]`, label in `text-xs text-[#a09890] uppercase tracking-wider`
  - Data: from `ABOUT_US_DATA.achievements` (number + label)
- Background: `bg-[#1c1c1c]`
- No white card wrapper, no shadow, no gradient icon

**Mission & Vision**
- Pattern: two-column with single `divide-x divide-[#2a2626]` separator (inside a `grid lg:grid-cols-2`)
- Each column: `p-8 lg:p-12`
  - Small red label (`text-xs uppercase tracking-widest text-arsd-red mb-2`)
  - h3 in `font-display text-2xl text-[#f0ede8] uppercase tracking-tight mb-4`
  - Paragraph in `text-[#a09890] leading-relaxed`
- Background: `bg-[#111111]`, wrapped in `border border-[#2a2626]`
- No `border-l-4`, no Card component, no icon container

**Milestones / Company Timeline**
- Pattern: flat numbered rows, `divide-y divide-[#2a2626]`
- Each row: `py-8 grid grid-cols-[5rem_1fr] gap-8 items-start`
  - Year: `font-display text-2xl text-arsd-red`
  - Right: h4 in `font-display text-lg text-[#f0ede8] uppercase tracking-tight mb-1` + `p` in `text-sm text-[#a09890] leading-relaxed`
- Wrapping section: `bg-[#1c1c1c]`
- Do NOT use `<MilestoneCard />` — it is card-based and will be bypassed in this page

**Certifications**
- Pattern: flat `grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#2a2626]`
  - Same layout as Equipment & Fleet section on services page
- Each column: cert title in `font-display text-lg uppercase text-[#f0ede8] mb-2`, description/number in `text-2xl font-display text-arsd-red mb-1`, subtitle in `text-sm text-[#a09890]`
- Background: `bg-[#111111]`
- No `bg-white rounded-2xl shadow-xl`, no gradient icon, no `hover:-translate-y-2`

**CTA**
- Replace bespoke CTA section with `<PageCTA />` component
- Props: `heading="Partner With ARSD"`, `body="Experience 25+ years of expertise..."`, `primaryLabel="Contact Us"`, `primaryHref="/contact-us"`, `secondaryLabel="View Our Work"`, `secondaryHref="/projects"`

### Imports to Remove (from `about-us/page.tsx` only — do not delete the component files)
`Card`, `CardContent`, `CardHeader`, `CardTitle`, `Award`, `Target`, `Shield`, `Heart`, `Lightbulb`, `ArrowRight`, `Building`, `Hammer`, `HardHat`, `Users`, `Clock`, `CheckCircle`, `Star`, `MapPin`, `Phone`, `Mail`, `Calendar`, `TrendingUp`, `AwardIcon`, `FileText`, `CheckCircle2`, `ValueCard`, `MilestoneCard`, `TeamMemberCard`, `TeamMember`

### Imports to Add
`SectionEyebrow`, `PageCTA`, `ArrowUpRight` (already present)

---

## Section 2: Contact Form UX Layer

### File
`src/app/contact-us/page.tsx`

### Validation
- Add `errors` state: `Record<string, string>` — keyed by field name
- Required fields: `firstName`, `lastName`, `email`, `message`
- On submit attempt, validate before firing mailto:
  - If any required field is empty, populate `errors` and return early (do not open mailto)
  - Each failing input gets: `border-red-500` class added, error message `<p className="text-xs text-red-400 mt-1">` beneath the input
- Clear field-level error when the user types into that field (`onChange` clears the error for that key)

### Success State
- Add `submitted` boolean state, initially `false`
- After validation passes and mailto href is set, set `submitted = true`
- Conditionally render: when `submitted === true`, replace the `<form>` with a success panel:
  ```
  bg-[#1c1c1c] border border-[#2a2626] rounded p-8
  ✓ (arsd-red checkmark icon)  
  "Inquiry sent"  (font-display text-2xl text-[#f0ede8] uppercase)
  "We'll reply within 24 hours."  (text-[#a09890])
  [Send another inquiry]  (text-sm text-arsd-red hover:text-red-400 cursor-pointer — resets submitted + clears form)
  ```

### No Other Changes
The "Our Services" sidebar list and the map section remain unchanged.

---

## Section 3: Remaining Fixes

### Homepage Empty Project State
**File:** `src/app/page.tsx`

Replace the bare placeholder grid:
```tsx
Array.from({ length: 6 }).map((_, i) => (
  <div key={i} className="aspect-[16/10] rounded-lg bg-[#1c1c1c] border border-[#2a2626]" />
))
```
With a single centered placeholder spanning the full grid width:
```tsx
<div className="col-span-full flex flex-col items-center justify-center py-20 border border-[#2a2626] rounded-lg text-center gap-4">
  <p className="text-[#a09890] text-sm">Portfolio coming soon.</p>
  <a href="/contact-us" className="text-sm text-arsd-red hover:text-red-400 font-semibold transition-colors">
    Contact us to discuss past projects →
  </a>
</div>
```

### Services Page Mobile Numbers
**File:** `src/app/our-services/page.tsx`

Change decorative number size class from:
```
text-[8rem] sm:text-[10rem]
```
To:
```
text-[5rem] sm:text-[10rem]
```

### Focus Styles
**Files:** `src/components/hero.tsx`, `src/components/navbar.tsx`, `src/app/contact-us/page.tsx`

Add `focus-visible:ring-2 focus-visible:ring-arsd-red focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]` to:
- All `<a>` tags used as primary CTAs in hero and navbar
- The contact form submit button
- Form inputs already use Shadcn's ring styles — verify they include a visible ring in dark theme context; if not, patch the `Input` and `Textarea` className to include `focus-visible:ring-arsd-red`

---

## Out of Scope
- Replacing the contact form's mailto with a Server Action / Supabase backend (deferred)
- Dashboard pages (not part of the public site redesign)
- Removing the "Our Services" sidebar from the contact page

---

## Success Criteria
- [ ] About Us page uses `#111111`/`#1c1c1c` backgrounds — no white or gray-50
- [ ] Zero `border-l-4` or `border-r-*` colored accent stripes in about-us
- [ ] Zero `blur-3xl`/`blur-2xl` decorative glow orbs in about-us
- [ ] Zero `bg-gradient-to-br from-arsd-red` icon containers in about-us
- [ ] About Us uses `responsive-container` exclusively
- [ ] About Us uses `<SectionEyebrow />` for all section labels
- [ ] About Us CTA uses `<PageCTA />`
- [ ] Contact form does not fire mailto if required fields are empty
- [ ] Contact form shows field-level error messages on failed validation
- [ ] Contact form shows success panel after mailto fires
- [ ] Homepage shows a meaningful empty state when no projects exist
- [ ] Services page decorative numbers are `text-[5rem]` at mobile
- [ ] Primary CTAs have visible focus-visible rings
