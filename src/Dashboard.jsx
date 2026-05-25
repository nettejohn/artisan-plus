import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import NouvelleFacture from "./NouvelleFacture";
import { genererFacturePDF } from "./GenerateurPDF";
import Profil from "./Profil";

const PRIMARY = "#FF8C00";
const DARK = "#0a1628";
const CARD = "#111e35";

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("accueil");
  const [page, setPage] = useState("dashboard");
  const [factures, setFactures] = useState([]);
  const [profil, setProfil] = useState(null);
  const [stats, setStats] = useState({ factures: 0, devis: 0, ca: 0, clients: 0 });

  useEffect(() => {
    chargerDonnees();
    chargerProfil();
  }, []);

  const chargerProfil = async () => {
    const { data } = await supabase
      .from("profils")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (data) setProfil(data);
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
    genererFacturePDF(facture, facture.clients, lignes || [], artisan);
  };

  const supprimerFacture = async (id) => {
    if (!window.confirm("Supprimer cette facture définitivement ?")) return;
    await supabase.from("lignes_facture").delete().eq("facture_id", id);
    await supabase.from("factures").delete().eq("id", id);
    chargerDonnees();
  };

  if (page === "profil") return (
    <Profil user={user} onBack={() => { setPage("dashboard"); chargerProfil(); }} />
  );

  if (page === "nouvelle-facture") return (
    <NouvelleFacture user={user} onBack={() => { setPage("dashboard"); chargerDonnees(); }} />
  );

  const tabs = [
    { id: "accueil", label: "🏠 Accueil" },
    { id: "factures", label: "📄 Factures" },
    { id: "devis", label: "📝 Devis" },
    { id: "clients", label: "👥 Clients" },
    { id: "chantiers", label: "🏗️ Chantiers" },
  ];

  const statutColor = (s) => s === "payee" ? "#4CAF50" : s === "en_attente" ? PRIMARY : "#ff6b6b";
  const statutLabel = (s) => s === "payee" ? "✅ Payée" : s === "en_attente" ? "⏳ En attente" : "❌ Annulée";

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
                        background: "rgba(255,140,0,0.1)",
                        border: "1px solid rgba(255,140,0,0.3)",
                        color: PRIMARY, borderRadius: "8px",
                        padding: "8px 12px", cursor: "pointer",
                        fontSize: "13px", fontWeight: "600"
                      }}>📄 PDF</button>
                      <button onClick={() => supprimerFacture(f.id)} style={{
                        background: "rgba(255,100,100,0.1)",
                        border: "1px solid rgba(255,100,100,0.3)",
                        color: "#ff6b6b", borderRadius: "8px",
                        padding: "8px 12px", cursor: "pointer",
                        fontSize: "13px", fontWeight: "600"
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
              <button style={{
                background: PRIMARY, color: "white", border: "none",
                borderRadius: "10px", padding: "12px 24px",
                fontSize: "15px", fontWeight: "700", cursor: "pointer"
              }}>+ Créer un devis</button>
            </div>
            <div style={{ background: CARD, borderRadius: "16px", padding: "40px", textAlign: "center", border: "1px solid rgba(255,140,0,0.15)" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
              <div style={{ color: "#8899aa" }}>Aucun devis pour l'instant</div>
            </div>
          </div>
        )}

        {/* CLIENTS */}
        {activeTab === "clients" && (
          <div>
            <h2 style={{ color: "white", fontSize: "24px", marginBottom: "24px" }}>👥 Mes Clients</h2>
            <div style={{ background: CARD, borderRadius: "16px", padding: "40px", textAlign: "center", border: "1px solid rgba(255,140,0,0.15)" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>👥</div>
              <div style={{ color: "#8899aa" }}>Aucun client pour l'instant</div>
            </div>
          </div>
        )}

        {/* CHANTIERS */}
        {activeTab === "chantiers" && (
          <div>
            <h2 style={{ color: "white", fontSize: "24px", marginBottom: "24px" }}>🏗 Mes Chantiers</h2>
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

