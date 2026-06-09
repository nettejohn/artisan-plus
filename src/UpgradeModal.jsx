/**
 * UpgradeModal — Fenêtre d'invitation à passer au plan Pro
 * Affiché quand un utilisateur Free atteint une limite (3 factures / 3 devis / 2 chantiers).
 */

const PRIMARY = "#FF8C00";
const DARK    = "#0a1628";
const CARD    = "#111e35";

const FEATURES_FREE = [
  "10 factures/mois max",
  "10 devis/mois max",
  "10 chantiers/mois max",
  "10 clients max",
];

const FEATURES_PRO = [
  "Factures & devis illimités",
  "Chantiers illimités",
  "Photos chantier illimitées",
  "Export PDF professionnel",
  "Signature électronique",
  "Notifications intelligentes",
  "Support prioritaire",
];

export default function UpgradeModal({ onClose, onUpgrade, limitType = "factures" }) {
  const labels = {
    factures:  "factures",
    devis:     "devis",
    chantiers: "chantiers",
    clients:   "clients",
  };
  const emoji = {
    factures:  "📄",
    devis:     "📝",
    chantiers: "🏗️",
    clients:   "👥",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: CARD,
        borderRadius: "24px",
        width: "100%", maxWidth: "480px",
        border: "1px solid rgba(255,140,0,0.3)",
        boxShadow: "0 0 80px rgba(255,140,0,0.2)",
        overflow: "hidden",
        animation: "fadeInDown 0.25s ease",
      }}>

        {/* Header orange */}
        <div style={{
          background: "linear-gradient(135deg, #FF8C00 0%, #e67600 100%)",
          padding: "28px 28px 24px",
          textAlign: "center",
          position: "relative",
        }}>
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: "14px", right: "16px",
              background: "rgba(255,255,255,0.2)", border: "none",
              color: "white", borderRadius: "50%",
              width: "28px", height: "28px", cursor: "pointer",
              fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>

          <div style={{ fontSize: "40px", marginBottom: "10px" }}>
            {emoji[limitType]} 🔒
          </div>
          <div style={{ color: "white", fontWeight: "900", fontSize: "22px", marginBottom: "6px" }}>
            Limite atteinte
          </div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px" }}>
            Vous avez atteint la limite de {labels[limitType]} du plan gratuit.
          </div>
        </div>

        {/* Comparaison plans */}
        <div style={{ padding: "24px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" }}>

            {/* Plan Free */}
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px", padding: "16px",
            }}>
              <div style={{ color: "#8899aa", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
                Gratuit
              </div>
              {FEATURES_FREE.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: "7px", alignItems: "flex-start", marginBottom: "7px" }}>
                  <span style={{ color: "#ff6b6b", fontSize: "13px", flexShrink: 0 }}>✗</span>
                  <span style={{ color: "#8899aa", fontSize: "12px", lineHeight: "1.4" }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Plan Pro */}
            <div style={{
              background: "rgba(255,140,0,0.08)",
              border: "1.5px solid rgba(255,140,0,0.4)",
              borderRadius: "14px", padding: "16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                <span style={{ color: PRIMARY, fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>
                  💎 Pro
                </span>
              </div>
              {FEATURES_PRO.slice(0, 5).map((f, i) => (
                <div key={i} style={{ display: "flex", gap: "7px", alignItems: "flex-start", marginBottom: "7px" }}>
                  <span style={{ color: "#4CAF50", fontSize: "13px", flexShrink: 0 }}>✓</span>
                  <span style={{ color: "white", fontSize: "12px", lineHeight: "1.4" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prix + CTA */}
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "4px", marginBottom: "4px" }}>
              <span style={{ color: PRIMARY, fontSize: "38px", fontWeight: "900" }}>7,99</span>
              <span style={{ color: PRIMARY, fontSize: "20px", fontWeight: "700" }}>€</span>
              <span style={{ color: "#8899aa", fontSize: "14px" }}>/mois</span>
            </div>
            <div style={{ color: "#8899aa", fontSize: "12px" }}>
              Résiliable à tout moment — sans engagement
            </div>
          </div>

          <button
            onClick={onUpgrade}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #FF8C00 0%, #e67600 100%)",
              color: "white", border: "none",
              borderRadius: "12px", padding: "16px",
              fontSize: "16px", fontWeight: "800",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(255,140,0,0.4)",
              transition: "all 0.2s",
            }}
          >
            💎 Passer au Pro — 7,99 €/mois
          </button>

          <button
            onClick={onClose}
            style={{
              width: "100%", background: "transparent",
              color: "#8899aa", border: "none",
              borderRadius: "12px", padding: "10px",
              fontSize: "13px", cursor: "pointer", marginTop: "8px",
            }}
          >
            Continuer avec le plan gratuit
          </button>
        </div>
      </div>
    </div>
  );
}
