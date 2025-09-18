-- Add XLSX support and increase file size limit to 20MB for accomplishment-reports bucket
UPDATE storage.buckets 
SET 
  allowed_mime_types = ARRAY[
    'text/csv', 
    'application/csv', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
    'application/vnd.ms-excel'
  ],
  file_size_limit = 20971520 -- 20MB limit
WHERE id = 'accomplishment-reports';
