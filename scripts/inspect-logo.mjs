import sharp from "sharp";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, "../public/logo.png");

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width: W, height: H, channels: C } = info;
console.log(`Dimensions : ${W} × ${H}, channels : ${C}`);

function px(x, y) {
  const i = (y * W + x) * C;
  return { r: data[i], g: data[i+1], b: data[i+2], a: data[i+3] };
}

console.log("Coin haut-gauche  (0,0)     :", px(0, 0));
console.log("Coin haut-gauche  (2,2)     :", px(2, 2));
console.log("Coin haut-droit   (W-1,0)   :", px(W-1, 0));
console.log("Coin bas-gauche   (0,H-1)   :", px(0, H-1));
console.log("Centre bord haut  (W/2,0)   :", px(W>>1, 0));
console.log("Centre bord gauche(0,H/2)   :", px(0, H>>1));
console.log("Centre image      (W/2,H/2) :", px(W>>1, H>>1));

// Scan diagonal depuis le coin haut-gauche : trouver où l'image "commence vraiment"
const cornerPx = px(0, 0);
const isCorner = (p) => {
  if (cornerPx.a < 10) return p.a < 10; // coin transparent
  return (
    Math.abs(p.r - cornerPx.r) < 20 &&
    Math.abs(p.g - cornerPx.g) < 20 &&
    Math.abs(p.b - cornerPx.b) < 20
  );
};

let diagStep = 0;
for (let d = 0; d < Math.min(W, H) / 3; d++) {
  const p = px(d, d);
  if (!isCorner(p)) { diagStep = d; break; }
}
console.log(`\nPremier pixel non-coin sur diagonale : d=${diagStep}`);
console.log(`Corner radius estimé : ${diagStep} px (${(diagStep/W*100).toFixed(1)}% de la largeur)`);
console.log(`Marge de rognage suggérée : ${Math.round(diagStep * 0.7)} px par côté`);
