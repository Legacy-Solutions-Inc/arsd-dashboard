# Website Projects Setup Script for Supabase CLI (PowerShell)
# Run this script to set up the website projects feature

Write-Host "🚀 Setting up Website Projects feature..." -ForegroundColor Green

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Supabase CLI not found"
    }
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    Write-Host "   or visit: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

# Check if we're in a Supabase project
if (-not (Test-Path "supabase/config.toml")) {
    Write-Host "❌ Not in a Supabase project directory. Please run this from your project root." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Running database migrations..." -ForegroundColor Blue

# Run migrations
Write-Host "  → Creating database tables and policies..." -ForegroundColor Yellow
supabase db push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database setup completed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Database setup failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Website Projects feature is now ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start your development server: npm run dev" -ForegroundColor White
Write-Host "2. Go to Dashboard > Website Details > Projects tab" -ForegroundColor White
Write-Host "3. You should see the projects interface (empty or with sample data)" -ForegroundColor White
Write-Host ""
Write-Host "Features available:" -ForegroundColor Cyan
Write-Host "✅ Create, edit, and delete projects" -ForegroundColor Green
Write-Host "✅ Upload and manage photos" -ForegroundColor Green
Write-Host "✅ Search and pagination" -ForegroundColor Green
Write-Host "✅ Form validation" -ForegroundColor Green
Write-Host "✅ Error handling" -ForegroundColor Green
Write-Host ""
Write-Host "If you encounter any issues, check the browser console for error messages." -ForegroundColor Yellow


