import sharp from 'sharp';
import fs from 'fs';

async function generateOgImage() {
  const width = 1200;
  const height = 630;

  // Resize product image for right side
  const productImg = await sharp('./public/images/cupboard.webp')
    .resize(460, 550, { fit: 'cover' })
    .toBuffer();

  // Resize logo for top-left
  const logo = await sharp('./public/logo-transparent.png')
    .resize(90, 90)
    .toBuffer();

  // SVG text and decorative card overlay
  const textSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#08090b" />
          <stop offset="50%" stop-color="#111317" />
          <stop offset="100%" stop-color="#181a20" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f6d365" />
          <stop offset="100%" stop-color="#c9a227" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#bgGrad)" />

      <!-- Border Accent -->
      <rect x="20" y="20" width="1160" height="590" rx="20" fill="none" stroke="rgba(201, 162, 39, 0.25)" stroke-width="2" />

      <!-- Gold Top Bar -->
      <rect x="70" y="55" width="60" height="4" rx="2" fill="url(#goldGrad)" />

      <!-- Brand Subheading -->
      <text x="180" y="95" font-family="'Montserrat', sans-serif" font-size="20" font-weight="700" letter-spacing="4" fill="#c9a227">
        JAGANNATH ENTERPRISES
      </text>
      <text x="180" y="125" font-family="'Inter', sans-serif" font-size="14" fill="#a0a5b5" letter-spacing="1">
        INDUSTRIAL FURNITURE &amp; STORAGE SOLUTIONS SINCE 1998
      </text>

      <!-- Main Headline -->
      <text x="60" y="215" font-family="'Montserrat', sans-serif" font-size="34" font-weight="800" fill="#ffffff" letter-spacing="0.5">
        Steel Almirah &amp; Industrial
      </text>
      <text x="60" y="260" font-family="'Montserrat', sans-serif" font-size="34" font-weight="800" fill="url(#goldGrad)" letter-spacing="0.5">
        Steel Cupboards
      </text>
      <text x="60" y="305" font-family="'Montserrat', sans-serif" font-size="28" font-weight="700" fill="#e0e3ea" letter-spacing="0.5">
        Premier Manufacturer India
      </text>

      <!-- Description -->
      <text x="60" y="355" font-family="'Inter', sans-serif" font-size="16" fill="#c0c5d2">
        Heavy-duty 2 Door, 3 Door &amp; 4 Door Steel Almirahs with Locker.
      </text>
      <text x="60" y="385" font-family="'Inter', sans-serif" font-size="16" fill="#c0c5d2">
        Fire-resistant Office Cupboards &amp; Modular Steel Wardrobes.
      </text>

      <!-- Highlights Pills -->
      <g transform="translate(60, 425)">
        <!-- Pill 1 -->
        <rect x="0" y="0" width="160" height="40" rx="20" fill="rgba(201,162,39,0.15)" stroke="#c9a227" stroke-width="1.5"/>
        <text x="80" y="25" font-family="'Inter', sans-serif" font-size="13" font-weight="600" fill="#f6d365" text-anchor="middle">✓ Grade-A Steel</text>

        <!-- Pill 2 -->
        <rect x="175" y="0" width="170" height="40" rx="20" fill="rgba(201,162,39,0.15)" stroke="#c9a227" stroke-width="1.5"/>
        <text x="260" y="25" font-family="'Inter', sans-serif" font-size="13" font-weight="600" fill="#f6d365" text-anchor="middle">✓ 5-Yr Warranty</text>

        <!-- Pill 3 -->
        <rect x="360" y="0" width="180" height="40" rx="20" fill="rgba(201,162,39,0.15)" stroke="#c9a227" stroke-width="1.5"/>
        <text x="450" y="25" font-family="'Inter', sans-serif" font-size="13" font-weight="600" fill="#f6d365" text-anchor="middle">✓ Delhi &amp; Odisha</text>
      </g>

      <!-- Footer URL -->
      <text x="60" y="555" font-family="'Inter', sans-serif" font-size="16" font-weight="700" fill="#c9a227">
        🌐 enterprize-sand.vercel.app
      </text>
      <text x="60" y="582" font-family="'Inter', sans-serif" font-size="14" fill="#888e9b">
        Pan-India Orders &amp; Inquiries: +91 7894838425
      </text>
    </svg>
  `;

  // Product photo border/shadow card SVG
  const cardBorderSvg = `
    <svg width="480" height="570" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="480" height="570" rx="16" fill="none" stroke="rgba(201,162,39,0.3)" stroke-width="3" />
    </svg>
  `;

  // Composite everything
  await sharp(Buffer.from(textSvg))
    .composite([
      { input: logo, top: 55, left: 70 },
      { input: productImg, top: 40, left: 680 },
      { input: Buffer.from(cardBorderSvg), top: 30, left: 670 }
    ])
    .jpeg({ quality: 92 })
    .toFile('./public/images/og-preview.jpg');

  console.log('Successfully created ./public/images/og-preview.jpg (1200x630)');
}

generateOgImage().catch(console.error);
