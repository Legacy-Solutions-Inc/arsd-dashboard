import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createServiceSupabaseClient } from '@/lib/supabase';

const SUPABASE_PUBLIC_PREFIX =
  'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public/';
const NAS_PREFIX = 'https://s3.arsd.co/';
const AGE_HOURS = 24;

// website-projects stays on Supabase (schema stores file_path, not URL)
const MIGRATED_BUCKETS = ['accomplishment-reports', 'progress-photos', 'warehouse'] as const;

const DB_TARGETS = [
  { table: 'accomplishment_reports', column: 'file_url' },
  { table: 'progress_photos', column: 'file_url' },
  { table: 'delivery_receipts', column: 'dr_photo_url' },
  { table: 'delivery_receipts', column: 'delivery_proof_url' },
  { table: 'release_forms', column: 'attachment_url' },
] as const;

function getNasS3Client(): S3Client {
  return new S3Client({
    endpoint: process.env.NAS_S3_ENDPOINT!,
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.NAS_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NAS_S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

function parseSupabaseUrl(url: string): { bucket: string; key: string } {
  const path = url.slice(SUPABASE_PUBLIC_PREFIX.length);
  const slash = path.indexOf('/');
  if (slash === -1) throw new Error(`Cannot parse bucket/key from: ${url}`);
  const bucket = path.slice(0, slash);
  if (!(MIGRATED_BUCKETS as readonly string[]).includes(bucket)) {
    throw new Error(`Bucket "${bucket}" is not in the migration set`);
  }
  return { bucket, key: path.slice(slash + 1) };
}

function toNasUrl(supabaseUrl: string): string {
  return supabaseUrl.replace(
    'https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public',
    'https://s3.arsd.co'
  );
}

export interface MoverResult {
  moved: number;
  errors: string[];
}

export async function runNasMover(): Promise<MoverResult> {
  const supabase = createServiceSupabaseClient();
  const s3 = getNasS3Client();
  const cutoff = new Date(Date.now() - AGE_HOURS * 60 * 60 * 1000).toISOString();

  // Collect { table, column, id, url } for all rows with Supabase URLs older than AGE_HOURS
  const pending: Array<{ table: string; column: string; id: string; url: string }> = [];

  for (const { table, column } of DB_TARGETS) {
    const { data } = await supabase
      .from(table)
      .select(`id, ${column}, created_at`)
      .like(column, `${SUPABASE_PUBLIC_PREFIX}%`)
      .lt('created_at', cutoff);

    if (!data) continue;
    for (const row of data as Array<Record<string, unknown>>) {
      const url = row[column] as string | null;
      if (url) pending.push({ table, column, id: row.id as string, url });
    }
  }

  const result: MoverResult = { moved: 0, errors: [] };

  for (const { table, column, id, url } of pending) {
    try {
      const { bucket, key } = parseSupabaseUrl(url);

      // Download from Supabase
      const { data: blob, error: downloadErr } = await supabase.storage
        .from(bucket)
        .download(key);
      if (downloadErr || !blob) {
        throw new Error(`Download failed: ${downloadErr?.message ?? 'no data'}`);
      }

      const buffer = Buffer.from(await blob.arrayBuffer());

      // Upload to MinIO
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: blob.type || 'application/octet-stream',
        })
      );

      // Rewrite URL in DB
      const nasUrl = toNasUrl(url);
      const { error: updateErr } = await supabase
        .from(table)
        .update({ [column]: nasUrl })
        .eq('id', id);
      if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`);

      // Delete from Supabase Storage
      const { error: deleteErr } = await supabase.storage.from(bucket).remove([key]);
      if (deleteErr) throw new Error(`Supabase delete failed: ${deleteErr.message}`);

      result.moved++;
    } catch (err) {
      result.errors.push(
        `[${table}.${column} id=${id}] ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return result;
}
