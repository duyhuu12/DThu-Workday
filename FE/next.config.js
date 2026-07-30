const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'src', 'img', 'dthu.jpg');
const destPath = path.join(__dirname, 'public', 'dthu.jpg');

try {
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log('Successfully copied gate image to public/dthu.jpg');
  } else {
    console.warn('Source image does not exist:', sourcePath);
  }
} catch (err) {
  console.error('Error copying gate image:', err);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
