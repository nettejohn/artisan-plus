import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import NouvelleFacture from "./NouvelleFacture";
import NouveauDevis from "./NouveauDevis";
import { genererFacturePDF } from "./GenerateurPDF";
import Profil from "./Profil";

const PRIMARY = "#FF8C00";
const DARK = "#0a1628";
const CARD = "#111e35";

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("accueil");
  const [page, setPage] = useState("dashboard");
  const [factures, setFactures] = useState([]);
  const [devis, setDevis] = useState([]);
  const [profil, setProfil] = useState(null);
  const [stats, setStats] = useState({ factures: 0, devis: 0, ca: 0, clients: 0 });
  const [lienCopie, setLienCopie] = useState(null);

  // États clients
  const [clients, setClients] = useState([]);
  const [clientModal, setClientModal] = useState(false);
  const [clientEdite, setClientEdite] = useState(null);
  const [clientForm, setClientForm] = useState({ nom: "", email: "", telephone: "", adresse: "", date_premier_contact: "", type_prestation: "", source: "", notes: "", appreciation: "", moyen_paiement: "", moment_appel: "", recommande_par: "", garantie_decennale_expiration: "" });
  const [clientSearch, setClientSearch] = useState("");
  const [clientLoading, setClientLoading] = useState(false);
  const [clientMessage, setClientMessage] = useState("");
  const [clientDetailId, setClientDetailId] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(null); // id du client en cours d'upload

  useEffect(() => {
    chargerDonnees();
    chargerProfil();
    chargerClients();
  }, []);

  const chargerProfil = async () => {
    const { data } = await supabase
      .from("profils")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (data) setProfil(data);
  };

  const chargerClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select(`
        *,
        factures(id, total_ttc, statut),
        devis(id, statut)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setClients(data);
  };

  const ouvrirModalAjout = () => {
    setClientEdite(null);
    setClientForm({ nom: "", email: "", telephone: "", adresse: "", date_premier_contact: "", type_prestation: "", source: "", notes: "", appreciation: "", moyen_paiement: "", moment_appel: "", recommande_par: "", garantie_decennale_expiration: "" });
    setClientMessage("");
    setClientModal(true);
  };

  const ouvrirModalEdition = (client) => {
    setClientEdite(client);
    setClientForm({
      nom: client.nom || "",
      email: client.email || "",
      telephone: client.telephone || "",
      adresse: client.adresse || "",
      date_premier_contact: client.date_premier_contact || "",
      type_prestation: client.type_prestation || "",
      source: client.source || "",
      notes: client.notes || "",
      appreciation: client.appreciation || "",
      moyen_paiement: client.moyen_paiement || "",
      moment_appel: client.moment_appel || "",
      recommande_par: client.recommande_par || "",
      garantie_decennale_expiration: client.garantie_decennale_expiration || "",
    });
    setClientMessage("");
    setClientModal(true);
  };

  const sauvegarderClient = async () => {
    if (!clientForm.nom.trim()) { setClientMessage("❌ Le nom est obligatoire"); return; }
    setClientLoading(true);
    setClientMessage("");

    // Payload explicite : seuls les champs qui existent en base sont envoyés.
    // Évite les erreurs "column not found" si un champ du formulaire n'est pas
    // encore migré dans Supabase.
    const payload = {
      nom:                          clientForm.nom.trim(),
      email:                        clientForm.email                        || null,
      telephone:                    clientForm.telephone                    || null,
      adresse:                      clientForm.adresse                      || null,
      date_premier_contact:         clientForm.date_premier_contact         || null,
      type_prestation:              clientForm.type_prestation              || null,
      source:                       clientForm.source                       || null,
      notes:                        clientForm.notes                        || null,
      appreciation:                 clientForm.appreciation                 || null,
      moyen_paiement:               clientForm.moyen_paiement               || null,
      moment_appel:                 clientForm.moment_appel                 || null,
      recommande_par:               clientForm.recommande_par               || null,
      garantie_decennale_expiration: clientForm.garantie_decennale_expiration || null,
    };

    if (clientEdite) {
      const { error } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", clientEdite.id);
      if (error) setClientMessage("❌ " + error.message);
      else { setClientMessage("✅ Client mis à jour !"); setTimeout(() => { setClientModal(false); chargerClients(); chargerDonnees(); }, 800); }
    } else {
      const { error } = await supabase
        .from("clients")
        .insert({ ...payload, user_id: user.id });
      if (error) setClientMessage("❌ " + error.message);
      else { setClientMessage("✅ Client ajouté !"); setTimeout(() => { setClientModal(false); chargerClients(); chargerDonnees(); }, 800); }
    }
    setClientLoading(false);
  };

  const supprimerClient = async (id) => {
    if (!window.confirm("Supprimer ce client ? Ses factures et devis associés resteront en base.")) return;
    await supabase.from("clients").delete().eq("id", id);
    chargerClients();
    chargerDonnees();
  };

  const uploadPhoto = async (clientId, fichier) => {
    setPhotoUploading(clientId);
    try {
      const ext = fichier.name.split(".").pop().toLowerCase();
      const chemin = `${clientId}/${Date.now()}.${ext}`;
      const { error: errUpload } = await supabase.storage
        .from("photos-chantier")
        .upload(chemin, fichier, { cacheControl: "3600", upsert: false });
      if (errUpload) throw errUpload;
      const { data: urlData } = supabase.storage
        .from("photos-chantier")
        .getPublicUrl(chemin);
      const publicUrl = urlData.publicUrl;
      const client = clients.find(cl => cl.id === clientId);
      const photosActuelles = client?.photos_chantier || [];
      await supabase.from("clients")
        .update({ photos_chantier: [...photosActuelles, publicUrl] })
        .eq("id", clientId);
      chargerClients();
    } catch (e) {
      alert("Erreur upload : " + e.message);
    }
    setPhotoUploading(null);
  };

  const supprimerPhoto = async (clientId, photoUrl, photosActuelles) => {
    if (!window.confirm("Supprimer cette photo ?")) return;
    const nouvellesPhotos = photosActuelles.filter(p => p !== photoUrl);
    const parts = photoUrl.split("/photos-chantier/");
    if (parts.length > 1) {
      await supabase.storage.from("photos-chantier").remove([decodeURIComponent(parts[1])]);
    }
    await supabase.from("clients")
      .update({ photos_chantier: nouvellesPhotos })
      .eq("id", clientId);
    chargerClients();
  };

  const chargerDonnees = async () => {
    const { data: facturesData } = await supabase
      .from("factures")
      .select("*, clients(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (facturesData) {
      setFactures(facturesData);
      const ca = facturesData.reduce((sum, f) => sum + (f.total_ttc || 0), 0);
      setStats(s => ({ ...s, factures: facturesData.length, ca }));
    }

    const { data: devisData } = await supabase
      .from("devis")
      .select("*, clients(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (devisData) {
      setDevis(devisData);
      setStats(s => ({ ...s, devis: devisData.length }));
    }

    const { count: clientCount } = await supabase
      .from("clients")
      .select("*", { count: "exact" })
      .eq("user_id", user.id);

    if (clientCount !== null) setStats(s => ({ ...s, clients: clientCount }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const telechargerPDF = async (facture) => {
    const { data: lignes } = await supabase
      .from("lignes_facture")
      .select("*")
      .eq("facture_id", facture.id);
    const artisan = profil || { nom: user.email, adresse: "", siret: "", telephone: "" };
    genererFacturePDF(facture, facture.clients, lignes || [], artisan, false);
  };

  const telechargerDevisPDF = async (d) => {
    const { data: lignes } = await supabase
      .from("lignes_devis")
      .select("*")
      .eq("devis_id", d.id);
    const artisan = profil || { nom: user.email, adresse: "", siret: "", telephone: "" };
    genererFacturePDF(d, d.clients, lignes || [], artisan, true);
  };

  const supprimerFacture = async (id) => {
    if (!window.confirm("Supprimer cette facture définitivement ?")) return;
    await supabase.from("lignes_facture").delete().eq("facture_id", id);
    await supabase.from("factures").delete().eq("id", id);
    chargerDonnees();
  };

  const supprimerDevis = async (id) => {
    if (!window.confirm("Supprimer ce devis définitivement ?")) return;
    await supabase.from("lignes_devis").delete().eq("devis_id", id);
    await supabase.from("devis").delete().eq("id", id);
    chargerDonnees();
  };

  const envoyerPourSignature = async (d) => {
    const { data: existing } = await supabase
      .from("signatures")
      .select("token")
      .eq("devis_id", d.id)
      .single();

    let token;
    if (existing) {
      token = existing.token;
    } else {
      token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      await supabase.from("signatures").insert({ devis_id: d.id, token });
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const lien = `https://artisan-plus.vercel.app/signer/${token}`;

    if (navigator.share) {
      await navigator.share({
        title: "Devis " + d.numero,
        text: `Bonjour,\n\nVeuillez trouver ci-joint votre devis ${d.numero}.\nPour le consulter et le signer en ligne, cliquez ici :`,
        url: lien
      });
    } else {
      navigator.clipboard.writeText(lien).catch(() => {});
      setLienCopie(d.id);
      setTimeout(() => setLienCopie(null), 3000);
    }
  };

  const convertirEnFacture = async (d) => {
    if (!window.confirm("Convertir ce devis en facture ?")) return;

    const { data: lignes } = await supabase
      .from("lignes_devis")
      .select("*")
      .eq("devis_id", d.id);

    const numero = "FAC-" + Date.now();
    const { data: factureData, error } = await supabase
      .from("factures")
      .insert({
        user_id: user.id,
        client_id: d.client_id,
        numero,
        total_ht: d.total_ht,
        tva: d.tva,
        total_ttc: d.total_ttc,
        notes: d.notes,
        style: d.style
      })
      .select()
      .single();

    if (error) { alert("Erreur lors de la conversion"); return; }

    const lignesFacture = lignes.map(l => ({
      facture_id: factureData.id,
      description: l.description,
      quantite: l.quantite,
      prix_unitaire: l.prix_unitaire,
      total: l.total
    }));

    await supabase.from("lignes_facture").insert(lignesFacture);
    await supabase.from("devis").update({ statut: "accepte" }).eq("id", d.id);
    chargerDonnees();
    setActiveTab("factures");
    alert("✅ Devis converti en facture !");
  };

  if (page === "profil") return (
    <Profil user={user} onBack={() => { setPage("dashboard"); chargerProfil(); }} />
  );
  if (page === "nouvelle-facture") return (
    <NouvelleFacture user={user} onBack={() => { setPage("dashboard"); chargerDonnees(); }} />
  );
  if (page === "nouveau-devis") return (
    <NouveauDevis user={user} onBack={() => { setPage("dashboard"); chargerDonnees(); }} />
  );

  const tabs = [
    { id: "accueil", label: "🏠 Accueil" },
    { id: "factures", label: "📄 Factures" },
    { id: "devis", label: "📝 Devis" },
    { id: "clients", label: "👥 Clients" },
    { id: "chantiers", label: "🏗️ Chantiers" },
  ];

  const statutColor = (s) => s === "payee" || s === "accepte" ? "#4CAF50" : s === "en_attente" ? PRIMARY : "#ff6b6b";
  const statutLabel = (s) => s === "payee" ? "✅ Payée" : s === "accepte" ? "✅ Accepté" : s === "en_attente" ? "⏳ En attente" : "❌ Refusé";

  return (
    <div style={{ minHeight: "100vh", background: DARK, fontFamily: "'Segoe UI', sans-serif" }}>

      {/* HEADER */}
      <div style={{
        background: CARD, padding: "16px 24px", display: "flex",
        justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid rgba(255,140,0,0.2)"
      }}>
        <div style={{ fontSize: "24px", fontWeight: "900", color: "white" }}>
          Artisan<span style={{ color: PRIMARY }}>+</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "#8899aa", fontSize: "14px" }}>{user.email}</span>
          <button onClick={() => setPage("profil")} style={{
            background: "transparent", border: "1px solid rgba(255,140,0,0.3)",
            color: PRIMARY, borderRadius: "8px", padding: "8px 16px",
            cursor: "pointer", fontSize: "13px", fontWeight: "600"
          }}>👤 Mon profil</button>
          <button onClick={handleLogout} style={{
            background: "transparent", border: "1px solid rgba(255,140,0,0.3)",
            color: PRIMARY, borderRadius: "8px", padding: "8px 16px",
            cursor: "pointer", fontSize: "13px", fontWeight: "600"
          }}>Déconnexion</button>
        </div>
      </div>

      {/* NAV */}
      <div style={{
        background: CARD, display: "flex", gap: "4px",
        padding: "8px 24px", borderBottom: "1px solid rgba(255,140,0,0.1)"
      }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? PRIMARY : "transparent",
            color: activeTab === tab.id ? "white" : "#8899aa",
            border: "none", borderRadius: "8px", padding: "10px 18px",
            cursor: "pointer", fontSize: "14px", fontWeight: "600", transition: "all 0.2s"
          }}>{tab.label}</button>
        ))}
      </div>

      {/* CONTENU */}
      <div style={{ padding: "32px 24px" }}>

        {/* ACCUEIL */}
        {activeTab === "accueil" && (
          <div>
            <h2 style={{ color: "white", fontSize: "24px", marginBottom: "24px" }}>
              Bonjour 👋 Bienvenue sur Artisan<span style={{ color: PRIMARY }}>+</span>
            </h2>
            {!profil?.nom && (
              <div style={{
                background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)",
                borderRadius: "12px", padding: "16px", marginBottom: "24px",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <span style={{ color: PRIMARY, fontSize: "14px" }}>
                  ⚠️ Complétez votre profil pour que vos infos apparaissent sur les factures
                </span>
                <button onClick={() => setPage("profil")} style={{
                  background: PRIMARY, color: "white", border: "none",
                  borderRadius: "8px", padding: "8px 16px",
                  cursor: "pointer", fontSize: "13px", fontWeight: "600"
                }}>Compléter</button>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              {[
                { label: "Factures", value: stats.factures, icon: "📄" },
                { label: "Devis en cours", value: stats.devis, icon: "📝" },
                { label: "Chiffre d'affaires", value: stats.ca.toFixed(2) + " €", icon: "💰" },
                { label: "Clients", value: stats.clients, icon: "👥" },
              ].map((stat, i) => (
                <div key={i} style={{
                  background: CARD, borderRadius: "16px", padding: "24px",
                  border: "1px solid rgba(255,140,0,0.15)"
                }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>{stat.icon}</div>
                  <div style={{ color: PRIMARY, fontSize: "28px", fontWeight: "800" }}>{stat.value}</div>
                  <div style={{ color: "#8899aa", fontSize: "13px", marginTop: "4px" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FACTURES */}
        {activeTab === "factures" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ color: "white", fontSize: "24px", margin: 0 }}>📄 Mes Factures</h2>
              <button onClick={() => setPage("nouvelle-facture")} style={{
                background: PRIMARY, color: "white", border: "none",
                borderRadius: "10px", padding: "12px 24px",
                fontSize: "15px", fontWeight: "700", cursor: "pointer"
              }}>+ Créer une facture</button>
            </div>
            {factures.length === 0 ? (
              <div style={{ background: CARD, borderRadius: "16px", padding: "40px", textAlign: "center", border: "1px solid rgba(255,140,0,0.15)" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
                <div style={{ color: "#8899aa" }}>Aucune facture pour l'instant</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {factures.map(f => (
                  <div key={f.id} style={{
                    background: CARD, borderRadius: "16px", padding: "20px",
                    border: "1px solid rgba(255,140,0,0.15)",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <div>
                      <div style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>{f.numero}</div>
                      <div style={{ color: "#8899aa", fontSize: "13px", marginTop: "4px" }}>
                        {f.clients?.nom} — {new Date(f.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ color: statutColor(f.statut), fontSize: "13px", fontWeight: "600" }}>
                        {statutLabel(f.statut)}
                      </span>
                      <span style={{ color: PRIMARY, fontWeight: "800", fontSize: "18px" }}>
                        {f.total_ttc?.toFixed(2)} €
                      </span>
                      <button onClick={() => telechargerPDF(f)} style={{
                        background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)",
                        color: PRIMARY, borderRadius: "8px", padding: "8px 12px",
                        cursor: "pointer", fontSize: "13px", fontWeight: "600"
                      }}>📄 PDF</button>
                      <button onClick={() => supprimerFacture(f.id)} style={{
                        background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.3)",
                        color: "#ff6b6b", borderRadius: "8px", padding: "8px 12px",
                        cursor: "pointer", fontSize: "13px"
                      }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DEVIS */}
        {activeTab === "devis" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ color: "white", fontSize: "24px", margin: 0 }}>📝 Mes Devis</h2>
              <button onClick={() => setPage("nouveau-devis")} style={{
                background: PRIMARY, color: "white", border: "none",
                borderRadius: "10px", padding: "12px 24px",
                fontSize: "15px", fontWeight: "700", cursor: "pointer"
              }}>+ Créer un devis</button>
            </div>
            {devis.length === 0 ? (
              <div style={{ background: CARD, borderRadius: "16px", padding: "40px", textAlign: "center", border: "1px solid rgba(255,140,0,0.15)" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
                <div style={{ color: "#8899aa" }}>Aucun devis pour l'instant</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {devis.map(d => (
                  <div key={d.id} style={{
                    background: CARD, borderRadius: "16px", padding: "20px",
                    border: "1px solid rgba(255,140,0,0.15)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: lienCopie === d.id ? "12px" : "0" }}>
                      <div>
                        <div style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>{d.numero}</div>
                        <div style={{ color: "#8899aa", fontSize: "13px", marginTop: "4px" }}>
                          {d.clients?.nom} — {new Date(d.created_at).toLocaleDateString("fr-FR")}
                          {d.date_validite && ` — Valide jusqu'au ${new Date(d.date_validite).toLocaleDateString("fr-FR")}`}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <span style={{ color: statutColor(d.statut), fontSize: "13px", fontWeight: "600" }}>
                          {statutLabel(d.statut)}
                        </span>
                        <span style={{ color: PRIMARY, fontWeight: "800", fontSize: "18px" }}>
                          {d.total_ttc?.toFixed(2)} €
                        </span>
                        <button onClick={() => telechargerDevisPDF(d)} style={{
                          background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)",
                          color: PRIMARY, borderRadius: "8px", padding: "8px 12px",
                          cursor: "pointer", fontSize: "13px", fontWeight: "600"
                        }}>📄 PDF</button>
                        <button onClick={() => envoyerPourSignature(d)} style={{
                          background: "rgba(100,149,237,0.1)",
                          border: "1px solid rgba(100,149,237,0.3)",
                          color: "#6495ED", borderRadius: "8px", padding: "8px 12px",
                          cursor: "pointer", fontSize: "13px", fontWeight: "600"
                        }}>🔗 Envoyer</button>
                        <button onClick={() => convertirEnFacture(d)} style={{
                          background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.3)",
                          color: "#4CAF50", borderRadius: "8px", padding: "8px 12px",
                          cursor: "pointer", fontSize: "13px", fontWeight: "600"
                        }}>✅ Facturer</button>
                        <button onClick={() => supprimerDevis(d.id)} style={{
                          background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.3)",
                          color: "#ff6b6b", borderRadius: "8px", padding: "8px 12px",
                          cursor: "pointer", fontSize: "13px"
                        }}>🗑️</button>
                      </div>
                    </div>
                    {lienCopie === d.id && (
                      <div style={{
                        background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.3)",
                        borderRadius: "8px", padding: "10px 14px",
                        color: "#4CAF50", fontSize: "13px", fontWeight: "600"
                      }}>
                        ✅ Lien copié ! Envoyez-le par SMS, WhatsApp, email ou autre.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CLIENTS */}
        {activeTab === "clients" && (
          <div>
            {/* En-tête */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
              <h2 style={{ color: "white", fontSize: "24px", margin: 0 }}>👥 Mes Clients</h2>
              <button onClick={ouvrirModalAjout} style={{
                background: PRIMARY, color: "white", border: "none",
                borderRadius: "10px", padding: "12px 24px",
                fontSize: "15px", fontWeight: "700", cursor: "pointer"
              }}>+ Ajouter un client</button>
            </div>

            {/* Barre de recherche */}
            {clients.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <input
                  placeholder="🔍 Rechercher un client..."
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  style={{
                    background: CARD, border: "1px solid rgba(255,140,0,0.2)",
                    borderRadius: "10px", padding: "12px 16px", color: "white",
                    fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box"
                  }}
                />
              </div>
            )}

            {/* Liste clients */}
            {clients.length === 0 ? (
              <div style={{ background: CARD, borderRadius: "16px", padding: "60px 40px", textAlign: "center", border: "1px solid rgba(255,140,0,0.15)" }}>
                <div style={{ fontSize: "56px", marginBottom: "16px" }}>👥</div>
                <div style={{ color: "white", fontWeight: "700", fontSize: "18px", marginBottom: "8px" }}>Aucun client pour l'instant</div>
                <div style={{ color: "#8899aa", fontSize: "14px", marginBottom: "24px" }}>Ajoutez votre premier client pour commencer</div>
                <button onClick={ouvrirModalAjout} style={{
                  background: PRIMARY, color: "white", border: "none",
                  borderRadius: "10px", padding: "12px 24px",
                  fontSize: "15px", fontWeight: "700", cursor: "pointer"
                }}>+ Ajouter un client</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {clients
                  .filter(c =>
                    !clientSearch ||
                    c.nom?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                    c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                    c.telephone?.includes(clientSearch)
                  )
                  .map(c => {
                    const nbFactures = c.factures?.length || 0;
                    const nbDevis = c.devis?.length || 0;
                    const caTotal = c.factures?.reduce((sum, f) => sum + (f.total_ttc || 0), 0) || 0;
                    const isOpen = clientDetailId === c.id;

                    // Garantie décennale
                    const garantieDate = c.garantie_decennale_expiration ? new Date(c.garantie_decennale_expiration) : null;
                    const dans3Mois = new Date(); dans3Mois.setMonth(dans3Mois.getMonth() + 3);
                    const garantieStatut = !garantieDate ? null
                      : garantieDate < new Date() ? "expire"
                      : garantieDate < dans3Mois ? "alerte"
                      : "ok";

                    return (
                      <div key={c.id} style={{
                        background: CARD, borderRadius: "16px",
                        border: `1px solid ${isOpen ? "rgba(255,140,0,0.4)" : "rgba(255,140,0,0.15)"}`,
                        overflow: "hidden", transition: "border 0.2s"
                      }}>
                        {/* Ligne principale */}
                        <div style={{
                          padding: "18px 20px", display: "flex",
                          justifyContent: "space-between", alignItems: "center",
                          cursor: "pointer", gap: "12px"
                        }} onClick={() => setClientDetailId(isOpen ? null : c.id)}>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                            <div style={{
                              width: "44px", height: "44px", borderRadius: "50%",
                              background: `rgba(255,140,0,0.15)`, display: "flex",
                              alignItems: "center", justifyContent: "center",
                              fontSize: "20px", flexShrink: 0
                            }}>
                              {c.nom?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                <span style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>{c.nom}</span>
                                {c.appreciation && (
                                  <span style={{ fontSize: "16px" }} title={c.appreciation}>{
                                    c.appreciation === "Excellent" ? "⭐" :
                                    c.appreciation === "Bien" ? "👍" :
                                    c.appreciation === "Moyen" ? "😐" : "👎"
                                  }</span>
                                )}
                                {garantieStatut === "expire" && (
                                  <span style={{ background: "rgba(255,100,100,0.15)", color: "#ff6b6b", fontSize: "10px", fontWeight: "700", borderRadius: "5px", padding: "2px 6px" }}>🛡️ Garantie expirée</span>
                                )}
                                {garantieStatut === "alerte" && (
                                  <span style={{ background: "rgba(255,140,0,0.15)", color: PRIMARY, fontSize: "10px", fontWeight: "700", borderRadius: "5px", padding: "2px 6px" }}>🛡️ Garantie &lt; 3 mois</span>
                                )}
                              </div>
                              <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap", alignItems: "center" }}>
                                {c.type_prestation && (
                                  <span style={{ background: "rgba(255,140,0,0.15)", color: PRIMARY, fontSize: "11px", fontWeight: "600", borderRadius: "6px", padding: "2px 7px" }}>
                                    {c.type_prestation}
                                  </span>
                                )}
                                {c.source && (
                                  <span style={{ background: "rgba(100,149,237,0.15)", color: "#6495ED", fontSize: "11px", fontWeight: "600", borderRadius: "6px", padding: "2px 7px" }}>
                                    {c.source}
                                  </span>
                                )}
                                <span style={{ color: "#8899aa", fontSize: "12px" }}>
                                  {[c.email, c.telephone].filter(Boolean).join(" · ") || "Aucune info de contact"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                            {/* Stats rapides */}
                            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ color: PRIMARY, fontWeight: "800", fontSize: "16px" }}>{nbFactures}</div>
                                <div style={{ color: "#8899aa", fontSize: "11px" }}>facture{nbFactures !== 1 ? "s" : ""}</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ color: "#6495ED", fontWeight: "800", fontSize: "16px" }}>{nbDevis}</div>
                                <div style={{ color: "#8899aa", fontSize: "11px" }}>devis</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ color: "#4CAF50", fontWeight: "800", fontSize: "16px" }}>{caTotal.toFixed(0)} €</div>
                                <div style={{ color: "#8899aa", fontSize: "11px" }}>CA total</div>
                              </div>
                            </div>
                            {/* Actions */}
                            <div style={{ display: "flex", gap: "8px" }} onClick={e => e.stopPropagation()}>
                              <button onClick={() => ouvrirModalEdition(c)} style={{
                                background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)",
                                color: PRIMARY, borderRadius: "8px", padding: "8px 10px",
                                cursor: "pointer", fontSize: "13px", fontWeight: "600"
                              }}>✏️</button>
                              <button onClick={() => supprimerClient(c.id)} style={{
                                background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.3)",
                                color: "#ff6b6b", borderRadius: "8px", padding: "8px 10px",
                                cursor: "pointer", fontSize: "13px"
                              }}>🗑️</button>
                            </div>
                            <span style={{ color: "#8899aa", fontSize: "18px", transition: "transform 0.2s", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                          </div>
                        </div>

                        {/* Détails dépliables */}
                        {isOpen && (
                          <div style={{ borderTop: "1px solid rgba(255,140,0,0.1)", padding: "16px 20px" }}>

                            {/* Actions rapides de contact */}
                            {(c.telephone || c.adresse) && (
                              <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
                                {c.telephone && (
                                  <>
                                    <a
                                      href={`tel:${c.telephone.replace(/\s/g, "")}`}
                                      style={{
                                        display: "inline-flex", alignItems: "center", gap: "6px",
                                        background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)",
                                        color: PRIMARY, borderRadius: "8px", padding: "8px 14px",
                                        fontSize: "13px", fontWeight: "600", textDecoration: "none"
                                      }}
                                    >📞 Appeler</a>
                                    <a
                                      href={`sms:${c.telephone.replace(/\s/g, "")}`}
                                      style={{
                                        display: "inline-flex", alignItems: "center", gap: "6px",
                                        background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)",
                                        color: PRIMARY, borderRadius: "8px", padding: "8px 14px",
                                        fontSize: "13px", fontWeight: "600", textDecoration: "none"
                                      }}
                                    >💬 Message</a>
                                  </>
                                )}
                                {c.adresse && (
                                  <a
                                    href={`https://maps.google.com/?q=${encodeURIComponent(c.adresse)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: "inline-flex", alignItems: "center", gap: "6px",
                                      background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)",
                                      color: PRIMARY, borderRadius: "8px", padding: "8px 14px",
                                      fontSize: "13px", fontWeight: "600", textDecoration: "none"
                                    }}
                                  >📍 Localiser</a>
                                )}
                              </div>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: c.notes ? "14px" : "0" }}>
                              {[
                                { label: "📧 Email", value: c.email },
                                { label: "📞 Téléphone", value: c.telephone },
                                { label: "📍 Adresse", value: c.adresse },
                                { label: "🛠️ Prestation", value: c.type_prestation },
                                { label: "📣 Source", value: c.source },
                                { label: "📅 1er contact", value: c.date_premier_contact ? new Date(c.date_premier_contact).toLocaleDateString("fr-FR") : null },
                                { label: "📅 Client depuis", value: new Date(c.created_at).toLocaleDateString("fr-FR") },
                                { label: "⭐ Appréciation", value: c.appreciation ? ({ Excellent: "⭐ Excellent", Bien: "👍 Bien", Moyen: "😐 Moyen", Difficile: "👎 Difficile" }[c.appreciation] || c.appreciation) : null },
                                { label: "💳 Paiement préféré", value: c.moyen_paiement },
                                { label: "⏰ Moment pour appeler", value: c.moment_appel },
                                { label: "🤝 Recommandé par", value: c.recommande_par },
                              ].map((item, i) => (
                                <div key={i}>
                                  <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "600", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</div>
                                  <div style={{ color: item.value ? "white" : "#444", fontSize: "13px" }}>
                                    {item.value || "—"}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {c.notes && (
                              <div style={{ background: "rgba(255,140,0,0.05)", borderRadius: "8px", padding: "10px 14px", marginTop: "4px" }}>
                                <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "600", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>📝 Notes</div>
                                <div style={{ color: "#ccc", fontSize: "13px", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>{c.notes}</div>
                              </div>
                            )}

                            {/* Garantie décennale */}
                            {garantieDate && (
                              <div style={{
                                marginTop: "14px", borderRadius: "10px", padding: "12px 16px",
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                background: garantieStatut === "expire" ? "rgba(255,100,100,0.07)"
                                  : garantieStatut === "alerte" ? "rgba(255,140,0,0.07)"
                                  : "rgba(76,175,80,0.07)",
                                border: `1px solid ${garantieStatut === "expire" ? "rgba(255,100,100,0.25)"
                                  : garantieStatut === "alerte" ? "rgba(255,140,0,0.25)"
                                  : "rgba(76,175,80,0.25)"}`
                              }}>
                                <div>
                                  <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>🛡️ Garantie décennale</div>
                                  <div style={{ color: "white", fontSize: "13px" }}>
                                    Expire le {garantieDate.toLocaleDateString("fr-FR")}
                                  </div>
                                </div>
                                {garantieStatut === "expire" && <span style={{ background: "rgba(255,100,100,0.18)", color: "#ff6b6b", fontSize: "12px", fontWeight: "700", borderRadius: "6px", padding: "4px 10px" }}>⚠️ Expirée</span>}
                                {garantieStatut === "alerte" && <span style={{ background: "rgba(255,140,0,0.18)", color: PRIMARY, fontSize: "12px", fontWeight: "700", borderRadius: "6px", padding: "4px 10px" }}>⚠️ Expire bientôt</span>}
                                {garantieStatut === "ok"     && <span style={{ background: "rgba(76,175,80,0.18)",  color: "#4CAF50", fontSize: "12px", fontWeight: "700", borderRadius: "6px", padding: "4px 10px" }}>✓ Valide</span>}
                              </div>
                            )}

                            {/* Photos chantier */}
                            <div style={{ marginTop: "16px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>📸 Photos chantier</div>
                                <label style={{
                                  display: "inline-flex", alignItems: "center", gap: "5px",
                                  background: "rgba(255,140,0,0.12)", border: "1px solid rgba(255,140,0,0.3)",
                                  color: PRIMARY, borderRadius: "7px", padding: "5px 12px",
                                  fontSize: "12px", fontWeight: "600", cursor: photoUploading === c.id ? "wait" : "pointer"
                                }}>
                                  {photoUploading === c.id ? "⏳ Upload…" : "＋ Ajouter"}
                                  <input
                                    type="file" accept="image/*" multiple hidden
                                    disabled={photoUploading === c.id}
                                    onChange={e => { Array.from(e.target.files).forEach(f => uploadPhoto(c.id, f)); e.target.value = ""; }}
                                  />
                                </label>
                              </div>
                              {(c.photos_chantier?.length > 0) ? (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: "8px" }}>
                                  {c.photos_chantier.map((url, i) => (
                                    <div key={i} style={{ position: "relative", aspectRatio: "1 / 1", borderRadius: "8px", overflow: "hidden", background: "#0a1628" }}>
                                      <img
                                        src={url} alt={`chantier ${i + 1}`}
                                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                      />
                                      <button
                                        onClick={() => supprimerPhoto(c.id, url, c.photos_chantier)}
                                        style={{
                                          position: "absolute", top: "4px", right: "4px",
                                          background: "rgba(0,0,0,0.65)", border: "none",
                                          color: "white", borderRadius: "50%",
                                          width: "22px", height: "22px", fontSize: "13px",
                                          cursor: "pointer", display: "flex",
                                          alignItems: "center", justifyContent: "center",
                                          lineHeight: 1
                                        }}
                                      >✕</button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ color: "#555", fontSize: "12px", fontStyle: "italic" }}>Aucune photo pour ce chantier</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Historique factures/devis dépliable */}
                        {isOpen && (nbFactures > 0 || nbDevis > 0) && (
                          <div style={{ borderTop: "1px solid rgba(255,140,0,0.1)", padding: "12px 20px 16px" }}>
                            <div style={{ color: "#8899aa", fontSize: "12px", marginBottom: "10px", fontWeight: "600" }}>HISTORIQUE</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {factures.filter(f => f.client_id === c.id).map(f => (
                                <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,140,0,0.05)", borderRadius: "8px", padding: "8px 12px" }}>
                                  <span style={{ color: "#ccc", fontSize: "13px" }}>📄 {f.numero}</span>
                                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                    <span style={{ color: statutColor(f.statut), fontSize: "12px" }}>{statutLabel(f.statut)}</span>
                                    <span style={{ color: PRIMARY, fontWeight: "700", fontSize: "13px" }}>{f.total_ttc?.toFixed(2)} €</span>
                                  </div>
                                </div>
                              ))}
                              {devis.filter(d => d.client_id === c.id).map(d => (
                                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(100,149,237,0.05)", borderRadius: "8px", padding: "8px 12px" }}>
                                  <span style={{ color: "#ccc", fontSize: "13px" }}>📝 {d.numero}</span>
                                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                    <span style={{ color: statutColor(d.statut), fontSize: "12px" }}>{statutLabel(d.statut)}</span>
                                    <span style={{ color: "#6495ED", fontWeight: "700", fontSize: "13px" }}>{d.total_ttc?.toFixed(2)} €</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* MODAL Ajouter / Éditer client */}
            {clientModal && (
              <div style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 1000, padding: "20px"
              }} onClick={e => { if (e.target === e.currentTarget) setClientModal(false); }}>
                <div style={{
                  background: CARD, borderRadius: "20px", padding: "28px 32px",
                  width: "100%", maxWidth: "540px",
                  border: "1px solid rgba(255,140,0,0.3)",
                  boxShadow: "0 0 60px rgba(255,140,0,0.15)",
                  maxHeight: "92vh", overflowY: "auto"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h3 style={{ color: "white", margin: 0, fontSize: "20px" }}>
                      {clientEdite ? "✏️ Modifier le client" : "➕ Nouveau client"}
                    </h3>
                    <button onClick={() => setClientModal(false)} style={{
                      background: "transparent", border: "none", color: "#8899aa",
                      fontSize: "22px", cursor: "pointer", padding: "4px"
                    }}>✕</button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                    {/* Séparateur : Infos de base */}
                    <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid rgba(255,140,0,0.1)", paddingBottom: "6px" }}>
                      Informations de base
                    </div>

                    {[
                      { champ: "nom", label: "Nom *", placeholder: "Nom du client ou de l'entreprise" },
                      { champ: "email", label: "Email", placeholder: "email@exemple.fr" },
                      { champ: "telephone", label: "Téléphone", placeholder: "06 00 00 00 00" },
                      { champ: "adresse", label: "Adresse", placeholder: "123 rue de la Paix, 75001 Paris" },
                    ].map(({ champ, label, placeholder }) => (
                      <div key={champ}>
                        <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>{label}</label>
                        <input
                          placeholder={placeholder}
                          value={clientForm[champ]}
                          onChange={e => setClientForm(f => ({ ...f, [champ]: e.target.value }))}
                          style={{ background: DARK, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "12px 16px", color: "white", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" }}
                        />
                      </div>
                    ))}

                    {/* Séparateur : Qualification */}
                    <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid rgba(255,140,0,0.1)", paddingBottom: "6px", marginTop: "4px" }}>
                      Qualification
                    </div>

                    {/* Ligne : Type prestation + Source */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>🛠️ Type de prestation</label>
                        <select
                          value={clientForm.type_prestation}
                          onChange={e => setClientForm(f => ({ ...f, type_prestation: e.target.value }))}
                          style={{ background: DARK, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "12px 16px", color: clientForm.type_prestation ? "white" : "#8899aa", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", cursor: "pointer" }}
                        >
                          <option value="">— Choisir —</option>
                          <option value="Couverture">Couverture</option>
                          <option value="Élagage">Élagage</option>
                          <option value="Traitement toiture">Traitement toiture</option>
                          <option value="Paysagisme">Paysagisme</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>📣 Source du client</label>
                        <select
                          value={clientForm.source}
                          onChange={e => setClientForm(f => ({ ...f, source: e.target.value }))}
                          style={{ background: DARK, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "12px 16px", color: clientForm.source ? "white" : "#8899aa", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", cursor: "pointer" }}
                        >
                          <option value="">— Choisir —</option>
                          <option value="Bouche à oreille">Bouche à oreille</option>
                          <option value="Facebook">Facebook</option>
                          <option value="Chantier">Chantier</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>
                    </div>

                    {/* Ligne : Date + Appréciation */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>📅 1er contact</label>
                        <input
                          type="date"
                          value={clientForm.date_premier_contact}
                          onChange={e => setClientForm(f => ({ ...f, date_premier_contact: e.target.value }))}
                          style={{ background: DARK, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "12px 16px", color: clientForm.date_premier_contact ? "white" : "#8899aa", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", colorScheme: "dark" }}
                        />
                      </div>
                      <div>
                        <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>⭐ Appréciation</label>
                        <select
                          value={clientForm.appreciation}
                          onChange={e => setClientForm(f => ({ ...f, appreciation: e.target.value }))}
                          style={{ background: DARK, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "12px 16px", color: clientForm.appreciation ? "white" : "#8899aa", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", cursor: "pointer" }}
                        >
                          <option value="">— Choisir —</option>
                          <option value="Excellent">⭐ Excellent</option>
                          <option value="Bien">👍 Bien</option>
                          <option value="Moyen">😐 Moyen</option>
                          <option value="Difficile">👎 Difficile</option>
                        </select>
                      </div>
                    </div>

                    {/* Notes libres */}
                    <div>
                      <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>📝 Notes libres</label>
                      <textarea
                        placeholder="Informations complémentaires, historique, remarques..."
                        value={clientForm.notes}
                        onChange={e => setClientForm(f => ({ ...f, notes: e.target.value }))}
                        rows={3}
                        style={{ background: DARK, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "12px 16px", color: "white", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }}
                      />
                    </div>

                    {/* Séparateur : Informations pratiques */}
                    <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid rgba(255,140,0,0.1)", paddingBottom: "6px", marginTop: "4px" }}>
                      Informations pratiques
                    </div>

                    {/* Moyen de paiement + Moment pour appeler */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>💳 Moyen de paiement préféré</label>
                        <select
                          value={clientForm.moyen_paiement}
                          onChange={e => setClientForm(f => ({ ...f, moyen_paiement: e.target.value }))}
                          style={{ background: DARK, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "12px 16px", color: clientForm.moyen_paiement ? "white" : "#8899aa", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", cursor: "pointer" }}
                        >
                          <option value="">— Choisir —</option>
                          <option value="Virement">Virement</option>
                          <option value="Chèque">Chèque</option>
                          <option value="Espèces">Espèces</option>
                          <option value="Carte">Carte</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>⏰ Meilleur moment pour appeler</label>
                        <input
                          placeholder="Ex : matin, après 18h…"
                          value={clientForm.moment_appel}
                          onChange={e => setClientForm(f => ({ ...f, moment_appel: e.target.value }))}
                          style={{ background: DARK, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "12px 16px", color: "white", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>

                    {/* Recommandé par + Garantie décennale */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>🤝 Recommandé par</label>
                        <input
                          placeholder="Nom du prescripteur"
                          value={clientForm.recommande_par}
                          onChange={e => setClientForm(f => ({ ...f, recommande_par: e.target.value }))}
                          style={{ background: DARK, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "12px 16px", color: "white", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>🛡️ Garantie décennale — expiration</label>
                        <input
                          type="date"
                          value={clientForm.garantie_decennale_expiration}
                          onChange={e => setClientForm(f => ({ ...f, garantie_decennale_expiration: e.target.value }))}
                          style={{ background: DARK, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "12px 16px", color: clientForm.garantie_decennale_expiration ? "white" : "#8899aa", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", colorScheme: "dark" }}
                        />
                      </div>
                    </div>

                    {clientMessage && (
                      <div style={{ color: clientMessage.includes("✅") ? "#4CAF50" : "#ff6b6b", fontSize: "13px", textAlign: "center", fontWeight: "600" }}>
                        {clientMessage}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                      <button onClick={() => setClientModal(false)} style={{
                        flex: 1, background: "transparent", border: "1px solid rgba(255,140,0,0.2)",
                        color: "#8899aa", borderRadius: "10px", padding: "13px",
                        fontSize: "15px", cursor: "pointer", fontWeight: "600"
                      }}>Annuler</button>
                      <button onClick={sauvegarderClient} disabled={clientLoading} style={{
                        flex: 2, background: clientLoading ? "#888" : PRIMARY, color: "white",
                        border: "none", borderRadius: "10px", padding: "13px",
                        fontSize: "15px", fontWeight: "700", cursor: clientLoading ? "not-allowed" : "pointer"
                      }}>
                        {clientLoading ? "Sauvegarde..." : clientEdite ? "Enregistrer" : "Ajouter le client"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CHANTIERS */}
        {activeTab === "chantiers" && (
          <div>
            <h2 style={{ color: "white", fontSize: "24px", marginBottom: "24px" }}>🏗️ Mes Chantiers</h2>
            <div style={{ background: CARD, borderRadius: "16px", padding: "40px", textAlign: "center", border: "1px solid rgba(255,140,0,0.15)" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏗️</div>
              <div style={{ color: "#8899aa" }}>Aucun chantier pour l'instant</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
