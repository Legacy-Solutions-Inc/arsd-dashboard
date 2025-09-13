-- Add public read access for website project photos
-- This allows unauthenticated users to view photos on the public projects page

-- Allow public read access to website project photos
CREATE POLICY "Public can view website project photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'website-projects'
);

-- Update the bucket to allow public access for reading
UPDATE storage.buckets 
SET public = true 
WHERE id = 'website-projects';
