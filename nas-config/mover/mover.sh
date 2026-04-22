#!/bin/bash
# ==============================================================================
# Supabase -> NAS tiered-storage mover
# Runs nightly via cron. Moves files older than AGE_HOURS from Supabase Storage
# to MinIO, rewrites their URLs in Postgres, and deletes the Supabase copy.
# ==============================================================================
set -euo pipefail

# Load secrets (DB_URL)
source /volume1/docker/mover/.env

AGE_HOURS="${AGE_HOURS:-24}"
SUPABASE_PREFIX="https://uoffxmrnpukibgcmmgus.supabase.co/storage/v1/object/public"
NAS_PREFIX="https://s3.arsd.co"
# website-projects is intentionally excluded (carveout - see plan).
BUCKETS=(accomplishment-reports progress-photos warehouse)
LOG_DIR="/volume1/docker/mover/logs"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG="$LOG_DIR/mover-$STAMP.log"

mkdir -p "$LOG_DIR"
exec > >(tee -a "$LOG") 2>&1

echo "=== Mover run started: $(date -Iseconds) ==="
echo "AGE_HOURS=$AGE_HOURS"

# -----------------------------------------------------------------------------
# Step 1: Copy old-enough files Supabase -> MinIO
# -----------------------------------------------------------------------------
for bucket in "${BUCKETS[@]}"; do
  echo ""
  echo "--- Copying supabase:$bucket -> minio:$bucket (min-age ${AGE_HOURS}h) ---"
  rclone copy "supabase:$bucket" "minio:$bucket" \
    --min-age "${AGE_HOURS}h" \
    --checksum \
    --transfers 8 \
    --checkers 16 \
    --log-level INFO
done

# -----------------------------------------------------------------------------
# Step 2: Rewrite URLs in Postgres
# Column names verified against production schema on 2026-04-22.
# Each UPDATE is idempotent - it only affects rows that still contain the
# Supabase prefix, so re-running the script is safe.
# -----------------------------------------------------------------------------
echo ""
echo "--- Rewriting URLs in Postgres ---"
psql "$DB_URL" <<SQL
BEGIN;

-- accomplishment-reports bucket
UPDATE accomplishment_reports
SET file_url = REPLACE(file_url, '$SUPABASE_PREFIX', '$NAS_PREFIX')
WHERE file_url LIKE '$SUPABASE_PREFIX/%';

-- progress-photos bucket
UPDATE progress_photos
SET file_url = REPLACE(file_url, '$SUPABASE_PREFIX', '$NAS_PREFIX')
WHERE file_url LIKE '$SUPABASE_PREFIX/%';

-- warehouse bucket: delivery receipts (two URL columns)
UPDATE delivery_receipts
SET dr_photo_url = REPLACE(dr_photo_url, '$SUPABASE_PREFIX', '$NAS_PREFIX')
WHERE dr_photo_url LIKE '$SUPABASE_PREFIX/%';

UPDATE delivery_receipts
SET delivery_proof_url = REPLACE(delivery_proof_url, '$SUPABASE_PREFIX', '$NAS_PREFIX')
WHERE delivery_proof_url LIKE '$SUPABASE_PREFIX/%';

-- warehouse bucket: release forms
UPDATE release_forms
SET attachment_url = REPLACE(attachment_url, '$SUPABASE_PREFIX', '$NAS_PREFIX')
WHERE attachment_url LIKE '$SUPABASE_PREFIX/%';

COMMIT;
SQL

# -----------------------------------------------------------------------------
# Step 3: Delete old-enough files from Supabase
# Only runs if Steps 1 and 2 succeeded (set -e above).
# website-projects bucket is NOT drained - see carveout note.
# -----------------------------------------------------------------------------
for bucket in "${BUCKETS[@]}"; do
  echo ""
  echo "--- Deleting supabase:$bucket (min-age ${AGE_HOURS}h) ---"
  rclone delete "supabase:$bucket" \
    --min-age "${AGE_HOURS}h" \
    --log-level INFO
done

echo ""
echo "=== Mover run finished: $(date -Iseconds) ==="
