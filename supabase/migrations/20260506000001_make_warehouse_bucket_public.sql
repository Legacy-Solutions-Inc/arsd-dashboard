-- Make the warehouse bucket publicly readable.
-- Files are only reachable via URLs stored in authenticated DB rows, so public
-- access at the storage layer is acceptable and matches how NAS MinIO files are served.
UPDATE storage.buckets
SET public = true
WHERE id = 'warehouse';
