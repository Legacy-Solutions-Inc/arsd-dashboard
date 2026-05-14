import { createClient } from '@/lib/supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ALLOWED_UPLOAD_MIME_TYPES: string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

export type WarehouseStorageSupabaseClient = ReturnType<typeof createClient>;

export class WarehouseStorageService {
  private supabase: WarehouseStorageSupabaseClient;
  private readonly bucketName = 'warehouse';

  constructor(supabaseClient?: WarehouseStorageSupabaseClient) {
    this.supabase = supabaseClient ?? createClient();
  }

  /**
   * Upload DR photo
   */
  async uploadDRPhoto(deliveryReceiptId: string, file: File): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop();
    const fileName = `dr_photo.${fileExt}`;
    const filePath = `dr/${deliveryReceiptId}/${fileName}`;

    return this.uploadFile(filePath, file);
  }

  /**
   * Upload delivery proof photo
   */
  async uploadDeliveryProofPhoto(deliveryReceiptId: string, file: File): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop();
    const fileName = `delivery_proof.${fileExt}`;
    const filePath = `dr/${deliveryReceiptId}/${fileName}`;

    return this.uploadFile(filePath, file);
  }

  /**
   * Upload release attachment
   */
  async uploadReleaseAttachment(releaseFormId: string, file: File): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop();
    const fileName = `attachment.${fileExt}`;
    const filePath = `releases/${releaseFormId}/${fileName}`;

    return this.uploadFile(filePath, file);
  }

  /**
   * Validate an upload before it hits storage. Returns a user-friendly
   * error message when invalid, or null when the file is acceptable.
   */
  private validateFile(file: File): string | null {
    if (file.size > MAX_UPLOAD_BYTES) {
      return 'File is too large (max 15 MB). Please use a smaller photo.';
    }
    if (!file.type || !ALLOWED_UPLOAD_MIME_TYPES.includes(file.type)) {
      return 'Unsupported file type. Please upload a JPG, PNG, WebP, or HEIC image.';
    }
    return null;
  }

  /**
   * Generic file upload to warehouse bucket
   */
  private async uploadFile(filePath: string, file: File): Promise<UploadResult> {
    const validationError = this.validateFile(file);
    if (validationError) {
      return { success: false, error: validationError };
    }
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('WarehouseStorageService.uploadFile upload error', {
          bucket: this.bucketName,
          filePath,
          message: error.message,
        });
        return {
          success: false,
          error: error.message,
        };
      }

      // Get public URL (bucket must be public — see migration 20260506000001)
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      return {
        success: true,
        url: publicUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(filePath: string): Promise<UploadResult> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get download URL for a file
   */
  async getDownloadUrl(filePath: string, expiresIn: number = 3600): Promise<UploadResult> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        url: data.signedUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
