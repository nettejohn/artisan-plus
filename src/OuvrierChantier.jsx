/**
 * Page publique accès ouvrier — /ouvrier/:token
 * Pas de compte requis. Vue chantier + ajout photos + pointage heures.
 */
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const PRIMARY = "#FF8C00";
const DARK    = "#0a1628";
const CARD    = "#111e35";

const STATUT_LABELS = {
  en_attente: { label: "En attente", color: "#8899aa", emoji: "⏳" },
  en_cours:   { label: "En cours",   color: PRIMARY,   emoji: "🔨" },
  termine:    { label: "Terminé",    color: "#4CAF50", emoji: "✅" },
  annule:     { label: "Annulé",     color: "#ff6b6b", emoji: "❌" },
};

function compresser(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => resolve(blob), "image/jpeg", 0.82);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function OuvrierChantier({ token }) {
  const [acces,         setAcces]         = useState(null);
  const [chantier,      setChantier]      = useState(null);
  const [pointages,     setPointages]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [erreur,        setErreur]        = useState("");

  // Pointage
  const [heures,        setHeures]        = useState("");
  const [descPt,        setDescPt]        = useState("");
  const [datePt,        setDatePt]        = useState(new Date().toISOString().slice(0,10));
  const [ptLoading,     setPtLoading]     = useState(false);
  const [ptMsg,         setPtMsg]         = useState("");

  // Photos
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMsg,     setUploadMsg]     = useState("");
  const [photosOuvrier, setPhotosOuvrier] = useState([]);
  const [photoModal,    setPhotoModal]    = useState(null);
  const photoRef = useRef(null);

  useEffect(() => { charger(); }, [token]); // eslint-disable-line

  const charger = async () => {
    setLoading(true);

    // Charger l'accès ouvrier par token
    const { data: acc, error: errAcc } = await supabase
      .from("ouvrier_acces")
      .select("*")
      .eq("token", token)
      .eq("actif", true)
      .single();

    if (errAcc || !acc) {
      setErreur("Ce lien est invalide ou a été révoqué par l'artisan.");
      setLoading(false);
      return;
    }
    setAcces(acc);

    // Charger le chantier
    const { data: ch } = await supabase
      .from("chantiers")
      .select("id, nom, statut, adresse, description, avancement, etapes, date_debut, date_fin_prevue, prochaine_intervention")
      .eq("id", acc.chantier_id)
      .single();

    setChantier(ch);

    // Charger les pointages de cet ouvrier
    const { data: pts } = await supabase
      .from("ouvrier_pointages")
      .select("*")
      .eq("ouvrier_token", token)
      .order("date", { ascending: false });

    setPointages(pts || []);

    // Charger les photos de cet ouvrier depuis le storage
    const { data: files } = await supabase.storage
      .from("chantiers-photos")
      .list(`ouvrier/${token}`, { limit: 30, sortBy: { column: "created_at", order: "desc" } });

    if (files && files.length > 0) {
      const urls = files.map(f => {
        const { data: { publicUrl } } = supabase.storage
          .from("chantiers-photos")
          .getPublicUrl(`ouvrier/${token}/${f.name}`);
        return publicUrl;
      });
      setPhotosOuvrier(urls.filter(Boolean));
    }

    setLoading(false);
  };

  const ajouterPointage = async () => {
    if (!heures || isNaN(parseFloat(heures)) || parseFloat(heures) <= 0) {
      setPtMsg("❌ Entrez un nombre d'heures valide");
      return;
    }
    setPtLoading(true);
    setPtMsg("");
    const { data, error } = await supabase.from("ouvrier_pointages").insert({
      ouvrier_token: token,
      chantier_id:   chantier.id,
      nom_ouvrier:   acces.nom_ouvrier || "Ouvrier",
      date:          datePt,
      heures:        parseFloat(heures),
      description:   descPt.trim() || null,
    }).select().single();

    if (error) { setPtMsg("❌ Erreur : " + error.message); }
    else {
      setPointages(prev => [data, ...prev]);
      setHeures("");
      setDescPt("");
      setPtMsg("✅ Pointage ajouté !");
      setTimeout(() => setPtMsg(""), 3000);
    }
    setPtLoading(false);
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    setUploadLoading(true);
    setUploadMsg("");
    try {
      const blob = await compresser(file);
      const ext  = "jpg";
      const path = `ouvrier/${token}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("chantiers-photos")
        .upload(path, blob, { cacheControl: "3600", upsert: false, contentType: "image/jpeg" });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("chantiers-photos").getPublicUrl(path);
      setPhotosOuvrier(prev => [publicUrl, ...prev]);
      setUploadMsg("✅ Photo ajoutée !");
      setTimeout(() => setUploadMsg(""), 3000);
    } catch (e) {
      setUploadMsg("❌ Upload échoué : " + e.message);
    }
    setUploadLoading(false);
    if (photoRef.current) photoRef.current.value = "";
  };

  const totalHeures = pointages.reduce((s, p) => s + (parseFloat(p.heures) || 0), 0);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>👷</div>
        <div style={{ color: "#8899aa" }}>Chargement…</div>
      </div>
    </div>
  );

  if (erreur) return (
    <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: CARD, borderRadius: "20px", padding: "40px", maxWidth: "420px", textAlign: "center", border: "1px solid rgba(255,107,107,0.3)" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>🔒</div>
        <h2 style={{ color: "white", marginBottom: "12px" }}>Accès refusé</h2>
        <p style={{ color: "#8899aa", lineHeight: "1.6" }}>{erreur}</p>
        <div style={{ color: "#556677", fontSize: "12px", marginTop: "24px" }}>Powered by <span style={{ color: PRIMARY, fontWeight: "700" }}>Artisan+</span></div>
      </div>
    </div>
  );

  const statut = STATUT_LABELS[chantier?.statut] || STATUT_LABELS.en_attente;
  const etapes = chantier?.etapes || [];

  return (
    <div style={{ minHeight: "100vh", background: DARK, fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{ background: CARD, borderBottom: "1px solid rgba(255,140,0,0.15)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "20px", fontWeight: "900", color: "white" }}>Artisan<span style={{ color: PRIMARY }}>+</span></div>
        <div style={{ background: "rgba(255,140,0,0.12)", borderRadius: "20px", padding: "6px 14px", color: PRIMARY, fontWeight: "700", fontSize: "12px" }}>
          👷 {acces?.nom_ouvrier || "Ouvrier"}
        </div>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px 16px 80px" }}>

        {/* ── INFO CHANTIER ──────────────────────────────────────── */}
        <div style={{ background: CARD, borderRadius: "20px", padding: "20px", marginBottom: "16px", border: "1px solid rgba(255,140,0,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <div style={{ fontSize: "32px" }}>{statut.emoji}</div>
            <div>
              <h1 style={{ color: "white", fontSize: "20px", margin: 0 }}>{chantier?.nom}</h1>
              <div style={{ color: statut.color, fontSize: "13px", fontWeight: "600", marginTop: "4px" }}>{statut.label}</div>
            </div>
          </div>

          {chantier?.adresse && <div style={{ color: "#8899aa", fontSize: "13px", marginBottom: "8px" }}>📍 {chantier.adresse}</div>}
          {chantier?.avancement > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#8899aa", fontSize: "12px" }}>Avancement</span>
                <span style={{ color: PRIMARY, fontWeight: "700" }}>{chantier.avancement}%</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "6px", height: "8px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${chantier.avancement}%`, background: `linear-gradient(90deg, ${PRIMARY}, #ffb347)`, borderRadius: "6px" }} />
              </div>
            </div>
          )}
          {chantier?.description && (
            <div style={{ color: "#8899aa", fontSize: "13px", lineHeight: "1.5", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
              {chantier.description}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
            {chantier?.date_debut && (
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "8px 12px" }}>
                <div style={{ color: "#8899aa", fontSize: "11px", textTransform: "uppercase", marginBottom: "2px" }}>Début</div>
                <div style={{ color: "white", fontWeight: "600", fontSize: "13px" }}>{new Date(chantier.date_debut).toLocaleDateString("fr-FR")}</div>
              </div>
            )}
            {chantier?.prochaine_intervention && (
              <div style={{ background: "rgba(255,140,0,0.08)", borderRadius: "8px", padding: "8px 12px", border: "1px solid rgba(255,140,0,0.2)" }}>
                <div style={{ color: PRIMARY, fontSize: "11px", textTransform: "uppercase", marginBottom: "2px" }}>Prochaine intervention</div>
                <div style={{ color: "white", fontWeight: "700", fontSize: "13px" }}>{new Date(chantier.prochaine_intervention).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── ÉTAPES ─────────────────────────────────────────────── */}
        {etapes.length > 0 && (
          <div style={{ background: CARD, borderRadius: "16px", padding: "16px", marginBottom: "16px", border: "1px solid rgba(255,140,0,0.12)" }}>
            <h3 style={{ color: "white", fontSize: "15px", margin: "0 0 12px" }}>📋 Étapes</h3>
            {etapes.map((e, i) => {
              const colors = { fait: "#4CAF50", en_cours: PRIMARY, a_venir: "#8899aa" };
              const icons  = { fait: "✅", en_cours: "🔄", a_venir: "⏳" };
              const color  = colors[e.statut] || "#8899aa";
              return (
                <div key={i} style={{ display: "flex", gap: "10px", padding: "8px 0", borderBottom: i < etapes.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <span style={{ fontSize: "16px" }}>{icons[e.statut] || "⏳"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "white", fontSize: "13px", fontWeight: "600" }}>{e.titre}</div>
                    {e.description && <div style={{ color: "#8899aa", fontSize: "11px" }}>{e.description}</div>}
                  </div>
                  <span style={{ color, fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>{e.statut?.replace("_", " ")}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── POINTAGE DES HEURES ─────────────────────────────────── */}
        <div style={{ background: CARD, borderRadius: "20px", padding: "20px", marginBottom: "16px", border: "1px solid rgba(255,140,0,0.2)" }}>
          <h2 style={{ color: "white", fontSize: "17px", margin: "0 0 16px" }}>
            ⏱️ Pointer mes heures
            {totalHeures > 0 && <span style={{ color: PRIMARY, fontSize: "14px", marginLeft: "10px" }}>· {totalHeures.toFixed(1)}h total</span>}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div>
              <label style={{ color: "#8899aa", fontSize: "11px", fontWeight: "600", display: "block", marginBottom: "4px", textTransform: "uppercase" }}>Date</label>
              <input type="date" value={datePt} onChange={e => setDatePt(e.target.value)}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 12px", color: "white", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ color: "#8899aa", fontSize: "11px", fontWeight: "600", display: "block", marginBottom: "4px", textTransform: "uppercase" }}>Heures travaillées</label>
              <input type="number" min="0.5" max="24" step="0.5" value={heures} onChange={e => setHeures(e.target.value)} placeholder="ex : 7.5"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 12px", color: "white", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" }} />
            </div>
          </div>

          <input type="text" value={descPt} onChange={e => setDescPt(e.target.value)} placeholder="Description des travaux (optionnel)"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 12px", color: "white", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", marginBottom: "10px" }} />

          {ptMsg && <div style={{ color: ptMsg.includes("✅") ? "#4CAF50" : "#ff6b6b", fontSize: "13px", marginBottom: "8px" }}>{ptMsg}</div>}

          <button onClick={ajouterPointage} disabled={ptLoading} style={{ width: "100%", background: ptLoading ? "#888" : PRIMARY, color: "white", border: "none", borderRadius: "10px", padding: "13px", cursor: ptLoading ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "15px" }}>
            {ptLoading ? "Enregistrement…" : "✅ Valider mon pointage"}
          </button>

          {/* Historique */}
          {pointages.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>Historique</div>
              {pointages.slice(0, 5).map((pt, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < Math.min(pointages.length, 5) - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div>
                    <div style={{ color: "white", fontSize: "13px", fontWeight: "600" }}>{new Date(pt.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</div>
                    {pt.description && <div style={{ color: "#8899aa", fontSize: "11px" }}>{pt.description}</div>}
                  </div>
                  <div style={{ color: PRIMARY, fontWeight: "700", fontSize: "15px" }}>{pt.heures}h</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── AJOUT PHOTOS ───────────────────────────────────────── */}
        <div style={{ background: CARD, borderRadius: "20px", padding: "20px", marginBottom: "16px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h2 style={{ color: "white", fontSize: "17px", margin: "0 0 14px" }}>📸 Ajouter des photos</h2>

          <label style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            padding: "16px", borderRadius: "10px",
            background: uploadLoading ? "rgba(255,255,255,0.04)" : "rgba(255,140,0,0.08)",
            border: `2px dashed ${uploadLoading ? "rgba(255,255,255,0.1)" : "rgba(255,140,0,0.3)"}`,
            cursor: uploadLoading ? "not-allowed" : "pointer", color: uploadLoading ? "#8899aa" : PRIMARY, fontWeight: "600", fontSize: "14px",
          }}>
            <input ref={photoRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
              onChange={e => { if (e.target.files[0]) uploadPhoto(e.target.files[0]); }} disabled={uploadLoading} />
            {uploadLoading ? "⏳ Upload en cours…" : "📷 Prendre une photo / Choisir"}
          </label>

          {uploadMsg && <div style={{ color: uploadMsg.includes("✅") ? "#4CAF50" : "#ff6b6b", fontSize: "13px", marginTop: "8px", textAlign: "center" }}>{uploadMsg}</div>}

          {photosOuvrier.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginTop: "14px" }}>
              {photosOuvrier.map((url, i) => (
                <div key={i} onClick={() => setPhotoModal(url)} style={{ cursor: "pointer", borderRadius: "8px", overflow: "hidden", aspectRatio: "1" }}>
                  <img src={url} alt={`Photo ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── FOOTER ────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", color: "#556677", fontSize: "12px" }}>
          Accès ouvrier · Powered by <span style={{ color: PRIMARY, fontWeight: "700" }}>Artisan+</span>
        </div>
      </div>

      {/* ── PHOTO PLEIN ÉCRAN ──────────────────────────────────── */}
      {photoModal && (
        <div onClick={() => setPhotoModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={photoModal} alt="Photo" style={{ maxWidth: "95vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px" }} />
          <button onClick={() => setPhotoModal(null)} style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(255,255,255,0.15)", border: "none", color: "white", fontSize: "22px", borderRadius: "50%", width: "44px", height: "44px", cursor: "pointer" }}>✕</button>
        </div>
      )}
    </div>
  );
}
