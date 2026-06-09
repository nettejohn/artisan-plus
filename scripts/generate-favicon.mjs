import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public");

// SVG du favicon Artisan+ — A+ en chemin (pas de font externe, rendu parfait partout)
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#0a1628"/>
  <circle cx="256" cy="256" r="230" fill="#111e35"/>
  <!-- "A" stylisé -->
  <path d="M 155 370 L 256 130 L 357 370 L 320 370 L 295 305 L 217 305 L 192 370 Z
           M 230 270 L 282 270 L 256 195 Z"
        fill="#FF8C00"/>
  <!-- "+" -->
  <rect x="335" y="185" width="42" height="100" rx="8" fill="white"/>
  <rect x="297" y="223" width="118" height="42" rx="8" fill="white"/>
</svg>`;

async function generate() {
  const svgBuf = Buffer.from(SVG);

  // ── PNG 16×16 ──────────────────────────────────────────────────
  const png16 = await sharp(svgBuf)
    .resize(16, 16)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(PUBLIC, "favicon-16.png"), png16);
  console.log("✅ favicon-16.png");

  // ── PNG 32×32 ──────────────────────────────────────────────────
  const png32 = await sharp(svgBuf)
    .resize(32, 32)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(PUBLIC, "favicon-32.png"), png32);
  console.log("✅ favicon-32.png");

  // ── PNG 48×48 (pour ICO) ───────────────────────────────────────
  const png48 = await sharp(svgBuf)
    .resize(48, 48)
    .png({ compressionLevel: 9 })
    .toBuffer();
  console.log("✅ png48 (buffer pour ico)");

  // ── Apple Touch Icon 180×180 ───────────────────────────────────
  const png180 = await sharp(svgBuf)
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(PUBLIC, "apple-touch-icon.png"), png180);
  console.log("✅ apple-touch-icon.png");

  // ── PWA icons ─────────────────────────────────────────────────
  const png192 = await sharp(svgBuf)
    .resize(192, 192)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(PUBLIC, "icon-192.png"), png192);
  console.log("✅ icon-192.png");

  const png512 = await sharp(svgBuf)
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(PUBLIC, "icon-512.png"), png512);
  console.log("✅ icon-512.png");

  // ── favicon.ico (16 + 32 + 48 embedés en PNG dans le conteneur ICO) ──
  const ico = buildIco([png16, png32, png48]);
  fs.writeFileSync(path.join(PUBLIC, "favicon.ico"), ico);
  console.log("✅ favicon.ico (" + ico.length + " bytes)");

  // ── Mise à jour du favicon.svg ────────────────────────────────
  fs.writeFileSync(path.join(PUBLIC, "favicon.svg"), SVG);
  console.log("✅ favicon.svg");

  console.log("\n🎉 Tous les favicons générés avec succès !");
}

/**
 * Construit un fichier ICO multi-tailles avec des images PNG embarquées.
 * Format : ICONDIR + N×ICONDIRENTRY + N×PNG data
 */
function buildIco(pngBuffers) {
  const n = pngBuffers.length;
  const headerSize = 6;
  const entrySize  = 16;
  const directorySize = headerSize + n * entrySize;

  // Calcul des offsets
  let offset = directorySize;
  const offsets = pngBuffers.map(buf => {
    const o = offset;
    offset += buf.length;
    return o;
  });

  const total = offset;
  const ico = Buffer.alloc(total);

  // ICONDIR header
  ico.writeUInt16LE(0, 0);  // reserved
  ico.writeUInt16LE(1, 2);  // type = 1 (ICO)
  ico.writeUInt16LE(n, 4);  // count

  // ICONDIRENTRY pour chaque PNG
  pngBuffers.forEach((buf, i) => {
    const base = headerSize + i * entrySize;
    // Lire les dimensions depuis l'IHDR PNG (bytes 16-23)
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    ico.writeUInt8(w >= 256 ? 0 : w, base + 0);   // width (0 = 256)
    ico.writeUInt8(h >= 256 ? 0 : h, base + 1);   // height (0 = 256)
    ico.writeUInt8(0, base + 2);                   // color count
    ico.writeUInt8(0, base + 3);                   // reserved
    ico.writeUInt16LE(1, base + 4);                // planes
    ico.writeUInt16LE(32, base + 6);               // bit count
    ico.writeUInt32LE(buf.length, base + 8);       // size of image
    ico.writeUInt32LE(offsets[i], base + 12);      // offset
  });

  // Données PNG
  pngBuffers.forEach((buf, i) => {
    buf.copy(ico, offsets[i]);
  });

  return ico;
}

generate().catch(err => { console.error("❌ Erreur :", err); process.exit(1); });
