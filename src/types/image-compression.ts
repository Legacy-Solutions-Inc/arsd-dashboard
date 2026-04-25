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
