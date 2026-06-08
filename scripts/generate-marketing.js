import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../public/marketing");
mkdirSync(OUT, { recursive: true });

const P  = "#FF8C00"; // orange
const D  = "#0a1628"; // dark
const C  = "#111e35"; // card
const G  = "#8899aa"; // grey
const W  = "white";

async function render(svgStr, filename) {
  const buf = Buffer.from(svgStr);
  await sharp(buf).png({ quality: 100 }).toFile(join(OUT, filename));
  console.log("✓", filename);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pill(x, y, w, h, r, fill, text, textSize = 28, textFill = "white") {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>
  <text x="${x + w / 2}" y="${y + h / 2 + textSize * 0.36}" font-family="Arial,sans-serif" font-size="${textSize}" font-weight="900" fill="${textFill}" text-anchor="middle">${text}</text>`;
}

function check(x, y, label, size = 36, color = P) {
  return `<circle cx="${x + 18}" cy="${y + 3}" r="18" fill="${color}" fill-opacity="0.18" stroke="${color}" stroke-width="1.5"/>
  <text x="${x + 18}" y="${y + 11}" font-family="Arial,sans-serif" font-size="20" fill="${color}" font-weight="900" text-anchor="middle">&#x2713;</text>
  <text x="${x + 46}" y="${y + 12}" font-family="Arial,sans-serif" font-size="${size}" fill="${W}" font-weight="600">${label}</text>`;
}

function cross(x, y) {
  return `<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="32" fill="#ff6b6b" font-weight="900" text-anchor="middle">&#x2715;</text>`;
}

function featureCard(x, y, w, h, icon, title, desc, color = P) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="${C}" stroke="${color}" stroke-width="1.5" stroke-opacity="0.25"/>
  <text x="${x + 28}" y="${y + 52}" font-family="Arial,sans-serif" font-size="38">${icon}</text>
  <text x="${x + 28}" y="${y + 96}" font-family="Arial,sans-serif" font-size="24" font-weight="800" fill="${W}">${title}</text>
  <text x="${x + 28}" y="${y + 126}" font-family="Arial,sans-serif" font-size="18" fill="${G}">${desc}</text>`;
}

function bg(w, h) {
  return `<rect width="${w}" height="${h}" fill="${D}"/>
  <circle cx="${w * 0.88}" cy="${h * 0.1}" r="${h * 0.22}" fill="${P}" fill-opacity="0.05"/>
  <circle cx="${w * 0.12}" cy="${h * 0.88}" r="${h * 0.18}" fill="${P}" fill-opacity="0.04"/>
  <rect x="0" y="0" width="${w}" height="7" fill="${P}"/>`;
}

function logo(x, y, size = 56) {
  return `<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" font-weight="900" fill="${W}">Artisan<tspan fill="${P}">+</tspan></text>`;
}

function domain(cx, y, size = 26) {
  return `<text x="${cx}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" fill="#334" text-anchor="middle">artisan-plus.fr</text>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL 1 — "Devis et factures en 2 minutes — 7,99€/mois"
// ═══════════════════════════════════════════════════════════════════════════════

const v1Square = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
  ${bg(1080, 1080)}
  ${logo(72, 112)}
  ${pill(800, 64, 216, 72, 36, P, "7,99&#x20AC;/mois")}

  <!-- Headline -->
  <text x="72" y="260" font-family="Arial,sans-serif" font-size="96" font-weight="900" fill="${W}">Devis &amp;</text>
  <text x="72" y="365" font-family="Arial,sans-serif" font-size="96" font-weight="900" fill="${W}">factures</text>
  <text x="72" y="470" font-family="Arial,sans-serif" font-size="96" font-weight="900" fill="${P}">en 2 min</text>
  <text x="72" y="540" font-family="Arial,sans-serif" font-size="42" fill="${G}">Chrono. Pro. Partout.</text>

  <!-- Mock facture card -->
  <rect x="72" y="590" width="936" height="390" rx="24" fill="${C}" stroke="${P}" stroke-width="1.5" stroke-opacity="0.3"/>
  <!-- Card header -->
  <rect x="72" y="590" width="936" height="72" rx="24" fill="${P}"/>
  <rect x="72" y="638" width="936" height="24" rx="0" fill="${P}"/>
  <text x="108" y="637" font-family="Arial,sans-serif" font-size="26" font-weight="900" fill="${W}">FACTURE  FAC-2026-089</text>
  <text x="992" y="637" font-family="Arial,sans-serif" font-size="24" font-weight="700" fill="${W}" text-anchor="end">3 600,00 &#x20AC;</text>

  <!-- Rows -->
  <rect x="96" y="684" width="888" height="50" rx="10" fill="${D}" fill-opacity="0.5"/>
  <text x="120" y="715" font-family="Arial,sans-serif" font-size="22" fill="${G}">Renovation salle de bain &#x2014; main d'oeuvre</text>
  <text x="968" y="715" font-family="Arial,sans-serif" font-size="22" fill="${P}" font-weight="700" text-anchor="end">2 400 &#x20AC;</text>

  <rect x="96" y="742" width="888" height="50" rx="10" fill="${D}" fill-opacity="0.3"/>
  <text x="120" y="773" font-family="Arial,sans-serif" font-size="22" fill="${G}">Fournitures et materiaux HT</text>
  <text x="968" y="773" font-family="Arial,sans-serif" font-size="22" fill="${P}" font-weight="700" text-anchor="end">1 200 &#x20AC;</text>

  <line x1="96" y1="806" x2="984" y2="806" stroke="${P}" stroke-width="1" stroke-opacity="0.25"/>
  <text x="120" y="848" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="${W}">Total TTC</text>
  <text x="968" y="852" font-family="Arial,sans-serif" font-size="40" font-weight="900" fill="${P}" text-anchor="end">3 600,00 &#x20AC;</text>

  <!-- Status + button -->
  <rect x="96" y="872" width="160" height="44" rx="22" fill="rgba(76,175,80,0.18)" stroke="rgba(76,175,80,0.5)" stroke-width="1.5"/>
  <text x="176" y="900" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#4CAF50" text-anchor="middle">&#x2713; Payee</text>
  <rect x="830" y="868" width="178" height="44" rx="12" fill="${P}"/>
  <text x="919" y="896" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="${W}" text-anchor="middle">Telecharger PDF</text>

  ${domain(540, 1060)}
</svg>`;

// ─── V1 Story ─────────────────────────────────────────────────────────────────
const v1Story = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">
  ${bg(1080, 1920)}
  ${logo(540 - 120, 190, 64)}

  <text x="540" y="360" font-family="Arial,sans-serif" font-size="112" font-weight="900" fill="${W}" text-anchor="middle">Devis &amp;</text>
  <text x="540" y="485" font-family="Arial,sans-serif" font-size="112" font-weight="900" fill="${W}" text-anchor="middle">factures</text>
  <text x="540" y="622" font-family="Arial,sans-serif" font-size="112" font-weight="900" fill="${P}" text-anchor="middle">en 2 min</text>

  <text x="540" y="702" font-family="Arial,sans-serif" font-size="44" fill="${G}" text-anchor="middle">Chrono. Pro. Partout.</text>

  ${pill(290, 762, 500, 100, 50, P, "7,99&#x20AC; / mois", 44)}

  <!-- Features list -->
  <rect x="80" y="912" width="920" height="660" rx="28" fill="${C}" stroke="${P}" stroke-width="1.5" stroke-opacity="0.3"/>
  <text x="540" y="984" font-family="Arial,sans-serif" font-size="36" font-weight="800" fill="${W}" text-anchor="middle">Tout inclus &#x2014; zero surprise</text>

  ${check(136, 1030, "PDF professionnels", 38)}
  ${check(136, 1105, "Signature electronique", 38)}
  ${check(136, 1180, "Suivi de chantiers", 38)}
  ${check(136, 1255, "Mini-site vitrine", 38)}
  ${check(136, 1330, "Paiement en ligne client", 38)}
  ${check(136, 1405, "Devis vocal par IA", 38)}
  ${check(136, 1480, "Assistant comptable IA", 38)}

  <!-- CTA -->
  <rect x="120" y="1640" width="840" height="110" rx="55" fill="${P}"/>
  <text x="540" y="1707" font-family="Arial,sans-serif" font-size="44" font-weight="900" fill="${W}" text-anchor="middle">Essayer gratuitement</text>

  ${domain(540, 1820, 40)}
  <text x="540" y="1880" font-family="Arial,sans-serif" font-size="28" fill="#334" text-anchor="middle">Sans engagement &#x2014; resiliable a tout moment</text>
</svg>`;

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL 2 — Comparatif prix
// ═══════════════════════════════════════════════════════════════════════════════

const v2Square = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
  ${bg(1080, 1080)}
  ${logo(72, 112)}

  <text x="540" y="188" font-family="Arial,sans-serif" font-size="52" font-weight="900" fill="${W}" text-anchor="middle">Pourquoi choisir Artisan+ ?</text>

  <!-- Table header -->
  <rect x="40" y="220" width="1000" height="80" rx="16" fill="${C}"/>
  <text x="300" y="269" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="${G}" text-anchor="middle">Fonctionnalite</text>

  <!-- Col headers -->
  <rect x="600" y="220" width="140" height="80" rx="0" fill="${P}" fill-opacity="0.15"/>
  <rect x="600" y="220" width="140" height="80" rx="16" fill="${P}" fill-opacity="0.15"/>
  <text x="670" y="256" font-family="Arial,sans-serif" font-size="26" font-weight="900" fill="${P}" text-anchor="middle">Artisan+</text>
  <text x="670" y="286" font-family="Arial,sans-serif" font-size="32" font-weight="900" fill="${P}" text-anchor="middle">7,99&#x20AC;</text>

  <text x="820" y="256" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="${G}" text-anchor="middle">Tolteck</text>
  <text x="820" y="286" font-family="Arial,sans-serif" font-size="32" font-weight="900" fill="${G}" text-anchor="middle">19&#x20AC;</text>

  <text x="980" y="256" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="${G}" text-anchor="middle">Obat</text>
  <text x="980" y="286" font-family="Arial,sans-serif" font-size="32" font-weight="900" fill="${G}" text-anchor="middle">39&#x20AC;</text>

  <!-- Col highlight -->
  <rect x="600" y="220" width="140" height="820" rx="0" fill="${P}" fill-opacity="0.08"/>
  <rect x="596" y="216" width="148" height="828" rx="16" fill="none" stroke="${P}" stroke-width="2.5"/>

  <!-- Rows -->
  ${[
    ["Devis illimites",         true,  true,  true ],
    ["Factures illimitees",     true,  true,  true ],
    ["Clients illimites",       true,  false, true ],
    ["Signature electronique",  true,  false, false],
    ["Suivi chantiers",         true,  true,  true ],
    ["IA integree (vocal, scan)",true, false, false],
    ["Mini-site vitrine",       true,  false, false],
    ["Paiement en ligne",       true,  false, true ],
    ["Assistant comptable IA",  true,  false, false],
    ["Badge Artisan Verifie",   true,  false, false],
  ].map(([label, a, t, o], i) => {
    const y = 320 + i * 68;
    const bg2 = i % 2 === 0 ? `<rect x="40" y="${y - 20}" width="1000" height="68" fill="${C}" fill-opacity="0.3"/>` : "";
    return `${bg2}
    <text x="100" y="${y + 24}" font-family="Arial,sans-serif" font-size="26" fill="${W}">${label}</text>
    <text x="670" y="${y + 28}" font-family="Arial,sans-serif" font-size="30" fill="${a ? "#4CAF50" : "#ff6b6b"}" text-anchor="middle" font-weight="900">${a ? "&#x2713;" : "&#x2715;"}</text>
    <text x="820" y="${y + 28}" font-family="Arial,sans-serif" font-size="30" fill="${t ? "#4CAF50" : "#ff6b6b"}" text-anchor="middle" font-weight="900">${t ? "&#x2713;" : "&#x2715;"}</text>
    <text x="980" y="${y + 28}" font-family="Arial,sans-serif" font-size="30" fill="${o ? "#4CAF50" : "#ff6b6b"}" text-anchor="middle" font-weight="900">${o ? "&#x2713;" : "&#x2715;"}</text>`;
  }).join("\n")}

  <!-- Best value badge -->
  <rect x="600" y="218" width="140" height="30" rx="10" fill="${P}"/>
  <text x="670" y="238" font-family="Arial,sans-serif" font-size="16" font-weight="900" fill="${W}" text-anchor="middle">MEILLEUR CHOIX</text>

  ${domain(540, 1060)}
</svg>`;

// ─── V2 Story ─────────────────────────────────────────────────────────────────
const v2Story = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">
  ${bg(1080, 1920)}
  ${logo(540 - 120, 180, 64)}

  <text x="540" y="310" font-family="Arial,sans-serif" font-size="60" font-weight="900" fill="${W}" text-anchor="middle">Le logiciel artisan</text>
  <text x="540" y="390" font-family="Arial,sans-serif" font-size="60" font-weight="900" fill="${P}" text-anchor="middle">le moins cher</text>

  <!-- 3 price cards -->
  <!-- Artisan+ -->
  <rect x="60" y="440" width="300" height="340" rx="24" fill="${P}" fill-opacity="0.15" stroke="${P}" stroke-width="2.5"/>
  <rect x="60" y="440" width="300" height="50" rx="12" fill="${P}"/>
  <text x="210" y="474" font-family="Arial,sans-serif" font-size="20" font-weight="900" fill="${W}" text-anchor="middle">MEILLEUR CHOIX</text>
  <text x="210" y="568" font-family="Arial,sans-serif" font-size="44" font-weight="900" fill="${P}" text-anchor="middle">Artisan+</text>
  <text x="210" y="640" font-family="Arial,sans-serif" font-size="72" font-weight="900" fill="${W}" text-anchor="middle">7,99&#x20AC;</text>
  <text x="210" y="690" font-family="Arial,sans-serif" font-size="28" fill="${G}" text-anchor="middle">par mois</text>
  <text x="210" y="740" font-family="Arial,sans-serif" font-size="24" fill="#4CAF50" text-anchor="middle">TOUT inclus</text>

  <!-- Tolteck -->
  <rect x="390" y="440" width="300" height="340" rx="24" fill="${C}" stroke="${G}" stroke-width="1" stroke-opacity="0.3"/>
  <text x="540" y="568" font-family="Arial,sans-serif" font-size="44" font-weight="900" fill="${G}" text-anchor="middle">Tolteck</text>
  <text x="540" y="640" font-family="Arial,sans-serif" font-size="72" font-weight="900" fill="${G}" text-anchor="middle">19&#x20AC;</text>
  <text x="540" y="690" font-family="Arial,sans-serif" font-size="28" fill="${G}" text-anchor="middle">par mois</text>
  <text x="540" y="740" font-family="Arial,sans-serif" font-size="24" fill="#ff6b6b" text-anchor="middle">Fonctions limitees</text>

  <!-- Obat -->
  <rect x="720" y="440" width="300" height="340" rx="24" fill="${C}" stroke="${G}" stroke-width="1" stroke-opacity="0.3"/>
  <text x="870" y="568" font-family="Arial,sans-serif" font-size="44" font-weight="900" fill="${G}" text-anchor="middle">Obat</text>
  <text x="870" y="640" font-family="Arial,sans-serif" font-size="72" font-weight="900" fill="${G}" text-anchor="middle">39&#x20AC;</text>
  <text x="870" y="690" font-family="Arial,sans-serif" font-size="28" fill="${G}" text-anchor="middle">par mois</text>
  <text x="870" y="740" font-family="Arial,sans-serif" font-size="24" fill="#ff6b6b" text-anchor="middle">5x plus cher</text>

  <!-- Economy callout -->
  <rect x="160" y="830" width="760" height="100" rx="20" fill="rgba(76,175,80,0.12)" stroke="rgba(76,175,80,0.4)" stroke-width="1.5"/>
  <text x="540" y="883" font-family="Arial,sans-serif" font-size="36" font-weight="900" fill="#4CAF50" text-anchor="middle">Economisez jusqu'a 372&#x20AC;/an</text>
  <text x="540" y="918" font-family="Arial,sans-serif" font-size="26" fill="${G}" text-anchor="middle">vs Obat &#x2014; pour les memes fonctionnalites</text>

  <!-- Comparison table -->
  <rect x="60" y="980" width="960" height="680" rx="24" fill="${C}" stroke="${P}" stroke-width="1.5" stroke-opacity="0.2"/>
  <text x="540" y="1042" font-family="Arial,sans-serif" font-size="34" font-weight="800" fill="${W}" text-anchor="middle">Fonctionnalites comparees</text>

  ${[
    ["Devis + Factures illimites",    true, true,  true ],
    ["Signature electronique",        true, false, false],
    ["IA : devis vocal, scan",        true, false, false],
    ["Mini-site vitrine gratuit",     true, false, false],
    ["Paiement en ligne client",      true, false, true ],
    ["Assistant comptable IA",        true, false, false],
    ["Badge Artisan Verifie",         true, false, false],
  ].map(([label, a, t, o], i) => {
    const y = 1085 + i * 78;
    return `
    <text x="100" y="${y}" font-family="Arial,sans-serif" font-size="28" fill="${W}">${label}</text>
    <text x="780" y="${y + 4}" font-family="Arial,sans-serif" font-size="34" fill="${a ? "#4CAF50" : "#ff6b6b"}" text-anchor="middle" font-weight="900">${a ? "&#x2713;" : "&#x2715;"}</text>
    <text x="880" y="${y + 4}" font-family="Arial,sans-serif" font-size="34" fill="${t ? "#4CAF50" : "#ff6b6b"}" text-anchor="middle" font-weight="900">${t ? "&#x2713;" : "&#x2715;"}</text>
    <text x="980" y="${y + 4}" font-family="Arial,sans-serif" font-size="34" fill="${o ? "#4CAF50" : "#ff6b6b"}" text-anchor="middle" font-weight="900">${o ? "&#x2713;" : "&#x2715;"}</text>`;
  }).join("\n")}

  <!-- CTA -->
  <rect x="120" y="1720" width="840" height="110" rx="55" fill="${P}"/>
  <text x="540" y="1787" font-family="Arial,sans-serif" font-size="44" font-weight="900" fill="${W}" text-anchor="middle">Essayer gratuitement</text>

  ${domain(540, 1880, 40)}
</svg>`;

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL 3 — Fonctionnalités clés
// ═══════════════════════════════════════════════════════════════════════════════

const features = [
  ["&#x1F4DD;", "Devis pro",       "Cree en 2 min",        "#6495ED"],
  ["&#x1F4C4;", "Factures PDF",    "5 themes visuels",     "#4CAF50"],
  ["&#x270D;",  "Signature",       "Electronique legale",  "#9C27B0"],
  ["&#x1F4E6;", "Catalogue",       "Tarifs en 1 clic",     "#FF9800"],
  ["&#x1F465;", "Clients",         "Fiches completes",     "#00BCD4"],
  ["&#x1F3D7;", "Chantiers",       "Rentabilite live",     "#E91E63"],
  ["&#x1F4C5;", "Agenda",          "Planning semaine",     "#7C4DFF"],
  ["&#x1F324;", "Meteo",           "Sur chaque chantier",  "#2196F3"],
  ["&#x1F3A4;", "Devis vocal IA",  "Dictez, l'IA ecrit",  "#FF5722"],
  ["&#x1F4F8;", "Scan IA",         "Photo = donnees",      "#009688"],
  ["&#x1F4B6;", "Comptable IA",    "TVA, URSSAF auto",     "#FFC107"],
  ["&#x1F310;", "Mini-site",       "Vitrine gratuite",     "#E91E63"],
];

const cw = 235, ch = 145, gx = 16, gy = 14;
const cols = 4, startX = 52, startY = 260;

const v3Square = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
  ${bg(1080, 1080)}
  ${logo(72, 112)}
  ${pill(750, 64, 260, 68, 34, P, "7,99&#x20AC;/mois", 26)}

  <text x="540" y="210" font-family="Arial,sans-serif" font-size="44" font-weight="900" fill="${W}" text-anchor="middle">Toutes les fonctionnalites incluses</text>

  ${features.map(([icon, title, desc, color], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cw + gx);
    const y = startY + row * (ch + gy);
    return `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="18" fill="${C}" stroke="${color}" stroke-width="1.5" stroke-opacity="0.3"/>
    <text x="${x + 20}" y="${y + 46}" font-family="Arial,sans-serif" font-size="34">${icon}</text>
    <text x="${x + 20}" y="${y + 82}" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="${W}">${title}</text>
    <text x="${x + 20}" y="${y + 110}" font-family="Arial,sans-serif" font-size="17" fill="${G}">${desc}</text>
    <rect x="${x + 20}" y="${y + ch - 16}" width="60" height="4" rx="2" fill="${color}" fill-opacity="0.6"/>`;
  }).join("\n")}

  ${domain(540, 1060)}
</svg>`;

// ─── V3 Story ─────────────────────────────────────────────────────────────────
const feats2col = [
  ["&#x1F4DD;", "Devis pro",          "Cree en 2 minutes",        "#6495ED"],
  ["&#x1F4C4;", "Factures PDF",        "5 themes professionnels",  "#4CAF50"],
  ["&#x270D;",  "Signature electr.",   "Legale, horodatee",        "#9C27B0"],
  ["&#x1F4E6;", "Catalogue prix",      "Insecion en 1 clic",       "#FF9800"],
  ["&#x1F465;", "Clients",            "Fiches + historique",       "#00BCD4"],
  ["&#x1F3D7;", "Chantiers",          "Rentabilite en temps reel", "#E91E63"],
  ["&#x1F4C5;", "Agenda",             "Planning de semaine",       "#7C4DFF"],
  ["&#x1F3A4;", "Devis vocal IA",     "Dictez, l'IA redige",       "#FF5722"],
  ["&#x1F4F8;", "Scan factures IA",   "Photo = donnees extraites", "#009688"],
  ["&#x1F4B6;", "Comptable IA",       "TVA, URSSAF, tresorerie",  "#FFC107"],
  ["&#x1F310;", "Mini-site vitrine",  "Votre site pro gratuit",    "#E91E63"],
  ["&#x2705;",  "Badge Verifie",      "Confiance clients",         "#4CAF50"],
];

const s_cols = 2, s_cw = 440, s_ch = 120, s_gx = 20, s_gy = 14;
const s_startX = 60, s_startY = 440;

const v3Story = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">
  ${bg(1080, 1920)}
  ${logo(540 - 120, 180, 64)}

  <text x="540" y="302" font-family="Arial,sans-serif" font-size="58" font-weight="900" fill="${W}" text-anchor="middle">12 fonctionnalites</text>
  <text x="540" y="375" font-family="Arial,sans-serif" font-size="58" font-weight="900" fill="${P}" text-anchor="middle">dans une seule app</text>

  ${pill(290, 398, 500, 86, 43, P, "Tout pour 7,99&#x20AC;/mois", 34)}

  ${feats2col.map(([icon, title, desc, color], i) => {
    const col = i % s_cols;
    const row = Math.floor(i / s_cols);
    const x = s_startX + col * (s_cw + s_gx);
    const y = s_startY + row * (s_ch + s_gy);
    return `<rect x="${x}" y="${y}" width="${s_cw}" height="${s_ch}" rx="18" fill="${C}" stroke="${color}" stroke-width="1.5" stroke-opacity="0.3"/>
    <text x="${x + 18}" y="${y + 50}" font-family="Arial,sans-serif" font-size="32">${icon}</text>
    <text x="${x + 18}" y="${y + 84}" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="${W}">${title}</text>
    <text x="${x + 18}" y="${y + 110}" font-family="Arial,sans-serif" font-size="17" fill="${G}">${desc}</text>`;
  }).join("\n")}

  <!-- CTA -->
  <rect x="120" y="1778" width="840" height="100" rx="50" fill="${P}"/>
  <text x="540" y="1840" font-family="Arial,sans-serif" font-size="40" font-weight="900" fill="${W}" text-anchor="middle">Essayer gratuitement</text>

  ${domain(540, 1890, 36)}
</svg>`;

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL 4 — Nouvelle loi 2026 — Artisan+ est prêt !
// ═══════════════════════════════════════════════════════════════════════════════

const v4Square = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
  ${bg(1080, 1080)}

  <!-- Urgency accent -->
  <rect x="0" y="0" width="1080" height="7" fill="#ff6b6b"/>
  <rect x="0" y="1073" width="1080" height="7" fill="${P}"/>

  <!-- Alert icon area -->
  <circle cx="540" cy="200" r="110" fill="rgba(255,107,107,0.1)" stroke="rgba(255,107,107,0.4)" stroke-width="2"/>
  <circle cx="540" cy="200" r="80" fill="rgba(255,107,107,0.15)"/>
  <text x="540" y="220" font-family="Arial,sans-serif" font-size="72" font-weight="900" fill="#ff6b6b" text-anchor="middle">!</text>
  <text x="540" y="256" font-family="Arial,sans-serif" font-size="18" fill="#ff6b6b" text-anchor="middle" font-weight="700">IMPORTANT</text>

  <!-- Law badge -->
  <rect x="330" y="340" width="420" height="58" rx="29" fill="rgba(255,107,107,0.15)" stroke="#ff6b6b" stroke-width="1.5"/>
  <text x="540" y="378" font-family="Arial,sans-serif" font-size="26" font-weight="800" fill="#ff6b6b" text-anchor="middle">Loi obligatoire en France</text>

  <!-- Main title -->
  <text x="540" y="470" font-family="Arial,sans-serif" font-size="72" font-weight="900" fill="${W}" text-anchor="middle">Facturation</text>
  <text x="540" y="555" font-family="Arial,sans-serif" font-size="72" font-weight="900" fill="${W}" text-anchor="middle">electronique</text>
  <text x="540" y="648" font-family="Arial,sans-serif" font-size="100" font-weight="900" fill="${P}" text-anchor="middle">2026</text>

  <!-- Info boxes -->
  <rect x="52" y="700" width="460" height="120" rx="20" fill="rgba(255,107,107,0.1)" stroke="rgba(255,107,107,0.3)" stroke-width="1.5"/>
  <text x="282" y="748" font-family="Arial,sans-serif" font-size="20" font-weight="800" fill="#ff6b6b" text-anchor="middle">Reception obligatoire</text>
  <text x="282" y="782" font-family="Arial,sans-serif" font-size="28" font-weight="900" fill="${W}" text-anchor="middle">Sep. 2026</text>
  <text x="282" y="810" font-family="Arial,sans-serif" font-size="16" fill="${G}" text-anchor="middle">pour toutes les entreprises</text>

  <rect x="568" y="700" width="460" height="120" rx="20" fill="rgba(255,107,107,0.1)" stroke="rgba(255,107,107,0.3)" stroke-width="1.5"/>
  <text x="798" y="748" font-family="Arial,sans-serif" font-size="20" font-weight="800" fill="#ff6b6b" text-anchor="middle">Emission obligatoire</text>
  <text x="798" y="782" font-family="Arial,sans-serif" font-size="28" font-weight="900" fill="${W}" text-anchor="middle">Sep. 2027</text>
  <text x="798" y="810" font-family="Arial,sans-serif" font-size="16" fill="${G}" text-anchor="middle">TPE, artisans, auto-entrepreneurs</text>

  <!-- Ready badge -->
  <rect x="140" y="864" width="800" height="120" rx="24" fill="rgba(76,175,80,0.12)" stroke="rgba(76,175,80,0.5)" stroke-width="2"/>
  <text x="540" y="920" font-family="Arial,sans-serif" font-size="36" font-weight="900" fill="#4CAF50" text-anchor="middle">&#x2713; Artisan+ est pret !</text>
  <text x="540" y="964" font-family="Arial,sans-serif" font-size="24" fill="${G}" text-anchor="middle">Format Factur-X (XML EN 16931) deja integre</text>

  ${logo(72, 1052, 44)}
  ${domain(700, 1058, 24)}
</svg>`;

// ─── V4 Story ─────────────────────────────────────────────────────────────────
const v4Story = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">
  ${bg(1080, 1920)}
  <rect x="0" y="0" width="1080" height="10" fill="#ff6b6b"/>

  <!-- Alert circle -->
  <circle cx="540" cy="260" r="140" fill="rgba(255,107,107,0.1)" stroke="rgba(255,107,107,0.4)" stroke-width="2.5"/>
  <text x="540" y="300" font-family="Arial,sans-serif" font-size="96" font-weight="900" fill="#ff6b6b" text-anchor="middle">!</text>

  <!-- Law alert -->
  <rect x="200" y="440" width="680" height="70" rx="35" fill="rgba(255,107,107,0.15)" stroke="#ff6b6b" stroke-width="1.5"/>
  <text x="540" y="484" font-family="Arial,sans-serif" font-size="30" font-weight="800" fill="#ff6b6b" text-anchor="middle">Nouvelle loi obligatoire</text>

  <!-- Main title -->
  <text x="540" y="610" font-family="Arial,sans-serif" font-size="88" font-weight="900" fill="${W}" text-anchor="middle">Facturation</text>
  <text x="540" y="710" font-family="Arial,sans-serif" font-size="88" font-weight="900" fill="${W}" text-anchor="middle">electronique</text>
  <text x="540" y="840" font-family="Arial,sans-serif" font-size="140" font-weight="900" fill="${P}" text-anchor="middle">2026</text>

  <!-- Explanation -->
  <rect x="60" y="890" width="960" height="200" rx="24" fill="${C}" stroke="${P}" stroke-width="1.5" stroke-opacity="0.3"/>
  <text x="540" y="948" font-family="Arial,sans-serif" font-size="28" fill="${G}" text-anchor="middle">A partir de septembre 2026, vous devez</text>
  <text x="540" y="988" font-family="Arial,sans-serif" font-size="28" fill="${G}" text-anchor="middle">pouvoir recevoir des factures electroniques.</text>
  <text x="540" y="1028" font-family="Arial,sans-serif" font-size="28" fill="${G}" text-anchor="middle">A partir de 2027, vous devez aussi en emettre.</text>
  <text x="540" y="1070" font-family="Arial,sans-serif" font-size="32" font-weight="800" fill="#ff6b6b" text-anchor="middle">Amende pouvant atteindre 15 000&#x20AC;</text>

  <!-- Timeline -->
  <rect x="60" y="1130" width="960" height="260" rx="24" fill="${C}" stroke="${P}" stroke-width="1.5" stroke-opacity="0.2"/>
  <text x="540" y="1186" font-family="Arial,sans-serif" font-size="32" font-weight="800" fill="${W}" text-anchor="middle">Calendrier de mise en conformite</text>
  <line x1="160" y1="1250" x2="920" y2="1250" stroke="${P}" stroke-width="2" stroke-opacity="0.3"/>
  <circle cx="270" cy="1250" r="20" fill="#ff6b6b"/>
  <text x="270" y="1303" font-family="Arial,sans-serif" font-size="24" fill="#ff6b6b" text-anchor="middle" font-weight="800">Sep. 2026</text>
  <text x="270" y="1335" font-family="Arial,sans-serif" font-size="20" fill="${G}" text-anchor="middle">Reception</text>
  <circle cx="540" cy="1250" r="20" fill="#FFC107"/>
  <text x="540" y="1303" font-family="Arial,sans-serif" font-size="24" fill="#FFC107" text-anchor="middle" font-weight="800">Jan. 2027</text>
  <text x="540" y="1335" font-family="Arial,sans-serif" font-size="20" fill="${G}" text-anchor="middle">Grandes PME</text>
  <circle cx="810" cy="1250" r="20" fill="${P}"/>
  <text x="810" y="1303" font-family="Arial,sans-serif" font-size="24" fill="${P}" text-anchor="middle" font-weight="800">Sep. 2027</text>
  <text x="810" y="1335" font-family="Arial,sans-serif" font-size="20" fill="${G}" text-anchor="middle">TPE/Artisans</text>

  <!-- Ready badge -->
  <rect x="60" y="1440" width="960" height="180" rx="24" fill="rgba(76,175,80,0.12)" stroke="rgba(76,175,80,0.5)" stroke-width="2.5"/>
  <text x="540" y="1510" font-family="Arial,sans-serif" font-size="44" font-weight="900" fill="#4CAF50" text-anchor="middle">&#x2713; Artisan+ est pret !</text>
  <text x="540" y="1560" font-family="Arial,sans-serif" font-size="28" fill="${G}" text-anchor="middle">Format Factur-X (XML EN 16931)</text>
  <text x="540" y="1598" font-family="Arial,sans-serif" font-size="28" fill="${G}" text-anchor="middle">deja integre dans l'application</text>

  <!-- CTA -->
  <rect x="120" y="1682" width="840" height="110" rx="55" fill="${P}"/>
  <text x="540" y="1749" font-family="Arial,sans-serif" font-size="44" font-weight="900" fill="${W}" text-anchor="middle">Mise en conformite gratuite</text>

  ${logo(540 - 120, 1862, 48)}
</svg>`;

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATE ALL
// ═══════════════════════════════════════════════════════════════════════════════

const visuals = [
  [v1Square, "1-devis-factures-carre.png"],
  [v1Story,  "1-devis-factures-story.png"],
  [v2Square, "2-comparatif-prix-carre.png"],
  [v2Story,  "2-comparatif-prix-story.png"],
  [v3Square, "3-fonctionnalites-carre.png"],
  [v3Story,  "3-fonctionnalites-story.png"],
  [v4Square, "4-loi-2026-carre.png"],
  [v4Story,  "4-loi-2026-story.png"],
];

console.log("Generating marketing visuals...\n");
for (const [svg, name] of visuals) {
  await render(svg, name);
}
console.log(`\nDone — ${visuals.length} visuals in public/marketing/`);
