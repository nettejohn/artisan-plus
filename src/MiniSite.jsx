/**
 * Page publique mini-site artisan — /artisan/:slug (ou sous-domaine)
 * Accessible sans connexion. SEO-optimisé.
 * Utilise mini_sites table pour le config riche, fallback vers profils.
 */
import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import MiniSiteRenderer from "./MiniSiteRenderer";

const DARK = "#0a1628";
const API_URL = import.meta.env.VITE_API_URL || "https://www.artisan-plus.fr";

function injectMeta(title, description, image) {
  document.title = title;
  const setMeta = (name, content, prop = false) => {
    const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    let el = document.querySelector(sel);
    if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
    el.setAttribute("content", content);
  };
  setMeta("description", description);
  setMeta("og:title", title, true);
  setMeta("og:description", description, true);
  setMeta("og:type", "website", true);
  if (image) setMeta("og:image", image, true);
}

export default function MiniSite({ slug }) {
  const [config,       setConfig]       = useState(null);
  const [profil,       setProfil]       = useState(null);
  const [realisations, setRealisations] = useState([]);
  const [visiteurs,    setVisiteurs]    = useState(0);
  const [siteUserId,   setSiteUserId]   = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [erreur,       setErreur]       = useState("");
  const [devisModal,   setDevisModal]   = useState(false);
  const [devisForm,    setDevisForm]    = useState({ nom: "", email: "", telephone: "", message: "" });
  const [devisMsg,     setDevisMsg]     = useState("");
  const [devisSend,    setDevisSend]    = useState(false);

  useEffect(() => { charger().catch(() => { setErreur("Erreur de chargement, réessayez."); setLoading(false); }); }, [slug]); // eslint-disable-line

  const charger = async () => {
    setLoading(true);
    setErreur("");

    // ── 1. Essayer mini_sites ────────────────────────────────────────────
    const { data: site, error: errSite } = await supabase
      .from("mini_sites")
      .select("*")
      .eq("slug", slug)
      .eq("actif", true)
      .single();

    if (errSite) console.warn("[MiniSite] mini_sites query error:", errSite.code, errSite.message, "slug=", slug);

    if (site) {
      const cfg = site.config || {};
      setConfig(cfg);
      setSiteUserId(site.user_id);
      setVisiteurs(site.visites || 0);

      // Load profil for email / fallback fields
      const { data: p } = await supabase
        .from("profils")
        .select("nom,email,telephone,adresse,logo_url,metier,zone_intervention,description_mini_site,verification_statut")
        .eq("user_id", site.user_id)
        .single();
      setProfil(p || {});

      // SEO
      const nom   = cfg.titre || p?.nom || "Artisan";
      const metier = cfg.metier || p?.metier || "Artisan";
      const zone  = cfg.zone  || p?.zone_intervention || "";
      injectMeta(
        `${nom} — ${metier}${zone ? ` à ${zone}` : ""}`,
        cfg.description || p?.description_mini_site || `${metier} professionnel${zone ? ` en ${zone}` : ""}. Devis gratuit.`,
        cfg.photo_couverture || cfg.logo || p?.logo_url || null,
      );

      // Load chantier photos (réalisations)
      const { data: chantiers } = await supabase
        .from("chantiers")
        .select("photos,nom")
        .eq("user_id", site.user_id)
        .not("photos","is",null);
      const real = [];
      (chantiers || []).forEach(ch => {
        (ch.photos || []).filter(ph => ph.categorie === "apres" || ph.categorie === "pendant")
          .slice(0, 4).forEach(ph => real.push({ url: ph.url, chantier: ch.nom }));
      });
      setRealisations(real.slice(0, 12));

      // Increment visitor count (non-blocking)
      supabase.rpc("increment_visites", { p_slug: slug }).catch(() => {});
      setLoading(false);
      return;
    }

    // ── 2. Fallback: profils table ───────────────────────────────────────
    const { data: p, error } = await supabase
      .from("profils")
      .select("user_id,nom,email,telephone,adresse,logo_url,metier,zone_intervention,description_mini_site,mini_site_actif,verification_statut")
      .eq("mini_site_slug", slug)
      .eq("mini_site_actif", true)
      .single();

    if (error) console.warn("[MiniSite] profils query error:", error.code, error.message, "slug=", slug);
    if (!p) console.warn("[MiniSite] profils: no row found for slug=", slug);

    if (error || !p) {
      // Diagnostic : RLS bloquant ou slug/actif incorrects
      const isRls = error?.code === "42501" || error?.code === "PGRST301" || error?.message?.includes("permission");
      setErreur(isRls
        ? "Configuration requise : contactez le support (code RLS)"
        : "Cette page n'existe pas ou a été désactivée."
      );
      setLoading(false);
      return;
    }

    setProfil(p);
    setSiteUserId(p.user_id);
    // Build minimal config from profil
    setConfig({
      template: "artisan",
      titre: p.nom || "",
      metier: p.metier || "",
      zone: p.zone_intervention || "",
      telephone: p.telephone || "",
      email: p.email || "",
      description: p.description_mini_site || "",
      logo: p.logo_url || "",
      badge_verifie: p.verification_statut === "verifie",
    });

    // SEO
    injectMeta(
      `${p.nom || "Artisan"} — ${p.metier || "Artisan"}${p.zone_intervention ? ` à ${p.zone_intervention}` : ""}`,
      p.description_mini_site || `${p.metier || "Artisan"} professionnel. Devis gratuit.`,
      p.logo_url || null,
    );

    // Chantier photos
    const { data: chantiers } = await supabase
      .from("chantiers")
      .select("photos,nom")
      .eq("user_id", p.user_id)
      .not("photos","is",null);
    const real = [];
    (chantiers || []).forEach(ch => {
      (ch.photos || []).filter(ph => ph.categorie === "apres" || ph.categorie === "pendant")
        .slice(0, 4).forEach(ph => real.push({ url: ph.url, chantier: ch.nom }));
    });
    setRealisations(real.slice(0, 12));

    setLoading(false);
  };

  // ── Envoi demande de devis ───────────────────────────────────────────────
  const envoyerDemande = async () => {
    if (!devisForm.nom.trim() || !devisForm.email.trim()) { setDevisMsg("❌ Nom et email requis"); return; }
    setDevisSend(true); setDevisMsg("");
    const { error } = await supabase.from("devis_demandes").insert({
      artisan_user_id:  siteUserId,
      nom_client:       devisForm.nom.trim(),
      email_client:     devisForm.email.trim(),
      telephone_client: devisForm.telephone.trim() || null,
      message:          devisForm.message.trim()   || null,
    });
    if (!error && profil?.email) {
      try {
        await fetch(`${API_URL}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to:      profil.email,
            subject: `📩 Nouvelle demande de devis — ${devisForm.nom}`,
            html: `<p>Bonjour,</p><p>Nouvelle demande de devis via votre mini-site Artisan+ :</p>
<ul>
  <li><strong>Nom :</strong> ${devisForm.nom}</li>
  <li><strong>Email :</strong> ${devisForm.email}</li>
  ${devisForm.telephone ? `<li><strong>Tél :</strong> ${devisForm.telephone}</li>` : ""}
  ${devisForm.message ? `<li><strong>Message :</strong> ${devisForm.message}</li>` : ""}
</ul>
<p>Connectez-vous à <a href="https://www.artisan-plus.fr">Artisan+</a> pour y répondre.</p>`,
          }),
        });
      } catch { /* email optionnel */ }
    }
    if (error) { setDevisMsg("❌ Erreur d'envoi, réessayez"); }
    else { setDevisMsg("✅ Demande envoyée !"); setDevisForm({ nom: "", email: "", telephone: "", message: "" }); }
    setDevisSend(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔨</div>
        <div style={{ color: "#8899aa" }}>Chargement…</div>
      </div>
    </div>
  );

  if (erreur) return (
    <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#111e35", borderRadius: "20px", padding: "40px", maxWidth: "420px", textAlign: "center", border: "1px solid rgba(255,107,107,0.3)" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>🚫</div>
        <h2 style={{ color: "white", marginBottom: "12px" }}>Page introuvable</h2>
        <p style={{ color: "#8899aa", lineHeight: "1.6" }}>{erreur}</p>
        <div style={{ color: "#556677", fontSize: "12px", marginTop: "24px" }}>Powered by <span style={{ color: "#FF8C00", fontWeight: "700" }}>Artisan+</span></div>
      </div>
    </div>
  );

  return (
    <>
      <MiniSiteRenderer
        config={config}
        profil={profil}
        realisations={realisations}
        visiteurs={visiteurs}
        preview={false}
        onDevisClick={() => setDevisModal(true)}
      />

      {/* ── MODAL DEVIS ─────────────────────────────────────────────────── */}
      {devisModal && (
        <div onClick={() => setDevisModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#111e35", borderRadius: "20px 20px 0 0", padding: "28px", width: "100%", maxWidth: "480px", border: "1px solid rgba(255,140,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "white", margin: 0, fontSize: "18px" }}>📋 Demande de devis</h3>
              <button onClick={() => setDevisModal(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontSize: "18px" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { key: "nom",       label: "Votre nom *",    placeholder: "Jean Dupont",       type: "text"  },
                { key: "email",     label: "Email *",        placeholder: "jean@example.com",  type: "email" },
                { key: "telephone", label: "Téléphone",      placeholder: "06 12 34 56 78",    type: "tel"   },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "4px" }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={devisForm[f.key]}
                    onChange={e => setDevisForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ background: "#0a1628", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "12px 14px", color: "white", fontSize: "15px", outline: "none", width: "100%", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "4px" }}>Description du projet</label>
                <textarea placeholder="Décrivez vos travaux…" value={devisForm.message} onChange={e => setDevisForm(p => ({ ...p, message: e.target.value }))} rows={3}
                  style={{ background: "#0a1628", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "12px 14px", color: "white", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", resize: "vertical" }} />
              </div>
              {devisMsg && <div style={{ color: devisMsg.includes("✅") ? "#4CAF50" : "#ff6b6b", fontSize: "13px", textAlign: "center" }}>{devisMsg}</div>}
              <button onClick={envoyerDemande} disabled={devisSend} style={{ background: devisSend ? "#888" : "#FF8C00", color: "white", border: "none", borderRadius: "12px", padding: "15px", cursor: devisSend ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "16px" }}>
                {devisSend ? "Envoi…" : "📤 Envoyer ma demande"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
