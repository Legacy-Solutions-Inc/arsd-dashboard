# Website Projects Feature

This feature allows all authenticated users to manage website project entries with photos for the public website.

## Components

### WebsiteProjectsTab
Main component that displays the projects list with search, pagination, and CRUD operations.

### ProjectFormModal
Modal for creating and editing projects with photo upload functionality.

### PhotoUploadSection
Handles photo uploads with drag-and-drop, preview, and validation.

### ProjectDeleteModal
Confirmation modal for deleting projects.

## Features

- ✅ **Project Management**: Create, read, update, delete projects
- ✅ **Photo Upload**: Multiple photo upload with drag-and-drop
- ✅ **Photo Management**: Preview, reorder, and delete photos
- ✅ **Search & Filter**: Search by name or location
- ✅ **Pagination**: Handle large lists of projects
- ✅ **Validation**: Form validation and file type/size validation
- ✅ **Loading States**: Skeleton loaders and loading indicators
- ✅ **Error Handling**: Toast notifications for success/error states
- ✅ **Responsive Design**: Works on mobile and desktop

## Database Schema

### website_projects
- `id` (UUID, Primary Key)
- `name` (TEXT, 2-120 chars)
- `location` (TEXT, 2-120 chars)
- `slug` (TEXT, Unique, auto-generated)
- `is_deleted` (BOOLEAN, for soft delete)
- `created_by`, `updated_by` (UUID, references auth.users)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### website_project_photos
- `id` (UUID, Primary Key)
- `project_id` (UUID, Foreign Key)
- `file_path` (TEXT, storage path)
- `order_index` (INTEGER, for photo ordering)
- `alt_text` (TEXT, optional)
- `created_at` (TIMESTAMPTZ)

## Storage

Photos are stored in the `website-projects` Supabase storage bucket with the structure:
```
website-projects/
├── {project_id}/
│   ├── {timestamp}-0.jpg
│   ├── {timestamp}-1.png
│   └── ...
```

## Usage

1. Navigate to Dashboard > Website Details > Projects tab (accessible to all authenticated users)
2. Click "Add Project" to create a new project
3. Fill in project name and location
4. Upload photos by dragging and dropping or clicking to browse
5. Save the project
6. Use search to filter projects
7. Click edit/delete buttons to manage existing projects

## Validation Rules

- Project name: 2-120 characters, required
- Location: 2-120 characters, required
- Photos: JPG, PNG, WebP, HEIC only, max 10MB each, max 30 per project
- File names are auto-generated to prevent conflicts
