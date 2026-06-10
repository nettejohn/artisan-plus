/**
 * Artisan+ — Prerender SSG
 *
 * Génère du HTML statique pour les routes de la Vitrine afin que Google
 * et les crawlers voient le contenu sans exécuter JavaScript.
 *
 * Stratégie :
 *  - dist/index.html         → contenu de la page d'accueil (PageHome) injecté
 *  - dist/cgu/index.html     → page CGU
 *  - dist/politique-confidentialite/index.html → RGPD
 *  - dist/<slug>/index.html  → pages métiers (top 20), villes, concurrents,
 *                               facturation électronique, génériques
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

// ── 1. MOCKS NAVIGATEUR ──────────────────────────────────────────────────────
// Doivent être définis AVANT l'import des composants React.
// useState(() => window.xxx) s'exécute pendant renderToStaticMarkup — pas en
// tant qu'effet — donc les mocks doivent exister au moment du rendu.

let _mockPathname = '/';

const _mockLocation = {
  get pathname() { return _mockPathname; },
  get href()     { return `https://www.artisan-plus.fr${_mockPathname}`; },
  search: '',
  hash:   '',
  origin: 'https://www.artisan-plus.fr',
  host:   'www.artisan-plus.fr',
};

const _noop  = () => {};
const _noopT = () => true;

globalThis.window = {
  innerWidth:  1280,
  innerHeight: 900,
  scrollY:     0,
  pageYOffset: 0,
  location:    _mockLocation,
  history:     { pushState: _noop, replaceState: _noop, back: _noop },
  dispatchEvent:        _noopT,
  addEventListener:     _noop,
  removeEventListener:  _noop,
  scrollTo:             _noop,
  matchMedia:           () => ({ matches: false, addEventListener: _noop, removeEventListener: _noop }),
  requestAnimationFrame: (fn) => setTimeout(fn, 16),
  cancelAnimationFrame:  _noop,
  getComputedStyle:      () => ({ getPropertyValue: () => '' }),
  setTimeout,
  clearTimeout,
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
  title: '',
  cookie: '',
  referrer: '',
  readyState: 'complete',
  documentElement: { style: {}, lang: 'fr', classList: { add: _noop, remove: _noop } },
  head:   { ..._mockElem('head'), childNodes: [] },
  body:   { ..._mockElem('body') },
  querySelector:       () => null,
  querySelectorAll:    () => [],
  getElementById:      () => null,
  getElementsByTagName:() => [],
  createElement:       (tag) => _mockElem(tag),
  createTextNode:      (t)   => ({ textContent: t }),
  createEvent:         ()    => ({ initEvent: _noop }),
  dispatchEvent:       _noopT,
};

globalThis.localStorage = {
  getItem:    (k) => (k === 'artisan_lang' ? 'fr' : null),
  setItem:    _noop,
  removeItem: _noop,
  clear:      _noop,
};
globalThis.sessionStorage = { getItem: () => null, setItem: _noop, removeItem: _noop };
Object.defineProperty(globalThis, 'navigator', {
  value: { language: 'fr', userAgent: 'Prerender/1.0', onLine: true },
  writable: true, configurable: true,
});
Object.defineProperty(globalThis, 'location', {
  get: () => _mockLocation,
  configurable: true,
});

class _MockEvent  {}
class _MockCE extends _MockEvent { constructor(t, o) { super(); this.type = t; } }
class _MockPSE extends _MockEvent { constructor(t, o) { super(); this.type = t; } }

globalThis.Event            = _MockEvent;
globalThis.CustomEvent      = _MockCE;
globalThis.PopStateEvent    = _MockPSE;
globalThis.MutationObserver = class { observe() {} disconnect() {} takeRecords() { return []; } };
globalThis.IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
globalThis.ResizeObserver   = class { observe() {} disconnect() {} unobserve() {} };

// ── 2. IMPORT REACT + COMPOSANTS ──────────────────────────────────────────────
// Imports dynamiques après le setup des globals pour être sûr.

const { default: React }                = await import('react');
const { renderToStaticMarkup }          = await import('react-dom/server');
const { LanguageProvider }              = await import('../src/i18n.jsx');
const { default: Vitrine }             = await import('../src/Vitrine.jsx');

// ── 3. LISTE DES ROUTES À PRÉ-RENDRE ─────────────────────────────────────────
// Chaque route génère un dist/<dir>/index.html (propre URL sans .html)
// La route '/' met à jour dist/index.html directement.

const ROUTES = [
  // Route principale
  { path: '/', main: true },

  // Pages statiques
  { path: '/cgu',                                dir: 'cgu' },
  { path: '/politique-confidentialite',          dir: 'politique-confidentialite' },
  { path: '/facturation-electronique-obligatoire-2026', dir: 'facturation-electronique-obligatoire-2026' },

  // Top métiers (pages les plus crawlées)
  { path: '/devis-facture-plombier',             dir: 'devis-facture-plombier' },
  { path: '/devis-facture-electricien',          dir: 'devis-facture-electricien' },
  { path: '/devis-facture-macon',                dir: 'devis-facture-macon' },
  { path: '/devis-facture-peintre',              dir: 'devis-facture-peintre' },
  { path: '/devis-facture-carreleur',            dir: 'devis-facture-carreleur' },
  { path: '/devis-facture-menuisier',            dir: 'devis-facture-menuisier' },
  { path: '/devis-facture-chauffagiste',         dir: 'devis-facture-chauffagiste' },
  { path: '/devis-facture-couvreur',             dir: 'devis-facture-couvreur' },
  { path: '/devis-facture-charpentier',          dir: 'devis-facture-charpentier' },
  { path: '/devis-facture-plaquiste',            dir: 'devis-facture-plaquiste' },

  // Top villes
  { path: '/artisan-paris',                      dir: 'artisan-paris' },
  { path: '/artisan-lyon',                       dir: 'artisan-lyon' },
  { path: '/artisan-marseille',                  dir: 'artisan-marseille' },
  { path: '/artisan-toulouse',                   dir: 'artisan-toulouse' },
  { path: '/artisan-bordeaux',                   dir: 'artisan-bordeaux' },
  { path: '/artisan-nantes',                     dir: 'artisan-nantes' },
  { path: '/artisan-nice',                       dir: 'artisan-nice' },
  { path: '/artisan-lille',                      dir: 'artisan-lille' },
  { path: '/artisan-strasbourg',                 dir: 'artisan-strasbourg' },
  { path: '/artisan-rennes',                     dir: 'artisan-rennes' },

  // Alternatifs concurrents
  { path: '/alternative-tolteck',                dir: 'alternative-tolteck' },
  { path: '/alternative-obat',                   dir: 'alternative-obat' },
  { path: '/alternative-batiprix',               dir: 'alternative-batiprix' },
];

// ── 4. MOTEUR DE RENDU ────────────────────────────────────────────────────────

const template = readFileSync(join(DIST, 'index.html'), 'utf-8');

function renderPath(routePath) {
  _mockPathname = routePath;
  // Force window.location à retourner le bon pathname
  // (le getter sur _mockLocation lit _mockPathname)

  try {
    const html = renderToStaticMarkup(
      React.createElement(LanguageProvider, null,
        React.createElement(Vitrine)
      )
    );
    return template.replace(
      '<div id="root"></div>',
      `<div id="root">${html}</div>`
    );
  } catch (err) {
    console.warn(`  ⚠️  Erreur rendu ${routePath}: ${err.message}`);
    return null;
  }
}

function writeOut(content, filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, content, 'utf-8');
}

// ── 5. GÉNÉRATION ─────────────────────────────────────────────────────────────

let ok = 0, fail = 0;

for (const route of ROUTES) {
  const html = renderPath(route.path);
  if (!html) { fail++; continue; }

  if (route.main) {
    // Route principale : remplace dist/index.html
    writeOut(html, join(DIST, 'index.html'));
    console.log(`✓ ${route.path}  →  dist/index.html`);
  } else {
    // Autres routes : crée dist/<dir>/index.html
    writeOut(html, join(DIST, route.dir, 'index.html'));
    console.log(`✓ ${route.path}  →  dist/${route.dir}/index.html`);
  }
  ok++;
}

console.log(`\nPrerender terminé : ${ok} pages générées, ${fail} échouées.`);
