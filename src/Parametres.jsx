import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import EditeurSite from "./EditeurSite";
import ProGate from "./ProGate";
import { useLanguage } from "./i18n";

const PRIMARY = "#FF8C00";
const DARK    = "#0a1628";
const CARD    = "#111e35";

const THEMES_PDF = [
  { id: "moderne",     label: "Moderne",     emoji: "🟠", desc: "Orange & fond sombre — style Artisan+" },
  { id: "classique",   label: "Classique",   emoji: "🔵", desc: "Bleu marine, sobre et professionnel"   },
  { id: "elegant",     label: "Élégant",     emoji: "⚫", desc: "Noir & or, haut de gamme"              },
  { id: "minimaliste", label: "Minimaliste", emoji: "⚪", desc: "Épuré et clair, tout en sobriété"      },
  { id: "pro",         label: "Pro",         emoji: "🟣", desc: "Violet & blanc, look corporate"        },
];

// Couleurs par défaut de chaque thème (miroir de GenerateurPDF.js)
const THEMES_COULEURS = {
  moderne:     { principale: "#FF8C00", fondEntetes: "#FFF5E6", texte: "#1E1E1E", titres: "#787878", bordures: "#FF8C00", accent: "#FF8C00" },
  classique:   { principale: "#1E1E1E", fondEntetes: "#F5F5F5", texte: "#1E1E1E", titres: "#646464", bordures: "#1E1E1E", accent: "#1E1E1E" },
  elegant:     { principale: "#14141E", fondEntetes: "#FAF8F3", texte: "#14141E", titres: "#645F55", bordures: "#A07832", accent: "#A07832" },
  minimaliste: { principale: "#3C3C3C", fondEntetes: "#F8F8F8", texte: "#282828", titres: "#828282", bordures: "#5A5A5A", accent: "#5A5A5A" },
  pro:         { principale: "#0A1628", fondEntetes: "#EEF4FC", texte: "#0A1628", titres: "#506482", bordures: "#FF8C00", accent: "#FF8C00" },
};

const SECTIONS = [
  { id: "profil",        label: "Mon profil",       emoji: "👤" },
  { id: "minisite",      label: "Mini site web",    emoji: "🌐" },
  { id: "equipe",        label: "Mon équipe",       emoji: "👥" },
  { id: "verif",         label: "Vérification",     emoji: "✅" },
  { id: "apparence",     label: "Apparence",        emoji: "🎨" },
  { id: "factures",      label: "Facturation",      emoji: "📄" },
  { id: "paiements",     label: "Paiements en ligne", emoji: "💳" },
  { id: "notifications", label: "Notifs",           emoji: "🔔" },
  { id: "abonnement",    label: "Abonnement",       emoji: "💎" },
  { id: "parrainage",    label: "Parrainage",       emoji: "🎁" },
  { id: "simplifie",     label: "Mode simplifié",   emoji: "📱" },
  { id: "securite",      label: "Sécurité",         emoji: "🔒" },
  { id: "danger",        label: "Danger",           emoji: "⚠️" },
  { id: "aide",          label: "Centre d'aide",    emoji: "❓" },
];

const ROLES_EQUIPE = [
  { id: "associe",       label: "Associé",       desc: "Accès complet sauf paiement & abonnement" },
  { id: "collaborateur", label: "Collaborateur", desc: "Chantiers et pointage uniquement"          },
  { id: "comptable",     label: "Comptable",     desc: "Factures et tableau de bord financier"     },
];

const inp = {
  background: DARK,
  border: "1px solid rgba(255,140,0,0.2)",
  borderRadius: "10px",
  padding: "12px 16px",
  color: "white",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};
const lbl = {
  color: "#8899aa",
  fontSize: "12px",
  fontWeight: "600",
  display: "block",
  marginBottom: "6px",
};

function SCard({ titre, children }) {
  return (
    <div style={{ background: CARD, borderRadius: "16px", padding: "20px", border: "1px solid rgba(255,140,0,0.15)", marginBottom: "16px" }}>
      <h3 style={{ color: "white", margin: "0 0 18px", fontSize: "15px", fontWeight: "700" }}>{titre}</h3>
      {children}
    </div>
  );
}

function SaveBtn({ onClick, saving, label = "Enregistrer" }) {
  return (
    <button onClick={onClick} disabled={saving} style={{
      background: saving ? "#555" : PRIMARY, color: "white", border: "none",
      borderRadius: "10px", padding: "12px 22px", fontSize: "14px",
      fontWeight: "700", cursor: saving ? "not-allowed" : "pointer", marginTop: "18px",
      display: "flex", alignItems: "center", gap: "6px"
    }}>
      {saving ? "⏳ Sauvegarde…" : "💾 " + label}
    </button>
  );
}

export default function Parametres({ user, onBack, isDesktop = false, initialSection = "profil", onModeSimpleChange, isPro = true, onUpgrade, stripeConnectStatus = null, onStripeConnectStatusCleared }) {
  const { lang, setLang, t } = useLanguage();
  const [activeSection, setActiveSection] = useState(initialSection);
  const [loading,       setLoading]       = useState(true);
  const [savingProfil,  setSavingProfil]  = useState(false);
  const [savingParams,  setSavingParams]  = useState(false);
  const [msgProfil,     setMsgProfil]     = useState("");
  const [msgParams,     setMsgParams]     = useState("");
  const [logoUploading, setLogoUploading] = useState(false);

  // ── Profil ──────────────────────────────────────────
  const [profil, setProfil] = useState({
    nom: "", adresse: "", siret: "", telephone: "", iban: "", logo_url: ""
  });

  // ── Couleurs PDF personnalisées (6 couleurs) ─────────
  const [couleursPdf, setCouleursPdf] = useState({
    principale:  null, // headerBg (header, footer, têtes tableau)
    fondEntetes: null, // tableBg (lignes alternées, boîtes)
    texte:       null, // textColor (corps de texte)
    titres:      null, // grayColor (labels secondaires)
    bordures:    null, // borderColor (lignes séparatrices)
    accent:      null, // accent (total TTC, bande déco)
  });

  // ── Paramètres ──────────────────────────────────────
  const [params, setParams] = useState({
    theme_pdf: "moderne",
    couleur_pdf: "#FF8C00",
    format_numerotation: "FAC-{YYYY}-{NNN}",
    tva_defaut: "20",
    mention_legale: "",
    conditions_paiement: "Paiement à réception de facture",
    penalites_retard: "1,5% par mois",
    // Mentions optionnelles PDF
    numero_assurance:         "",
    afficher_assurance:       false,
    numero_rcs:               "",
    afficher_rcs:             false,
    numero_tva_intra:         "",
    afficher_tva_intra:       false,
    mention_auto_entrepreneur: false,
    indemnite_recouvrement:   false,
    tva_sur_debits:           false,
    // Préférences
    langue:          "fr",
    devise:          "€",
    signature_email: "",
    // Notifications
    notif_emails: false,
    notif_rappels_devis: false,
    notif_rappels_factures: false,
  });

  // ── Sécurité ─────────────────────────────────────────
  const [pwdNouv,    setPwdNouv]    = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdMsg,     setPwdMsg]     = useState({ text: "", ok: true });
  const [pwdSaving,  setPwdSaving]  = useState(false);

  // ── Danger ───────────────────────────────────────────
  const [deleteStep,        setDeleteStep]        = useState(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // ── Centre d'aide (accordéon + formulaire contact) ─
  const [aideOpenId,       setAideOpenId]       = useState(null);
  const [contactSujet,     setContactSujet]     = useState("Problème technique");
  const [contactMsg,       setContactMsg]       = useState("");
  const [contactLoading,   setContactLoading]   = useState(false);
  const [contactSuccess,   setContactSuccess]   = useState(false);
  const [contactError,     setContactError]     = useState("");

  // ── Abonnement Stripe ────────────────────────────
  const [planInfo,      setPlanInfo]      = useState({ plan: "free", stripe_customer_id: null });
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeMsg,     setStripeMsg]     = useState("");

  // ── Stripe Connect (paiements en ligne) ──────────
  const [connectInfo,    setConnectInfo]    = useState({ accountId: null, onboarded: false });
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectMsg,     setConnectMsg]     = useState({ text: "", ok: true });

  // ── Parrainage ───────────────────────────────────
  const [referralInfo,   setReferralInfo]   = useState({ code: null, referred_by: null, used: false, pro_until: null });
  const [codeCopie,      setCodeCopie]      = useState(false);

  // ── Mon Équipe ────────────────────────────────────
  const [membres,        setMembres]        = useState([]);
  const [inviteEmail,    setInviteEmail]    = useState("");
  const [inviteRole,     setInviteRole]     = useState("collaborateur");
  const [inviteSending,  setInviteSending]  = useState(false);
  const [inviteMsg,      setInviteMsg]      = useState({ text: "", ok: true });
  const [codeCopied,     setCodeCopied]     = useState(null); // id du membre

  // ── Mode simplifié ────────────────────────────────
  const [modeSimplifie,       setModeSimplifie]       = useState(false);
  const [savingModeSimplifie, setSavingModeSimplifie] = useState(false);
  const [simplifieConfig,     setSimplifieConfig]     = useState({ factures: true, devis: true, clients: true, chantiers: false, agenda: false, catalogue: false, mini_site: false, recap: false, calculatrice: true, niveau: false, lampe: false, notes: false });
  const [savingConfig,        setSavingConfig]        = useState(false);

  // ── Éditeur visuel ───────────────────────────────────
  const [editeurOuvert, setEditeurOuvert] = useState(false);

  // ── Mini Site ─────────────────────────────────────
  const [miniSite, setMiniSite] = useState({
    actif:        false,
    slug:         "",
    metier:       "",
    zone:         "",
    description:  "",
  });
  const [miniSiteSaving, setMiniSiteSaving] = useState(false);
  const [miniSiteMsg,    setMiniSiteMsg]    = useState({ text: "", ok: true });

  // ── Vérification artisan ──────────────────────────
  const [verificationStatut, setVerificationStatut] = useState("non_soumis"); // non_soumis | en_attente | verifie | rejete
  const [modeRenvoi, setModeRenvoi] = useState(false);
  const [verifDocUrl,        setVerifDocUrl]        = useState("");
  const [verifUploading,     setVerifUploading]     = useState(false);
  const [verifMsg,           setVerifMsg]           = useState({ text: "", ok: true });

  // ── Chargement ───────────────────────────────────────
  useEffect(() => { charger(); chargerMembres(); }, []);

  // ── Retour depuis Stripe Connect onboarding ──────
  useEffect(() => {
    if (stripeConnectStatus === "success" || stripeConnectStatus === "refresh") {
      handleRetourStripe();
    }
  }, [stripeConnectStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const charger = async () => {
    setLoading(true);
    const [{ data: p }, { data: pm }] = await Promise.all([
      supabase.from("profils").select("*").eq("user_id", user.id).single(),
      supabase.from("parametres").select("*").eq("user_id", user.id).single(),
    ]);
    if (p) {
      setProfil({
        nom:       p.nom       || "",
        adresse:   p.adresse   || "",
        siret:     p.siret     || "",
        telephone: p.telephone || "",
        iban:      p.iban      || "",
        logo_url:  p.logo_url  || "",
      });
      setPlanInfo({
        plan:               p.plan               || "free",
        stripe_customer_id: p.stripe_customer_id || null,
      });
      setConnectInfo({
        accountId: p.stripe_connect_account_id || null,
        onboarded: p.stripe_connect_onboarded  || false,
      });
      setReferralInfo({
        code:       p.referral_code      || null,
        referred_by: p.referred_by       || null,
        used:        p.referral_used     || false,
        pro_until:   p.referral_pro_until || null,
      });
      setVerificationStatut(p.verification_statut || "non_soumis");
      setVerifDocUrl(p.verification_document_url  || "");
      setMiniSite({
        actif:       p.mini_site_actif       || false,
        slug:        p.mini_site_slug        || "",
        metier:      p.metier               || "",
        zone:        p.zone_intervention    || "",
        description: p.description_mini_site || "",
      });
    }
    if (pm) {
      setParams({
        theme_pdf:             pm.theme_pdf             || "moderne",
        couleur_pdf:           pm.couleur_pdf           || "#FF8C00",
        format_numerotation:   pm.format_numerotation   || "FAC-{YYYY}-{NNN}",
        tva_defaut:            String(pm.tva_defaut      ?? "20"),
        mention_legale:        pm.mention_legale        || "",
        conditions_paiement:   pm.conditions_paiement   || "Paiement à réception de facture",
        penalites_retard:      pm.penalites_retard      || "1,5% par mois",
        // Mentions optionnelles PDF
        numero_assurance:          pm.numero_assurance          || "",
        afficher_assurance:        pm.afficher_assurance        || false,
        numero_rcs:                pm.numero_rcs                || "",
        afficher_rcs:              pm.afficher_rcs              || false,
        numero_tva_intra:          pm.numero_tva_intra          || "",
        afficher_tva_intra:        pm.afficher_tva_intra        || false,
        mention_auto_entrepreneur: pm.mention_auto_entrepreneur || false,
        indemnite_recouvrement:    pm.indemnite_recouvrement    || false,
        tva_sur_debits:            pm.tva_sur_debits            || false,
        // Préférences
        langue:          pm.langue          || "fr",
        devise:          pm.devise          || "€",
        signature_email: pm.signature_email || "",
        // Notifications
        notif_emails:          pm.notif_emails          || false,
        notif_rappels_devis:   pm.notif_rappels_devis   || false,
        notif_rappels_factures: pm.notif_rappels_factures || false,
      });
      setModeSimplifie(pm.mode_simplifie || false);
      // Config personnalisation (colonne JSONB optionnelle)
      if (pm.simplifie_config) {
        setSimplifieConfig(prev => ({ ...prev, ...pm.simplifie_config }));
      } else {
        try {
          const cached = localStorage.getItem(`simplifie_config_${user.id}`);
          if (cached) setSimplifieConfig(prev => ({ ...prev, ...JSON.parse(cached) }));
        } catch {}
      }
      // Palette couleurs PDF (colonne JSONB optionnelle)
      if (pm.couleurs_pdf) {
        setCouleursPdf(prev => ({ ...prev, ...pm.couleurs_pdf }));
      } else {
        try {
          const cached = localStorage.getItem(`couleurs_pdf_${user.id}`);
          if (cached) setCouleursPdf(prev => ({ ...prev, ...JSON.parse(cached) }));
        } catch {}
      }
    }
    setLoading(false);
  };

  // ── Équipe ────────────────────────────────────────────────────
  const chargerMembres = async () => {
    const { data } = await supabase
      .from("equipe_membres")
      .select("*")
      .eq("patron_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setMembres(data);
  };

  const genCodeInvitation = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return "EQUIP-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const inviterMembre = async () => {
    if (!inviteEmail.trim()) { setInviteMsg({ text: "❌ Email requis", ok: false }); return; }
    setInviteSending(true);
    setInviteMsg({ text: "", ok: true });
    const code = genCodeInvitation();
    const { error } = await supabase.from("equipe_membres").insert({
      patron_id:       user.id,
      email_invite:    inviteEmail.trim().toLowerCase(),
      role:            inviteRole,
      code_invitation: code,
      statut:          "invite",
    });
    if (error) {
      setInviteMsg({ text: "❌ " + error.message, ok: false });
    } else {
      setInviteMsg({ text: `✅ Invitation créée ! Code : ${code}`, ok: true });
      setInviteEmail("");
      chargerMembres();
    }
    setInviteSending(false);
  };

  const revoquerMembre = async (id) => {
    if (!window.confirm("Révoquer l'accès de ce membre ?")) return;
    await supabase.from("equipe_membres").delete().eq("id", id);
    chargerMembres();
  };

  const copierCodeInvitation = (membre) => {
    navigator.clipboard.writeText(membre.code_invitation);
    setCodeCopied(membre.id);
    setTimeout(() => setCodeCopied(null), 2000);
  };

  const flash = (setter, text, ok = true) => {
    setter({ text, ok });
    setTimeout(() => setter({ text: "" }), 3500);
  };

  // ── Sauvegarde profil ────────────────────────────────
  const sauvegarderProfil = async () => {
    setSavingProfil(true);
    const { error } = await supabase.from("profils").upsert({
      user_id:   user.id,
      nom:       profil.nom       || null,
      adresse:   profil.adresse   || null,
      siret:     profil.siret     || null,
      telephone: profil.telephone || null,
      iban:      profil.iban      || null,
      logo_url:  profil.logo_url  || null,
    }, { onConflict: "user_id" });
    setSavingProfil(false);
    if (error) setMsgProfil("❌ " + error.message);
    else       setMsgProfil("✅ Profil sauvegardé !");
    setTimeout(() => setMsgProfil(""), 3500);
  };

  // ── Sauvegarde paramètres ────────────────────────────
  const sauvegarderParams = async () => {
    setSavingParams(true);
    const { error } = await supabase.from("parametres").upsert({
      user_id: user.id,
      ...params,
      tva_defaut: parseFloat(params.tva_defaut) || 20,
    }, { onConflict: "user_id" });

    // Sauvegarde palette couleurs (colonne JSONB optionnelle + localStorage)
    try {
      localStorage.setItem(`couleurs_pdf_${user.id}`, JSON.stringify(couleursPdf));
      const { error: cpErr } = await supabase.from("parametres").upsert(
        { user_id: user.id, couleurs_pdf: couleursPdf },
        { onConflict: "user_id" }
      );
      if (cpErr) console.warn("[couleurs_pdf] Colonne absente en DB — localStorage utilisé");
    } catch (_) {}

    setSavingParams(false);
    if (error) {
      setMsgParams("❌ " + error.message);
    } else {
      if (params.langue === "en" || params.langue === "fr") {
        setLang(params.langue);
      }
      setMsgParams(lang === "en" ? "✅ Settings saved!" : "✅ Paramètres sauvegardés !");
    }
    setTimeout(() => setMsgParams(""), 3500);
  };

  // ── Upload logo ───────────────────────────────────────
  const uploadLogo = async (fichier) => {
    setLogoUploading(true);
    try {
      const ext  = fichier.name.split(".").pop().toLowerCase();
      const path = `${user.id}/logo.${ext}`;
      const { error: errUp } = await supabase.storage
        .from("logos")
        .upload(path, fichier, { cacheControl: "3600", upsert: true });
      if (errUp) throw errUp;
      const { data: { publicUrl } } = supabase.storage.from("logos").getPublicUrl(path);
      setProfil(p => ({ ...p, logo_url: publicUrl + "?t=" + Date.now() }));
    } catch (e) { alert("Erreur upload logo : " + e.message); }
    setLogoUploading(false);
  };

  // ── Upload justificatif vérification ─────────────────
  const uploadVerifDoc = async (fichier) => {
    setVerifUploading(true);
    try {
      const ext  = fichier.name.split(".").pop().toLowerCase();
      const path = `${user.id}/verification.${ext}`;
      const { error: errUp } = await supabase.storage
        .from("verifications")
        .upload(path, fichier, { cacheControl: "3600", upsert: true });
      if (errUp) throw errUp;
      const { data: { publicUrl } } = supabase.storage.from("verifications").getPublicUrl(path);
      setVerifDocUrl(publicUrl + "?t=" + Date.now());
    } catch (e) {
      setVerifMsg({ text: "❌ Erreur upload : " + e.message, ok: false });
      setTimeout(() => setVerifMsg({ text: "" }), 4000);
    }
    setVerifUploading(false);
  };

  // ── Soumettre dossier vérification ───────────────────
  const soumettreDossier = async () => {
    if (!profil.siret)  { setVerifMsg({ text: "❌ Ajoutez votre SIRET dans Mon profil", ok: false }); setTimeout(() => setVerifMsg({ text: "" }), 4000); return; }
    if (!verifDocUrl)   { setVerifMsg({ text: "❌ Ajoutez un justificatif", ok: false }); setTimeout(() => setVerifMsg({ text: "" }), 4000); return; }

    const { error } = await supabase.from("profils").upsert({
      user_id:                    user.id,
      verification_statut:        "en_attente",
      verification_document_url:  verifDocUrl,
      verification_soumis_at:     new Date().toISOString(),
    }, { onConflict: "user_id" });

    if (error) {
      setVerifMsg({ text: "❌ " + error.message, ok: false });
      setTimeout(() => setVerifMsg({ text: "" }), 6000);
      return;
    }

    setVerificationStatut("en_attente");
    setModeRenvoi(false);
    setVerifMsg({ text: "⏳ Dossier enregistré, envoi de la notification…", ok: true });

    // Génère une URL signée (7 jours) pour que le serveur puisse télécharger le fichier
    let docSignedUrl = verifDocUrl;
    try {
      const rawPath = verifDocUrl.split("?")[0];
      const match   = rawPath.match(/\/verifications\/(.+)$/);
      if (match) {
        const { data } = await supabase.storage
          .from("verifications")
          .createSignedUrl(match[1], 60 * 60 * 24 * 7);
        if (data?.signedUrl) docSignedUrl = data.signedUrl;
      }
    } catch (_) {}

    try {
      const resp = await fetch("/api/send-email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:         "verification",
          userId:       user.id,
          nomArtisan:   profil.nom   || "",
          emailArtisan: user.email   || "",
          siret:        profil.siret || "",
          docUrl:       docSignedUrl,
        }),
      });
      if (resp.ok) {
        setVerifMsg({ text: "✅ Dossier envoyé ! Notre équipe examine votre demande sous 24–48h.", ok: true });
      } else {
        const body = await resp.json().catch(() => ({}));
        setVerifMsg({ text: `⚠️ Dossier enregistré mais notification échouée : ${body.error || resp.status}`, ok: false });
      }
    } catch (e) {
      setVerifMsg({ text: `⚠️ Dossier enregistré mais notification échouée : ${e.message}`, ok: false });
    }

    setTimeout(() => setVerifMsg({ text: "" }), 8000);
  };

  // ── Changer mot de passe ─────────────────────────────
  const changerMDP = async () => {
    if (!pwdNouv || pwdNouv.length < 6) { setPwdMsg({ text: "❌ 6 caractères minimum", ok: false }); return; }
    if (pwdNouv !== pwdConfirm)          { setPwdMsg({ text: "❌ Les mots de passe ne correspondent pas", ok: false }); return; }
    setPwdSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwdNouv });
    setPwdSaving(false);
    if (error) setPwdMsg({ text: "❌ " + error.message, ok: false });
    else {
      setPwdMsg({ text: "✅ Mot de passe mis à jour !", ok: true });
      setPwdNouv(""); setPwdConfirm("");
    }
  };

  // ── Déconnecter partout ──────────────────────────────
  const deconnecterPartout = async () => {
    if (!window.confirm("Déconnecter tous les appareils ?")) return;
    await supabase.auth.signOut({ scope: "global" });
    window.location.reload();
  };

  // ── Parrainage ───────────────────────────────────────
  const copierCode = () => {
    if (!referralInfo.code) return;
    navigator.clipboard.writeText(referralInfo.code).catch(() => {});
    setCodeCopie(true);
    setTimeout(() => setCodeCopie(false), 2000);
  };

  const partagerParrainage = async () => {
    if (!referralInfo.code) return;
    const lien = `https://www.artisan-plus.fr?ref=${referralInfo.code}`;
    const msg  = `J'utilise Artisan+ pour gérer mes devis et factures, c'est top ! 🚀\nInscris-toi avec mon code ${referralInfo.code} et on gagne tous les deux 1 mois Pro gratuit :\n${lien}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Artisan+ — Code parrainage", text: msg }); } catch (_) {}
    } else {
      navigator.clipboard.writeText(msg).catch(() => {});
      alert("Message copié ! Partagez-le par SMS ou WhatsApp.");
    }
  };

  // ── Mode simplifié : toggle ──────────────────────────
  const toggleModeSimplifie = async (valeur) => {
    setSavingModeSimplifie(true);
    setModeSimplifie(valeur);
    const { error } = await supabase.from("parametres").upsert(
      { user_id: user.id, mode_simplifie: valeur },
      { onConflict: "user_id" }
    );
    setSavingModeSimplifie(false);
    if (error) {
      console.error("[mode simplifié] erreur upsert :", error.message);
      // Annuler l'optimistic update si erreur (colonne manquante → SQL migration à exécuter)
      setModeSimplifie(!valeur);
    } else {
      onModeSimpleChange?.(valeur);
    }
  };

  // ── Mode simplifié : personnalisation ────────────────
  const sauvegarderSimplifieConfig = async (newConfig) => {
    setSavingConfig(true);
    setSimplifieConfig(newConfig);
    // Sauvegarde localStorage immédiate (fallback si colonne manquante)
    try { localStorage.setItem(`simplifie_config_${user.id}`, JSON.stringify(newConfig)); } catch {}
    // Tentative Supabase (requiert ALTER TABLE parametres ADD COLUMN simplifie_config JSONB)
    const { error } = await supabase.from("parametres").upsert(
      { user_id: user.id, simplifie_config: newConfig },
      { onConflict: "user_id" }
    );
    if (error) console.warn("[simplifie_config] colonne absente — localStorage utilisé");
    setSavingConfig(false);
  };

  // ── Supprimer compte ─────────────────────────────────
  const supprimerCompte = async () => {
    alert("Pour supprimer définitivement votre compte, contactez le support à support@artisan-plus.fr\nVos données seront effacées dans les 48h.");
    setDeleteStep(0); setDeleteConfirmText("");
  };

  // ── Stripe Connect : fonctions ───────────────────────

  // ── Retour depuis Stripe : status puis recover si account_id manque ──
  const handleRetourStripe = async () => {
    setConnectMsg({ text: "🔄 Vérification du compte Stripe…", ok: true });
    try {
      // 1. Vérifier le statut en base
      const statusData = await connectApi("status");

      if (statusData.accountId) {
        // Cas normal : account_id trouvé en base
        setConnectInfo({ accountId: statusData.accountId, onboarded: statusData.onboarded });
        if (statusData.onboarded) {
          setConnectMsg({ text: "✅ Compte Stripe connecté et actif ! Vos clients peuvent payer en ligne.", ok: true });
        } else {
          setConnectMsg({ text: "⏳ Onboarding en cours. Terminez les étapes sur Stripe puis revenez ici.", ok: false });
        }
        onStripeConnectStatusCleared?.();
        return;
      }

      // 2. account_id absent en base → tenter la récupération depuis Stripe
      console.warn("[connect] account_id absent, tentative de récupération…");
      setConnectMsg({ text: "🔄 Récupération du compte depuis Stripe…", ok: true });
      const recoverData = await connectApi("recover");

      if (recoverData.recovered && recoverData.accountId) {
        setConnectInfo({ accountId: recoverData.accountId, onboarded: recoverData.onboarded || false });
        setConnectMsg({
          text: recoverData.onboarded
            ? "✅ Compte Stripe récupéré et actif !"
            : "✅ Compte Stripe récupéré. Terminez l'onboarding si nécessaire.",
          ok: true,
        });
      } else {
        setConnectMsg({ text: "⚠️ Compte introuvable. Cliquez sur 'Connecter mon compte Stripe' pour recommencer.", ok: false });
      }
      onStripeConnectStatusCleared?.();
    } catch {
      setConnectMsg({ text: "❌ Erreur de vérification. Rafraîchissez la page.", ok: false });
    }
  };

  const connectApi = async (action, extra = {}) => {
    const res = await fetch("/api/stripe-connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId: user.id, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur inconnue");
    return data;
  };

  const rafraichirConnectStatus = async () => {
    try {
      const data = await connectApi("status");
      setConnectInfo({ accountId: data.accountId, onboarded: data.onboarded });
      if (data.onboarded) {
        setConnectMsg({ text: "✅ Compte Stripe connecté et actif ! Vos clients peuvent maintenant payer en ligne.", ok: true });
        onStripeConnectStatusCleared?.();
      } else if (data.accountId) {
        setConnectMsg({ text: "⏳ Onboarding non terminé. Cliquez sur 'Reprendre l'onboarding'.", ok: false });
      } else {
        // accountId null → la sauvegarde a échoué lors de l'onboarding précédent
        // Relancer l'onboarding (crée le compte et tente la sauvegarde à nouveau)
        setConnectMsg({ text: "⚠️ Identifiant Stripe non trouvé en base. Cliquez sur 'Connecter' pour réessayer.", ok: false });
      }
    } catch { /* silencieux */ }
  };

  const demarrerOnboarding = async () => {
    setConnectLoading(true);
    setConnectMsg({ text: "", ok: true });
    try {
      const data = await connectApi("onboard");
      setConnectInfo(prev => ({ ...prev, accountId: data.accountId }));
      window.location.href = data.onboardingUrl;
    } catch (err) {
      setConnectMsg({ text: "❌ " + err.message, ok: false });
      setConnectLoading(false);
    }
  };

  const deconnecterStripe = async () => {
    if (!window.confirm("Déconnecter votre compte Stripe ? Les liens de paiement générés resteront actifs, mais vous ne pourrez plus en créer de nouveaux.")) return;
    try {
      await connectApi("disconnect");
      setConnectInfo({ accountId: null, onboarded: false });
      setConnectMsg({ text: "Compte Stripe déconnecté.", ok: true });
    } catch (err) {
      setConnectMsg({ text: "❌ " + err.message, ok: false });
    }
  };

  // ── Stripe : Checkout ────────────────────────────────
  const passerAuPro = async () => {
    setStripeLoading(true);
    setStripeMsg("");
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setStripeMsg("❌ " + (data.error || "Erreur inconnue"));
      }
    } catch (e) {
      setStripeMsg("❌ Impossible de joindre Stripe : " + e.message);
    }
    setStripeLoading(false);
  };

  // ── Stripe : Portail client (gérer / annuler) ────────
  const gererAbonnement = async () => {
    setStripeLoading(true);
    setStripeMsg("");
    try {
      const res = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setStripeMsg("❌ " + (data.error || "Erreur inconnue"));
      }
    } catch (e) {
      setStripeMsg("❌ " + e.message);
    }
    setStripeLoading(false);
  };

  // ────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#8899aa" }}>
      <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚙️</div>
      Chargement des paramètres…
    </div>
  );

  /* ── Helper accordéon ────────────────────────────────────────── */
  const faqItem = (id, question, answer) => {
    const isOpen = aideOpenId === id;
    return (
      <div
        key={id}
        style={{ borderBottom: "1px solid rgba(255,140,0,0.1)", cursor: "pointer" }}
        onClick={() => setAideOpenId(isOpen ? null : id)}
      >
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 0", gap: "12px",
          color: isOpen ? PRIMARY : "white",
          fontWeight: "600", fontSize: "14px",
        }}>
          <span style={{ flex: 1 }}>{question}</span>
          <span style={{
            fontSize: "18px", color: PRIMARY, flexShrink: 0,
            display: "inline-block",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}>▾</span>
        </div>
        {isOpen && (
          <div style={{ color: "#aabbcc", fontSize: "13px", lineHeight: "1.7", paddingBottom: "14px" }}>
            {answer}
          </div>
        )}
      </div>
    );
  };

  /* ── Contenu de la section active ─────────────────────────────── */
  const sectionContent = (
    <div style={{ flex: 1, minWidth: 0 }}>

      {/* ══════════════════════════════════════════════════
          MON PROFIL
      ══════════════════════════════════════════════════ */}
      {activeSection === "profil" && (
        <div>
          <SCard titre="👤 Informations de l'entreprise">

            {/* Logo */}
            <div style={{ marginBottom: "18px" }}>
              <label style={lbl}>🖼️ Logo entreprise — affiché sur les PDF</label>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                {profil.logo_url ? (
                  <div style={{ position: "relative" }}>
                    <img src={profil.logo_url} alt="logo" style={{ height: "64px", maxWidth: "180px", objectFit: "contain", borderRadius: "8px", background: "white", padding: "6px" }} />
                    <button
                      onClick={() => setProfil(prev => ({ ...prev, logo_url: "" }))}
                      style={{ position: "absolute", top: "-7px", right: "-7px", background: "#ff4444", border: "none", color: "white", borderRadius: "50%", width: "22px", height: "22px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}
                    >✕</button>
                  </div>
                ) : (
                  <div style={{ width: "90px", height: "64px", borderRadius: "8px", border: "2px dashed rgba(255,140,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontSize: "28px" }}>🏢</div>
                )}
                <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,140,0,0.12)", border: "1px solid rgba(255,140,0,0.3)", color: PRIMARY, borderRadius: "8px", padding: "9px 16px", fontSize: "13px", fontWeight: "700", cursor: logoUploading ? "wait" : "pointer" }}>
                  {logoUploading ? "⏳ Upload…" : "📁 Choisir un logo"}
                  <input type="file" accept="image/*" hidden disabled={logoUploading} onChange={e => { if (e.target.files[0]) uploadLogo(e.target.files[0]); e.target.value = ""; }} />
                </label>
              </div>
              <div style={{ color: "#555", fontSize: "11px", marginTop: "6px" }}>PNG, JPG ou SVG. Fond blanc recommandé.</div>
            </div>

            {/* Champs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { key: "nom",       label: "🏢 Nom / Raison sociale",         placeholder: "Jean Dupont Couverture"               },
                { key: "siret",     label: "🔢 N° SIRET",                      placeholder: "123 456 789 00012"                    },
                { key: "adresse",   label: "📍 Adresse complète",              placeholder: "12 rue des Tilleuls, 44000 Nantes"    },
                { key: "telephone", label: "📞 Téléphone",                     placeholder: "06 12 34 56 78"                       },
                { key: "iban",      label: "🏦 IBAN (affiché sur les PDF)",    placeholder: "FR76 1234 5678 9012 3456 7890 123"    },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={lbl}>{label}</label>
                  <input
                    placeholder={placeholder}
                    value={profil[key]}
                    onChange={e => setProfil(prev => ({ ...prev, [key]: e.target.value }))}
                    style={inp}
                  />
                </div>
              ))}
            </div>

            {msgProfil && <div style={{ marginTop: "12px", fontSize: "13px", fontWeight: "600", color: msgProfil.includes("✅") ? "#4CAF50" : "#ff6b6b" }}>{msgProfil}</div>}
            <SaveBtn onClick={sauvegarderProfil} saving={savingProfil} label="Sauvegarder le profil" />
          </SCard>

          <SCard titre={t("settings.account")}>
            <label style={lbl}>{t("settings.emailAddress")}</label>
            <div style={{ ...inp, color: "#8899aa", cursor: "not-allowed", userSelect: "none" }}>{user.email}</div>
            <div style={{ color: "#555", fontSize: "11px", marginTop: "6px" }}>{t("settings.emailChangeContact")}</div>
          </SCard>

          <SCard titre={t("settings.preferences")}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }}>
                {/* Langue */}
                <div>
                  <label style={lbl}>{t("settings.language")}</label>
                  <select
                    value={params.langue}
                    onChange={e => setParams(p => ({ ...p, langue: e.target.value }))}
                    style={{ ...inp, cursor: "pointer" }}
                  >
                    <option value="fr">🇫🇷 Français</option>
                    <option value="en">🇬🇧 English</option>
                  </select>
                </div>
                {/* Devise */}
                <div>
                  <label style={lbl}>{t("settings.currency")}</label>
                  <select
                    value={params.devise}
                    onChange={e => setParams(p => ({ ...p, devise: e.target.value }))}
                    style={{ ...inp, cursor: "pointer" }}
                  >
                    <option value="€">€ — Euro</option>
                    <option value="CHF">CHF — {lang === "en" ? "Swiss Franc" : "Franc suisse"}</option>
                    <option value="$">$ — {lang === "en" ? "US Dollar" : "Dollar"}</option>
                    <option value="£">£ — {lang === "en" ? "British Pound" : "Livre sterling"}</option>
                  </select>
                </div>
              </div>

              {/* Signature email */}
              <div>
                <label style={lbl}>{t("settings.emailSignature")}</label>
                <textarea
                  value={params.signature_email}
                  onChange={e => setParams(p => ({ ...p, signature_email: e.target.value }))}
                  rows={3}
                  placeholder={lang === "en" ? "Best regards,\nJohn Smith — Artisan+\nTel. +44 000 000 000" : "Cordialement,\nJohn Nette — Artisan+\nTél. 06 00 00 00 00"}
                  style={{ ...inp, resize: "vertical", fontFamily: "inherit", lineHeight: "1.55" }}
                />
                <div style={{ color: "#555", fontSize: "11px", marginTop: "5px" }}>
                  {t("settings.emailSignatureHelp")}
                </div>
              </div>
            </div>

            {msgParams && <div style={{ marginTop: "12px", fontSize: "13px", fontWeight: "600", color: msgParams.includes("✅") ? "#4CAF50" : "#ff6b6b" }}>{msgParams}</div>}
            <SaveBtn onClick={sauvegarderParams} saving={savingParams} label={t("settings.savePreferences")} />
          </SCard>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MINI SITE WEB
      ══════════════════════════════════════════════════ */}
      {activeSection === "minisite" && (
        <div>
          {!isPro ? (
            <ProGate
              featureKey="minisite"
              mode="card"
              onUpgrade={() => setActiveSection("abonnement")}
              onDismiss={null}
            />
          ) : (
          <SCard titre="🌐 Mon mini site web Artisan+">
            <p style={{ color: "#8899aa", fontSize: "13px", lineHeight: "1.6", margin: "0 0 18px" }}>
              Activez votre page publique professionnelle accessible sur <strong style={{ color: PRIMARY }}>artisan-plus.fr/site/votre-lien</strong>.
              Vos clients peuvent vous contacter et demander un devis directement.
            </p>

            {/* Activer / désactiver */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", padding: "14px 16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
              <div>
                <div style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>Activer mon mini site</div>
                <div style={{ color: "#8899aa", fontSize: "12px" }}>Votre page sera accessible publiquement</div>
              </div>
              <button onClick={() => setMiniSite(p => ({ ...p, actif: !p.actif }))} style={{
                width: "48px", height: "28px", borderRadius: "14px", border: "none", cursor: "pointer",
                background: miniSite.actif ? PRIMARY : "rgba(255,255,255,0.15)", transition: "background 0.2s",
                position: "relative",
              }}>
                <div style={{ position: "absolute", top: "4px", left: miniSite.actif ? "24px" : "4px", width: "20px", height: "20px", background: "white", borderRadius: "50%", transition: "left 0.2s" }} />
              </button>
            </div>

            {/* Lien personnalisé */}
            <div style={{ marginBottom: "14px" }}>
              <label style={lbl}>Votre lien personnalisé</label>
              <div style={{ display: "flex", alignItems: "center", gap: "0", background: DARK, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", overflow: "hidden" }}>
                <span style={{ color: "#556677", fontSize: "12px", padding: "12px 12px", whiteSpace: "nowrap", borderRight: "1px solid rgba(255,255,255,0.06)" }}>/site/</span>
                <input value={miniSite.slug} onChange={e => setMiniSite(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") }))}
                  placeholder="jean-dupont-plombier" style={{ flex: 1, background: "transparent", border: "none", padding: "12px 14px", color: "white", fontSize: "14px", outline: "none" }} />
              </div>
              {!miniSite.slug && profil.nom && (
                <button onClick={() => setMiniSite(p => ({ ...p, slug: profil.nom.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") }))}
                  style={{ background: "none", border: "none", color: PRIMARY, fontSize: "12px", cursor: "pointer", padding: "4px 0", textDecoration: "underline" }}>
                  ✨ Générer depuis mon nom
                </button>
              )}
            </div>

            {/* Métier */}
            <div style={{ marginBottom: "14px" }}>
              <label style={lbl}>Métier affiché sur la page</label>
              <input value={miniSite.metier} onChange={e => setMiniSite(p => ({ ...p, metier: e.target.value }))}
                placeholder="ex : Plombier-chauffagiste, Électricien, Maçon…" style={inp} />
            </div>

            {/* Zone */}
            <div style={{ marginBottom: "14px" }}>
              <label style={lbl}>Zone d'intervention</label>
              <input value={miniSite.zone} onChange={e => setMiniSite(p => ({ ...p, zone: e.target.value }))}
                placeholder="ex : Lyon et alentours, Île-de-France…" style={inp} />
            </div>

            {/* Description */}
            <div style={{ marginBottom: "18px" }}>
              <label style={lbl}>Description professionnelle</label>
              <textarea value={miniSite.description} onChange={e => setMiniSite(p => ({ ...p, description: e.target.value }))}
                rows={4} placeholder="Artisan qualifié avec X ans d'expérience, spécialisé dans… Décrivez vos services, votre approche et ce qui vous différencie."
                style={{ ...inp, resize: "vertical", fontFamily: "inherit" }} />
            </div>

            {/* Aperçu du lien */}
            {miniSite.slug && miniSite.actif && (
              <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* Lien actif immédiat */}
                <div style={{ padding: "12px 16px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "10px" }}>
                  <div style={{ color: "#22c55e", fontSize: "10px", fontWeight: "700", marginBottom: "5px" }}>✅ VOTRE LIEN ACTIF — À PARTAGER DÈS MAINTENANT</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <a href={`/site/${miniSite.slug}`} target="_blank" rel="noreferrer"
                      style={{ color: "white", fontSize: "13px", fontWeight: "600", flex: 1, wordBreak: "break-all" }}>
                      artisan-plus.fr/site/{miniSite.slug}
                    </a>
                    <button onClick={() => { navigator.clipboard.writeText(`https://www.artisan-plus.fr/site/${miniSite.slug}`); setMiniSiteMsg({ text: "✅ Lien copié !", ok: true }); setTimeout(() => setMiniSiteMsg({ text: "", ok: true }), 2000); }}
                      style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap", fontWeight: "700" }}>
                      📋 Copier
                    </button>
                  </div>
                </div>
                {/* Sous-domaine futur */}
                <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px" }}>
                  <div style={{ color: "#8899aa", fontSize: "10px", fontWeight: "700", marginBottom: "3px" }}>🔮 SOUS-DOMAINE PERSONNALISÉ — PRÉVU</div>
                  <div style={{ color: "#556677", fontSize: "12px" }}>{miniSite.slug}.artisan-plus.fr</div>
                </div>
              </div>
            )}

            {/* SEO info */}
            <div style={{ marginBottom: "16px", padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "18px" }}>🔍</span>
              <div>
                <div style={{ color: "white", fontSize: "13px", fontWeight: "600", marginBottom: "2px" }}>Optimisé pour Google (SEO)</div>
                <div style={{ color: "#8899aa", fontSize: "12px" }}>Votre page génère automatiquement un titre, une description et les balises meta Open Graph basés sur votre métier et votre zone.</div>
              </div>
            </div>

            {miniSiteMsg.text && (
              <div style={{ color: miniSiteMsg.ok ? "#4CAF50" : "#ff6b6b", fontSize: "13px", marginBottom: "10px" }}>{miniSiteMsg.text}</div>
            )}

            {/* Bouton éditeur visuel */}
            <div style={{ marginBottom: "16px", padding: "16px", background: "rgba(255,140,0,0.06)", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "12px" }}>
              <div style={{ color: "white", fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>🎨 Personnalisation avancée</div>
              <div style={{ color: "#8899aa", fontSize: "12px", marginBottom: "12px" }}>Templates, polices, couleurs, galerie, avis clients, avant/après, réseaux sociaux et plus encore.</div>
              <button onClick={() => setEditeurOuvert(true)} style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: PRIMARY, color: "white", border: "none",
                borderRadius: "10px", padding: "11px 20px", cursor: "pointer",
                fontWeight: "700", fontSize: "14px",
              }}>
                🎨 Ouvrir l'éditeur visuel
              </button>
            </div>

            <SaveBtn onClick={async () => {
              setMiniSiteSaving(true); setMiniSiteMsg({ text: "", ok: true });
              if (miniSite.actif && !miniSite.slug.trim()) {
                setMiniSiteMsg({ text: "❌ Entrez un lien personnalisé", ok: false }); setMiniSiteSaving(false); return;
              }
              const { error } = await supabase.from("profils").upsert({
                user_id:              user.id,
                mini_site_actif:      miniSite.actif,
                mini_site_slug:       miniSite.slug.trim() || null,
                metier:               miniSite.metier.trim() || null,
                zone_intervention:    miniSite.zone.trim() || null,
                description_mini_site: miniSite.description.trim() || null,
              }, { onConflict: "user_id" });
              if (error) setMiniSiteMsg({ text: "❌ " + (error.code === "23505" ? "Ce lien est déjà pris, choisissez-en un autre" : error.message), ok: false });
              else setMiniSiteMsg({ text: "✅ Mini site sauvegardé !", ok: true });
              setMiniSiteSaving(false);
            }} saving={miniSiteSaving} label="Sauvegarder le mini site" />
          </SCard>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MON ÉQUIPE
      ══════════════════════════════════════════════════ */}
      {activeSection === "equipe" && (
        <div>
          {!isPro ? (
            <ProGate
              featureKey="equipe"
              mode="card"
              onUpgrade={() => setActiveSection("abonnement")}
              onDismiss={null}
            />
          ) : (<>
          {/* Inviter un membre */}
          <SCard titre="👥 Mon équipe">
            <p style={{ color: "#8899aa", fontSize: "13px", lineHeight: "1.6", marginBottom: "18px" }}>
              Invitez des collaborateurs, associés ou comptables. Chaque membre reçoit un <strong style={{ color: PRIMARY }}>code d'invitation</strong> à entrer lors de sa connexion.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={lbl}>Email du membre à inviter</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  placeholder="collaborateur@example.com" style={inp} />
              </div>
              <div>
                <label style={lbl}>Rôle</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                  {ROLES_EQUIPE.map(r => (
                    <option key={r.id} value={r.id}>{r.label} — {r.desc}</option>
                  ))}
                </select>
              </div>

              {/* Description du rôle sélectionné */}
              {(() => {
                const r = ROLES_EQUIPE.find(x => x.id === inviteRole);
                const icons = { associe: "🤝", collaborateur: "🔨", comptable: "📊" };
                const tabs  = { associe: "Tout sauf paiement", collaborateur: "Accueil + Chantiers", comptable: "Accueil + Factures" };
                return (
                  <div style={{ background: "rgba(255,140,0,0.06)", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "12px 14px", fontSize: "13px" }}>
                    <span style={{ fontSize: "18px", marginRight: "8px" }}>{icons[inviteRole]}</span>
                    <span style={{ color: "white", fontWeight: "600" }}>{r?.label}</span>
                    <span style={{ color: "#8899aa" }}> — </span>
                    <span style={{ color: "#8899aa" }}>Accès : <span style={{ color: PRIMARY }}>{tabs[inviteRole]}</span></span>
                  </div>
                );
              })()}
            </div>

            {inviteMsg.text && (
              <div style={{ color: inviteMsg.ok ? "#4CAF50" : "#ff6b6b", fontSize: "13px", marginBottom: "12px", fontWeight: "600" }}>
                {inviteMsg.text}
              </div>
            )}

            <button onClick={inviterMembre} disabled={inviteSending} style={{
              background: inviteSending ? "#555" : PRIMARY, color: "white", border: "none",
              borderRadius: "10px", padding: "12px 20px", fontSize: "14px",
              fontWeight: "700", cursor: inviteSending ? "not-allowed" : "pointer",
            }}>
              {inviteSending ? "⏳ Création…" : "📨 Créer l'invitation"}
            </button>
          </SCard>

          {/* Liste des membres */}
          {membres.length > 0 && (
            <SCard titre={`Membres (${membres.length})`}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {membres.map(m => {
                  const roleInfo = ROLES_EQUIPE.find(r => r.id === m.role);
                  const statutColor = m.statut === "actif" ? "#4CAF50" : m.statut === "invite" ? PRIMARY : "#ff6b6b";
                  const statutLabel = m.statut === "actif" ? "✅ Actif" : m.statut === "invite" ? "⏳ En attente" : "❌ Révoqué";
                  return (
                    <div key={m.id} style={{ background: DARK, borderRadius: "12px", padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>{m.email_invite}</div>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px", flexWrap: "wrap" }}>
                            <span style={{ color: PRIMARY, fontSize: "12px", fontWeight: "600" }}>{roleInfo?.label || m.role}</span>
                            <span style={{ color: "#556677", fontSize: "12px" }}>·</span>
                            <span style={{ color: statutColor, fontSize: "12px", fontWeight: "600" }}>{statutLabel}</span>
                          </div>
                          {m.statut === "invite" && (
                            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "8px", padding: "6px 10px", fontFamily: "monospace", fontSize: "13px", color: PRIMARY, letterSpacing: "1px" }}>
                                {m.code_invitation}
                              </div>
                              <button onClick={() => copierCodeInvitation(m)} style={{
                                background: codeCopied === m.id ? "rgba(76,175,80,0.1)" : "rgba(255,140,0,0.1)",
                                border: "1px solid rgba(255,255,255,0.1)", color: codeCopied === m.id ? "#4CAF50" : PRIMARY,
                                borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "12px", fontWeight: "600",
                              }}>
                                {codeCopied === m.id ? "✅ Copié" : "📋 Copier"}
                              </button>
                            </div>
                          )}
                        </div>
                        <button onClick={() => revoquerMembre(m.id)} style={{
                          background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.2)",
                          color: "#ff6b6b", borderRadius: "8px", padding: "8px 12px",
                          cursor: "pointer", fontSize: "12px", fontWeight: "600", flexShrink: 0,
                        }}>🗑️ Révoquer</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SCard>
          )}

          {/* Explications des rôles */}
          <SCard titre="📖 Guide des rôles">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { emoji: "👑", role: "Patron", color: PRIMARY, desc: "Accès total à toutes les fonctionnalités", tabs: "Toutes les sections" },
                { emoji: "🤝", role: "Associé", color: "#a855f7", desc: "Comme le patron, sauf paiement & abonnement", tabs: "Tout sauf Paramètres paiement" },
                { emoji: "🔨", role: "Collaborateur", color: "#6495ED", desc: "Pour les ouvriers sur le terrain", tabs: "Accueil + Chantiers (pointage)" },
                { emoji: "📊", role: "Comptable", color: "#4CAF50", desc: "Consultation financière uniquement", tabs: "Accueil + Factures" },
              ].map(r => (
                <div key={r.role} style={{ display: "flex", gap: "12px", padding: "12px", background: DARK, borderRadius: "10px" }}>
                  <div style={{ fontSize: "24px", flexShrink: 0 }}>{r.emoji}</div>
                  <div>
                    <div style={{ color: r.color, fontWeight: "700", fontSize: "14px" }}>{r.role}</div>
                    <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "2px" }}>{r.desc}</div>
                    <div style={{ color: "#556677", fontSize: "11px", marginTop: "4px" }}>Onglets : {r.tabs}</div>
                  </div>
                </div>
              ))}
            </div>
          </SCard>
          </>)}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          VÉRIFICATION ARTISAN
      ══════════════════════════════════════════════════ */}
      {activeSection === "verif" && (
        <div>
          {!isPro ? (
            <ProGate
              featureKey="badge_verifie"
              mode="card"
              onUpgrade={() => setActiveSection("abonnement")}
              onDismiss={null}
            />
          ) : (<>
          {/* ── Statut actuel ─────────────────────────── */}
          <div style={{
            background: verificationStatut === "verifie"
              ? "rgba(76,175,80,0.08)"
              : verificationStatut === "en_attente"
                ? "rgba(255,140,0,0.08)"
                : verificationStatut === "rejete"
                  ? "rgba(255,80,80,0.07)"
                  : "rgba(136,153,170,0.06)",
            border: `1.5px solid ${
              verificationStatut === "verifie"    ? "rgba(76,175,80,0.35)"
              : verificationStatut === "en_attente" ? "rgba(255,140,0,0.35)"
              : verificationStatut === "rejete"    ? "rgba(255,80,80,0.3)"
              : "rgba(136,153,170,0.18)"
            }`,
            borderRadius: "16px", padding: "20px 22px", marginBottom: "20px",
            display: "flex", alignItems: "flex-start", gap: "16px",
          }}>
            <span style={{ fontSize: "32px", flexShrink: 0 }}>
              {verificationStatut === "verifie"     ? "✅"
               : verificationStatut === "en_attente" ? "⏳"
               : verificationStatut === "rejete"     ? "❌"
               : "🔍"}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: "800", fontSize: "16px", marginBottom: "5px",
                color: verificationStatut === "verifie"     ? "#4CAF50"
                     : verificationStatut === "en_attente" ? PRIMARY
                     : verificationStatut === "rejete"     ? "#ff6b6b"
                     : "white",
              }}>
                {verificationStatut === "verifie"     ? "✓ Artisan Vérifié"
                 : verificationStatut === "en_attente" ? "Vérification en cours…"
                 : verificationStatut === "rejete"     ? "Vérification refusée"
                 : "Non vérifié"}
              </div>
              <div style={{ color: "#8899aa", fontSize: "13px", lineHeight: "1.55" }}>
                {verificationStatut === "verifie"
                  ? "Votre badge ✓ Artisan Vérifié est affiché sur votre profil, vos devis et vos factures."
                  : verificationStatut === "en_attente"
                    ? "Votre dossier est en cours d'examen par notre équipe. Réponse sous 24–48h ouvrées."
                    : verificationStatut === "rejete"
                      ? "Votre dossier a été refusé. Vérifiez vos informations et soumettez à nouveau un justificatif valide."
                      : "Soumettez votre SIRET et un justificatif pour obtenir le badge ✓ Artisan Vérifié."}
              </div>
              {verificationStatut === "rejete" && !modeRenvoi && (
                <button
                  onClick={() => setModeRenvoi(true)}
                  style={{
                    marginTop: "12px",
                    background: "rgba(255,107,107,0.12)", border: "1.5px solid rgba(255,107,107,0.4)",
                    color: "#ff6b6b", borderRadius: "10px", padding: "9px 18px",
                    fontSize: "13px", fontWeight: "700", cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: "6px",
                  }}
                >
                  🔄 Renvoyer ma demande
                </button>
              )}
            </div>
          </div>

          {/* ── Badge affiché si vérifié ──────────────── */}
          {verificationStatut === "verifie" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "linear-gradient(135deg, rgba(255,140,0,0.18) 0%, rgba(255,180,50,0.08) 100%)",
                border: "1.5px solid rgba(255,140,0,0.5)",
                borderRadius: "30px", padding: "10px 24px",
                color: PRIMARY, fontWeight: "800", fontSize: "15px",
                boxShadow: "0 4px 20px rgba(255,140,0,0.18)",
              }}>
                ✓ Artisan Vérifié
              </div>
              {!modeRenvoi && (
                <button
                  onClick={() => setModeRenvoi(true)}
                  style={{
                    background: "none", border: "none",
                    color: "#8899aa", fontSize: "12px", cursor: "pointer",
                    textDecoration: "underline", padding: "2px 0",
                  }}
                >
                  Mettre à jour mon justificatif
                </button>
              )}
            </div>
          )}

          {/* ── Formulaire de soumission ──────────────── */}
          {(verificationStatut === "non_soumis" || verificationStatut === "en_attente" || modeRenvoi) && (
            <SCard titre={modeRenvoi ? "🔄 Renvoyer votre dossier" : "📋 Soumettre votre dossier"}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* SIRET (readonly depuis profil) */}
                <div>
                  <label style={lbl}>🔢 Votre SIRET (depuis Mon profil)</label>
                  <div style={{
                    ...inp, cursor: "not-allowed", userSelect: "none",
                    color: profil.siret ? "white" : "#666",
                    opacity: profil.siret ? 1 : 0.7,
                  }}>
                    {profil.siret || "⚠️ SIRET non renseigné — allez dans Mon profil pour l'ajouter"}
                  </div>
                  {!profil.siret && (
                    <div style={{ marginTop: "6px" }}>
                      <button
                        onClick={() => setActiveSection("profil")}
                        style={{
                          background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)",
                          color: PRIMARY, borderRadius: "8px", padding: "7px 14px",
                          fontSize: "12px", fontWeight: "700", cursor: "pointer",
                        }}
                      >
                        → Aller dans Mon profil
                      </button>
                    </div>
                  )}
                </div>

                {/* Upload justificatif */}
                <div>
                  <label style={lbl}>📷 Justificatif — Kbis, carte pro ou attestation URSSAF</label>
                  <label style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    background: "rgba(255,140,0,0.08)", border: "1px solid rgba(255,140,0,0.25)",
                    color: PRIMARY, borderRadius: "10px", padding: "11px 18px",
                    fontSize: "13px", fontWeight: "700",
                    cursor: verifUploading ? "wait" : "pointer",
                    transition: "all 0.15s",
                  }}>
                    {verifUploading ? "⏳ Upload en cours…"
                     : verifDocUrl   ? "✅ Document chargé — cliquer pour remplacer"
                     : "📁 Choisir un fichier"}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      hidden
                      disabled={verifUploading}
                      onChange={e => { if (e.target.files[0]) uploadVerifDoc(e.target.files[0]); e.target.value = ""; }}
                    />
                  </label>
                  {verifDocUrl && !verifUploading && (
                    <div style={{ color: "#4CAF50", fontSize: "12px", marginTop: "6px" }}>
                      ✅ Fichier prêt à l'envoi
                    </div>
                  )}
                  <div style={{ color: "#555", fontSize: "11px", marginTop: "6px" }}>
                    Photo lisible (Kbis, carte pro artisanale ou attestation URSSAF). JPG, PNG ou PDF, max 5 Mo.
                  </div>
                </div>

                {/* Ce que vous obtenez */}
                <div style={{
                  background: "rgba(255,140,0,0.05)", border: "1px solid rgba(255,140,0,0.12)",
                  borderRadius: "12px", padding: "14px 16px",
                }}>
                  <div style={{ color: PRIMARY, fontWeight: "700", fontSize: "13px", marginBottom: "8px" }}>
                    🏅 Avantages du badge Artisan Vérifié :
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {[
                      "Badge ✓ Artisan Vérifié affiché sur votre profil",
                      "Mention visible sur tous vos devis et factures PDF",
                      "Confiance accrue auprès de vos clients",
                    ].map((item, i) => (
                      <div key={i} style={{ color: "#ccd6e0", fontSize: "13px" }}>✅ {item}</div>
                    ))}
                  </div>
                </div>

                {modeRenvoi && verificationStatut === "verifie" && (
                  <div style={{
                    background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.2)",
                    borderRadius: "10px", padding: "10px 14px",
                    color: "#4CAF50", fontSize: "12px", lineHeight: "1.5",
                  }}>
                    ℹ️ Votre badge <strong>✓ Artisan Vérifié</strong> reste actif pendant l'examen du nouveau document.
                  </div>
                )}

                {verifMsg.text && (
                  <div style={{ fontSize: "13px", fontWeight: "600", color: verifMsg.ok ? "#4CAF50" : "#ff6b6b", lineHeight: "1.5" }}>
                    {verifMsg.text}
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    onClick={soumettreDossier}
                    disabled={!profil.siret || !verifDocUrl || verificationStatut === "en_attente"}
                    style={{
                      flex: 1,
                      background: (!profil.siret || !verifDocUrl || verificationStatut === "en_attente") ? "#2a3450" : PRIMARY,
                      color: (!profil.siret || !verifDocUrl || verificationStatut === "en_attente") ? "#555" : "white",
                      border: "none", borderRadius: "12px",
                      padding: "14px 24px", fontSize: "14px", fontWeight: "800",
                      cursor: (!profil.siret || !verifDocUrl || verificationStatut === "en_attente") ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      boxShadow: (!profil.siret || !verifDocUrl || verificationStatut === "en_attente") ? "none" : "0 4px 20px rgba(255,140,0,0.3)",
                      transition: "all 0.2s",
                    }}
                  >
                    {verificationStatut === "en_attente"
                      ? "⏳ Dossier en cours d'examen…"
                      : modeRenvoi
                        ? "🔄 Envoyer ma nouvelle demande"
                        : "🚀 Soumettre pour vérification"}
                  </button>
                  {modeRenvoi && (
                    <button
                      onClick={() => setModeRenvoi(false)}
                      style={{
                        background: "rgba(136,153,170,0.08)", border: "1px solid rgba(136,153,170,0.2)",
                        color: "#8899aa", borderRadius: "12px", padding: "14px 18px",
                        fontSize: "13px", fontWeight: "600", cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            </SCard>
          )}

          {/* ── Comment ça marche ─────────────────────── */}
          <SCard titre="💡 Comment fonctionne la vérification ?">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { step: "1", text: "Renseignez votre SIRET dans Mon profil et téléchargez un justificatif (Kbis, carte pro ou attestation URSSAF)." },
                { step: "2", text: "Notre équipe vérifie votre dossier sous 24–48h ouvrées." },
                { step: "3", text: "Votre badge ✓ Artisan Vérifié apparaît sur votre profil et sur tous vos PDFs." },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{
                    width: "26px", height: "26px", borderRadius: "50%",
                    background: "rgba(255,140,0,0.15)", border: "1.5px solid rgba(255,140,0,0.4)",
                    color: PRIMARY, fontWeight: "900", fontSize: "12px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>{step}</div>
                  <div style={{ color: "#ccd6e0", fontSize: "13px", lineHeight: "1.5", paddingTop: "3px" }}>
                    {text}
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: "14px", background: "rgba(255,140,0,0.05)",
              border: "1px solid rgba(255,140,0,0.12)",
              borderRadius: "10px", padding: "10px 14px",
            }}>
              <div style={{ color: "#8899aa", fontSize: "11px", lineHeight: "1.6" }}>
                ℹ️ La vérification est <strong style={{ color: "white" }}>gratuite</strong> et disponible pour tous les abonnés. Le badge est valable tant que votre SIRET est actif.
              </div>
            </div>
          </SCard>
          </>)}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          APPARENCE
      ══════════════════════════════════════════════════ */}
      {activeSection === "apparence" && (() => {
        // Couleurs effectives (custom ou défaut du thème)
        const themeDefauts = THEMES_COULEURS[params.theme_pdf] || THEMES_COULEURS.moderne;
        const eff = {
          principale:  couleursPdf.principale  || themeDefauts.principale,
          fondEntetes: couleursPdf.fondEntetes || themeDefauts.fondEntetes,
          texte:       couleursPdf.texte       || themeDefauts.texte,
          titres:      couleursPdf.titres      || themeDefauts.titres,
          bordures:    couleursPdf.bordures    || themeDefauts.bordures,
          accent:      couleursPdf.accent      || themeDefauts.accent,
        };
        const setCouleur = (key, val) => setCouleursPdf(prev => ({ ...prev, [key]: val || null }));
        const resetCouleur = (key) => setCouleursPdf(prev => ({ ...prev, [key]: null }));
        const resetAll = () => setCouleursPdf({ principale: null, fondEntetes: null, texte: null, titres: null, bordures: null, accent: null });
        const hasCustom = Object.values(couleursPdf).some(v => v !== null);

        const COULEURS_DEF = [
          { key: "principale",  label: "En-tête & pied de page",    desc: "Fond du header, footer et têtes de colonnes du tableau" },
          { key: "fondEntetes", label: "Fond des tableaux",          desc: "Lignes alternées, boîte client et boîte totaux" },
          { key: "texte",       label: "Texte principal",            desc: "Corps de texte, montants, descriptions" },
          { key: "titres",      label: "Étiquettes & labels",        desc: "\"De:\", \"À:\", dates, libellés secondaires" },
          { key: "bordures",    label: "Bordures & séparateurs",     desc: "Lignes de séparation, encadré de signature" },
          { key: "accent",      label: "Montant total & accent",     desc: "Texte Total TTC, bande décorative sous l'en-tête" },
        ];

        return (
        <SCard titre="🎨 Apparence des PDF">
          {!isPro ? (
            <ProGate featureKey="theme_pdf" mode="card" onUpgrade={() => setActiveSection("abonnement")} onDismiss={null} />
          ) : (<>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Thème de base */}
            <div>
              <label style={{ ...lbl, marginBottom: "10px" }}>Thème PDF de base</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {THEMES_PDF.map(t => (
                  <label key={t.id} style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    background: params.theme_pdf === t.id ? "rgba(255,140,0,0.08)" : "rgba(255,255,255,0.02)",
                    border: `1.5px solid ${params.theme_pdf === t.id ? PRIMARY : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "12px", padding: "13px 16px", cursor: "pointer", transition: "all 0.15s",
                  }}>
                    <input type="radio" name="theme" value={t.id} checked={params.theme_pdf === t.id}
                      onChange={() => setParams(prev => ({ ...prev, theme_pdf: t.id }))}
                      style={{ accentColor: PRIMARY, width: "16px", height: "16px" }} />
                    <span style={{ fontSize: "22px" }}>{t.emoji}</span>
                    <div>
                      <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>{t.label}</div>
                      <div style={{ color: "#8899aa", fontSize: "12px" }}>{t.desc}</div>
                    </div>
                    {params.theme_pdf === t.id && (
                      <span style={{ marginLeft: "auto", background: "rgba(255,140,0,0.15)", color: PRIMARY, fontSize: "11px", fontWeight: "700", borderRadius: "5px", padding: "3px 8px" }}>Actif</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* 6 color pickers */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <label style={{ ...lbl, marginBottom: 0 }}>🎨 Couleurs personnalisées</label>
                {hasCustom && (
                  <button onClick={resetAll} style={{
                    background: "none", border: "1px solid rgba(136,153,170,0.25)",
                    color: "#8899aa", borderRadius: "8px", padding: "4px 10px",
                    fontSize: "11px", cursor: "pointer", fontWeight: "600",
                  }}>↺ Réinitialiser tout</button>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {COULEURS_DEF.map(({ key, label, desc }) => {
                  const valEff = eff[key];
                  const isCustom = couleursPdf[key] !== null;
                  return (
                    <div key={key} style={{
                      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "12px", padding: "12px 14px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        {/* Color picker */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <div style={{
                            width: "44px", height: "44px", borderRadius: "10px",
                            background: valEff, border: "2px solid rgba(255,255,255,0.15)",
                            cursor: "pointer", overflow: "hidden",
                          }}>
                            <input
                              type="color"
                              value={valEff}
                              onChange={e => setCouleur(key, e.target.value)}
                              style={{ opacity: 0, position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer" }}
                            />
                          </div>
                        </div>
                        {/* Hex input */}
                        <input
                          value={couleursPdf[key] || ""}
                          onChange={e => {
                            const v = e.target.value;
                            setCouleur(key, /^#[0-9A-Fa-f]{6}$/.test(v) ? v : (v === "" ? null : v));
                          }}
                          placeholder={themeDefauts[key]}
                          style={{ ...inp, width: "120px", fontFamily: "monospace", fontSize: "13px" }}
                        />
                        {/* Labels */}
                        <div style={{ flex: 1, minWidth: "120px" }}>
                          <div style={{ color: "white", fontWeight: "700", fontSize: "13px" }}>{label}</div>
                          <div style={{ color: "#667", fontSize: "11px", marginTop: "2px" }}>{desc}</div>
                        </div>
                        {/* Reset button */}
                        {isCustom && (
                          <button onClick={() => resetCouleur(key)} style={{
                            background: "none", border: "1px solid rgba(136,153,170,0.2)",
                            color: "#8899aa", borderRadius: "7px", padding: "4px 9px",
                            fontSize: "11px", cursor: "pointer", flexShrink: 0,
                          }}>↺</button>
                        )}
                        {/* Custom badge */}
                        {isCustom && (
                          <span style={{ background: "rgba(255,140,0,0.12)", color: PRIMARY, fontSize: "10px", fontWeight: "700", borderRadius: "5px", padding: "2px 7px", flexShrink: 0 }}>Modifié</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mini-prévisualisation PDF */}
            <div>
              <label style={{ ...lbl, marginBottom: "10px" }}>👁️ Prévisualisation en temps réel</label>
              <div style={{
                borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)",
                background: "white", maxWidth: "360px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
              }}>
                {/* Header */}
                <div style={{ background: eff.principale, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ color: "white", fontWeight: "800", fontSize: "11px" }}>Mon Entreprise</div>
                    <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "8px", marginTop: "1px" }}>123 rue des Artisans</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "white", fontSize: "9px" }}>DEV-2024-001</div>
                    <div style={{ color: "white", fontWeight: "800", fontSize: "11px" }}>DEVIS</div>
                  </div>
                </div>
                {/* Bande accent */}
                <div style={{ height: "3px", background: eff.accent }} />
                {/* Infos client */}
                <div style={{ padding: "8px 14px", background: "white", display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: eff.titres, fontSize: "7px", fontWeight: "700", marginBottom: "2px" }}>DE :</div>
                    <div style={{ color: eff.texte, fontSize: "9px", fontWeight: "700" }}>Nom Artisan</div>
                  </div>
                  <div style={{ flex: 1, background: eff.fondEntetes, borderRadius: "4px", padding: "5px 7px" }}>
                    <div style={{ color: eff.titres, fontSize: "7px", fontWeight: "700", marginBottom: "2px" }}>À :</div>
                    <div style={{ color: eff.texte, fontSize: "9px", fontWeight: "700" }}>Client Exemple</div>
                  </div>
                </div>
                {/* Ligne séparatrice */}
                <div style={{ height: "1.5px", background: eff.bordures, margin: "0 14px" }} />
                {/* Tableau */}
                <div style={{ padding: "6px 14px 0" }}>
                  <div style={{ display: "flex", background: eff.principale, borderRadius: "3px", padding: "4px 6px", marginBottom: "2px" }}>
                    {["Description", "Qté", "PU HT", "Total"].map((h, i) => (
                      <div key={i} style={{ flex: i === 0 ? 2 : 1, color: "white", fontSize: "7px", fontWeight: "700", textAlign: i > 0 ? "right" : "left" }}>{h}</div>
                    ))}
                  </div>
                  {[["Prestation 1", "1", "250,00 €", "250,00 €"], ["Prestation 2", "2", "80,00 €", "160,00 €"]].map((row, ri) => (
                    <div key={ri} style={{ display: "flex", padding: "3px 6px", background: ri % 2 === 1 ? eff.fondEntetes : "transparent", borderRadius: "2px" }}>
                      {row.map((cell, ci) => (
                        <div key={ci} style={{ flex: ci === 0 ? 2 : 1, color: eff.texte, fontSize: "7px", textAlign: ci > 0 ? "right" : "left" }}>{cell}</div>
                      ))}
                    </div>
                  ))}
                  {/* Séparateur total */}
                  <div style={{ height: "1px", background: eff.bordures, margin: "4px 0 2px" }} />
                  <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: "6px" }}>
                    <div style={{ color: eff.accent, fontWeight: "800", fontSize: "10px" }}>TOTAL : 410,00 €</div>
                  </div>
                </div>
                {/* Footer */}
                <div style={{ background: eff.principale, padding: "5px 14px", textAlign: "center" }}>
                  <div style={{ color: "rgba(200,200,200,0.8)", fontSize: "7px" }}>artisan-plus.fr</div>
                </div>
              </div>
            </div>

          </div>

          {msgParams && <div style={{ marginTop: "12px", fontSize: "13px", fontWeight: "600", color: msgParams.includes("✅") ? "#4CAF50" : "#ff6b6b" }}>{msgParams}</div>}
          <SaveBtn onClick={sauvegarderParams} saving={savingParams} label="Sauvegarder l'apparence" />
          </>)}
        </SCard>
        );
      })()}

      {/* ══════════════════════════════════════════════════
          FACTURATION
      ══════════════════════════════════════════════════ */}
      {activeSection === "factures" && (
        <SCard titre="📄 Paramètres de facturation">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            <div>
              <label style={lbl}>🔢 Format de numérotation automatique</label>
              <input value={params.format_numerotation}
                onChange={e => setParams(prev => ({ ...prev, format_numerotation: e.target.value }))}
                style={inp} placeholder="FAC-{YYYY}-{NNN}" />
              <div style={{ color: "#555", fontSize: "11px", marginTop: "5px" }}>
                Variables : <code style={{ color: "#8899aa" }}>{"{YYYY}"}</code> année · <code style={{ color: "#8899aa" }}>{"{MM}"}</code> mois · <code style={{ color: "#8899aa" }}>{"{NNN}"}</code> n° séquentiel
              </div>
            </div>

            <div>
              <label style={lbl}>💰 Taux TVA par défaut (%)</label>
              <input type="number" min="0" max="100"
                value={params.tva_defaut}
                onChange={e => setParams(prev => ({ ...prev, tva_defaut: e.target.value }))}
                style={{ ...inp, maxWidth: "120px" }} placeholder="20" />
            </div>

            <div>
              <label style={lbl}>📋 Conditions de paiement par défaut</label>
              <input value={params.conditions_paiement}
                onChange={e => setParams(prev => ({ ...prev, conditions_paiement: e.target.value }))}
                style={inp} placeholder="Paiement sous 30 jours" />
            </div>

            <div>
              <label style={lbl}>⚠️ Pénalités de retard par défaut</label>
              <input value={params.penalites_retard}
                onChange={e => setParams(prev => ({ ...prev, penalites_retard: e.target.value }))}
                style={inp} placeholder="1,5% par mois conformément à la loi" />
            </div>

            <div>
              <label style={lbl}>📝 Mention légale personnalisée (pied de page des PDF)</label>
              <textarea
                value={params.mention_legale}
                onChange={e => setParams(prev => ({ ...prev, mention_legale: e.target.value }))}
                rows={3}
                placeholder={"TVA non applicable, art. 293 B du CGI\nMicro-entrepreneur — SIRET : …"}
                style={{ ...inp, resize: "vertical", fontFamily: "inherit", lineHeight: "1.55" }}
              />
            </div>

            {/* ── Séparateur mentions optionnelles ── */}
            <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid rgba(255,140,0,0.1)", paddingBottom: "8px", marginTop: "6px" }}>
              Mentions optionnelles — activez pour afficher sur les PDF
            </div>

            {/* Assurance décennale */}
            <div>
              <label style={{
                display: "flex", alignItems: "flex-start", gap: "14px", cursor: "pointer",
                background: params.afficher_assurance ? "rgba(255,140,0,0.07)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${params.afficher_assurance ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: "12px", padding: "13px 16px", transition: "all 0.15s",
                marginBottom: params.afficher_assurance ? "8px" : "0",
              }}>
                <input type="checkbox" checked={params.afficher_assurance}
                  onChange={e => setParams(p => ({ ...p, afficher_assurance: e.target.checked }))}
                  style={{ accentColor: PRIMARY, width: "18px", height: "18px", flexShrink: 0, marginTop: "2px", cursor: "pointer" }} />
                <div>
                  <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>🛡️ Numéro d'assurance décennale</div>
                  <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "2px" }}>Afficher sur les devis et factures si activé</div>
                </div>
              </label>
              {params.afficher_assurance && (
                <input value={params.numero_assurance}
                  onChange={e => setParams(p => ({ ...p, numero_assurance: e.target.value }))}
                  style={inp} placeholder="N° Police : 123456789 — Assureur XYZ" />
              )}
            </div>

            {/* RCS / Registre des Métiers */}
            <div>
              <label style={{
                display: "flex", alignItems: "flex-start", gap: "14px", cursor: "pointer",
                background: params.afficher_rcs ? "rgba(255,140,0,0.07)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${params.afficher_rcs ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: "12px", padding: "13px 16px", transition: "all 0.15s",
                marginBottom: params.afficher_rcs ? "8px" : "0",
              }}>
                <input type="checkbox" checked={params.afficher_rcs}
                  onChange={e => setParams(p => ({ ...p, afficher_rcs: e.target.checked }))}
                  style={{ accentColor: PRIMARY, width: "18px", height: "18px", flexShrink: 0, marginTop: "2px", cursor: "pointer" }} />
                <div>
                  <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>🏛️ Numéro RCS ou Registre des Métiers</div>
                  <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "2px" }}>Afficher sur les devis et factures si activé</div>
                </div>
              </label>
              {params.afficher_rcs && (
                <input value={params.numero_rcs}
                  onChange={e => setParams(p => ({ ...p, numero_rcs: e.target.value }))}
                  style={inp} placeholder="RCS Nantes 123 456 789 — ou RM 44 B 12345" />
              )}
            </div>

            {/* TVA intracommunautaire */}
            <div>
              <label style={{
                display: "flex", alignItems: "flex-start", gap: "14px", cursor: "pointer",
                background: params.afficher_tva_intra ? "rgba(255,140,0,0.07)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${params.afficher_tva_intra ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: "12px", padding: "13px 16px", transition: "all 0.15s",
                marginBottom: params.afficher_tva_intra ? "8px" : "0",
              }}>
                <input type="checkbox" checked={params.afficher_tva_intra}
                  onChange={e => setParams(p => ({ ...p, afficher_tva_intra: e.target.checked }))}
                  style={{ accentColor: PRIMARY, width: "18px", height: "18px", flexShrink: 0, marginTop: "2px", cursor: "pointer" }} />
                <div>
                  <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>🇪🇺 Numéro TVA intracommunautaire</div>
                  <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "2px" }}>Afficher sur les devis et factures si activé</div>
                </div>
              </label>
              {params.afficher_tva_intra && (
                <input value={params.numero_tva_intra}
                  onChange={e => setParams(p => ({ ...p, numero_tva_intra: e.target.value }))}
                  style={inp} placeholder="FR 12 345678901" />
              )}
            </div>

            {/* Mention auto-entrepreneur */}
            <label style={{
              display: "flex", alignItems: "flex-start", gap: "14px", cursor: "pointer",
              background: params.mention_auto_entrepreneur ? "rgba(255,140,0,0.07)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${params.mention_auto_entrepreneur ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: "12px", padding: "13px 16px", transition: "all 0.15s",
            }}>
              <input type="checkbox" checked={params.mention_auto_entrepreneur}
                onChange={e => setParams(p => ({ ...p, mention_auto_entrepreneur: e.target.checked }))}
                style={{ accentColor: PRIMARY, width: "18px", height: "18px", flexShrink: 0, marginTop: "2px", cursor: "pointer" }} />
              <div>
                <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>🧑‍💼 Mention auto-entrepreneur sur les PDF</div>
                <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "2px" }}>Affiche « Auto-entrepreneur » sur les devis et factures si activé</div>
              </div>
            </label>

            {/* Indemnité forfaitaire de recouvrement */}
            <label style={{
              display: "flex", alignItems: "flex-start", gap: "14px", cursor: "pointer",
              background: params.indemnite_recouvrement ? "rgba(255,140,0,0.07)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${params.indemnite_recouvrement ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: "12px", padding: "13px 16px", transition: "all 0.15s",
            }}>
              <input type="checkbox" checked={params.indemnite_recouvrement}
                onChange={e => setParams(p => ({ ...p, indemnite_recouvrement: e.target.checked }))}
                style={{ accentColor: PRIMARY, width: "18px", height: "18px", flexShrink: 0, marginTop: "2px", cursor: "pointer" }} />
              <div>
                <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>⚖️ Indemnité forfaitaire de recouvrement 40 €</div>
                <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "2px" }}>Ajoute la mention légale obligatoire (art. D.441-5 C.com.) sur les factures si activé</div>
              </div>
            </label>

            {/* TVA sur les débits */}
            <label style={{
              display: "flex", alignItems: "flex-start", gap: "14px", cursor: "pointer",
              background: params.tva_sur_debits ? "rgba(255,140,0,0.07)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${params.tva_sur_debits ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: "12px", padding: "13px 16px", transition: "all 0.15s",
            }}>
              <input type="checkbox" checked={params.tva_sur_debits}
                onChange={e => setParams(p => ({ ...p, tva_sur_debits: e.target.checked }))}
                style={{ accentColor: PRIMARY, width: "18px", height: "18px", flexShrink: 0, marginTop: "2px", cursor: "pointer" }} />
              <div>
                <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>💳 TVA sur les débits</div>
                <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "2px" }}>Ajoute la mention « TVA exigible d'après les débits » sur toutes les nouvelles factures par défaut</div>
              </div>
            </label>

          </div>

          {msgParams && <div style={{ marginTop: "12px", fontSize: "13px", fontWeight: "600", color: msgParams.includes("✅") ? "#4CAF50" : "#ff6b6b" }}>{msgParams}</div>}
          <SaveBtn onClick={sauvegarderParams} saving={savingParams} label="Sauvegarder la facturation" />
        </SCard>
      )}

      {/* ══════════════════════════════════════════════════
          NOTIFICATIONS
      ══════════════════════════════════════════════════ */}
      {activeSection === "notifications" && (
        <SCard titre="🔔 Notifications automatiques">
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "4px" }}>
            {[
              { key: "notif_emails",           label: "📧 Emails automatiques",           desc: "Recevoir une copie des factures et devis lors de leur envoi" },
              { key: "notif_rappels_devis",     label: "📝 Rappels devis non signés",      desc: "Relance automatique 7 jours après l'envoi d'un devis non signé" },
              { key: "notif_rappels_factures",  label: "💸 Rappels factures impayées",     desc: "Alerte à l'échéance et relance à J+7 pour les factures non payées" },
            ].map(({ key, label, desc }) => (
              <label key={key} style={{
                display: "flex", alignItems: "flex-start", gap: "14px",
                background: params[key] ? "rgba(255,140,0,0.07)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${params[key] ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: "12px", padding: "14px 16px", cursor: "pointer", transition: "all 0.15s",
              }}>
                <input type="checkbox" checked={params[key]}
                  onChange={e => setParams(prev => ({ ...prev, [key]: e.target.checked }))}
                  style={{ accentColor: PRIMARY, width: "18px", height: "18px", flexShrink: 0, marginTop: "2px", cursor: "pointer" }} />
                <div>
                  <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>{label}</div>
                  <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "3px", lineHeight: "1.4" }}>{desc}</div>
                </div>
              </label>
            ))}
          </div>
          <div style={{ background: "rgba(255,140,0,0.05)", borderRadius: "10px", padding: "10px 14px", marginTop: "8px", border: "1px solid rgba(255,140,0,0.12)" }}>
            <div style={{ color: "#8899aa", fontSize: "11px", lineHeight: "1.5" }}>
              ℹ️ Les notifications par email nécessitent la configuration d'un service d'envoi (fonctionnalité Pro).
            </div>
          </div>

          {msgParams && <div style={{ marginTop: "12px", fontSize: "13px", fontWeight: "600", color: msgParams.includes("✅") ? "#4CAF50" : "#ff6b6b" }}>{msgParams}</div>}
          <SaveBtn onClick={sauvegarderParams} saving={savingParams} label="Sauvegarder les notifications" />
        </SCard>
      )}

      {/* ══════════════════════════════════════════════════
          PAIEMENTS EN LIGNE (STRIPE CONNECT)
      ══════════════════════════════════════════════════ */}
      {activeSection === "paiements" && (
        <div>
          {/* ── Bannière statut ── */}
          {stripeConnectStatus === "success" && (
            <div style={{ background: "rgba(76,175,80,0.12)", border: "1px solid rgba(76,175,80,0.35)", borderRadius: "14px", padding: "16px 20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "24px" }}>🎉</span>
              <div>
                <div style={{ color: "#4CAF50", fontWeight: "700", fontSize: "15px" }}>Onboarding terminé !</div>
                <div style={{ color: "#8899aa", fontSize: "13px", marginTop: "4px" }}>Votre compte Stripe est maintenant actif. Vos factures peuvent être payées en ligne.</div>
              </div>
            </div>
          )}
          {stripeConnectStatus === "refresh" && (
            <div style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)", borderRadius: "14px", padding: "16px 20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "24px" }}>⚠️</span>
              <div>
                <div style={{ color: PRIMARY, fontWeight: "700", fontSize: "15px" }}>Onboarding expiré</div>
                <div style={{ color: "#8899aa", fontSize: "13px", marginTop: "4px" }}>Le lien a expiré. Cliquez sur "Reprendre l'onboarding" pour en obtenir un nouveau.</div>
              </div>
            </div>
          )}

          {/* ── Explication ── */}
          <SCard titre="💳 Paiement en ligne par carte">
            <p style={{ color: "#8899aa", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px" }}>
              Connectez votre propre compte Stripe pour permettre à vos clients de payer leurs factures en ligne par carte bancaire. Les fonds arrivent directement sur votre compte bancaire. Artisan+ ne prend aucune commission.
            </p>

            {/* Avantages */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              {[
                { icon: "⚡", title: "Paiement immédiat", desc: "Votre client paie en ligne, la facture passe automatiquement en « Payée »" },
                { icon: "🔒", title: "Sécurisé par Stripe", desc: "Plateforme certifiée PCI-DSS, accepte Visa, Mastercard, Apple Pay, Google Pay" },
                { icon: "💶", title: "0% de commission Artisan+", desc: "Seules les frais Stripe s'appliquent (1,5% + 0,25€ pour les cartes européennes)" },
                { icon: "📋", title: "Lien partageable", desc: "Copiez le lien et envoyez-le par SMS, WhatsApp ou email à votre client" },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "20px", flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ color: "white", fontWeight: "600", fontSize: "13px" }}>{title}</div>
                    <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "2px" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Statut du compte */}
            <div style={{ background: DARK, borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "22px" }}>
                    {connectInfo.onboarded ? "✅" : connectInfo.accountId ? "⏳" : "🔗"}
                  </span>
                  <div>
                    <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>
                      {connectInfo.onboarded
                        ? "Compte Stripe actif"
                        : connectInfo.accountId
                          ? "Onboarding en cours…"
                          : "Aucun compte connecté"}
                    </div>
                    <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "2px" }}>
                      {connectInfo.onboarded
                        ? "Vos factures peuvent être payées en ligne ✓"
                        : connectInfo.accountId
                          ? "Finalisez l'onboarding Stripe pour activer les paiements"
                          : "Connectez votre compte Stripe Express pour commencer"}
                    </div>
                  </div>
                </div>
                {connectInfo.onboarded && (
                  <span style={{ background: "rgba(76,175,80,0.15)", color: "#4CAF50", border: "1px solid rgba(76,175,80,0.3)", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap" }}>
                    ACTIF
                  </span>
                )}
              </div>
            </div>

            {/* Message de retour */}
            {connectMsg.text && (
              <div style={{ color: connectMsg.ok ? "#4CAF50" : "#ff6b6b", fontSize: "13px", fontWeight: "600", marginBottom: "16px", padding: "12px 16px", background: connectMsg.ok ? "rgba(76,175,80,0.08)" : "rgba(255,100,100,0.08)", borderRadius: "10px", border: `1px solid ${connectMsg.ok ? "rgba(76,175,80,0.2)" : "rgba(255,100,100,0.2)"}` }}>
                {connectMsg.text}
              </div>
            )}

            {/* Actions */}
            {!connectInfo.accountId && (
              <button
                onClick={demarrerOnboarding}
                disabled={connectLoading}
                style={{
                  background: connectLoading ? "#555" : "linear-gradient(135deg, #635bff 0%, #4f46e5 100%)",
                  color: "white", border: "none", borderRadius: "12px",
                  padding: "14px 20px", fontSize: "15px", fontWeight: "800",
                  cursor: connectLoading ? "not-allowed" : "pointer",
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  boxShadow: connectLoading ? "none" : "0 4px 20px rgba(99,91,255,0.4)",
                }}
              >
                {connectLoading ? (
                  <><span>⏳</span><span>Redirection vers Stripe…</span></>
                ) : (
                  <><span>💳</span><span>Connecter mon compte Stripe</span></>
                )}
              </button>
            )}

            {connectInfo.accountId && !connectInfo.onboarded && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={demarrerOnboarding}
                  disabled={connectLoading}
                  style={{
                    background: connectLoading ? "#555" : "linear-gradient(135deg, #FF8C00 0%, #e67600 100%)",
                    color: "white", border: "none", borderRadius: "12px",
                    padding: "14px 20px", fontSize: "15px", fontWeight: "800",
                    cursor: connectLoading ? "not-allowed" : "pointer",
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                    boxShadow: connectLoading ? "none" : "0 4px 20px rgba(255,140,0,0.35)",
                  }}
                >
                  {connectLoading ? "⏳ Redirection…" : "▶️ Reprendre l'onboarding Stripe"}
                </button>
                <button
                  onClick={deconnecterStripe}
                  style={{ background: "transparent", color: "#8899aa", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "11px", fontSize: "13px", cursor: "pointer" }}
                >
                  🗑️ Annuler et recommencer
                </button>
              </div>
            )}

            {connectInfo.onboarded && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ background: "rgba(99,91,255,0.1)", border: "1px solid rgba(99,91,255,0.25)", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", color: "#a5b4fc" }}>
                  💡 Sur chaque facture non payée, un bouton <strong style={{ color: "white" }}>💳 Lien paiement</strong> apparaît. Copiez-le et envoyez-le à votre client.
                </div>
                <button
                  onClick={deconnecterStripe}
                  style={{ background: "transparent", color: "#8899aa", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "11px", fontSize: "13px", cursor: "pointer", marginTop: "6px" }}
                >
                  🔌 Déconnecter le compte Stripe
                </button>
              </div>
            )}
          </SCard>

          {/* ── Comment ça marche ── */}
          <SCard titre="📖 Comment ça marche">
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { step: "1", title: "Connectez votre compte Stripe", desc: "Stripe Express crée votre compte de paiement en 5 minutes. Vous avez besoin de votre IBAN et d'une pièce d'identité." },
                { step: "2", title: "Générez un lien sur votre facture", desc: "Depuis la liste de vos factures, cliquez sur « 💳 Lien paiement » sur n'importe quelle facture non payée." },
                { step: "3", title: "Envoyez le lien à votre client", desc: "Le lien est copié dans votre presse-papiers. Collez-le dans un SMS, WhatsApp ou email à votre client." },
                { step: "4", title: "Le client paie, vous êtes notifié", desc: "Votre client paie par carte. La facture passe automatiquement en « Payée » et vous recevez les fonds sous 1-2 jours ouvrés." },
              ].map(({ step, title, desc }) => (
                <div key={step} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #635bff 0%, #4f46e5 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "800", fontSize: "14px", flexShrink: 0 }}>
                    {step}
                  </div>
                  <div>
                    <div style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>{title}</div>
                    <div style={{ color: "#8899aa", fontSize: "13px", marginTop: "4px", lineHeight: "1.5" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </SCard>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          ABONNEMENT
      ══════════════════════════════════════════════════ */}
      {activeSection === "abonnement" && (
        <div>
          <SCard titre="💎 Mon abonnement">

            {/* ── Plan actuel ─────────────────────────────── */}
            <div style={{
              background: DARK, borderRadius: "14px", padding: "18px 20px",
              border: planInfo.plan === "pro"
                ? "1.5px solid rgba(255,140,0,0.5)"
                : "1px solid rgba(255,255,255,0.08)",
              marginBottom: "18px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              gap: "12px",
            }}>
              <div>
                <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "5px" }}>Plan actuel</div>
                {planInfo.plan === "pro" ? (
                  <>
                    <div style={{ color: PRIMARY, fontSize: "24px", fontWeight: "900" }}>💎 Pro</div>
                    <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "3px" }}>Accès complet à toutes les fonctions</div>
                  </>
                ) : (
                  <>
                    <div style={{ color: "white", fontSize: "24px", fontWeight: "800" }}>Gratuit</div>
                    <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "3px" }}>3 factures · 3 devis · 2 chantiers</div>
                  </>
                )}
              </div>
              {planInfo.plan === "pro" ? (
                <div style={{ background: "rgba(255,140,0,0.15)", border: "1px solid rgba(255,140,0,0.4)", borderRadius: "10px", padding: "8px 18px" }}>
                  <span style={{ color: PRIMARY, fontWeight: "900", fontSize: "14px", letterSpacing: "1px" }}>PRO ✓</span>
                </div>
              ) : (
                <div style={{ background: "rgba(136,153,170,0.1)", border: "1px solid rgba(136,153,170,0.2)", borderRadius: "10px", padding: "8px 18px" }}>
                  <span style={{ color: "#8899aa", fontWeight: "800", fontSize: "13px" }}>FREE</span>
                </div>
              )}
            </div>

            {/* ── CTA selon plan ───────────────────────────── */}
            {planInfo.plan !== "pro" ? (
              <>
                {/* Offre Pro */}
                <div style={{
                  background: "linear-gradient(135deg, rgba(255,140,0,0.12) 0%, rgba(255,140,0,0.04) 100%)",
                  borderRadius: "16px", padding: "22px",
                  border: "1.5px solid rgba(255,140,0,0.35)", marginBottom: "14px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <div style={{ color: PRIMARY, fontSize: "18px", fontWeight: "800" }}>✨ Plan Pro</div>
                      <div style={{ color: "#8899aa", fontSize: "13px", marginTop: "3px" }}>Tout illimité, fonctions avancées</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "white", fontSize: "28px", fontWeight: "900", lineHeight: 1 }}>7,99 €</div>
                      <div style={{ color: "#8899aa", fontSize: "12px" }}>/mois TTC</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "7px", marginBottom: "18px" }}>
                    {[
                      "✅ Factures & devis illimités",
                      "✅ Chantiers illimités + photos HD",
                      "✅ Logo professionnel sur les PDFs",
                      "✅ Signature électronique des devis",
                      "✅ Notifications intelligentes",
                      "✅ Support prioritaire",
                    ].map((f, i) => (
                      <div key={i} style={{ color: "#ccc", fontSize: "13px" }}>{f}</div>
                    ))}
                  </div>

                  {stripeMsg && (
                    <div style={{ color: "#ff6b6b", fontSize: "13px", marginBottom: "12px", fontWeight: "600" }}>
                      {stripeMsg}
                    </div>
                  )}

                  <button
                    onClick={passerAuPro}
                    disabled={stripeLoading}
                    style={{
                      background: stripeLoading ? "#555" : "linear-gradient(135deg, #FF8C00 0%, #e67600 100%)",
                      color: "white", border: "none",
                      borderRadius: "12px", padding: "15px",
                      fontSize: "15px", fontWeight: "800",
                      cursor: stripeLoading ? "not-allowed" : "pointer",
                      width: "100%",
                      boxShadow: stripeLoading ? "none" : "0 4px 20px rgba(255,140,0,0.35)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    }}
                  >
                    {stripeLoading ? (
                      <><span>⏳</span><span>Redirection vers Stripe…</span></>
                    ) : (
                      <><span>🚀</span><span>Passer au Pro — 7,99 €/mois</span></>
                    )}
                  </button>
                </div>

                <div style={{ color: "#555", fontSize: "12px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <span>🔒 Paiement sécurisé Stripe</span>
                  <span>·</span>
                  <span>Sans engagement</span>
                  <span>·</span>
                  <span>Résiliable à tout moment</span>
                </div>
              </>
            ) : (
              /* ── Déjà Pro : bouton gestion ──────────────── */
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{
                  background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.3)",
                  borderRadius: "12px", padding: "16px 18px",
                  display: "flex", alignItems: "center", gap: "12px",
                }}>
                  <span style={{ fontSize: "24px" }}>✅</span>
                  <div>
                    <div style={{ color: "#4CAF50", fontWeight: "700", fontSize: "14px" }}>Abonnement Pro actif</div>
                    <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "2px" }}>Toutes les fonctions sont disponibles sans limite</div>
                  </div>
                </div>

                {stripeMsg && (
                  <div style={{ color: "#ff6b6b", fontSize: "13px", fontWeight: "600" }}>{stripeMsg}</div>
                )}

                <button
                  onClick={gererAbonnement}
                  disabled={stripeLoading}
                  style={{
                    background: "rgba(255,255,255,0.06)", color: "white",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "10px", padding: "12px 18px",
                    fontSize: "14px", fontWeight: "600",
                    cursor: stripeLoading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: "8px",
                  }}
                >
                  {stripeLoading ? "⏳ Chargement…" : "⚙️ Gérer mon abonnement (Stripe)"}
                </button>
                <div style={{ color: "#555", fontSize: "12px" }}>
                  Depuis le portail Stripe vous pouvez modifier votre carte ou résilier votre abonnement.
                </div>
              </div>
            )}
          </SCard>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          PARRAINAGE
      ══════════════════════════════════════════════════ */}
      {activeSection === "parrainage" && (() => {
        if (!isPro) return (
          <ProGate featureKey="parrainage" mode="card" onUpgrade={() => setActiveSection("abonnement")} onDismiss={null} />
        );
        const lienRef = referralInfo.code
          ? `https://www.artisan-plus.fr?ref=${referralInfo.code}`
          : null;
        const proUntilDate = referralInfo.pro_until ? new Date(referralInfo.pro_until) : null;
        const gainActif = proUntilDate && proUntilDate > new Date();

        return (
          <div>
            {/* ── Statut ─────────────────────────────────── */}
            <div style={{
              background: referralInfo.used
                ? "rgba(76,175,80,0.08)"
                : "rgba(255,140,0,0.06)",
              border: `1.5px solid ${referralInfo.used ? "rgba(76,175,80,0.3)" : "rgba(255,140,0,0.25)"}`,
              borderRadius: "16px", padding: "18px 20px", marginBottom: "16px",
              display: "flex", alignItems: "flex-start", gap: "14px",
            }}>
              <span style={{ fontSize: "28px", flexShrink: 0 }}>
                {referralInfo.used ? "✅" : "🎁"}
              </span>
              <div>
                {referralInfo.used ? (
                  <>
                    <div style={{ color: "#4CAF50", fontWeight: "800", fontSize: "15px" }}>
                      Parrainage utilisé !
                    </div>
                    <div style={{ color: "#8899aa", fontSize: "13px", marginTop: "4px", lineHeight: "1.5" }}>
                      Quelqu'un s'est inscrit avec ton code et a souscrit l'abonnement Pro.
                      {gainActif
                        ? ` Tu bénéficies de 1 mois Pro offert jusqu'au ${proUntilDate.toLocaleDateString("fr-FR")} 🎉`
                        : " Ton mois Pro offert a été crédité."}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ color: PRIMARY, fontWeight: "800", fontSize: "15px" }}>
                      Parrainage disponible
                    </div>
                    <div style={{ color: "#8899aa", fontSize: "13px", marginTop: "4px", lineHeight: "1.5" }}>
                      Partage ton code avec un ami artisan. Quand il souscrit l'abonnement Pro,{" "}
                      <strong style={{ color: "white" }}>vous gagnez tous les deux 1 mois Pro gratuit</strong>.
                      {referralInfo.referred_by && (
                        <span style={{ display: "block", marginTop: "6px", color: "#6495ED" }}>
                          🎁 Tu as été parrainé avec le code <strong>{referralInfo.referred_by}</strong>
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Ton code ───────────────────────────────── */}
            <SCard titre="🔑 Ton code de parrainage">
              {referralInfo.code ? (
                <>
                  {/* Code affiché en grand */}
                  <div style={{
                    background: DARK,
                    border: "2px dashed rgba(255,140,0,0.4)",
                    borderRadius: "14px", padding: "20px",
                    textAlign: "center", marginBottom: "16px",
                  }}>
                    <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
                      Ton code unique
                    </div>
                    <div style={{
                      color: PRIMARY, fontSize: "clamp(20px, 6vw, 28px)",
                      fontWeight: "900", letterSpacing: "3px", fontFamily: "monospace",
                    }}>
                      {referralInfo.code}
                    </div>
                    <div style={{ color: "#555", fontSize: "11px", marginTop: "8px" }}>
                      {lienRef}
                    </div>
                  </div>

                  {/* Boutons */}
                  {!referralInfo.used && (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button onClick={copierCode} style={{
                        flex: 1, minWidth: "130px",
                        background: codeCopie ? "rgba(76,175,80,0.15)" : "rgba(255,140,0,0.12)",
                        border: `1.5px solid ${codeCopie ? "rgba(76,175,80,0.4)" : "rgba(255,140,0,0.4)"}`,
                        color: codeCopie ? "#4CAF50" : PRIMARY,
                        borderRadius: "12px", padding: "13px 16px",
                        cursor: "pointer", fontSize: "14px", fontWeight: "700",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        transition: "all 0.2s",
                      }}>
                        {codeCopie ? "✅ Copié !" : "📋 Copier le code"}
                      </button>
                      <button onClick={partagerParrainage} style={{
                        flex: 1, minWidth: "130px",
                        background: "rgba(37,211,102,0.12)",
                        border: "1.5px solid rgba(37,211,102,0.35)",
                        color: "#25d366",
                        borderRadius: "12px", padding: "13px 16px",
                        cursor: "pointer", fontSize: "14px", fontWeight: "700",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      }}>
                        📤 Partager (SMS / WhatsApp)
                      </button>
                    </div>
                  )}

                  {/* Message si déjà utilisé */}
                  {referralInfo.used && (
                    <div style={{
                      background: "rgba(76,175,80,0.07)", border: "1px solid rgba(76,175,80,0.2)",
                      borderRadius: "12px", padding: "14px 16px",
                      color: "#4CAF50", fontSize: "13px", fontWeight: "600", textAlign: "center",
                    }}>
                      🎉 Tu ne peux parrainer qu'une seule personne. Mission accomplie !
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: "#8899aa", fontSize: "13px", textAlign: "center", padding: "20px" }}>
                  ⏳ Chargement du code…
                </div>
              )}
            </SCard>

            {/* ── Comment ça marche ──────────────────────── */}
            <SCard titre="💡 Comment ça marche ?">
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  { step: "1", text: "Partage ton code ou lien unique avec un ami artisan" },
                  { step: "2", text: "Il s'inscrit sur Artisan+ avec ton code" },
                  { step: "3", text: "Il souscrit l'abonnement Pro (7,99€/mois)" },
                  { step: "4", text: "Vous gagnez tous les deux 1 mois Pro gratuit 🎉" },
                ].map(({ step, text }) => (
                  <div key={step} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%",
                      background: "rgba(255,140,0,0.15)", border: "1.5px solid rgba(255,140,0,0.4)",
                      color: PRIMARY, fontWeight: "900", fontSize: "13px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>{step}</div>
                    <div style={{ color: "#ccd6e0", fontSize: "14px", lineHeight: "1.5", paddingTop: "4px" }}>
                      {text}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: "16px", background: "rgba(255,140,0,0.05)",
                border: "1px solid rgba(255,140,0,0.15)",
                borderRadius: "10px", padding: "10px 14px",
              }}>
                <div style={{ color: "#8899aa", fontSize: "11px", lineHeight: "1.6" }}>
                  ℹ️ Tu ne peux parrainer qu'<strong style={{ color: "white" }}>une seule personne</strong>. Le mois gratuit est crédité automatiquement quand ton filleul souscrit l'abonnement Pro.
                </div>
              </div>
            </SCard>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════
          MODE SIMPLIFIÉ
      ══════════════════════════════════════════════════ */}
      {activeSection === "simplifie" && (
        <div>
          <SCard titre="📱 Mode simplifié">
            <p style={{ color: "#8899aa", fontSize: "14px", lineHeight: "1.65", margin: "0 0 22px" }}>
              Le mode simplifié est conçu pour une utilisation rapide et intuitive, avec de grands boutons et une interface épurée.
              Idéal si vous préférez aller à l'essentiel.
            </p>

            {/* État actuel */}
            <div style={{
              background: modeSimplifie ? "rgba(255,140,0,0.08)" : "rgba(136,153,170,0.08)",
              border: `1.5px solid ${modeSimplifie ? "rgba(255,140,0,0.3)" : "rgba(136,153,170,0.2)"}`,
              borderRadius: "14px", padding: "18px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: "16px", flexWrap: "wrap",
              marginBottom: "22px",
            }}>
              <div>
                <div style={{ color: "white", fontWeight: "700", fontSize: "15px", marginBottom: "4px" }}>
                  {modeSimplifie ? "📱 Mode simplifié activé" : "🖥️ Interface complète active"}
                </div>
                <div style={{ color: "#8899aa", fontSize: "13px" }}>
                  {modeSimplifie
                    ? "3 boutons principaux, grands textes, formulaires simplifiés"
                    : "Toutes les fonctionnalités, catalogue, multi-lignes, thèmes PDF…"
                  }
                </div>
              </div>
              <div style={{ display: "inline-flex", gap: "8px", flexShrink: 0 }}>
                {modeSimplifie && (
                  <button
                    onClick={() => toggleModeSimplifie(false)}
                    disabled={savingModeSimplifie}
                    style={{
                      background: "transparent",
                      border: "1.5px solid rgba(136,153,170,0.35)",
                      color: "#8899aa", borderRadius: "10px",
                      padding: "10px 18px", fontSize: "13px", fontWeight: "700",
                      cursor: savingModeSimplifie ? "wait" : "pointer",
                    }}
                  >
                    🖥️ Repasser en mode normal
                  </button>
                )}
                {!modeSimplifie && (
                  <button
                    onClick={() => toggleModeSimplifie(true)}
                    disabled={savingModeSimplifie}
                    style={{
                      background: PRIMARY, color: "white",
                      border: "none", borderRadius: "10px",
                      padding: "10px 18px", fontSize: "13px", fontWeight: "700",
                      cursor: savingModeSimplifie ? "wait" : "pointer",
                      boxShadow: "0 4px 16px rgba(255,140,0,0.25)",
                    }}
                  >
                    📱 Activer le mode simplifié
                  </button>
                )}
              </div>
            </div>

            {/* Ce que le mode simplifié change */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { icon: "🔢", label: "3 boutons géants sur l'accueil", desc: "Nouveau devis · Nouvelle facture · Mes clients" },
                { icon: "📝", label: "Formulaire allégé", desc: "Client, description des travaux, montant total et TVA — c'est tout" },
                { icon: "📞", label: "Appel & SMS directs", desc: "Boutons appel et SMS toujours visibles sur les fiches clients" },
                { icon: "✍️", label: "Signature conservée", desc: "L'envoi pour signature numérique reste disponible sur les devis" },
                { icon: "🔀", label: "Retour facile", desc: "Un bouton « Mode normal » est toujours visible pour revenir à tout moment" },
              ].map(item => (
                <div key={item.icon} style={{
                  display: "flex", gap: "12px",
                  background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px 14px",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <span style={{ fontSize: "20px", flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ color: "white", fontSize: "13px", fontWeight: "700" }}>{item.label}</div>
                    <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "2px" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {savingModeSimplifie && (
              <div style={{ color: "#8899aa", fontSize: "12px", textAlign: "center", marginTop: "14px" }}>
                ⏳ Sauvegarde en cours…
              </div>
            )}
          </SCard>

          {/* ── Personnaliser le mode simplifié ─────────── */}
          <SCard titre="🎛️ Personnaliser le mode simplifié">
            <p style={{ color: "#8899aa", fontSize: "14px", lineHeight: "1.65", margin: "0 0 22px" }}>
              Choisissez quelles fonctionnalités s'affichent dans le mode simplifié. Chaque option activée apparaît comme un bouton sur l'accueil.
              {savingConfig && <span style={{ color: PRIMARY, marginLeft: "10px" }}>⏳ Sauvegarde…</span>}
            </p>

            {/* Fonctionnalités métier */}
            <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              Fonctionnalités métier
            </div>
            {[
              { key: "devis",     icon: "📝", label: "Nouveau devis",    desc: "Créer un devis rapide depuis l'accueil" },
              { key: "factures",  icon: "📄", label: "Nouvelle facture", desc: "Créer une facture professionnelle depuis l'accueil" },
              { key: "clients",   icon: "👥", label: "Mes clients",      desc: "Accès rapide à vos clients (appel, SMS, nouveau doc)" },
              { key: "chantiers", icon: "🏗️", label: "Chantiers",        desc: "Suivre et gérer vos chantiers en cours" },
              { key: "agenda",    icon: "📅", label: "Agenda",           desc: "Voir votre planning et rendez-vous" },
              { key: "catalogue", icon: "📦", label: "Catalogue",        desc: "Accéder à vos prestations et tarifs" },
              { key: "mini_site", icon: "🌐", label: "Mon mini-site",    desc: "Gérer votre vitrine en ligne" },
              { key: "recap",     icon: "📊", label: "Récap mensuel",    desc: "Consulter le bilan de votre activité" },
            ].map(item => (
              <div key={item.key} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px", padding: "14px 16px", marginBottom: "10px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "22px" }}>{item.icon}</span>
                  <div>
                    <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>{item.label}</div>
                    <div style={{ color: "#8899aa", fontSize: "12px" }}>{item.desc}</div>
                  </div>
                </div>
                <button
                  onClick={() => sauvegarderSimplifieConfig({ ...simplifieConfig, [item.key]: !simplifieConfig[item.key] })}
                  style={{
                    background: simplifieConfig[item.key] ? PRIMARY : "rgba(255,255,255,0.06)",
                    border: `2px solid ${simplifieConfig[item.key] ? PRIMARY : "rgba(255,255,255,0.12)"}`,
                    borderRadius: "20px", padding: 0,
                    width: "44px", height: "24px",
                    cursor: "pointer", position: "relative", flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{
                    position: "absolute", top: "2px",
                    left: simplifieConfig[item.key] ? "22px" : "2px",
                    width: "16px", height: "16px", background: "white",
                    borderRadius: "50%", transition: "left 0.2s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }} />
                </button>
              </div>
            ))}

            {/* Outils rapides */}
            <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", margin: "22px 0 12px" }}>
              Outils rapides (accès direct vers l'onglet Outils)
            </div>
            {[
              { key: "calculatrice", icon: "🧮", label: "Calculatrice",   desc: "Calculatrice intégrée" },
              { key: "niveau",       icon: "🛠️", label: "Niveau à bulle", desc: "Utiliser le gyroscope du téléphone" },
              { key: "lampe",        icon: "🔦", label: "Lampe torche",   desc: "Activer la lampe via l'app" },
              { key: "notes",        icon: "📝", label: "Notes rapides",  desc: "Prise de notes rapide sur le chantier" },
            ].map(item => (
              <div key={item.key} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px", padding: "14px 16px", marginBottom: "10px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "22px" }}>{item.icon}</span>
                  <div>
                    <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>{item.label}</div>
                    <div style={{ color: "#8899aa", fontSize: "12px" }}>{item.desc}</div>
                  </div>
                </div>
                <button
                  onClick={() => sauvegarderSimplifieConfig({ ...simplifieConfig, [item.key]: !simplifieConfig[item.key] })}
                  style={{
                    background: simplifieConfig[item.key] ? PRIMARY : "rgba(255,255,255,0.06)",
                    border: `2px solid ${simplifieConfig[item.key] ? PRIMARY : "rgba(255,255,255,0.12)"}`,
                    borderRadius: "20px", padding: 0,
                    width: "44px", height: "24px",
                    cursor: "pointer", position: "relative", flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{
                    position: "absolute", top: "2px",
                    left: simplifieConfig[item.key] ? "22px" : "2px",
                    width: "16px", height: "16px", background: "white",
                    borderRadius: "50%", transition: "left 0.2s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }} />
                </button>
              </div>
            ))}
          </SCard>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          SÉCURITÉ
      ══════════════════════════════════════════════════ */}
      {activeSection === "securite" && (
        <div>
          <SCard titre="🔑 Changer le mot de passe">
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={lbl}>Nouveau mot de passe</label>
                <input type="password" value={pwdNouv}
                  onChange={e => setPwdNouv(e.target.value)}
                  placeholder="6 caractères minimum"
                  style={inp} />
              </div>
              <div>
                <label style={lbl}>Confirmer le nouveau mot de passe</label>
                <input type="password" value={pwdConfirm}
                  onChange={e => setPwdConfirm(e.target.value)}
                  placeholder="Répéter le mot de passe"
                  style={inp}
                  onKeyDown={e => e.key === "Enter" && changerMDP()} />
              </div>
              {pwdMsg.text && (
                <div style={{ fontSize: "13px", fontWeight: "600", color: pwdMsg.ok ? "#4CAF50" : "#ff6b6b" }}>
                  {pwdMsg.text}
                </div>
              )}
              <button onClick={changerMDP} disabled={pwdSaving} style={{
                background: pwdSaving ? "#555" : PRIMARY, color: "white", border: "none",
                borderRadius: "10px", padding: "12px 22px", fontSize: "14px",
                fontWeight: "700", cursor: pwdSaving ? "not-allowed" : "pointer"
              }}>
                {pwdSaving ? "⏳ Mise à jour…" : "🔑 Mettre à jour le mot de passe"}
              </button>
            </div>
          </SCard>

          <SCard titre="📱 Sessions actives">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
              <div>
                <div style={{ color: "white", fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>Déconnecter tous les appareils</div>
                <div style={{ color: "#8899aa", fontSize: "12px", lineHeight: "1.4" }}>
                  Vous serez immédiatement déconnecté de tous les navigateurs et appareils.
                </div>
              </div>
              <button onClick={deconnecterPartout} style={{
                background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)",
                color: PRIMARY, borderRadius: "10px", padding: "10px 18px",
                fontSize: "13px", fontWeight: "700", cursor: "pointer", flexShrink: 0
              }}>
                🚪 Déconnecter partout
              </button>
            </div>
          </SCard>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          DANGER
      ══════════════════════════════════════════════════ */}
      {activeSection === "danger" && (
        <div>
          <div style={{
            background: "rgba(255,50,50,0.05)",
            border: "1.5px solid rgba(255,80,80,0.22)",
            borderRadius: "16px", padding: "22px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span style={{ fontSize: "22px" }}>⚠️</span>
              <h3 style={{ color: "#ff6b6b", margin: 0, fontSize: "16px", fontWeight: "800" }}>Zone de danger</h3>
            </div>
            <p style={{ color: "#8899aa", fontSize: "13px", margin: "0 0 20px", lineHeight: "1.5" }}>
              Ces actions sont <strong style={{ color: "#ff6b6b" }}>irréversibles</strong>. Toutes vos données — clients, factures, devis, chantiers et photos — seront définitivement supprimées.
            </p>

            {deleteStep === 0 && (
              <button onClick={() => setDeleteStep(1)} style={{
                background: "rgba(255,80,80,0.1)", border: "1.5px solid rgba(255,80,80,0.35)",
                color: "#ff6b6b", borderRadius: "10px", padding: "12px 22px",
                fontSize: "14px", fontWeight: "700", cursor: "pointer"
              }}>
                🗑️ Supprimer mon compte
              </button>
            )}

            {deleteStep === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ background: "rgba(255,80,80,0.08)", borderRadius: "10px", padding: "12px 14px", border: "1px solid rgba(255,80,80,0.2)" }}>
                  <div style={{ color: "#ff6b6b", fontSize: "13px", fontWeight: "600", lineHeight: "1.5" }}>
                    Pour confirmer, tapez <strong>SUPPRIMER</strong> dans le champ ci-dessous :
                  </div>
                </div>
                <input
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="SUPPRIMER"
                  style={{ background: "rgba(255,80,80,0.07)", border: "1.5px solid rgba(255,80,80,0.3)", borderRadius: "10px", padding: "13px 16px", color: "white", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", letterSpacing: "1px" }}
                />
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    onClick={supprimerCompte}
                    disabled={deleteConfirmText !== "SUPPRIMER"}
                    style={{
                      flex: 1, minWidth: "160px",
                      background: deleteConfirmText === "SUPPRIMER" ? "#e53935" : "rgba(255,80,80,0.15)",
                      color: "white", border: "none", borderRadius: "10px", padding: "13px",
                      fontSize: "14px", fontWeight: "700",
                      cursor: deleteConfirmText === "SUPPRIMER" ? "pointer" : "not-allowed",
                      opacity: deleteConfirmText === "SUPPRIMER" ? 1 : 0.5,
                    }}
                  >
                    ⚠️ Supprimer définitivement
                  </button>
                  <button onClick={() => { setDeleteStep(0); setDeleteConfirmText(""); }} style={{
                    background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
                    color: "#8899aa", borderRadius: "10px", padding: "13px 18px",
                    fontSize: "14px", cursor: "pointer"
                  }}>
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info SQL migration */}
          <div style={{ background: "rgba(100,149,237,0.06)", border: "1px solid rgba(100,149,237,0.2)", borderRadius: "12px", padding: "16px", marginTop: "16px" }}>
            <div style={{ color: "#6495ED", fontSize: "12px", fontWeight: "700", marginBottom: "8px" }}>
              ℹ️ Migration SQL requise pour activer toutes les fonctions
            </div>
            <pre style={{ color: "#8899aa", fontSize: "11px", margin: 0, overflowX: "auto", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{`-- Table profils
ALTER TABLE profils
  ADD COLUMN IF NOT EXISTS iban TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Table parametres (créer si absente)
CREATE TABLE IF NOT EXISTS parametres (
  user_id UUID PRIMARY KEY,
  theme_pdf TEXT DEFAULT 'moderne',
  couleur_pdf TEXT DEFAULT '#FF8C00',
  format_numerotation TEXT DEFAULT 'FAC-{YYYY}-{NNN}',
  tva_defaut NUMERIC DEFAULT 20,
  mention_legale TEXT,
  conditions_paiement TEXT,
  penalites_retard TEXT,
  notif_emails BOOLEAN DEFAULT false,
  notif_rappels_devis BOOLEAN DEFAULT false,
  notif_rappels_factures BOOLEAN DEFAULT false
);
ALTER TABLE parametres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON parametres USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Nouvelles colonnes (ajouter si absentes)
ALTER TABLE parametres
  ADD COLUMN IF NOT EXISTS numero_assurance TEXT,
  ADD COLUMN IF NOT EXISTS afficher_assurance BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS numero_rcs TEXT,
  ADD COLUMN IF NOT EXISTS afficher_rcs BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS numero_tva_intra TEXT,
  ADD COLUMN IF NOT EXISTS afficher_tva_intra BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS mention_auto_entrepreneur BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS indemnite_recouvrement BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS langue TEXT DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS devise TEXT DEFAULT '€',
  ADD COLUMN IF NOT EXISTS signature_email TEXT,
  ADD COLUMN IF NOT EXISTS tva_sur_debits BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS mode_simplifie BOOLEAN DEFAULT false;

-- Colonnes factures (nature opération + TVA sur débits)
ALTER TABLE factures
  ADD COLUMN IF NOT EXISTS nature_operation TEXT,
  ADD COLUMN IF NOT EXISTS tva_sur_debits BOOLEAN DEFAULT false;

-- Système de parrainage
ALTER TABLE profils
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by TEXT,
  ADD COLUMN IF NOT EXISTS referral_used BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS referral_pro_until TIMESTAMPTZ;

-- Badge Artisan Vérifié
ALTER TABLE profils
  ADD COLUMN IF NOT EXISTS verification_statut TEXT DEFAULT 'non_soumis',
  ADD COLUMN IF NOT EXISTS verification_document_url TEXT,
  ADD COLUMN IF NOT EXISTS verification_soumis_at TIMESTAMPTZ;

-- Bucket Supabase Storage : "verifications" (private → public)
-- À créer dans Supabase Dashboard → Storage → New bucket
-- Name: verifications  |  Public: ✓`}</pre>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          CENTRE D'AIDE
      ══════════════════════════════════════════════════ */}
      {activeSection === "aide" && (
        <div>

          {/* ── FAQ général ──────────────────────────────── */}
          <SCard titre="❓ Questions fréquentes">
            {faqItem("faq-0", "Comment créer mon premier devis ?",
              "Clique sur l'onglet Devis puis + Nouveau devis, sélectionne ton client, ajoute les lignes et enregistre.")}
            {faqItem("faq-1", "Comment envoyer un devis à signer ?",
              "Dans la liste des devis, clique sur Envoyer. L'app génère un lien unique à partager par SMS ou WhatsApp. Ton client clique, lit et signe avec son doigt.")}
            {faqItem("faq-2", "Comment convertir un devis en facture ?",
              "Dans la liste des devis, clique sur le devis accepté puis Convertir en facture. Tout se remplit automatiquement.")}
            {faqItem("faq-3", "Comment ajouter un client ?",
              "Va dans l'onglet Clients et clique sur + Nouveau client.")}
            {faqItem("faq-4", "Comment créer un chantier ?",
              "Va dans l'onglet Chantiers et clique sur + Nouveau chantier. Tu peux lier un client et ajouter les frais matériaux et sous-traitance.")}
            {faqItem("faq-5", "Le PDF ne se génère pas ?",
              "Vérifie que ton profil est bien rempli dans Paramètres › Mon profil (nom, SIRET, adresse).")}
            {faqItem("faq-6", "Mon client n'arrive pas à signer ?",
              "Vérifie que le lien est complet quand tu le partages. Il doit commencer par https://www.artisan-plus.fr/signer/…")}
            {faqItem("faq-7", "Je n'arrive pas à me connecter ?",
              "Vérifie ton email et mot de passe. Utilise « Mot de passe oublié » sur la page de connexion si besoin.")}
          </SCard>

          {/* ── Abonnement ───────────────────────────────── */}
          <SCard titre="💎 Abonnement">
            {faqItem("abo-0", "Qu'est-ce que le plan Gratuit ?",
              "3 factures, 3 devis et 2 chantiers par mois — parfait pour commencer et tester l'application sans engagement.")}
            {faqItem("abo-1", "Qu'est-ce que le plan Pro ?",
              "Tout illimité (clients, factures, devis, chantiers, photos HD) pour 7,99 €/mois TTC. Sans engagement.")}
            {faqItem("abo-2", "Puis-je annuler à tout moment ?",
              "Oui, sans engagement ni frais de résiliation. Tu peux annuler depuis Paramètres › Abonnement à tout moment.")}
            {faqItem("abo-3", "Que se passe-t-il si je me désabonne ?",
              "Tu repasses automatiquement sur le plan Gratuit. Toutes tes données (clients, factures, devis, chantiers) sont conservées.")}
            {faqItem("abo-4", "Mon paiement a échoué, que faire ?",
              "Vérifie que ta carte est valide et que tu as les fonds suffisants. Si le problème persiste, contacte-nous à contact@artisan-plus.fr.")}
            {faqItem("abo-5", "Comment obtenir une facture de mon abonnement ?",
              "Contacte le support à contact@artisan-plus.fr avec ton adresse email. Nous t'enverrons la facture sous 24h.")}
          </SCard>

          {/* ── Sécurité & confidentialité ───────────────── */}
          <SCard titre="🔒 Sécurité et confidentialité">
            {faqItem("sec-0", "Mes données sont-elles sécurisées ?",
              "Oui. Tes données sont stockées en Europe sur les serveurs Supabase, chiffrées en transit (HTTPS) et sauvegardées automatiquement chaque jour.")}
            {faqItem("sec-1", "Qui peut voir mes données ?",
              "Personne d'autre que toi. Chaque compte est isolé par des règles de sécurité strictes (Row Level Security Supabase). Nous ne revendons aucune donnée.")}
            {faqItem("sec-2", "La signature électronique est-elle légale en France ?",
              "Oui. La signature électronique est reconnue légalement depuis la loi du 13 mars 2000 et le règlement européen eIDAS du 23 juillet 2014.")}
          </SCard>

          {/* ── Problèmes techniques ─────────────────────── */}
          <SCard titre="🔧 Problèmes techniques">
            {faqItem("tech-0", "L'app ne charge pas ?",
              "Vérifie ta connexion internet. Vide le cache du navigateur (Ctrl+Maj+R ou Cmd+Maj+R sur Mac) et réessaie. Si le problème persiste, contacte le support.")}
            {faqItem("tech-1", "Je n'ai pas reçu l'email de confirmation ?",
              "Vérifie tes spams. L'email vient de contact@artisan-plus.fr. Si tu ne le trouves pas, contacte-nous directement.")}
          </SCard>

          {/* ── Contacter le support ─────────────────────── */}
          <SCard titre="📬 Contacter le support">
            <p style={{ color: "#8899aa", fontSize: "13px", lineHeight: "1.6", margin: "0 0 20px" }}>
              Tu n'as pas trouvé la réponse ? Envoie-nous un message, on répond en moins de 24h du lundi au vendredi.
            </p>

            {contactSuccess ? (
              <div style={{
                background: "rgba(76,175,80,0.12)", border: "1.5px solid rgba(76,175,80,0.35)",
                borderRadius: "14px", padding: "24px", textAlign: "center",
              }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>✅</div>
                <div style={{ color: "#4CAF50", fontWeight: "800", fontSize: "16px", marginBottom: "6px" }}>
                  Message envoyé !
                </div>
                <div style={{ color: "#8899aa", fontSize: "13px", marginBottom: "16px" }}>
                  Notre équipe vous répondra dans les 24h.
                </div>
                <button
                  onClick={() => { setContactSuccess(false); setContactMsg(""); }}
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "white", borderRadius: "10px", padding: "10px 20px", fontSize: "13px", cursor: "pointer" }}
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Sujet */}
                <div>
                  <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                    Sujet
                  </label>
                  <select
                    value={contactSujet}
                    onChange={e => setContactSujet(e.target.value)}
                    style={{ ...inp, cursor: "pointer" }}
                  >
                    {["Problème technique", "Question abonnement", "Bug dans l'application", "Suggestion d'amélioration", "Autre"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                    Votre message *
                  </label>
                  <textarea
                    placeholder="Décrivez votre problème ou question en détail..."
                    value={contactMsg}
                    onChange={e => setContactMsg(e.target.value)}
                    rows={5}
                    style={{ ...inp, resize: "vertical", minHeight: "110px", fontFamily: "inherit" }}
                  />
                </div>

                {contactError && (
                  <div style={{ color: "#ff6b6b", fontSize: "13px", background: "rgba(255,107,107,0.1)", borderRadius: "8px", padding: "10px 14px" }}>
                    ❌ {contactError}
                  </div>
                )}

                <button
                  disabled={contactLoading || !contactMsg.trim()}
                  onClick={async () => {
                    if (!contactMsg.trim()) return;
                    setContactLoading(true);
                    setContactError("");
                    try {
                      const r = await fetch("/api/send-email", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          type: "support",
                          sujet: contactSujet,
                          message: contactMsg.trim(),
                          emailUtilisateur: user?.email || "",
                          nomUtilisateur: user?.email || "Utilisateur",
                        }),
                      });
                      const j = await r.json();
                      if (j.ok) {
                        setContactSuccess(true);
                      } else {
                        setContactError(j.error || "Erreur lors de l'envoi, réessayez.");
                      }
                    } catch {
                      setContactError("Erreur réseau — vérifiez votre connexion.");
                    }
                    setContactLoading(false);
                  }}
                  style={{
                    background: contactLoading || !contactMsg.trim() ? "#334" : PRIMARY,
                    color: "white", border: "none", borderRadius: "12px",
                    padding: "14px 24px", fontSize: "15px", fontWeight: "800",
                    cursor: contactLoading || !contactMsg.trim() ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    transition: "background 0.15s",
                  }}
                >
                  {contactLoading ? "Envoi en cours…" : "✉️ Envoyer le message"}
                </button>

                <div style={{ color: "#445566", fontSize: "11px", textAlign: "center" }}>
                  Réponse sous 24h · Lun–Ven
                </div>
              </div>
            )}
          </SCard>

          {/* ── Nouveautés ───────────────────────────────── */}
          <SCard titre="🚀 Nouveautés & mises à jour">
            {[
              {
                version: "v1.4", date: "Mai 2026", emoji: "❓",
                titre: "Centre d'aide",
                items: ["FAQ complète avec accordéon interactif", "Sections Abonnement, Sécurité, Problèmes techniques", "Bouton contact support direct"],
              },
              {
                version: "v1.3", date: "Mai 2026", emoji: "🖥️",
                titre: "Navigation responsive",
                items: ["Nav horizontale en haut sur ordinateur", "Bottom nav conservée sur mobile", "Paramètres avec sidebar sur desktop"],
              },
              {
                version: "v1.2", date: "Mai 2026", emoji: "✍️",
                titre: "Signature électronique",
                items: ["Envoi de devis par lien unique", "Signature au doigt sur mobile", "Partage natif (SMS, WhatsApp, email)"],
              },
              {
                version: "v1.1", date: "Avril 2026", emoji: "🏗️",
                titre: "Chantiers & inter-sections",
                items: ["Module Chantiers complet avec photos", "Liens clients → chantiers → devis → factures", "Onglet Paramètres (profil, TVA, PDF…)"],
              },
              {
                version: "v1.0", date: "Avril 2026", emoji: "🎉",
                titre: "Lancement d'Artisan+",
                items: ["Gestion clients avec fiche complète", "Création de factures et devis en PDF", "Tableau de bord avec statistiques"],
              },
            ].map((r, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: "14px",
                padding: "16px 0",
                borderBottom: i < 4 ? "1px solid rgba(255,140,0,0.08)" : "none",
              }}>
                <div style={{
                  background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.2)",
                  borderRadius: "10px", padding: "9px 10px", fontSize: "20px",
                  flexShrink: 0, textAlign: "center", minWidth: "46px",
                }}>{r.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                    <span style={{ color: "white", fontWeight: "800", fontSize: "14px" }}>{r.titre}</span>
                    <span style={{ background: "rgba(255,140,0,0.15)", color: PRIMARY, fontSize: "11px", fontWeight: "700", borderRadius: "5px", padding: "2px 7px" }}>{r.version}</span>
                    <span style={{ color: "#555", fontSize: "11px" }}>{r.date}</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                    {r.items.map((item, j) => (
                      <li key={j} style={{ color: "#8899aa", fontSize: "13px", lineHeight: "1.5" }}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </SCard>

        </div>
      )}
    </div>
  );

  const mainContent = (
    <div style={isDesktop
      ? { display: "flex", gap: "32px", alignItems: "flex-start" }
      : { maxWidth: "700px", margin: "0 auto", paddingBottom: "20px" }
    }>

      {/* ── SIDEBAR (desktop uniquement) ─────────────────── */}
      {isDesktop && (
        <div style={{ width: "210px", flexShrink: 0, position: "sticky", top: "80px" }}>
          <h2 style={{ color: "white", margin: "0 0 20px", fontSize: "17px", fontWeight: "800" }}>
            ⚙️ {t("nav.settings") || "Paramètres"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  background: activeSection === s.id ? "rgba(255,140,0,0.12)" : "transparent",
                  border: `1.5px solid ${activeSection === s.id ? "rgba(255,140,0,0.3)" : "transparent"}`,
                  color: activeSection === s.id ? PRIMARY : "#8899aa",
                  borderRadius: "10px", padding: "11px 14px",
                  fontSize: "14px", fontWeight: "600",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {s.emoji} {t("settings." + s.id) || s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── HEADER + ONGLETS (mobile uniquement) ────────── */}
      {!isDesktop && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <button onClick={onBack} style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
              color: "white", borderRadius: "8px", padding: "8px 16px",
              cursor: "pointer", fontSize: "14px", fontWeight: "600",
            }}>{t("settings.back") || "← Retour"}</button>
            <h2 style={{ color: "white", margin: 0, fontSize: "20px", fontWeight: "800" }}>⚙️ {t("nav.settings") || "Paramètres"}</h2>
          </div>

          <div style={{
            display: "flex", gap: "6px",
            overflowX: "auto", paddingBottom: "8px", paddingTop: "2px", marginBottom: "18px",
            scrollbarWidth: "none", msOverflowStyle: "none",
            position: "sticky", top: "calc(56px + env(safe-area-inset-top, 0px))",
            zIndex: 40, background: DARK, marginLeft: "-16px", marginRight: "-16px",
            paddingLeft: "16px", paddingRight: "16px",
          }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                background: activeSection === s.id ? "rgba(255,140,0,0.15)" : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${activeSection === s.id ? PRIMARY : "rgba(255,255,255,0.08)"}`,
                color: activeSection === s.id ? PRIMARY : "#8899aa",
                borderRadius: "10px", padding: "8px 14px", fontSize: "12px", fontWeight: "700",
                cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s", flexShrink: 0,
              }}>
                {s.emoji} {t("settings." + s.id) || s.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── CONTENU DE LA SECTION ────────────────────────── */}
      {sectionContent}
    </div>
  );

  // ── Éditeur visuel plein écran ─────────────────────────────────────────────
  return (
    <>
      {mainContent}
      {editeurOuvert && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "#0a1628", overflow: "hidden" }}>
          <EditeurSite user={user} onClose={() => { setEditeurOuvert(false); charger(); }} />
        </div>
      )}
    </>
  );
}
