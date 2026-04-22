import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createServiceSupabaseClient } from '@/lib/supabase';

const NAS_PREFIX = 'https://s3.arsd.co/';
const SUPABASE_PUBLIC_PREFIX =
  'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/';

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: process.env.NAS_S3_ENDPOINT!,
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.NAS_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NAS_S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
  }
  return s3Client;
}

function splitBucketAndKey(rest: string): { bucket: string; key: string } {
  const firstSlash = rest.indexOf('/');
  if (firstSlash === -1) {
    throw new Error(`deleteByUrl: cannot extract bucket/key from "${rest}"`);
  }
  return { bucket: rest.slice(0, firstSlash), key: rest.slice(firstSlash + 1) };
}

/**
 * Delete a stored file by its public URL. Routes by URL prefix:
 * - https://s3.arsd.co/<bucket>/<key> -> MinIO on the NAS (via AWS SDK)
 * - https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/<bucket>/<key> -> Supabase Storage
 *
 * Server-side only: reads NAS_S3_* env vars and the Supabase service role key.
 */
export async function deleteByUrl(url: string): Promise<void> {
  if (url.startsWith(NAS_PREFIX)) {
    const { bucket, key } = splitBucketAndKey(url.slice(NAS_PREFIX.length));
    await getS3Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return;
  }

  if (url.startsWith(SUPABASE_PUBLIC_PREFIX)) {
    const { bucket, key } = splitBucketAndKey(url.slice(SUPABASE_PUBLIC_PREFIX.length));
    const supabase = createServiceSupabaseClient();
    const { error } = await supabase.storage.from(bucket).remove([key]);
    if (error) throw error;
    return;
  }

  throw new Error(`deleteByUrl: unrecognized URL prefix: ${url}`);
}
