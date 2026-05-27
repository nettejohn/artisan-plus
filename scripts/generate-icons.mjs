/**
 * Génère toutes les icônes PWA depuis public/logo.png
 * node scripts/generate-icons.mjs
 */

import sharp from "sharp";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC  = resolve(__dirname, "../public/logo.png");
const DEST = resolve(__dirname, "../public");

const sizes = [
  { name: "favicon-16.png",       size: 16  },
  { name: "favicon-32.png",       size: 32  },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png",         size: 192 },
  { name: "icon-512.png",         size: 512 },
];

for (const { name, size } of sizes) {
  await sharp(SRC)
    .resize(size, size, { fit: "contain", background: { r: 10, g: 22, b: 40, alpha: 1 } })
    .png()
    .toFile(`${DEST}/${name}`);
  console.log(`✅ ${name} (${size}×${size})`);
}

console.log("\n✨ Toutes les icônes générées !");
