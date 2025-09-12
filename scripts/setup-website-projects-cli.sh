#!/bin/bash

# Website Projects Setup Script for Supabase CLI
# Run this script to set up the website projects feature

echo "🚀 Setting up Website Projects feature..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    echo "   or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory. Please run this from your project root."
    exit 1
fi

echo "📋 Running database migrations..."

# Run migrations
echo "  → Creating database tables and policies..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully!"
else
    echo "❌ Database setup failed. Please check the errors above."
    exit 1
fi

echo ""
echo "🎉 Website Projects feature is now ready!"
echo ""
echo "Next steps:"
echo "1. Start your development server: npm run dev"
echo "2. Go to Dashboard > Website Details > Projects tab"
echo "3. You should see the projects interface (empty or with sample data)"
echo ""
echo "Features available:"
echo "✅ Create, edit, and delete projects"
echo "✅ Upload and manage photos"
echo "✅ Search and pagination"
echo "✅ Form validation"
echo "✅ Error handling"
echo ""
echo "If you encounter any issues, check the browser console for error messages."


