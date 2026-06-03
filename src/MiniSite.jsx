/**
 * Page publique mini-site artisan — /artisan/:slug
 * Accessible sans connexion. SEO-optimisé.
 */
import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const PRIMARY = "#FF8C00";
const DARK    = "#0a1628";
const CARD    = "#111e35";

const API_URL = import.meta.env.VITE_API_URL || "https://artisan-plus.vercel.app";

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

function StarRating({ n = 5 }) {
  return <span style={{ color: PRIMARY, fontSize: "16px" }}>{"★".repeat(n)}</span>;
}

export default function MiniSite({ slug }) {
  const [artisan,    setArtisan]    = useState(null);
  const [photos,     setPhotos]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [erreur,     setErreur]     = useState("");
  const [devisModal, setDevisModal] = useState(false);
  const [photoModal, setPhotoModal] = useState(null);
  const [devisForm,  setDevisForm]  = useState({ nom: "", email: "", telephone: "", message: "" });
  const [devisMsg,   setDevisMsg]   = useState("");
  const [devisSend,  setDevisSend]  = useState(false);

  useEffect(() => { charger(); }, [slug]); // eslint-disable-line

  const charger = async () => {
    setLoading(true);
    // Charger le profil artisan par slug
    const { data: profil, error } = await supabase
      .from("profils")
      .select("user_id, nom, email, telephone, adresse, logo_url, metier, zone_intervention, description_mini_site, mini_site_actif, verification_statut")
      .eq("mini_site_slug", slug)
      .eq("mini_site_actif", true)
      .single();

    if (error || !profil) {
      setErreur("Cette page n'existe pas ou a été désactivée.");
      setLoading(false);
      return;
    }
    setArtisan(profil);

    // SEO meta injection
    const titre = `${profil.nom || "Artisan"} — ${profil.metier || "Artisan du bâtiment"}`;
    const desc  = profil.description_mini_site || `${profil.metier || "Artisan"} professionnel${profil.zone_intervention ? ` en ${profil.zone_intervention}` : ""}. Demandez votre devis gratuit.`;
    injectMeta(titre, desc, profil.logo_url);

    // Charger les photos "après" de ses chantiers (réalisations)
    const { data: chantiers } = await supabase
      .from("chantiers")
      .select("photos, nom")
      .eq("user_id", profil.user_id)
      .not("photos", "is", null);

    const realisations = [];
    (chantiers || []).forEach(ch => {
      const apres = (ch.photos || []).filter(p => p.categorie === "apres" || p.categorie === "pendant");
      apres.slice(0, 3).forEach(p => realisations.push({ url: p.url, chantier: ch.nom }));
    });
    setPhotos(realisations.slice(0, 12));
    setLoading(false);
  };

  const envoyerDemande = async () => {
    if (!devisForm.nom.trim() || !devisForm.email.trim()) {
      setDevisMsg("❌ Nom et email requis");
      return;
    }
    setDevisSend(true);
    setDevisMsg("");

    // Insérer la demande dans Supabase
    const { error } = await supabase.from("devis_demandes").insert({
      artisan_user_id: artisan.user_id,
      nom_client:      devisForm.nom.trim(),
      email_client:    devisForm.email.trim(),
      telephone_client: devisForm.telephone.trim() || null,
      message:         devisForm.message.trim() || null,
    });

    if (!error && artisan.email) {
      // Notifier l'artisan par email
      try {
        await fetch(`${API_URL}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to:      artisan.email,
            subject: `📩 Nouvelle demande de devis — ${devisForm.nom}`,
            html: `<p>Bonjour,</p>
<p>Vous avez reçu une nouvelle demande de devis via votre page Artisan+ :</p>
<ul>
  <li><strong>Nom :</strong> ${devisForm.nom}</li>
  <li><strong>Email :</strong> ${devisForm.email}</li>
  ${devisForm.telephone ? `<li><strong>Tél :</strong> ${devisForm.telephone}</li>` : ""}
  ${devisForm.message ? `<li><strong>Message :</strong> ${devisForm.message}</li>` : ""}
</ul>
<p>Connectez-vous à <a href="https://artisan-plus.vercel.app">Artisan+</a> pour y répondre.</p>`,
          }),
        });
      } catch { /* email optionnel */ }
    }

    if (error) { setDevisMsg("❌ Erreur d'envoi, réessayez"); }
    else { setDevisMsg("✅ Demande envoyée ! L'artisan vous contactera rapidement."); setDevisForm({ nom: "", email: "", telephone: "", message: "" }); }
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
      <div style={{ background: CARD, borderRadius: "20px", padding: "40px", maxWidth: "420px", textAlign: "center", border: "1px solid rgba(255,107,107,0.3)" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>🚫</div>
        <h2 style={{ color: "white", marginBottom: "12px" }}>Page introuvable</h2>
        <p style={{ color: "#8899aa", lineHeight: "1.6" }}>{erreur}</p>
        <div style={{ color: "#556677", fontSize: "12px", marginTop: "24px" }}>Powered by <span style={{ color: PRIMARY, fontWeight: "700" }}>Artisan+</span></div>
      </div>
    </div>
  );

  const ville = artisan.adresse?.split(",").slice(-2).join(",").trim() || artisan.zone_intervention || "";

  return (
    <div style={{ minHeight: "100vh", background: DARK, fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{ background: CARD, borderBottom: "1px solid rgba(255,140,0,0.15)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "20px", fontWeight: "900", color: "white" }}>Artisan<span style={{ color: PRIMARY }}>+</span></div>
        <button onClick={() => setDevisModal(true)} style={{ background: PRIMARY, color: "white", border: "none", borderRadius: "20px", padding: "10px 20px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
          📋 Demander un devis
        </button>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* ── CARTE ARTISAN ─────────────────────────────────────── */}
        <div style={{ background: CARD, borderRadius: "20px", padding: "28px", marginBottom: "20px", border: "1px solid rgba(255,140,0,0.25)", position: "relative" }}>
          {artisan.verification_statut === "verifie" && (
            <div style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,140,0,0.15)", border: "1.5px solid rgba(255,140,0,0.5)", borderRadius: "20px", padding: "5px 14px", color: PRIMARY, fontWeight: "800", fontSize: "12px" }}>
              ✓ Artisan Vérifié
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            {artisan.logo_url ? (
              <img src={artisan.logo_url} alt="Logo" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "16px", border: "2px solid rgba(255,140,0,0.3)" }} />
            ) : (
              <div style={{ width: "80px", height: "80px", borderRadius: "16px", background: "rgba(255,140,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px" }}>🔨</div>
            )}
            <div>
              <h1 style={{ color: "white", fontSize: "26px", margin: "0 0 4px", fontWeight: "900" }}>{artisan.nom}</h1>
              {artisan.metier && <div style={{ color: PRIMARY, fontWeight: "700", fontSize: "16px", marginBottom: "6px" }}>{artisan.metier}</div>}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {artisan.zone_intervention && (
                  <span style={{ color: "#8899aa", fontSize: "13px" }}>📍 {artisan.zone_intervention}</span>
                )}
                {artisan.telephone && (
                  <a href={`tel:${artisan.telephone}`} style={{ color: "#8899aa", fontSize: "13px", textDecoration: "none" }}>📞 {artisan.telephone}</a>
                )}
              </div>
            </div>
          </div>

          {artisan.description_mini_site && (
            <p style={{ color: "#aabbcc", fontSize: "15px", lineHeight: "1.7", margin: "20px 0 0", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "10px" }}>
              {artisan.description_mini_site}
            </p>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
            <button onClick={() => setDevisModal(true)} style={{ flex: 1, minWidth: "180px", background: PRIMARY, color: "white", border: "none", borderRadius: "12px", padding: "14px", cursor: "pointer", fontWeight: "700", fontSize: "15px" }}>
              📋 Demander un devis gratuit
            </button>
            {artisan.telephone && (
              <a href={`tel:${artisan.telephone}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "14px 20px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white", textDecoration: "none", fontWeight: "600", fontSize: "14px" }}>
                📞 Appeler
              </a>
            )}
          </div>
        </div>

        {/* ── RÉALISATIONS ──────────────────────────────────────── */}
        {photos.length > 0 && (
          <div style={{ background: CARD, borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,140,0,0.15)" }}>
            <h2 style={{ color: "white", fontSize: "17px", margin: "0 0 16px" }}>📸 Réalisations</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px" }}>
              {photos.map((p, i) => (
                <div key={i} onClick={() => setPhotoModal(p)} style={{ cursor: "pointer", borderRadius: "10px", overflow: "hidden", aspectRatio: "1", position: "relative" }}>
                  <img src={p.url} alt={p.chantier} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {p.chantier && (
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "4px 8px", background: "linear-gradient(transparent,rgba(0,0,0,0.7))", color: "white", fontSize: "11px", fontWeight: "600" }}>{p.chantier}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── POURQUOI NOUS CHOISIR ─────────────────────────────── */}
        <div style={{ background: CARD, borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h2 style={{ color: "white", fontSize: "17px", margin: "0 0 16px" }}>⭐ Pourquoi nous choisir ?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
            {[
              { emoji: "⚡", titre: "Réactivité", desc: "Devis sous 24h, intervention rapide" },
              { emoji: "🛡️", titre: "Garantie", desc: "Travaux garantis, assurance décennale" },
              { emoji: "💬", titre: "Suivi", desc: "Vous êtes informé à chaque étape" },
              { emoji: "💰", titre: "Tarifs clairs", desc: "Devis détaillé sans surprise" },
            ].map((v, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "14px" }}>
                <div style={{ fontSize: "24px", marginBottom: "6px" }}>{v.emoji}</div>
                <div style={{ color: "white", fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>{v.titre}</div>
                <div style={{ color: "#8899aa", fontSize: "12px" }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ───────────────────────────────────────────────── */}
        <div style={{ background: `linear-gradient(135deg, rgba(255,140,0,0.2), rgba(255,140,0,0.05))`, border: "1px solid rgba(255,140,0,0.35)", borderRadius: "20px", padding: "28px", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>📋</div>
          <h2 style={{ color: "white", fontSize: "20px", margin: "0 0 8px" }}>Un projet en tête ?</h2>
          <p style={{ color: "#8899aa", margin: "0 0 20px", fontSize: "14px" }}>Demandez votre devis gratuit en 2 minutes.</p>
          <button onClick={() => setDevisModal(true)} style={{ background: PRIMARY, color: "white", border: "none", borderRadius: "14px", padding: "16px 32px", cursor: "pointer", fontWeight: "800", fontSize: "16px" }}>
            Demander un devis gratuit
          </button>
        </div>

        {/* ── FOOTER ────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginTop: "32px", color: "#556677", fontSize: "12px" }}>
          Page propulsée par <span style={{ color: PRIMARY, fontWeight: "700" }}>Artisan+</span>
          {ville && <> · {ville}</>}
        </div>
      </div>

      {/* ── MODAL DEVIS ───────────────────────────────────────── */}
      {devisModal && (
        <div onClick={() => setDevisModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: CARD, borderRadius: "20px 20px 0 0", padding: "28px", width: "100%", maxWidth: "480px", border: "1px solid rgba(255,140,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "white", margin: 0, fontSize: "18px" }}>📋 Demande de devis</h3>
              <button onClick={() => setDevisModal(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontSize: "18px" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { key: "nom",       label: "Votre nom *",    placeholder: "Jean Dupont",          type: "text" },
                { key: "email",     label: "Email *",        placeholder: "jean@example.com",     type: "email" },
                { key: "telephone", label: "Téléphone",      placeholder: "06 12 34 56 78",       type: "tel" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "4px" }}>{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={devisForm[f.key]}
                    onChange={e => setDevisForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ background: "#0a1628", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "12px 14px", color: "white", fontSize: "15px", outline: "none", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div>
                <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "4px" }}>Description du projet</label>
                <textarea
                  placeholder="Décrivez vos travaux, surface, délais souhaités…"
                  value={devisForm.message}
                  onChange={e => setDevisForm(p => ({ ...p, message: e.target.value }))}
                  rows={4}
                  style={{ background: "#0a1628", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "12px 14px", color: "white", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>
              {devisMsg && (
                <div style={{ color: devisMsg.includes("✅") ? "#4CAF50" : "#ff6b6b", fontSize: "13px", textAlign: "center" }}>{devisMsg}</div>
              )}
              <button onClick={envoyerDemande} disabled={devisSend} style={{ background: devisSend ? "#888" : PRIMARY, color: "white", border: "none", borderRadius: "12px", padding: "15px", cursor: devisSend ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "16px" }}>
                {devisSend ? "Envoi…" : "📤 Envoyer ma demande"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PHOTO PLEIN ÉCRAN ──────────────────────────────────── */}
      {photoModal && (
        <div onClick={() => setPhotoModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={photoModal.url} alt={photoModal.chantier} style={{ maxWidth: "95vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px" }} />
          <button onClick={() => setPhotoModal(null)} style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(255,255,255,0.15)", border: "none", color: "white", fontSize: "22px", borderRadius: "50%", width: "44px", height: "44px", cursor: "pointer" }}>✕</button>
        </div>
      )}
    </div>
  );
}
