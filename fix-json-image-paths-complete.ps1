# Script to fix image paths and filenames in products_data.json
# Replace # with - in both directory paths and filenames

$jsonFilePath = "products/books/products_data.json"

# Read the JSON file
$content = Get-Content $jsonFilePath -Encoding UTF8 -Raw

# Replace # with - in the entire image path (both directory and filename)
$updatedContent = $content -replace '("image":\s*"[^"]*?)#([^"]*?")', '$1-$2'

# Apply the replacement multiple times to handle cases where there are multiple # in the same path
do {
    $previousContent = $updatedContent
    $updatedContent = $updatedContent -replace '("image":\s*"[^"]*?)#([^"]*?")', '$1-$2'
} while ($updatedContent -ne $previousContent)

# Write the updated content back to file
$updatedContent | Set-Content $jsonFilePath -Encoding UTF8

Write-Host "Fixed all # characters in image paths and filenames in products_data.json"