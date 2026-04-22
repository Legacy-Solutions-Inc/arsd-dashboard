# Vercel DNS → Cloudflare DNS Migration — Runbook

**Goal:** Move DNS management of `arsd.co` from Vercel to Cloudflare **without changing where the app is hosted** (Vercel continues to serve the Next.js app). This is a prerequisite for Cloudflare Tunnel setup (Part B of `2026-04-20-ugreen-nas-storage-migration.md`), which requires the domain's authoritative DNS to be on Cloudflare.

**Architecture:** Registrar stays at Vercel. DNS moves to Cloudflare (free plan). Vercel-facing records are set to **DNS-only (gray cloud)** so traffic continues to flow direct-to-Vercel — Cloudflare resolves the name only, no proxy. Only the future NAS subdomains (`s3.arsd.co`, `nas.arsd.co`) will be proxied through Cloudflare Tunnel.

**Scope of change:**
- ✅ DNS authority (Vercel nameservers → Cloudflare nameservers)
- ❌ Domain registrar (stays at Vercel)
- ❌ Vercel hosting / deployments (unchanged)
- ❌ TLS certificates (Vercel keeps serving its own certs)

---

## Context

### Current state

- **Domain:** `arsd.co` (registered at Vercel, Hobby plan)
- **Current Vercel nameservers:** `ns1.vercel-dns.com`, `ns2.vercel-dns.com`
- **Email on domain:** None (no `MX` records required)
- **Hosted app:** `arsd.co` and `www.arsd.co` serve the Next.js dashboard via Vercel. Preview domain `arsd-ph.vercel.app` is unrelated to this change.

### Assigned Cloudflare nameservers

```
candy.ns.cloudflare.com
uriah.ns.cloudflare.com
```

### Current DNS records (imported by Cloudflare from Vercel)

| Type | Name | Content | Required proxy status |
|---|---|---|---|
| A | `*` | `64.29.17.1` | DNS only (gray) |
| A | `*` | `64.29.17.65` | DNS only (gray) |
| A | `arsd.co` | `216.198.79.1` | DNS only (gray) |
| A | `arsd.co` | `64.29.17.65` | DNS only (gray) |
| A | `www` | `64.29.17.1` | DNS only (gray) |
| A | `www` | `216.198.79.1` | DNS only (gray) |
| CAA | `arsd.co` | `0 issue sectigo.com` | DNS only (forced) |
| CAA | `arsd.co` | `0 issue pki.goog` | DNS only (forced) |
| CAA | `arsd.co` | `0 issue letsencrypt.org` | DNS only (forced) |
| CNAME | `_domainconnect` | `_domainconnect....` | DNS only (gray) |

> **Why DNS-only for Vercel records:** Vercel already runs a global edge network. Putting Cloudflare's proxy in front can break Vercel Analytics, Edge Config, cache behavior, and long-lived streaming. DNS-only lets Cloudflare answer DNS queries while traffic flows direct to Vercel.

---

# RUNBOOK

Every step has:
- **What** — one sentence of intent
- **Where** — which service/UI
- **Action** — exact click path or command
- **Expected** — what success looks like

---

## Part A — Cloudflare Account & Domain Setup

### A.1 Create Cloudflare account

- [ ] **A.1.1** — Sign up at https://dash.cloudflare.com/sign-up with a work email.
- [ ] **A.1.2** — Verify email and log in.

### A.2 Add `arsd.co` to Cloudflare

- [ ] **A.2.1** — Dashboard → **Add a site** → enter `arsd.co` (no `https://`, no `www`).
- [ ] **A.2.2** — Select the **Free plan** → Continue.
- [ ] **A.2.3** — Cloudflare scans existing DNS from Vercel and auto-imports records. Verify the imported list matches the table under §Context above. If any record is missing, click **+ Add record** and recreate it manually.

### A.3 Set proxy status for every record

**Critical step.** Leaving Vercel-facing records on orange cloud will break the app.

- [ ] **A.3.1** — For every `A` record pointing to a Vercel IP (`64.29.17.*` or `216.198.79.*`), click the toggle until it shows **gray cloud (DNS only)**.
- [ ] **A.3.2** — Set the `_domainconnect` CNAME to **gray cloud (DNS only)**.
- [ ] **A.3.3** — Leave the three CAA records as DNS-only (Cloudflare forces this automatically for CAA).
- [ ] **A.3.4** — Confirm the "⚠️ Proxy DNS records" yellow warning on the overview page disappears.

### A.4 Copy assigned Cloudflare nameservers

- [ ] **A.4.1** — From the Cloudflare activation screen, copy both nameservers:
  ```
  candy.ns.cloudflare.com
  uriah.ns.cloudflare.com
  ```
  Save them — you'll paste them into Vercel in Part B.

---

## Part B — Change Nameservers at Vercel

### B.1 Navigate to account-level Domains in Vercel

The **project-level** Domains page (inside a specific project) cannot change nameservers. You must use the **account-level** Domains page.

- [ ] **B.1.1** — Open https://vercel.com/domains directly.
- [ ] **B.1.2** — If that URL lands on the wrong account, click the account switcher top-left and select the Hobby account that owns `arsd.co`.

### B.2 Open the domain's detail page

- [ ] **B.2.1** — Click the domain name `arsd.co` in the list (click the name itself, not the "Edit" button).
- [ ] **B.2.2** — Scroll to the **Nameservers** section.

### B.3 Disable DNSSEC if enabled

**Critical:** DNSSEC mismatched between registrar and DNS provider will take the domain fully dark.

- [ ] **B.3.1** — Look for a **DNSSEC** or **DS Records** section on the Vercel domain page.
- [ ] **B.3.2** — If DNSSEC is **enabled**, disable it and wait for Vercel to confirm.
- [ ] **B.3.3** — If no DNSSEC option is shown, it's off by default — proceed.

> You can re-enable DNSSEC via Cloudflare later if desired (Cloudflare → DNS → Settings → DNSSEC).

### B.4 Replace Vercel nameservers with Cloudflare nameservers

- [ ] **B.4.1** — In the **Nameservers** section, switch from **"Vercel Nameservers"** to **"Custom Nameservers"** (exact label may vary).
- [ ] **B.4.2** — Delete both Vercel nameservers:
  - `ns1.vercel-dns.com`
  - `ns2.vercel-dns.com`
- [ ] **B.4.3** — Add both Cloudflare nameservers:
  - `candy.ns.cloudflare.com`
  - `uriah.ns.cloudflare.com`
- [ ] **B.4.4** — Click **Save**. Accept any "this may cause downtime" confirmation — the downtime risk is near zero because Cloudflare already holds the correct records.

**Troubleshooting B:**
- Vercel won't let you save → ensure you removed both Vercel nameservers and DNSSEC is off.
- "Invalid nameserver" error → double-check for typos (no `https://`, no trailing dots).

---

## Part C — Activation & Verification

### C.1 Tell Cloudflare to start polling

- [ ] **C.1.1** — Return to the Cloudflare dashboard for `arsd.co`.
- [ ] **C.1.2** — Click **"I updated my nameservers, check for change"** (or the **"Check nameservers now"** button on the waiting screen).

### C.2 Monitor propagation from your workstation

- [ ] **C.2.1** — Open a terminal (Git Bash / PowerShell / cmd) and run:
  ```bash
  nslookup -type=ns arsd.co
  ```
- [ ] **C.2.2** — Interpret:
  - Output lists `candy.ns.cloudflare.com` + `uriah.ns.cloudflare.com` → propagation done locally, waiting for Cloudflare to confirm.
  - Output still shows `ns1.vercel-dns.com` + `ns2.vercel-dns.com` → change not yet visible from your resolver. Wait 15–30 min and re-run.
- [ ] **C.2.3** — Optional cross-check: https://www.whatsmydns.net/#NS/arsd.co — shows propagation globally.

### C.3 Verify the app keeps working during propagation

- [ ] **C.3.1** — Keep `https://arsd.co` open in an incognito browser tab. Refresh every 10–15 min throughout propagation.
- [ ] **C.3.2** — The app must load normally the entire time. If it breaks during this window, jump to §Rollback.

### C.4 Confirm "Active" status

- [ ] **C.4.1** — Cloudflare sends an email titled **"arsd.co is now on Cloudflare"** when activation completes (typical: 5–60 min, max: 24h).
- [ ] **C.4.2** — Cloudflare dashboard overview for `arsd.co` should show **"Active"** instead of "Pending" / "Waiting".

---

## Part D — Post-Activation Hardening

### D.1 Set SSL/TLS mode to Full (strict)

- [ ] **D.1.1** — Cloudflare → `arsd.co` → **SSL/TLS → Overview**.
- [ ] **D.1.2** — Set encryption mode to **Full (strict)**.

> Why: Vercel serves valid TLS certificates for `arsd.co`. Full (strict) tells Cloudflare to validate Vercel's cert when it queries DNS-only origins. For DNS-only records this is effectively a no-op (traffic doesn't pass through Cloudflare), but it sets a correct default for future proxied records like the NAS subdomains.

### D.2 Confirm the yellow proxy warning cleared

- [ ] **D.2.1** — Reload the Cloudflare overview page for `arsd.co`.
- [ ] **D.2.2** — The "⚠️ Proxy DNS records" badge should be gone. If still present, recheck Part A.3.

### D.3 Smoke-test the app

- [ ] **D.3.1** — Load `https://arsd.co` → HTTP 200, valid TLS, no browser warnings.
- [ ] **D.3.2** — Load `https://www.arsd.co` → redirects to `https://arsd.co` (or wherever your Vercel config sends it).
- [ ] **D.3.3** — Sign in to the dashboard → full functionality works.
- [ ] **D.3.4** — Run a deploy from a branch (or trigger a redeploy from Vercel) → verify Vercel still provisions / refreshes correctly.

---

## Part E — Rollback (if activation or app verification fails)

### E.1 Triggers

Any of: the app fails to load for >5 min during propagation, Vercel deploys start failing, TLS certificate errors appear, or post-activation smoke tests fail.

### E.2 Revert at Vercel

- [ ] **E.2.1** — Vercel → account-level Domains → `arsd.co` → Nameservers.
- [ ] **E.2.2** — Remove Cloudflare nameservers.
- [ ] **E.2.3** — Re-add Vercel nameservers (or toggle back to "Vercel Nameservers"):
  - `ns1.vercel-dns.com`
  - `ns2.vercel-dns.com`
- [ ] **E.2.4** — Save.

### E.3 Remove domain from Cloudflare (optional)

- [ ] **E.3.1** — Cloudflare → `arsd.co` → Advanced Actions → **Remove from Cloudflare**.
- [ ] **E.3.2** — Confirm.

> Rollback is clean because Cloudflare's free plan does not rewrite any traffic while records are DNS-only. The switch is purely at the DNS resolution layer.

---

## Risk Register

| # | Severity | Risk | Mitigation |
|---|----------|------|------------|
| R1 | **High** | Vercel records left on orange cloud → app breaks on activation | Part A.3 — verify every Vercel record is gray cloud **before** clicking "I updated my nameservers" |
| R2 | **High** | DNSSEC enabled at Vercel but not configured at Cloudflare → domain goes dark | Part B.3 — disable DNSSEC before the nameserver change |
| R3 | Medium | Vercel registrar locks the domain / nameserver edit is grayed out | Hobby plan allows nameserver edits for domains registered at Vercel; contact Vercel support if blocked |
| R4 | Medium | Propagation takes >24h | Rare but possible. Wait; no user impact because records already exist in both places |
| R5 | Low | Missing record (e.g., TXT for Vercel verification) not imported by Cloudflare | Part A.2.3 — spot-check imported records against Vercel DNS panel; manually add any missing |
| R6 | Low | CAA records block Cloudflare Tunnel cert issuance later | Cloudflare Tunnel uses Google Trust / Let's Encrypt, both already allowed in current CAA set |

---

## Verification Gates Before Proceeding to Cloudflare Tunnel

Only start Part B of the NAS migration plan (Cloudflare Tunnel) after all five gates pass:

1. Cloudflare dashboard for `arsd.co` shows **Active** status.
2. Yellow "Proxy DNS records" warning is clear.
3. SSL/TLS mode is set to **Full (strict)**.
4. Smoke tests in Part D.3 all pass.
5. `nslookup -type=ns arsd.co` returns Cloudflare nameservers from your workstation.

---

## What This Unlocks

Once the domain is live on Cloudflare, the NAS migration can proceed:

- Cloudflare Tunnel connector (`cloudflared`) on the NAS exposes MinIO via `s3.arsd.co` and `nas.arsd.co`.
- Those subdomains are created **automatically** by Cloudflare Tunnel setup — no manual DNS record entry.
- Those subdomains WILL be proxied (orange cloud) — this is correct for Tunnel.
- The Vercel-facing records (`arsd.co`, `www`, `*`) stay DNS-only and unaffected.

---

## Effort Summary

| Phase | Effort |
|-------|--------|
| A — Cloudflare setup | 15 min |
| B — Vercel nameserver change | 10 min |
| C — Propagation wait | 5–60 min (max 24h) |
| D — Post-activation hardening | 10 min |
| **Total hands-on** | **~35 min** |
| **Total calendar** | **1–2 hours typical** |
