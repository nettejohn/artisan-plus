import { useState } from "react";
import { supabase } from "./supabase";

const PRIMARY = "#FF8C00";
const DARK = "#0a1628";
const CARD = "#111e35";

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("accueil");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const tabs = [
    { id: "accueil", label: "🏠 Accueil" },
    { id: "factures", label: "📄 Factures" },
    { id: "devis", label: "📝 Devis" },
    { id: "clients", label: "👥 Clients" },
    { id: "chantiers", label: "🏗️ Chantiers" },
  ];

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
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "#8899aa", fontSize: "14px" }}>{user.email}</span>
          <button onClick={handleLogout} style={{
            background: "transparent", border: "1px solid rgba(255,140,0,0.3)",
            color: PRIMARY, borderRadius: "8px", padding: "8px 16px",
            cursor: "pointer", fontSize: "13px", fontWeight: "600"
          }}>
            Déconnexion
          </button>
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
            cursor: "pointer", fontSize: "14px", fontWeight: "600",
            transition: "all 0.2s"
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENU */}
      <div style={{ padding: "32px 24px" }}>
        {activeTab === "accueil" && (
          <div>
            <h2 style={{ color: "white", fontSize: "24px", marginBottom: "24px" }}>
              Bonjour 👋 Bienvenue sur Artisan<span style={{ color: PRIMARY }}>+</span>
            </h2>

            {/* STATS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
              {[
                { label: "Factures ce mois", value: "0", icon: "📄" },
                { label: "Devis en cours", value: "0", icon: "📝" },
                { label: "Chiffre d'affaires", value: "0 €", icon: "💰" },
                { label: "Clients", value: "0", icon: "👥" },
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

        {activeTab === "factures" && (
          <div>
            <h2 style={{ color: "white", fontSize: "24px", marginBottom: "24px" }}>📄 Mes Factures</h2>
            <div style={{ background: CARD, borderRadius: "16px", padding: "40px", textAlign: "center", border: "1px solid rgba(255,140,0,0.15)" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
              <div style={{ color: "#8899aa", marginBottom: "24px" }}>Aucune facture pour l'instant</div>
              <button style={{
                background: PRIMARY, color: "white", border: "none",
                borderRadius: "10px", padding: "12px 24px",
                fontSize: "15px", fontWeight: "700", cursor: "pointer"
              }}>
                + Créer une facture
              </button>
            </div>
          </div>
        )}

        {activeTab === "devis" && (
          <div>
            <h2 style={{ color: "white", fontSize: "24px", marginBottom: "24px" }}>📝 Mes Devis</h2>
            <div style={{ background: CARD, borderRadius: "16px", padding: "40px", textAlign: "center", border: "1px solid rgba(255,140,0,0.15)" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
              <div style={{ color: "#8899aa", marginBottom: "24px" }}>Aucun devis pour l'instant</div>
              <button style={{
                background: PRIMARY, color: "white", border: "none",
                borderRadius: "10px", padding: "12px 24px",
                fontSize: "15px", fontWeight: "700", cursor: "pointer"
              }}>
                + Créer un devis
              </button>
            </div>
          </div>
        )}

        {activeTab === "clients" && (
          <div>
            <h2 style={{ color: "white", fontSize: "24px", marginBottom: "24px" }}>👥 Mes Clients</h2>
            <div style={{ background: CARD, borderRadius: "16px", padding: "40px", textAlign: "center", border: "1px solid rgba(255,140,0,0.15)" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>👥</div>
              <div style={{ color: "#8899aa", marginBottom: "24px" }}>Aucun client pour l'instant</div>
              <button style={{
                background: PRIMARY, color: "white", border: "none",
                borderRadius: "10px", padding: "12px 24px",
                fontSize: "15px", fontWeight: "700", cursor: "pointer"
              }}>
                + Ajouter un client
              </button>
            </div>
          </div>
        )}

        {activeTab === "chantiers" && (
          <div>
            <h2 style={{ color: "white", fontSize: "24px", marginBottom: "24px" }}>🏗️ Mes Chantiers</h2>
            <div style={{ background: CARD, borderRadius: "16px", padding: "40px", textAlign: "center", border: "1px solid rgba(255,140,0,0.15)" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏗️</div>
              <div style={{ color: "#8899aa", marginBottom: "24px" }}>Aucun chantier pour l'instant</div>
              <button style={{
                background: PRIMARY, color: "white", border: "none",
                borderRadius: "10px", padding: "12px 24px",
                fontSize: "15px", fontWeight: "700", cursor: "pointer"
              }}>
                + Ajouter un chantier
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}