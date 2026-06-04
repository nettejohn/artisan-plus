/**
 * EditeurSite — éditeur visuel complet du mini-site artisan
 * - 7 onglets : Style, Contenu, Médias, Services, Avis, Social, Avancé
 * - Aperçu en temps réel avec MiniSiteRenderer
 * - Sauvegarde dans Supabase (mini_sites table)
 * - Upload photos dans bucket logos/{userId}/minisite/...
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import MiniSiteRenderer, { TEMPLATE_LABELS, GOOGLE_FONTS } from "./MiniSiteRenderer";

const PRIMARY = "#FF8C00";
const DARK    = "#0a1628";
const CARD    = "#111e35";

const JOURS = ["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"];
const JOURS_LABEL = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

const DEFAULT_CONFIG = {
  slug: "", actif: false,
  template: "artisan", police: "Inter",
  couleurs: {},
  titre: "", slogan: "", description: "",
  metier: "", zone: "", telephone: "", email: "",
  photo_profil: "", photo_couverture: "", logo: "",
  services: [],
  horaires: {},
  reseaux: { facebook: "", instagram: "", tiktok: "" },
  galerie: [],
  videos: [],
  avantapres: [],
  avis: [],
  stats: { chantiers: 0, annees: 0 },
  badge_verifie: false,
  whatsapp: false,
  whatsapp_message: "Bonjour, je souhaite un devis pour...",
  popup: { actif: false, titre: "", message: "", delai: 3 },
  analytics_id: "",
};

const TABS = [
  { id: "style",    label: "🎨 Style",    short: "Style"    },
  { id: "contenu",  label: "📝 Contenu",  short: "Contenu"  },
  { id: "medias",   label: "📸 Médias",   short: "Médias"   },
  { id: "services", label: "🔧 Services", short: "Services" },
  { id: "avis",     label: "⭐ Avis",     short: "Avis"     },
  { id: "social",   label: "📱 Social",   short: "Social"   },
  { id: "avance",   label: "⚙️ Avancé",   short: "Avancé"   },
];

// ── helpers styles ────────────────────────────────────────────────────────────
const inp = { background: "#0a1628", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "8px", padding: "10px 12px", color: "white", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" };
const lbl = { color: "#8899aa", fontSize: "11px", fontWeight: "600", display: "block", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" };
const row = { display: "flex", flexDirection: "column", gap: "5px", marginBottom: "14px" };

// ── Image upload helper ───────────────────────────────────────────────────────
async function uploadImage(userId, file, subpath) {
  const ext  = file.name.split(".").pop().toLowerCase() || "jpg";
  const path = `${userId}/minisite/${subpath}.${ext}`;
  const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from("logos").getPublicUrl(path);
  return publicUrl + "?t=" + Date.now();
}

// ── UploadBtn helper component ────────────────────────────────────────────────
function UploadBtn({ label, onUrl, userId, subpath, uploading, setUploading }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.25)", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontWeight: "700", color: PRIMARY, cursor: uploading ? "wait" : "pointer" }}>
      {uploading ? "⏳ Upload…" : `📁 ${label}`}
      <input type="file" accept="image/*" hidden disabled={uploading} onChange={async e => {
        const f = e.target.files[0]; if (!f) return;
        setUploading(true);
        try { const url = await uploadImage(userId, f, subpath); onUrl(url); }
        catch (err) { alert("Erreur upload : " + err.message); }
        setUploading(false);
        e.target.value = "";
      }} />
    </label>
  );
}

// ── Toggle component ──────────────────────────────────────────────────────────
function Toggle({ value, onChange, label, sublabel }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", marginBottom: "10px" }}>
      <div>
        <div style={{ color: "white", fontWeight: "600", fontSize: "13px" }}>{label}</div>
        {sublabel && <div style={{ color: "#8899aa", fontSize: "11px" }}>{sublabel}</div>}
      </div>
      <button onClick={() => onChange(!value)} style={{ width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", background: value ? PRIMARY : "rgba(255,255,255,0.15)", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
        <div style={{ position: "absolute", top: "3px", left: value ? "22px" : "3px", width: "18px", height: "18px", background: "white", borderRadius: "50%", transition: "left 0.2s" }} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function EditeurSite({ user, onClose }) {
  const [cfg,          setCfg]          = useState({ ...DEFAULT_CONFIG });
  const [onglet,       setOnglet]       = useState("style");
  const [saving,       setSaving]       = useState(false);
  const [msg,          setMsg]          = useState("");
  const [loading,      setLoading]      = useState(true);
  const [showPreview,  setShowPreview]  = useState(false);
  const [uploadState,  setUploadState]  = useState({});
  const [profil,       setProfil]       = useState({});
  const [realisations, setRealisations] = useState([]);
  const [previewSize,  setPreviewSize]  = useState("mobile"); // mobile | tablet | desktop
  const [isDesktopE,   setIsDesktopE]   = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => setIsDesktopE(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Chargement initial ──────────────────────────────────────────────────────
  useEffect(() => { charger(); }, []); // eslint-disable-line

  const charger = async () => {
    setLoading(true);
    const [{ data: site }, { data: p }, { data: chantiers }] = await Promise.all([
      supabase.from("mini_sites").select("*").eq("user_id", user.id).single(),
      supabase.from("profils").select("nom,telephone,email,logo_url,metier,zone_intervention,description_mini_site,mini_site_slug,mini_site_actif,verification_statut").eq("user_id", user.id).single(),
      supabase.from("chantiers").select("photos,nom").eq("user_id", user.id).not("photos","is",null),
    ]);

    if (p) {
      setProfil(p);
      // Build realisations from chantier photos
      const real = [];
      (chantiers || []).forEach(ch => {
        (ch.photos || []).filter(ph => ph.categorie === "apres" || ph.categorie === "pendant")
          .slice(0, 4).forEach(ph => real.push({ url: ph.url, chantier: ch.nom }));
      });
      setRealisations(real.slice(0, 12));
    }

    if (site) {
      setCfg(prev => ({
        ...prev,
        ...(site.config || {}),
        slug:  site.slug  || prev.slug,
        actif: site.actif || false,
        // defaults from profil if not in config
        titre:       (site.config?.titre)       || p?.nom || "",
        telephone:   (site.config?.telephone)   || p?.telephone || "",
        email:       (site.config?.email)       || p?.email || "",
        metier:      (site.config?.metier)      || p?.metier || "",
        zone:        (site.config?.zone)        || p?.zone_intervention || "",
        description: (site.config?.description) || p?.description_mini_site || "",
        logo:        (site.config?.logo)        || p?.logo_url || "",
        badge_verifie: site.config?.badge_verifie ?? (p?.verification_statut === "verifie"),
      }));
    } else if (p) {
      // First time — pre-fill from profil
      setCfg(prev => ({
        ...prev,
        slug:         p.mini_site_slug  || "",
        actif:        p.mini_site_actif || false,
        titre:        p.nom             || "",
        telephone:    p.telephone       || "",
        email:        p.email           || "",
        metier:       p.metier          || "",
        zone:         p.zone_intervention || "",
        description:  p.description_mini_site || "",
        logo:         p.logo_url        || "",
        badge_verifie: p.verification_statut === "verifie",
      }));
    }
    setLoading(false);
  };

  const set = useCallback((key, val) => setCfg(p => ({ ...p, [key]: val })), []);
  const setDeep = useCallback((key, sub, val) => setCfg(p => ({ ...p, [key]: { ...(p[key] || {}), [sub]: val } })), []);

  const sauvegarder = async () => {
    setSaving(true); setMsg("");
    const { slug, actif, ...configData } = cfg;
    const { error } = await supabase.from("mini_sites").upsert({
      user_id:     user.id,
      slug:        slug?.trim()  || null,
      actif:       actif || false,
      config:      configData,
      updated_at:  new Date().toISOString(),
    }, { onConflict: "user_id" });

    if (!error) {
      // Sync profil basics too
      await supabase.from("profils").upsert({
        user_id:            user.id,
        mini_site_actif:    actif || false,
        mini_site_slug:     slug?.trim() || null,
        metier:             cfg.metier || null,
        zone_intervention:  cfg.zone   || null,
        description_mini_site: cfg.description || null,
      }, { onConflict: "user_id" });
    }

    setSaving(false);
    if (error) setMsg("❌ " + (error.code === "23505" ? "Ce slug est déjà pris" : error.message));
    else { setMsg("✅ Site sauvegardé !"); setTimeout(() => setMsg(""), 3500); }
  };

  // ── Upload helpers ─────────────────────────────────────────────────────────
  const setUL = (key, val) => setUploadState(p => ({ ...p, [key]: val }));

  // ── Preview config (merge avec profil pour données manquantes) ─────────────
  const previewConfig = { ...cfg };

  // ── Widths ─────────────────────────────────────────────────────────────────
  const PREVIEW_W = { mobile: "375px", tablet: "768px", desktop: "100%" };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#8899aa" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎨</div>
        Chargement de l'éditeur…
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: DARK, fontFamily: "'Segoe UI', sans-serif", overflow: "hidden" }}>

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div style={{ background: CARD, borderBottom: "1px solid rgba(255,140,0,0.2)", flexShrink: 0, zIndex: 10 }}>
        {/* Safe area spacer */}
        <div style={{ height: "env(safe-area-inset-top, 0px)" }} />

        {/* Ligne 1 : Retour + Titre + Sauvegarder (toujours visible) */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 12px", height: "52px" }}>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "white", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontSize: "13px", fontWeight: "700", flexShrink: 0, whiteSpace: "nowrap" }}>← Retour</button>
          <div style={{ fontWeight: "800", color: "white", fontSize: isDesktopE ? "15px" : "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>🎨 Éditeur de site</div>
          {cfg.slug && isDesktopE && (
            <a href={`/artisan/${cfg.slug}`} target="_blank" rel="noreferrer" style={{ color: PRIMARY, fontSize: "12px", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>↗ Voir</a>
          )}
          {msg && <span style={{ color: msg.includes("✅") ? "#4CAF50" : "#ff6b6b", fontSize: "12px", fontWeight: "600", flexShrink: 0, maxWidth: isDesktopE ? "none" : "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg}</span>}
          <button onClick={sauvegarder} disabled={saving} style={{ background: saving ? "#555" : PRIMARY, color: "white", border: "none", borderRadius: "8px", padding: "9px 16px", cursor: saving ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "14px", flexShrink: 0, whiteSpace: "nowrap" }}>
            {saving ? "⏳" : "💾 Sauvegarder"}
          </button>
        </div>

        {/* Ligne 2 : Aperçu + tailles (toujours visible, même sur mobile) */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            onClick={() => setShowPreview(p => !p)}
            style={{ background: showPreview ? PRIMARY : "rgba(255,255,255,0.08)", border: "none", color: "white", borderRadius: "7px", padding: "6px 12px", cursor: "pointer", fontSize: "12px", fontWeight: "600", flexShrink: 0 }}
          >
            {showPreview ? "✏️ Éditer" : "👁 Aperçu"}
          </button>
          {cfg.slug && !isDesktopE && (
            <a href={`/artisan/${cfg.slug}`} target="_blank" rel="noreferrer" style={{ color: PRIMARY, fontSize: "12px", textDecoration: "none", padding: "6px 10px", background: "rgba(255,140,0,0.1)", borderRadius: "7px", whiteSpace: "nowrap", flexShrink: 0 }}>↗ Voir le site</a>
          )}
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: "4px" }}>
            {["mobile","tablet","desktop"].map(s => (
              <button key={s} onClick={() => setPreviewSize(s)} style={{ background: previewSize === s ? "rgba(255,140,0,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${previewSize === s ? "rgba(255,140,0,0.4)" : "transparent"}`, color: previewSize === s ? PRIMARY : "#8899aa", borderRadius: "6px", padding: "5px 9px", cursor: "pointer", fontSize: "13px" }}>
                {s === "mobile" ? "📱" : s === "tablet" ? "📟" : "🖥️"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── EDITOR PANEL ──────────────────────────────────────────────── */}
        <div style={{ width: showPreview ? "0" : "100%", maxWidth: "400px", background: DARK, borderRight: "1px solid rgba(255,140,0,0.12)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0, transition: "max-width 0.25s" }}>

          {/* Tab bar */}
          <div style={{ display: "flex", overflowX: "auto", padding: "8px 8px 0", gap: "4px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.06)", scrollbarWidth: "none" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setOnglet(t.id)} style={{ flexShrink: 0, background: onglet === t.id ? PRIMARY : "transparent", border: "none", color: onglet === t.id ? "white" : "#8899aa", borderRadius: "8px 8px 0 0", padding: "8px 12px", cursor: "pointer", fontWeight: "600", fontSize: "12px", whiteSpace: "nowrap" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", scrollbarWidth: "thin", scrollbarColor: "#223 #0a1628" }}>

            {/* ═══════════════════ STYLE ═══════════════════ */}
            {onglet === "style" && (
              <div>
                {/* Templates */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={lbl}>Template</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {TEMPLATE_LABELS.map(t => (
                      <button key={t.id} onClick={() => set("template", t.id)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: cfg.template === t.id ? "rgba(255,140,0,0.15)" : "rgba(255,255,255,0.04)", border: `1.5px solid ${cfg.template === t.id ? PRIMARY : "rgba(255,255,255,0.08)"}`, borderRadius: "10px", cursor: "pointer", textAlign: "left", width: "100%" }}>
                        <span style={{ fontSize: "22px" }}>{t.emoji}</span>
                        <div>
                          <div style={{ color: cfg.template === t.id ? PRIMARY : "white", fontWeight: "700", fontSize: "13px" }}>{t.label}</div>
                          <div style={{ color: "#8899aa", fontSize: "11px" }}>{t.desc}</div>
                        </div>
                        {cfg.template === t.id && <span style={{ marginLeft: "auto", color: PRIMARY, fontSize: "16px" }}>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Police */}
                <div style={row}>
                  <label style={lbl}>Police Google Fonts</label>
                  <select value={cfg.police} onChange={e => set("police", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                    <option value="system">Système (par défaut)</option>
                    {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  {cfg.police && cfg.police !== "system" && (
                    <div style={{ color: "#8899aa", fontSize: "11px" }}>Aperçu : <span style={{ fontFamily: `'${cfg.police}',sans-serif`, color: "white" }}>Artisan professionnel ⚡</span></div>
                  )}
                </div>

                {/* Couleurs personnalisées */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px", marginTop: "4px" }}>
                  <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "600", marginBottom: "12px", textTransform: "uppercase" }}>Couleurs personnalisées (optionnel)</div>
                  {[
                    { key: "primaire", label: "Couleur principale" },
                    { key: "fond",     label: "Couleur de fond"    },
                    { key: "texte",    label: "Couleur du texte"   },
                    { key: "bouton",   label: "Couleur des boutons"},
                  ].map(({ key, label }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                      <input type="color" value={cfg.couleurs?.[key] || "#000000"} onChange={e => setDeep("couleurs", key, e.target.value)}
                        style={{ width: "36px", height: "36px", border: "none", borderRadius: "6px", cursor: "pointer", background: "transparent", padding: 0 }} />
                      <span style={{ color: "white", fontSize: "13px", flex: 1 }}>{label}</span>
                      {cfg.couleurs?.[key] && (
                        <button onClick={() => {
                          const c = { ...cfg.couleurs };
                          delete c[key];
                          set("couleurs", c);
                        }} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer", fontSize: "12px" }}>✕</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => set("couleurs", {})} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#8899aa", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontSize: "11px" }}>
                    Réinitialiser les couleurs
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════════ CONTENU ════════════════════ */}
            {onglet === "contenu" && (
              <div>
                <div style={row}><label style={lbl}>Nom / Titre principal</label><input placeholder="Jean Dupont" value={cfg.titre} onChange={e => set("titre", e.target.value)} style={inp} /></div>
                <div style={row}><label style={lbl}>Slogan</label><input placeholder="Votre plombier de confiance" value={cfg.slogan} onChange={e => set("slogan", e.target.value)} style={inp} /></div>
                <div style={row}><label style={lbl}>Description / Présentation</label><textarea rows={4} placeholder="Décrivez votre activité, votre expérience, vos valeurs…" value={cfg.description} onChange={e => set("description", e.target.value)} style={{ ...inp, resize: "vertical", lineHeight: "1.55" }} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={row}><label style={lbl}>Métier</label><input placeholder="Plombier" value={cfg.metier} onChange={e => set("metier", e.target.value)} style={inp} /></div>
                  <div style={row}><label style={lbl}>Zone</label><input placeholder="Lyon et alentours" value={cfg.zone} onChange={e => set("zone", e.target.value)} style={inp} /></div>
                  <div style={row}><label style={lbl}>Téléphone</label><input placeholder="06 12 34 56 78" value={cfg.telephone} onChange={e => set("telephone", e.target.value)} style={inp} /></div>
                  <div style={row}><label style={lbl}>Email</label><input placeholder="contact@..." value={cfg.email} onChange={e => set("email", e.target.value)} style={inp} /></div>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px", marginTop: "4px" }}>
                  <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "600", marginBottom: "10px", textTransform: "uppercase" }}>Statistiques</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div style={row}>
                      <label style={lbl}>Chantiers réalisés</label>
                      <input type="number" min="0" placeholder="0" value={cfg.stats?.chantiers || ""} onChange={e => setDeep("stats", "chantiers", parseInt(e.target.value) || 0)} style={inp} />
                    </div>
                    <div style={row}>
                      <label style={lbl}>Années d'expérience</label>
                      <input type="number" min="0" placeholder="0" value={cfg.stats?.annees || ""} onChange={e => setDeep("stats", "annees", parseInt(e.target.value) || 0)} style={inp} />
                    </div>
                  </div>
                </div>

                <Toggle value={cfg.badge_verifie} onChange={v => set("badge_verifie", v)} label="🏅 Badge Artisan Vérifié" sublabel="Affiché sur votre carte" />
              </div>
            )}

            {/* ═══════════════════ MÉDIAS ═════════════════════ */}
            {onglet === "medias" && (
              <div>
                {/* Logo */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={lbl}>Logo</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    {cfg.logo && <img src={cfg.logo} alt="logo" style={{ height: "48px", maxWidth: "120px", objectFit: "contain", borderRadius: "6px", background: "rgba(255,255,255,0.05)", padding: "4px" }} />}
                    <UploadBtn label="Logo" userId={user.id} subpath="logo" onUrl={url => set("logo", url)} uploading={!!uploadState.logo} setUploading={v => setUL("logo", v)} />
                    {cfg.logo && <button onClick={() => set("logo", "")} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "12px" }}>✕ Supprimer</button>}
                  </div>
                </div>

                {/* Photo couverture */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={lbl}>Photo de couverture (bannière)</div>
                  {cfg.photo_couverture && (
                    <div style={{ position: "relative", marginBottom: "8px" }}>
                      <img src={cfg.photo_couverture} alt="cover" style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "8px" }} />
                      <button onClick={() => set("photo_couverture", "")} style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.6)", border: "none", color: "white", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontSize: "12px" }}>✕</button>
                    </div>
                  )}
                  <UploadBtn label="Photo couverture" userId={user.id} subpath="cover" onUrl={url => set("photo_couverture", url)} uploading={!!uploadState.cover} setUploading={v => setUL("cover", v)} />
                </div>

                {/* Photo profil */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={lbl}>Photo de profil</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    {cfg.photo_profil && <img src={cfg.photo_profil} alt="profil" style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "50%", border: `2px solid ${PRIMARY}44` }} />}
                    <UploadBtn label="Photo profil" userId={user.id} subpath="profil" onUrl={url => set("photo_profil", url)} uploading={!!uploadState.profil} setUploading={v => setUL("profil", v)} />
                    {cfg.photo_profil && <button onClick={() => set("photo_profil", "")} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "12px" }}>✕</button>}
                  </div>
                </div>

                {/* Galerie */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={lbl}>Galerie photos ({cfg.galerie?.length || 0})</div>
                    <UploadBtn label="Ajouter" userId={user.id} subpath={`galerie/${Date.now()}`} onUrl={url => set("galerie", [...(cfg.galerie || []), { url, titre: "" }])} uploading={!!uploadState.gal} setUploading={v => setUL("gal", v)} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {(cfg.galerie || []).map((g, i) => (
                      <div key={i} style={{ position: "relative", borderRadius: "8px", overflow: "hidden" }}>
                        <img src={g.url} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} />
                        <button onClick={() => set("galerie", cfg.galerie.filter((_, j) => j !== i))} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", color: "white", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", fontSize: "11px" }}>✕</button>
                        <input placeholder="Titre…" value={g.titre || ""} onChange={e => { const ng = [...cfg.galerie]; ng[i] = { ...ng[i], titre: e.target.value }; set("galerie", ng); }}
                          style={{ ...inp, fontSize: "11px", padding: "4px 6px", borderRadius: "0", borderTop: "none" }} />
                      </div>
                    ))}
                  </div>
                  {(cfg.galerie || []).length === 0 && (
                    <div style={{ color: "#8899aa", fontSize: "12px", textAlign: "center", padding: "16px" }}>
                      Aucune photo. Vos photos de chantiers seront affichées automatiquement.
                    </div>
                  )}
                </div>

                {/* Avant/Après */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px", marginTop: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={lbl}>Comparateur Avant/Après ({cfg.avantapres?.length || 0})</div>
                    <button onClick={() => set("avantapres", [...(cfg.avantapres || []), { avant: "", apres: "", titre: "" }])}
                      style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.25)", borderRadius: "6px", padding: "6px 12px", color: PRIMARY, cursor: "pointer", fontSize: "11px", fontWeight: "700" }}>+ Ajouter</button>
                  </div>
                  {(cfg.avantapres || []).map((aa, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px", marginBottom: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <input placeholder="Titre (ex: Salle de bain)" value={aa.titre || ""} onChange={e => { const a=[...cfg.avantapres]; a[i]={...a[i],titre:e.target.value}; set("avantapres",a); }} style={{ ...inp, fontSize: "12px" }} />
                        <button onClick={() => set("avantapres", cfg.avantapres.filter((_,j)=>j!==i))} style={{ marginLeft: "8px", background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "16px" }}>✕</button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div>
                          <div style={{ color: "#8899aa", fontSize: "10px", marginBottom: "4px" }}>AVANT</div>
                          {aa.avant && <img src={aa.avant} alt="avant" style={{ width: "100%", aspectRatio:"16/9", objectFit:"cover", borderRadius: "6px", marginBottom: "4px" }} />}
                          <UploadBtn label="Avant" userId={user.id} subpath={`aa/${i}-avant`} onUrl={url => { const a=[...cfg.avantapres]; a[i]={...a[i],avant:url}; set("avantapres",a); }} uploading={!!uploadState[`aa${i}a`]} setUploading={v=>setUL(`aa${i}a`,v)} />
                        </div>
                        <div>
                          <div style={{ color: "#8899aa", fontSize: "10px", marginBottom: "4px" }}>APRÈS</div>
                          {aa.apres && <img src={aa.apres} alt="apres" style={{ width: "100%", aspectRatio:"16/9", objectFit:"cover", borderRadius: "6px", marginBottom: "4px" }} />}
                          <UploadBtn label="Après" userId={user.id} subpath={`aa/${i}-apres`} onUrl={url => { const a=[...cfg.avantapres]; a[i]={...a[i],apres:url}; set("avantapres",a); }} uploading={!!uploadState[`aa${i}p`]} setUploading={v=>setUL(`aa${i}p`,v)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vidéos */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px", marginTop: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={lbl}>Vidéos YouTube ({cfg.videos?.length || 0})</div>
                    <button onClick={() => set("videos", [...(cfg.videos || []), ""])} style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.25)", borderRadius: "6px", padding: "6px 12px", color: PRIMARY, cursor: "pointer", fontSize: "11px", fontWeight: "700" }}>+ Ajouter</button>
                  </div>
                  {(cfg.videos || []).map((url, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                      <input placeholder="URL YouTube https://youtu.be/..." value={url} onChange={e => { const v=[...cfg.videos]; v[i]=e.target.value; set("videos",v); }} style={{ ...inp, fontSize: "12px" }} />
                      <button onClick={() => set("videos", cfg.videos.filter((_,j)=>j!==i))} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "18px", flexShrink: 0 }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══════════════════ SERVICES ════════════════════ */}
            {onglet === "services" && (
              <div>
                <div style={{ marginBottom: "14px", color: "#8899aa", fontSize: "12px", lineHeight: 1.6 }}>
                  Ajoutez vos prestations. Si vide, une section "Pourquoi nous choisir" par défaut sera affichée.
                </div>
                <button onClick={() => set("services", [...(cfg.services||[]), { titre: "", description: "", icone: "🔧" }])}
                  style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,140,0,0.12)", border: "1px solid rgba(255,140,0,0.3)", borderRadius: "8px", padding: "10px 16px", color: PRIMARY, cursor: "pointer", fontWeight: "700", fontSize: "13px", marginBottom: "14px", width: "100%" }}>
                  + Ajouter une prestation
                </button>
                {(cfg.services || []).map((s, i) => (
                  <div key={i} style={{ background: CARD, borderRadius: "10px", padding: "14px", marginBottom: "10px", border: "1px solid rgba(255,140,0,0.12)" }}>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                      <input placeholder="🔧" value={s.icone || ""} onChange={e => { const ss=[...cfg.services]; ss[i]={...ss[i],icone:e.target.value}; set("services",ss); }} style={{ ...inp, width: "60px", textAlign: "center", fontSize: "18px" }} />
                      <input placeholder="Nom de la prestation" value={s.titre || ""} onChange={e => { const ss=[...cfg.services]; ss[i]={...ss[i],titre:e.target.value}; set("services",ss); }} style={{ ...inp, flex: 1 }} />
                      <button onClick={() => set("services", cfg.services.filter((_,j)=>j!==i))} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "18px", flexShrink: 0 }}>✕</button>
                    </div>
                    <textarea placeholder="Description brève…" value={s.description || ""} onChange={e => { const ss=[...cfg.services]; ss[i]={...ss[i],description:e.target.value}; set("services",ss); }} rows={2} style={{ ...inp, resize: "none", fontSize: "12px" }} />
                  </div>
                ))}
                {(cfg.services || []).length === 0 && (
                  <div style={{ textAlign: "center", color: "#8899aa", padding: "20px", fontSize: "13px" }}>Aucun service ajouté</div>
                )}
              </div>
            )}

            {/* ═══════════════════ AVIS ════════════════════════ */}
            {onglet === "avis" && (
              <div>
                <button onClick={() => set("avis", [...(cfg.avis||[]), { nom: "", note: 5, texte: "", date: new Date().toISOString().slice(0,7) }])}
                  style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,140,0,0.12)", border: "1px solid rgba(255,140,0,0.3)", borderRadius: "8px", padding: "10px 16px", color: PRIMARY, cursor: "pointer", fontWeight: "700", fontSize: "13px", marginBottom: "14px", width: "100%" }}>
                  + Ajouter un avis client
                </button>
                {(cfg.avis || []).map((a, i) => (
                  <div key={i} style={{ background: CARD, borderRadius: "10px", padding: "14px", marginBottom: "10px", border: "1px solid rgba(255,140,0,0.12)" }}>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                      <input placeholder="Nom du client" value={a.nom||""} onChange={e=>{ const aa=[...cfg.avis]; aa[i]={...aa[i],nom:e.target.value}; set("avis",aa); }} style={{ ...inp, flex: 1 }} />
                      <select value={a.note||5} onChange={e=>{ const aa=[...cfg.avis]; aa[i]={...aa[i],note:parseInt(e.target.value)}; set("avis",aa); }} style={{ ...inp, width: "80px", cursor: "pointer" }}>
                        {[5,4,3,2,1].map(n => <option key={n} value={n}>{"★".repeat(n)}</option>)}
                      </select>
                      <button onClick={() => set("avis", cfg.avis.filter((_,j)=>j!==i))} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "18px" }}>✕</button>
                    </div>
                    <textarea placeholder="Commentaire du client…" value={a.texte||""} onChange={e=>{ const aa=[...cfg.avis]; aa[i]={...aa[i],texte:e.target.value}; set("avis",aa); }} rows={2} style={{ ...inp, resize: "none", fontSize: "12px", marginBottom: "8px" }} />
                    <input type="month" value={a.date||""} onChange={e=>{ const aa=[...cfg.avis]; aa[i]={...aa[i],date:e.target.value}; set("avis",aa); }} style={{ ...inp, fontSize: "12px", width: "auto" }} />
                  </div>
                ))}
                {(cfg.avis || []).length === 0 && (
                  <div style={{ textAlign: "center", color: "#8899aa", padding: "20px", fontSize: "13px" }}>Aucun avis ajouté</div>
                )}
              </div>
            )}

            {/* ═══════════════════ SOCIAL ══════════════════════ */}
            {onglet === "social" && (
              <div>
                {/* Réseaux */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={lbl}>Réseaux sociaux</div>
                  {[
                    { key: "facebook",  label: "📘 Facebook",  placeholder: "https://facebook.com/mon-page" },
                    { key: "instagram", label: "📸 Instagram", placeholder: "https://instagram.com/mon-compte" },
                    { key: "tiktok",    label: "🎵 TikTok",    placeholder: "https://tiktok.com/@mon-compte" },
                  ].map(r => (
                    <div key={r.key} style={{ marginBottom: "10px" }}>
                      <label style={lbl}>{r.label}</label>
                      <input placeholder={r.placeholder} value={cfg.reseaux?.[r.key]||""} onChange={e => setDeep("reseaux", r.key, e.target.value)} style={inp} />
                    </div>
                  ))}
                </div>

                {/* WhatsApp */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px" }}>
                  <Toggle value={cfg.whatsapp} onChange={v => set("whatsapp", v)} label="💬 Bouton WhatsApp flottant" sublabel="Visible sur toutes les pages" />
                  {cfg.whatsapp && (
                    <div style={row}>
                      <label style={lbl}>Message pré-rempli WhatsApp</label>
                      <textarea value={cfg.whatsapp_message||""} onChange={e => set("whatsapp_message", e.target.value)} rows={2} style={{ ...inp, resize: "none", fontSize: "12px" }} />
                    </div>
                  )}
                </div>

                {/* Horaires */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px", marginTop: "8px" }}>
                  <div style={lbl}>Horaires d'ouverture</div>
                  {JOURS.map((j, i) => {
                    const h = cfg.horaires?.[j] || {};
                    return (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <button onClick={() => setDeep("horaires", j, { ...h, ouvert: !h.ouvert })}
                          style={{ width: "36px", height: "20px", borderRadius: "10px", border: "none", cursor: "pointer", background: h.ouvert ? PRIMARY : "rgba(255,255,255,0.15)", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                          <div style={{ position: "absolute", top: "2px", left: h.ouvert ? "18px" : "2px", width: "16px", height: "16px", background: "white", borderRadius: "50%", transition: "left 0.2s" }} />
                        </button>
                        <span style={{ color: "white", fontSize: "12px", width: "28px" }}>{JOURS_LABEL[i]}</span>
                        {h.ouvert ? (
                          <>
                            <input type="time" value={h.debut||"08:00"} onChange={e => setDeep("horaires", j, { ...h, debut: e.target.value })} style={{ ...inp, width: "90px", padding: "6px 8px", fontSize: "12px" }} />
                            <span style={{ color: "#8899aa", fontSize: "12px" }}>–</span>
                            <input type="time" value={h.fin||"18:00"} onChange={e => setDeep("horaires", j, { ...h, fin: e.target.value })} style={{ ...inp, width: "90px", padding: "6px 8px", fontSize: "12px" }} />
                          </>
                        ) : (
                          <span style={{ color: "#8899aa", fontSize: "12px" }}>Fermé</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══════════════════ AVANCÉ ══════════════════════ */}
            {onglet === "avance" && (
              <div>
                {/* Slug + Actif */}
                <div style={{ background: "rgba(255,140,0,0.06)", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px" }}>
                  <div style={{ color: PRIMARY, fontWeight: "700", fontSize: "13px", marginBottom: "10px" }}>🌐 Publication du site</div>
                  <div style={row}>
                    <label style={lbl}>Slug (lien public)</label>
                    <div style={{ display: "flex", background: "#0a1628", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "8px", overflow: "hidden" }}>
                      <span style={{ color: "#556677", fontSize: "11px", padding: "10px 10px", whiteSpace: "nowrap", borderRight: "1px solid rgba(255,255,255,0.05)" }}>/artisan/</span>
                      <input value={cfg.slug||""} onChange={e => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"-").replace(/-+/g,"-"))} placeholder="jean-dupont-plombier"
                        style={{ flex: 1, background: "transparent", border: "none", padding: "10px 10px", color: "white", fontSize: "13px", outline: "none" }} />
                    </div>
                  </div>
                  <Toggle value={cfg.actif} onChange={v => set("actif", v)} label="Site publié et visible" sublabel="Accessible par vos clients" />
                </div>

                {/* Popup */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={lbl}>Popup de bienvenue</div>
                  <Toggle value={cfg.popup?.actif} onChange={v => setDeep("popup","actif",v)} label="Afficher un popup" sublabel="Apparaît après quelques secondes" />
                  {cfg.popup?.actif && (
                    <>
                      <div style={row}><label style={lbl}>Titre du popup</label><input placeholder="Offre spéciale !" value={cfg.popup?.titre||""} onChange={e=>setDeep("popup","titre",e.target.value)} style={inp} /></div>
                      <div style={row}><label style={lbl}>Message</label><textarea rows={2} placeholder="Devis gratuit cette semaine…" value={cfg.popup?.message||""} onChange={e=>setDeep("popup","message",e.target.value)} style={{ ...inp, resize: "none" }} /></div>
                      <div style={row}>
                        <label style={lbl}>Délai d'apparition (secondes)</label>
                        <input type="number" min="1" max="60" value={cfg.popup?.delai||3} onChange={e=>setDeep("popup","delai",parseInt(e.target.value)||3)} style={{ ...inp, width: "80px" }} />
                      </div>
                    </>
                  )}
                </div>

                {/* Google Analytics */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={row}>
                    <label style={lbl}>Google Analytics ID</label>
                    <input placeholder="G-XXXXXXXXXX" value={cfg.analytics_id||""} onChange={e => set("analytics_id", e.target.value.trim())} style={inp} />
                    <div style={{ color: "#8899aa", fontSize: "11px" }}>Depuis Google Analytics → Admin → Propriété → ID de mesure</div>
                  </div>
                </div>

                {/* Info compteur */}
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "14px", display: "flex", gap: "10px" }}>
                  <span style={{ fontSize: "20px" }}>👁</span>
                  <div>
                    <div style={{ color: "white", fontSize: "13px", fontWeight: "600" }}>Compteur de visiteurs automatique</div>
                    <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "4px" }}>Chaque visite de votre site est automatiquement comptabilisée et affichée.</div>
                  </div>
                </div>

                {/* DNS info */}
                <div style={{ background: "rgba(255,140,0,0.05)", border: "1px solid rgba(255,140,0,0.15)", borderRadius: "10px", padding: "14px", marginTop: "14px" }}>
                  <div style={{ color: PRIMARY, fontWeight: "700", fontSize: "13px", marginBottom: "8px" }}>🌐 Sous-domaine personnalisé</div>
                  <div style={{ color: "#8899aa", fontSize: "12px", lineHeight: 1.7 }}>
                    Pour que votre site soit accessible sur <strong style={{ color: "white" }}>votre-nom.artisan-plus.fr</strong>, votre slug doit correspondre et le domaine *.artisan-plus.fr doit être configuré dans Vercel.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── PREVIEW PANEL ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: "auto", background: "#080e18", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px", minWidth: 0 }}>
          <div style={{ color: "#556677", fontSize: "11px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>APERÇU EN TEMPS RÉEL</span>
            <span style={{ background: "rgba(255,140,0,0.15)", color: PRIMARY, borderRadius: "4px", padding: "2px 8px", fontSize: "10px" }}>
              {previewSize === "mobile" ? "375px" : previewSize === "tablet" ? "768px" : "100%"}
            </span>
          </div>
          <div style={{
            width: PREVIEW_W[previewSize], maxWidth: "100%",
            background: "white", borderRadius: "12px", overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.1)",
            transition: "width 0.3s",
          }}>
            <MiniSiteRenderer
              config={previewConfig}
              profil={profil}
              realisations={realisations}
              visiteurs={0}
              preview={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
