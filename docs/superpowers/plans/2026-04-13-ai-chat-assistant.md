# AI Chat Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a floating AI chat widget to the dashboard that lets users ask natural-language questions about their projects, accomplishment reports, and warehouse data.

**Architecture:** A Next.js Route Handler at `/api/ai/chat` runs an agentic loop using the Anthropic SDK — it calls `claude-haiku-4-5-20251001` with 6 data-fetching tools, executes any tool calls directly against Supabase (RLS-scoped per the authenticated user), and returns the final text response as plain JSON. A `"use client"` floating widget mounts in the dashboard layout, manages a message history array, and shows a typing indicator while the API responds.

**Tech Stack:** `@anthropic-ai/sdk` (new dependency — must be approved before Task 1), Next.js App Router route handlers, `supabase/server.ts` server client, Tailwind CSS, Shadcn Sheet + ScrollArea, lucide-react icons

---

## Prerequisite

> **Before starting Task 1, confirm with the user:** "This plan requires adding `@anthropic-ai/sdk` as a new npm dependency. May I proceed?" Also confirm they have an `ANTHROPIC_API_KEY` from console.anthropic.com to add to `.env.local`.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/app/api/ai/chat/tools.ts` | Anthropic tool schema definitions (pure data, no logic) |
| Create | `src/app/api/ai/chat/tool-handlers.ts` | Tool execution — each tool queries Supabase and returns a string result |
| Create | `src/app/api/ai/chat/route.ts` | POST handler — auth, agentic loop, returns `{ reply: string }` |
| Create | `src/hooks/useAIChat.ts` | Client hook — message array state, `sendMessage()`, loading flag |
| Create | `src/components/ai-chat/AIChatWidget.tsx` | Floating button + chat panel (single file, <150 lines) |
| Modify | `src/app/dashboard/layout.tsx` | Import and mount `<AIChatWidget />` before `</div>` closing tag |
| Modify | `.env.local` | Add `ANTHROPIC_API_KEY` |

---

## Task 1: Install dependency and configure API key

**Files:**
- Modify: `.env.local`
- Run: `npm install @anthropic-ai/sdk`

- [ ] **Step 1: Install the Anthropic SDK**

```bash
npm install @anthropic-ai/sdk
```

Expected output ends with: `added 1 package` (or similar) and no errors.

- [ ] **Step 2: Add API key to environment**

Open `.env.local` and add this line (replace with your real key from console.anthropic.com):

```
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE
```

- [ ] **Step 3: Verify the import resolves**

```bash
node -e "require('@anthropic-ai/sdk'); console.log('ok')"
```

Expected output: `ok`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @anthropic-ai/sdk dependency for AI chat assistant"
```

---

## Task 2: Tool schema definitions

**Files:**
- Create: `src/app/api/ai/chat/tools.ts`

- [ ] **Step 1: Create the tool schemas file**

```typescript
// src/app/api/ai/chat/tools.ts
import type Anthropic from '@anthropic-ai/sdk';

export const CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_projects',
    description:
      'Search for construction projects by name or filter by status. Returns a list of matching projects with their status, client, location, and assigned team.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Optional keyword to match against project name or client',
        },
        status: {
          type: 'string',
          enum: ['in_planning', 'in_progress', 'completed'],
          description: 'Optional filter by project status',
        },
      },
    },
  },
  {
    name: 'get_project_details',
    description:
      'Get full details for a specific project: assigned manager, inspector, warehouseman, latest accomplishment update date, and whether parsed report data exists.',
    input_schema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'UUID of the project (obtain from search_projects first)',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_weekly_upload_status',
    description:
      'Get the accomplishment report upload status for each active project for the current week. Shows which projects have uploaded, which are pending, and which missed the deadline.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_accomplishment_reports',
    description:
      'Get a list of accomplishment reports with optional filters. Returns report metadata: file name, week ending date, status (pending/approved/rejected), and uploader name.',
    input_schema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'Optional: filter by project UUID',
        },
        status: {
          type: 'string',
          enum: ['pending', 'approved', 'rejected'],
          description: 'Optional: filter by approval status',
        },
        limit: {
          type: 'number',
          description: 'Max results to return, default 10, max 50',
        },
      },
    },
  },
  {
    name: 'get_warehouse_stock',
    description:
      'Get current stock levels for a specific project. Returns IPOW items with PO quantity, total delivered, total released, and running balance.',
    input_schema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'UUID of the project',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_delivery_receipts',
    description:
      'Get delivery receipts (DRs) for tracking material deliveries. Shows DR number, supplier, delivery date, and line items. Can filter by project.',
    input_schema: {
      type: 'object' as const,
      properties: {
        project_id: {
          type: 'string',
          description: 'Optional: filter by project UUID',
        },
        limit: {
          type: 'number',
          description: 'Max results to return, default 10, max 20',
        },
      },
    },
  },
];
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors for `src/app/api/ai/chat/tools.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ai/chat/tools.ts
git commit -m "feat(ai-chat): add Anthropic tool schema definitions"
```

---

## Task 3: Tool handlers

**Files:**
- Create: `src/app/api/ai/chat/tool-handlers.ts`

Each handler accepts the typed tool input and a Supabase server client, queries the database, and returns a human-readable string (JSON or a descriptive message). RLS on the database automatically scopes results to what the authenticated user can see.

- [ ] **Step 1: Create the tool handlers file**

```typescript
// src/app/api/ai/chat/tool-handlers.ts
import type { SupabaseClient } from '@supabase/supabase-js';

// ── search_projects ──────────────────────────────────────────────────────────

export async function handleSearchProjects(
  input: { query?: string; status?: string },
  supabase: SupabaseClient,
): Promise<string> {
  let q = supabase
    .from('projects')
    .select(
      `id, project_name, status, client, location, latest_accomplishment_update,
       manager:profiles!project_manager_id(display_name),
       inspector:profiles!project_inspector_id(display_name)`,
    )
    .order('created_at', { ascending: false })
    .limit(20);

  if (input.query) {
    q = q.or(
      `project_name.ilike.%${input.query}%,client.ilike.%${input.query}%`,
    );
  }
  if (input.status) {
    q = q.eq('status', input.status);
  }

  const { data, error } = await q;
  if (error) return `Error: ${error.message}`;
  if (!data?.length) return 'No projects found matching your criteria.';

  return JSON.stringify(
    data.map((p: any) => ({
      id: p.id,
      name: p.project_name,
      status: p.status,
      client: p.client ?? '—',
      location: p.location ?? '—',
      project_manager: p.manager?.display_name ?? 'Unassigned',
      project_inspector: p.inspector?.display_name ?? 'Unassigned',
      latest_report_date: p.latest_accomplishment_update ?? 'No reports yet',
    })),
  );
}

// ── get_project_details ──────────────────────────────────────────────────────

export async function handleGetProjectDetails(
  input: { project_id: string },
  supabase: SupabaseClient,
): Promise<string> {
  const { data, error } = await supabase
    .from('projects')
    .select(
      `id, project_name, status, client, location, latest_accomplishment_update, has_parsed_data, created_at,
       manager:profiles!project_manager_id(display_name, email),
       inspector:profiles!project_inspector_id(display_name, email),
       warehouseman:profiles!warehouseman_id(display_name, email)`,
    )
    .eq('id', input.project_id)
    .single();

  if (error) return `Error: ${error.message}`;
  if (!data) return 'Project not found or you do not have access to it.';

  const p = data as any;
  return JSON.stringify({
    id: p.id,
    name: p.project_name,
    status: p.status,
    client: p.client ?? '—',
    location: p.location ?? '—',
    project_manager: p.manager?.display_name ?? 'Unassigned',
    project_manager_email: p.manager?.email ?? '—',
    project_inspector: p.inspector?.display_name ?? 'Unassigned',
    warehouseman: p.warehouseman?.display_name ?? 'Unassigned',
    latest_report_date: p.latest_accomplishment_update ?? 'No reports yet',
    has_parsed_data: p.has_parsed_data ?? false,
    created_at: p.created_at,
  });
}

// ── get_weekly_upload_status ─────────────────────────────────────────────────

export async function handleGetWeeklyUploadStatus(
  supabase: SupabaseClient,
): Promise<string> {
  // Get active projects
  const { data: projects, error: pErr } = await supabase
    .from('projects')
    .select('id, project_name')
    .eq('status', 'in_progress');

  if (pErr) return `Error: ${pErr.message}`;
  if (!projects?.length) return 'No active (in_progress) projects found.';

  // Get reports from the last 14 days to catch the current week
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);

  const { data: reports, error: rErr } = await supabase
    .from('accomplishment_reports')
    .select('project_id, week_ending_date, status, created_at')
    .in(
      'project_id',
      projects.map((p: any) => p.id),
    )
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false });

  if (rErr) return `Error: ${rErr.message}`;

  // Map latest report per project
  const latestByProject = new Map<string, any>();
  for (const r of reports ?? []) {
    if (!latestByProject.has(r.project_id)) {
      latestByProject.set(r.project_id, r);
    }
  }

  const summary = projects.map((p: any) => {
    const report = latestByProject.get(p.id);
    return {
      project: p.project_name,
      status: report ? report.status : 'no_upload',
      week_ending: report?.week_ending_date ?? null,
      uploaded_at: report?.created_at ?? null,
    };
  });

  return JSON.stringify(summary);
}

// ── get_accomplishment_reports ───────────────────────────────────────────────

export async function handleGetAccomplishmentReports(
  input: { project_id?: string; status?: string; limit?: number },
  supabase: SupabaseClient,
): Promise<string> {
  const limit = Math.min(input.limit ?? 10, 50);

  let q = supabase
    .from('accomplishment_reports')
    .select(
      `id, file_name, week_ending_date, status, created_at,
       project:projects(project_name),
       uploader:safe_profile_directory!uploaded_by(display_name)`,
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (input.project_id) q = q.eq('project_id', input.project_id);
  if (input.status) q = q.eq('status', input.status);

  const { data, error } = await q;
  if (error) return `Error: ${error.message}`;
  if (!data?.length) return 'No accomplishment reports found matching your criteria.';

  return JSON.stringify(
    data.map((r: any) => ({
      id: r.id,
      project: (r.project as any)?.project_name ?? '—',
      file_name: r.file_name,
      week_ending: r.week_ending_date,
      status: r.status,
      uploaded_by: (r.uploader as any)?.display_name ?? 'Unknown',
      uploaded_at: r.created_at,
    })),
  );
}

// ── get_warehouse_stock ──────────────────────────────────────────────────────

export async function handleGetWarehouseStock(
  input: { project_id: string },
  supabase: SupabaseClient,
): Promise<string> {
  const { data: ipow, error: iErr } = await supabase
    .from('ipow_items')
    .select('wbs, item_description, resource_type, total_qty, total_cost, unit')
    .eq('project_id', input.project_id);

  if (iErr) return `Error fetching IPOW: ${iErr.message}`;
  if (!ipow?.length)
    return 'No IPOW items found for this project. Make sure accomplishment reports have been approved and parsed.';

  const { data: overrides } = await supabase
    .from('stock_po_overrides')
    .select('wbs, item_description, po, unit_cost')
    .eq('project_id', input.project_id);

  const { data: drItems } = await supabase
    .from('dr_items')
    .select('wbs, item_description, quantity_delivered')
    .eq('project_id', input.project_id);

  const { data: releaseItems } = await supabase
    .from('release_items')
    .select('wbs, item_description, quantity_released')
    .eq('project_id', input.project_id);

  // Build maps for overrides, delivered, released
  const overrideMap = new Map<string, number>();
  for (const o of overrides ?? []) {
    overrideMap.set(`${o.wbs}|${o.item_description}`, o.po ?? 0);
  }
  const deliveredMap = new Map<string, number>();
  for (const d of drItems ?? []) {
    const key = `${d.wbs}|${d.item_description}`;
    deliveredMap.set(key, (deliveredMap.get(key) ?? 0) + Number(d.quantity_delivered ?? 0));
  }
  const releasedMap = new Map<string, number>();
  for (const r of releaseItems ?? []) {
    const key = `${r.wbs}|${r.item_description}`;
    releasedMap.set(key, (releasedMap.get(key) ?? 0) + Number(r.quantity_released ?? 0));
  }

  const stock = ipow.map((item: any) => {
    const key = `${item.wbs}|${item.item_description}`;
    const po = overrideMap.get(key) ?? item.total_qty ?? 0;
    const delivered = deliveredMap.get(key) ?? 0;
    const released = releasedMap.get(key) ?? 0;
    const balance = delivered - released;
    return {
      wbs: item.wbs,
      description: item.item_description,
      resource_type: item.resource_type,
      unit: item.unit,
      po_quantity: po,
      total_delivered: delivered,
      total_released: released,
      running_balance: balance,
    };
  });

  return JSON.stringify(stock);
}

// ── get_delivery_receipts ────────────────────────────────────────────────────

export async function handleGetDeliveryReceipts(
  input: { project_id?: string; limit?: number },
  supabase: SupabaseClient,
): Promise<string> {
  const limit = Math.min(input.limit ?? 10, 20);

  let q = supabase
    .from('delivery_receipts')
    .select(
      `id, dr_no, supplier, delivery_date, is_locked, created_at,
       project:projects(project_name),
       items:dr_items(item_description, wbs, quantity_delivered, unit)`,
    )
    .order('delivery_date', { ascending: false })
    .limit(limit);

  if (input.project_id) q = q.eq('project_id', input.project_id);

  const { data, error } = await q;
  if (error) return `Error: ${error.message}`;
  if (!data?.length) return 'No delivery receipts found.';

  return JSON.stringify(
    data.map((dr: any) => ({
      dr_no: dr.dr_no,
      project: (dr.project as any)?.project_name ?? '—',
      supplier: dr.supplier,
      delivery_date: dr.delivery_date,
      is_locked: dr.is_locked,
      items: (dr.items as any[]).map((i: any) => ({
        description: i.item_description,
        wbs: i.wbs,
        quantity: i.quantity_delivered,
        unit: i.unit,
      })),
    })),
  );
}

// ── dispatcher ───────────────────────────────────────────────────────────────

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  supabase: SupabaseClient,
): Promise<string> {
  switch (name) {
    case 'search_projects':
      return handleSearchProjects(input as any, supabase);
    case 'get_project_details':
      return handleGetProjectDetails(input as any, supabase);
    case 'get_weekly_upload_status':
      return handleGetWeeklyUploadStatus(supabase);
    case 'get_accomplishment_reports':
      return handleGetAccomplishmentReports(input as any, supabase);
    case 'get_warehouse_stock':
      return handleGetWarehouseStock(input as any, supabase);
    case 'get_delivery_receipts':
      return handleGetDeliveryReceipts(input as any, supabase);
    default:
      return `Unknown tool: ${name}`;
  }
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "ai/chat"
```

Expected: no output (no errors in these files).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ai/chat/tool-handlers.ts
git commit -m "feat(ai-chat): add tool handler implementations for 6 data queries"
```

---

## Task 4: API route — agentic loop

**Files:**
- Create: `src/app/api/ai/chat/route.ts`

The route accepts `{ messages: Array<{ role, content }> }`, runs the Anthropic agentic loop (up to 5 iterations to prevent runaway calls), and returns `{ reply: string }` or `{ error: string }`.

- [ ] **Step 1: Create the route handler**

```typescript
// src/app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { cookies } from 'next/headers';
import { createClient } from '@/supabase/server';
import { CHAT_TOOLS } from './tools';
import { executeTool } from './tool-handlers';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an AI assistant for the ARSD construction project management system. You help project managers, inspectors, and HR staff quickly find information about their construction projects, accomplishment reports, and warehouse inventory.

You have access to tools to query live project data. Always use tools to get accurate, up-to-date information rather than guessing. The data is automatically filtered to what the current user is authorized to see.

When answering:
- Be concise and direct — users are busy
- Format peso amounts with the ₱ symbol (e.g. ₱1,250,000.00)
- Use bullet points or short tables for lists of items
- If you cannot find data the user is looking for, say so clearly and suggest what to check
- Never invent data — only report what the tools return

ARSD context:
- Projects track construction work. Each project has a project_manager, project_inspector, and warehouseman assigned.
- Accomplishment reports are Excel files submitted weekly by project managers. They go through pending → approved/rejected flow.
- Warehouse flow: materials are planned via IPOW (Inventory Plan of Work) → delivered via Delivery Receipts → released to site via Release Forms. Stock = delivered minus released.
- Statuses: in_planning, in_progress, completed for projects; pending, approved, rejected for reports.`;

type ClientMessage = { role: 'user' | 'assistant'; content: string };

export async function POST(req: NextRequest) {
  // Auth check
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse request body
  let messages: ClientMessage[];
  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Build Anthropic message history (only user/assistant roles, string content)
  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Agentic loop — max 5 iterations
  const loopMessages = [...anthropicMessages];
  let reply = 'I was unable to generate a response. Please try again.';

  for (let i = 0; i < 5; i++) {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: loopMessages,
      tools: CHAT_TOOLS,
    });

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find((b) => b.type === 'text');
      reply = textBlock?.type === 'text' ? textBlock.text : reply;
      break;
    }

    if (response.stop_reason === 'tool_use') {
      // Append assistant message with tool_use blocks
      loopMessages.push({ role: 'assistant', content: response.content });

      // Execute every tool call in parallel
      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        response.content
          .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
          .map(async (b) => ({
            type: 'tool_result' as const,
            tool_use_id: b.id,
            content: await executeTool(b.name, b.input as Record<string, unknown>, supabase),
          })),
      );

      loopMessages.push({ role: 'user', content: toolResults });
      continue;
    }

    // stop_reason === 'max_tokens' or other — break and return what we have
    break;
  }

  return NextResponse.json({ reply });
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "ai/chat"
```

Expected: no output.

- [ ] **Step 3: Smoke-test the route (requires dev server)**

Start dev server with `npm run dev`, then in a separate terminal:

```bash
curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .dev-cookie 2>/dev/null || echo '')" \
  -d '{"messages":[{"role":"user","content":"How many projects are there?"}]}' \
  | jq .
```

Expected: `{ "reply": "..." }` (a text response, possibly empty if no auth cookie is set — a 401 response is also acceptable here and means auth is working correctly).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/ai/chat/route.ts
git commit -m "feat(ai-chat): add POST /api/ai/chat agentic loop route"
```

---

## Task 5: Client hook — useAIChat

**Files:**
- Create: `src/hooks/useAIChat.ts`

- [ ] **Step 1: Create the hook**

```typescript
// src/hooks/useAIChat.ts
'use client';

import { useState, useCallback } from 'react';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const history = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }

      const { reply } = await res.json();
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "useAIChat"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAIChat.ts
git commit -m "feat(ai-chat): add useAIChat hook for message state and API calls"
```

---

## Task 6: AIChatWidget component

**Files:**
- Create: `src/components/ai-chat/AIChatWidget.tsx`

This is one self-contained client component that renders the floating button and the chat panel. It uses Shadcn `Sheet` for the slide-in panel and `ScrollArea` for the message list.

- [ ] **Step 1: Create the component**

```tsx
// src/components/ai-chat/AIChatWidget.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIChat, type ChatMessage } from '@/hooks/useAIChat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, isLoading, error, sendMessage, clearMessages } = useAIChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg',
          'bg-gradient-to-br from-arsd-red to-red-600 text-white',
          'hover:scale-110 hover:shadow-xl transition-all duration-200',
          isOpen && 'rotate-90',
        )}
        aria-label="Open AI assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className={cn(
            'fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[520px]',
            'bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20',
            'flex flex-col overflow-hidden',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-arsd-red to-red-600 text-white rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold text-sm">ARSD Assistant</span>
            </div>
            <button
              onClick={clearMessages}
              className="opacity-70 hover:opacity-100 transition-opacity"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Message list */}
          <ScrollArea className="flex-1 px-4 py-3">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-gray-400 text-sm mt-8 space-y-2">
                <Bot className="h-10 w-10 mx-auto opacity-30" />
                <p>Ask me anything about your projects, reports, or warehouse inventory.</p>
                <p className="text-xs">Try: "Which projects haven't submitted a report this week?"</p>
              </div>
            )}

            <div className="space-y-3">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {isLoading && (
                <div className="flex gap-2 items-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-arsd-red to-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                </div>
              )}

              {error && (
                <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="px-3 py-2 border-t border-gray-100">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                rows={1}
                className={cn(
                  'flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-arsd-red/30 focus:border-arsd-red',
                  'min-h-[38px] max-h-[100px] overflow-y-auto',
                )}
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
                }}
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-9 w-9 rounded-xl bg-gradient-to-br from-arsd-red to-red-600 hover:from-red-600 hover:to-red-700 flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-1 text-center">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-2 items-start', isUser && 'flex-row-reverse')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-arsd-red to-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words',
          isUser
            ? 'bg-gradient-to-br from-arsd-red to-red-600 text-white rounded-tr-sm'
            : 'bg-gray-100 text-gray-800 rounded-tl-sm',
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "AIChatWidget"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/ai-chat/AIChatWidget.tsx
git commit -m "feat(ai-chat): add AIChatWidget floating chat panel component"
```

---

## Task 7: Mount widget in dashboard layout

**Files:**
- Modify: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Read the current layout file**

Open `src/app/dashboard/layout.tsx` and confirm the current content (it should match what you see in the plan — a `<div>` wrapping `<Sidebar />` and `<main>`).

- [ ] **Step 2: Add the import and mount the widget**

Add the import at the top of the file:

```typescript
import { AIChatWidget } from '@/components/ai-chat/AIChatWidget';
```

Then, inside the returned JSX, add `<AIChatWidget />` just before the closing `</div>` of the outer `min-h-screen` wrapper (at the same level as the animated background elements, so it floats above all content):

The return statement should look like this after the edit:

```tsx
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-pink-300/30 to-purple-300/30 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-br from-cyan-300/30 to-blue-300/30 rounded-full blur-2xl animate-float-delayed"></div>
      </div>
      
      <div className="relative flex min-h-screen">
        <Sidebar />
        <main className="flex-1 mobile-padding relative z-10 overflow-x-hidden">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>

      <AIChatWidget />
    </div>
  );
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 4: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds (✓ Compiled successfully or similar).

- [ ] **Step 5: Manual verification**

1. Start dev server: `npm run dev`
2. Open `http://localhost:3000/dashboard` in browser (sign in if needed)
3. Confirm: red floating bot button appears in bottom-right corner of every dashboard page
4. Click the button — confirm panel slides into view
5. Type "What projects are currently active?" and press Enter
6. Confirm: typing indicator (spinner) appears, then assistant response appears
7. Confirm: response mentions actual projects from the database
8. Test on mobile width (resize browser to 375px) — confirm panel is responsive

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/layout.tsx
git commit -m "feat(ai-chat): mount AIChatWidget in dashboard layout"
```

---

## Self-Review

### Spec Coverage Check

| Requirement | Task |
|---|---|
| Floating chat button accessible from all dashboard pages | Task 7 — mounted in layout |
| Natural-language questions about projects | Task 2 + 3 — search_projects, get_project_details tools |
| Report upload status and compliance | Task 2 + 3 — get_weekly_upload_status, get_accomplishment_reports |
| Warehouse / stock data | Task 2 + 3 — get_warehouse_stock, get_delivery_receipts |
| RBAC — users only see their authorized data | Task 4 — RLS enforced via supabase server client; tool handlers receive RLS-scoped client |
| Typing indicator while waiting | Task 6 — `isLoading` spinner in `AIChatWidget` |
| Clear conversation button | Task 6 — Trash2 button calls `clearMessages()` |
| Error display | Task 5 (hook) + Task 6 (widget) |
| Mobile responsive | Task 6 — `w-80 sm:w-96` panel, fixed positioning |
| Tool calling agentic loop | Task 4 — up to 5 iterations in `runAgenticLoop` |

### No Placeholders — Verified

All steps contain complete code. No TBD, TODO, or "similar to Task N" references.

### Type Consistency Check

- `ChatMessage` is defined in `useAIChat.ts` and imported in `AIChatWidget.tsx` — consistent
- `executeTool` in `tool-handlers.ts` is imported in `route.ts` — consistent
- `CHAT_TOOLS` in `tools.ts` is imported in `route.ts` — consistent
- `SupabaseClient` from `@supabase/supabase-js` is used in all tool handlers — consistent

---

## Out of Scope (v1)

- **Streaming responses** — full agentic loop runs server-side, client receives complete JSON. Can be added in v2 using Anthropic streaming + `ReadableStream`.
- **Chat history persistence** — messages are session-only (in-memory React state). v2 could store in Supabase.
- **Conversation context across page navigation** — clearing messages on route change is acceptable for v1. v2 can use React context or localStorage.
- **Rate limiting** — no per-user rate limiting in v1. Can add via Supabase Edge Functions or Vercel middleware.
- **Suggested questions / quick actions** — the empty state has one example tip but no clickable chips.
- **File/image attachments** — text-only in v1.
- **Admin analytics on chat usage** — out of scope.
