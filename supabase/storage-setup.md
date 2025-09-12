# Supabase Storage Setup for Website Projects

## Storage Bucket Configuration

To complete the setup, you need to create a storage bucket in your Supabase project:

### 1. Create Storage Bucket

Run this SQL in your Supabase SQL editor or add it to a migration:

```sql
-- Create storage bucket for website projects photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-projects',
  'website-projects',
  false, -- Private bucket
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
);
```

### 2. Storage Policies

Add these policies to allow authenticated users to manage photos:

```sql
-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload website project photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'website-projects' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view photos
CREATE POLICY "Authenticated users can view website project photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'website-projects' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update photos
CREATE POLICY "Authenticated users can update website project photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'website-projects' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete photos
CREATE POLICY "Authenticated users can delete website project photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'website-projects' 
  AND auth.role() = 'authenticated'
);
```

### 3. Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Migrations

Execute the database schema migration:

```bash
# If using Supabase CLI
supabase db push

# Or run the SQL files directly in your Supabase dashboard
```

## File Structure

Photos will be stored with the following structure:
```
website-projects/
├── {project_id}/
│   ├── {timestamp}-0.jpg
│   ├── {timestamp}-1.png
│   └── ...
```

## Usage

The application will automatically:
- Upload photos to the `website-projects` bucket
- Generate signed URLs for photo previews
- Handle file validation and size limits
- Clean up photos when projects are deleted

