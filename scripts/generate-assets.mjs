/**
 * Asset generation script for Repause.
 * Run with: node scripts/generate-assets.mjs
 *
 * Generates four on-brand PNGs: black background, orange (#FF6B00) accent ring.
 * Requires sharp: npm install --save-dev sharp
 */

import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

await mkdir('assets', { recursive: true });

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Build an SVG string for an icon: black bg + orange stroke ring.
 * @param {number} w Canvas width
 * @param {number} h Canvas height
 * @param {number} r Ring radius
 * @param {number} sw Stroke width
 */
function ringsvg(w, h, r, sw) {
  const cx = w / 2;
  const cy = h / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#000000"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#FF6B00" stroke-width="${sw}"/>
</svg>`;
}

/**
 * Build an SVG string for the favicon: black bg + small solid orange circle.
 * @param {number} w Canvas size (square)
 * @param {number} r Fill circle radius
 */
function dotSvg(w, r) {
  const c = w / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}">
  <rect width="${w}" height="${w}" fill="#000000"/>
  <circle cx="${c}" cy="${c}" r="${r}" fill="#FF6B00"/>
</svg>`;
}

// ── generate assets ───────────────────────────────────────────────────────────

const tasks = [
  {
    out: 'assets/icon.png',
    svg: ringsvg(1024, 1024, 340, 80),
    width: 1024,
    height: 1024,
  },
  {
    // Adaptive icon: tighter ring so Android masking (circle/squircle) doesn't clip
    out: 'assets/adaptive-icon.png',
    svg: ringsvg(1024, 1024, 240, 60),
    width: 1024,
    height: 1024,
  },
  {
    out: 'assets/splash.png',
    svg: ringsvg(1242, 2436, 240, 60),
    width: 1242,
    height: 2436,
  },
  {
    out: 'assets/favicon.png',
    svg: dotSvg(48, 16),
    width: 48,
    height: 48,
  },
];

for (const { out, svg, width, height } of tasks) {
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png()
    .toFile(out);
  console.log(`Generated ${out} (${width}x${height})`);
}

console.log('Done.');
