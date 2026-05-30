import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const PRIMARY = "#FF8C00";
const DARK    = "#0a1628";
const CARD    = "#111e35";

const STATUTS = {
  en_attente: { label: "En attente", color: "#8899aa", bg: "rgba(136,153,170,0.15)" },
  en_cours:   { label: "En cours",   color: "#FF8C00", bg: "rgba(255,140,0,0.15)"   },
  termine:    { label: "Terminé",    color: "#4CAF50", bg: "rgba(76,175,80,0.15)"   },
  annule:     { label: "Annulé",     color: "#ff6b6b", bg: "rgba(255,107,107,0.15)" },
};

const euros = v =>
  (parseFloat(v) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

function calculerCouts(f) {
  const tvaRate = (parseFloat(f.tva) || 0) / 100;
  // Applique la TVA sur un montant si le flag correspondant est coché
  const t = (base, flag) => base * (1 + ((flag === true) ? tvaRate : 0));

  // Montants de base (HT brut, sans TVA individuelle)
  const mo_ht  = (parseFloat(f.heures_mo)      || 0) * (parseFloat(f.taux_horaire) || 0);
  const mat_ht = (f.materiaux      || []).reduce((s, m) => s + (parseFloat(m.quantite) || 0) * (parseFloat(m.prix_unitaire) || 0), 0);
  const dep_ht = (parseFloat(f.km_deplacement) || 0) * (parseFloat(f.prix_km)       || 0);
  const st_ht  = (f.sous_traitants || []).reduce((s, x) => s + (parseFloat(x.montant) || 0), 0);

  // Montants effectifs (avec TVA si case cochée)
  const mo  = t(mo_ht,  f.tva_mo);
  const mat = t(mat_ht, f.tva_mat);
  const dep = t(dep_ht, f.tva_dep);
  const st  = t(st_ht,  f.tva_st);

  // Frais totaux (base pour imprévus = somme effective des postes)
  const base     = mo + mat + dep + st;
  const imprevus = base * (parseFloat(f.taux_imprevus) || 0) / 100;
  const marge    = (base + imprevus) * (parseFloat(f.taux_marge) || 0) / 100;

  // Total frais = ce que ça coûte réellement à l'artisan
  const total_frais = base + imprevus;

  // Legacy totals (affichage récap)
  const ht     = total_frais + marge;
  const tvaAmt = 0;    // plus utilisé en global
  const ttc    = ht;

  // Prix facturé au client (avec TVA si case cochée)
  const prix_base = parseFloat(f.prix_chantier) || 0;
  const prix      = t(prix_base, f.tva_prix);

  const benefice = prix_base > 0 ? prix - total_frais : null;

  return {
    mo, mat, dep, st,
    mo_ht, mat_ht, dep_ht, st_ht,
    base, imprevus, marge, ht, tvaAmt, ttc,
    total_frais, prix, prix_base, benefice, tvaRate,
  };
}

const inp = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  padding: "10px 14px",
  color: "white",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const lbl = {
  color: "#8899aa",
  fontSize: "11px",
  fontWeight: "600",
  display: "block",
  marginBottom: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const subTitre = {
  color: "#8899aa",
  fontSize: "11px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  marginBottom: "8px",
};

// ── Helpers météo ─────────────────────────────────────────────────

/** Décode un code WMO en label + emoji */
function wmoInfo(code) {
  if (code === 0)            return { label: "Ciel dégagé",         emoji: "☀️"  };
  if (code === 1)            return { label: "Principalement dégagé",emoji: "🌤️" };
  if (code === 2)            return { label: "Partiellement nuageux",emoji: "⛅"  };
  if (code === 3)            return { label: "Couvert",              emoji: "☁️"  };
  if (code <= 48)            return { label: "Brouillard",           emoji: "🌫️" };
  if (code <= 57)            return { label: "Bruine",               emoji: "🌦️" };
  if (code <= 67)            return { label: "Pluie",                emoji: "🌧️" };
  if (code <= 77)            return { label: "Neige",                emoji: "❄️"  };
  if (code <= 82)            return { label: "Averses",              emoji: "🌦️" };
  if (code <= 86)            return { label: "Averses de neige",     emoji: "🌨️" };
  if (code <= 99)            return { label: "Orage",                emoji: "⛈️" };
  return                            { label: "Variable",             emoji: "🌡️" };
}

/** Convertit un angle de vent (°) en direction cardinale */
function windDir(deg) {
  const dirs = ["N","NE","E","SE","S","SO","O","NO"];
  return dirs[Math.round((deg % 360) / 45) % 8];
}

export default function Chantiers({ user, isPro = true, onUpgrade, onCreerDevis, onCreerFacture, clientInitialId, onClientInitialIdHandled }) {

  // ── Liste ──────────────────────────────────────────────────────
  const [chantiers,    setChantiers]    = useState([]);
  const [clients,      setClients]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filtreStatut, setFiltreStatut] = useState("tous");

  // ── Modal nouveau chantier ─────────────────────────────────────
  const [nvModal,  setNvModal]  = useState(false);
  const [nvForm,   setNvForm]   = useState({ nom: "", client_id: "", adresse: "", date_debut: "", date_fin_prevue: "", statut: "en_attente", description: "" });
  const [nvSaving, setNvSaving] = useState(false);
  const [nvMsg,    setNvMsg]    = useState("");

  // ── Fiche détaillée ────────────────────────────────────────────
  const [fiche,         setFiche]         = useState(null);
  const [ficheForm,     setFicheForm]     = useState(null);
  const [ficheModifie,  setFicheModifie]  = useState(false);
  const [ficheSaving,   setFicheSaving]   = useState(false);
  const [ficheMsg,      setFicheMsg]      = useState("");
  const [photoCat,      setPhotoCat]      = useState("avant");
  const [photoUp,       setPhotoUp]       = useState(false);
  const [devisFiche,    setDevisFiche]    = useState([]);
  const [factsFiche,    setFactsFiche]    = useState([]);
  const [delConfirm,    setDelConfirm]    = useState(false);

  // ── Météo ──────────────────────────────────────────────────────
  const [meteo,        setMeteo]        = useState(null);
  const [meteoLoading, setMeteoLoading] = useState(false);
  const [meteoError,   setMeteoError]   = useState(null);

  useEffect(() => { chargerTout(); }, [user.id]);

  // ── Chargements ────────────────────────────────────────────────

  const chargerTout = async () => {
    setLoading(true);
    const [{ data: ch }, { data: cl }] = await Promise.all([
      supabase.from("chantiers")
        .select("*, clients(id, nom, telephone, email, adresse)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("clients")
        .select("id, nom, telephone")
        .eq("user_id", user.id)
        .order("nom"),
    ]);
    setChantiers(ch || []);
    setClients(cl || []);
    setLoading(false);

    // Ouvrir le modal "Nouveau chantier" avec un client pré-sélectionné
    // (déclenché depuis la fiche client du Dashboard)
    if (clientInitialId) {
      setNvMsg("");
      setNvForm({ nom: "", client_id: clientInitialId, adresse: "", date_debut: "", date_fin_prevue: "", statut: "en_attente", description: "" });
      setNvModal(true);
      onClientInitialIdHandled?.();
    }
  };

  const chargerDocs = async (clientId) => {
    if (!clientId) { setDevisFiche([]); setFactsFiche([]); return; }
    const [{ data: dv }, { data: fa }] = await Promise.all([
      supabase.from("devis").select("id, numero, statut, total_ttc, created_at").eq("client_id", clientId).order("created_at", { ascending: false }),
      supabase.from("factures").select("id, numero, statut, total_ttc, created_at").eq("client_id", clientId).order("created_at", { ascending: false }),
    ]);
    setDevisFiche(dv || []);
    setFactsFiche(fa || []);
  };

  // ── Météo : géocode l'adresse puis appelle Open-Meteo ──────────
  const fetchMeteo = async (adresse) => {
    if (!adresse?.trim()) { setMeteo(null); setMeteoError(null); return; }
    setMeteoLoading(true);
    setMeteoError(null);
    setMeteo(null);
    try {
      // 1) Géocodage via Nominatim (OpenStreetMap) — gère les adresses complètes françaises
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(adresse)}&format=json&limit=1&accept-language=fr`,
        { headers: { "User-Agent": "ArtisanPlus/1.0 (contact@artisan-plus.fr)" } }
      );
      const geoData = await geoRes.json();
      if (!geoData?.length) {
        setMeteoError("Adresse introuvable — vérifiez l'adresse du chantier");
        setMeteoLoading(false);
        return;
      }
      const { lat, lon, display_name } = geoData[0];
      const latitude  = parseFloat(lat);
      const longitude = parseFloat(lon);
      // Extraire la ville depuis display_name (2e segment séparé par virgule)
      const lieu = display_name.split(",").slice(0, 2).join(",").trim();

      // 2) Météo actuelle via Open-Meteo forecast
      const wRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,` +
        `precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m` +
        `&timezone=auto&wind_speed_unit=kmh`
      );
      const wData = await wRes.json();
      const c = wData.current;
      setMeteo({
        temperature:    Math.round(c.temperature_2m),
        ressenti:       Math.round(c.apparent_temperature),
        humidite:       c.relative_humidity_2m,
        pluie_proba:    c.precipitation_probability ?? 0,
        code:           c.weather_code,
        vent_vitesse:   Math.round(c.wind_speed_10m),
        vent_direction: c.wind_direction_10m,
        lieu,
      });
    } catch {
      setMeteoError("Impossible de charger la météo (réseau ou API indisponible)");
    }
    setMeteoLoading(false);
  };

  // ── Ouvrir fiche ───────────────────────────────────────────────

  const ouvrirFiche = (ch) => {
    setFiche(ch);
    setFicheForm({
      nom:             ch.nom             || "",
      client_id:       ch.client_id       || "",
      adresse:         ch.adresse         || "",
      date_debut:      ch.date_debut      || "",
      date_fin_prevue: ch.date_fin_prevue || "",
      statut:          ch.statut          || "en_attente",
      description:     ch.description     || "",
      notes:           ch.notes           || "",
      heures_mo:       ch.heures_mo       != null ? String(ch.heures_mo)      : "",
      taux_horaire:    ch.taux_horaire    != null ? String(ch.taux_horaire)   : "",
      materiaux:       Array.isArray(ch.materiaux)      ? ch.materiaux      : [],
      km_deplacement:  ch.km_deplacement  != null ? String(ch.km_deplacement) : "",
      prix_km:         ch.prix_km         != null ? String(ch.prix_km)        : "0.50",
      sous_traitants:  Array.isArray(ch.sous_traitants) ? ch.sous_traitants : [],
      taux_imprevus:   ch.taux_imprevus   != null ? String(ch.taux_imprevus)  : "0",
      taux_marge:      ch.taux_marge      != null ? String(ch.taux_marge)     : "0",
      tva:             ch.tva             != null ? String(ch.tva)            : "20",
      photos:          Array.isArray(ch.photos) ? ch.photos : [],
      prix_chantier:   ch.prix_chantier   != null ? String(ch.prix_chantier)  : "",
      tva_prix:        ch.tva_prix  === true,
      tva_mo:          ch.tva_mo    === true,
      tva_mat:         ch.tva_mat   === true,
      tva_dep:         ch.tva_dep   === true,
      tva_st:          ch.tva_st    === true,
    });
    setFicheModifie(false);
    setFicheMsg("");
    setDelConfirm(false);
    chargerDocs(ch.client_id);
    fetchMeteo(ch.adresse); // Charge la météo de l'adresse du chantier
  };

  // Setter qui marque la fiche comme modifiée
  const ff = (k, v) => { setFicheForm(p => ({ ...p, [k]: v })); setFicheModifie(true); };

  // ── Sauvegarde fiche ───────────────────────────────────────────

  const sauvegarderFiche = async () => {
    if (!ficheForm.nom.trim()) { setFicheMsg("❌ Le nom est obligatoire"); return; }
    setFicheSaving(true);
    setFicheMsg("");
    try {
      // Nettoyage photos : on ne garde que les objets avec une vraie URL (pas de blob: temporaires)
      const photosPropres = (ficheForm.photos || []).filter(p =>
        p && typeof p === "object" && typeof p.url === "string" && p.url.startsWith("http")
      );
      const payload = {
        nom:             ficheForm.nom.trim(),
        client_id:       ficheForm.client_id       || null,
        adresse:         ficheForm.adresse         || null,
        date_debut:      ficheForm.date_debut       || null,
        date_fin_prevue: ficheForm.date_fin_prevue  || null,
        statut:          ficheForm.statut,
        description:     ficheForm.description     || null,
        notes:           ficheForm.notes           || null,
        heures_mo:       parseFloat(ficheForm.heures_mo)      || 0,
        taux_horaire:    parseFloat(ficheForm.taux_horaire)   || 0,
        materiaux:       ficheForm.materiaux,
        km_deplacement:  parseFloat(ficheForm.km_deplacement) || 0,
        prix_km:         parseFloat(ficheForm.prix_km)        || 0.50,
        sous_traitants:  ficheForm.sous_traitants,
        taux_imprevus:   parseFloat(ficheForm.taux_imprevus)  || 0,
        taux_marge:      parseFloat(ficheForm.taux_marge)     || 0,
        tva:             parseFloat(ficheForm.tva)            || 20,
        photos:          photosPropres,
        prix_chantier:   parseFloat(ficheForm.prix_chantier)  || 0,
        tva_prix:        ficheForm.tva_prix === true,
        tva_mo:          ficheForm.tva_mo   === true,
        tva_mat:         ficheForm.tva_mat  === true,
        tva_dep:         ficheForm.tva_dep  === true,
        tva_st:          ficheForm.tva_st   === true,
      };
      const { error } = await supabase.from("chantiers").update(payload).eq("id", fiche.id);
      if (error) { setFicheMsg("❌ " + error.message); setFicheSaving(false); return; }
      const updated = { ...fiche, ...payload };
      setChantiers(prev => prev.map(c => c.id === fiche.id ? { ...c, ...payload } : c));
      setFiche(updated);
      setFicheModifie(false);
      setFicheSaving(false);
      setFicheMsg("✅ Sauvegardé !");
      setTimeout(() => setFicheMsg(""), 2500);
    } catch (err) {
      setFicheMsg("❌ Erreur réseau : " + (err?.message || "connexion impossible"));
      setFicheSaving(false);
    }
  };

  // ── Créer chantier ─────────────────────────────────────────────

  const creerChantier = async () => {
    if (!nvForm.nom.trim()) { setNvMsg("❌ Le nom est obligatoire"); return; }
    setNvSaving(true);
    setNvMsg("");
    const payload = {
      user_id: user.id,
      nom: nvForm.nom.trim(),
      client_id: nvForm.client_id || null,
      adresse: nvForm.adresse || null,
      date_debut: nvForm.date_debut || null,
      date_fin_prevue: nvForm.date_fin_prevue || null,
      statut: nvForm.statut,
      description: nvForm.description || null,
      heures_mo: 0, taux_horaire: 0,
      materiaux: [], km_deplacement: 0, prix_km: 0.50,
      sous_traitants: [], taux_imprevus: 0, taux_marge: 0, tva: 20,
      photos: [], prix_chantier: 0,
      tva_prix: false, tva_mo: false, tva_mat: false, tva_dep: false, tva_st: false,
    };
    const { data, error } = await supabase
      .from("chantiers")
      .insert(payload)
      .select("*, clients(id, nom, telephone, email, adresse)")
      .single();
    if (error) { setNvMsg("❌ " + error.message); setNvSaving(false); return; }
    setChantiers(prev => [data, ...prev]);
    setNvModal(false);
    setNvSaving(false);
    setNvForm({ nom: "", client_id: "", adresse: "", date_debut: "", date_fin_prevue: "", statut: "en_attente", description: "" });
    ouvrirFiche(data); // → ouvre directement la fiche pour ajouter photos/coûts
  };

  // ── Supprimer chantier ─────────────────────────────────────────

  const supprimerChantier = async () => {
    await supabase.from("chantiers").delete().eq("id", fiche.id);
    setChantiers(prev => prev.filter(c => c.id !== fiche.id));
    setFiche(null);
  };

  // ── Photos ─────────────────────────────────────────────────────

  const uploadPhoto = async (fichier, categorie) => {
    setPhotoUp(true);
    try {
      const ext  = fichier.name.split(".").pop().toLowerCase();
      const path = `${fiche.id}/${categorie}/${Date.now()}.${ext}`;
      const { error: errUp } = await supabase.storage
        .from("chantiers-photos")
        .upload(path, fichier, { cacheControl: "3600", upsert: false });
      if (errUp) throw errUp;
      const { data: { publicUrl } } = supabase.storage.from("chantiers-photos").getPublicUrl(path);
      const newPhotos = [...(ficheForm.photos || []), { url: publicUrl, categorie }];
      // Sauvegarde immédiate des photos sans passer par le bouton "Enregistrer"
      await supabase.from("chantiers").update({ photos: newPhotos }).eq("id", fiche.id);
      setChantiers(prev => prev.map(c => c.id === fiche.id ? { ...c, photos: newPhotos } : c));
      setFicheForm(p => ({ ...p, photos: newPhotos }));
      // Ne pas marquer ficheModifie pour les photos (déjà sauvegardé)
    } catch (e) { alert("Erreur upload : " + e.message); }
    setPhotoUp(false);
  };

  const supprimerPhoto = async (photoUrl) => {
    if (!window.confirm("Supprimer cette photo ?")) return;
    const nouv = (ficheForm.photos || []).filter(p => p.url !== photoUrl);
    const parts = photoUrl.split("/chantiers-photos/");
    if (parts.length > 1) {
      await supabase.storage.from("chantiers-photos").remove([decodeURIComponent(parts[1])]);
    }
    await supabase.from("chantiers").update({ photos: nouv }).eq("id", fiche.id);
    setChantiers(prev => prev.map(c => c.id === fiche.id ? { ...c, photos: nouv } : c));
    setFicheForm(p => ({ ...p, photos: nouv }));
  };

  // ── Matériaux ──────────────────────────────────────────────────

  const addMat = () => ff("materiaux", [...(ficheForm.materiaux || []), { nom: "", quantite: "1", prix_unitaire: "0" }]);
  const setMat = (i, k, v) => { const m = [...ficheForm.materiaux]; m[i] = { ...m[i], [k]: v }; ff("materiaux", m); };
  const delMat = (i) => ff("materiaux", ficheForm.materiaux.filter((_, idx) => idx !== i));

  const addST  = () => ff("sous_traitants", [...(ficheForm.sous_traitants || []), { nom: "", montant: "0" }]);
  const setST  = (i, k, v) => { const s = [...ficheForm.sous_traitants]; s[i] = { ...s[i], [k]: v }; ff("sous_traitants", s); };
  const delST  = (i) => ff("sous_traitants", ficheForm.sous_traitants.filter((_, idx) => idx !== i));

  // ── Filtrage ───────────────────────────────────────────────────

  const liste = filtreStatut === "tous" ? chantiers : chantiers.filter(c => c.statut === filtreStatut);

  // ══════════════════════════════════════════════════════════════
  // LOADING
  // ══════════════════════════════════════════════════════════════

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "#8899aa" }}>
      <div style={{ fontSize: "36px", marginBottom: "12px" }}>⏳</div>
      Chargement des chantiers…
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // VUE FICHE DÉTAILLÉE
  // ══════════════════════════════════════════════════════════════

  if (fiche && ficheForm) {
    const cout   = calculerCouts(ficheForm);
    const photos = ficheForm.photos || [];

    return (
      <div style={{ maxWidth: "680px", margin: "0 auto", paddingBottom: "120px" }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              if (ficheModifie && !window.confirm("Quitter sans sauvegarder ?")) return;
              setFiche(null);
            }}
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "white", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
          >
            ← Retour
          </button>
          <div style={{ flex: 1 }} />
          {ficheMsg && (
            <span style={{ fontSize: "13px", fontWeight: "600", color: ficheMsg.includes("✅") ? "#4CAF50" : "#ff6b6b" }}>
              {ficheMsg}
            </span>
          )}
          {ficheModifie && (
            <button onClick={sauvegarderFiche} disabled={ficheSaving} style={{
              background: PRIMARY, color: "white", border: "none", borderRadius: "8px",
              padding: "9px 22px", fontSize: "14px", fontWeight: "700",
              cursor: ficheSaving ? "not-allowed" : "pointer", opacity: ficheSaving ? 0.7 : 1
            }}>
              {ficheSaving ? "⏳" : "💾 Enregistrer"}
            </button>
          )}
        </div>

        {/* ── Nom éditable ───────────────────────────────────── */}
        <input
          value={ficheForm.nom}
          onChange={e => ff("nom", e.target.value)}
          placeholder="Nom du chantier"
          style={{
            background: "transparent", border: "none",
            borderBottom: "2px solid rgba(255,140,0,0.4)",
            color: "white", fontSize: "26px", fontWeight: "700",
            width: "100%", outline: "none", padding: "4px 0",
            marginBottom: "16px", boxSizing: "border-box",
          }}
        />

        {/* ── Statut ─────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
          {Object.entries(STATUTS).map(([id, sv]) => (
            <button key={id} onClick={() => ff("statut", id)} style={{
              background: ficheForm.statut === id ? sv.bg : "transparent",
              border: `1.5px solid ${ficheForm.statut === id ? sv.color : "rgba(255,255,255,0.1)"}`,
              color: ficheForm.statut === id ? sv.color : "#8899aa",
              borderRadius: "8px", padding: "6px 14px", fontSize: "13px",
              fontWeight: "700", cursor: "pointer", transition: "all 0.15s",
            }}>{sv.label}</button>
          ))}
        </div>

        {/* ── Actions rapides devis / facture ────────────────── */}
        {ficheForm.client_id && (
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
            <button onClick={() => onCreerDevis(ficheForm.client_id)} style={{
              flex: 1, minWidth: "140px",
              background: "rgba(100,149,237,0.12)", border: "1px solid rgba(100,149,237,0.35)",
              color: "#6495ED", borderRadius: "10px", padding: "11px 16px",
              fontSize: "13px", fontWeight: "700", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
            }}>
              📝 Créer un devis pour ce chantier
            </button>
            <button onClick={() => onCreerFacture(ficheForm.client_id)} style={{
              flex: 1, minWidth: "140px",
              background: "rgba(76,175,80,0.12)", border: "1px solid rgba(76,175,80,0.35)",
              color: "#4CAF50", borderRadius: "10px", padding: "11px 16px",
              fontSize: "13px", fontWeight: "700", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
            }}>
              🧾 Créer une facture pour ce chantier
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            WIDGET MÉTÉO
        ══════════════════════════════════════════════════════ */}
        {(
          <div style={{
            background: CARD, borderRadius: "16px", padding: "16px 18px",
            marginBottom: "14px",
            border: "1px solid rgba(100,149,237,0.25)",
          }}>
            {/* En-tête widget */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontSize: "16px" }}>🌤️</span>
              <span style={{ color: "white", fontSize: "13px", fontWeight: "700", flex: 1 }}>
                Météo du chantier
              </span>
              {meteo && (
                <span style={{ color: "#8899aa", fontSize: "11px", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {meteo.lieu}
                </span>
              )}
              <button
                onClick={() => fetchMeteo(ficheForm.adresse)}
                disabled={meteoLoading}
                title="Actualiser la météo"
                style={{
                  background: "rgba(255,255,255,0.06)", border: "none",
                  color: "#8899aa", borderRadius: "6px", padding: "4px 8px",
                  cursor: meteoLoading ? "default" : "pointer", fontSize: "13px",
                  transition: "color 0.15s",
                }}
              >🔄</button>
            </div>

            {/* Chargement */}
            {meteoLoading && (
              <div style={{ color: "#8899aa", fontSize: "13px", textAlign: "center", padding: "14px 0" }}>
                ⏳ Chargement de la météo…
              </div>
            )}

            {/* Erreur */}
            {/* Pas d'adresse renseignée */}
            {!ficheForm.adresse?.trim() && !meteoLoading && !meteo && !meteoError && (
              <div style={{ color: "#8899aa", fontSize: "12px", textAlign: "center", padding: "10px 0", fontStyle: "italic" }}>
                📍 Renseignez l'adresse du chantier pour voir la météo
              </div>
            )}

            {meteoError && !meteoLoading && (
              <div style={{ color: "#ff6b6b", fontSize: "12px", padding: "6px 0" }}>
                ⚠️ {meteoError}
              </div>
            )}

            {/* Données météo */}
            {meteo && !meteoLoading && (() => {
              const { label, emoji } = wmoInfo(meteo.code);
              return (
                <>
                  {/* Température + condition */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "14px" }}>
                    <div style={{ fontSize: "52px", lineHeight: 1, flexShrink: 0 }}>{emoji}</div>
                    <div>
                      <div style={{ color: PRIMARY, fontSize: "38px", fontWeight: "900", lineHeight: 1 }}>
                        {meteo.temperature}°C
                      </div>
                      <div style={{ color: "white", fontSize: "14px", fontWeight: "600", marginTop: "3px" }}>
                        {label}
                      </div>
                      <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "2px" }}>
                        Ressenti {meteo.ressenti}°C
                      </div>
                    </div>
                  </div>

                  {/* Détails : 3 tuiles */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                    {[
                      { icon: "💧", label: "Humidité",  value: `${meteo.humidite} %` },
                      { icon: "🌬️", label: "Vent",      value: `${meteo.vent_vitesse} km/h ${windDir(meteo.vent_direction)}` },
                      { icon: "🌂", label: "Pluie",     value: `${meteo.pluie_proba} %` },
                    ].map(item => (
                      <div key={item.label} style={{
                        background: "rgba(100,149,237,0.06)",
                        border: "1px solid rgba(100,149,237,0.12)",
                        borderRadius: "10px", padding: "10px 10px 8px",
                      }}>
                        <div style={{ color: "#8899aa", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "5px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <span>{item.icon}</span><span>{item.label}</span>
                        </div>
                        <div style={{ color: "white", fontSize: "14px", fontWeight: "700" }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SECTION : INFOS GÉNÉRALES
        ══════════════════════════════════════════════════════ */}
        <Card titre="📋 Informations générales">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>👤 Client</label>
              <select
                value={ficheForm.client_id}
                onChange={e => { ff("client_id", e.target.value); chargerDocs(e.target.value || null); }}
                style={{ ...inp, cursor: "pointer", color: ficheForm.client_id ? "white" : "#8899aa" }}
              >
                <option value="">— Aucun client —</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}{c.telephone ? ` · ${c.telephone}` : ""}</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>📍 Adresse du chantier</label>
              <input value={ficheForm.adresse} onChange={e => ff("adresse", e.target.value)}
                placeholder="Adresse complète" style={inp} />
            </div>

            <div>
              <label style={lbl}>📅 Début</label>
              <input type="date" value={ficheForm.date_debut} onChange={e => ff("date_debut", e.target.value)}
                style={{ ...inp, colorScheme: "dark" }} />
            </div>
            <div>
              <label style={lbl}>📅 Fin prévue</label>
              <input type="date" value={ficheForm.date_fin_prevue} onChange={e => ff("date_fin_prevue", e.target.value)}
                style={{ ...inp, colorScheme: "dark" }} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>📋 Description des travaux</label>
              <textarea value={ficheForm.description} onChange={e => ff("description", e.target.value)}
                rows={3} placeholder="Détail des travaux à réaliser…"
                style={{ ...inp, resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }} />
            </div>
          </div>

          {/* Actions rapides GPS / Tel */}
          {(ficheForm.adresse || fiche.clients?.telephone) && (
            <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
              {ficheForm.adresse && (
                <a href={`https://maps.google.com/?q=${encodeURIComponent(ficheForm.adresse)}`}
                  target="_blank" rel="noreferrer" style={aBtn}>📍 GPS</a>
              )}
              {fiche.clients?.telephone && (<>
                <a href={`tel:${fiche.clients.telephone.replace(/\s/g, "")}`} style={aBtn}>📞 Appeler</a>
                <a href={`sms:${fiche.clients.telephone.replace(/\s/g, "")}`} style={aBtn}>💬 SMS</a>
              </>)}
            </div>
          )}
        </Card>

        {/* ══════════════════════════════════════════════════════
            SECTION : COÛTS
        ══════════════════════════════════════════════════════ */}
        <Card titre="💰 Coûts & Budget">

          {/* ── TVA globale (taux) ───────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", padding: "10px 14px", background: "rgba(255,140,0,0.06)", borderRadius: "8px", border: "1px solid rgba(255,140,0,0.15)" }}>
            <span style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600" }}>Taux TVA appliqué :</span>
            <input type="number" min="0" max="100" value={ficheForm.tva}
              onChange={e => ff("tva", e.target.value)}
              style={{ ...inp, width: "70px", padding: "6px 10px", fontSize: "14px", fontWeight: "700", textAlign: "center" }} />
            <span style={{ color: "#8899aa", fontSize: "13px" }}>%</span>
            <span style={{ color: "#555", fontSize: "11px", marginLeft: "auto" }}>Cochez "TVA" sur chaque poste</span>
          </div>

          {/* ── Prix du chantier ─────────────────────────────── */}
          <div style={{ marginBottom: "20px", padding: "14px 16px", background: DARK, borderRadius: "12px", border: "1px solid rgba(255,140,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={subTitre}>💵 Prix facturé au client</div>
              <TvaSwitch checked={ficheForm.tva_prix} onChange={v => ff("tva_prix", v)} taux={ficheForm.tva} />
            </div>
            <input
              type="number" min="0" step="0.01"
              value={ficheForm.prix_chantier}
              onChange={e => ff("prix_chantier", e.target.value)}
              placeholder="0.00"
              style={{ ...inp, fontSize: "22px", fontWeight: "800", color: PRIMARY }}
            />
            {cout.prix > 0 && ficheForm.tva_prix && (
              <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "6px" }}>
                {euros(cout.prix_base)} HT + TVA {ficheForm.tva}% = <span style={{ color: PRIMARY, fontWeight: "700" }}>{euros(cout.prix)} TTC</span>
              </div>
            )}
          </div>

          {/* ── Main d'œuvre ─────────────────────────────────── */}
          <div style={{ marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={subTitre}>💪 Main d'œuvre</div>
              <TvaSwitch checked={ficheForm.tva_mo} onChange={v => ff("tva_mo", v)} taux={ficheForm.tva} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={lbl}>Heures</label>
                <input type="number" min="0" value={ficheForm.heures_mo}
                  onChange={e => ff("heures_mo", e.target.value)} placeholder="0" style={inp} />
              </div>
              <div>
                <label style={lbl}>Taux (€/h)</label>
                <input type="number" min="0" value={ficheForm.taux_horaire}
                  onChange={e => ff("taux_horaire", e.target.value)} placeholder="0" style={inp} />
              </div>
            </div>
            {cout.mo_ht > 0 && (
              <MontantAvecTva base={cout.mo_ht} effectif={cout.mo} taux={ficheForm.tva} coché={ficheForm.tva_mo} />
            )}
          </div>

          {/* ── Matériaux ─────────────────────────────────────── */}
          <div style={{ marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={subTitre}>🧱 Matériaux</div>
              <TvaSwitch checked={ficheForm.tva_mat} onChange={v => ff("tva_mat", v)} taux={ficheForm.tva} />
            </div>
            {ficheForm.materiaux.length === 0 && (
              <div style={{ color: "#555", fontSize: "12px", fontStyle: "italic", marginBottom: "8px" }}>Aucun matériau ajouté</div>
            )}
            {ficheForm.materiaux.map((m, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "6px", marginBottom: "6px", alignItems: "center" }}>
                <input placeholder="Matériau" value={m.nom} onChange={e => setMat(i, "nom", e.target.value)}
                  style={{ ...inp, padding: "8px 10px", fontSize: "13px" }} />
                <input type="number" placeholder="Qté" value={m.quantite} onChange={e => setMat(i, "quantite", e.target.value)}
                  style={{ ...inp, padding: "8px 10px", fontSize: "13px" }} />
                <input type="number" placeholder="PU €" value={m.prix_unitaire} onChange={e => setMat(i, "prix_unitaire", e.target.value)}
                  style={{ ...inp, padding: "8px 10px", fontSize: "13px" }} />
                <button onClick={() => delMat(i)}
                  style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.2)", color: "#ff6b6b", borderRadius: "7px", padding: "8px 10px", cursor: "pointer" }}>✕</button>
              </div>
            ))}
            <button onClick={addMat} style={dottedBtn}>+ Matériau</button>
            {cout.mat_ht > 0 && (
              <MontantAvecTva base={cout.mat_ht} effectif={cout.mat} taux={ficheForm.tva} coché={ficheForm.tva_mat} label="Total matériaux" />
            )}
          </div>

          {/* ── Déplacements ──────────────────────────────────── */}
          <div style={{ marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={subTitre}>🚗 Déplacements</div>
              <TvaSwitch checked={ficheForm.tva_dep} onChange={v => ff("tva_dep", v)} taux={ficheForm.tva} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={lbl}>Kilomètres</label>
                <input type="number" min="0" value={ficheForm.km_deplacement}
                  onChange={e => ff("km_deplacement", e.target.value)} placeholder="0" style={inp} />
              </div>
              <div>
                <label style={lbl}>Prix / km (€)</label>
                <input type="number" min="0" step="0.01" value={ficheForm.prix_km}
                  onChange={e => ff("prix_km", e.target.value)} placeholder="0.50" style={inp} />
              </div>
            </div>
            {cout.dep_ht > 0 && (
              <MontantAvecTva base={cout.dep_ht} effectif={cout.dep} taux={ficheForm.tva} coché={ficheForm.tva_dep} />
            )}
          </div>

          {/* ── Sous-traitants ────────────────────────────────── */}
          <div style={{ marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={subTitre}>🤝 Sous-traitants</div>
              <TvaSwitch checked={ficheForm.tva_st} onChange={v => ff("tva_st", v)} taux={ficheForm.tva} />
            </div>
            {ficheForm.sous_traitants.length === 0 && (
              <div style={{ color: "#555", fontSize: "12px", fontStyle: "italic", marginBottom: "8px" }}>Aucun sous-traitant</div>
            )}
            {ficheForm.sous_traitants.map((s, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "6px", marginBottom: "6px", alignItems: "center" }}>
                <input placeholder="Société / nom" value={s.nom} onChange={e => setST(i, "nom", e.target.value)}
                  style={{ ...inp, padding: "8px 10px", fontSize: "13px" }} />
                <input type="number" placeholder="Montant €" value={s.montant} onChange={e => setST(i, "montant", e.target.value)}
                  style={{ ...inp, padding: "8px 10px", fontSize: "13px" }} />
                <button onClick={() => delST(i)}
                  style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.2)", color: "#ff6b6b", borderRadius: "7px", padding: "8px 10px", cursor: "pointer" }}>✕</button>
              </div>
            ))}
            <button onClick={addST} style={dottedBtn}>+ Sous-traitant</button>
            {cout.st_ht > 0 && (
              <MontantAvecTva base={cout.st_ht} effectif={cout.st} taux={ficheForm.tva} coché={ficheForm.tva_st} label="Total S-T" />
            )}
          </div>

          {/* ── Imprévus & Marge ─────────────────────────────── */}
          <div style={{ marginBottom: "18px" }}>
            <div style={subTitre}>📊 Imprévus & Marge</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={lbl}>Imprévus %</label>
                <input type="number" min="0" max="100" value={ficheForm.taux_imprevus}
                  onChange={e => ff("taux_imprevus", e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>Marge %</label>
                <input type="number" min="0" max="100" value={ficheForm.taux_marge}
                  onChange={e => ff("taux_marge", e.target.value)} style={inp} />
              </div>
            </div>
          </div>

          {/* ── Récapitulatif live ────────────────────────────── */}
          {cout.base > 0 && (
            <div style={{ background: DARK, borderRadius: "12px", padding: "16px 18px", border: "1px solid rgba(255,140,0,0.18)" }}>
              <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
                Récapitulatif
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {cout.mo  > 0 && <LigneRecap label={`Main d'œuvre${ficheForm.tva_mo  ? " (TVA)" : ""}`} val={euros(cout.mo)} />}
                {cout.mat > 0 && <LigneRecap label={`Matériaux${ficheForm.tva_mat    ? " (TVA)" : ""}`} val={euros(cout.mat)} />}
                {cout.dep > 0 && <LigneRecap label={`Déplacements${ficheForm.tva_dep ? " (TVA)" : ""}`} val={euros(cout.dep)} />}
                {cout.st  > 0 && <LigneRecap label={`Sous-traitants${ficheForm.tva_st? " (TVA)" : ""}`} val={euros(cout.st)} />}
                {cout.imprevus > 0 && <LigneRecap label={`Imprévus (${ficheForm.taux_imprevus}%)`} val={"+ " + euros(cout.imprevus)} />}
                {cout.marge    > 0 && <LigneRecap label={`Marge (${ficheForm.taux_marge}%)`}       val={"+ " + euros(cout.marge)} />}
              </div>
              <div style={{ borderTop: "1px solid rgba(255,140,0,0.2)", marginTop: "10px", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "5px" }}>
                <LigneRecap label="Total frais" val={euros(cout.total_frais)} bold />
              </div>
              {/* Bénéfice net */}
              {cout.benefice !== null && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: "12px", paddingTop: "12px" }}>
                  <LigneRecap
                    label={`Prix facturé${ficheForm.tva_prix ? " (TTC)" : " (HT)"}`}
                    val={euros(cout.prix)}
                  />
                  <LigneRecap label="Total frais" val={euros(cout.total_frais)} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                    <span style={{ color: "white", fontSize: "15px", fontWeight: "700" }}>Bénéfice net</span>
                    <span style={{
                      color: cout.benefice >= 0 ? "#4CAF50" : "#ff6b6b",
                      fontSize: "24px", fontWeight: "800",
                    }}>
                      {cout.benefice >= 0 ? "+" : ""}{euros(cout.benefice)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ══════════════════════════════════════════════════════
            SECTION : PHOTOS
        ══════════════════════════════════════════════════════ */}
        <Card titre="📸 Photos chantier">
          {/* Tabs catégorie + bouton upload */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
            {["avant", "pendant", "apres"].map(cat => (
              <button key={cat} onClick={() => setPhotoCat(cat)} style={{
                background: photoCat === cat ? "rgba(255,140,0,0.15)" : "transparent",
                border: `1.5px solid ${photoCat === cat ? PRIMARY : "rgba(255,255,255,0.1)"}`,
                color: photoCat === cat ? PRIMARY : "#8899aa",
                borderRadius: "8px", padding: "7px 14px", fontSize: "13px",
                fontWeight: "700", cursor: "pointer", transition: "all 0.15s",
              }}>
                {cat === "avant" ? "📷 Avant" : cat === "pendant" ? "🔨 Pendant" : "✅ Après"}
              </button>
            ))}
            <label style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "rgba(255,140,0,0.12)", border: "1px solid rgba(255,140,0,0.3)",
              color: PRIMARY, borderRadius: "8px", padding: "7px 16px",
              fontSize: "13px", fontWeight: "700",
              cursor: photoUp ? "wait" : "pointer",
            }}>
              {photoUp ? "⏳ Upload…" : "＋ Ajouter"}
              <input type="file" accept="image/*" multiple hidden disabled={photoUp}
                onChange={e => { Array.from(e.target.files).forEach(f => uploadPhoto(f, photoCat)); e.target.value = ""; }} />
            </label>
          </div>

          {/* Grilles par catégorie */}
          {["avant", "pendant", "apres"].map(cat => {
            const catPhotos = photos.filter(p => p.categorie === cat);
            if (catPhotos.length === 0) return null;
            return (
              <div key={cat} style={{ marginBottom: "16px" }}>
                <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                  {cat === "avant" ? "📷 Avant" : cat === "pendant" ? "🔨 Pendant" : "✅ Après"} ({catPhotos.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: "8px" }}>
                  {catPhotos.map((p, i) => (
                    <div key={i} style={{ position: "relative", aspectRatio: "1 / 1", borderRadius: "10px", overflow: "hidden", background: DARK }}>
                      <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button onClick={() => supprimerPhoto(p.url)} style={{
                        position: "absolute", top: "4px", right: "4px",
                        background: "rgba(0,0,0,0.7)", border: "none", color: "white",
                        borderRadius: "50%", width: "22px", height: "22px",
                        fontSize: "11px", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {photos.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#555", fontSize: "13px", fontStyle: "italic" }}>
              Sélectionnez une catégorie puis cliquez sur "＋ Ajouter"
            </div>
          )}
        </Card>

        {/* ══════════════════════════════════════════════════════
            SECTION : NOTES
        ══════════════════════════════════════════════════════ */}
        <Card titre="📝 Notes">
          <textarea value={ficheForm.notes} onChange={e => ff("notes", e.target.value)}
            rows={4} placeholder="Remarques, conditions particulières, accès chantier…"
            style={{ ...inp, resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }} />
        </Card>

        {/* ══════════════════════════════════════════════════════
            SECTION : DOCUMENTS LIÉS
        ══════════════════════════════════════════════════════ */}
        {ficheForm.client_id && (
          <Card titre="📄 Documents du client">
            {devisFiche.length === 0 && factsFiche.length === 0 ? (
              <div style={{ color: "#555", fontSize: "13px", fontStyle: "italic" }}>Aucun document pour ce client</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {devisFiche.map(d => (
                  <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: DARK, borderRadius: "8px", padding: "10px 14px" }}>
                    <span style={{ color: "white", fontSize: "13px" }}>📝 {d.numero}</span>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span style={{ color: d.statut === "accepte" ? "#4CAF50" : PRIMARY, fontSize: "12px" }}>
                        {d.statut === "accepte" ? "✅ Accepté" : "⏳ En attente"}
                      </span>
                      <span style={{ color: PRIMARY, fontWeight: "700", fontSize: "13px" }}>{(d.total_ttc || 0).toFixed(2)} €</span>
                    </div>
                  </div>
                ))}
                {factsFiche.map(fc => (
                  <div key={fc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: DARK, borderRadius: "8px", padding: "10px 14px" }}>
                    <span style={{ color: "white", fontSize: "13px" }}>🧾 {fc.numero}</span>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span style={{ color: fc.statut === "payee" ? "#4CAF50" : "#ff6b6b", fontSize: "12px" }}>
                        {fc.statut === "payee" ? "✅ Payée" : "⏳ En attente"}
                      </span>
                      <span style={{ color: PRIMARY, fontWeight: "700", fontSize: "13px" }}>{(fc.total_ttc || 0).toFixed(2)} €</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}>
              <button onClick={() => onCreerDevis(ficheForm.client_id)} style={{
                background: "rgba(100,149,237,0.12)", border: "1px solid rgba(100,149,237,0.3)",
                color: "#6495ED", borderRadius: "8px", padding: "10px 16px",
                fontSize: "13px", fontWeight: "700", cursor: "pointer"
              }}>📝 Nouveau devis</button>
              <button onClick={() => onCreerFacture(ficheForm.client_id)} style={{
                background: "rgba(76,175,80,0.12)", border: "1px solid rgba(76,175,80,0.3)",
                color: "#4CAF50", borderRadius: "8px", padding: "10px 16px",
                fontSize: "13px", fontWeight: "700", cursor: "pointer"
              }}>🧾 Nouvelle facture</button>
            </div>
          </Card>
        )}

        {/* ── Supprimer ──────────────────────────────────────── */}
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          {!delConfirm ? (
            <button onClick={() => setDelConfirm(true)} style={{
              background: "transparent", border: "1px solid rgba(255,80,80,0.25)",
              color: "#ff6b6b", borderRadius: "8px", padding: "9px 20px",
              fontSize: "13px", cursor: "pointer",
            }}>🗑️ Supprimer ce chantier</button>
          ) : (
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#ff6b6b", fontSize: "13px" }}>Confirmer la suppression ?</span>
              <button onClick={supprimerChantier} style={{ background: "#ff6b6b", color: "white", border: "none", borderRadius: "7px", padding: "8px 16px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>Supprimer</button>
              <button onClick={() => setDelConfirm(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#8899aa", borderRadius: "7px", padding: "8px 14px", cursor: "pointer", fontSize: "13px" }}>Annuler</button>
            </div>
          )}
        </div>

        {/* ── Bouton flottant ────────────────────────────────── */}
        {ficheModifie && (
          <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 200 }}>
            <button onClick={sauvegarderFiche} disabled={ficheSaving} style={{
              background: PRIMARY, color: "white", border: "none", borderRadius: "14px",
              padding: "14px 36px", fontSize: "15px", fontWeight: "700",
              cursor: ficheSaving ? "not-allowed" : "pointer",
              boxShadow: "0 6px 28px rgba(255,140,0,0.45)",
              opacity: ficheSaving ? 0.7 : 1,
              whiteSpace: "nowrap",
            }}>
              {ficheSaving ? "Sauvegarde…" : "💾 Enregistrer les modifications"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // VUE LISTE
  // ══════════════════════════════════════════════════════════════

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <h2 style={{ color: "white", fontSize: "24px", margin: 0 }}>🏗️ Mes Chantiers</h2>
        <button
          onClick={() => {
            if (!isPro && chantiers.length >= 2) {
              onUpgrade?.();
            } else {
              setNvMsg(""); setNvForm({ nom: "", client_id: "", adresse: "", date_debut: "", date_fin_prevue: "", statut: "en_attente", description: "" }); setNvModal(true);
            }
          }}
          style={{ background: PRIMARY, color: "white", border: "none", borderRadius: "10px", padding: "10px 20px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}
        >
          ＋ Nouveau chantier
        </button>
      </div>

      {/* Filtres statut */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[{ id: "tous", label: "Tous", color: "white" }, ...Object.entries(STATUTS).map(([id, s]) => ({ id, label: s.label, color: s.color }))].map(f => (
          <button key={f.id} onClick={() => setFiltreStatut(f.id)} style={{
            background: filtreStatut === f.id ? "rgba(255,140,0,0.12)" : "transparent",
            border: `1px solid ${filtreStatut === f.id ? PRIMARY : "rgba(255,255,255,0.1)"}`,
            color: filtreStatut === f.id ? PRIMARY : "#8899aa",
            borderRadius: "8px", padding: "6px 14px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
          }}>{f.label}</button>
        ))}
      </div>

      {/* Liste vide */}
      {liste.length === 0 ? (
        <div style={{ background: CARD, borderRadius: "16px", padding: "52px 24px", textAlign: "center", border: "1px solid rgba(255,140,0,0.1)" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏗️</div>
          <div style={{ color: "#8899aa", marginBottom: "20px" }}>
            {filtreStatut === "tous" ? "Aucun chantier pour l'instant" : `Aucun chantier « ${STATUTS[filtreStatut]?.label} »`}
          </div>
          {filtreStatut === "tous" && (
            <button
              onClick={() => {
                if (!isPro && chantiers.length >= 2) {
                  onUpgrade?.();
                } else {
                  setNvModal(true);
                }
              }}
              style={{ background: PRIMARY, color: "white", border: "none", borderRadius: "10px", padding: "11px 24px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}
            >
              Créer le premier chantier
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {liste.map(ch => {
            const st   = STATUTS[ch.statut] || STATUTS.en_attente;
            const cout = calculerCouts(ch);
            return (
              <button
                key={ch.id}
                onClick={() => ouvrirFiche(ch)}
                style={{
                  background: CARD, borderRadius: "14px",
                  border: "1px solid rgba(255,140,0,0.12)",
                  padding: "16px 18px", cursor: "pointer",
                  textAlign: "left", display: "block", width: "100%",
                  transition: "border-color 0.2s, transform 0.1s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,140,0,0.38)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,140,0,0.12)"; }}
              >
                {/* ── Ligne 1 : Nom + statut + prix ─────────── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                      <span style={{ color: "white", fontWeight: "700", fontSize: "15px" }}>{ch.nom}</span>
                      <span style={{ background: st.bg, color: st.color, fontSize: "11px", fontWeight: "700", borderRadius: "6px", padding: "2px 8px", whiteSpace: "nowrap" }}>
                        {st.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {ch.clients?.nom    && <span style={{ color: "#8899aa", fontSize: "12px" }}>👤 {ch.clients.nom}</span>}
                      {ch.adresse         && <span style={{ color: "#8899aa", fontSize: "12px" }}>📍 {ch.adresse}</span>}
                      {ch.date_fin_prevue && <span style={{ color: "#8899aa", fontSize: "12px" }}>📅 {new Date(ch.date_fin_prevue).toLocaleDateString("fr-FR")}</span>}
                    </div>
                  </div>
                  {cout.prix > 0 && (
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ color: PRIMARY, fontWeight: "800", fontSize: "17px" }}>
                        {Math.round(cout.prix).toLocaleString("fr-FR")} €
                      </div>
                      <div style={{ color: "#8899aa", fontSize: "10px" }}>PRIX</div>
                    </div>
                  )}
                </div>

                {/* ── Ligne 2 : Frais / Bénéfice / MO / Km ──── */}
                {(cout.total_frais > 0 || cout.benefice !== null || parseFloat(ch.heures_mo) > 0 || parseFloat(ch.km_deplacement) > 0) && (
                  <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px" }}>
                    {cout.total_frais > 0 && (
                      <div style={{ minWidth: "70px" }}>
                        <div style={{ color: "#8899aa", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Frais</div>
                        <div style={{ color: "#8899aa", fontWeight: "700", fontSize: "13px" }}>
                          {Math.round(cout.total_frais).toLocaleString("fr-FR")} €
                        </div>
                      </div>
                    )}
                    {cout.benefice !== null && (
                      <div style={{ minWidth: "80px" }}>
                        <div style={{ color: "#8899aa", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Bénéfice</div>
                        <div style={{
                          fontWeight: "800", fontSize: "14px",
                          color: cout.benefice >= 0 ? "#4CAF50" : "#ff6b6b",
                        }}>
                          {cout.benefice >= 0 ? "+" : ""}{Math.round(cout.benefice).toLocaleString("fr-FR")} €
                        </div>
                      </div>
                    )}
                    {parseFloat(ch.heures_mo) > 0 && (
                      <div style={{ minWidth: "50px" }}>
                        <div style={{ color: "#8899aa", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.4px" }}>MO</div>
                        <div style={{ color: "#8899aa", fontWeight: "600", fontSize: "13px" }}>⏱️ {ch.heures_mo}h</div>
                      </div>
                    )}
                    {parseFloat(ch.km_deplacement) > 0 && (
                      <div style={{ minWidth: "60px" }}>
                        <div style={{ color: "#8899aa", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Dépl.</div>
                        <div style={{ color: "#8899aa", fontWeight: "600", fontSize: "13px" }}>🚗 {ch.km_deplacement} km</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Miniatures photos */}
                {ch.photos?.length > 0 && (
                  <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
                    {ch.photos.slice(0, 6).map((p, i) => (
                      <img key={i} src={p.url} alt="" style={{ width: "34px", height: "34px", objectFit: "cover", borderRadius: "5px" }} />
                    ))}
                    {ch.photos.length > 6 && (
                      <div style={{ width: "34px", height: "34px", background: DARK, borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center", color: "#8899aa", fontSize: "10px", fontWeight: "700" }}>
                        +{ch.photos.length - 6}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Modal Nouveau chantier (bottom sheet mobile) ──────── */}
      {nvModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setNvModal(false); }}
        >
          <div style={{ background: CARD, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: "600px", border: "1px solid rgba(255,140,0,0.25)", maxHeight: "92vh", overflowY: "auto" }}>

            <div style={{ width: "40px", height: "4px", background: "rgba(255,255,255,0.15)", borderRadius: "2px", margin: "0 auto 20px" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "white", margin: 0, fontSize: "18px" }}>＋ Nouveau chantier</h3>
              <button onClick={() => setNvModal(false)} style={{ background: "transparent", border: "none", color: "#8899aa", fontSize: "22px", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={lbl}>Nom du chantier *</label>
                <input
                  value={nvForm.nom}
                  onChange={e => setNvForm(p => ({ ...p, nom: e.target.value }))}
                  placeholder="Ex : Réfection toiture Dupont"
                  style={inp}
                  autoFocus
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={lbl}>👤 Client</label>
                  <select value={nvForm.client_id} onChange={e => setNvForm(p => ({ ...p, client_id: e.target.value }))}
                    style={{ ...inp, cursor: "pointer", color: nvForm.client_id ? "white" : "#8899aa" }}>
                    <option value="">— Choisir —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>🔄 Statut</label>
                  <select value={nvForm.statut} onChange={e => setNvForm(p => ({ ...p, statut: e.target.value }))}
                    style={{ ...inp, cursor: "pointer", color: STATUTS[nvForm.statut]?.color || "white" }}>
                    {Object.entries(STATUTS).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={lbl}>📍 Adresse</label>
                <input value={nvForm.adresse} onChange={e => setNvForm(p => ({ ...p, adresse: e.target.value }))}
                  placeholder="Adresse du chantier" style={inp} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={lbl}>📅 Début</label>
                  <input type="date" value={nvForm.date_debut} onChange={e => setNvForm(p => ({ ...p, date_debut: e.target.value }))}
                    style={{ ...inp, colorScheme: "dark" }} />
                </div>
                <div>
                  <label style={lbl}>📅 Fin prévue</label>
                  <input type="date" value={nvForm.date_fin_prevue} onChange={e => setNvForm(p => ({ ...p, date_fin_prevue: e.target.value }))}
                    style={{ ...inp, colorScheme: "dark" }} />
                </div>
              </div>

              <div>
                <label style={lbl}>📋 Description</label>
                <textarea value={nvForm.description} onChange={e => setNvForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} placeholder="Travaux à réaliser…"
                  style={{ ...inp, resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }} />
              </div>

              {nvMsg && (
                <div style={{ color: nvMsg.includes("✅") ? "#4CAF50" : "#ff6b6b", fontSize: "13px", fontWeight: "600", textAlign: "center" }}>
                  {nvMsg}
                </div>
              )}

              <button onClick={creerChantier} disabled={nvSaving} style={{
                background: nvSaving ? "#555" : PRIMARY, color: "white", border: "none",
                borderRadius: "12px", padding: "15px", fontSize: "15px", fontWeight: "700",
                cursor: nvSaving ? "not-allowed" : "pointer", marginTop: "4px",
              }}>
                {nvSaving ? "Création…" : "Créer le chantier →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Composants utilitaires ─────────────────────────────────────

function Card({ titre, children }) {
  return (
    <div style={{ background: CARD, borderRadius: "16px", padding: "20px", marginBottom: "14px", border: "1px solid rgba(255,140,0,0.1)" }}>
      <div style={{ color: "white", fontSize: "14px", fontWeight: "700", marginBottom: "16px" }}>{titre}</div>
      {children}
    </div>
  );
}

// Checkbox TVA inline (dans le header de chaque section)
function TvaSwitch({ checked, onChange, taux }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", userSelect: "none" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "#FF8C00" }}
      />
      <span style={{
        fontSize: "11px", fontWeight: "700",
        color: checked ? "#FF8C00" : "#8899aa",
        textTransform: "uppercase", letterSpacing: "0.4px",
      }}>
        + TVA {taux || 0}%
      </span>
    </label>
  );
}

// Ligne de montant qui affiche HT → TTC si TVA cochée
function MontantAvecTva({ base, effectif, taux, coché, label }) {
  if (!coché) {
    return (
      <div style={{ color: "#FF8C00", fontSize: "13px", fontWeight: "700", marginTop: "6px", textAlign: "right" }}>
        {label ? `${label} : ` : "= "}{(parseFloat(base) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
      </div>
    );
  }
  return (
    <div style={{ marginTop: "6px", textAlign: "right" }}>
      <span style={{ color: "#8899aa", fontSize: "12px" }}>
        {label ? `${label} : ` : ""}{(parseFloat(base) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € HT
        {" + TVA "}{taux}%
        {" = "}
      </span>
      <span style={{ color: "#FF8C00", fontSize: "14px", fontWeight: "800" }}>
        {(parseFloat(effectif) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € TTC
      </span>
    </div>
  );
}

function Chip({ label, val, color, bg, border }) {
  return (
    <div style={{
      display: "inline-flex", flexDirection: "column", alignItems: "center",
      background: bg || "rgba(255,255,255,0.05)",
      border: `1px solid ${border || "rgba(255,255,255,0.1)"}`,
      borderRadius: "8px", padding: "5px 12px", minWidth: "90px",
    }}>
      <span style={{ color: "#8899aa", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
      <span style={{ color: color || "white", fontSize: "14px", fontWeight: "800" }}>{val}</span>
    </div>
  );
}

function LigneRecap({ label, val, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: "#8899aa", fontSize: "13px" }}>{label}</span>
      <span style={{ color: bold ? "white" : "#ccc", fontSize: bold ? "14px" : "13px", fontWeight: bold ? "700" : "400" }}>{val}</span>
    </div>
  );
}

const aBtn = {
  display: "inline-flex", alignItems: "center", gap: "6px",
  background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)",
  color: PRIMARY, borderRadius: "8px", padding: "8px 14px",
  fontSize: "13px", fontWeight: "600", textDecoration: "none",
};

const dottedBtn = {
  background: "transparent", border: "1px dashed rgba(255,140,0,0.35)",
  color: PRIMARY, borderRadius: "8px", padding: "9px",
  width: "100%", cursor: "pointer", fontSize: "13px", fontWeight: "600",
};
