# Image Compression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compress all image uploads in the browser before they reach Supabase/NAS storage, shrinking files from MB to ~100–300 KB.

**Architecture:** A single shared utility `compressImage()` wraps the `browser-image-compression` library with project-specific defaults (aggressive: 1280px max, 300 KB target, JPEG output) and behavior rules (pass-through non-images, fail-open on errors). Each of the three image upload entry points calls this utility before initiating upload.

**Tech Stack:** Next.js 14, TypeScript, React 18, `browser-image-compression` (new dependency).

**Spec:** `docs/superpowers/specs/2026-04-25-image-compression-design.md`

**Note on testing:** This project has no Jest/Vitest/Playwright infrastructure today. Adding it is out of scope for this plan. Verification is manual smoke testing in a real browser per Task 6 — the spec accepts this trade-off because compression depends on real Canvas/Web Worker APIs that JSDOM doesn't fully support.

---

## File Structure

| File | Responsibility | New/Modified |
|---|---|---|
| `src/types/image-compression.ts` | `CompressOptions` type + `AGGRESSIVE_PRESET` constant | New |
| `src/lib/image-compression.ts` | `compressImage(file, opts?)` function — wraps the library, enforces behavior contract | New |
| `src/components/uploads/ProgressPhotosUpload.tsx` | Compress in `handleUpload` before calling `uploadFiles`; show "Compressing N/M..." button state | Modified |
| `src/components/website-projects/PhotoUploadSection.tsx` | Compress in `handleFiles` (at pickup) before calling `onPhotosChange`; brief "Compressing..." input state | Modified |
| `src/components/warehouse/FileUploader.tsx` | Compress in `handleFileChange` (at pickup) before calling `onChange`; brief "Compressing..." state; pass-through for non-images | Modified |
| `package.json` | Add `browser-image-compression` dependency | Modified |

---

## Task 1: Install dependency and create types

**Files:**
- Modify: `package.json`
- Create: `src/types/image-compression.ts`

- [ ] **Step 1.1: Install the library**

Run:
```bash
npm install browser-image-compression
```

Expected: package added to `dependencies` in `package.json`, `package-lock.json` updated. Library version should be `^2.x` or newer.

- [ ] **Step 1.2: Create the types file**

Create `src/types/image-compression.ts` with the following content:

```ts
export type CompressOptions = {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  initialQuality: number;
  fileType: string;
};

export const AGGRESSIVE_PRESET: CompressOptions = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 1280,
  initialQuality: 0.75,
  fileType: 'image/jpeg',
};

export const SKIP_THRESHOLD_BYTES = 200 * 1024;
```

- [ ] **Step 1.3: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors. (If the project uses a stricter typecheck command, run that one instead — check `package.json` scripts.)

- [ ] **Step 1.4: Commit**

```bash
git add package.json package-lock.json src/types/image-compression.ts
git commit -m "feat: add browser-image-compression dep and compression preset types"
```

---

## Task 2: Create the `compressImage` utility

**Files:**
- Create: `src/lib/image-compression.ts`

- [ ] **Step 2.1: Write the utility**

Create `src/lib/image-compression.ts` with this exact content:

```ts
import imageCompression from 'browser-image-compression';
import {
  AGGRESSIVE_PRESET,
  CompressOptions,
  SKIP_THRESHOLD_BYTES,
} from '@/types/image-compression';

export async function compressImage(
  file: File,
  opts: Partial<CompressOptions> = {}
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  if (file.size < SKIP_THRESHOLD_BYTES) {
    return file;
  }

  const merged: CompressOptions = { ...AGGRESSIVE_PRESET, ...opts };

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: merged.maxSizeMB,
      maxWidthOrHeight: merged.maxWidthOrHeight,
      initialQuality: merged.initialQuality,
      fileType: merged.fileType,
      useWebWorker: true,
    });

    if (compressed.size >= file.size) {
      return file;
    }

    const newName = renameToJpg(file.name);
    return new File([compressed], newName, {
      type: merged.fileType,
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn('Image compression failed; uploading original.', err);
    return file;
  }
}

function renameToJpg(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return `${name}.jpg`;
  return `${name.slice(0, dot)}.jpg`;
}
```

- [ ] **Step 2.2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2.3: Commit**

```bash
git add src/lib/image-compression.ts
git commit -m "feat: add compressImage utility with aggressive preset and fail-open behavior"
```

---

## Task 3: Integrate into `ProgressPhotosUpload`

**Files:**
- Modify: `src/components/uploads/ProgressPhotosUpload.tsx`

The compression happens inside `handleUpload`, between gathering files and calling `uploadFiles`. We track per-file compression progress for the button label and update each preview's displayed file size after compression.

- [ ] **Step 3.1: Add the import**

At the top of `src/components/uploads/ProgressPhotosUpload.tsx`, add this import alongside the existing imports:

```ts
import { compressImage } from '@/lib/image-compression';
```

- [ ] **Step 3.2: Add compression progress state**

In the component body, near the existing `useState` declarations, add:

```ts
const [compressionProgress, setCompressionProgress] = useState<{ done: number; total: number } | null>(null);
```

- [ ] **Step 3.3: Replace `handleUpload` body**

Replace the existing `handleUpload` function with:

```ts
const handleUpload = async () => {
  if (files.length === 0) return;

  try {
    setUploading(true);
    setError(null);

    setCompressionProgress({ done: 0, total: files.length });
    const compressed: FileWithPreview[] = [];
    for (let i = 0; i < files.length; i++) {
      const original = files[i];
      const newFile = await compressImage(original.file);
      compressed.push({ ...original, file: newFile });
      setCompressionProgress({ done: i + 1, total: files.length });
    }
    setFiles(compressed);
    setCompressionProgress(null);

    const uploadResults = await uploadFiles(compressed.map((f) => f.file), project.id);

    const photosData = uploadResults.map((result, index) => ({
      project_id: project.id,
      file_name: compressed[index].file.name,
      file_size: compressed[index].file.size,
      file_url: result.url,
      week_ending_date: getWeekEndingDate(),
      description: compressed[index].description.trim() || undefined,
    }));

    await uploadPhotos(photosData);

    window.dispatchEvent(new CustomEvent('progressPhotosUploaded', {
      detail: { projectId: project.id },
    }));

    compressed.forEach((f) => URL.revokeObjectURL(f.preview));

    onUploadSuccess();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Upload failed');
  } finally {
    setUploading(false);
    setCompressionProgress(null);
  }
};
```

- [ ] **Step 3.4: Update the Upload button label to reflect compression progress**

Find this block in the JSX (around line 320-336):

```tsx
{uploading ? (
  <>
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
    Uploading...
  </>
) : (
  <>
    <Upload className="h-4 w-4 mr-2" />
    Upload Photos
  </>
)}
```

Replace it with:

```tsx
{uploading ? (
  <>
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
    {compressionProgress
      ? `Compressing ${compressionProgress.done}/${compressionProgress.total}...`
      : 'Uploading...'}
  </>
) : (
  <>
    <Upload className="h-4 w-4 mr-2" />
    Upload Photos
  </>
)}
```

- [ ] **Step 3.5: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3.6: Commit**

```bash
git add src/components/uploads/ProgressPhotosUpload.tsx
git commit -m "feat: compress progress photos client-side before upload"
```

---

## Task 4: Integrate into `PhotoUploadSection` (website projects)

**Files:**
- Modify: `src/components/website-projects/PhotoUploadSection.tsx`

The parent owns the upload action, so compression runs at pickup time. We make `handleFiles` async and add a compressing state.

- [ ] **Step 4.1: Add the import**

At the top of `src/components/website-projects/PhotoUploadSection.tsx`, add:

```ts
import { compressImage } from '@/lib/image-compression';
```

- [ ] **Step 4.2: Add compressing state**

In the component body, near the existing `useState` declarations, add:

```ts
const [compressing, setCompressing] = useState(false);
```

- [ ] **Step 4.3: Replace `handleFiles` to compress before passing files up**

Replace the existing `handleFiles` function with:

```ts
const handleFiles = async (files: File[]) => {
  const validFiles: File[] = [];
  const errors: string[] = [];

  files.forEach((file) => {
    if (!VALID_IMAGE_TYPES.includes(file.type as any)) {
      errors.push(`${file.name}: Invalid file type. Only JPG, PNG, WebP, and HEIC are allowed.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      return;
    }

    validFiles.push(file);
  });

  if (errors.length > 0) {
    toast({
      title: 'Invalid Files',
      description: errors.join(' '),
      variant: 'destructive',
    });
  }

  if (validFiles.length === 0) return;

  setCompressing(true);
  try {
    const compressed: File[] = [];
    for (const f of validFiles) {
      compressed.push(await compressImage(f));
    }

    onPhotosChange([...photos, ...compressed]);

    compressed.forEach((file) => {
      const url = URL.createObjectURL(file);
      setPreviewUrls((prev) => ({ ...prev, [file.name]: url }));
    });
  } finally {
    setCompressing(false);
  }
};
```

- [ ] **Step 4.4: Disable the file input and Choose Files button while compressing**

Find this block (around line 193-204):

```tsx
<Button type="button" onClick={openFileDialog} variant="outline">
  <Upload className="h-4 w-4 mr-2" />
  Choose Files
</Button>
<input
  ref={fileInputRef}
  type="file"
  multiple
  accept={VALID_IMAGE_TYPES.join(",")}
  onChange={handleFileInput}
  className="hidden"
/>
```

Replace with:

```tsx
<Button type="button" onClick={openFileDialog} variant="outline" disabled={compressing}>
  <Upload className="h-4 w-4 mr-2" />
  {compressing ? 'Compressing...' : 'Choose Files'}
</Button>
<input
  ref={fileInputRef}
  type="file"
  multiple
  accept={VALID_IMAGE_TYPES.join(",")}
  onChange={handleFileInput}
  disabled={compressing}
  className="hidden"
/>
```

- [ ] **Step 4.5: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4.6: Commit**

```bash
git add src/components/website-projects/PhotoUploadSection.tsx
git commit -m "feat: compress website project photos at pickup time"
```

---

## Task 5: Integrate into warehouse `FileUploader`

**Files:**
- Modify: `src/components/warehouse/FileUploader.tsx`

`FileUploader` is generic and accepts any file type (controlled by `accept` prop). Compression must pass through non-images unchanged — the `compressImage` utility already does that, so we can call it unconditionally.

- [ ] **Step 5.1: Add imports and useState**

At the top of `src/components/warehouse/FileUploader.tsx`, change:

```ts
import React, { useRef } from 'react';
```

to:

```ts
import React, { useRef, useState } from 'react';
import { compressImage } from '@/lib/image-compression';
```

- [ ] **Step 5.2: Add compressing state**

Inside the `FileUploader` component, after the `fileInputRef` declaration, add:

```ts
const [compressing, setCompressing] = useState(false);
```

- [ ] **Step 5.3: Replace `handleFileChange`**

Replace:

```ts
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  onChange(e.target.files?.[0] || null);
};
```

With:

```ts
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const picked = e.target.files?.[0] || null;
  if (!picked) {
    onChange(null);
    return;
  }
  setCompressing(true);
  try {
    const processed = await compressImage(picked);
    onChange(processed);
  } finally {
    setCompressing(false);
  }
};
```

- [ ] **Step 5.4: Show compressing state in the upload box**

Find this block in the JSX (around line 49-78):

```tsx
<label
  htmlFor={`file-upload-${label.replace(/\s+/g, '-')}`}
  className="flex flex-col items-center justify-center w-full h-32 sm:h-40 bg-muted/30 border-2 border-dashed border-border rounded-md cursor-pointer hover:bg-muted/50 hover:border-foreground/20 transition-colors mobile-touch-target"
>
  {value ? (
    <div className="flex flex-col items-center gap-2 p-4">
      <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center">
        <FileCheck2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <span className="text-sm font-medium text-foreground truncate max-w-full px-2">
        {value.name}
      </span>
      <span className="text-xs text-muted-foreground nums">
        {(value.size / 1024 / 1024).toFixed(2)} MB
      </span>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-2 p-4">
      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
        <Upload className="h-5 w-5 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">
        Click to upload
      </span>
      <span className="text-xs text-muted-foreground">
        or drag and drop
      </span>
    </div>
  )}
</label>
```

Replace it with:

```tsx
<label
  htmlFor={`file-upload-${label.replace(/\s+/g, '-')}`}
  className={`flex flex-col items-center justify-center w-full h-32 sm:h-40 bg-muted/30 border-2 border-dashed border-border rounded-md transition-colors mobile-touch-target ${
    compressing
      ? 'cursor-wait opacity-70'
      : 'cursor-pointer hover:bg-muted/50 hover:border-foreground/20'
  }`}
>
  {compressing ? (
    <div className="flex flex-col items-center gap-2 p-4">
      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">
        Compressing...
      </span>
    </div>
  ) : value ? (
    <div className="flex flex-col items-center gap-2 p-4">
      <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center">
        <FileCheck2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <span className="text-sm font-medium text-foreground truncate max-w-full px-2">
        {value.name}
      </span>
      <span className="text-xs text-muted-foreground nums">
        {(value.size / 1024 / 1024).toFixed(2)} MB
      </span>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-2 p-4">
      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
        <Upload className="h-5 w-5 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">
        Click to upload
      </span>
      <span className="text-xs text-muted-foreground">
        or drag and drop
      </span>
    </div>
  )}
</label>
```

- [ ] **Step 5.5: Disable the input while compressing**

Find:

```tsx
<input
  ref={fileInputRef}
  type="file"
  accept={accept}
  onChange={handleFileChange}
  className="hidden"
  id={`file-upload-${label.replace(/\s+/g, '-')}`}
/>
```

Replace with:

```tsx
<input
  ref={fileInputRef}
  type="file"
  accept={accept}
  onChange={handleFileChange}
  disabled={compressing}
  className="hidden"
  id={`file-upload-${label.replace(/\s+/g, '-')}`}
/>
```

- [ ] **Step 5.6: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5.7: Verify the production build succeeds**

Run:
```bash
npm run build
```

Expected: build succeeds with no errors. Watch for any new warnings related to `browser-image-compression` (e.g., bundling issues with Web Workers — should not occur but worth noting).

- [ ] **Step 5.8: Commit**

```bash
git add src/components/warehouse/FileUploader.tsx
git commit -m "feat: compress warehouse image uploads at pickup; pass through non-images"
```

---

## Task 6: Manual smoke test in dev server

**Files:** none modified — verification only.

- [ ] **Step 6.1: Start the dev server**

Run:
```bash
npm run dev
```

Open the app in a browser (typically http://localhost:3000). Sign in as a user with permissions to upload progress photos and warehouse files.

- [ ] **Step 6.2: Test progress photo compression**

Navigate to a project's progress photos upload page. Open DevTools → Network tab.

1. Drop in a single ~5 MB landscape JPEG.
2. Click Upload Photos.
3. Watch the button text — confirm it shows "Compressing 1/1..." then "Uploading..." then completes.
4. In the Network tab, find the upload request and confirm the request payload size is ~150–250 KB (not 5 MB).
5. After upload, navigate to the photo gallery and confirm the photo displays correctly with proper orientation.

- [ ] **Step 6.3: Test multi-photo compression with portrait phone photo**

1. Select 5 photos including at least one portrait-orientation photo from a phone (which has EXIF rotation).
2. Click Upload Photos.
3. Confirm button progresses through "Compressing 1/5..." → "Compressing 5/5..." → "Uploading..." → success.
4. In the gallery, confirm the portrait photo displays right-side-up (not rotated 90°).

- [ ] **Step 6.4: Test small-file pass-through**

1. Upload an icon-sized image (~50 KB PNG).
2. Confirm the network request is roughly the original size (not re-encoded).
3. Confirm the photo displays correctly.

- [ ] **Step 6.5: Test warehouse FileUploader with image**

1. Navigate to a warehouse delivery receipt creation form.
2. Pick a ~3 MB image as the receipt photo.
3. Confirm the uploader briefly shows "Compressing..." then displays the file with a much smaller MB count (~0.1–0.3 MB).
4. Submit the form and confirm the upload succeeds.

- [ ] **Step 6.6: Test warehouse FileUploader with non-image**

1. Pick a PDF file in the same uploader (or another uploader that accepts PDFs).
2. Confirm the file passes through unchanged — same name, same size, no "Compressing..." flash (or only momentary because the pass-through is instant).
3. Submit and confirm the PDF uploads correctly.

- [ ] **Step 6.7: Test website projects photo upload**

1. Navigate to website projects → create or edit a project.
2. Drag in 3 photos of varying sizes.
3. Confirm the Choose Files button shows "Compressing..." briefly.
4. Confirm the preview cards show small MB sizes (not the originals).
5. Save the project and confirm photos appear on the public site at expected sizes.

- [ ] **Step 6.8: Verify storage savings on backend**

In Supabase dashboard → Storage → `progress-photos` bucket, confirm recently uploaded files have size in the hundreds of KB, not MB.

- [ ] **Step 6.9: Mark plan complete**

If all steps above pass, the feature ships. If anything fails, file a follow-up ticket and stop here — do not attempt blind fixes.

```bash
git log --oneline -10
```

Expected: see commits from Tasks 1–5 in order.

---

## Rollout

This branch ships as a single PR. No feature flag needed — compression is purely additive. After merge:

1. Deploy to Vercel (auto on merge to main).
2. Re-run the smoke checklist (Steps 6.2–6.7) on production with one or two test photos.
3. Monitor Supabase storage usage over the following week to confirm new uploads land in the expected size range.
