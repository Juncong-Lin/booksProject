# PowerShell script to update production API URL
# Usage: .\update-production-url.ps1 "https://your-backend-domain.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$BackendUrl
)

$ConfigFile = "config\config.js"

if (-not (Test-Path $ConfigFile)) {
    Write-Host "❌ Config file not found: $ConfigFile" -ForegroundColor Red
    exit 1
}

# Remove trailing slash if present
$BackendUrl = $BackendUrl.TrimEnd('/')

# Read the config file
$content = Get-Content $ConfigFile -Raw

# Update the API_BASE_URL in production config
$pattern = "API_BASE_URL: 'https://your-backend-domain.com/api/v1'"
$replacement = "API_BASE_URL: '$BackendUrl/api/v1'"
$newContent = $content -replace [regex]::Escape($pattern), $replacement

# Save backup
Copy-Item $ConfigFile "$ConfigFile.bak"

# Write updated content
Set-Content $ConfigFile $newContent

Write-Host "✅ Updated production API URL to: $BackendUrl/api/v1" -ForegroundColor Green
Write-Host "📁 Backup saved as: $ConfigFile.bak" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Now you can deploy your frontend!" -ForegroundColor Cyan

# Show the updated configuration
Write-Host ""
Write-Host "📋 Updated configuration preview:" -ForegroundColor Blue
Write-Host "API_BASE_URL: '$BackendUrl/api/v1'" -ForegroundColor White