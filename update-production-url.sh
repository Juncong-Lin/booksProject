#!/bin/bash
# Script to update production API URL
# Usage: ./update-production-url.sh https://your-backend-domain.com

if [ -z "$1" ]; then
    echo "Usage: $0 <backend-url>"
    echo "Example: $0 https://your-backend.railway.app"
    exit 1
fi

BACKEND_URL="$1"
CONFIG_FILE="config/config.js"

# Remove trailing slash if present
BACKEND_URL=${BACKEND_URL%/}

# Update the config file
sed -i.bak "s|API_BASE_URL: 'https://your-backend-domain.com/api/v1'|API_BASE_URL: '${BACKEND_URL}/api/v1'|g" "$CONFIG_FILE"

echo "✅ Updated production API URL to: ${BACKEND_URL}/api/v1"
echo "📁 Backup saved as: ${CONFIG_FILE}.bak"
echo ""
echo "🚀 Now you can deploy your frontend!"