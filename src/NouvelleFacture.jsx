import { useState } from "react";
import { supabase } from "./supabase";

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

export default function NouvelleFacture({ user, onBack }) {
  const [client, setClient] = useState({ nom: "", email: "", telephone: "", adresse: "" });
  const [lignes, setLignes] = useState([{ description: "", quantite: 1, prix_unitaire: 0 }]);
  const [tva, setTva] = useState(20);
  const [notes, setNotes] = useState("");
  const [style, setStyle] = useState("classique");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const totalHT = lignes.reduce((sum, l) => sum + (parseFloat(l.quantite) * parseFloat(l.prix_unitaire)), 0);
  const totalTTC = totalHT * (1 + tva / 100);

  const ajouterLigne = () => setLignes([...lignes, { description: "", quantite: 1, prix_unitaire: 0 }]);

  const modifierLigne = (i, champ, valeur) => {
    const nouvelles = [...lignes];
    nouvelles[i][champ] = valeur;
    setLignes(nouvelles);
  };

  const supprimerLigne = (i) => setLignes(lignes.filter((_, index) => index !== i));

  const sauvegarder = async () => {
    setLoading(true);
    setMessage("");

    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .insert({ ...client, user_id: user.id })
      .select()
      .single();

    if (clientError) {
      setMessage("❌ Erreur client: " + clientError.message);
      setLoading(false);
      return;
    }

    const numero = "FAC-" + Date.now();
    const { data: factureData, error: factureError } = await supabase
      .from("factures")
      .insert({
        user_id: user.id,
        client_id: clientData.id,
        numero,
        total_ht: totalHT,
        tva,
        total_ttc: totalTTC,
        notes,
        style
      })
      .select()
      .single();

    if (factureError) {
      setMessage("❌ Erreur facture: " + factureError.message);
      setLoading(false);
      return;
    }

    const lignesData = lignes.map(l => ({
      facture_id: factureData.id,
      description: l.description,
      quantite: parseFloat(l.quantite),
      prix_unitaire: parseFloat(l.prix_unitaire),
      total: parseFloat(l.quantite) * parseFloat(l.prix_unitaire)
    }));

    const { error: lignesError } = await supabase.from("lignes_facture").insert(lignesData);

    if (lignesError) {
      setMessage("❌ Erreur lignes: " + lignesError.message);
      setLoading(false);
      return;
    }

    setMessage("✅ Facture créée avec succès !");
    setLoading(false);
    setTimeout(() => onBack(), 1500);
  };

  return (
    <div style={{ minHeight: "100vh", background: DARK, fontFamily: "'Segoe UI', sans-serif", padding: "24px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
        <button onClick={onBack} style={{
          background: "transparent", border: "1px solid rgba(255,140,0,0.3)",
          color: PRIMARY, borderRadius: "8px", padding: "8px 16px",
          cursor: "pointer", fontSize: "14px"
        }}>← Retour</button>
        <h1 style={{ color: "white", margin: 0, fontSize: "24px" }}>Nouvelle Facture</h1>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* STYLE */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h3 style={{ color: "white", marginTop: 0 }}>🎨 Style de la facture</h3>
          <div style={{ display: "flex", gap: "12px" }}>
            {["classique", "moderne", "colore"].map(s => (
              <button key={s} onClick={() => setStyle(s)} style={{
                flex: 1, padding: "12px",
                border: `2px solid ${style === s ? PRIMARY : "rgba(255,140,0,0.2)"}`,
                borderRadius: "10px",
                background: style === s ? "rgba(255,140,0,0.1)" : "transparent",
                color: style === s ? PRIMARY : "#8899aa",
                cursor: "pointer", fontWeight: "600"
              }}>
                {s === "classique" ? "📄 Classique" : s === "moderne" ? "🖤 Moderne" : "🎨 Coloré"}
              </button>
            ))}
          </div>
        </div>

        {/* CLIENT */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h3 style={{ color: "white", marginTop: 0 }}>👤 Informations client</h3>
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
            <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr auto", gap: "12px", marginBottom: "12px" }}>
              <input placeholder="Description de la prestation"
                value={ligne.description}
                onChange={e => modifierLigne(i, "description", e.target.value)}
                style={inputStyle} />
              <input placeholder="Qté" type="number"
                value={ligne.quantite}
                onChange={e => modifierLigne(i, "quantite", e.target.value)}
                style={inputStyle} />
              <input placeholder="Prix HT (€)" type="number"
                value={ligne.prix_unitaire}
                onChange={e => modifierLigne(i, "prix_unitaire", e.target.value)}
                style={inputStyle} />
              <button onClick={() => supprimerLigne(i)} style={{
                background: "rgba(255,100,100,0.1)",
                border: "1px solid rgba(255,100,100,0.3)",
                color: "#ff6b6b", borderRadius: "8px",
                padding: "8px 12px", cursor: "pointer"
              }}>✕</button>
            </div>
          ))}
          <button onClick={ajouterLigne} style={{
            background: "transparent", border: `1px dashed ${PRIMARY}`,
            color: PRIMARY, borderRadius: "10px", padding: "12px 24px",
            cursor: "pointer", width: "100%", fontSize: "14px", fontWeight: "600"
          }}>+ Ajouter une prestation</button>
        </div>

        {/* TOTAL */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h3 style={{ color: "white", marginTop: 0 }}>💰 Total</h3>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ color: "#8899aa" }}>TVA (%)</span>
            <input type="number" value={tva}
              onChange={e => setTva(e.target.value)}
              style={{ background: "#0a1628", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "8px 12px", color: "white", fontSize: "14px", outline: "none", width: "100px", textAlign: "right" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#8899aa" }}>Total HT</span>
            <span style={{ color: "white", fontWeight: "600" }}>{totalHT.toFixed(2)} €</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#8899aa" }}>TVA ({tva}%)</span>
            <span style={{ color: "white", fontWeight: "600" }}>{(totalTTC - totalHT).toFixed(2)} €</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", borderTop: "1px solid rgba(255,140,0,0.2)" }}>
            <span style={{ color: "white", fontWeight: "800", fontSize: "18px" }}>Total TTC</span>
            <span style={{ color: PRIMARY, fontWeight: "800", fontSize: "18px" }}>{totalTTC.toFixed(2)} €</span>
          </div>
        </div>

        {/* NOTES */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h3 style={{ color: "white", marginTop: 0 }}>📝 Notes</h3>
          <textarea placeholder="Notes ou mentions particulières..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{
              background: "#0a1628",
              border: "1px solid rgba(255,140,0,0.2)",
              borderRadius: "10px",
              padding: "12px 16px",
              color: "white",
              fontSize: "14px",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
              height: "100px",
              resize: "vertical"
            }} />
        </div>

        {message && (
          <div style={{
            color: message.includes("✅") ? "#4CAF50" : "#ff6b6b",
            textAlign: "center", fontSize: "15px", fontWeight: "600"
          }}>
            {message}
          </div>
        )}

        <button onClick={sauvegarder} disabled={loading} style={{
          background: loading ? "#888" : PRIMARY,
          color: "white", border: "none", borderRadius: "12px",
          padding: "16px", fontSize: "17px", fontWeight: "700",
          cursor: loading ? "not-allowed" : "pointer", marginBottom: "32px"
        }}>
          {loading ? "Sauvegarde..." : "💾 Sauvegarder la facture"}
        </button>
      </div>
    </div>
  );
}
