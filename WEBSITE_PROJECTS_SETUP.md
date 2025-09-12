# Website Projects Setup Guide

## Quick Setup

If you're seeing the "Database Setup Required" error, follow these steps:

### Option 1: One-Click Setup (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `scripts/setup-website-projects.sql`
4. Click **Run** to execute the script
5. Refresh the Website Details page

### Option 2: Manual Setup

1. **Database Tables**: Run `supabase/migrations/website-projects-schema.sql`
2. **Storage Bucket**: Run `supabase/storage-setup.md` instructions
3. Refresh the page

## What Gets Created

### Database Tables
- `website_projects` - Main project data
- `website_project_photos` - Photo metadata and ordering

### Storage Bucket
- `website-projects` - Private bucket for photo storage

### Features Enabled
- ✅ Project CRUD operations
- ✅ Photo upload with drag-and-drop
- ✅ Search and pagination
- ✅ Form validation
- ✅ Error handling

## Verification

After setup, you should see:
- Empty projects list (or sample data if you ran the full script)
- "Add Project" button works
- No error messages

## Troubleshooting

### Still seeing errors?
1. Check browser console for detailed error messages
2. Verify Supabase connection in your `.env.local`
3. Ensure you're logged in as an authenticated user
4. Check Supabase logs for any permission issues

### Need help?
- Check the browser console for specific error messages
- Verify your Supabase project is active
- Ensure all environment variables are set correctly


