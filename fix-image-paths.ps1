# PowerShell script to fix image path references in books.js
$booksFile = "products\books\books.js"

if (Test-Path $booksFile) {
    Write-Host "Updating image path references in $booksFile..." -ForegroundColor Yellow
    
    # Read the file content
    $content = Get-Content $booksFile -Raw
    
    # Replace all # characters with - in image paths
    $updatedContent = $content -replace '(\(#)(\d+)(\))', '(-$2)'
    
    # Write the updated content back to the file
    Set-Content $booksFile $updatedContent -Encoding UTF8
    
    Write-Host "✅ Updated image path references in $booksFile" -ForegroundColor Green
} else {
    Write-Host "❌ File $booksFile not found" -ForegroundColor Red
}

# Also check products_data.json if it exists
$dataFile = "products\books\products_data.json"
if (Test-Path $dataFile) {
    Write-Host "Updating image path references in $dataFile..." -ForegroundColor Yellow
    
    $content = Get-Content $dataFile -Raw
    $updatedContent = $content -replace '(\(#)(\d+)(\))', '(-$2)'
    Set-Content $dataFile $updatedContent -Encoding UTF8
    
    Write-Host "✅ Updated image path references in $dataFile" -ForegroundColor Green
}

# Check data folder files
Get-ChildItem "data" -Filter "*.js" | ForEach-Object {
    Write-Host "Updating image path references in $($_.FullName)..." -ForegroundColor Yellow
    
    $content = Get-Content $_.FullName -Raw
    $updatedContent = $content -replace '(\(#)(\d+)(\))', '(-$2)'
    Set-Content $_.FullName $updatedContent -Encoding UTF8
    
    Write-Host "✅ Updated image path references in $($_.Name)" -ForegroundColor Green
}

Write-Host "🎉 All image path references have been updated!" -ForegroundColor Cyan