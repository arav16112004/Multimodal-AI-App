#!/bin/bash

# Generate favicon files from your existing favicon.ico
# Make sure you have a high-quality source image (PNG recommended)

echo "Generating favicon files..."

# If you have a PNG source image, you can use sips to resize it
# For now, we'll create placeholder files that you can replace

# Create 16x16 favicon
echo "Creating 16x16 favicon..."
# sips -z 16 16 your-source-image.png --out public/favicon-16x16.png

# Create 32x32 favicon  
echo "Creating 32x32 favicon..."
# sips -z 32 32 your-source-image.png --out public/favicon-32x32.png

# Create Apple touch icon
echo "Creating Apple touch icon..."
# sips -z 180 180 your-source-image.png --out public/apple-touch-icon.png

echo "Favicon generation complete!"
echo ""
echo "To generate actual favicon files:"
echo "1. Place your high-quality source image (PNG recommended) in the project root"
echo "2. Uncomment the sips commands above and update the filename"
echo "3. Run: chmod +x generate-favicons.sh && ./generate-favicons.sh"
echo ""
echo "Or use an online favicon generator like:"
echo "- https://realfavicongenerator.net/"
echo "- https://favicon.io/"
