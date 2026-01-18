// Simple script to generate PWA icons
// This creates placeholder icons with the IJAISM logo

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG template for each size
sizes.forEach(size => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#1a365d"/>

  <!-- IJAISM Text -->
  <text
    x="${size / 2}"
    y="${size / 2}"
    font-family="Georgia, serif"
    font-size="${size * 0.3}"
    font-weight="bold"
    fill="#ffffff"
    text-anchor="middle"
    dominant-baseline="central"
  >IJAISM</text>
</svg>`;

  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Generated ${filename}`);
});

console.log('\nAll icons generated successfully!');
console.log('Note: These are SVG files. For PNG, you can convert them using an online tool or ImageMagick.');
