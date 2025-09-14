# Script to fix image paths in products_data.json
# Replace # with - in image paths only

$jsonFilePath = "products/books/products_data.json"

# Read the JSON file
$content = Get-Content $jsonFilePath -Encoding UTF8 -Raw

# Replace only image paths containing #
# This regex targets the "image": "path..." pattern and replaces # with - in those paths
$updatedContent = $content -replace '("image":\s*"[^"]*?)#([^"]*?")', '$1-$2'

# Write the updated content back to file
$updatedContent | Set-Content $jsonFilePath -Encoding UTF8

Write-Host "Fixed image paths in products_data.json - replaced # with - in image paths"