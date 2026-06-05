/**
 * Bandeau consentement cookies — conforme CNIL / RGPD
 * Stocke le choix dans localStorage sous "artisanplus_cookie_consent"
 * Catégories : essentiels (toujours on) + analytiques (optionnel)
 */
import { useState, useEffect } from "react";

const STORAGE_KEY = "artisanplus_cookie_consent";
const PRIMARY = "#FF8C00";
const DARK    = "#0a1628";
const CARD    = "#111e35";
const G       = "#8899aa";

export default function CookieBanner() {
  const [visible,    setVisible]    = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [analytics,  setAnalytics]  = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch { /* localStorage indisponible */ }
  }, []);

  const save = ({ analyticsOk }) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        essential: true,
        analytics: analyticsOk,
        date: new Date().toISOString(),
        version: "1.0",
      }));
    } catch { /* */ }
    setVisible(false);
    setShowCustom(false);
  };

  if (!visible) return null;

  /* ── Panneau "Personnaliser" ── */
  if (showCustom) return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: CARD, borderRadius: "20px", padding: "32px",
        maxWidth: "500px", width: "100%",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}>
        <h2 style={{ color: "white", fontSize: "20px", fontWeight: "800", marginBottom: "6px" }}>
          🍪 Personnaliser les cookies
        </h2>
        <p style={{ color: G, fontSize: "13px", marginBottom: "24px", lineHeight: "1.6" }}>
          Choisissez les catégories de cookies que vous acceptez.
        </p>

        {/* Catégorie 1 : Essentiels */}
        <div style={{
          background: "rgba(255,255,255,0.04)", borderRadius: "12px",
          padding: "16px", marginBottom: "12px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>Cookies essentiels</span>
            <span style={{
              background: "rgba(76,175,80,0.15)", color: "#4CAF50",
              borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: "700",
            }}>Toujours actifs</span>
          </div>
          <p style={{ color: G, fontSize: "12px", margin: 0, lineHeight: "1.6" }}>
            Indispensables au fonctionnement du service : session utilisateur, authentification, préférences de l'interface. Ne peuvent pas être désactivés.
          </p>
        </div>

        {/* Catégorie 2 : Analytiques */}
        <div style={{
          background: "rgba(255,255,255,0.04)", borderRadius: "12px",
          padding: "16px", marginBottom: "24px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>Cookies analytiques</span>
            {/* Toggle switch */}
            <div
              onClick={() => setAnalytics(v => !v)}
              style={{
                width: "48px", height: "26px", borderRadius: "13px",
                background: analytics ? PRIMARY : "rgba(255,255,255,0.15)",
                cursor: "pointer", position: "relative", transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute", top: "3px",
                left: analytics ? "24px" : "3px",
                width: "20px", height: "20px", borderRadius: "50%",
                background: "white", transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }} />
            </div>
          </div>
          <p style={{ color: G, fontSize: "12px", margin: 0, lineHeight: "1.6" }}>
            Mesure d'audience anonymisée pour améliorer l'application. Aucune donnée transmise à des tiers publicitaires.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => save({ analyticsOk: analytics })}
            style={{
              flex: 1, padding: "13px", background: PRIMARY, color: "white",
              border: "none", borderRadius: "10px", fontWeight: "700",
              fontSize: "14px", cursor: "pointer",
            }}
          >
            Enregistrer mes choix
          </button>
          <button
            onClick={() => setShowCustom(false)}
            style={{
              padding: "13px 16px", background: "rgba(255,255,255,0.08)", color: "white",
              border: "none", borderRadius: "10px", fontWeight: "600",
              fontSize: "14px", cursor: "pointer",
            }}
          >
            ← Retour
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Bandeau principal ── */
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      zIndex: 9998,
      background: CARD,
      borderTop: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
      padding: "20px clamp(16px, 4vw, 40px)",
    }}>
      <div style={{
        maxWidth: "1100px", margin: "0 auto",
        display: "flex", alignItems: "center",
        gap: "24px", flexWrap: "wrap",
      }}>
        {/* Texte */}
        <div style={{ flex: 1, minWidth: "260px" }}>
          <p style={{ color: "white", fontWeight: "700", fontSize: "15px", margin: "0 0 4px 0" }}>
            🍪 Artisan+ utilise des cookies
          </p>
          <p style={{ color: G, fontSize: "12px", margin: 0, lineHeight: "1.6" }}>
            Des cookies essentiels sont nécessaires au bon fonctionnement du service.
            Des cookies analytiques anonymes nous aident à l'améliorer.{" "}
            <a
              href="/politique-confidentialite"
              onClick={e => { e.preventDefault(); window.location.href = "/politique-confidentialite"; }}
              style={{ color: PRIMARY, textDecoration: "underline", fontSize: "12px" }}
            >
              En savoir plus
            </a>
          </p>
        </div>

        {/* Boutons */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", flexShrink: 0 }}>
          <button
            onClick={() => setShowCustom(true)}
            style={{
              padding: "10px 16px", background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)", color: "white",
              borderRadius: "8px", fontWeight: "600", fontSize: "13px",
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            ⚙️ Personnaliser
          </button>
          <button
            onClick={() => save({ analyticsOk: false })}
            style={{
              padding: "10px 16px", background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)", color: "white",
              borderRadius: "8px", fontWeight: "600", fontSize: "13px",
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            Refuser
          </button>
          <button
            onClick={() => save({ analyticsOk: true })}
            style={{
              padding: "10px 20px", background: PRIMARY, color: "white",
              border: "none", borderRadius: "8px", fontWeight: "700",
              fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            Accepter tout
          </button>
        </div>
      </div>
    </div>
  );
}
