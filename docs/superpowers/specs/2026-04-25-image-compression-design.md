# Client-Side Image Compression — Design Spec

**Date:** 2026-04-25
**Author:** Bryan (with Claude)
**Status:** Approved (design phase)

## Problem

All image uploads in the ARSD dashboard (progress photos, warehouse delivery receipts, website project photos) are uploaded raw. Camera-originated photos are typically 2–8 MB, occasionally up to 10 MB. This wastes storage on Supabase/NAS, slows uploads (especially on mobile/field connections), and slows gallery rendering. Target: shrink uploaded images to ~100–300 KB without breaking the "quick visual check" use case these photos serve.

## Goal

Compress images in the browser, before upload, so that only small files reach storage. Originals are not preserved (matches the "quick visual check" use case — see decision log).

## Scope

In scope (3 upload entry points):
- `src/components/uploads/ProgressPhotosUpload.tsx` — progress photos
- `src/components/website-projects/PhotoUploadSection.tsx` — website project photos
- `src/components/warehouse/FileUploader.tsx` — generic warehouse uploads (mixed: images + PDFs/docs)

Out of scope:
- Backfilling images already uploaded to Supabase/NAS storage
- Server-side recompression as a safety net
- Per-component preset overrides (warehouse vs progress photos using different quality settings) — the API will support it, but v1 ships one shared preset
- Compression of non-image files (PDFs, Excel, etc.)

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Quality target | Aggressive: 100–300 KB, max 1280px | Use case is quick visual check, not zoom-and-read evidence |
| Where compression runs | Browser (client-side) only | Saves bandwidth on slow field connections; UI owns progress feedback |
| Originals | Discarded | Keeping a 5MB original next to a 200KB version defeats the point |
| Backfill existing photos | No (v1) | Higher risk; isolate to a separate future project |
| Code location | Shared utility called from each component | Components own UI feedback; matches existing service-layer pattern (services do I/O, not file transformation) |

## Library

**`browser-image-compression`** (npm)

- ~5K stars, MIT, actively maintained
- Web Worker support — keeps UI responsive during compression
- EXIF orientation handling — critical so phone photos don't display sideways
- Returns a `File` object — drop-in compatible with existing upload code
- Built-in iterative resize+re-encode against a target byte size
- ~50 KB minified, only loaded on pages that import it

Alternatives considered and rejected:
- `compressorjs` — smaller but no Web Worker, weaker EXIF handling
- Native Canvas API — zero deps but ~80 lines of fiddly code reinventing the wheel; no iterative target-size loop

## Architecture

```
┌────────────────────────────────┐
│  Upload Components             │
│  - ProgressPhotosUpload.tsx    │
│  - PhotoUploadSection.tsx      │  ──── calls compressImage(file)
│  - warehouse/FileUploader.tsx  │           │
└────────────────────────────────┘           ▼
                              ┌──────────────────────────────┐
                              │  src/lib/image-compression.ts│
                              │  compressImage(file, opts?)  │
                              │  - skips non-images          │
                              │  - skips already-tiny files  │
                              │  - falls back to original    │
                              │    on error (logs warning)   │
                              └──────────────────────────────┘
                                            │
                                            ▼
                              ┌──────────────────────────────┐
                              │  browser-image-compression   │
                              │  (web worker)                │
                              └──────────────────────────────┘
```

## Files

### New

- `src/lib/image-compression.ts` — `compressImage()` function
- `src/types/image-compression.ts` — `CompressOptions` type and preset constants

### Modified

- `src/components/uploads/ProgressPhotosUpload.tsx` — compress files before passing to `uploadFiles()`; add "Compressing N/M..." UI state
- `src/components/website-projects/PhotoUploadSection.tsx` — same pattern
- `src/components/warehouse/FileUploader.tsx` — call compression only when MIME starts with `image/`; pass other types through unchanged
- `package.json` — add `browser-image-compression` dependency

## API

```ts
// src/types/image-compression.ts
export type CompressOptions = {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  initialQuality?: number;
  fileType?: string;
};

export const AGGRESSIVE_PRESET: CompressOptions = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 1280,
  initialQuality: 0.75,
  fileType: 'image/jpeg',
};

// src/lib/image-compression.ts
export async function compressImage(
  file: File,
  opts?: Partial<CompressOptions>
): Promise<File>;
```

Behavior contract:
1. **Options merging** — `opts` is shallow-merged over `AGGRESSIVE_PRESET`. Callers can override individual keys (e.g. `{ maxSizeMB: 0.5 }`) without losing the other defaults.
2. **Non-image input** — returns the input file unchanged when `!file.type.startsWith('image/')`. (Lets `FileUploader` call this unconditionally.)
3. **Already-small input** — returns the input file unchanged when its size is below 200 KB. (No point re-encoding.) This check runs *before* compression.
4. **Compressed result not smaller** — if for any reason the compressed file's size is >= the original's, return the original. This check runs *after* compression as a safety net distinct from rule 3.
5. **Errors** — on any thrown error from the underlying library, logs a warning to the console and returns the original file. Fail-open: a slow upload is better than a failed one.
6. **Output type** — JPEG `File` regardless of input format (PNG/WebP/HEIC). Filename retains the original stem with `.jpg` extension.

## UX

In each upload component:

1. User selects files → preview list appears (existing behavior, unchanged)
2. User clicks Upload → button changes to `Compressing 2/5...` (new state)
3. After all compression done → button changes to `Uploading...` (existing state)
4. Per-file size badge in preview list updates after compression: `4.2 MB → 240 KB (-94%)`

The "Compressing N/M" counter is incremented as each `compressImage()` call resolves. Compression is sequential by default (one file at a time inside the web worker) to avoid spawning many workers on low-end devices.

## Error handling

- **Compression library throws** → logged warning, original file falls through to upload (fail-open)
- **Compressed file >= original size** (rare, e.g. very small or already-optimized inputs) → return the original (rule 4 in the behavior contract)
- **Web Worker unavailable** (very old browser) → library falls back to main-thread compression automatically

## Testing

Manual checklist (no automated tests in v1 — file/canvas APIs require a real browser):

1. Upload a 5 MB landscape photo → expect ~150–250 KB JPEG, correct orientation
2. Upload a portrait photo from a phone (with EXIF rotation flag) → expect correct orientation in gallery
3. Upload a 50 KB icon → expect to pass through unchanged
4. Upload a PDF via `FileUploader` → expect to pass through unchanged
5. Upload 10 photos at once → expect "Compressing 1/10..." progress UI, then "Uploading...", then success
6. Force a corrupt image → expect warning in console, original file uploaded successfully

## Performance expectations

| Input | Expected output | Compression time (modern laptop) | Time (old phone) |
|---|---|---|---|
| 1 MB JPEG | 80–150 KB | <500 ms | ~1.5 s |
| 5 MB JPEG | 150–250 KB | ~1 s | ~3 s |
| 10 MB JPEG | 200–300 KB | ~2 s | ~5 s |
| 10 photos × 5 MB | ~2 MB total | ~10 s | ~30 s |

## Rollout

Single PR. No feature flag — compression is purely additive UX (uploads still work, just smaller). Manual smoke test on the dev server, then deploy.

## Future work (deferred, do not build now)

- Per-component presets (warehouse receipts at higher quality so receipt text stays readable)
- Server-side safety-net recompression with `sharp`
- Backfill script for existing storage
- HEIC support (iPhone default format) — `browser-image-compression` already handles this via canvas, but worth verifying on real Safari iOS
