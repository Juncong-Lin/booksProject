# PowerShell script to rename files with invalid characters for Netlify deployment
# This script replaces # and ? characters with safe alternatives

Write-Host "Fixing filenames for Netlify deployment..." -ForegroundColor Yellow

# Function to safely rename files and update paths
function Rename-ProblematicFiles {
    param([string]$basePath)
    
    $filesRenamed = 0
    
    # Find all files with # or ? in their names
    Get-ChildItem -Path $basePath -Recurse -File | Where-Object { 
        $_.Name -match '[#\?]' 
    } | ForEach-Object {
        $oldName = $_.Name
        $newName = $oldName -replace '#', '-' -replace '\?', '-'
        $oldPath = $_.FullName
        $newPath = Join-Path $_.Directory $newName
        
        try {
            Rename-Item -Path $oldPath -NewName $newName -Force
            Write-Host "Renamed: $oldName to $newName" -ForegroundColor Green
            $filesRenamed++
        }
        catch {
            Write-Host "Failed to rename: $oldName" -ForegroundColor Red
        }
    }
    
    # Also rename directories with problematic characters
    Get-ChildItem -Path $basePath -Recurse -Directory | Where-Object { 
        $_.Name -match '[#\?]' 
    } | ForEach-Object {
        $oldName = $_.Name
        $newName = $oldName -replace '#', '-' -replace '\?', '-'
        $oldPath = $_.FullName
        $newPath = Join-Path $_.Parent $newName
        
        try {
            Rename-Item -Path $oldPath -NewName $newName -Force
            Write-Host "Renamed directory: $oldName to $newName" -ForegroundColor Green
            $filesRenamed++
        }
        catch {
            Write-Host "Failed to rename directory: $oldName" -ForegroundColor Red
        }
    }
    
    return $filesRenamed
}

# Run the renaming function
$totalRenamed = Rename-ProblematicFiles -basePath "."

Write-Host ""
Write-Host "Completed! Renamed $totalRenamed files/directories" -ForegroundColor Cyan
Write-Host "Your project is now ready for Netlify deployment!" -ForegroundColor Green