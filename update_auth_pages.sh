#!/bin/bash

# Update detail.html
echo "Updating detail.html..."

# Add auth.js to detail.html if not already present
if ! grep -q "auth/auth.js" h:/Code/booksProject/detail.html; then
    sed -i 's|<script src="scripts/shared/shared-header-loader.js"></script>|<script src="scripts/auth/auth.js"></script>\n    <script src="scripts/shared/shared-header-loader.js"></script>|' h:/Code/booksProject/detail.html
fi

# Add feather icons to detail.html if not already present
if ! grep -q "feather-icons" h:/Code/booksProject/detail.html; then
    sed -i 's|</head>|    <script src="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js"></script>\n  </head>|' h:/Code/booksProject/detail.html
fi

echo "Pages updated successfully!"