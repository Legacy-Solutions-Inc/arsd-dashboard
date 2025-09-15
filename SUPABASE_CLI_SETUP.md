# Supabase CLI Setup for Website Projects

## Prerequisites

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project** (if not already linked):
   ```bash
   supabase link --project-ref your-project-ref
   ```

## Quick Setup

### Option 1: Automated Script (Recommended)

**For Windows (PowerShell):**
```powershell
.\scripts\setup-website-projects-cli.ps1
```

**For Mac/Linux (Bash):**
```bash
./scripts/setup-website-projects-cli.sh
```

### Option 2: Manual CLI Commands

1. **Push migrations to your Supabase project**:
   ```bash
   supabase db push
   ```

2. **Verify the setup**:
   ```bash
   supabase db diff
   ```

3. **Check your project status**:
   ```bash
   supabase status
   ```

## What Gets Created

### Database Tables
- `website_projects` - Main project data with validation
- `website_project_photos` - Photo metadata and ordering

### Storage
- `website-projects` bucket - Private storage for photos
- Storage policies for authenticated users

### Features
- ✅ Row Level Security policies
- ✅ Database triggers for auto-slug generation
- ✅ Indexes for performance
- ✅ Sample data (optional)

## Migration Files

The setup creates these migration files:
- `20241220000001_website_projects_schema.sql` - Tables and policies
- `20241220000002_website_projects_storage.sql` - Storage bucket
- `20241220000003_website_projects_sample_data.sql` - Sample data

## Verification

After running the setup:

1. **Check database**:
   ```bash
   supabase db diff
   ```

2. **View tables**:
   ```bash
   supabase db diff --schema public
   ```

3. **Test the application**:
   - Start your dev server: `npm run dev`
   - Go to Dashboard > Website Details > Projects tab
   - Should see projects interface (no errors)

## Troubleshooting

### Common Issues

1. **"Not linked to a project"**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

2. **"Migration failed"**:
   ```bash
   supabase db reset
   supabase db push
   ```

3. **"Permission denied"**:
   ```bash
   supabase login
   ```

### Check Logs

```bash
supabase logs
```

### Reset Database (if needed)

```bash
supabase db reset
```

## Manual Verification

You can also verify the setup by running these SQL queries in your Supabase dashboard:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('website_projects', 'website_project_photos');

-- Check if storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'website-projects';

-- Check policies
SELECT * FROM pg_policies WHERE tablename IN ('website_projects', 'website_project_photos');
```

## Next Steps

1. Start your development server
2. Test the Website Projects feature
3. Create your first project
4. Upload some photos
5. Verify everything works as expected

The feature should now be fully functional with all CRUD operations, photo uploads, and proper error handling!


