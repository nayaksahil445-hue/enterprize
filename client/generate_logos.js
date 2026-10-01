import sharp from 'sharp';
import fs from 'fs';

// Helper to compile a valid Windows .ico file from multiple PNG buffers
function packIco(pngs) {
  // header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(pngs.length, 4); // Number of images

  const entries = [];
  let offset = 6 + pngs.length * 16;

  for (const png of pngs) {
    const entry = Buffer.alloc(16);
    // Width and height: 0 means 256
    entry.writeUInt8(png.width >= 256 ? 0 : png.width, 0);
    entry.writeUInt8(png.height >= 256 ? 0 : png.height, 1);
    entry.writeUInt8(0, 2); // Color palette (0 = no palette)
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(png.data.length, 8); // Image data size
    entry.writeUInt32LE(offset, 12); // Offset
    entries.push(entry);
    offset += png.data.length;
  }

  return Buffer.concat([
    header,
    ...entries,
    ...pngs.map(p => p.data)
  ]);
}

async function main() {
  const inputPath = './public/logo.png';
  console.log(`Processing logo: ${inputPath}...`);

  // Mask SVG for rounded corners (x=65, y=65, w=894, h=894, r=160)
  // Perfectly centered, crops 0 gold pixels, provides clean transparency outside the gold border.
  const maskSvg = `
    <svg width="1024" height="1024">
      <rect x="65" y="65" width="894" height="894" rx="160" ry="160" fill="white" />
    </svg>
  `;

  // 1. Generate full-resolution transparent-corner version (1024x1024)
  const transparentBuffer1024 = await sharp(inputPath)
    .composite([{
      input: Buffer.from(maskSvg),
      blend: 'dest-in'
    }])
    .sharpen()
    .toBuffer();

  fs.writeFileSync('./public/logo-transparent.png', transparentBuffer1024);
  console.log('Saved public/logo-transparent.png (1024x1024)');

  // 2. Generate full-resolution black-background version (1024x1024)
  const blackBuffer1024 = await sharp(inputPath)
    .sharpen()
    .toBuffer();
  fs.writeFileSync('./public/logo-black.png', blackBuffer1024);
  console.log('Saved public/logo-black.png (1024x1024)');

  const sizes = [48, 64, 128, 256, 512, 1024];

  // 3. Generate sizes for transparent-corner icons
  for (const size of sizes) {
    const data = await sharp(transparentBuffer1024)
      .resize(size, size)
      .toBuffer();
    fs.writeFileSync(`./public/logo-transparent-${size}.png`, data);
    console.log(`Saved public/logo-transparent-${size}.png`);
  }

  // 4. Generate sizes for black-background icons
  for (const size of sizes) {
    const data = await sharp(blackBuffer1024)
      .resize(size, size)
      .toBuffer();
    fs.writeFileSync(`./public/logo-black-${size}.png`, data);
    console.log(`Saved public/logo-black-${size}.png`);
  }

  // 5. Generate PWA standard icons
  // homescreen icons (typically black background to look solid)
  const icon192 = await sharp(blackBuffer1024).resize(192, 192).toBuffer();
  fs.writeFileSync('./public/icon-192x192.png', icon192);
  console.log('Saved public/icon-192x192.png');

  const icon512 = await sharp(blackBuffer1024).resize(512, 512).toBuffer();
  fs.writeFileSync('./public/icon-512x512.png', icon512);
  console.log('Saved public/icon-512x512.png');

  // iOS home screen icon (solid black, 180x180)
  const appleIcon = await sharp(blackBuffer1024).resize(180, 180).toBuffer();
  fs.writeFileSync('./public/apple-touch-icon.png', appleIcon);
  console.log('Saved public/apple-touch-icon.png');

  // 6. Generate favicon.ico (containing 16x16, 32x32, 48x48 transparent PNGs)
  const sizesForIco = [16, 32, 48];
  const icoPngs = [];
  for (const s of sizesForIco) {
    const data = await sharp(transparentBuffer1024).resize(s, s).toBuffer();
    icoPngs.push({ width: s, height: s, data });
  }
  const icoBuffer = packIco(icoPngs);
  fs.writeFileSync('./public/favicon.ico', icoBuffer);
  console.log('Saved public/favicon.ico (multi-resolution)');

  // 7. Generate favicon.svg (SVG vector container with base64-embedded 256x256 transparent PNG)
  const faviconSvgPng = await sharp(transparentBuffer1024).resize(256, 256).toBuffer();
  const base64Png = faviconSvgPng.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <image href="data:image/png;base64,${base64Png}" x="0" y="0" width="256" height="256" />
</svg>`;
  fs.writeFileSync('./public/favicon.svg', svgContent);
  console.log('Saved public/favicon.svg (Base64 embedded PNG vector container)');

  console.log('Logo generation completed successfully!');
}

main().catch(err => {
  console.error('Error running generation script:', err);
  process.exit(1);
});
