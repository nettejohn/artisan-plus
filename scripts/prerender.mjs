/**
 * Artisan+ — Prerender SSG complet
 *
 * Génère du HTML statique pour TOUTES les routes de la Vitrine (~689 pages)
 * afin que Google et les crawlers voient le contenu sans exécuter JavaScript.
 * Génère également public/sitemap.xml.
 *
 * React utilise createRoot (pas hydrateRoot) → le HTML statique est remplacé
 * proprement côté client, sans erreur de hydration mismatch.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const BASE = 'https://www.artisan-plus.fr';

// ── 1. MOCKS NAVIGATEUR ──────────────────────────────────────────────────────

let _mockPathname = '/';

const _mockLocation = {
  get pathname() { return _mockPathname; },
  get href()     { return `${BASE}${_mockPathname}`; },
  search: '', hash: '', origin: BASE, host: 'www.artisan-plus.fr',
};

const _noop  = () => {};
const _noopT = () => true;

globalThis.window = {
  innerWidth: 1280, innerHeight: 900, scrollY: 0, pageYOffset: 0,
  location: _mockLocation,
  history: { pushState: _noop, replaceState: _noop, back: _noop },
  dispatchEvent: _noopT, addEventListener: _noop, removeEventListener: _noop,
  scrollTo: _noop,
  matchMedia: () => ({ matches: false, addEventListener: _noop, removeEventListener: _noop }),
  requestAnimationFrame: (fn) => setTimeout(fn, 16),
  cancelAnimationFrame: _noop,
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
  setTimeout, clearTimeout,
  URL: globalThis.URL,
  fetch: globalThis.fetch ?? _noop,
};

const _mockElem = (tag = 'div') => ({
  tagName: tag.toUpperCase(), id: '', rel: '', type: '', href: '', src: '',
  style: {}, innerHTML: '', textContent: '',
  setAttribute: _noop, getAttribute: () => null,
  appendChild: _noop, removeChild: _noop, contains: () => false,
});

globalThis.document = {
  title: '', cookie: '', referrer: '', readyState: 'complete',
  documentElement: { style: {}, lang: 'fr', classList: { add: _noop, remove: _noop } },
  head: { ..._mockElem('head'), childNodes: [] },
  body: { ..._mockElem('body') },
  querySelector: () => null, querySelectorAll: () => [],
  getElementById: () => null, getElementsByTagName: () => [],
  createElement: (tag) => _mockElem(tag),
  createTextNode: (t) => ({ textContent: t }),
  createEvent: () => ({ initEvent: _noop }),
  dispatchEvent: _noopT,
};

globalThis.localStorage = {
  getItem: (k) => (k === 'artisan_lang' ? 'fr' : null),
  setItem: _noop, removeItem: _noop, clear: _noop,
};
globalThis.sessionStorage = { getItem: () => null, setItem: _noop, removeItem: _noop };

Object.defineProperty(globalThis, 'navigator', {
  value: { language: 'fr', userAgent: 'Prerender/1.0', onLine: true },
  writable: true, configurable: true,
});
Object.defineProperty(globalThis, 'location', {
  get: () => _mockLocation, configurable: true,
});

class _MockEvent  {}
class _MockCE   extends _MockEvent { constructor(t) { super(); this.type = t; } }
class _MockPSE  extends _MockEvent { constructor(t) { super(); this.type = t; } }

globalThis.Event            = _MockEvent;
globalThis.CustomEvent      = _MockCE;
globalThis.PopStateEvent    = _MockPSE;
globalThis.MutationObserver     = class { observe() {} disconnect() {} takeRecords() { return []; } };
globalThis.IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
globalThis.ResizeObserver       = class { observe() {} disconnect() {} unobserve() {} };

// ── 2. DONNÉES DES ROUTES (extraites de Vitrine.jsx) ─────────────────────────

const METIERS_SLUGS = [
  // Top 20 (aussi utilisés pour les combos métier × ville)
  "plombier","electricien","macon","carreleur","peintre","menuisier","chauffagiste",
  "serrurier","couvreur","jardinier","charpentier","plaquiste","facadier","climaticien",
  "ramoneur","elagueur","paysagiste","pisciniste","terrassier","vitrier",
  // Métiers supplémentaires
  "etancheur","ferrailleur","soudeur","metallier","installateur-solaire","nettoyeur",
  "laveur-vitres","debarrasseur","domoticien","installateur-alarme","poseur-parquet",
  "poseur-fenetres","poseur-volets","staffeur","stucateur","marbrier","paveur",
  "frigoriste","technicien-fibre","installateur-pac","deboucheur","desinsectiseur",
  "derateur","miroitier","plombier-chauffagiste","electricien-industriel","isolateur",
  "echafaudeur","carreleur-mosaiste","peintre-batiment","electricien-domotique",
];

const VILLES_SLUGS = [
  // Île-de-France
  "paris","boulogne-billancourt","saint-denis","argenteuil","montreuil","nanterre",
  "vitry-sur-seine","creteil","asnières-sur-seine","colombes","aubervilliers","versailles",
  "courbevoie","rueil-malmaison","aulnay-sous-bois","champigny-sur-marne",
  "saint-maur-des-fosses","drancy","noisy-le-grand","issy-les-moulineaux","levallois-perret",
  "neuilly-sur-seine","clichy","pantin","le-blanc-mesnil","fontenay-sous-bois",
  "maisons-alfort","sartrouville","massy","meaux","melun","pontault-combault",
  "gennevilliers","vincennes","montrouge","villejuif","saint-germain-en-laye","poissy",
  "la-courneuve","bobigny","clamart","orly","chatou","houilles",
  "conflans-sainte-honorine","noisy-le-sec","stains",
  // Auvergne-Rhône-Alpes
  "lyon","saint-etienne","grenoble","villeurbanne","clermont-ferrand","annecy","valence",
  "chambery","venissieux","caluire-et-cuire","roanne","montelimar","romans-sur-isere",
  "echirolles","saint-martin-d-heres","bron","villefranche-sur-saone","saint-priest",
  "vienne","bourgoin-jallieu","annemasse","oyonnax","thonon-les-bains","aubiere",
  // Provence-Alpes-Côte d'Azur
  "marseille","nice","toulon","aix-en-provence","avignon","antibes","cannes",
  "la-seyne-sur-mer","hyeres","frejus","grasse","cagnes-sur-mer","arles",
  "salon-de-provence","aubagne","martigues","draguignan","la-ciotat",
  "six-fours-les-plages","menton","la-garde","gap","vitrolles",
  // Occitanie
  "toulouse","montpellier","nimes","perpignan","beziers","montauban","narbonne",
  "carcassonne","albi","castres","tarbes","sete","ales","agde","lunel","mende","lattes",
  // Nouvelle-Aquitaine
  "bordeaux","limoges","pau","la-rochelle","poitiers","merignac","pessac","bayonne",
  "angouleme","niort","brive-la-gaillarde","agen","perigueux","saintes","rochefort",
  "mont-de-marsan","dax",
  // Hauts-de-France
  "lille","amiens","tourcoing","roubaix","dunkerque","calais","villeneuve-d-ascq",
  "valenciennes","lens","arras","douai","maubeuge","bethune","cambrai","soissons",
  "saint-quentin","laon",
  // Grand Est
  "strasbourg","reims","metz","mulhouse","nancy","colmar","troyes",
  "charleville-mezieres","thionville","haguenau","epinal","chalons-en-champagne",
  "saint-avold","sarreguemines","forbach",
  // Bretagne
  "rennes","brest","quimper","lorient","vannes","saint-nazaire","saint-malo",
  "saint-brieuc","fougeres","morlaix",
  // Pays de la Loire
  "nantes","angers","le-mans","saint-herblain","cholet","la-roche-sur-yon","laval",
  "reze","les-sables-d-olonne",
  // Normandie
  "le-havre","rouen","caen","cherbourg-en-cotentin","evreux","dieppe","alencon","lisieux",
  // Centre-Val de Loire
  "orleans","tours","bourges","blois","chartres","chateauroux","vierzon",
  // Bourgogne-Franche-Comté
  "dijon","besancon","belfort","chalon-sur-saone","auxerre","macon","montbeliard","sens",
  // Corse
  "ajaccio","bastia",
];

const CONCURRENTS_SLUGS = ["tolteck","obat","artisanfacture"];

// Top 20 métiers et villes pour les combos métier × ville
const TOP20_M = METIERS_SLUGS.slice(0, 20);
const TOP20_V = [
  "paris","boulogne-billancourt","marseille","lyon","toulouse","nice","nantes","strasbourg",
  "montpellier","bordeaux","lille","rennes","reims","le-havre","saint-etienne","toulon",
  "grenoble","dijon","angers","nimes",
];

const FACT_ELEC_SLUGS = [
  "/facturation-electronique-artisan",
  "/facture-electronique-tpe-pme",
  "/logiciel-facturation-electronique-gratuit",
  "/facture-electronique-obligatoire-2027",
];

const GENERIC_SLUGS = [
  "/facture-en-ligne-gratuit",
  "/facture-en-ligne-artisan",
  "/devis-en-ligne-gratuit",
  "/application-devis-facture-gratuite",
  "/logiciel-devis-facture-artisan",
  "/application-facturation-gratuite",
  "/facture-auto-entrepreneur-gratuit",
];

// ── 3. IMPORT REACT + COMPOSANTS ─────────────────────────────────────────────

const { default: React }       = await import('react');
const { renderToStaticMarkup } = await import('react-dom/server');
const { LanguageProvider }     = await import('../src/i18n.jsx');
const { default: Vitrine }     = await import('../src/Vitrine.jsx');

// ── 4. CONSTRUCTION DE LA LISTE DES ROUTES ───────────────────────────────────

const ROUTES = [];

// Page d'accueil
ROUTES.push({ path: '/', dir: null, priority: '1.0', changefreq: 'weekly' });

// Pages statiques
ROUTES.push({ path: '/cgu',                                   dir: 'cgu',                                   priority: '0.3', changefreq: 'yearly'  });
ROUTES.push({ path: '/politique-confidentialite',             dir: 'politique-confidentialite',             priority: '0.3', changefreq: 'yearly'  });
ROUTES.push({ path: '/facturation-electronique-obligatoire-2026', dir: 'facturation-electronique-obligatoire-2026', priority: '0.8', changefreq: 'monthly' });

// Pages métiers (/devis-facture-{slug})
for (const slug of METIERS_SLUGS) {
  ROUTES.push({ path: `/devis-facture-${slug}`, dir: `devis-facture-${slug}`, priority: '0.8', changefreq: 'monthly' });
}

// Pages villes (/artisan-{slug})
for (const slug of VILLES_SLUGS) {
  ROUTES.push({ path: `/artisan-${slug}`, dir: `artisan-${slug}`, priority: '0.7', changefreq: 'monthly' });
}

// Pages concurrents (/alternative-{slug})
for (const slug of CONCURRENTS_SLUGS) {
  ROUTES.push({ path: `/alternative-${slug}`, dir: `alternative-${slug}`, priority: '0.8', changefreq: 'monthly' });
}

// Pages combinées métier × ville (20 × 20 = 400)
for (const m of TOP20_M) {
  for (const v of TOP20_V) {
    const path = `/${m}-${v}`;
    ROUTES.push({ path, dir: path.slice(1), priority: '0.9', changefreq: 'monthly' });
  }
}

// Variantes facturation électronique
for (const path of FACT_ELEC_SLUGS) {
  ROUTES.push({ path, dir: path.slice(1), priority: '0.8', changefreq: 'monthly' });
}

// Variantes génériques SEO
for (const path of GENERIC_SLUGS) {
  ROUTES.push({ path, dir: path.slice(1), priority: '0.7', changefreq: 'monthly' });
}

// ── 5. MOTEUR DE RENDU ───────────────────────────────────────────────────────

const template = readFileSync(join(DIST, 'index.html'), 'utf-8');

function renderPath(routePath) {
  _mockPathname = routePath;
  try {
    const html = renderToStaticMarkup(
      React.createElement(LanguageProvider, null, React.createElement(Vitrine))
    );
    return template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  } catch (err) {
    console.warn(`  ⚠️  ${routePath}: ${err.message}`);
    return null;
  }
}

function writeOut(content, filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, content, 'utf-8');
}

// ── 6. GÉNÉRATION DES PAGES ──────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);
const sitemapUrls = [];
let ok = 0, fail = 0;

for (const route of ROUTES) {
  const html = renderPath(route.path);
  if (!html) { fail++; continue; }

  const outPath = route.dir
    ? join(DIST, route.dir, 'index.html')
    : join(DIST, 'index.html');

  writeOut(html, outPath);

  const label = route.dir ? `dist/${route.dir}/index.html` : 'dist/index.html';
  process.stdout.write(`✓ ${route.path.padEnd(55)} → ${label}\n`);

  sitemapUrls.push({
    loc: `${BASE}${route.path}`,
    lastmod: TODAY,
    changefreq: route.changefreq,
    priority: route.priority,
  });
  ok++;
}

// ── 7. GÉNÉRATION DU SITEMAP ─────────────────────────────────────────────────

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

// Écrit dans public/ (source) ET dans dist/ (déployé)
writeFileSync(join(ROOT, 'public', 'sitemap.xml'), sitemap, 'utf-8');
writeFileSync(join(DIST, 'sitemap.xml'), sitemap, 'utf-8');

console.log(`\nPrerender : ${ok} pages générées, ${fail} échouées.`);
console.log(`Sitemap   : ${sitemapUrls.length} URLs → public/sitemap.xml + dist/sitemap.xml`);
