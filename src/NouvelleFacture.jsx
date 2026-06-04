import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import CataloguePrestations from "./CataloguePrestations";

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

export default function NouvelleFacture({ user, onBack, clientInitialId, modeSimple = false }) {
  // ── Clients ────────────────────────────────────────────────────────────────
  const [clientsExistants, setClientsExistants] = useState([]);
  const [clientSelectionne, setClientSelectionne] = useState("nouveau"); // "nouveau" | id
  const [client, setClient] = useState({ nom: "", email: "", telephone: "", adresse: "" });

  // ── Document ───────────────────────────────────────────────────────────────
  const [lignes, setLignes] = useState([{ description: "", quantite: 1, prix_unitaire: 0 }]);
  const [tva, setTva] = useState(20);
  const [appliquerTva, setAppliquerTva] = useState(true);
  const [notes, setNotes] = useState("");
  const [style, setStyle] = useState("classique");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [natureOperation, setNatureOperation] = useState("");
  const [tvaSurDebits, setTvaSurDebits] = useState(false);
  const [showCatalogue, setShowCatalogue] = useState(false);
  const [catalogueLigneIndex, setCatalogueLigneIndex] = useState(null);

  // ── Mode simplifié ─────────────────────────────────────────────────────────
  const [descriptionSimple, setDescriptionSimple] = useState("");
  const [montantSimple, setMontantSimple]         = useState("");
  const [clientNomSimple, setClientNomSimple]     = useState("");
  const [clientTelSimple, setClientTelSimple]     = useState("");

  // ── Chargement des clients + paramètres ───────────────────────────────────
  useEffect(() => {
    // Charger le paramètre TVA sur les débits
    supabase
      .from("parametres")
      .select("tva_sur_debits, tva_defaut")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.tva_sur_debits) setTvaSurDebits(true);
        if (data?.tva_defaut)     setTva(data.tva_defaut);
      });
  }, [user.id]);

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

    const numero = "FAC-" + Date.now();
    const { data: factureData, error: factureError } = await supabase
      .from("factures")
      .insert({ user_id: user.id, client_id: clientId, numero, total_ht: totalHT, tva: appliquerTva ? tva : 0, total_ttc: totalTTC, notes, style, nature_operation: natureOperation || null, tva_sur_debits: tvaSurDebits })
      .select()
      .single();
    if (factureError) { setMessage("❌ Erreur facture : " + factureError.message); setLoading(false); return; }

    const lignesData = lignes.map(l => ({
      facture_id: factureData.id,
      description: l.description,
      quantite: parseFloat(l.quantite),
      prix_unitaire: parseFloat(l.prix_unitaire),
      total: parseFloat(l.quantite) * parseFloat(l.prix_unitaire)
    }));
    const { error: lignesError } = await supabase.from("lignes_facture").insert(lignesData);
    if (lignesError) { setMessage("❌ Erreur lignes : " + lignesError.message); setLoading(false); return; }

    setMessage("✅ Facture créée avec succès !");
    setLoading(false);
    setTimeout(() => onBack(), 1500);
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
    const numero   = "FAC-" + Date.now();

    const { data: factureData, error: factureError } = await supabase
      .from("factures")
      .insert({ user_id: user.id, client_id: clientId, numero, total_ht: totalHT, tva: appliquerTva ? tva : 0, total_ttc: totalTTC, notes: "", style: "classique", nature_operation: null, tva_sur_debits: false })
      .select()
      .single();
    if (factureError) { setMessage("❌ Erreur facture : " + factureError.message); setLoading(false); return; }

    await supabase.from("lignes_facture").insert({
      facture_id:    factureData.id,
      description:   descriptionSimple.trim(),
      quantite:      1,
      prix_unitaire: totalHT,
      total:         totalHT,
    });

    setMessage("✅ Facture créée avec succès !");
    setLoading(false);
    setTimeout(() => onBack(), 1500);
  };

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: DARK, fontFamily: "'Segoe UI', sans-serif" }}>

      {/* HEADER STICKY */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: DARK, borderBottom: "1px solid rgba(255,140,0,0.12)" }}>
        <div style={{ height: "env(safe-area-inset-top, 0px)", background: DARK }} />
        <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 20px" }}>
          <button onClick={onBack} style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)", color: PRIMARY, borderRadius: "8px", padding: "9px 16px", cursor: "pointer", fontSize: "14px", fontWeight: "700", flexShrink: 0 }}>← Retour</button>
          <h1 style={{ color: "white", margin: 0, fontSize: "20px", fontWeight: "800", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Nouvelle Facture</h1>
        </div>
      </div>
      <div style={{ padding: "24px" }}>

      {/* ── FORMULAIRE SIMPLIFIÉ ────────────────────────────────── */}
      {modeSimple && (
        <div style={{ maxWidth: "520px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

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
              placeholder="Ex : Pose de carrelage salle de bain…"
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
            {loading ? "Sauvegarde…" : "💾 Créer la facture"}
          </button>
        </div>
      )}

      {/* ── FORMULAIRE COMPLET (mode normal) ─────────────────────── */}
      {!modeSimple && (
      <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* THÈME */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h3 style={{ color: "white", marginTop: 0 }}>🎨 Thème de la facture</h3>
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

        {/* INFORMATIONS DU DOCUMENT */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h3 style={{ color: "white", marginTop: 0 }}>🗂️ Informations du document</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Nature de l'opération */}
            <div>
              <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Nature de l'opération
              </label>
              <select
                value={natureOperation}
                onChange={e => setNatureOperation(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer", color: natureOperation ? "white" : "#8899aa" }}
              >
                <option value="">— Non renseigné —</option>
                <option value="Prestation de services">Prestation de services</option>
                <option value="Vente de biens">Vente de biens</option>
                <option value="Vente et prestation">Vente et prestation</option>
              </select>
              {natureOperation && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", color: PRIMARY, fontSize: "12px", fontWeight: "600" }}>
                  <span style={{ background: "rgba(255,140,0,0.12)", border: "1px solid rgba(255,140,0,0.3)", borderRadius: "6px", padding: "3px 10px" }}>
                    ✓ Apparaîtra sur le PDF
                  </span>
                </div>
              )}
            </div>

            {/* TVA sur les débits */}
            <label style={{
              display: "flex", alignItems: "flex-start", gap: "14px", cursor: "pointer",
              background: tvaSurDebits ? "rgba(255,140,0,0.07)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${tvaSurDebits ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: "12px", padding: "14px 16px", transition: "all 0.15s",
            }}>
              <input type="checkbox" checked={tvaSurDebits} onChange={e => setTvaSurDebits(e.target.checked)}
                style={{ accentColor: PRIMARY, width: "18px", height: "18px", flexShrink: 0, marginTop: "2px", cursor: "pointer" }} />
              <div>
                <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>💳 TVA sur les débits</div>
                <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "3px", lineHeight: "1.4" }}>
                  Ajoute la mention « TVA exigible d'après les débits » sur cette facture
                  {tvaSurDebits && <span style={{ color: PRIMARY, fontWeight: "600" }}> — activé par défaut dans vos Paramètres</span>}
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* NOTES */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h3 style={{ color: "white", marginTop: 0 }}>📝 Notes</h3>
          <textarea placeholder="Notes ou mentions particulières..." value={notes} onChange={e => setNotes(e.target.value)}
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
          {loading ? "Sauvegarde..." : "💾 Sauvegarder la facture"}
        </button>
      </div>
      )}
      </div>{/* end padding wrapper */}
    </div>
  );
}
