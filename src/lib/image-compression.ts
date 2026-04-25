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
