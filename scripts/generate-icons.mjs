/**
 * Génère toutes les icônes PWA depuis public/logo.png
 *
 * Problème : le logo a des coins arrondis intégrés (gradient opaque, alpha=255).
 * Solution  : on rogne 220 px sur chaque côté pour passer au-delà de la courbe,
 *             puis on redimensionne aux tailles cibles. iOS/Android appliquent
 *             ensuite leurs propres coins arrondis sur une image carrée plein bord.
 *
 * Usage : node scripts/generate-icons.mjs
 */

import sharp from "sharp";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC  = resolve(__dirname, "../public/logo.png");
const DEST = resolve(__dirname, "../public");

// ── 1. Lire les dimensions réelles ────────────────────────────────────────
const { width: W, height: H } = await sharp(SRC).metadata();
console.log(`Source : ${W}×${H} px`);

// ── 2. Déterminer la marge de rognage ─────────────────────────────────────
//
// On scanne la diagonale haut-gauche pour trouver où le fond des coins
// se distingue visuellement de l'arrondi.
// Pour une image 1254×1254 avec corner-radius ≈ 22 %, on part sur ~220 px
// soit ~17.5 % de chaque côté (cela passe nettement au-delà de la courbe).
//
// Si le logo change, ce pourcentage reste adapté aux proportions standard
// d'icônes app (corner radius 18-24 %).
const MARGIN_RATIO = 0.175;               // 17.5 % sur chaque côté
const MARGIN = Math.round(W * MARGIN_RATIO);
const CROP_SIZE = W - 2 * MARGIN;        // carré rognée

console.log(`Marge de rognage : ${MARGIN} px — crop final : ${CROP_SIZE}×${CROP_SIZE} px`);

// ── 3. Extraire le carré rognée (sans coins arrondis) ─────────────────────
const cropped = sharp(SRC).extract({
  left:   MARGIN,
  top:    MARGIN,
  width:  CROP_SIZE,
  height: CROP_SIZE,
});

// ── 4. Générer toutes les tailles ─────────────────────────────────────────
const sizes = [
  { name: "favicon-16.png",       size: 16  },
  { name: "favicon-32.png",       size: 32  },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png",         size: 192 },
  { name: "icon-512.png",         size: 512 },
];

for (const { name, size } of sizes) {
  await cropped
    .clone()
    .resize(size, size, { fit: "cover" })
    .png()
    .toFile(`${DEST}/${name}`);
  console.log(`  ✅  ${name.padEnd(24)} ${size}×${size} px`);
}

// ── 5. Sauvegarder aussi le carré source (utile pour inspecter) ───────────
await cropped.clone().toFile(`${DEST}/logo-square.png`);
console.log(`  📦  logo-square.png (source rognée, ${CROP_SIZE}×${CROP_SIZE} px)`);

console.log("\n✨ Icônes générées sans coins arrondis — iOS/Android appliquera le masque.");
