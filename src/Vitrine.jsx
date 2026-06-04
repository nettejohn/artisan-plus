/**
 * Vitrine Artisan+ — Site marketing complet
 * Routes : /, /devis-facture-:metier, /artisan-:ville,
 *          /alternative-:concurrent, /cgu, /politique-confidentialite
 */
import { useState, useEffect } from "react";

const P  = "#FF8C00";
const D  = "#0a1628";
const C  = "#111e35";
const G  = "#8899aa";
const BASE = "https://www.artisan-plus.fr";

// ── Données métiers ───────────────────────────────────────────────────────────
const METIERS = [
  { slug: "plombier",     label: "Plombier",     emoji: "🔧", art: "le",  accroche: "devis plomberie",  kw: "plombier",     desc: "plomberie et sanitaires" },
  { slug: "electricien",  label: "Électricien",  emoji: "⚡", art: "l'",  accroche: "devis électricité",kw: "électricien",  desc: "travaux électriques" },
  { slug: "macon",        label: "Maçon",        emoji: "🧱", art: "le",  accroche: "devis maçonnerie", kw: "maçon",        desc: "gros œuvre et maçonnerie" },
  { slug: "carreleur",    label: "Carreleur",    emoji: "🏠", art: "le",  accroche: "devis carrelage",  kw: "carreleur",    desc: "pose de carrelage et faïence" },
  { slug: "peintre",      label: "Peintre",      emoji: "🎨", art: "le",  accroche: "devis peinture",   kw: "peintre",      desc: "peinture et décoration" },
  { slug: "menuisier",    label: "Menuisier",    emoji: "🪚", art: "le",  accroche: "devis menuiserie", kw: "menuisier",    desc: "menuiserie et ébénisterie" },
  { slug: "chauffagiste", label: "Chauffagiste", emoji: "🔥", art: "le",  accroche: "devis chauffage",  kw: "chauffagiste", desc: "chauffage et climatisation" },
  { slug: "serrurier",    label: "Serrurier",    emoji: "🔑", art: "le",  accroche: "devis serrurerie", kw: "serrurier",    desc: "serrurerie et sécurité" },
  { slug: "couvreur",     label: "Couvreur",     emoji: "🏠", art: "le",  accroche: "devis toiture",    kw: "couvreur",     desc: "couverture et toiture" },
  { slug: "jardinier",    label: "Jardinier",    emoji: "🌿", art: "le",  accroche: "devis jardinage",  kw: "jardinier",    desc: "jardinage et espaces verts" },
];

// ── Données villes ─────────────────────────────────────────────────────────────
const VILLES = [
  { slug: "paris",          label: "Paris",          dept: "75", region: "Île-de-France",       pop: "2,1M" },
  { slug: "lyon",           label: "Lyon",           dept: "69", region: "Auvergne-Rhône-Alpes", pop: "520k" },
  { slug: "marseille",      label: "Marseille",      dept: "13", region: "Provence-Alpes-Côte d'Azur", pop: "870k" },
  { slug: "toulouse",       label: "Toulouse",       dept: "31", region: "Occitanie",            pop: "490k" },
  { slug: "nice",           label: "Nice",           dept: "06", region: "Provence-Alpes-Côte d'Azur", pop: "340k" },
  { slug: "nantes",         label: "Nantes",         dept: "44", region: "Pays de la Loire",     pop: "320k" },
  { slug: "strasbourg",     label: "Strasbourg",     dept: "67", region: "Grand Est",            pop: "285k" },
  { slug: "montpellier",    label: "Montpellier",    dept: "34", region: "Occitanie",            pop: "295k" },
  { slug: "bordeaux",       label: "Bordeaux",       dept: "33", region: "Nouvelle-Aquitaine",   pop: "260k" },
  { slug: "lille",          label: "Lille",          dept: "59", region: "Hauts-de-France",      pop: "235k" },
  { slug: "rennes",         label: "Rennes",         dept: "35", region: "Bretagne",             pop: "220k" },
  { slug: "reims",          label: "Reims",          dept: "51", region: "Grand Est",            pop: "185k" },
  { slug: "le-havre",       label: "Le Havre",       dept: "76", region: "Normandie",            pop: "170k" },
  { slug: "saint-etienne",  label: "Saint-Étienne",  dept: "42", region: "Auvergne-Rhône-Alpes", pop: "175k" },
  { slug: "toulon",         label: "Toulon",         dept: "83", region: "Provence-Alpes-Côte d'Azur", pop: "180k" },
  { slug: "grenoble",       label: "Grenoble",       dept: "38", region: "Auvergne-Rhône-Alpes", pop: "160k" },
  { slug: "dijon",          label: "Dijon",          dept: "21", region: "Bourgogne-Franche-Comté", pop: "155k" },
  { slug: "angers",         label: "Angers",         dept: "49", region: "Pays de la Loire",     pop: "155k" },
  { slug: "nimes",          label: "Nîmes",          dept: "30", region: "Occitanie",            pop: "150k" },
  { slug: "villeurbanne",   label: "Villeurbanne",   dept: "69", region: "Auvergne-Rhône-Alpes", pop: "150k" },
];

// ── Données concurrents ───────────────────────────────────────────────────────
const CONCURRENTS = [
  {
    slug: "tolteck", label: "Tolteck", prix: "19€/mois",
    avantages: ["Interface simple", "Gestion des acomptes", "Relances automatiques"],
    inconvenients: ["Plus cher qu'Artisan+", "Pas de suivi chantier avancé", "Pas de mini-site", "Pas de paiement en ligne client"],
  },
  {
    slug: "obat", label: "Obat", prix: "39€/mois",
    avantages: ["Fonctionnalités complètes", "Planning chantier", "Gestion équipe"],
    inconvenients: ["Prix très élevé (39€/mois)", "Interface complexe", "Pas de mini-site artisan", "Pas de paiement en ligne client"],
  },
  {
    slug: "artisanfacture", label: "ArtisanFacture", prix: "29€/mois",
    avantages: ["Reconnu en France", "Support téléphonique", "Modèles de documents"],
    inconvenients: ["Coût élevé (29€/mois)", "Pas de suivi de chantier", "Pas de mini-site", "Pas de paiement en ligne client"],
  },
];

// ── Fonctionnalités principales ───────────────────────────────────────────────
const FEATURES = [
  { icon: "📄", titre: "Devis professionnels", desc: "Créez des devis en 2 minutes avec votre catalogue de prix. Envoi par email avec signature électronique intégrée." },
  { icon: "🧾", titre: "Factures conformes", desc: "Factures avec numérotation automatique, mentions légales, TVA, acomptes et relances. Conformes à la loi française." },
  { icon: "🏗️", titre: "Suivi de chantier", desc: "Gérez vos chantiers, photos avant/après, coûts en temps réel, suivi de l'avancement et partage client." },
  { icon: "🌐", titre: "Mini-site vitrine", desc: "Un site web professionnel en 5 minutes pour afficher vos réalisations et recevoir des demandes de devis en ligne." },
  { icon: "💶", titre: "Paiement en ligne", desc: "Vos clients paient directement depuis leur facture par carte bancaire. Fonds versés sur votre compte en 2 jours." },
  { icon: "✍️", titre: "Signature électronique", desc: "Devis signés en ligne par vos clients. Légalement valide, gain de temps sur chaque chantier." },
  { icon: "📚", titre: "Catalogue de prix", desc: "Votre bibliothèque de prestations avec vos prix habituels. Insérez une ligne en un clic dans n'importe quel devis." },
  { icon: "👥", titre: "Gestion clients", desc: "Fiche client complète, historique des documents, notes, photos de chantier et suivi personnalisé." },
];

// ── Témoignages ───────────────────────────────────────────────────────────────
const TEMOIGNAGES = [
  { nom: "Marc D.", metier: "Plombier", ville: "Lyon", note: 5, texte: "J'ai arrêté de faire mes devis à la main grâce à Artisan+. En 2 minutes c'est envoyé, signé électroniquement et archivé. À 7,99€/mois c'est imbattable — j'ai économisé 200€/an par rapport à mon ancien logiciel." },
  { nom: "Sophie L.", metier: "Électricienne", ville: "Paris", note: 5, texte: "Le mini-site m'a permis d'avoir une présence en ligne sans payer un développeur. Maintenant je reçois des demandes de devis directement depuis mon profil. Le paiement en ligne m'a sauvé la mise avec plusieurs clients qui traînaient à payer." },
  { nom: "Jean-Pierre M.", metier: "Maçon", ville: "Toulouse", note: 5, texte: "Simple, rapide et pas cher. J'ai comparé avec Tolteck et Obat — Artisan+ a les mêmes fonctions pour deux fois moins cher. La gestion de chantier avec les photos est vraiment pratique pour mes clients." },
];

// ── Tableau comparatif ────────────────────────────────────────────────────────
const COMPARATIF = {
  lignes: [
    "Prix mensuel",
    "Devis illimités",
    "Factures illimitées",
    "Suivi de chantier",
    "Mini-site vitrine",
    "Paiement en ligne client",
    "Signature électronique",
    "Catalogue de prix perso.",
    "Gestion multi-artisans",
    "Export PDF professionnel",
    "Support client",
  ],
  cols: [
    {
      nom: "Artisan+",
      prix: "7,99€/mois",
      values: ["7,99€/mois", true, true, true, true, true, true, true, true, true, "Chat & Email"],
      highlight: true,
    },
    {
      nom: "Tolteck",
      prix: "19€/mois",
      values: ["19€/mois", true, true, false, false, false, true, true, false, true, "Email"],
    },
    {
      nom: "Obat",
      prix: "39€/mois",
      values: ["39€/mois", true, true, true, false, false, false, true, true, true, "Téléphone"],
    },
    {
      nom: "ArtisanFacture",
      prix: "29€/mois",
      values: ["29€/mois", true, true, false, false, false, false, true, false, true, "Email"],
    },
  ],
};

// ── Utilitaires ───────────────────────────────────────────────────────────────
function setPageMeta(title, description, canonical) {
  document.title = title;
  const upsertMeta = (sel, attr, name, content) => {
    let el = document.querySelector(sel);
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
    el.setAttribute("content", content);
  };
  upsertMeta('meta[name="description"]', "name", "description", description);
  upsertMeta('meta[property="og:title"]', "property", "og:title", title);
  upsertMeta('meta[property="og:description"]', "property", "og:description", description);
  upsertMeta('meta[property="og:url"]', "property", "og:url", canonical || BASE);
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
  link.href = canonical || BASE;
}

function navigate(to) {
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Composant : En-tête ───────────────────────────────────────────────────────
function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled,  setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Fonctionnalités", href: "/#fonctionnalites" },
    { label: "Tarifs",          href: "/#tarifs" },
    { label: "Métiers",         href: "/#metiers" },
  ];

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 500,
      background: scrolled ? "rgba(10,22,40,0.97)" : D,
      borderBottom: scrolled ? "1px solid rgba(255,140,0,0.15)" : "1px solid transparent",
      backdropFilter: "blur(12px)",
      transition: "all 0.3s",
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <a href="/" onClick={e => { e.preventDefault(); navigate("/"); }} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "24px", fontWeight: "900", color: "white", letterSpacing: "-0.5px" }}>
            Artisan<span style={{ color: P }}>+</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {navLinks.map(l => (
            <a key={l.label} href={l.href} onClick={e => { e.preventDefault(); navigate(l.href); }}
              style={{ color: G, fontSize: "14px", fontWeight: "600", textDecoration: "none", padding: "6px 12px", borderRadius: "8px", transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = "white"}
              onMouseLeave={e => e.currentTarget.style.color = G}
            >{l.label}</a>
          ))}
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
            style={{ color: G, fontSize: "14px", fontWeight: "600", textDecoration: "none", padding: "6px 12px" }}>
            Connexion
          </a>
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
            style={{ background: P, color: "white", fontSize: "14px", fontWeight: "700", textDecoration: "none", padding: "10px 20px", borderRadius: "10px", transition: "opacity 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Essai gratuit →
          </a>
        </nav>
      </div>
    </header>
  );
}

// ── Composant : Pied de page ──────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: C, borderTop: "1px solid rgba(255,140,0,0.12)", padding: "60px 20px 40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "40px", marginBottom: "48px" }}>
          {/* Colonne logo */}
          <div>
            <div style={{ fontSize: "22px", fontWeight: "900", color: "white", marginBottom: "12px" }}>
              Artisan<span style={{ color: P }}>+</span>
            </div>
            <p style={{ color: G, fontSize: "13px", lineHeight: "1.7", margin: "0 0 16px" }}>
              L'application de gestion pour artisans la plus abordable du marché. Devis, factures, chantiers — tout en un.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>🇫🇷</span>
              <span style={{ color: G, fontSize: "12px", alignSelf: "center" }}>Fait en France</span>
            </div>
          </div>

          {/* Métiers */}
          <div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "14px", marginBottom: "16px" }}>Métiers</div>
            {METIERS.slice(0, 5).map(m => (
              <a key={m.slug} href={`/devis-facture-${m.slug}`}
                onClick={e => { e.preventDefault(); navigate(`/devis-facture-${m.slug}`); }}
                style={{ display: "block", color: G, fontSize: "13px", textDecoration: "none", marginBottom: "8px", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = P}
                onMouseLeave={e => e.currentTarget.style.color = G}
              >{m.emoji} {m.label}</a>
            ))}
            {METIERS.slice(5).map(m => (
              <a key={m.slug} href={`/devis-facture-${m.slug}`}
                onClick={e => { e.preventDefault(); navigate(`/devis-facture-${m.slug}`); }}
                style={{ display: "block", color: G, fontSize: "13px", textDecoration: "none", marginBottom: "8px", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = P}
                onMouseLeave={e => e.currentTarget.style.color = G}
              >{m.emoji} {m.label}</a>
            ))}
          </div>

          {/* Villes */}
          <div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "14px", marginBottom: "16px" }}>Principales villes</div>
            {VILLES.slice(0, 10).map(v => (
              <a key={v.slug} href={`/artisan-${v.slug}`}
                onClick={e => { e.preventDefault(); navigate(`/artisan-${v.slug}`); }}
                style={{ display: "block", color: G, fontSize: "13px", textDecoration: "none", marginBottom: "8px", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = P}
                onMouseLeave={e => e.currentTarget.style.color = G}
              >📍 {v.label}</a>
            ))}
          </div>

          {/* Liens utiles */}
          <div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "14px", marginBottom: "16px" }}>Liens utiles</div>
            {[
              { label: "Connexion", href: "/login" },
              { label: "Créer un compte", href: "/login" },
              { label: "Alternative à Tolteck", href: "/alternative-tolteck" },
              { label: "Alternative à Obat", href: "/alternative-obat" },
              { label: "Alternative à ArtisanFacture", href: "/alternative-artisanfacture" },
              { label: "Conditions d'utilisation", href: "/cgu" },
              { label: "Politique de confidentialité", href: "/politique-confidentialite" },
            ].map(l => (
              <a key={l.label} href={l.href}
                onClick={e => { e.preventDefault(); navigate(l.href); }}
                style={{ display: "block", color: G, fontSize: "13px", textDecoration: "none", marginBottom: "8px", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = P}
                onMouseLeave={e => e.currentTarget.style.color = G}
              >{l.label}</a>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "24px", display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: "#445566", fontSize: "12px", margin: 0 }}>
            © {new Date().getFullYear()} Artisan+. Tous droits réservés.
          </p>
          <div style={{ display: "flex", gap: "20px" }}>
            <a href="/cgu" onClick={e => { e.preventDefault(); navigate("/cgu"); }} style={{ color: "#445566", fontSize: "12px", textDecoration: "none" }}>CGU</a>
            <a href="/politique-confidentialite" onClick={e => { e.preventDefault(); navigate("/politique-confidentialite"); }} style={{ color: "#445566", fontSize: "12px", textDecoration: "none" }}>Confidentialité</a>
            <a href="mailto:contact@artisan-plus.fr" style={{ color: "#445566", fontSize: "12px", textDecoration: "none" }}>Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Composant : Mockup app (CSS) ──────────────────────────────────────────────
function AppMockup() {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "360px", margin: "0 auto" }}>
      {/* Téléphone */}
      <div style={{ background: "#0d1f3c", borderRadius: "32px", border: "3px solid rgba(255,140,0,0.3)", padding: "12px", boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,140,0,0.1)" }}>
        {/* Écran */}
        <div style={{ background: D, borderRadius: "24px", overflow: "hidden", minHeight: "480px", padding: "16px" }}>
          {/* Header app */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ color: "white", fontWeight: "900", fontSize: "16px" }}>Artisan<span style={{ color: P }}>+</span></span>
            <span style={{ fontSize: "20px" }}>🔔</span>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
            {[
              { label: "CA ce mois", val: "4 820 €", color: "#4CAF50" },
              { label: "Devis envoyés", val: "12", color: P },
              { label: "Factures", val: "8", color: "#2196F3" },
              { label: "En attente", val: "1 340 €", color: "#FFA500" },
            ].map(s => (
              <div key={s.label} style={{ background: C, borderRadius: "10px", padding: "10px", border: "1px solid rgba(255,140,0,0.1)" }}>
                <div style={{ color: G, fontSize: "9px", marginBottom: "4px" }}>{s.label}</div>
                <div style={{ color: s.color, fontWeight: "800", fontSize: "14px" }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Devis récent */}
          <div style={{ background: C, borderRadius: "12px", padding: "12px", marginBottom: "10px", border: "1px solid rgba(255,140,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ color: "white", fontSize: "11px", fontWeight: "700" }}>DEV-2024-042</span>
              <span style={{ background: "rgba(76,175,80,0.15)", color: "#4CAF50", fontSize: "9px", fontWeight: "700", padding: "2px 7px", borderRadius: "6px" }}>Signé ✓</span>
            </div>
            <div style={{ color: G, fontSize: "10px" }}>Réfection toiture — M. Dupont</div>
            <div style={{ color: P, fontWeight: "800", fontSize: "13px", marginTop: "4px" }}>3 240,00 €</div>
          </div>

          {/* Facture récente */}
          <div style={{ background: C, borderRadius: "12px", padding: "12px", border: "1px solid rgba(255,140,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ color: "white", fontSize: "11px", fontWeight: "700" }}>FAC-2024-038</span>
              <span style={{ background: "rgba(255,165,0,0.15)", color: "#FFA500", fontSize: "9px", fontWeight: "700", padding: "2px 7px", borderRadius: "6px" }}>En attente</span>
            </div>
            <div style={{ color: G, fontSize: "10px" }}>Installation chaudière — Mme Martin</div>
            <div style={{ color: P, fontWeight: "800", fontSize: "13px", marginTop: "4px" }}>1 840,00 €</div>
          </div>
        </div>
      </div>

      {/* Badge flottant */}
      <div style={{ position: "absolute", top: "20px", right: "-20px", background: "rgba(76,175,80,0.9)", color: "white", fontSize: "11px", fontWeight: "700", padding: "8px 12px", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}>
        ✓ Devis signé !
      </div>
      <div style={{ position: "absolute", bottom: "60px", left: "-20px", background: "rgba(255,140,0,0.9)", color: "white", fontSize: "11px", fontWeight: "700", padding: "8px 12px", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}>
        💶 Paiement reçu
      </div>
    </div>
  );
}

// ── Composant : Tableau comparatif ────────────────────────────────────────────
function TableauComparatif({ titre }) {
  return (
    <div id="tarifs" style={{ scrollMarginTop: "80px" }}>
      {titre && <h2 style={{ color: "white", fontSize: "clamp(22px,4vw,32px)", fontWeight: "800", textAlign: "center", marginBottom: "8px" }}>{titre}</h2>}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", minWidth: "600px", borderCollapse: "separate", borderSpacing: 0, background: C, borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,140,0,0.15)" }}>
          <thead>
            <tr>
              <th style={{ padding: "16px 20px", textAlign: "left", color: G, fontSize: "12px", fontWeight: "700", textTransform: "uppercase", background: "#0d1f3c", borderBottom: "1px solid rgba(255,140,0,0.1)" }}>Fonctionnalité</th>
              {COMPARATIF.cols.map(col => (
                <th key={col.nom} style={{ padding: "16px 20px", textAlign: "center", background: col.highlight ? "rgba(255,140,0,0.12)" : "#0d1f3c", borderBottom: `1px solid ${col.highlight ? "rgba(255,140,0,0.4)" : "rgba(255,140,0,0.1)"}`, borderTop: col.highlight ? `3px solid ${P}` : "3px solid transparent" }}>
                  <div style={{ color: col.highlight ? P : "white", fontWeight: "800", fontSize: "15px" }}>{col.nom}</div>
                  <div style={{ color: col.highlight ? P : G, fontSize: "13px", fontWeight: "700", marginTop: "4px" }}>{col.prix}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARATIF.lignes.map((ligne, i) => (
              <tr key={ligne} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                <td style={{ padding: "12px 20px", color: "white", fontSize: "13px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{ligne}</td>
                {COMPARATIF.cols.map(col => {
                  const val = col.values[i];
                  return (
                    <td key={col.nom} style={{ padding: "12px 20px", textAlign: "center", background: col.highlight ? "rgba(255,140,0,0.04)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      {typeof val === "boolean" ? (
                        <span style={{ fontSize: "16px" }}>{val ? "✅" : "❌"}</span>
                      ) : (
                        <span style={{ color: col.highlight ? P : G, fontWeight: col.highlight ? "800" : "600", fontSize: "13px" }}>{val}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Composant : Section CTA ───────────────────────────────────────────────────
function CTASection({ titre, sous }) {
  return (
    <div style={{ background: `linear-gradient(135deg, rgba(255,140,0,0.08) 0%, rgba(10,22,40,0) 100%)`, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "24px", padding: "clamp(40px,6vw,80px) 20px", textAlign: "center", margin: "0 auto", maxWidth: "800px" }}>
      <div style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: "900", color: "white", lineHeight: "1.2", marginBottom: "16px" }}>
        {titre || <>Commencez <span style={{ color: P }}>gratuitement</span> aujourd'hui</>}
      </div>
      <p style={{ color: G, fontSize: "16px", marginBottom: "32px", maxWidth: "500px", margin: "0 auto 32px" }}>
        {sous || "Aucune carte bancaire requise. Essai gratuit sans engagement. 7,99€/mois ensuite pour passer Pro."}
      </p>
      <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
        <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
          style={{ background: P, color: "white", fontWeight: "800", fontSize: "16px", padding: "16px 32px", borderRadius: "14px", textDecoration: "none", transition: "opacity 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          🚀 Essayer gratuitement
        </a>
        <a href="/#tarifs" onClick={e => { e.preventDefault(); navigate("/#tarifs"); }}
          style={{ background: "rgba(255,255,255,0.07)", color: "white", fontWeight: "700", fontSize: "16px", padding: "16px 32px", borderRadius: "14px", textDecoration: "none", border: "1px solid rgba(255,255,255,0.15)" }}>
          Voir les tarifs
        </a>
      </div>
    </div>
  );
}

// ── PAGE : Accueil ────────────────────────────────────────────────────────────
function PageHome() {
  useEffect(() => {
    setPageMeta(
      "Artisan+ | App Devis Factures Artisan - 7,99€/mois",
      "Logiciel devis et factures pour artisans à 7,99€/mois. Moins cher que Tolteck, Obat et ArtisanFacture. Devis, factures, chantiers, mini-site, paiement en ligne.",
      BASE
    );
  }, []);

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px clamp(40px,6vw,80px)", background: `linear-gradient(180deg, rgba(255,140,0,0.04) 0%, transparent 100%)` }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr auto", gap: "60px", alignItems: "center" }}>
          <div>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)", borderRadius: "20px", padding: "6px 14px", marginBottom: "24px" }}>
              <span style={{ color: P, fontSize: "12px", fontWeight: "800" }}>🏆 N°1 des apps artisan les moins chères</span>
            </div>

            <h1 style={{ color: "white", fontSize: "clamp(32px,5vw,56px)", fontWeight: "900", lineHeight: "1.1", margin: "0 0 20px", letterSpacing: "-1px" }}>
              Vos devis et factures<br />
              <span style={{ color: P }}>en 2 minutes</span><br />
              à 7,99€/mois
            </h1>

            <p style={{ color: G, fontSize: "clamp(15px,2vw,18px)", lineHeight: "1.7", marginBottom: "36px", maxWidth: "520px" }}>
              L'application de gestion pour artisans la plus complète et la moins chère du marché. Devis, factures, suivi chantier, mini-site vitrine et paiement en ligne — tout en un.
            </p>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "32px" }}>
              <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
                style={{ background: P, color: "white", fontWeight: "800", fontSize: "16px", padding: "16px 28px", borderRadius: "14px", textDecoration: "none", transition: "transform 0.15s, opacity 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                🚀 Essayer gratuitement
              </a>
              <a href="#comparatif" onClick={e => { e.preventDefault(); document.getElementById("comparatif")?.scrollIntoView({ behavior: "smooth" }); }}
                style={{ background: "rgba(255,255,255,0.06)", color: "white", fontWeight: "700", fontSize: "16px", padding: "16px 28px", borderRadius: "14px", textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)" }}>
                Voir le comparatif
              </a>
            </div>

            {/* Proof points */}
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              {["✅ Sans engagement", "✅ Essai gratuit", "✅ Support inclus"].map(p => (
                <span key={p} style={{ color: G, fontSize: "13px", fontWeight: "600" }}>{p}</span>
              ))}
            </div>
          </div>

          {/* Mockup app */}
          <div style={{ display: "flex", justifyContent: "center", minWidth: "300px" }}>
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <section style={{ background: C, padding: "32px 20px", borderTop: "1px solid rgba(255,140,0,0.1)", borderBottom: "1px solid rgba(255,140,0,0.1)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "24px" }}>
          {[
            { val: "500+",    label: "Artisans actifs" },
            { val: "10 000+", label: "Devis générés" },
            { val: "7,99€",   label: "Par mois seulement" },
            { val: "4.9/5",   label: "Note moyenne" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ color: P, fontWeight: "900", fontSize: "clamp(24px,4vw,36px)" }}>{s.val}</div>
              <div style={{ color: G, fontSize: "13px", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Fonctionnalités ─────────────────────────────────────── */}
      <section id="fonctionnalites" style={{ padding: "clamp(60px,8vw,100px) 20px", scrollMarginTop: "80px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ color: "white", fontSize: "clamp(24px,4vw,38px)", fontWeight: "900", margin: "0 0 16px" }}>
              Tout ce dont un artisan a besoin,<br /><span style={{ color: P }}>dans une seule app</span>
            </h2>
            <p style={{ color: G, fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
              De la création du devis au paiement, en passant par le suivi chantier et la communication client.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
            {FEATURES.map(f => (
              <div key={f.titre} style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "16px", padding: "24px", transition: "border-color 0.2s, transform 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,140,0,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,140,0,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>{f.icon}</div>
                <h3 style={{ color: "white", fontWeight: "800", fontSize: "15px", margin: "0 0 8px" }}>{f.titre}</h3>
                <p style={{ color: G, fontSize: "13px", lineHeight: "1.6", margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparatif ──────────────────────────────────────────── */}
      <section id="comparatif" style={{ padding: "clamp(60px,8vw,100px) 20px", background: `linear-gradient(180deg, rgba(255,140,0,0.03) 0%, transparent 100%)`, scrollMarginTop: "80px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontSize: "clamp(24px,4vw,38px)", fontWeight: "900", margin: "0 0 16px" }}>
              Artisan+ :<br /><span style={{ color: P }}>2× moins cher que la concurrence</span>
            </h2>
            <p style={{ color: G, fontSize: "16px" }}>
              Toutes les fonctionnalités pour 7,99€/mois au lieu de 19€ à 39€ chez nos concurrents.
            </p>
          </div>
          <TableauComparatif />
        </div>
      </section>

      {/* ── Témoignages ─────────────────────────────────────────── */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontSize: "clamp(24px,4vw,38px)", fontWeight: "900", margin: "0 0 12px" }}>
              Ils font confiance à <span style={{ color: P }}>Artisan+</span>
            </h2>
            <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginBottom: "8px" }}>
              {[...Array(5)].map((_, i) => <span key={i} style={{ color: "#FFD700", fontSize: "20px" }}>★</span>)}
            </div>
            <p style={{ color: G, fontSize: "14px" }}>Note moyenne 4,9/5 · Plus de 500 artisans satisfaits</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
            {TEMOIGNAGES.map(t => (
              <div key={t.nom} style={{ background: C, border: "1px solid rgba(255,140,0,0.15)", borderRadius: "20px", padding: "28px" }}>
                <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
                  {[...Array(t.note)].map((_, i) => <span key={i} style={{ color: "#FFD700", fontSize: "16px" }}>★</span>)}
                </div>
                <p style={{ color: "white", fontSize: "14px", lineHeight: "1.7", fontStyle: "italic", margin: "0 0 20px" }}>"{t.texte}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", background: `rgba(255,140,0,0.15)`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                    {t.metier === "Plombier" ? "🔧" : t.metier === "Électricienne" ? "⚡" : "🧱"}
                  </div>
                  <div>
                    <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>{t.nom}</div>
                    <div style={{ color: G, fontSize: "12px" }}>{t.metier} · {t.ville}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Métiers ─────────────────────────────────────────────── */}
      <section id="metiers" style={{ padding: "clamp(60px,8vw,100px) 20px", background: C, scrollMarginTop: "80px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontSize: "clamp(24px,4vw,38px)", fontWeight: "900", margin: "0 0 12px" }}>
              Pour <span style={{ color: P }}>tous les métiers</span> du bâtiment
            </h2>
            <p style={{ color: G, fontSize: "15px" }}>
              Catalogue de prix adapté, modèles de devis spécifiques à votre activité.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px" }}>
            {METIERS.map(m => (
              <a key={m.slug} href={`/devis-facture-${m.slug}`}
                onClick={e => { e.preventDefault(); navigate(`/devis-facture-${m.slug}`); }}
                style={{ background: D, border: "1px solid rgba(255,140,0,0.12)", borderRadius: "14px", padding: "20px 16px", textDecoration: "none", textAlign: "center", transition: "all 0.2s", display: "block" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,140,0,0.4)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,140,0,0.12)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>{m.emoji}</div>
                <div style={{ color: "white", fontWeight: "700", fontSize: "13px" }}>{m.label}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ───────────────────────────────────────────── */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <CTASection />
        </div>
      </section>
    </>
  );
}

// ── PAGE : Métier ─────────────────────────────────────────────────────────────
function PageMetier({ metier }) {
  useEffect(() => {
    const title = `Logiciel devis facture ${metier.label} | Artisan+ à 7,99€/mois`;
    const description = `Créez vos devis et factures de ${metier.desc} en 2 minutes. Logiciel ${metier.kw} Artisan+ à 7,99€/mois. Suivi chantier, mini-site, paiement en ligne inclus.`;
    setPageMeta(title, description, `${BASE}/devis-facture-${metier.slug}`);
  }, [metier]);

  const Icone = metier.emoji;
  return (
    <>
      {/* Hero */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px", background: `linear-gradient(180deg, rgba(255,140,0,0.04) 0%, transparent 100%)` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "56px", marginBottom: "20px" }}>{metier.emoji}</div>
          <h1 style={{ color: "white", fontSize: "clamp(28px,5vw,52px)", fontWeight: "900", lineHeight: "1.15", margin: "0 0 20px" }}>
            {metier.label} ? Gérez vos devis<br />et factures en <span style={{ color: P }}>2 minutes</span>
          </h1>
          <p style={{ color: G, fontSize: "clamp(15px,2vw,18px)", lineHeight: "1.7", marginBottom: "36px", maxWidth: "640px", margin: "0 auto 36px" }}>
            Artisan+ est l'outil de gestion conçu pour {art(metier.art)}{metier.label.toLowerCase()}. Créez des devis professionnels de {metier.desc}, envoyez-les par email, obtenez la signature électronique et encaissez en ligne — le tout à <strong style={{ color: P }}>7,99€/mois</strong>.
          </p>
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
            style={{ display: "inline-block", background: P, color: "white", fontWeight: "800", fontSize: "17px", padding: "16px 36px", borderRadius: "14px", textDecoration: "none" }}>
            🚀 Essayer gratuitement — {metier.label}
          </a>
        </div>
      </section>

      {/* Contenu SEO */}
      <section style={{ padding: "clamp(40px,6vw,80px) 20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px", marginBottom: "60px" }}>
            {[
              { icon: "⚡", titre: `Devis ${metier.desc} en 2 min`, desc: `Catalogue de prix ${metier.desc} intégré. Créez un devis complet en quelques clics, sans saisie répétitive.` },
              { icon: "🧾", titre: "Factures conformes", desc: "Factures légalement conformes avec TVA, acomptes, mentions obligatoires et export PDF professionnel." },
              { icon: "✍️", titre: "Signature en ligne", desc: "Vos clients signent le devis depuis leur téléphone. Plus besoin de rendez-vous pour une signature." },
              { icon: "💶", titre: "Paiement en ligne", desc: "Encaissez par carte bancaire directement depuis la facture. Virements dans les 48h sur votre compte." },
              { icon: "🌐", titre: "Mini-site gratuit", desc: `Votre vitrine en ligne de ${metier.label.toLowerCase()} avec vos réalisations. Recevez des demandes de devis directement.` },
              { icon: "🏗️", titre: "Suivi de chantier", desc: "Gérez vos chantiers de A à Z : photos, coûts, avancement. Partagez l'état d'avancement avec vos clients." },
            ].map(f => (
              <div key={f.titre} style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "16px", padding: "24px" }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>{f.icon}</div>
                <h3 style={{ color: "white", fontWeight: "800", fontSize: "15px", margin: "0 0 8px" }}>{f.titre}</h3>
                <p style={{ color: G, fontSize: "13px", lineHeight: "1.6", margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Bloc texte SEO */}
          <div style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "20px", padding: "36px", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontWeight: "800", fontSize: "22px", margin: "0 0 16px" }}>
              Pourquoi Artisan+ est le meilleur logiciel de gestion pour {art(metier.art)}{metier.label.toLowerCase()} ?
            </h2>
            <div style={{ color: G, fontSize: "14px", lineHeight: "1.8" }}>
              <p>En tant que {metier.kw}, vous faites face à des défis quotidiens : établir des devis rapidement, relancer les clients, suivre les paiements et gérer plusieurs chantiers en même temps. Artisan+ a été conçu pour résoudre exactement ces problèmes.</p>
              <p>Notre logiciel de devis et de facturation pour {metier.kw} vous permet de :</p>
              <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
                <li>Créer un devis de {metier.desc} en moins de 2 minutes grâce à votre catalogue de prix personnel</li>
                <li>Envoyer le devis par email avec signature électronique légalement valide</li>
                <li>Générer la facture en un clic depuis le devis accepté</li>
                <li>Recevoir le paiement par carte bancaire directement depuis la facture</li>
                <li>Suivre vos chantiers de {metier.desc} avec photos et suivi des coûts</li>
                <li>Présenter vos réalisations sur votre mini-site vitrine professionnel</li>
              </ul>
              <p>À <strong style={{ color: P }}>7,99€/mois</strong> seulement (sans engagement), Artisan+ est <strong>2 à 5 fois moins cher</strong> que Tolteck (19€/mois), Obat (39€/mois) ou ArtisanFacture (29€/mois), tout en offrant davantage de fonctionnalités.</p>
            </div>
          </div>

          <TableauComparatif titre={`Artisan+ vs les alternatives pour ${art(metier.art)}${metier.label.toLowerCase()}`} />

          <div style={{ textAlign: "center", marginTop: "60px" }}>
            <CTASection titre={<>Commencez maintenant,<br /><span style={{ color: P }}>{metier.label}</span></>} sous={`Rejoignez les artisans en ${metier.desc} qui font confiance à Artisan+. Essai gratuit, sans carte bancaire.`} />
          </div>
        </div>
      </section>
    </>
  );
}

function art(a) { return a === "l'" ? "l'" : `${a} `; }

// ── PAGE : Ville ──────────────────────────────────────────────────────────────
function PageVille({ ville }) {
  useEffect(() => {
    const title = `Artisan+ ${ville.label} | Logiciel devis facture artisan ${ville.label}`;
    const description = `Logiciel de devis et factures pour artisans à ${ville.label} (${ville.dept}). Gérez votre activité en ${ville.region} à 7,99€/mois. Essai gratuit.`;
    setPageMeta(title, description, `${BASE}/artisan-${ville.slug}`);
  }, [ville]);

  return (
    <>
      {/* Hero */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px", background: `linear-gradient(180deg, rgba(255,140,0,0.04) 0%, transparent 100%)` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📍</div>
          <h1 style={{ color: "white", fontSize: "clamp(28px,5vw,52px)", fontWeight: "900", lineHeight: "1.15", margin: "0 0 20px" }}>
            Artisans à <span style={{ color: P }}>{ville.label}</span>,<br />simplifiez votre gestion
          </h1>
          <p style={{ color: G, fontSize: "clamp(15px,2vw,18px)", lineHeight: "1.7", marginBottom: "36px", maxWidth: "640px", margin: "0 auto 36px" }}>
            Artisan+ est utilisé par des centaines d'artisans en {ville.region}, dont beaucoup à {ville.label}. Devis, factures, chantiers et paiement en ligne à <strong style={{ color: P }}>7,99€/mois</strong> — aucun engagement.
          </p>
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
            style={{ display: "inline-block", background: P, color: "white", fontWeight: "800", fontSize: "17px", padding: "16px 36px", borderRadius: "14px", textDecoration: "none" }}>
            🚀 Démarrer gratuitement à {ville.label}
          </a>
        </div>
      </section>

      {/* Contenu SEO */}
      <section style={{ padding: "clamp(40px,6vw,80px) 20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* Chiffres ville */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "56px" }}>
            {[
              { val: ville.pop, label: `Habitants à ${ville.label}` },
              { val: "7,99€/mois", label: "Prix Artisan+ Pro" },
              { val: "2 min", label: "Pour créer un devis" },
              { val: "100%", label: "Sans engagement" },
            ].map(s => (
              <div key={s.label} style={{ background: C, borderRadius: "14px", padding: "20px", textAlign: "center", border: "1px solid rgba(255,140,0,0.1)" }}>
                <div style={{ color: P, fontWeight: "900", fontSize: "24px" }}>{s.val}</div>
                <div style={{ color: G, fontSize: "12px", marginTop: "4px" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Bloc SEO */}
          <div style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "20px", padding: "36px", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontWeight: "800", fontSize: "22px", margin: "0 0 16px" }}>
              Artisan+ : le logiciel de gestion des artisans à {ville.label}
            </h2>
            <div style={{ color: G, fontSize: "14px", lineHeight: "1.8" }}>
              <p>Vous êtes artisan à {ville.label} (département {ville.dept}, {ville.region}) et vous cherchez un outil simple pour créer vos devis et factures ? Artisan+ est la solution la plus abordable du marché, utilisée par des plombiers, électriciens, maçons, carreleurs, peintres, menuisiers et autres artisans de la région.</p>
              <p>Avec Artisan+, les artisans à {ville.label} peuvent :</p>
              <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
                <li>Créer des devis professionnels en moins de 2 minutes, directement depuis leur smartphone sur le chantier</li>
                <li>Envoyer des factures conformes par email avec signature électronique</li>
                <li>Suivre leurs chantiers en temps réel et partager l'avancement avec leurs clients</li>
                <li>Encaisser par carte bancaire avec Stripe Connect (fonds virés en 48h)</li>
                <li>Créer un mini-site vitrine professionnel pour attirer de nouveaux clients à {ville.label}</li>
              </ul>
              <p>À seulement <strong style={{ color: P }}>7,99€/mois</strong>, Artisan+ est bien moins cher que les alternatives sur le marché — Tolteck (19€/mois), ArtisanFacture (29€/mois) ou Obat (39€/mois).</p>
            </div>
          </div>

          {/* Métiers dans cette ville */}
          <h2 style={{ color: "white", fontWeight: "800", fontSize: "22px", margin: "0 0 24px" }}>
            Artisan+ pour tous les métiers à {ville.label}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px", marginBottom: "56px" }}>
            {METIERS.map(m => (
              <a key={m.slug} href={`/devis-facture-${m.slug}`}
                onClick={e => { e.preventDefault(); navigate(`/devis-facture-${m.slug}`); }}
                style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "12px", padding: "16px 12px", textDecoration: "none", textAlign: "center", display: "block" }}>
                <div style={{ fontSize: "24px", marginBottom: "6px" }}>{m.emoji}</div>
                <div style={{ color: "white", fontSize: "12px", fontWeight: "700" }}>{m.label}</div>
              </a>
            ))}
          </div>

          <TableauComparatif titre={`Comparatif logiciels artisan à ${ville.label}`} />

          <div style={{ textAlign: "center", marginTop: "60px" }}>
            <CTASection titre={<>Artisans à <span style={{ color: P }}>{ville.label}</span>,<br />démarrez gratuitement</>} sous={`Rejoignez les artisans de ${ville.region} sur Artisan+. Essai gratuit, sans carte bancaire, sans engagement.`} />
          </div>
        </div>
      </section>
    </>
  );
}

// ── PAGE : Alternative ────────────────────────────────────────────────────────
function PageAlternative({ concurrent }) {
  useEffect(() => {
    const title = `Alternative à ${concurrent.label} | Artisan+ moins cher à 7,99€/mois`;
    const description = `Vous cherchez une alternative à ${concurrent.label} (${concurrent.prix}) ? Artisan+ offre plus de fonctionnalités à 7,99€/mois. Comparatif complet.`;
    setPageMeta(title, description, `${BASE}/alternative-${concurrent.slug}`);
  }, [concurrent]);

  return (
    <>
      {/* Hero */}
      <section style={{ padding: "clamp(60px,8vw,100px) 20px", background: `linear-gradient(180deg, rgba(255,140,0,0.04) 0%, transparent 100%)` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)", borderRadius: "20px", display: "inline-block", padding: "6px 16px", marginBottom: "20px" }}>
            <span style={{ color: P, fontWeight: "800", fontSize: "13px" }}>Alternative à {concurrent.label}</span>
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(28px,5vw,52px)", fontWeight: "900", lineHeight: "1.15", margin: "0 0 20px" }}>
            Artisan+ vs {concurrent.label} :<br /><span style={{ color: P }}>7,99€/mois au lieu de {concurrent.prix}</span>
          </h1>
          <p style={{ color: G, fontSize: "clamp(15px,2vw,18px)", lineHeight: "1.7", marginBottom: "36px", maxWidth: "640px", margin: "0 auto 36px" }}>
            Artisan+ propose les mêmes fonctionnalités que {concurrent.label} — et même plus — pour un tarif jusqu'à <strong style={{ color: P }}>{Math.round((parseFloat(concurrent.prix) / 7.99 - 1) * 100)}% moins cher</strong>. Découvrez le comparatif complet.
          </p>
          <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}
            style={{ display: "inline-block", background: P, color: "white", fontWeight: "800", fontSize: "17px", padding: "16px 36px", borderRadius: "14px", textDecoration: "none" }}>
            🚀 Essayer Artisan+ gratuitement
          </a>
        </div>
      </section>

      {/* Contenu */}
      <section style={{ padding: "clamp(40px,6vw,80px) 20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* Prix cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "60px" }}>
            <div style={{ background: "rgba(255,140,0,0.08)", border: "2px solid rgba(255,140,0,0.4)", borderRadius: "20px", padding: "32px", textAlign: "center" }}>
              <div style={{ color: P, fontWeight: "900", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>✅ Artisan+</div>
              <div style={{ color: P, fontWeight: "900", fontSize: "42px" }}>7,99€</div>
              <div style={{ color: G, fontSize: "14px" }}>/mois — tout inclus</div>
              <div style={{ marginTop: "16px", color: G, fontSize: "13px", lineHeight: "1.6" }}>
                {FEATURES.slice(0, 4).map(f => <div key={f.titre}>✅ {f.titre}</div>)}
                <div>✅ Mini-site vitrine</div>
                <div>✅ Paiement en ligne</div>
              </div>
            </div>
            <div style={{ background: C, border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "32px", textAlign: "center" }}>
              <div style={{ color: G, fontWeight: "700", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>{concurrent.label}</div>
              <div style={{ color: "white", fontWeight: "900", fontSize: "42px" }}>{concurrent.prix.replace("/mois", "")}</div>
              <div style={{ color: G, fontSize: "14px" }}>/mois</div>
              <div style={{ marginTop: "16px", color: G, fontSize: "13px", lineHeight: "1.6" }}>
                {concurrent.avantages.map(a => <div key={a}>✅ {a}</div>)}
                {concurrent.inconvenients.map(i => <div key={i} style={{ color: "#ff6b6b" }}>❌ {i}</div>)}
              </div>
            </div>
          </div>

          {/* Contenu SEO */}
          <div style={{ background: C, border: "1px solid rgba(255,140,0,0.1)", borderRadius: "20px", padding: "36px", marginBottom: "48px" }}>
            <h2 style={{ color: "white", fontWeight: "800", fontSize: "22px", margin: "0 0 16px" }}>
              Pourquoi choisir Artisan+ plutôt que {concurrent.label} ?
            </h2>
            <div style={{ color: G, fontSize: "14px", lineHeight: "1.8" }}>
              <p>{concurrent.label} est un logiciel de gestion pour artisans bien connu, facturé à {concurrent.prix}. C'est une solution correcte, mais à ce tarif, beaucoup d'artisans cherchent une alternative plus accessible sans sacrifier les fonctionnalités.</p>
              <p>Artisan+ offre à <strong style={{ color: P }}>7,99€/mois</strong> :</p>
              <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
                <li><strong>Devis et factures illimités</strong> avec catalogue de prix personnalisé</li>
                <li><strong>Signature électronique</strong> légalement valide directement depuis le devis</li>
                <li><strong>Suivi de chantier avancé</strong> avec photos, coûts et partage client</li>
                <li><strong>Mini-site vitrine</strong> professionnel pour attirer de nouveaux clients</li>
                <li><strong>Paiement en ligne</strong> par carte bancaire — une fonctionnalité que {concurrent.label} ne propose pas</li>
                <li><strong>Support par chat et email</strong> inclus dans l'abonnement</li>
              </ul>
              <p>En résumé : Artisan+ propose plus de fonctionnalités que {concurrent.label} pour un prix {Math.round((parseFloat(concurrent.prix) / 7.99 - 1) * 100)}% moins élevé. Sans engagement, avec un essai gratuit pour tester avant de s'abonner.</p>
            </div>
          </div>

          <TableauComparatif titre={`Artisan+ vs ${concurrent.label} — comparatif complet`} />

          <div style={{ textAlign: "center", marginTop: "60px" }}>
            <CTASection titre={<>Passez à <span style={{ color: P }}>Artisan+</span>,<br />l'alternative moins chère</>} sous={`Migrez depuis ${concurrent.label} en quelques minutes. Essai gratuit, sans carte bancaire, sans engagement.`} />
          </div>
        </div>
      </section>
    </>
  );
}

// ── PAGE : CGU ────────────────────────────────────────────────────────────────
function PageCGU() {
  useEffect(() => {
    setPageMeta(
      "Conditions Générales d'Utilisation | Artisan+",
      "Conditions générales d'utilisation de l'application Artisan+. Modalités d'abonnement, droits et obligations des utilisateurs.",
      `${BASE}/cgu`
    );
  }, []);

  return (
    <section style={{ padding: "clamp(60px,8vw,80px) 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ color: "white", fontSize: "clamp(24px,4vw,36px)", fontWeight: "900", marginBottom: "8px" }}>Conditions Générales d'Utilisation</h1>
        <p style={{ color: G, fontSize: "13px", marginBottom: "40px" }}>Dernière mise à jour : 1er juin 2025</p>

        {[
          {
            titre: "1. Objet et acceptation",
            contenu: `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de l'application Artisan+ (ci-après "le Service") éditée par Artisan+ SAS. En créant un compte ou en utilisant le Service, l'utilisateur accepte sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le Service.`,
          },
          {
            titre: "2. Description du Service",
            contenu: `Artisan+ est une application web de gestion destinée aux artisans et professionnels du bâtiment. Le Service permet notamment : la création de devis et factures, le suivi de chantiers, la gestion de clients, la publication d'un mini-site vitrine, l'envoi de documents par email, la signature électronique de devis et la réception de paiements en ligne via Stripe Connect.`,
          },
          {
            titre: "3. Accès et compte utilisateur",
            contenu: `L'accès au Service nécessite la création d'un compte. L'utilisateur s'engage à fournir des informations exactes, à maintenir la confidentialité de ses identifiants et à informer immédiatement Artisan+ de toute utilisation non autorisée de son compte. L'accès est personnel et non transférable. Un essai gratuit est disponible avec des fonctionnalités limitées.`,
          },
          {
            titre: "4. Abonnement et tarification",
            contenu: `Le plan Pro est proposé à 7,99€ TTC par mois, facturé mensuellement via Stripe. L'abonnement est sans engagement, résiliable à tout moment depuis les paramètres du compte ou via le portail Stripe. Aucun remboursement n'est effectué pour les périodes en cours. Les prix peuvent être modifiés avec un préavis de 30 jours par email.`,
          },
          {
            titre: "5. Données et responsabilités",
            contenu: `L'utilisateur est seul responsable des données saisies (informations clients, montants, descriptions), de la conformité fiscale et légale de ses documents, et du respect des obligations déclaratives liées à son activité. Artisan+ n'est pas responsable des erreurs dans les documents générés. Il incombe à l'utilisateur de vérifier la conformité de ses devis et factures avec la législation applicable.`,
          },
          {
            titre: "6. Propriété intellectuelle",
            contenu: `L'application Artisan+, ses logos, sa charte graphique et l'ensemble de ses contenus sont protégés par le droit de la propriété intellectuelle. Toute reproduction, représentation ou utilisation non autorisée est strictement interdite. L'utilisateur conserve la propriété de ses données et documents créés via le Service.`,
          },
          {
            titre: "7. Disponibilité et maintenance",
            contenu: `Artisan+ s'efforce d'assurer la disponibilité du Service 24h/24 et 7j/7. Des interruptions peuvent survenir pour maintenance, mise à jour ou en cas de force majeure. Artisan+ ne garantit pas un accès ininterrompu au Service et ne saurait être tenu responsable des dommages résultant d'une indisponibilité.`,
          },
          {
            titre: "8. Résiliation",
            contenu: `L'utilisateur peut résilier son abonnement à tout moment depuis son espace Paramètres > Abonnement, ou en contactant support@artisan-plus.fr. Artisan+ se réserve le droit de suspendre ou de résilier un compte en cas de violation des présentes CGU, d'utilisation abusive ou frauduleuse, sans préavis.`,
          },
          {
            titre: "9. Loi applicable et litiges",
            contenu: `Les présentes CGU sont régies par le droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut d'accord amiable dans un délai de 30 jours, tout litige sera soumis aux tribunaux compétents de Paris.`,
          },
          {
            titre: "10. Contact",
            contenu: `Pour toute question relative aux présentes CGU, vous pouvez contacter Artisan+ à l'adresse : contact@artisan-plus.fr`,
          },
        ].map(s => (
          <div key={s.titre} style={{ marginBottom: "32px" }}>
            <h2 style={{ color: "white", fontWeight: "700", fontSize: "18px", marginBottom: "12px" }}>{s.titre}</h2>
            <p style={{ color: G, fontSize: "14px", lineHeight: "1.8", margin: 0 }}>{s.contenu}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── PAGE : Politique de confidentialité ───────────────────────────────────────
function PageRGPD() {
  useEffect(() => {
    setPageMeta(
      "Politique de Confidentialité RGPD | Artisan+",
      "Politique de confidentialité et protection des données personnelles d'Artisan+. Conformité RGPD, droits des utilisateurs, données collectées.",
      `${BASE}/politique-confidentialite`
    );
  }, []);

  return (
    <section style={{ padding: "clamp(60px,8vw,80px) 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ color: "white", fontSize: "clamp(24px,4vw,36px)", fontWeight: "900", marginBottom: "8px" }}>Politique de Confidentialité</h1>
        <p style={{ color: G, fontSize: "13px", marginBottom: "40px" }}>Dernière mise à jour : 1er juin 2025 — Conforme au Règlement Général sur la Protection des Données (RGPD)</p>

        {[
          {
            titre: "1. Responsable du traitement",
            contenu: `Artisan+ SAS est responsable du traitement de vos données personnelles. Contact : contact@artisan-plus.fr — Vous pouvez nous contacter pour toute question relative à vos données.`,
          },
          {
            titre: "2. Données collectées",
            contenu: `Nous collectons les données suivantes : Données d'identification : nom, prénom, adresse email, numéro de téléphone (si fourni). Données professionnelles : SIRET, numéro de TVA, adresse professionnelle, métier. Données de facturation : informations Stripe pour le paiement de l'abonnement (non stockées en clair chez nous). Données d'utilisation : documents créés (devis, factures), informations clients, photos de chantier. Données techniques : adresse IP, type de navigateur, pages visitées (analytics anonymisés).`,
          },
          {
            titre: "3. Finalités et bases légales",
            contenu: `Vos données sont traitées pour : l'exécution du contrat d'abonnement (base légale : exécution contractuelle), la gestion de votre compte et du Service (base légale : exécution contractuelle), l'envoi de notifications liées au Service (base légale : intérêt légitime), la conformité avec les obligations légales et fiscales (base légale : obligation légale), l'amélioration du Service avec analytics anonymisés (base légale : intérêt légitime).`,
          },
          {
            titre: "4. Hébergement et sous-traitants",
            contenu: `Vos données sont hébergées chez : Supabase (base de données, authentification) — serveurs en Europe (UE). Vercel (hébergement de l'application) — serveurs UE et US avec garanties RGPD. Stripe (paiements) — certifié PCI-DSS, conforme RGPD. Ces sous-traitants sont liés par des clauses contractuelles types conformes au RGPD.`,
          },
          {
            titre: "5. Durée de conservation",
            contenu: `Vos données sont conservées pendant la durée de votre abonnement et 3 ans après la résiliation de votre compte (obligations légales de conservation des données comptables). Les données de logs techniques sont conservées 12 mois. À l'expiration de ces délais, vos données sont supprimées ou anonymisées.`,
          },
          {
            titre: "6. Vos droits RGPD",
            contenu: `Conformément au RGPD, vous disposez des droits suivants : Droit d'accès : obtenir une copie de vos données. Droit de rectification : corriger des données inexactes. Droit à l'effacement : demander la suppression de vos données. Droit à la portabilité : recevoir vos données dans un format structuré. Droit d'opposition : vous opposer à certains traitements. Droit à la limitation : limiter le traitement de vos données. Pour exercer ces droits : contact@artisan-plus.fr. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).`,
          },
          {
            titre: "7. Sécurité",
            contenu: `Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement HTTPS, authentification sécurisée via Supabase Auth, accès aux données restreint par Row Level Security (RLS), mots de passe hashés (bcrypt), clés API jamais exposées côté client.`,
          },
          {
            titre: "8. Cookies",
            contenu: `Artisan+ utilise des cookies strictement nécessaires au fonctionnement du Service (session utilisateur, préférences). Aucun cookie publicitaire ou de suivi tiers n'est utilisé. Vous pouvez configurer votre navigateur pour refuser les cookies, ce qui peut affecter le fonctionnement du Service.`,
          },
          {
            titre: "9. Modifications",
            contenu: `Nous pouvons modifier cette politique de confidentialité. En cas de modification substantielle, vous serez informé par email au moins 30 jours avant l'entrée en vigueur des changements. La poursuite de l'utilisation du Service après cette date vaut acceptation de la nouvelle politique.`,
          },
          {
            titre: "10. Contact DPO",
            contenu: `Pour toute question relative à la protection de vos données personnelles : contact@artisan-plus.fr — Nous nous engageons à répondre dans un délai de 30 jours.`,
          },
        ].map(s => (
          <div key={s.titre} style={{ marginBottom: "32px" }}>
            <h2 style={{ color: "white", fontWeight: "700", fontSize: "18px", marginBottom: "12px" }}>{s.titre}</h2>
            <p style={{ color: G, fontSize: "14px", lineHeight: "1.8", margin: 0 }}>{s.contenu}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Routeur principal ─────────────────────────────────────────────────────────
export default function Vitrine() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const metier     = METIERS.find(m => path === `/devis-facture-${m.slug}`);
  const ville      = VILLES.find(v => path === `/artisan-${v.slug}`);
  const concurrent = CONCURRENTS.find(c => path === `/alternative-${c.slug}`);

  let PageContent;
  if      (metier)                          PageContent = <PageMetier metier={metier} />;
  else if (ville)                           PageContent = <PageVille  ville={ville} />;
  else if (concurrent)                      PageContent = <PageAlternative concurrent={concurrent} />;
  else if (path === "/cgu")                 PageContent = <PageCGU />;
  else if (path === "/politique-confidentialite") PageContent = <PageRGPD />;
  else                                      PageContent = <PageHome />;

  return (
    <div style={{ minHeight: "100vh", background: D, fontFamily: "'Segoe UI', -apple-system, sans-serif", color: "white" }}>
      <Header />
      <main>{PageContent}</main>
      <Footer />
    </div>
  );
}
