/**
 * Génère toutes les icônes PWA depuis public/logo.png
 *
 * Le logo est déjà carré avec fond foncé — on redimensionne directement,
 * sans rogner, sans padding, sans fond blanc.
 *
 * Usage : node scripts/generate-icons.mjs
 */

import sharp from "sharp";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC  = resolve(__dirname, "../public/logo.png");
const DEST = resolve(__dirname, "../public");

// ── 1. Lire les dimensions réelles ───────────────────────────────────────────
const { width: W, height: H } = await sharp(SRC).metadata();
console.log(`Source : ${W}×${H} px`);

// ── 2. Générer toutes les tailles (resize simple, sans crop) ─────────────────
const sizes = [
  { name: "favicon-16.png",       size: 16  },
  { name: "favicon-32.png",       size: 32  },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png",         size: 192 },
  { name: "icon-512.png",         size: 512 },
];

for (const { name, size } of sizes) {
  await sharp(SRC)
    .resize(size, size, { fit: "fill" })   // pas de letterbox, pas de crop
    .png()
    .toFile(`${DEST}/${name}`);
  console.log(`  ✅  ${name.padEnd(24)} ${size}×${size} px`);
}

// ── 3. logo-square = copie directe (déjà carré) ──────────────────────────────
await sharp(SRC).png().toFile(`${DEST}/logo-square.png`);
console.log(`  📦  logo-square.png (${W}×${H} px, copie directe)`);

console.log("\n✨ Icônes générées — resize direct depuis logo.png.");
