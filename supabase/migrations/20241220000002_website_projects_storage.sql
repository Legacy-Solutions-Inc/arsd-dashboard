-- Create storage bucket for website projects photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-projects',
  'website-projects',
  false, -- Private bucket
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for website-projects bucket
CREATE POLICY "Authenticated users can upload website project photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'website-projects' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view website project photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'website-projects' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update website project photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'website-projects' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete website project photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'website-projects' 
  AND auth.role() = 'authenticated'
);


