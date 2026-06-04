import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import CataloguePrestations from "./CataloguePrestations";
import ProGate from "./ProGate";

const PRIMARY = "#FF8C00";
const DARK = "#0a1628";
const CARD = "#111e35";

const inputStyle = {
  background: "#0a1628",
  border: "1px solid rgba(255,140,0,0.2)",
  borderRadius: "10px",
  padding: "12px 16px",
  color: "white",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box"
};

const THEMES = [
  { id: "classique",  label: "📄 Classique",          desc: "Sobre et professionnel",    color: "#333333" },
  { id: "moderne",    label: "🖤 Moderne",             desc: "Élégant et contemporain",   color: "#FF8C00" },
  { id: "couvreur",   label: "🏠 Couvreur",            desc: "Spécial toiture",           color: "#7B5E3A" },
  { id: "paysagiste", label: "🌿 Paysagiste",          desc: "Espaces verts",             color: "#2E7D32" },
  { id: "traitement", label: "🧹 Traitement toiture",  desc: "Nettoyage & anti-mousse",   color: "#1565C0" },
];

export default function NouveauDevis({ user, onBack, clientInitialId, modeSimple = false, isPro = true, onUpgrade }) {
  // ── Clients ────────────────────────────────────────────────────────────────
  const [clientsExistants, setClientsExistants] = useState([]);
  const [clientSelectionne, setClientSelectionne] = useState("nouveau"); // "nouveau" | id
  const [client, setClient] = useState({ nom: "", email: "", telephone: "", adresse: "" });

  // ── Document ───────────────────────────────────────────────────────────────
  const [lignes, setLignes] = useState([{ description: "", quantite: 1, prix_unitaire: 0 }]);
  const [tva, setTva] = useState(20);
  const [appliquerTva, setAppliquerTva] = useState(false);
  const [notes, setNotes] = useState("");
  const [style, setStyle] = useState("classique");
  const [dateValidite, setDateValidite] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showCatalogue, setShowCatalogue] = useState(false);
  const [catalogueLigneIndex, setCatalogueLigneIndex] = useState(null);

  // ── Mode simplifié ─────────────────────────────────────────────────────────
  const [descriptionSimple, setDescriptionSimple] = useState("");
  const [montantSimple, setMontantSimple]         = useState("");
  const [clientNomSimple, setClientNomSimple]     = useState("");
  const [clientTelSimple, setClientTelSimple]     = useState("");

  // ── Import photo (analyse IA) ──────────────────────────────────────────────
  const photoInputRef = useRef(null);
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [photoError,     setPhotoError]     = useState("");

  // ── Dictée vocale ─────────────────────────────────────────────────────────
  const [vocalEcoute,  setVocalEcoute]  = useState(false);
  const [vocalLoading, setVocalLoading] = useState(false);
  const [vocalError,   setVocalError]   = useState("");
  const [vocalTexte,   setVocalTexte]   = useState(""); // transcription live
  const vocalRecogRef = useRef(null);

  // ── ProGate modal ─────────────────────────────────────────────────────────
  const [proGateModal, setProGateModal] = useState(null);

  // ── Chargement des clients ─────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("clients")
      .select("id, nom, email, telephone, adresse")
      .eq("user_id", user.id)
      .order("nom", { ascending: true })
      .then(({ data }) => {
        const liste = data || [];
        setClientsExistants(liste);
        // Pré-sélection depuis un chantier
        if (clientInitialId) {
          const c = liste.find(cl => cl.id === clientInitialId);
          if (c) {
            setClientSelectionne(clientInitialId);
            setClient({ nom: c.nom || "", email: c.email || "", telephone: c.telephone || "", adresse: c.adresse || "" });
          }
        }
      });
  }, [user.id, clientInitialId]);

  // ── Sélection client ───────────────────────────────────────────────────────
  const selectionnerClient = (valeur) => {
    setClientSelectionne(valeur);
    if (valeur === "nouveau") {
      setClient({ nom: "", email: "", telephone: "", adresse: "" });
    } else {
      const c = clientsExistants.find(c => c.id === valeur);
      if (c) setClient({
        nom:       c.nom       || "",
        email:     c.email     || "",
        telephone: c.telephone || "",
        adresse:   c.adresse   || "",
      });
    }
  };

  // ── Lignes ─────────────────────────────────────────────────────────────────
  const totalHT  = lignes.reduce((sum, l) => sum + parseFloat(l.quantite) * parseFloat(l.prix_unitaire), 0);
  const totalTTC = appliquerTva ? totalHT * (1 + tva / 100) : totalHT;

  const ajouterLigne   = () => setLignes([...lignes, { description: "", quantite: 1, prix_unitaire: 0 }]);
  const supprimerLigne = (i) => setLignes(lignes.filter((_, idx) => idx !== i));
  const modifierLigne  = (i, champ, valeur) => {
    const nl = [...lignes]; nl[i][champ] = valeur; setLignes(nl);
  };

  // ── Import photo : compresser en JPEG base64 ──────────────────────────────
  const compresserImage = (file) => new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1024;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82).split(",")[1]);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });

  const analyserPhoto = async (fichier) => {
    setPhotoError("");
    setPhotoAnalyzing(true);
    try {
      const base64 = await compresserImage(fichier);
      if (!base64) { setPhotoError("❌ Impossible de lire l'image."); setPhotoAnalyzing(false); return; }

      const res = await fetch("/api/vision-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "devis-photo", imageBase64: base64, mimeType: "image/jpeg" }),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setPhotoError("❌ " + (json.error || "Analyse échouée"));
        setPhotoAnalyzing(false);
        return;
      }

      const d = json.data;

      if (modeSimple) {
        // Remplir les champs simplifiés
        if (d.client_nom)      setClientNomSimple(d.client_nom);
        if (d.client_telephone) setClientTelSimple(d.client_telephone);
        if (d.lignes?.length) {
          const totalHT = d.lignes.reduce((s, l) => s + (parseFloat(l.prix_unitaire) || 0) * (parseFloat(l.quantite) || 1), 0);
          setDescriptionSimple(d.lignes.map(l => l.description).filter(Boolean).join("\n"));
          setMontantSimple(String(totalHT.toFixed(2)));
        }
        if (d.tva) setTva(d.tva);
        if (typeof d.appliquer_tva === "boolean") setAppliquerTva(d.appliquer_tva);
      } else {
        // Remplir les champs complets
        if (d.client_nom)      setClient(c => ({ ...c, nom: d.client_nom }));
        if (d.client_telephone) setClient(c => ({ ...c, telephone: d.client_telephone }));
        if (d.client_adresse)  setClient(c => ({ ...c, adresse: d.client_adresse }));
        if (d.lignes?.length)  setLignes(d.lignes.map(l => ({
          description:  l.description  || "",
          quantite:     parseFloat(l.quantite)     || 1,
          prix_unitaire: parseFloat(l.prix_unitaire) || 0,
        })));
        if (d.tva) setTva(d.tva);
        if (typeof d.appliquer_tva === "boolean") setAppliquerTva(d.appliquer_tva);
        if (d.notes) setNotes(d.notes);
      }
      setMessage("✅ Devis analysé — vérifiez et complétez les champs !");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setPhotoError("❌ Erreur réseau : " + err.message);
    }
    setPhotoAnalyzing(false);
  };

  // ── Sauvegarde simplifiée ──────────────────────────────────────────────────
  const sauvegarderSimple = async () => {
    const nomClient = clientNomSimple.trim();
    if (!nomClient) { setMessage("❌ Le nom du client est obligatoire"); return; }
    if (!descriptionSimple.trim()) { setMessage("❌ La description des travaux est obligatoire"); return; }
    const montant = parseFloat(montantSimple);
    if (!montant || montant <= 0) { setMessage("❌ Montant invalide"); return; }

    setLoading(true);
    setMessage("");

    // Chercher un client existant avec le même nom (insensible à la casse)
    let clientId;
    const clientExistant = clientsExistants.find(
      c => c.nom.trim().toLowerCase() === nomClient.toLowerCase()
    );
    if (clientExistant) {
      clientId = clientExistant.id;
    } else {
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .insert({ nom: nomClient, telephone: clientTelSimple || null, user_id: user.id })
        .select()
        .single();
      if (clientError) { setMessage("❌ Erreur client : " + clientError.message); setLoading(false); return; }
      clientId = clientData.id;
      // Mettre à jour la liste locale
      setClientsExistants(prev => [...prev, clientData]);
    }

    const totalHT  = montant;
    const totalTTC = appliquerTva ? totalHT * (1 + tva / 100) : totalHT;
    const numero   = "DEV-" + Date.now();

    const { data: devisData, error: devisError } = await supabase
      .from("devis")
      .insert({ user_id: user.id, client_id: clientId, numero, total_ht: totalHT, tva: appliquerTva ? tva : 0, total_ttc: totalTTC, notes: "", style: "classique" })
      .select()
      .single();
    if (devisError) { setMessage("❌ Erreur devis : " + devisError.message); setLoading(false); return; }

    await supabase.from("lignes_devis").insert({
      devis_id:     devisData.id,
      description:  descriptionSimple.trim(),
      quantite:     1,
      prix_unitaire: totalHT,
      total:         totalHT,
    });

    setMessage("✅ Devis créé avec succès !");
    setLoading(false);
    setTimeout(() => onBack(), 1500);
  };

  // ── Sauvegarde ─────────────────────────────────────────────────────────────
  const sauvegarder = async () => {
    if (!client.nom.trim()) { setMessage("❌ Le nom du client est obligatoire"); return; }
    setLoading(true);
    setMessage("");

    let clientId;

    if (clientSelectionne !== "nouveau") {
      // Client existant : on utilise directement son ID, pas de doublon
      clientId = clientSelectionne;
    } else {
      // Nouveau client : on l'insère
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .insert({ nom: client.nom, email: client.email || null, telephone: client.telephone || null, adresse: client.adresse || null, user_id: user.id })
        .select()
        .single();
      if (clientError) { setMessage("❌ Erreur client : " + clientError.message); setLoading(false); return; }
      clientId = clientData.id;
    }

    const numero = "DEV-" + Date.now();
    const { data: devisData, error: devisError } = await supabase
      .from("devis")
      .insert({ user_id: user.id, client_id: clientId, numero, date_validite: dateValidite || null, total_ht: totalHT, tva: appliquerTva ? tva : 0, total_ttc: totalTTC, notes, style })
      .select()
      .single();
    if (devisError) { setMessage("❌ Erreur devis : " + devisError.message); setLoading(false); return; }

    const lignesData = lignes.map(l => ({
      devis_id: devisData.id,
      description: l.description,
      quantite: parseFloat(l.quantite),
      prix_unitaire: parseFloat(l.prix_unitaire),
      total: parseFloat(l.quantite) * parseFloat(l.prix_unitaire)
    }));
    const { error: lignesError } = await supabase.from("lignes_devis").insert(lignesData);
    if (lignesError) { setMessage("❌ Erreur lignes : " + lignesError.message); setLoading(false); return; }

    setMessage("✅ Devis créé avec succès !");
    setLoading(false);
    setTimeout(() => onBack(), 1500);
  };

  // ── Dictée vocale ─────────────────────────────────────────────────────────
  const traiterTranscription = async (transcript) => {
    setVocalLoading(true);
    setVocalError("");
    setVocalTexte("");
    try {
      const API = import.meta.env.VITE_API_URL || "https://artisan-plus.vercel.app";
      const r = await fetch(`${API}/api/process-vocal-devis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcription: transcript }),
      });
      const json = await r.json();
      if (!json.ok) { setVocalError("❌ " + (json.error || "Analyse échouée")); setVocalLoading(false); return; }
      const d = json.data;

      if (modeSimple) {
        if (d.client_nom)       setClientNomSimple(d.client_nom);
        if (d.client_telephone) setClientTelSimple(d.client_telephone);
        if (d.lignes?.length) {
          const total = d.lignes.reduce((s, l) => s + (parseFloat(l.prix_unitaire) || 0) * (parseFloat(l.quantite) || 1), 0);
          setDescriptionSimple(d.lignes.map(l => l.description).filter(Boolean).join("\n"));
          setMontantSimple(String(total.toFixed(2)));
        }
        if (d.tva) setTva(d.tva);
        if (typeof d.appliquer_tva === "boolean") setAppliquerTva(d.appliquer_tva);
      } else {
        if (d.client_nom)       setClient(c => ({ ...c, nom: d.client_nom }));
        if (d.client_telephone) setClient(c => ({ ...c, telephone: d.client_telephone }));
        if (d.client_adresse)   setClient(c => ({ ...c, adresse: d.client_adresse }));
        if (d.lignes?.length)   setLignes(d.lignes.map(l => ({
          description:   l.description   || "",
          quantite:      parseFloat(l.quantite)      || 1,
          prix_unitaire: parseFloat(l.prix_unitaire) || 0,
        })));
        if (d.tva) setTva(d.tva);
        if (typeof d.appliquer_tva === "boolean") setAppliquerTva(d.appliquer_tva);
        if (d.notes) setNotes(d.notes);
      }

      // Afficher éléments manquants si confiance faible
      if (d.elements_manquants?.length) {
        setVocalError("⚠️ Manquants : " + d.elements_manquants.join(", "));
      }
      setMessage("✅ Devis rempli depuis votre dictée — vérifiez les montants !");
      setTimeout(() => setMessage(""), 4500);
    } catch (err) {
      setVocalError("❌ Erreur réseau : " + err.message);
    }
    setVocalLoading(false);
  };

  const demarrerVocal = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setVocalError("❌ Dictée non supportée. Utilisez Chrome ou Safari récent.");
      return;
    }
    setVocalError("");
    setVocalTexte("");
    const recog = new SpeechRec();
    recog.lang = "fr-FR";
    recog.continuous = false;
    recog.interimResults = true;
    recog.maxAlternatives = 1;

    recog.onresult = (e) => {
      const interim = Array.from(e.results).map(r => r[0].transcript).join(" ");
      setVocalTexte(interim);
      if (e.results[e.results.length - 1].isFinal) {
        recog.stop();
        traiterTranscription(interim);
      }
    };
    recog.onerror = (e) => {
      setVocalEcoute(false);
      setVocalError(e.error === "no-speech" ? "⚠️ Aucune voix détectée. Réessayez." : "❌ Erreur : " + e.error);
    };
    recog.onend = () => setVocalEcoute(false);

    vocalRecogRef.current = recog;
    recog.start();
    setVocalEcoute(true);
  };

  const arreterVocal = () => {
    vocalRecogRef.current?.stop();
    setVocalEcoute(false);
  };

  const boutonVocal = (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <button
        onClick={vocalEcoute ? arreterVocal : (!isPro ? () => setProGateModal("vocal") : demarrerVocal)}
        disabled={vocalLoading || photoAnalyzing}
        style={{
          background: vocalEcoute
            ? "rgba(255,60,60,0.15)"
            : vocalLoading
              ? "rgba(255,140,0,0.06)"
              : "rgba(255,140,0,0.12)",
          border: `1.5px solid ${vocalEcoute ? "rgba(255,60,60,0.5)" : "rgba(255,140,0,0.4)"}`,
          color: vocalEcoute ? "#ff6b6b" : PRIMARY,
          borderRadius: "12px",
          padding: "12px 20px",
          cursor: vocalLoading ? "wait" : "pointer",
          fontSize: "14px", fontWeight: "700",
          display: "flex", alignItems: "center", gap: "8px",
          width: "100%", justifyContent: "center",
          transition: "all 0.15s",
          animation: vocalEcoute ? "pulse 1.2s infinite" : "none",
          opacity: (vocalLoading || photoAnalyzing) ? 0.7 : 1,
        }}
      >
        {vocalLoading ? (
          <>⏳ L'IA analyse votre dictée…</>
        ) : vocalEcoute ? (
          <>🔴 En écoute… Parlez maintenant (cliquez pour arrêter)</>
        ) : (
          <>🎙️ Créer un devis à la voix — IA</>
        )}
      </button>
      {vocalTexte && !vocalLoading && (
        <div style={{ color: "#8899aa", fontSize: "12px", fontStyle: "italic", padding: "4px 8px",
          background: "rgba(255,255,255,0.04)", borderRadius: "6px", lineHeight: "1.5" }}>
          "{vocalTexte}"
        </div>
      )}
      {vocalError && (
        <div style={{ color: vocalError.startsWith("⚠️") ? "#FFB74D" : "#ff6b6b",
          fontSize: "12px", padding: "4px 8px" }}>
          {vocalError}
        </div>
      )}
    </div>
  );

  // ── Bouton import photo (commun aux deux modes) ────────────────────────────
  const boutonImportPhoto = (
    <>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={e => { if (e.target.files[0]) { analyserPhoto(e.target.files[0]); e.target.value = ""; } }}
      />
      <button
        onClick={() => { if (!isPro) { setProGateModal("photo_import"); return; } photoInputRef.current?.click(); }}
        disabled={photoAnalyzing}
        style={{
          background: photoAnalyzing ? "rgba(168,85,247,0.06)" : "rgba(168,85,247,0.1)",
          border: "1.5px solid rgba(168,85,247,0.4)",
          color: "#a855f7",
          borderRadius: "12px",
          padding: "12px 20px",
          cursor: photoAnalyzing ? "wait" : "pointer",
          fontSize: "14px",
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          justifyContent: "center",
          transition: "all 0.15s",
        }}
      >
        {photoAnalyzing ? (
          <>⏳ Analyse en cours…</>
        ) : (
          <>📷 Importer un devis papier — analyse IA</>
        )}
      </button>
      {photoError && (
        <div style={{ color: "#ff6b6b", fontSize: "13px", textAlign: "center", marginTop: "8px" }}>{photoError}</div>
      )}
    </>
  );

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: DARK, fontFamily: "'Segoe UI', sans-serif" }}>

      {/* HEADER STICKY */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: DARK, borderBottom: "1px solid rgba(255,140,0,0.12)" }}>
        <div style={{ height: "env(safe-area-inset-top, 0px)", background: DARK }} />
        <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 20px" }}>
          <button onClick={onBack} style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)", color: PRIMARY, borderRadius: "8px", padding: "9px 16px", cursor: "pointer", fontSize: "14px", fontWeight: "700", flexShrink: 0 }}>← Retour</button>
          <h1 style={{ color: "white", margin: 0, fontSize: "20px", fontWeight: "800", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Nouveau Devis</h1>
        </div>
      </div>
      <div style={{ padding: "24px" }}>

      {/* ── FORMULAIRE SIMPLIFIÉ ───────────────────────────────── */}
      {modeSimple && (
        <div style={{ maxWidth: "520px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Vocal IA */}
          {boutonVocal}

          {/* Import photo */}
          {boutonImportPhoto}

          {/* Client */}
          <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
            <h3 style={{ color: "white", marginTop: 0, fontSize: "18px" }}>👤 Client</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                placeholder="Nom du client *"
                value={clientNomSimple}
                onChange={e => setClientNomSimple(e.target.value)}
                style={{ ...inputStyle, fontSize: "16px", padding: "14px 16px" }}
              />
              <input
                placeholder="Téléphone (optionnel)"
                value={clientTelSimple}
                onChange={e => setClientTelSimple(e.target.value)}
                type="tel"
                style={{ ...inputStyle, fontSize: "16px", padding: "14px 16px" }}
              />
            </div>
          </div>

          {/* Travaux */}
          <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
            <h3 style={{ color: "white", marginTop: 0, fontSize: "18px" }}>🔨 Description des travaux</h3>
            <textarea
              placeholder="Ex : Nettoyage toiture + traitement anti-mousse…"
              value={descriptionSimple}
              onChange={e => setDescriptionSimple(e.target.value)}
              rows={4}
              style={{ background: DARK, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "14px 16px", color: "white", fontSize: "15px", outline: "none", width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "'Segoe UI', sans-serif" }}
            />
          </div>

          {/* Montant + TVA */}
          <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
            <h3 style={{ color: "white", marginTop: 0, fontSize: "18px" }}>💰 Montant</h3>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "140px" }}>
                <label style={{ color: "#8899aa", fontSize: "12px", display: "block", marginBottom: "6px" }}>Montant HT (€) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={montantSimple}
                  onChange={e => setMontantSimple(e.target.value)}
                  style={{ ...inputStyle, fontSize: "22px", fontWeight: "800", padding: "14px 16px", color: PRIMARY }}
                />
              </div>
              <div style={{ flexShrink: 0, paddingTop: "18px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={appliquerTva}
                    onChange={e => setAppliquerTva(e.target.checked)}
                    style={{ width: "20px", height: "20px", accentColor: PRIMARY, cursor: "pointer" }}
                  />
                  <span style={{ color: "white", fontSize: "16px", fontWeight: "600" }}>TVA {tva}%</span>
                </label>
              </div>
            </div>
            {montantSimple && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderTop: "1px solid rgba(255,140,0,0.2)" }}>
                <span style={{ color: "white", fontWeight: "800", fontSize: "18px" }}>{appliquerTva ? "Total TTC" : "Total HT"}</span>
                <span style={{ color: PRIMARY, fontWeight: "800", fontSize: "22px" }}>
                  {appliquerTva
                    ? (parseFloat(montantSimple || 0) * (1 + tva / 100)).toFixed(2)
                    : parseFloat(montantSimple || 0).toFixed(2)
                  } €
                </span>
              </div>
            )}
          </div>

          {message && (
            <div style={{ color: message.includes("✅") ? "#4CAF50" : "#ff6b6b", textAlign: "center", fontSize: "15px", fontWeight: "600" }}>
              {message}
            </div>
          )}

          <button
            onClick={sauvegarderSimple}
            disabled={loading}
            style={{
              background: loading ? "#888" : PRIMARY, color: "white", border: "none",
              borderRadius: "14px", padding: "18px", fontSize: "18px", fontWeight: "800",
              cursor: loading ? "not-allowed" : "pointer", marginBottom: "32px",
            }}
          >
            {loading ? "Sauvegarde…" : "💾 Créer le devis"}
          </button>
        </div>
      )}

      {/* ── FORMULAIRE COMPLET (mode normal) ─────────────────────── */}
      {!modeSimple && (

      <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* VOCAL IA */}
        {boutonVocal}

        {/* IMPORT PHOTO */}
        {boutonImportPhoto}

        {/* THÈME */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h3 style={{ color: "white", marginTop: 0 }}>🎨 Thème du devis</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
            {THEMES.map(t => (
              <button key={t.id} onClick={() => setStyle(t.id)} style={{
                padding: "16px 12px",
                border: `2px solid ${style === t.id ? t.color : "rgba(255,255,255,0.1)"}`,
                borderRadius: "12px",
                background: style === t.id ? `${t.color}22` : "transparent",
                color: style === t.id ? t.color : "#8899aa",
                cursor: "pointer", fontWeight: "600", textAlign: "center", transition: "all 0.2s"
              }}>
                <div style={{ fontSize: "24px", marginBottom: "6px" }}>{t.label.split(" ")[0]}</div>
                <div style={{ fontSize: "12px", fontWeight: "700" }}>{t.label.split(" ").slice(1).join(" ")}</div>
                <div style={{ fontSize: "10px", marginTop: "4px", opacity: 0.7 }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* DATE VALIDITÉ */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h3 style={{ color: "white", marginTop: 0 }}>📅 Validité du devis</h3>
          <label style={{ color: "#8899aa", fontSize: "12px", marginBottom: "6px", display: "block" }}>
            Date limite de validité (optionnel)
          </label>
          <input type="date" value={dateValidite} onChange={e => setDateValidite(e.target.value)}
            style={{ ...inputStyle, colorScheme: "dark" }} />
        </div>

        {/* CLIENT */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h3 style={{ color: "white", marginTop: 0 }}>👤 Informations client</h3>

          {/* Sélecteur client */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Sélectionner un client
            </label>
            <select
              value={clientSelectionne}
              onChange={e => selectionnerClient(e.target.value)}
              style={{
                background: DARK, border: `1px solid ${clientSelectionne !== "nouveau" ? PRIMARY : "rgba(255,140,0,0.3)"}`,
                borderRadius: "10px", padding: "12px 16px",
                color: "white", fontSize: "14px", outline: "none",
                width: "100%", boxSizing: "border-box", cursor: "pointer"
              }}
            >
              <option value="nouveau">➕ Nouveau client (saisie manuelle)</option>
              {clientsExistants.length > 0 && (
                <optgroup label="── Clients existants ──" style={{ color: "#8899aa" }}>
                  {clientsExistants.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nom}{c.telephone ? ` — ${c.telephone}` : ""}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {clientSelectionne !== "nouveau" && (
              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px", color: PRIMARY, fontSize: "12px", fontWeight: "600" }}>
                <span style={{ background: "rgba(255,140,0,0.12)", border: "1px solid rgba(255,140,0,0.3)", borderRadius: "6px", padding: "3px 10px" }}>
                  ✓ Champs pré-remplis depuis votre carnet clients
                </span>
                <span style={{ color: "#8899aa", fontWeight: "400" }}>Modifiables si besoin</span>
              </div>
            )}
          </div>

          {/* Champs client */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <input placeholder="Nom du client *" value={client.nom}
              onChange={e => setClient({ ...client, nom: e.target.value })} style={inputStyle} />
            <input placeholder="Email" value={client.email}
              onChange={e => setClient({ ...client, email: e.target.value })} style={inputStyle} />
            <input placeholder="Téléphone" value={client.telephone}
              onChange={e => setClient({ ...client, telephone: e.target.value })} style={inputStyle} />
            <input placeholder="Adresse" value={client.adresse}
              onChange={e => setClient({ ...client, adresse: e.target.value })} style={inputStyle} />
          </div>
        </div>

        {/* PRESTATIONS */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h3 style={{ color: "white", marginTop: 0 }}>🔨 Prestations</h3>
          {lignes.map((ligne, i) => (
            <div key={i} style={{ marginBottom: "14px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", padding: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
              {/* Ligne 1 : description + bouton catalogue */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input
                  placeholder="Description de la prestation"
                  value={ligne.description}
                  onChange={e => modifierLigne(i, "description", e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={() => { setCatalogueLigneIndex(i); setShowCatalogue(true); }}
                  title="Choisir depuis le catalogue"
                  style={{
                    background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.35)",
                    color: PRIMARY, borderRadius: "10px", padding: "8px 14px",
                    cursor: "pointer", fontSize: "18px", whiteSpace: "nowrap", flexShrink: 0,
                    transition: "background 0.15s"
                  }}
                >
                  📚
                </button>
              </div>
              {/* Ligne 2 : quantité + prix + supprimer */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "8px" }}>
                <input placeholder="Qté" type="number" value={ligne.quantite}
                  onChange={e => modifierLigne(i, "quantite", e.target.value)} style={inputStyle} />
                <input placeholder="Prix HT (€)" type="number" value={ligne.prix_unitaire}
                  onChange={e => modifierLigne(i, "prix_unitaire", e.target.value)} style={inputStyle} />
                <button onClick={() => supprimerLigne(i)} style={{ background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.3)", color: "#ff6b6b", borderRadius: "8px", padding: "8px 12px", cursor: "pointer" }}>✕</button>
              </div>
            </div>
          ))}
          <button onClick={ajouterLigne} style={{ background: "transparent", border: `1px dashed ${PRIMARY}`, color: PRIMARY, borderRadius: "10px", padding: "12px 24px", cursor: "pointer", width: "100%", fontSize: "14px", fontWeight: "600" }}>
            + Ajouter une prestation
          </button>
        </div>

        {/* CATALOGUE MODAL */}
        {showCatalogue && (
          <CataloguePrestations
            user={user}
            onSelectArticle={(desc, prix) => {
              if (catalogueLigneIndex !== null) {
                modifierLigne(catalogueLigneIndex, "description", desc);
                modifierLigne(catalogueLigneIndex, "prix_unitaire", prix);
              }
            }}
            onClose={() => { setShowCatalogue(false); setCatalogueLigneIndex(null); }}
          />
        )}

        {/* TOTAL */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h3 style={{ color: "white", marginTop: 0 }}>💰 Total</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", padding: "16px", background: "#0a1628", borderRadius: "10px" }}>
            <input type="checkbox" id="tva" checked={appliquerTva} onChange={e => setAppliquerTva(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: PRIMARY }} />
            <label htmlFor="tva" style={{ color: "white", fontSize: "15px", cursor: "pointer", fontWeight: "600" }}>Appliquer la TVA</label>
          </div>
          {!appliquerTva && (
            <div style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)", borderRadius: "10px", padding: "12px", marginBottom: "16px" }}>
              <span style={{ color: PRIMARY, fontSize: "13px", fontWeight: "600" }}>📋 Mention ajoutée automatiquement : "TVA non applicable, art. 293 B du CGI"</span>
            </div>
          )}
          {appliquerTva && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ color: "#8899aa" }}>Taux TVA (%)</span>
              <input type="number" value={tva} onChange={e => setTva(e.target.value)}
                style={{ background: "#0a1628", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "8px 12px", color: "white", fontSize: "14px", outline: "none", width: "100px", textAlign: "right" }} />
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#8899aa" }}>Total HT</span>
            <span style={{ color: "white", fontWeight: "600" }}>{totalHT.toFixed(2)} €</span>
          </div>
          {appliquerTva && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "#8899aa" }}>TVA ({tva}%)</span>
              <span style={{ color: "white", fontWeight: "600" }}>{(totalTTC - totalHT).toFixed(2)} €</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", borderTop: "1px solid rgba(255,140,0,0.2)" }}>
            <span style={{ color: "white", fontWeight: "800", fontSize: "18px" }}>{appliquerTva ? "Total TTC" : "Total"}</span>
            <span style={{ color: PRIMARY, fontWeight: "800", fontSize: "18px" }}>{totalTTC.toFixed(2)} €</span>
          </div>
        </div>

        {/* NOTES */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h3 style={{ color: "white", marginTop: 0 }}>📝 Notes</h3>
          <textarea placeholder="Notes ou conditions particulières..." value={notes} onChange={e => setNotes(e.target.value)}
            style={{ background: "#0a1628", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "12px 16px", color: "white", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", height: "100px", resize: "vertical" }} />
        </div>

        {message && (
          <div style={{ color: message.includes("✅") ? "#4CAF50" : "#ff6b6b", textAlign: "center", fontSize: "15px", fontWeight: "600" }}>
            {message}
          </div>
        )}

        <button onClick={sauvegarder} disabled={loading} style={{
          background: loading ? "#888" : PRIMARY, color: "white", border: "none",
          borderRadius: "12px", padding: "16px", fontSize: "17px", fontWeight: "700",
          cursor: loading ? "not-allowed" : "pointer", marginBottom: "32px"
        }}>
          {loading ? "Sauvegarde..." : "💾 Sauvegarder le devis"}
        </button>
      </div>
      )}
      </div>{/* end padding wrapper */}

      {/* ProGate modal — fonctionnalités Pro */}
      {proGateModal && (
        <ProGate
          featureKey={proGateModal}
          mode="modal"
          onUpgrade={() => { setProGateModal(null); onUpgrade?.(); }}
          onDismiss={() => setProGateModal(null)}
        />
      )}
    </div>
  );
}
