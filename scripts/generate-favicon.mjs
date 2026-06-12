import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public");
const SOURCE = path.join(PUBLIC, "logo-square.png");

async function generate() {
  if (!fs.existsSync(SOURCE)) {
    console.error("❌ logo-square.png introuvable dans public/");
    process.exit(1);
  }

  const src = fs.readFileSync(SOURCE);

  const png16 = await sharp(src).resize(16, 16).png({ compressionLevel: 9 }).toBuffer();
  fs.writeFileSync(path.join(PUBLIC, "favicon-16.png"), png16);
  console.log("✅ favicon-16.png");

  const png32 = await sharp(src).resize(32, 32).png({ compressionLevel: 9 }).toBuffer();
  fs.writeFileSync(path.join(PUBLIC, "favicon-32.png"), png32);
  console.log("✅ favicon-32.png");

  const png48 = await sharp(src).resize(48, 48).png({ compressionLevel: 9 }).toBuffer();
  console.log("✅ png48 (buffer pour ico)");

  const png180 = await sharp(src).resize(180, 180).png({ compressionLevel: 9 }).toBuffer();
  fs.writeFileSync(path.join(PUBLIC, "apple-touch-icon.png"), png180);
  console.log("✅ apple-touch-icon.png");

  const png192 = await sharp(src).resize(192, 192).png({ compressionLevel: 9 }).toBuffer();
  fs.writeFileSync(path.join(PUBLIC, "icon-192.png"), png192);
  console.log("✅ icon-192.png");

  const png512 = await sharp(src).resize(512, 512).png({ compressionLevel: 9 }).toBuffer();
  fs.writeFileSync(path.join(PUBLIC, "icon-512.png"), png512);
  console.log("✅ icon-512.png");

  const ico = buildIco([png16, png32, png48]);
  fs.writeFileSync(path.join(PUBLIC, "favicon.ico"), ico);
  console.log("✅ favicon.ico (" + ico.length + " bytes)");

  // favicon.svg : wrapper SVG avec le logo encodé en base64 (64px suffit pour un favicon)
  const png64 = await sharp(src).resize(64, 64).png({ compressionLevel: 6 }).toBuffer();
  const b64 = png64.toString("base64");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64">
  <image width="64" height="64" xlink:href="data:image/png;base64,${b64}"/>
</svg>`;
  fs.writeFileSync(path.join(PUBLIC, "favicon.svg"), svg);
  console.log("✅ favicon.svg");

  console.log("\n🎉 Tous les favicons générés depuis logo-square.png !");
}

function buildIco(pngBuffers) {
  const n = pngBuffers.length;
  const headerSize = 6;
  const entrySize = 16;
  const directorySize = headerSize + n * entrySize;

  let offset = directorySize;
  const offsets = pngBuffers.map(buf => {
    const o = offset;
    offset += buf.length;
    return o;
  });

  const total = offset;
  const ico = Buffer.alloc(total);

  ico.writeUInt16LE(0, 0);
  ico.writeUInt16LE(1, 2);
  ico.writeUInt16LE(n, 4);

  pngBuffers.forEach((buf, i) => {
    const base = headerSize + i * entrySize;
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    ico.writeUInt8(w >= 256 ? 0 : w, base + 0);
    ico.writeUInt8(h >= 256 ? 0 : h, base + 1);
    ico.writeUInt8(0, base + 2);
    ico.writeUInt8(0, base + 3);
    ico.writeUInt16LE(1, base + 4);
    ico.writeUInt16LE(32, base + 6);
    ico.writeUInt32LE(buf.length, base + 8);
    ico.writeUInt32LE(offsets[i], base + 12);
  });

  pngBuffers.forEach((buf, i) => {
    buf.copy(ico, offsets[i]);
  });

  return ico;
}

generate().catch(err => { console.error("❌ Erreur :", err); process.exit(1); });
