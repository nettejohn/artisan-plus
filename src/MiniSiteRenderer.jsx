/**
 * MiniSiteRenderer — rendu public du mini-site artisan
 * Supporte 5 templates, 20+ polices Google, toutes les sections
 * Props:
 *   config       — objet config complet (mini_sites.config)
 *   profil       — données profils (nom, email, telephone, logo_url, etc.)
 *   realisations — [{url, chantier}] depuis chantiers.photos
 *   visiteurs    — nombre de visiteurs (mini_sites.visites)
 *   preview      — si true : désactive GA + popup + compteur
 *   onDevisClick — callback bouton devis (optionnel)
 */
import { useState, useEffect, useRef, useCallback } from "react";

// ── 5 Themes ─────────────────────────────────────────────────────────────────
const THEMES = {
  artisan: {
    bg: "#0a1628", surface: "#111e35", surfaceAlt: "#0d1a2e",
    primary: "#FF8C00", text: "#ffffff", subtext: "#8899aa",
    border: "rgba(255,140,0,0.2)", shadow: "0 4px 20px rgba(0,0,0,0.3)",
    heroOverlay: "rgba(10,22,40,0.65)", gradient: "linear-gradient(135deg,rgba(255,140,0,0.18),rgba(255,140,0,0.04))",
    inputBg: "#081220",
  },
  pro: {
    bg: "#f4f6fb", surface: "#ffffff", surfaceAlt: "#eaeff7",
    primary: "#1E4FD8", text: "#1a1a2e", subtext: "#6b7280",
    border: "rgba(30,79,216,0.15)", shadow: "0 2px 12px rgba(0,0,0,0.07)",
    heroOverlay: "rgba(20,35,80,0.52)", gradient: "linear-gradient(135deg,rgba(30,79,216,0.12),rgba(30,79,216,0.03))",
    inputBg: "#f0f4fb",
  },
  nature: {
    bg: "#0d1f0f", surface: "#152718", surfaceAlt: "#0f2012",
    primary: "#4CAF50", text: "#e8f5e9", subtext: "#81c784",
    border: "rgba(76,175,80,0.25)", shadow: "0 4px 16px rgba(0,0,0,0.4)",
    heroOverlay: "rgba(10,25,12,0.58)", gradient: "linear-gradient(135deg,rgba(76,175,80,0.18),rgba(76,175,80,0.04))",
    inputBg: "#0c1b0e",
  },
  luxe: {
    bg: "#0c0c0c", surface: "#191919", surfaceAlt: "#141414",
    primary: "#D4AF37", text: "#f5f0e0", subtext: "#b8a060",
    border: "rgba(212,175,55,0.25)", shadow: "0 4px 24px rgba(0,0,0,0.6)",
    heroOverlay: "rgba(8,8,8,0.62)", gradient: "linear-gradient(135deg,rgba(212,175,55,0.18),rgba(212,175,55,0.04))",
    inputBg: "#0a0a0a",
  },
  dynamique: {
    bg: "#ffffff", surface: "#f6f3ff", surfaceAlt: "#ede8ff",
    primary: "#7C3AED", text: "#1a1a2e", subtext: "#6b7280",
    border: "rgba(124,58,237,0.15)", shadow: "0 2px 16px rgba(124,58,237,0.1)",
    heroOverlay: "rgba(30,12,80,0.52)", gradient: "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(124,58,237,0.04))",
    inputBg: "#f0ecff",
  },
};

export const TEMPLATE_LABELS = [
  { id: "artisan",   label: "Artisan",   emoji: "🔨", desc: "Sombre & orange — style Artisan+" },
  { id: "pro",       label: "Pro",       emoji: "💼", desc: "Clair & bleu — B2B / corporate"   },
  { id: "nature",    label: "Nature",    emoji: "🌿", desc: "Vert forêt — éco-responsable"     },
  { id: "luxe",      label: "Luxe",      emoji: "✨", desc: "Noir & or — haut de gamme"        },
  { id: "dynamique", label: "Dynamique", emoji: "⚡", desc: "Blanc & violet — moderne"         },
];

export const GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Raleway", "Poppins",
  "Playfair Display", "Source Sans Pro", "Nunito", "Ubuntu", "Oswald",
  "Merriweather", "PT Sans", "Work Sans", "Quicksand", "Josefin Sans",
  "Exo 2", "Bebas Neue", "Pacifico",
];

function getTheme(templateId, couleurs) {
  const base = THEMES[templateId] || THEMES.artisan;
  return {
    ...base,
    primary: couleurs?.primaire || base.primary,
    bg:      couleurs?.fond     || base.bg,
    text:    couleurs?.texte    || base.text,
    btnBg:   couleurs?.bouton   || couleurs?.primaire || base.primary,
  };
}

function ff(police) {
  if (!police || police === "system") return "system-ui,'Segoe UI',sans-serif";
  return `'${police}', sans-serif`;
}

// ── Before/After Slider ───────────────────────────────────────────────────────
function BeforeAfterSlider({ avant, apres, titre, T }) {
  const [pos, setPos] = useState(50);
  const ref  = useRef(null);
  const drag = useRef(false);

  const move = useCallback((clientX) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)));
  }, []);

  useEffect(() => {
    const mm = e => { if (drag.current) move(e.clientX); };
    const tm = e => { if (drag.current) move(e.touches[0].clientX); };
    const up = () => { drag.current = false; };
    window.addEventListener("mousemove", mm);
    window.addEventListener("touchmove", tm, { passive: true });
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("touchmove", tm);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, [move]);

  return (
    <div>
      {titre && <div style={{ color: T.text, fontWeight: "700", fontSize: "15px", marginBottom: "10px" }}>{titre}</div>}
      <div
        ref={ref}
        style={{ position: "relative", paddingBottom: "56.25%", overflow: "hidden", borderRadius: "14px", cursor: "ew-resize", userSelect: "none" }}
        onMouseDown={e => { drag.current = true; move(e.clientX); }}
        onTouchStart={e => { drag.current = true; move(e.touches[0].clientX); }}
      >
        <img src={avant} alt="Avant" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <img src={apres} alt="Après" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        {/* Labels */}
        <div style={{ position: "absolute", top: 10, left: 12, background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: "11px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", letterSpacing: "0.5px" }}>AVANT</div>
        <div style={{ position: "absolute", top: 10, right: 12, background: T.primary, color: "#fff", fontSize: "11px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", letterSpacing: "0.5px" }}>APRÈS</div>
        {/* Divider */}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pos}%`, transform: "translateX(-50%)", width: "2px", background: "white", pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "36px", height: "36px", background: "white", borderRadius: "50%", boxShadow: "0 2px 10px rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: "16px", fontWeight: "700" }}>⟺</div>
        </div>
      </div>
    </div>
  );
}

// ── Star Rating ───────────────────────────────────────────────────────────────
function Stars({ n = 5, primary }) {
  return (
    <span style={{ color: primary, fontSize: "15px", letterSpacing: "1px" }}>
      {"★".repeat(Math.max(0, Math.min(5, n)))}{"☆".repeat(Math.max(0, 5 - n))}
    </span>
  );
}

// ── Inject Google Font ────────────────────────────────────────────────────────
function injectFont(police) {
  if (!police || police === "system") return;
  const id = "gf-" + police.replace(/\s+/g, "_");
  if (document.getElementById(id)) return;
  const l = document.createElement("link");
  l.id = id; l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${police.replace(/ /g, "+")}:wght@400;600;700;900&display=swap`;
  document.head.appendChild(l);
}

// ── Inject Google Analytics ───────────────────────────────────────────────────
function injectGA(id) {
  if (!id || window._gaInjected) return;
  window._gaInjected = true;
  const s = document.createElement("script");
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  s.async = true;
  document.head.appendChild(s);
  s.onload = () => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id);
  };
}

// ── DAYS ─────────────────────────────────────────────────────────────────────
const JOURS = ["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"];
const JOURS_LABEL = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function MiniSiteRenderer({
  config = {},
  profil = {},
  realisations = [],
  visiteurs = 0,
  preview = false,
  onDevisClick,
}) {
  const T  = getTheme(config.template, config.couleurs);
  const FN = ff(config.police);

  const [popupOuvert, setPopupOuvert] = useState(false);
  const [photoModal,  setPhotoModal]  = useState(null);
  const [devisModal,  setDevisModal]  = useState(false);
  const [devisForm,   setDevisForm]   = useState({ nom: "", email: "", telephone: "", message: "" });
  const [devisMsg,    setDevisMsg]    = useState("");
  const [devisSend,   setDevisSend]   = useState(false);

  // Google Font injection
  useEffect(() => { injectFont(config.police); }, [config.police]);

  // GA injection
  useEffect(() => { if (!preview && config.analytics_id) injectGA(config.analytics_id); }, [config.analytics_id, preview]);

  // Popup timer
  useEffect(() => {
    if (preview || !config.popup?.actif) return;
    const delay = Math.max(1, config.popup.delai || 3) * 1000;
    const t = setTimeout(() => setPopupOuvert(true), delay);
    return () => clearTimeout(t);
  }, [preview, config.popup?.actif, config.popup?.delai]);

  // Resolved values
  const nom        = config.titre      || profil.nom       || "Artisan";
  const metier     = config.metier     || profil.metier    || "";
  const zone       = config.zone       || profil.zone_intervention || "";
  const telephone  = config.telephone  || profil.telephone || "";
  const emailArt   = config.email      || profil.email     || "";
  const slogan     = config.slogan     || "";
  const description= config.description|| profil.description_mini_site || "";
  const logo       = config.logo       || profil.logo_url  || "";
  const photoProfil= config.photo_profil || "";
  const photoCover = config.photo_couverture || "";
  const badgeVerif = config.badge_verifie || (profil.verification_statut === "verifie");
  const services   = config.services   || [];
  const galerie    = [...(config.galerie || []), ...realisations.map(r => ({ url: r.url, titre: r.chantier || "" }))];
  const avantapres = config.avantapres || [];
  const avis       = config.avis       || [];
  const reseaux    = config.reseaux    || {};
  const horaires   = config.horaires   || {};
  const videos     = config.videos     || [];
  const stats      = config.stats      || {};
  const whatsapp   = config.whatsapp && telephone;
  const waMsg      = encodeURIComponent(config.whatsapp_message || `Bonjour ${nom}, je souhaite un devis.`);
  const waUrl      = `https://wa.me/${telephone.replace(/\D/g, "")}?text=${waMsg}`;

  const ouvrirDevis = () => {
    if (onDevisClick) { onDevisClick(); return; }
    setDevisModal(true);
  };

  // ── Sections visibles ─────────────────────────────────────────────────────
  const hasHoraires = JOURS.some(j => horaires[j]?.ouvert);
  const hasReseaux  = !!(reseaux.facebook || reseaux.instagram || reseaux.tiktok);
  const hasStats    = (stats.chantiers > 0) || (stats.annees > 0);

  // ── Card style helpers ────────────────────────────────────────────────────
  const card = { background: T.surface, borderRadius: "18px", padding: "24px", border: `1px solid ${T.border}`, boxShadow: T.shadow, marginBottom: "20px" };
  const sectionTitle = { color: T.text, fontSize: "20px", fontWeight: "800", margin: "0 0 18px" };
  const btn = { background: T.btnBg || T.primary, color: "#fff", border: "none", borderRadius: "12px", padding: "14px 28px", cursor: "pointer", fontWeight: "700", fontSize: "15px", fontFamily: FN };

  return (
    <div style={{ fontFamily: FN, background: T.bg, color: T.text, minHeight: "100vh", position: "relative" }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {logo && <img src={logo} alt="Logo" style={{ height: "36px", maxWidth: "80px", objectFit: "contain", borderRadius: "6px" }} />}
          <div style={{ fontWeight: "900", fontSize: "17px", color: T.text }}>
            {nom}{metier && <span style={{ color: T.primary, fontWeight: "600", fontSize: "13px", marginLeft: "8px" }}>{metier}</span>}
          </div>
        </div>
        <button onClick={ouvrirDevis} style={{ ...btn, padding: "9px 18px", fontSize: "13px", borderRadius: "20px" }}>
          📋 Devis gratuit
        </button>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: "relative", minHeight: "380px", display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        background: photoCover ? "transparent" : `linear-gradient(135deg, ${T.bg}, ${T.surface})`,
      }}>
        {photoCover && (
          <img src={photoCover} alt="Couverture" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: T.heroOverlay }} />
        <div style={{ position: "relative", textAlign: "center", padding: "60px 20px", maxWidth: "700px" }}>
          <h1 style={{ color: "#fff", fontSize: "clamp(28px,6vw,52px)", fontWeight: "900", margin: "0 0 12px", lineHeight: 1.15, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            {slogan || (metier ? `${metier} professionnel` : nom)}
          </h1>
          {zone && <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "16px", marginBottom: "12px" }}>📍 {zone}</div>}
          {description && <p style={{ color: "rgba(255,255,255,0.78)", fontSize: "15px", lineHeight: 1.7, margin: "0 0 24px", maxWidth: "540px", marginLeft: "auto", marginRight: "auto" }}>{description.slice(0, 200)}{description.length > 200 ? "…" : ""}</p>}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={ouvrirDevis} style={{ ...btn, fontSize: "16px", padding: "15px 32px" }}>📋 Demander un devis gratuit</button>
            {telephone && (
              <a href={`tel:${telephone}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "15px 24px", background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: "12px", color: "#fff", textDecoration: "none", fontWeight: "700", fontSize: "15px", backdropFilter: "blur(6px)" }}>
                📞 {telephone}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENU ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "28px 16px 80px" }}>

        {/* ── ARTISAN CARD ──────────────────────────────────────────────── */}
        <div style={{ ...card, position: "relative" }}>
          {badgeVerif && (
            <div style={{ position: "absolute", top: 16, right: 16, background: `${T.primary}22`, border: `1.5px solid ${T.primary}88`, borderRadius: "20px", padding: "5px 14px", color: T.primary, fontWeight: "800", fontSize: "12px" }}>
              ✓ Artisan Vérifié
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            {(photoProfil || logo) && (
              <img src={photoProfil || logo} alt={nom} style={{ width: "84px", height: "84px", objectFit: "cover", borderRadius: "50%", border: `3px solid ${T.primary}66` }} />
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ color: T.text, fontSize: "24px", margin: "0 0 4px", fontWeight: "900" }}>{nom}</h2>
              {metier && <div style={{ color: T.primary, fontWeight: "700", fontSize: "16px", marginBottom: "6px" }}>{metier}</div>}
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                {zone      && <span style={{ color: T.subtext, fontSize: "13px" }}>📍 {zone}</span>}
                {telephone && <a href={`tel:${telephone}`} style={{ color: T.subtext, fontSize: "13px", textDecoration: "none" }}>📞 {telephone}</a>}
                {emailArt  && <a href={`mailto:${emailArt}`} style={{ color: T.subtext, fontSize: "13px", textDecoration: "none" }}>✉️ {emailArt}</a>}
              </div>
            </div>
          </div>

          {description && (
            <p style={{ color: T.subtext, fontSize: "14px", lineHeight: 1.75, margin: "18px 0 0", padding: "14px", background: `${T.surfaceAlt}`, borderRadius: "10px" }}>{description}</p>
          )}

          {/* Stats */}
          {hasStats && (
            <div style={{ display: "flex", gap: "16px", marginTop: "18px", flexWrap: "wrap" }}>
              {stats.chantiers > 0 && (
                <div style={{ flex: 1, minWidth: "100px", textAlign: "center", padding: "14px", background: T.surfaceAlt, borderRadius: "12px" }}>
                  <div style={{ color: T.primary, fontSize: "28px", fontWeight: "900" }}>{stats.chantiers}+</div>
                  <div style={{ color: T.subtext, fontSize: "12px", marginTop: "2px" }}>chantiers réalisés</div>
                </div>
              )}
              {stats.annees > 0 && (
                <div style={{ flex: 1, minWidth: "100px", textAlign: "center", padding: "14px", background: T.surfaceAlt, borderRadius: "12px" }}>
                  <div style={{ color: T.primary, fontSize: "28px", fontWeight: "900" }}>{stats.annees}</div>
                  <div style={{ color: T.subtext, fontSize: "12px", marginTop: "2px" }}>années d'expérience</div>
                </div>
              )}
              {visiteurs > 0 && (
                <div style={{ flex: 1, minWidth: "100px", textAlign: "center", padding: "14px", background: T.surfaceAlt, borderRadius: "12px" }}>
                  <div style={{ color: T.primary, fontSize: "28px", fontWeight: "900" }}>{visiteurs}</div>
                  <div style={{ color: T.subtext, fontSize: "12px", marginTop: "2px" }}>visiteurs</div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "18px", flexWrap: "wrap" }}>
            <button onClick={ouvrirDevis} style={{ ...btn, flex: 1, minWidth: "180px" }}>📋 Demander un devis gratuit</button>
            {telephone && (
              <a href={`tel:${telephone}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "14px 20px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: "12px", color: T.text, textDecoration: "none", fontWeight: "600", fontSize: "14px" }}>
                📞 Appeler
              </a>
            )}
          </div>
        </div>

        {/* ── SERVICES ─────────────────────────────────────────────────── */}
        {services.length > 0 ? (
          <div style={card}>
            <h2 style={sectionTitle}>🔧 Nos services</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
              {services.map((s, i) => (
                <div key={i} style={{ background: T.surfaceAlt, borderRadius: "12px", padding: "16px", border: `1px solid ${T.border}` }}>
                  {s.icone && <div style={{ fontSize: "26px", marginBottom: "8px" }}>{s.icone}</div>}
                  <div style={{ color: T.text, fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>{s.titre}</div>
                  {s.description && <div style={{ color: T.subtext, fontSize: "12px", lineHeight: 1.55 }}>{s.description}</div>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Fallback: "Pourquoi nous choisir" */
          <div style={card}>
            <h2 style={sectionTitle}>⭐ Pourquoi nous choisir ?</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "12px" }}>
              {[
                { emoji: "⚡", titre: "Réactivité", desc: "Devis sous 24h, intervention rapide" },
                { emoji: "🛡️", titre: "Garantie",   desc: "Travaux garantis, assurance décennale" },
                { emoji: "💬", titre: "Suivi",      desc: "Vous êtes informé à chaque étape" },
                { emoji: "💰", titre: "Tarifs clairs", desc: "Devis détaillé sans surprise" },
              ].map((v, i) => (
                <div key={i} style={{ background: T.surfaceAlt, borderRadius: "12px", padding: "16px" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>{v.emoji}</div>
                  <div style={{ color: T.text, fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>{v.titre}</div>
                  <div style={{ color: T.subtext, fontSize: "12px", lineHeight: 1.55 }}>{v.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── GALERIE ──────────────────────────────────────────────────── */}
        {galerie.length > 0 && (
          <div style={card}>
            <h2 style={sectionTitle}>📸 Réalisations</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px" }}>
              {galerie.slice(0, 12).map((p, i) => (
                <div key={i} onClick={() => setPhotoModal(p)} style={{ cursor: "zoom-in", borderRadius: "10px", overflow: "hidden", aspectRatio: "1", position: "relative" }}>
                  <img src={p.url} alt={p.titre || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {p.titre && (
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "4px 8px", background: "linear-gradient(transparent,rgba(0,0,0,0.72))", color: "#fff", fontSize: "11px", fontWeight: "600" }}>{p.titre}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AVANT / APRÈS ────────────────────────────────────────────── */}
        {avantapres.length > 0 && (
          <div style={card}>
            <h2 style={sectionTitle}>🔄 Avant / Après</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {avantapres.filter(p => p.avant && p.apres).map((pair, i) => (
                <BeforeAfterSlider key={i} avant={pair.avant} apres={pair.apres} titre={pair.titre} T={T} />
              ))}
            </div>
          </div>
        )}

        {/* ── AVIS CLIENTS ─────────────────────────────────────────────── */}
        {avis.length > 0 && (
          <div style={card}>
            <h2 style={sectionTitle}>💬 Avis clients</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {avis.map((a, i) => (
                <div key={i} style={{ background: T.surfaceAlt, borderRadius: "12px", padding: "16px", border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ color: T.text, fontWeight: "700", fontSize: "14px" }}>{a.nom}</div>
                    <Stars n={a.note || 5} primary={T.primary} />
                  </div>
                  {a.texte && <p style={{ color: T.subtext, fontSize: "13px", lineHeight: 1.6, margin: "0 0 6px" }}>{a.texte}</p>}
                  {a.date && <div style={{ color: T.subtext, fontSize: "11px", opacity: 0.7 }}>{a.date}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VIDÉOS ───────────────────────────────────────────────────── */}
        {videos.length > 0 && (
          <div style={card}>
            <h2 style={sectionTitle}>🎥 Vidéos</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {videos.map((url, i) => {
                // Convert YouTube URL to embed
                const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
                const embedUrl = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}` : url;
                return (
                  <div key={i} style={{ borderRadius: "12px", overflow: "hidden", paddingBottom: "56.25%", position: "relative", background: "#000" }}>
                    <iframe src={embedUrl} title={`Vidéo ${i + 1}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── HORAIRES ─────────────────────────────────────────────────── */}
        {hasHoraires && (
          <div style={card}>
            <h2 style={sectionTitle}>🕐 Horaires d'ouverture</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {JOURS.map((j, i) => {
                const h = horaires[j];
                return (
                  <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", background: T.surfaceAlt, borderRadius: "8px" }}>
                    <span style={{ color: T.text, fontWeight: "600", fontSize: "13px", minWidth: "80px" }}>{JOURS_LABEL[i]}</span>
                    <span style={{ color: h?.ouvert ? T.primary : T.subtext, fontSize: "13px", fontWeight: h?.ouvert ? "600" : "400" }}>
                      {h?.ouvert ? `${h.debut || "08:00"} – ${h.fin || "18:00"}` : "Fermé"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RÉSEAUX SOCIAUX ──────────────────────────────────────────── */}
        {hasReseaux && (
          <div style={{ ...card, textAlign: "center" }}>
            <h2 style={sectionTitle}>📱 Suivez-nous</h2>
            <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
              {reseaux.facebook && (
                <a href={reseaux.facebook} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 20px", background: "#1877F2", borderRadius: "12px", color: "#fff", textDecoration: "none", fontWeight: "700", fontSize: "14px" }}>
                  <span style={{ fontSize: "20px" }}>📘</span> Facebook
                </a>
              )}
              {reseaux.instagram && (
                <a href={reseaux.instagram} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 20px", background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", borderRadius: "12px", color: "#fff", textDecoration: "none", fontWeight: "700", fontSize: "14px" }}>
                  <span style={{ fontSize: "20px" }}>📸</span> Instagram
                </a>
              )}
              {reseaux.tiktok && (
                <a href={reseaux.tiktok} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 20px", background: "#010101", borderRadius: "12px", color: "#fff", textDecoration: "none", fontWeight: "700", fontSize: "14px", border: "1px solid #333" }}>
                  <span style={{ fontSize: "20px" }}>🎵</span> TikTok
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <div style={{ ...card, background: T.gradient, textAlign: "center", border: `1px solid ${T.primary}55` }}>
          <div style={{ fontSize: "38px", marginBottom: "10px" }}>📋</div>
          <h2 style={{ color: T.text, fontSize: "22px", margin: "0 0 8px", fontWeight: "900" }}>Un projet en tête ?</h2>
          <p style={{ color: T.subtext, margin: "0 0 20px", fontSize: "14px", lineHeight: 1.6 }}>Devis gratuit et sans engagement en 2 minutes.</p>
          <button onClick={ouvrirDevis} style={{ ...btn, fontSize: "16px", padding: "16px 36px" }}>Demander un devis gratuit</button>
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginTop: "32px", color: T.subtext, fontSize: "12px" }}>
          Page propulsée par <span style={{ color: "#FF8C00", fontWeight: "700" }}>Artisan+</span>
          {zone && <> · {zone}</>}
          {visiteurs > 0 && <> · {visiteurs} visiteurs</>}
        </div>
      </div>

      {/* ── WHATSAPP BUTTON ──────────────────────────────────────────────── */}
      {whatsapp && (
        <a href={waUrl} target="_blank" rel="noreferrer" style={{ position: "fixed", bottom: "24px", right: "24px", width: "56px", height: "56px", background: "#25D366", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(37,211,102,0.4)", textDecoration: "none", zIndex: 999, fontSize: "28px" }}>
          💬
        </a>
      )}

      {/* ── POPUP ─────────────────────────────────────────────────────────── */}
      {popupOuvert && config.popup?.actif && (
        <div onClick={() => setPopupOuvert(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: "20px", padding: "32px", maxWidth: "400px", width: "100%", border: `1px solid ${T.border}`, position: "relative" }}>
            <button onClick={() => setPopupOuvert(false)} style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(255,255,255,0.1)", border: "none", color: T.text, borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px" }}>✕</button>
            <div style={{ fontSize: "40px", textAlign: "center", marginBottom: "12px" }}>🎉</div>
            <h3 style={{ color: T.text, textAlign: "center", margin: "0 0 10px", fontSize: "20px", fontWeight: "800" }}>{config.popup.titre || "Offre spéciale !"}</h3>
            <p style={{ color: T.subtext, textAlign: "center", margin: "0 0 22px", lineHeight: 1.6 }}>{config.popup.message || "Contactez-nous pour un devis gratuit."}</p>
            <button onClick={() => { setPopupOuvert(false); ouvrirDevis(); }} style={{ ...btn, width: "100%", fontSize: "15px", padding: "13px" }}>
              📋 Demander un devis
            </button>
          </div>
        </div>
      )}

      {/* ── PHOTO PLEIN ÉCRAN ──────────────────────────────────────────────── */}
      {photoModal && (
        <div onClick={() => setPhotoModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={photoModal.url} alt={photoModal.titre || ""} style={{ maxWidth: "95vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px" }} />
          <div style={{ position: "absolute", bottom: "20px", color: "#fff", fontSize: "13px", fontWeight: "600", textAlign: "center", padding: "0 20px" }}>{photoModal.titre}</div>
          <button onClick={() => setPhotoModal(null)} style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: "22px", borderRadius: "50%", width: "44px", height: "44px", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* ── MODAL DEVIS (si pas de callback externe) ────────────────────── */}
      {devisModal && (
        <div onClick={() => setDevisModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: "20px 20px 0 0", padding: "28px", width: "100%", maxWidth: "480px", border: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: T.text, margin: 0, fontSize: "18px" }}>📋 Demande de devis</h3>
              <button onClick={() => setDevisModal(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: T.text, borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { key: "nom",       label: "Votre nom *",    placeholder: "Jean Dupont",       type: "text"  },
                { key: "email",     label: "Email *",        placeholder: "jean@example.com",  type: "email" },
                { key: "telephone", label: "Téléphone",      placeholder: "06 12 34 56 78",    type: "tel"   },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: T.subtext, fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "4px" }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={devisForm[f.key]}
                    onChange={e => setDevisForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ background: T.inputBg || T.bg, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "12px 14px", color: T.text, fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: FN }} />
                </div>
              ))}
              <div>
                <label style={{ color: T.subtext, fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "4px" }}>Description du projet</label>
                <textarea placeholder="Décrivez vos travaux…" value={devisForm.message} onChange={e => setDevisForm(p => ({ ...p, message: e.target.value }))} rows={3}
                  style={{ background: T.inputBg || T.bg, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "12px 14px", color: T.text, fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: FN }} />
              </div>
              {devisMsg && <div style={{ color: devisMsg.includes("✅") ? "#4CAF50" : "#ff6b6b", fontSize: "13px", textAlign: "center" }}>{devisMsg}</div>}
              <button disabled={devisSend} onClick={async () => {
                if (!devisForm.nom.trim() || !devisForm.email.trim()) { setDevisMsg("❌ Nom et email requis"); return; }
                setDevisSend(true);
                // The actual send is handled by the parent (MiniSite.jsx)
                // In preview mode, just show success
                if (preview) { setDevisMsg("✅ (Mode aperçu — envoi désactivé)"); setDevisSend(false); return; }
                setDevisMsg("✅ Demande envoyée !");
                setDevisSend(false);
              }} style={{ ...btn, width: "100%", fontSize: "15px", padding: "13px", opacity: devisSend ? 0.6 : 1 }}>
                {devisSend ? "Envoi…" : "📤 Envoyer ma demande"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
