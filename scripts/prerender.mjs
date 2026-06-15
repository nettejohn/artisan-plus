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

const { default: React }                          = await import('react');
const { renderToStaticMarkup }                    = await import('react-dom/server');
const { LanguageProvider }                        = await import('../src/i18n.jsx');
const { default: Vitrine, METIERS, VILLES, CONCURRENTS } = await import('../src/Vitrine.jsx');

// Index de lookup slug → objet
const METIERS_BY_SLUG = Object.fromEntries(METIERS.map(m => [m.slug, m]));
const VILLES_BY_SLUG  = Object.fromEntries(VILLES.map(v => [v.slug, v]));
const CONCURRENTS_BY_SLUG = Object.fromEntries(CONCURRENTS.map(c => [c.slug, c]));

// Générer le title + meta description unique pour chaque route
function getPageMeta(path) {
  // Page d'accueil
  if (path === '/') return {
    title: 'Artisan+ | App Devis Factures Artisan - 7,99€/mois',
    description: 'Logiciel devis et factures pour artisans à 7,99€/mois. Moins cher que Tolteck, Obat et ArtisanFacture. Suivi chantier, mini-site, paiement en ligne inclus.',
  };

  // /devis-facture-{slug}
  if (path.startsWith('/devis-facture-')) {
    const slug = path.replace('/devis-facture-', '');
    const m = METIERS_BY_SLUG[slug];
    if (m) return {
      title: `Logiciel devis facture ${m.label} | Artisan+ à 7,99€/mois`,
      description: `Créez vos devis et factures de ${m.desc} en 2 minutes. Logiciel ${m.kw} Artisan+ à 7,99€/mois. Suivi chantier, mini-site, paiement en ligne inclus.`,
    };
  }

  // /artisan-{slug}
  if (path.startsWith('/artisan-')) {
    const slug = path.replace('/artisan-', '');
    const v = VILLES_BY_SLUG[slug];
    if (v) return {
      title: `Artisan+ ${v.label} | Logiciel devis facture artisan ${v.label}`,
      description: `Logiciel de devis et factures pour artisans à ${v.label} (${v.dept}). Gérez votre activité en ${v.region} à 7,99€/mois. Essai gratuit.`,
    };
  }

  // /alternative-{slug}
  if (path.startsWith('/alternative-')) {
    const slug = path.replace('/alternative-', '');
    const c = CONCURRENTS_BY_SLUG[slug];
    if (c) return {
      title: `Alternative à ${c.label} | Artisan+ moins cher à 7,99€/mois`,
      description: `Vous cherchez une alternative à ${c.label} (${c.prix}) ? Artisan+ offre plus de fonctionnalités à 7,99€/mois. Comparatif complet.`,
    };
  }

  // Combos /{metier-slug}-{ville-slug} : cherche le meilleur split métier+ville
  const pathSlug = path.slice(1); // retire le /
  for (const mSlug of Object.keys(METIERS_BY_SLUG)) {
    if (pathSlug.startsWith(mSlug + '-')) {
      const vSlug = pathSlug.slice(mSlug.length + 1);
      const m = METIERS_BY_SLUG[mSlug];
      const v = VILLES_BY_SLUG[vSlug];
      if (m && v) return {
        title: `${m.label} à ${v.label} | Devis et factures — Artisan+`,
        description: `Vous êtes ${m.kw} à ${v.label} (${v.dept}) ? Artisan+ vous permet de créer vos devis de ${m.desc} en 2 minutes. Logiciel ${m.kw} à 7,99€/mois. Essai gratuit.`,
      };
    }
  }

  // Pages facturation électronique
  const FACT_ELEC_META = {
    '/facturation-electronique-artisan': {
      title: 'Facturation électronique artisan 2026 | Artisan+ conforme Factur-X',
      description: 'Artisan+ est prêt pour la facturation électronique obligatoire 2026. Format Factur-X (EN 16931) pour artisans. Gratuit et simple.',
    },
    '/facture-electronique-tpe-pme': {
      title: 'Facture électronique TPE PME | Artisan+ obligation 2026',
      description: 'Préparez votre TPE ou PME artisanale à la facture électronique obligatoire dès 2026. Artisan+ génère des factures Factur-X conformes automatiquement.',
    },
    '/logiciel-facturation-electronique-gratuit': {
      title: 'Logiciel facturation électronique gratuit artisan | Artisan+',
      description: 'Logiciel de facturation électronique gratuit pour artisans. Format Factur-X, conformité 2026, devis et factures professionnelles à 7,99€/mois.',
    },
    '/facture-electronique-obligatoire-2027': {
      title: 'Facture électronique obligatoire 2026-2027 | Guide artisan Artisan+',
      description: 'Tout comprendre sur la facture électronique obligatoire pour les artisans en 2026 et 2027. Artisan+ vous accompagne avec le format Factur-X.',
    },
  };
  if (FACT_ELEC_META[path]) return FACT_ELEC_META[path];

  // Pages génériques SEO
  const GENERIC_META = {
    '/facture-en-ligne-gratuit': {
      title: 'Facture en ligne gratuit artisan | Artisan+ 7,99€/mois',
      description: 'Créez vos factures en ligne gratuitement avec Artisan+. Factures professionnelles conformes, envoi par email, paiement en ligne. Essai gratuit.',
    },
    '/facture-en-ligne-artisan': {
      title: 'Facture en ligne artisan | Artisan+ logiciel facturation',
      description: 'Logiciel de facture en ligne pour artisans. Créez et envoyez vos factures professionnelles en 2 minutes depuis votre smartphone. À 7,99€/mois.',
    },
    '/devis-en-ligne-gratuit': {
      title: 'Devis en ligne gratuit artisan | Artisan+ logiciel devis',
      description: 'Créez vos devis en ligne gratuitement avec Artisan+. Devis professionnels personnalisés, envoi par email et signature électronique. Essai gratuit.',
    },
    '/application-devis-facture-gratuite': {
      title: 'Application devis facture gratuite artisan | Artisan+',
      description: 'Application devis et facture gratuite pour artisans. Créez des devis et factures professionnels sur smartphone en 2 minutes. Artisan+ à 7,99€/mois.',
    },
    '/logiciel-devis-facture-artisan': {
      title: 'Logiciel devis facture artisan | Artisan+ 7,99€/mois',
      description: 'Logiciel de devis et factures pour artisans du bâtiment. Moins cher que Tolteck et Obat. Suivi chantier, mini-site et paiement en ligne inclus.',
    },
    '/application-facturation-gratuite': {
      title: 'Application facturation gratuite artisan | Artisan+',
      description: "Application de facturation gratuite pour artisans. Factures conformes, TVA automatique, export PDF. Artisan+ à 7,99€/mois. Pas d'engagement.",
    },
    '/facture-auto-entrepreneur-gratuit': {
      title: 'Facture auto-entrepreneur gratuit | Artisan+ micro-entreprise',
      description: "Créez vos factures d'auto-entrepreneur gratuitement avec Artisan+. Mentions légales auto-entrepreneur, franchise TVA, export PDF. Essai gratuit.",
    },
  };
  if (GENERIC_META[path]) return GENERIC_META[path];

  // Pages statiques
  if (path === '/cgu') return {
    title: "Conditions Générales d'Utilisation | Artisan+",
    description: "Conditions générales d'utilisation de l'application Artisan+ — logiciel de devis et facturation pour artisans.",
  };
  if (path === '/politique-confidentialite') return {
    title: 'Politique de confidentialité | Artisan+',
    description: 'Politique de confidentialité et traitement des données personnelles de l\'application Artisan+.',
  };
  if (path === '/mentions-legales') return {
    title: 'Mentions Légales | Artisan+',
    description: 'Mentions légales de l\'application Artisan+ — éditeur Kessler Cassandra (auto-entrepreneur), hébergeur, propriété intellectuelle.',
  };
  if (path === '/facturation-electronique-obligatoire-2026') return {
    title: 'Facturation électronique obligatoire 2026 | Artisan+ prêt',
    description: 'La facturation électronique devient obligatoire en 2026 pour les artisans. Artisan+ est déjà conforme Factur-X. Découvrez comment être prêt.',
  };

  // Fallback
  return {
    title: 'Artisan+ | App Devis Factures Artisan - 7,99€/mois',
    description: 'Logiciel devis et factures pour artisans à 7,99€/mois. Suivi chantier, mini-site, paiement en ligne inclus.',
  };
}

// ── 4. CONSTRUCTION DE LA LISTE DES ROUTES ───────────────────────────────────

const ROUTES = [];

// Page d'accueil
ROUTES.push({ path: '/', dir: null, priority: '1.0', changefreq: 'weekly' });

// Pages statiques
ROUTES.push({ path: '/cgu',                                   dir: 'cgu',                                   priority: '0.3', changefreq: 'yearly'  });
ROUTES.push({ path: '/politique-confidentialite',             dir: 'politique-confidentialite',             priority: '0.3', changefreq: 'yearly'  });
ROUTES.push({ path: '/mentions-legales',                      dir: 'mentions-legales',                      priority: '0.3', changefreq: 'yearly'  });
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

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function serializeSchema(obj) {
  return JSON.stringify(obj)
    .replace(/<\/script>/gi, '<\\/script>')
    .replace(/<!--/g, '<\\!--');
}

function getPageSchema(path) {
  const url = `${BASE}${path}`;

  // /artisan-{ville} → LocalBusiness ciblant la ville
  if (path.startsWith('/artisan-')) {
    const slug = path.replace('/artisan-', '');
    const v = VILLES_BY_SLUG[slug];
    if (!v) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': `Artisan+ ${v.label}`,
      'description': `Logiciel de devis et factures pour artisans à ${v.label} (${v.dept}). Gérez votre activité en ${v.region} à 7,99€/mois.`,
      'url': url,
      'areaServed': { '@type': 'City', 'name': v.label },
      'priceRange': '€',
      'offers': { '@type': 'Offer', 'price': '7.99', 'priceCurrency': 'EUR', 'name': 'Abonnement Artisan+' },
    };
  }

  // /devis-facture-{metier} → LocalBusiness par corps de métier
  if (path.startsWith('/devis-facture-')) {
    const slug = path.replace('/devis-facture-', '');
    const m = METIERS_BY_SLUG[slug];
    if (!m) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': `Artisan+ — Logiciel ${m.label}`,
      'description': `Créez vos devis et factures de ${m.desc} en 2 minutes. Logiciel ${m.kw} à 7,99€/mois.`,
      'url': url,
      'serviceType': m.label,
      'priceRange': '€',
      'offers': { '@type': 'Offer', 'price': '7.99', 'priceCurrency': 'EUR', 'name': `Logiciel ${m.label}` },
    };
  }

  // /{metier}-{ville} → LocalBusiness combinant métier + ville
  const pathSlug = path.slice(1);
  for (const mSlug of Object.keys(METIERS_BY_SLUG)) {
    if (pathSlug.startsWith(mSlug + '-')) {
      const vSlug = pathSlug.slice(mSlug.length + 1);
      const m = METIERS_BY_SLUG[mSlug];
      const v = VILLES_BY_SLUG[vSlug];
      if (m && v) return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        'name': `${m.label} à ${v.label} — Artisan+`,
        'description': `Logiciel de devis et factures pour ${m.kw} à ${v.label} (${v.dept}). Créez vos devis de ${m.desc} en 2 minutes.`,
        'url': url,
        'serviceType': m.label,
        'areaServed': { '@type': 'City', 'name': v.label },
        'priceRange': '€',
        'offers': { '@type': 'Offer', 'price': '7.99', 'priceCurrency': 'EUR', 'name': `Logiciel ${m.label}` },
      };
    }
  }

  return null;
}

function renderPath(routePath) {
  _mockPathname = routePath;
  try {
    const html = renderToStaticMarkup(
      React.createElement(LanguageProvider, null, React.createElement(Vitrine))
    );
    const { title, description } = getPageMeta(routePath);
    const schema = getPageSchema(routePath);
    const schemaTag = schema
      ? `\n  <script type="application/ld+json">${serializeSchema(schema)}</script>`
      : '';
    const canonicalUrl = `${BASE}${routePath === '/' ? '' : routePath}`;
    const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
    let result = template
      .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
      .replace(/<title>[^<]*<\/title>/, `<title>${escHtml(title)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*"/, `$1${escHtml(description)}"`)
      .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${canonicalUrl}"`)
      .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${escHtml(title)}"`)
      .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${escHtml(description)}"`)
      .replace('</head>', `${schemaTag}\n</head>`);
    // Injecter ou remplacer le canonical
    if (result.includes('rel="canonical"')) {
      result = result.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, canonicalTag);
    } else {
      result = result.replace('<link rel="sitemap"', `${canonicalTag}\n    <link rel="sitemap"`);
    }
    return result;
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
