import imageCompression from 'browser-image-compression';
import {
  AGGRESSIVE_PRESET,
  CompressOptions,
  SKIP_THRESHOLD_BYTES,
} from '@/types/image-compression';

const COMPRESSION_TIMEOUT_MS = 30000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Compression timed out after ' + ms + 'ms')), ms)
    ),
  ]);
}

export async function compressImage(
  file: File,
  opts: Partial<CompressOptions> = {},
  onFailure: 'fallback' | 'throw' = 'fallback'
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  if (file.size < SKIP_THRESHOLD_BYTES) {
    return file;
  }

  const merged: CompressOptions = { ...AGGRESSIVE_PRESET, ...opts };

  try {
    const compressed = await withTimeout(
      imageCompression(file, {
        maxSizeMB: merged.maxSizeMB,
        maxWidthOrHeight: merged.maxWidthOrHeight,
        initialQuality: merged.initialQuality,
        fileType: merged.fileType,
        useWebWorker: true,
      }),
      COMPRESSION_TIMEOUT_MS
    );

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
    if (onFailure === 'throw') {
      const isHeic = /image\/hei[cf]/i.test(file.type);
      throw new Error(
        isHeic
          ? "This photo couldn't be processed (HEIC format). On iPhone, set Settings > Camera > Formats to 'Most Compatible', or pick a different photo."
          : "Image couldn't be processed. Please try a different photo."
      );
    }
    return file;
  }
}

function renameToJpg(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return `${name}.jpg`;
  return `${name.slice(0, dot)}.jpg`;
}
