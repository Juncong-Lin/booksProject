# PowerShell script to rename directories and update all references
Write-Host "🔄 Starting comprehensive fix for # characters..." -ForegroundColor Cyan

# Step 1: Rename all directories that contain # characters
Write-Host "📁 Renaming directories..." -ForegroundColor Yellow
Get-ChildItem "products\books" -Recurse -Directory | Where-Object { $_.Name -match "#" } | ForEach-Object {
    $oldName = $_.Name
    $newName = $oldName -replace "#", "-"
    $newPath = Join-Path $_.Parent.FullName $newName
    
    Write-Host "  Renaming: $oldName -> $newName" -ForegroundColor Gray
    
    try {
        Rename-Item $_.FullName $newName -Force
        Write-Host "    ✅ Success" -ForegroundColor Green
    } catch {
        Write-Host "    ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 2: Update all path references in data files
Write-Host "🔧 Updating path references..." -ForegroundColor Yellow

# Files to update
$filesToUpdate = @(
    "products\books\books.js",
    "products\books\products_data.json",
    "data\books.js",
    "data\cart.js", 
    "data\products.js"
)

foreach ($file in $filesToUpdate) {
    if (Test-Path $file) {
        Write-Host "  Updating: $file" -ForegroundColor Gray
        
        $content = Get-Content $file -Raw
        
        # Replace # with - in all paths and names
        $updatedContent = $content -replace "#", "-"
        
        Set-Content $file $updatedContent -Encoding UTF8
        Write-Host "    ✅ Updated" -ForegroundColor Green
    }
}

Write-Host "🎉 All fixes completed!" -ForegroundColor Cyan
Write-Host "📝 Summary:" -ForegroundColor White
Write-Host "  - Renamed directories with # characters" -ForegroundColor White
Write-Host "  - Updated all path references in data files" -ForegroundColor White
Write-Host "  - Images should now display correctly" -ForegroundColor White