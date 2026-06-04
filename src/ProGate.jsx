/**
 * ProGate — Mur de monétisation pour les fonctionnalités Pro
 * mode: "page" | "card" | "modal"
 * Exportez aussi PRO_CONFIGS pour réutilisation dans chaque composant.
 */

const PRIMARY = "#FF8C00";
const DARK    = "#0a1628";
const CARD    = "#111e35";

// ── Configs par fonctionnalité ───────────────────────────────────────────────
export const PRO_CONFIGS = {
  agenda: {
    icon: "📅", gradient: "linear-gradient(135deg,#4A90D9,#7B5EA7)",
    title: "Gérez votre planning professionnel",
    subtitle: "L'agenda Pro pour les artisans qui veulent rester organisés",
    benefits: [
      { icon: "📆", text: "Planifiez chantiers & RDV en un coup d'œil" },
      { icon: "🔔", text: "Rappels automatiques pour ne jamais rater un RDV" },
      { icon: "👥", text: "Synchronisation avec votre équipe en temps réel" },
      { icon: "📱", text: "Accessible hors connexion sur le terrain" },
    ],
  },
  outils: {
    icon: "🔧", gradient: "linear-gradient(135deg,#FF8C00,#e67600)",
    title: "La boîte à outils de l'artisan connecté",
    subtitle: "20+ outils IA et professionnels dans votre poche",
    benefits: [
      { icon: "📐", text: "Mesure par IA : calculez les m² en un seul selfie" },
      { icon: "🎙️", text: "Devis vocal : dictez, l'IA remplit le formulaire" },
      { icon: "🧱", text: "Identification matériaux : une photo suffit" },
      { icon: "📄", text: "Scanner docs et comparateur avant/après interactif" },
    ],
  },
  meteo: {
    icon: "⛅", gradient: "linear-gradient(135deg,#4a9fd4,#2e86c1)",
    title: "Météo Pro pour planifier vos chantiers",
    subtitle: "Anticipez les intempéries, optimisez vos journées",
    benefits: [
      { icon: "🌡️", text: "Température, vent et humidité en temps réel" },
      { icon: "🌧️", text: "Risque de pluie heure par heure sur 48h" },
      { icon: "📍", text: "Météo géolocalisée pour chaque chantier" },
      { icon: "⚠️", text: "Alertes automatiques avant mauvais temps" },
    ],
  },
  minisite: {
    icon: "🌐", gradient: "linear-gradient(135deg,#27ae60,#1a8a47)",
    title: "Votre vitrine professionnelle en ligne",
    subtitle: "Un mini site web inclus dans le plan Pro",
    benefits: [
      { icon: "🎨", text: "5 templates élégants, couleurs et police personnalisées" },
      { icon: "📸", text: "Galerie avant/après, avis clients, coordonnées" },
      { icon: "📩", text: "Formulaire de contact directement sur votre page" },
      { icon: "📈", text: "SEO optimisé pour être trouvé sur Google" },
    ],
  },
  equipe: {
    icon: "👥", gradient: "linear-gradient(135deg,#8e44ad,#6c3483)",
    title: "Gérez votre équipe depuis l'app",
    subtitle: "Donnez accès à vos collaborateurs et suivez leur activité",
    benefits: [
      { icon: "👷", text: "Invitez associés, collaborateurs et comptables" },
      { icon: "🔐", text: "Droits personnalisés par rôle (lecture, écriture…)" },
      { icon: "📊", text: "Suivi des heures et pointages de chaque membre" },
      { icon: "💬", text: "Mises à jour partagées sur les chantiers" },
    ],
  },
  comptable: {
    icon: "🧮", gradient: "linear-gradient(135deg,#16a085,#0d6b5a)",
    title: "L'assistant comptable IA pour artisans",
    subtitle: "TVA, revenus, prévisions — tout calculé automatiquement",
    benefits: [
      { icon: "💰", text: "CA mensuel, trimestriel et annuel en temps réel" },
      { icon: "🧾", text: "Calcul auto de la TVA collectée à reverser" },
      { icon: "📊", text: "Prévisions basées sur vos devis en cours" },
      { icon: "📉", text: "Alertes si vous approchez des seuils TVA/AE" },
    ],
  },
  recap: {
    icon: "🎉", gradient: "linear-gradient(135deg,#e67e22,#d35400)",
    title: "Récap mensuel automatique",
    subtitle: "Votre bilan financier du mois en un clic",
    benefits: [
      { icon: "📈", text: "Évolution de votre CA mois par mois" },
      { icon: "🏆", text: "Vos meilleurs clients et chantiers du mois" },
      { icon: "💡", text: "Conseils personnalisés pour votre activité" },
      { icon: "📤", text: "Exportez et partagez votre récap en PDF" },
    ],
  },
  vocal: {
    icon: "🎙️", gradient: "linear-gradient(135deg,#c0392b,#e74c3c)",
    title: "Créez vos devis à la voix",
    subtitle: "Dictez votre devis, l'IA le remplit en quelques secondes",
    benefits: [
      { icon: "⚡", text: "Devis complet en moins de 30 secondes" },
      { icon: "🧠", text: "L'IA comprend les métiers du bâtiment" },
      { icon: "✏️", text: "Relisez et ajustez avant d'envoyer" },
      { icon: "📱", text: "Utilisable mains libres sur le chantier" },
    ],
  },
  photo_import: {
    icon: "📸", gradient: "linear-gradient(135deg,#8e44ad,#6c3483)",
    title: "Devis depuis une photo de chantier",
    subtitle: "Prenez en photo un chantier, l'IA génère le devis",
    benefits: [
      { icon: "📷", text: "Photo → description des travaux en 1 clic" },
      { icon: "🔍", text: "L'IA identifie matériaux et prestations" },
      { icon: "💰", text: "Estimation automatique des coûts" },
      { icon: "⚡", text: "Gagnez 20 minutes par devis" },
    ],
  },
  scan_facture: {
    icon: "📄", gradient: "linear-gradient(135deg,#2c3e50,#4a6fa5)",
    title: "Scannez vos factures fournisseurs",
    subtitle: "Importez vos dépenses automatiquement par IA",
    benefits: [
      { icon: "📸", text: "Photo de facture → données extraites par IA" },
      { icon: "📊", text: "Suivi des dépenses par chantier en temps réel" },
      { icon: "💼", text: "Export comptable en fin de mois" },
      { icon: "🔍", text: "Retrouvez n'importe quelle facture instantanément" },
    ],
  },
  pointage: {
    icon: "⏱️", gradient: "linear-gradient(135deg,#2ecc71,#27ae60)",
    title: "Pointage des heures sur chantier",
    subtitle: "Enregistrez vos heures de travail d'un seul tap",
    benefits: [
      { icon: "▶️", text: "Démarrez et arrêtez le chrono depuis le terrain" },
      { icon: "📊", text: "Total des heures par chantier et par ouvrier" },
      { icon: "💰", text: "Coût main d'œuvre calculé automatiquement" },
      { icon: "📋", text: "Exportez le pointage pour votre comptable" },
    ],
  },
  suivi_client: {
    icon: "👁️", gradient: "linear-gradient(135deg,#3498db,#2980b9)",
    title: "Suivi chantier en temps réel",
    subtitle: "Votre client suit l'avancement depuis son téléphone",
    benefits: [
      { icon: "📱", text: "Lien de suivi partageable par SMS ou email" },
      { icon: "📸", text: "Photos d'avancement publiées en temps réel" },
      { icon: "📝", text: "Mises à jour visibles par le client" },
      { icon: "⭐", text: "Collectez un avis à la fin du chantier" },
    ],
  },
  qr_code: {
    icon: "📱", gradient: "linear-gradient(135deg,#2c3e50,#4a6fa5)",
    title: "Signature QR Code instantanée",
    subtitle: "Votre client signe en scannant un QR Code",
    benefits: [
      { icon: "⚡", text: "Signez en face à face sans attendre un email" },
      { icon: "📱", text: "Compatible iOS et Android, sans application" },
      { icon: "🔐", text: "Signature horodatée légalement valide" },
      { icon: "🖨️", text: "Imprimez le QR Code sur le devis papier" },
    ],
  },
  badge_verifie: {
    icon: "✅", gradient: "linear-gradient(135deg,#27ae60,#1a8a47)",
    title: "Badge Artisan Vérifié",
    subtitle: "Renforcez la confiance de vos clients",
    benefits: [
      { icon: "🔰", text: "Badge ✓ vérifié sur votre profil et vos PDFs" },
      { icon: "📄", text: "Apparaît sur tous vos devis et factures" },
      { icon: "🌐", text: "Mis en avant sur votre mini site web" },
      { icon: "+32%", text: "De taux d'acceptation des devis en moyenne" },
    ],
  },
  graphiques: {
    icon: "📈", gradient: "linear-gradient(135deg,#e67e22,#d35400)",
    title: "Graphiques d'évolution de votre CA",
    subtitle: "Visualisez votre croissance mois après mois",
    benefits: [
      { icon: "📊", text: "Courbe d'évolution sur 6 à 12 mois" },
      { icon: "🏆", text: "Votre meilleur mois et record de CA" },
      { icon: "📉", text: "Comparaison avec le mois précédent" },
      { icon: "💡", text: "Prévision de fin d'année selon votre tendance" },
    ],
  },
};

// ── Composant ProGate ────────────────────────────────────────────────────────
export default function ProGate({
  featureKey,         // clé dans PRO_CONFIGS
  icon, gradient, title, subtitle, benefits, // ou props directes
  onUpgrade,          // () => void
  onDismiss,          // () => void — "Pas maintenant"
  mode = "page",      // "page" | "card" | "modal"
}) {
  // Récupère config depuis PRO_CONFIGS si featureKey fourni
  const cfg = featureKey ? (PRO_CONFIGS[featureKey] || {}) : {};
  const ic  = icon      || cfg.icon      || "💎";
  const gr  = gradient  || cfg.gradient  || "linear-gradient(135deg,#FF8C00,#e67600)";
  const ti  = title     || cfg.title     || "Fonctionnalité Pro";
  const su  = subtitle  || cfg.subtitle  || "Passez au plan Pro pour débloquer.";
  const be  = benefits  || cfg.benefits  || [];

  const content = (
    <div style={{ maxWidth: "400px", margin: "0 auto", textAlign: "center" }}>

      {/* Icône gradient */}
      <div style={{
        width: "88px", height: "88px", borderRadius: "26px",
        background: gr, margin: "0 auto 18px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "42px", boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
      }}>
        {ic}
      </div>

      {/* Badge Pro */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        background: "rgba(255,140,0,0.12)", border: "1px solid rgba(255,140,0,0.3)",
        borderRadius: "20px", padding: "4px 13px", marginBottom: "14px",
        fontSize: "11px", fontWeight: "800", color: PRIMARY,
        textTransform: "uppercase", letterSpacing: "0.6px",
      }}>
        💎 Fonctionnalité Pro
      </div>

      {/* Titre */}
      <h2 style={{ color: "white", fontSize: "20px", fontWeight: "900", margin: "0 0 8px", lineHeight: 1.3 }}>
        {ti}
      </h2>

      {/* Sous-titre */}
      <p style={{ color: "#8899aa", fontSize: "13px", lineHeight: "1.6", margin: "0 0 20px" }}>
        {su}
      </p>

      {/* Avantages */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "14px", padding: "16px 18px", marginBottom: "22px",
        textAlign: "left",
      }}>
        {be.map((b, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: "12px",
            marginBottom: i < be.length - 1 ? "12px" : 0,
          }}>
            <div style={{
              width: "30px", height: "30px", borderRadius: "8px",
              background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.15)",
              flexShrink: 0, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "14px",
            }}>
              {b.icon}
            </div>
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "13px", lineHeight: "1.45", flex: 1 }}>
              {b.text}
            </span>
          </div>
        ))}
      </div>

      {/* Prix */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "3px", marginBottom: "3px" }}>
          <span style={{ color: PRIMARY, fontSize: "38px", fontWeight: "900", lineHeight: 1 }}>7,99</span>
          <span style={{ color: PRIMARY, fontSize: "20px", fontWeight: "700" }}>€</span>
          <span style={{ color: "#8899aa", fontSize: "13px" }}>/mois</span>
        </div>
        <div style={{ color: "#556677", fontSize: "11px" }}>Résiliable à tout moment — sans engagement</div>
      </div>

      {/* CTA Pro */}
      <button
        onClick={onUpgrade}
        style={{
          width: "100%",
          background: "linear-gradient(135deg,#FF8C00 0%,#e67600 100%)",
          color: "white", border: "none",
          borderRadius: "13px", padding: "16px",
          fontSize: "16px", fontWeight: "800",
          cursor: "pointer",
          boxShadow: "0 4px 24px rgba(255,140,0,0.45)",
          transition: "transform 0.15s, box-shadow 0.15s",
          marginBottom: "8px",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 30px rgba(255,140,0,0.55)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(255,140,0,0.45)"; }}
      >
        💎 Passer au Pro — 7,99 €/mois
      </button>

      {/* Pas maintenant */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            width: "100%", background: "transparent",
            color: "#8899aa", border: "none",
            borderRadius: "12px", padding: "10px",
            fontSize: "13px", cursor: "pointer",
          }}
        >
          Pas maintenant
        </button>
      )}
    </div>
  );

  /* ── MODE PAGE ── */
  if (mode === "page") return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "55vh", padding: "24px 16px",
    }}>
      {content}
    </div>
  );

  /* ── MODE CARD ── */
  if (mode === "card") return (
    <div style={{
      background: CARD, borderRadius: "20px",
      padding: "28px 24px",
      border: "1px solid rgba(255,140,0,0.2)",
      marginBottom: "16px",
    }}>
      {content}
    </div>
  );

  /* ── MODE MODAL (bottom sheet) ── */
  return (
    <div
      onClick={e => e.target === e.currentTarget && onDismiss?.()}
      style={{
        position: "fixed", inset: 0, zIndex: 2100,
        background: "rgba(0,0,0,0.82)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        backdropFilter: "blur(6px)",
      }}
    >
      <div style={{
        background: CARD,
        borderRadius: "24px 24px 0 0",
        padding: "16px 24px",
        paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
        width: "100%", maxWidth: "500px",
        border: "1px solid rgba(255,140,0,0.25)",
        boxShadow: "0 -12px 60px rgba(0,0,0,0.5)",
        animation: "slideUp 0.25s ease",
        maxHeight: "92vh",
        overflowY: "auto",
      }}>
        {/* Poignée */}
        <div style={{ width: "40px", height: "4px", background: "rgba(255,255,255,0.15)", borderRadius: "2px", margin: "0 auto 18px" }} />
        <button
          onClick={onDismiss}
          style={{
            position: "absolute", top: "20px", right: "20px",
            background: "rgba(255,255,255,0.08)", border: "none",
            color: "#8899aa", borderRadius: "50%", width: "32px", height: "32px",
            cursor: "pointer", fontSize: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >✕</button>
        {content}
      </div>
    </div>
  );
}
