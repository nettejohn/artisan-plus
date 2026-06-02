/**
 * Page publique de suivi chantier — accessible sans connexion via /suivi/:token
 * Style "suivi de livraison" : propre, lisible, rassurant pour le client.
 */
import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const PRIMARY = "#FF8C00";
const DARK    = "#0a1628";
const CARD    = "#111e35";

const STATUT_LABELS = {
  en_attente: { label: "En attente de démarrage", color: "#8899aa", emoji: "⏳" },
  en_cours:   { label: "Chantier en cours",        color: PRIMARY,   emoji: "🔨" },
  termine:    { label: "Chantier terminé",          color: "#4CAF50", emoji: "✅" },
  annule:     { label: "Annulé",                   color: "#ff6b6b", emoji: "❌" },
};

const ETAPE_STYLE = {
  fait:      { icon: "✅", color: "#4CAF50", bg: "rgba(76,175,80,0.12)",     label: "Terminé"    },
  en_cours:  { icon: "🔄", color: PRIMARY,   bg: "rgba(255,140,0,0.12)",     label: "En cours"   },
  a_venir:   { icon: "⏳", color: "#8899aa", bg: "rgba(136,153,170,0.08)",   label: "À venir"    },
};

function ProgressBar({ value }) {
  return (
    <div style={{ width: "100%", height: "12px", background: "rgba(255,255,255,0.08)", borderRadius: "8px", overflow: "hidden", margin: "10px 0" }}>
      <div style={{
        height: "100%",
        width: `${value}%`,
        background: `linear-gradient(90deg, ${PRIMARY}, #ffb347)`,
        borderRadius: "8px",
        transition: "width 0.6s ease",
        boxShadow: "0 0 10px rgba(255,140,0,0.4)",
      }} />
    </div>
  );
}

export default function SuiviChantier({ token }) {
  const [chantier, setChantier] = useState(null);
  const [photos,   setPhotos]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [erreur,   setErreur]   = useState("");
  const [photoModal, setPhotoModal] = useState(null); // URL de la photo en plein écran

  useEffect(() => {
    charger();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const charger = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("chantiers")
      .select("id, nom, statut, avancement, etapes, prochaine_intervention, description, date_debut, date_fin_prevue")
      .eq("suivi_token", token)
      .eq("suivi_actif", true)
      .single();

    if (error || !data) {
      setErreur("Ce lien de suivi est invalide ou a été désactivé par l'artisan.");
      setLoading(false);
      return;
    }
    setChantier(data);

    // Charger les photos
    const { data: photosData } = await supabase
      .storage.from("chantier-photos")
      .list(`${data.id}`, { limit: 20, sortBy: { column: "created_at", order: "desc" } });

    if (photosData && photosData.length > 0) {
      const urls = photosData.map(f => {
        const { data: { publicUrl } } = supabase.storage
          .from("chantier-photos")
          .getPublicUrl(`${data.id}/${f.name}`);
        return publicUrl;
      });
      setPhotos(urls.filter(Boolean));
    }
    setLoading(false);
  };

  const etapes = chantier?.etapes || [];
  const statut = STATUT_LABELS[chantier?.statut] || STATUT_LABELS.en_attente;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔨</div>
        <div style={{ color: "#8899aa", fontSize: "15px" }}>Chargement du suivi…</div>
      </div>
    </div>
  );

  if (erreur) return (
    <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: CARD, borderRadius: "20px", padding: "40px", maxWidth: "420px", textAlign: "center", border: "1px solid rgba(255,107,107,0.3)" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>🚫</div>
        <h2 style={{ color: "white", marginBottom: "12px" }}>Lien invalide</h2>
        <p style={{ color: "#8899aa", lineHeight: "1.6" }}>{erreur}</p>
        <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "24px" }}>
          Powered by <span style={{ color: PRIMARY, fontWeight: "700" }}>Artisan+</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: DARK, fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{ background: CARD, borderBottom: "1px solid rgba(255,140,0,0.15)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "22px", fontWeight: "900", color: "white" }}>
          Artisan<span style={{ color: PRIMARY }}>+</span>
        </div>
        <div style={{ fontSize: "12px", color: "#8899aa" }}>Suivi de chantier</div>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px 16px 60px" }}>

        {/* ── CARTE PRINCIPALE ─────────────────────────────────── */}
        <div style={{ background: CARD, borderRadius: "20px", padding: "24px", marginBottom: "20px", border: "1px solid rgba(255,140,0,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ fontSize: "36px" }}>{statut.emoji}</div>
            <div>
              <h1 style={{ color: "white", fontSize: "22px", margin: 0, lineHeight: 1.2 }}>{chantier.nom}</h1>
              <div style={{ color: statut.color, fontSize: "13px", fontWeight: "600", marginTop: "4px" }}>{statut.label}</div>
            </div>
          </div>

          {/* Barre d'avancement */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Avancement</div>
              <div style={{ color: PRIMARY, fontSize: "22px", fontWeight: "900" }}>{chantier.avancement ?? 0}%</div>
            </div>
            <ProgressBar value={chantier.avancement ?? 0} />
          </div>

          {/* Dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px" }}>
            {chantier.date_debut && (
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "10px 12px" }}>
                <div style={{ color: "#8899aa", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "4px" }}>Début</div>
                <div style={{ color: "white", fontSize: "14px", fontWeight: "600" }}>
                  {new Date(chantier.date_debut).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                </div>
              </div>
            )}
            {chantier.prochaine_intervention && (
              <div style={{ background: "rgba(255,140,0,0.08)", borderRadius: "10px", padding: "10px 12px", border: "1px solid rgba(255,140,0,0.2)" }}>
                <div style={{ color: PRIMARY, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "4px" }}>Prochaine intervention</div>
                <div style={{ color: "white", fontSize: "14px", fontWeight: "700" }}>
                  {new Date(chantier.prochaine_intervention).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" })}
                </div>
              </div>
            )}
            {chantier.date_fin_prevue && (
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "10px 12px" }}>
                <div style={{ color: "#8899aa", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "4px" }}>Fin prévue</div>
                <div style={{ color: "white", fontSize: "14px", fontWeight: "600" }}>
                  {new Date(chantier.date_fin_prevue).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                </div>
              </div>
            )}
          </div>

          {chantier.description && (
            <div style={{ marginTop: "14px", padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", color: "#8899aa", fontSize: "13px", lineHeight: "1.5" }}>
              {chantier.description}
            </div>
          )}
        </div>

        {/* ── ÉTAPES ───────────────────────────────────────────── */}
        {etapes.length > 0 && (
          <div style={{ background: CARD, borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,140,0,0.15)" }}>
            <h2 style={{ color: "white", fontSize: "17px", margin: "0 0 16px" }}>📋 Étapes des travaux</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              {etapes.map((etape, i) => {
                const s = ETAPE_STYLE[etape.statut] || ETAPE_STYLE.a_venir;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: "14px",
                    padding: "12px 14px", borderRadius: "10px",
                    background: s.bg,
                    position: "relative",
                  }}>
                    {/* Timeline line */}
                    {i < etapes.length - 1 && (
                      <div style={{
                        position: "absolute", left: "27px", top: "44px",
                        width: "2px", height: "calc(100% - 4px)",
                        background: "rgba(255,255,255,0.06)", zIndex: 0,
                      }} />
                    )}
                    <div style={{ fontSize: "20px", flexShrink: 0, zIndex: 1 }}>{s.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>{etape.titre}</div>
                      {etape.description && (
                        <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "2px" }}>{etape.description}</div>
                      )}
                      {etape.date && (
                        <div style={{ color: s.color, fontSize: "11px", marginTop: "4px", fontWeight: "600" }}>
                          {new Date(etape.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                        </div>
                      )}
                    </div>
                    <div style={{ color: s.color, fontSize: "11px", fontWeight: "700", flexShrink: 0, paddingTop: "2px" }}>{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PHOTOS ───────────────────────────────────────────── */}
        {photos.length > 0 && (
          <div style={{ background: CARD, borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid rgba(255,140,0,0.15)" }}>
            <h2 style={{ color: "white", fontSize: "17px", margin: "0 0 14px" }}>📸 Photos du chantier</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
              {photos.map((url, i) => (
                <div key={i} onClick={() => setPhotoModal(url)} style={{ cursor: "pointer", borderRadius: "10px", overflow: "hidden", aspectRatio: "4/3" }}>
                  <img src={url} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.2s" }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginTop: "32px", color: "#556677", fontSize: "12px" }}>
          Suivi de chantier propulsé par <span style={{ color: PRIMARY, fontWeight: "700" }}>Artisan+</span>
          <br />
          <span style={{ fontSize: "11px" }}>Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</span>
        </div>
      </div>

      {/* ── PHOTO PLEIN ÉCRAN ─────────────────────────────────── */}
      {photoModal && (
        <div onClick={() => setPhotoModal(null)} style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.92)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "zoom-out",
        }}>
          <img src={photoModal} alt="Photo plein écran" style={{ maxWidth: "95vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px" }} />
          <button onClick={() => setPhotoModal(null)} style={{
            position: "absolute", top: "20px", right: "20px",
            background: "rgba(255,255,255,0.15)", border: "none",
            color: "white", fontSize: "22px", borderRadius: "50%",
            width: "44px", height: "44px", cursor: "pointer",
          }}>✕</button>
        </div>
      )}
    </div>
  );
}
