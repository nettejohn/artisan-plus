import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import NouvelleFacture from "./NouvelleFacture";
import NouveauDevis from "./NouveauDevis";
import { genererFacturePDF } from "./GenerateurPDF";
import Profil from "./Profil";
import Chantiers from "./Chantiers";
import Parametres from "./Parametres";
import UpgradeModal from "./UpgradeModal";
import { idbSave, idbLoad } from "./idb";
import { QRCodeCanvas } from "qrcode.react";
import Outils from "./Outils";
import Agenda from "./Agenda";
import RecapMensuel from "./RecapMensuel";
import CataloguePrestations from "./CataloguePrestations";

const PRIMARY = "#FF8C00";
const DARK = "#0a1628";
const CARD = "#111e35";

// ── Étapes de la visite guidée ────────────────────────────────────────────
const TOUR_STEPS = [
  {
    tab: "accueil",
    emoji: "🏠",
    title: "Accueil — tableau de bord",
    desc: "Suivez en temps réel votre CA encaissé, les factures à encaisser, vos devis en attente et vos chantiers actifs. Le graphique CA affiche l'évolution sur les 6 derniers mois.",
  },
  {
    tab: "documents",
    emoji: "📄",
    title: "Factures — PDFs pro en 1 minute",
    desc: "Créez une facture professionnelle en quelques secondes. 5 thèmes visuels (Moderne, Classique, Élégant…), numérotation automatique, téléchargement PDF. Convertissez un devis accepté en facture d'un seul clic.",
  },
  {
    tab: "documents",
    emoji: "✍️",
    title: "Devis — signature électronique",
    desc: "Créez un devis et envoyez le lien de signature à votre client par SMS, WhatsApp ou email. Il signe directement sur son téléphone avec son doigt. La signature est horodatée et légalement valable.",
  },
  {
    tab: "clients",
    emoji: "👥",
    title: "Clients — fiches & historique complet",
    desc: "Appelez, envoyez un SMS ou un email à votre client en 1 clic. Consultez l'historique complet : factures, devis, chantiers, notes et appréciations — tout en un seul endroit.",
  },
  {
    tab: "chantiers",
    emoji: "🏗️",
    title: "Chantiers — rentabilité en temps réel",
    desc: "Créez un chantier, saisissez vos dépenses matériaux et heures de travail. Artisan+ calcule votre bénéfice net automatiquement. Ajoutez des photos HD directement depuis votre téléphone.",
  },
  {
    tab: "chantiers",
    emoji: "⛅",
    title: "Météo — planifiez selon la météo",
    desc: "Chaque chantier affiche la météo en temps réel : température, conditions et risque de pluie. Planifiez vos journées de travail selon les prévisions directement depuis la liste des chantiers.",
  },
  {
    tab: "documents",
    emoji: "📦",
    title: "Catalogue de prestations",
    desc: "Enregistrez vos articles, fournitures et prestations habituelles avec leurs prix unitaires. Lors d'un devis ou d'une facture, insérez-les en 1 clic — fini de tout ressaisir à chaque fois !",
    note: "Accessible depuis ➜ Documents › Catalogue",
  },
  {
    tab: null,
    emoji: "📱",
    title: "Mode simplifié — pour aller vite",
    desc: "Activez le mode simplifié pour une interface ultra-épurée : 3 grands boutons, formulaires raccourcis, appel & SMS directs. Idéal quand vous êtes sur un chantier et voulez aller à l'essentiel.",
    isParams: true,
    paramsSection: "simplifie",
  },
  {
    tab: null,
    emoji: "✅",
    title: "Badge Artisan Vérifié",
    desc: "Soumettez votre SIRET et un justificatif pour obtenir le badge ✓ Artisan Vérifié. Il apparaît sur votre profil et vos PDFs, renforçant la confiance de vos clients.",
    isParams: true,
    paramsSection: "verif",
  },
  {
    tab: null,
    emoji: "💎",
    title: "Plan Pro — tout illimité",
    desc: "Factures, devis, clients et chantiers illimités. Logo professionnel sur les PDFs, photos HD, notifications intelligentes et support prioritaire. Résiliable à tout moment, sans engagement.",
    isParams: true,
    paramsSection: "abonnement",
  },
];

// Droits d'accès par rôle équipe
const ROLE_TABS = {
  associe:       ["accueil", "documents", "clients", "chantiers", "outils"],
  collaborateur: ["accueil", "chantiers"],
  comptable:     ["accueil", "documents"],
};

export default function Dashboard({
  user, onLogout,
  isGuest = false,
  teamInfo = null,  // { role, patronId } si membre d'une équipe
  isOnline = true,
  canInstall = false, handleInstall,
  showSyncToast = false,
  updateAvailable = false, handleUpdate,
  notifPermission = 'default', requestNotifPermission, checkAndNotify,
  subscriptionStatus = null, onSubscriptionStatusCleared,
}) {
  // Rôle effectif : 'patron' si pas dans une équipe, sinon le rôle assigné
  const teamRole   = teamInfo?.role ?? "patron";
  const allowedTabs = teamRole === "patron" ? null : ROLE_TABS[teamRole] ?? [];
  const canAccess  = (tab) => !allowedTabs || allowedTabs.includes(tab);
  const viewUserId = teamInfo?.patronId ?? user.id; // Pour les requêtes de données
  const [activeTab, setActiveTab] = useState("accueil");
  const [page, setPage] = useState("dashboard");
  const [clientPreSelectionne, setClientPreSelectionne] = useState(null);
  const [factures, setFactures] = useState([]);
  const [devis, setDevis] = useState([]);
  const [profil, setProfil] = useState(null);
  const [stats, setStats] = useState({ factures: 0, devis: 0, ca: 0, clients: 0 });
  const [lienCopie, setLienCopie] = useState(null);

  // Freemium / Upgrade
  const [upgradeModal,   setUpgradeModal]   = useState({ open: false, type: "factures" });
  const [guestModal,     setGuestModal]     = useState(false);

  // Interception : invités → modal "créez un compte" au lieu de Stripe
  const ouvrirUpgrade = (type = "factures") => {
    if (isGuest) setGuestModal(true);
    else setUpgradeModal({ open: true, type });
  };

  // QR Code modal
  const [qrModal, setQrModal] = useState({ open: false, url: "", numero: "", loading: false });

  // Acompte modal
  const [acompteModal,  setAcompteModal]  = useState(null); // devis ou null
  const [acomptePct,    setAcomptePct]    = useState(30);
  const [acompteCustom, setAcompteCustom] = useState("");
  const [acompteLoading,setAcompteLoading]= useState(false);

  // Onboarding
  const [onboardingPhase, setOnboardingPhase] = useState(null); // 'welcome' | 'tour' | null
  const [tourStep, setTourStep] = useState(0);

  // Mode simplifié
  const [modeSimple,     setModeSimple]     = useState(false);
  const [modeSimpleView, setModeSimpleView] = useState(null); // null | 'clients'

  // Calculateur de rentabilité
  const [calc, setCalc] = useState({
    tauxHoraire: "", heuresMois: "",
    carburant: "",   materiel: "",
    assurance: "",   autres: "",
  });

  // Menu hamburger
  const [hamburgerOpen, setHamburgerOpen]       = useState(false);
  const [parametresSection, setParametresSection] = useState("profil");

  // Documents sous-onglets
  const [docSub, setDocSub] = useState("factures");
  const [showCatalogueModal, setShowCatalogueModal] = useState(false);

  // ── Récap mensuel ─────────────────────────────────────────────
  const [showRecap,      setShowRecap]      = useState(false);
  const [recapBadge,     setRecapBadge]     = useState(false);
  // ── Assistant Comptable ────────────────────────────────────────
  const [showComptable,  setShowComptable]  = useState(false);

  // ── États chantiers (pour affichage dans la fiche client) ─────
  const [chantiers, setChantiers] = useState([]);
  const [clientChantierPreselect, setClientChantierPreselect] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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
    chargerChantiers();
    chargerModeSimple();
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Synchronisation automatique au retour de la connexion ────────
  useEffect(() => {
    if (!isOnline) return; // Ne rien faire si hors ligne
    // Quand isOnline passe de false à true (showSyncToast = true),
    // on recharge toutes les données depuis Supabase
    if (showSyncToast) {
      chargerDonnees();
      chargerClients();
      chargerChantiers();
    }
  }, [isOnline, showSyncToast]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Écoute les événements de sync du Service Worker ──────────────
  useEffect(() => {
    const handleArtisanSync = () => {
      chargerDonnees();
      chargerClients();
      chargerChantiers();
    };
    window.addEventListener("artisan-sync", handleArtisanSync);
    return () => window.removeEventListener("artisan-sync", handleArtisanSync);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Notifications : vérifie les items en retard quand les données arrivent
  useEffect(() => {
    if (factures.length > 0 || devis.length > 0) {
      checkAndNotify?.(factures, devis);
    }
  }, [factures, devis]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Retour depuis Stripe : recharger le profil pour lire le plan mis à jour
  useEffect(() => {
    if (subscriptionStatus === "success") {
      chargerProfil();
    }
    // Auto-clear après 5 s
    if (subscriptionStatus) {
      const t = setTimeout(() => onSubscriptionStatusCleared?.(), 5000);
      return () => clearTimeout(t);
    }
  }, [subscriptionStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Onboarding : afficher le welcome screen à la première connexion
  useEffect(() => {
    const key = `artisan_onboarding_v1_${user.id}`;
    if (!localStorage.getItem(key)) {
      // Petite attente pour que le splash soit parti
      const t = setTimeout(() => setOnboardingPhase("welcome"), 3200);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Récap mensuel : badge le 1er du mois (et jours suivants jusqu'à fermeture)
  useEffect(() => {
    const now  = new Date();
    const ym   = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    const key  = `recap_shown_${user.id}_${ym}`;
    // Afficher si pas encore vu ce mois-ci (le mois précédent a des données)
    if (!localStorage.getItem(key)) {
      // Attendre que l'app soit chargée pour éviter de clignoter au démarrage
      const t = setTimeout(() => setRecapBadge(true), 4000);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fonctions onboarding
  const demarrerVisite = () => {
    setTourStep(0);
    setOnboardingPhase("tour");
    naviguerVersStep(TOUR_STEPS[0]);
  };

  const naviguerVersStep = (step) => {
    if (step.isParams) {
      setPage("parametres");
      if (step.paramsSection) setParametresSection(step.paramsSection);
    } else if (step.tab) {
      setPage("dashboard");
      setActiveTab(step.tab);
    }
  };

  const avancerTour = () => {
    const next = tourStep + 1;
    if (next >= TOUR_STEPS.length) {
      terminerTour();
    } else {
      setTourStep(next);
      naviguerVersStep(TOUR_STEPS[next]);
    }
  };

  const reculerTour = () => {
    const prev = tourStep - 1;
    if (prev >= 0) {
      setTourStep(prev);
      naviguerVersStep(TOUR_STEPS[prev]);
    }
  };

  const terminerTour = () => {
    localStorage.setItem(`artisan_onboarding_v1_${user.id}`, "done");
    setOnboardingPhase(null);
    setTourStep(0);
  };

  const relancerVisite = () => {
    // Trouver l'étape correspondant au tab actuel
    const idx = TOUR_STEPS.findIndex(s =>
      s.tab === activeTab || (s.isParams && page === "parametres")
    );
    setTourStep(Math.max(0, idx));
    setOnboardingPhase("tour");
  };

  // Plan actuel (Pro payant OU mois offert via parrainage)
  const isPro = profil?.plan === "pro" ||
    (profil?.referral_pro_until && new Date(profil.referral_pro_until) > new Date());

  const chargerProfil = async () => {
    const { data } = await supabase
      .from("profils")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // ── Champs à synchroniser / compléter ────────────────────────
    const patch = {};

    // 1) Générer un code de parrainage si absent
    if (!data?.referral_code) {
      patch.referral_code = "ARTISAN-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // 2) Sync referred_by depuis user_metadata si absent dans profils
    //    (exécuté même si referral_code existe déjà — c'est le bug corrigé)
    const metaReferredBy = user.user_metadata?.referred_by || null;
    if (metaReferredBy && !data?.referred_by) {
      patch.referred_by = metaReferredBy;
    }

    // 3) Appliquer le patch si nécessaire
    if (Object.keys(patch).length > 0) {
      await supabase.from("profils").upsert(
        { user_id: user.id, ...patch },
        { onConflict: "user_id" }
      );
    }

    if (data) {
      setProfil({ ...data, ...patch });
    }
  };

  const chargerModeSimple = async () => {
    const { data } = await supabase
      .from("parametres")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (data) setModeSimple(data.mode_simplifie || false);
  };

  const chargerChantiers = async () => {
    const { data } = await supabase
      .from("chantiers")
      .select("id, nom, statut, prix_chantier, client_id")
      .eq("user_id", viewUserId)
      .order("created_at", { ascending: false });
    if (data) {
      setChantiers(data);
      idbSave("chantiers", data); // sauvegarde pour consultation hors ligne
    } else {
      // Hors ligne → charge depuis le cache local
      const cached = await idbLoad("chantiers");
      if (cached.length > 0) setChantiers(cached);
    }
  };

  const chargerClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select(`
        *,
        factures(id, total_ttc, statut),
        devis(id, statut)
      `)
      .eq("user_id", viewUserId)
      .order("created_at", { ascending: false });
    if (data) {
      setClients(data);
      idbSave("clients", data); // sauvegarde pour consultation hors ligne
    } else {
      const cached = await idbLoad("clients");
      if (cached.length > 0) setClients(cached);
    }
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
      .eq("user_id", viewUserId)
      .order("created_at", { ascending: false });

    if (facturesData) {
      setFactures(facturesData);
      const ca = facturesData.reduce((sum, f) => sum + (f.total_ttc || 0), 0);
      setStats(s => ({ ...s, factures: facturesData.length, ca }));
      idbSave("factures", facturesData); // cache pour consultation hors ligne
    } else {
      // Hors ligne → données du cache local
      const cached = await idbLoad("factures");
      if (cached.length > 0) {
        setFactures(cached);
        const ca = cached.reduce((sum, f) => sum + (f.total_ttc || 0), 0);
        setStats(s => ({ ...s, factures: cached.length, ca }));
      }
    }

    const { data: devisData } = await supabase
      .from("devis")
      .select("*, clients(*)")
      .eq("user_id", viewUserId)
      .order("created_at", { ascending: false });

    if (devisData) {
      setDevis(devisData);
      setStats(s => ({ ...s, devis: devisData.length }));
      idbSave("devis", devisData); // cache pour consultation hors ligne
    } else {
      const cached = await idbLoad("devis");
      if (cached.length > 0) {
        setDevis(cached);
        setStats(s => ({ ...s, devis: cached.length }));
      }
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

  const changerStatutFacture = async (facture) => {
    const nouveauStatut = facture.statut === "payee" ? "en_attente" : "payee";
    await supabase.from("factures").update({ statut: nouveauStatut }).eq("id", facture.id);
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

  // ── QR Code ─────────────────────────────────────────────────────
  const ouvrirQRModal = async (d) => {
    setQrModal({ open: true, url: "", numero: d.numero, loading: true });

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
    }

    const url = `https://artisan-plus.vercel.app/signer/${token}`;
    setQrModal({ open: true, url, numero: d.numero, loading: false });
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById("qr-canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `QR-devis-${qrModal.numero}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code — Devis ${qrModal.numero}`,
          text: `Scannez ce code QR pour consulter et signer le devis ${qrModal.numero} en ligne.`,
          url: qrModal.url,
        });
      } catch (_) { /* annulé */ }
    } else {
      navigator.clipboard.writeText(qrModal.url).catch(() => {});
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
    setActiveTab("documents"); setDocSub("factures");
    alert("✅ Devis converti en facture !");
  };

  const creerAcompte = async () => {
    if (!acompteModal) return;
    setAcompteLoading(true);
    const pct = acomptePct === "custom" ? parseFloat(acompteCustom) : acomptePct;
    if (!pct || pct <= 0 || pct > 100) { alert("Pourcentage invalide"); setAcompteLoading(false); return; }

    const ratio      = pct / 100;
    const total_ht   = (acompteModal.total_ht  || 0) * ratio;
    const total_ttc  = (acompteModal.total_ttc || 0) * ratio;
    const numero     = "ACOMPTE-" + Date.now();
    const description = `Acompte ${pct}% sur devis ${acompteModal.numero || acompteModal.id.slice(0,8)}`;

    const { data: factureData, error } = await supabase
      .from("factures")
      .insert({
        user_id:   viewUserId,
        client_id: acompteModal.client_id,
        numero,
        total_ht:  Math.round(total_ht * 100) / 100,
        tva:       acompteModal.tva,
        total_ttc: Math.round(total_ttc * 100) / 100,
        notes:     description,
        style:     acompteModal.style || "moderne",
        type:      "acompte",
        devis_id:  acompteModal.id,
        statut:    "en_attente",
      })
      .select()
      .single();

    if (error) { alert("Erreur : " + error.message); setAcompteLoading(false); return; }

    // Ligne unique pour la facture d'acompte
    await supabase.from("lignes_facture").insert({
      facture_id:    factureData.id,
      description,
      quantite:      1,
      prix_unitaire: Math.round(total_ht * 100) / 100,
      total:         Math.round(total_ht * 100) / 100,
    });

    setAcompteModal(null);
    setAcompteLoading(false);
    chargerDonnees();
    setActiveTab("documents"); setDocSub("factures");
    alert(`✅ Facture d'acompte ${pct}% créée ! (${Math.round(total_ttc * 100) / 100} € TTC)`);
  };

  if (page === "profil") return (
    <Profil user={user} onBack={() => { setPage("dashboard"); chargerProfil(); }} />
  );
  if (page === "nouvelle-facture") return (
    <NouvelleFacture user={user} clientInitialId={clientPreSelectionne} modeSimple={modeSimple} onBack={() => { setPage("dashboard"); setClientPreSelectionne(null); chargerDonnees(); }} />
  );
  if (page === "nouveau-devis") return (
    <NouveauDevis user={user} clientInitialId={clientPreSelectionne} modeSimple={modeSimple} onBack={() => { setPage("dashboard"); setClientPreSelectionne(null); chargerDonnees(); }} />
  );

  const statutColor = (s) => {
    if (s === "payee" || s === "accepte") return "#4CAF50";
    if (s === "en_attente")              return PRIMARY;
    if (s === "envoye")                  return "#6495ED";
    if (s === "annulee" || s === "refuse") return "#ff6b6b";
    return "#8899aa";
  };
  const statutLabel = (s) => {
    if (s === "payee")    return "✅ Payée";
    if (s === "accepte")  return "✅ Accepté";
    if (s === "en_attente") return "⏳ En attente";
    if (s === "envoye")   return "📤 Envoyé";
    if (s === "annulee")  return "❌ Annulée";
    if (s === "refuse")   return "❌ Refusé";
    return "⏳ En attente";
  };

  const STATUT_CHANTIER = {
    en_attente: { label: "En attente", color: "#8899aa", bg: "rgba(136,153,170,0.15)" },
    en_cours:   { label: "En cours",   color: PRIMARY,   bg: "rgba(255,140,0,0.15)"   },
    termine:    { label: "Terminé",    color: "#4CAF50", bg: "rgba(76,175,80,0.15)"   },
    annule:     { label: "Annulé",     color: "#ff6b6b", bg: "rgba(255,107,107,0.15)" },
  };

  const isDesktop = windowWidth >= 768;

  return (
    <div style={{ minHeight: "100vh", background: DARK, fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── BANDEAU HORS CONNEXION ─────────────────────────────── */}
      {!isOnline && (
        <div style={{
          position: "sticky", top: 0, zIndex: 101,
          background: PRIMARY,
          color: "white",
          textAlign: "center",
          padding: "10px 16px",
          fontSize: "13px",
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          boxShadow: "0 2px 12px rgba(255,140,0,0.4)",
        }}>
          <span>📵</span>
          <span>Vous êtes hors connexion — certaines fonctions sont limitées</span>
        </div>
      )}

      {/* ── BANDEAU NOUVELLE VERSION DISPONIBLE ───────────────── */}
      {updateAvailable && (
        <div style={{
          position: "sticky", top: !isOnline ? "41px" : "0", zIndex: 101,
          background: "#1a6f3c",
          color: "white",
          padding: "10px 16px",
          fontSize: "13px",
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
        }}>
          <span>🔄 Nouvelle version disponible</span>
          <button
            onClick={handleUpdate}
            style={{
              background: "white",
              color: "#1a6f3c",
              border: "none",
              borderRadius: "7px",
              padding: "5px 14px",
              fontSize: "12px",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            Actualiser
          </button>
        </div>
      )}

      {/* ── TOAST : retour Stripe Checkout ─────────────────────── */}
      {subscriptionStatus === "success" && (
        <div style={{
          position: "fixed", top: "16px", left: "50%",
          transform: "translateX(-50%)", zIndex: 600,
          background: "#1a6f3c", color: "white",
          borderRadius: "12px", padding: "14px 24px",
          fontSize: "14px", fontWeight: "700",
          display: "flex", alignItems: "center", gap: "10px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          animation: "fadeInDown 0.3s ease", whiteSpace: "nowrap",
        }}>
          <span>💎</span>
          <span>Bienvenue dans le plan Pro ! Toutes les limites sont levées.</span>
          <button onClick={onSubscriptionStatusCleared} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: "18px", padding: 0, lineHeight: 1 }}>✕</button>
        </div>
      )}
      {subscriptionStatus === "canceled" && (
        <div style={{
          position: "fixed", top: "16px", left: "50%",
          transform: "translateX(-50%)", zIndex: 600,
          background: "#8899aa", color: "white",
          borderRadius: "12px", padding: "14px 24px",
          fontSize: "14px", fontWeight: "700",
          display: "flex", alignItems: "center", gap: "10px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          animation: "fadeInDown 0.3s ease", whiteSpace: "nowrap",
        }}>
          <span>ℹ️</span>
          <span>Paiement annulé — vous restez sur le plan gratuit.</span>
          <button onClick={onSubscriptionStatusCleared} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: "18px", padding: 0, lineHeight: 1 }}>✕</button>
        </div>
      )}

      {/* ── TOAST : connexion rétablie + synchro ───────────────── */}
      {showSyncToast && isOnline && (
        <div style={{
          position: "fixed", top: "16px", left: "50%",
          transform: "translateX(-50%)",
          zIndex: 500,
          background: "#4CAF50",
          color: "white",
          borderRadius: "12px",
          padding: "12px 20px",
          fontSize: "13px",
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          animation: "fadeInDown 0.3s ease",
          whiteSpace: "nowrap",
        }}>
          <span>✅</span>
          <span>Connexion rétablie — synchronisation en cours...</span>
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{
        background: CARD,
        padding: isDesktop ? "0 32px" : "0 16px",
        height: isDesktop ? "64px" : "56px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,140,0,0.15)",
        position: "sticky", top: 0, zIndex: 100,
        gap: "16px",
      }}>
        {/* Logo */}
        <div style={{ fontSize: "22px", fontWeight: "900", color: "white", letterSpacing: "-0.5px", flexShrink: 0 }}>
          Artisan<span style={{ color: PRIMARY }}>+</span>
        </div>

        {/* Desktop : onglets de navigation centraux */}
        {isDesktop && (
          <div style={{ display: "flex", gap: "4px", flex: 1 }}>
            {[
              { id: "accueil",   icon: "🏠",  label: "Accueil"   },
              { id: "documents", icon: "📄",  label: "Documents" },
              { id: "clients",   icon: "👥",  label: "Clients"   },
              { id: "chantiers", icon: "🏗️", label: "Chantiers" },
              { id: "outils",    icon: "🔧",  label: "Outils"    },
            ].filter(tab => canAccess(tab.id)).map(tab => {
              const isActive = activeTab === tab.id && page !== "parametres";
              return (
                <button
                  key={tab.id}
                  onClick={() => { setPage("dashboard"); setActiveTab(tab.id); }}
                  style={{
                    background: isActive ? "rgba(255,140,0,0.12)" : "transparent",
                    border: `1.5px solid ${isActive ? "rgba(255,140,0,0.35)" : "transparent"}`,
                    color: isActive ? PRIMARY : "#8899aa",
                    borderRadius: "9px", padding: "8px 14px",
                    cursor: "pointer", fontSize: "14px", fontWeight: "700",
                    transition: "all 0.15s",
                    display: "flex", alignItems: "center", gap: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Boutons droite */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>

          {/* ── Badge récap mensuel ─────────────────────────── */}
          {recapBadge && (() => {
            const now = new Date();
            const prevMois = new Date(now.getFullYear(), now.getMonth()-1, 1);
            const moisFR = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
            return (
              <button
                onClick={() => {
                  setShowRecap(true);
                  setRecapBadge(false);
                  const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
                  localStorage.setItem(`recap_shown_${user.id}_${ym}`, "1");
                }}
                style={{
                  background: "linear-gradient(135deg,rgba(255,140,0,0.25),rgba(255,180,0,0.15))",
                  border: "1.5px solid rgba(255,140,0,0.5)",
                  color: PRIMARY,
                  borderRadius: "9px",
                  padding: isDesktop ? "8px 14px" : "0",
                  width: isDesktop ? "auto" : "36px",
                  height: isDesktop ? "auto" : "36px",
                  cursor: "pointer",
                  fontSize: isDesktop ? "12px" : "16px",
                  fontWeight: "800",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "5px", flexShrink: 0,
                  animation: "pulse 2s infinite",
                  position: "relative",
                }}>
                <span>🎉</span>
                {isDesktop && <span>Récap {moisFR[prevMois.getMonth()]} prêt !</span>}
                {!isDesktop && (
                  <div style={{ position:"absolute", top:"-4px", right:"-4px",
                    background:"#ff6b6b", borderRadius:"50%", width:"10px", height:"10px" }} />
                )}
              </button>
            );
          })()}

          {/* Bouton d'installation PWA (mobile + desktop) */}
          {canInstall && (
            <button
              onClick={handleInstall}
              title="Installer Artisan+ sur votre écran d'accueil"
              style={{
                background: "rgba(255,140,0,0.12)",
                border: "1.5px solid rgba(255,140,0,0.4)",
                color: PRIMARY,
                borderRadius: "9px",
                padding: isDesktop ? "8px 14px" : "0",
                width: isDesktop ? "auto" : "36px",
                height: isDesktop ? "auto" : "36px",
                cursor: "pointer",
                fontSize: isDesktop ? "13px" : "16px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                flexShrink: 0,
              }}
            >
              <span>📲</span>
              {isDesktop && <span>Installer</span>}
            </button>
          )}

          {/* ── Bouton hamburger ☰ ──────────────────────── */}
          <button
            onClick={() => setHamburgerOpen(o => !o)}
            title="Menu"
            style={{
              background: hamburgerOpen ? "rgba(255,140,0,0.12)" : "rgba(255,255,255,0.06)",
              border: `1.5px solid ${hamburgerOpen ? "rgba(255,140,0,0.4)" : "rgba(255,255,255,0.1)"}`,
              color: hamburgerOpen ? PRIMARY : "white",
              borderRadius: "9px",
              width: "40px", height: "40px",
              cursor: "pointer", padding: 0, flexShrink: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "5px",
              transition: "all 0.15s",
            }}
          >
            <span style={{ display: "block", width: "16px", height: "2px", background: "currentColor", borderRadius: "1px", transition: "all 0.2s" }} />
            <span style={{ display: "block", width: "16px", height: "2px", background: "currentColor", borderRadius: "1px", transition: "all 0.2s" }} />
            <span style={{ display: "block", width: "16px", height: "2px", background: "currentColor", borderRadius: "1px", transition: "all 0.2s" }} />
          </button>
        </div>
      </div>

      {/* ── CONTENU ─────────────────────────────────────────────── */}
      <div style={{
        padding: isDesktop ? "32px 40px 40px" : "16px 16px 96px 16px",
        maxWidth: isDesktop ? "1100px" : "none",
        margin: "0 auto",
      }}>

        {/* PARAMÈTRES */}
        {page === "parametres" && (
          <Parametres
            user={user}
            isDesktop={isDesktop}
            initialSection={parametresSection}
            onBack={() => { setPage("dashboard"); chargerProfil(); setParametresSection("profil"); }}
            onModeSimpleChange={(val) => setModeSimple(val)}
          />
        )}

        {/* ── MODE SIMPLIFIÉ ────────────────────────────────────── */}
        {page !== "parametres" && modeSimple && (
          <div style={{ maxWidth: "480px", margin: "0 auto", padding: "8px 0 24px" }}>

            {/* Bandeau "Repasser en mode normal" */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(255,140,0,0.07)", border: "1px solid rgba(255,140,0,0.2)",
              borderRadius: "12px", padding: "10px 16px", marginBottom: "28px", gap: "12px",
            }}>
              <span style={{ color: "#8899aa", fontSize: "13px" }}>📱 Mode simplifié actif</span>
              <button
                onClick={() => { setParametresSection("simplifie"); setPage("parametres"); }}
                style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#8899aa", borderRadius: "8px", padding: "6px 14px",
                  fontSize: "12px", fontWeight: "700", cursor: "pointer", flexShrink: 0,
                }}
              >🖥️ Mode normal</button>
            </div>

            {/* Vue client simplifiée */}
            {modeSimpleView === "clients" ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <button
                    onClick={() => setModeSimpleView(null)}
                    style={{
                      background: "transparent", border: "1px solid rgba(255,140,0,0.3)",
                      color: PRIMARY, borderRadius: "8px", padding: "8px 16px",
                      cursor: "pointer", fontSize: "14px",
                    }}
                  >← Retour</button>
                  <h2 style={{ color: "white", margin: 0, fontSize: "22px", fontWeight: "800" }}>👥 Mes clients</h2>
                </div>

                {/* Bouton ajouter client */}
                <button
                  onClick={() => { ouvrirModalAjout(); }}
                  style={{
                    width: "100%", background: "rgba(255,140,0,0.1)",
                    border: "2px dashed rgba(255,140,0,0.4)", color: PRIMARY,
                    borderRadius: "14px", padding: "14px", cursor: "pointer",
                    fontSize: "16px", fontWeight: "700", marginBottom: "16px",
                  }}
                >➕ Ajouter un client</button>

                {clients.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#556", padding: "40px 20px" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>👥</div>
                    <div style={{ color: "#8899aa" }}>Aucun client pour l'instant</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {clients.filter(c => !clientSearch || c.nom?.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                      <div key={c.id} style={{
                        background: CARD, borderRadius: "16px", padding: "18px",
                        border: "1px solid rgba(255,140,0,0.15)",
                      }}>
                        <div style={{ color: "white", fontWeight: "800", fontSize: "18px", marginBottom: "8px" }}>{c.nom}</div>
                        {c.adresse && <div style={{ color: "#8899aa", fontSize: "14px", marginBottom: "10px" }}>📍 {c.adresse}</div>}
                        {c.telephone && (
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <a href={`tel:${c.telephone}`} style={{
                              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                              gap: "6px", background: "#1a6f3c", color: "white",
                              borderRadius: "10px", padding: "12px", textDecoration: "none",
                              fontSize: "15px", fontWeight: "700",
                            }}>📞 Appeler</a>
                            <a href={`sms:${c.telephone}`} style={{
                              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                              gap: "6px", background: "#1a5f8f", color: "white",
                              borderRadius: "10px", padding: "12px", textDecoration: "none",
                              fontSize: "15px", fontWeight: "700",
                            }}>💬 SMS</a>
                          </div>
                        )}
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                          <button
                            onClick={() => { setClientPreSelectionne(c.id); setPage("nouveau-devis"); }}
                            style={{
                              flex: 1, background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)",
                              color: PRIMARY, borderRadius: "10px", padding: "10px",
                              cursor: "pointer", fontSize: "13px", fontWeight: "700",
                            }}
                          >📝 Nouveau devis</button>
                          <button
                            onClick={() => { setClientPreSelectionne(c.id); setPage("nouvelle-facture"); }}
                            style={{
                              flex: 1, background: "rgba(100,149,237,0.1)", border: "1px solid rgba(100,149,237,0.3)",
                              color: "#6495ED", borderRadius: "10px", padding: "10px",
                              cursor: "pointer", fontSize: "13px", fontWeight: "700",
                            }}
                          >📄 Nouvelle facture</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Modal client (partagé) */}
                {clientModal && (
                  <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 1000, padding: "20px"
                  }} onClick={e => { if (e.target === e.currentTarget) setClientModal(false); }}>
                    <div style={{ background: CARD, borderRadius: "20px", padding: "20px", width: "100%", maxWidth: "400px", border: "1px solid rgba(255,140,0,0.3)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={{ color: "white", margin: 0, fontSize: "18px" }}>➕ Nouveau client</h3>
                        <button onClick={() => setClientModal(false)} style={{ background: "transparent", border: "none", color: "#8899aa", fontSize: "22px", cursor: "pointer" }}>✕</button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {[
                          { champ: "nom", label: "Nom *", placeholder: "Jean Dupont" },
                          { champ: "telephone", label: "Téléphone", placeholder: "06 00 00 00 00" },
                          { champ: "adresse", label: "Adresse", placeholder: "12 rue des Tilleuls, 44000 Nantes" },
                        ].map(({ champ, label, placeholder }) => (
                          <div key={champ}>
                            <label style={{ color: "#8899aa", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>{label}</label>
                            <input
                              placeholder={placeholder}
                              value={clientForm[champ]}
                              onChange={e => setClientForm(f => ({ ...f, [champ]: e.target.value }))}
                              style={{ background: DARK, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "10px", padding: "12px 16px", color: "white", fontSize: "15px", outline: "none", width: "100%", boxSizing: "border-box" }}
                            />
                          </div>
                        ))}
                      </div>
                      {clientMessage && <div style={{ color: clientMessage.includes("✅") ? "#4CAF50" : "#ff6b6b", marginTop: "12px", fontSize: "13px", textAlign: "center" }}>{clientMessage}</div>}
                      <button
                        onClick={sauvegarderClient}
                        disabled={clientLoading}
                        style={{ width: "100%", background: clientLoading ? "#888" : PRIMARY, color: "white", border: "none", borderRadius: "10px", padding: "14px", fontSize: "16px", fontWeight: "700", cursor: clientLoading ? "not-allowed" : "pointer", marginTop: "16px" }}
                      >{clientLoading ? "Sauvegarde…" : "💾 Enregistrer"}</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* 3 boutons principaux */
              <div>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                  <div style={{ fontSize: "36px", fontWeight: "900", color: "white", marginBottom: "6px" }}>
                    Bonjour 👋
                  </div>
                  <div style={{ color: "#8899aa", fontSize: "15px" }}>Que voulez-vous faire ?</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[
                    { label: "📝 Nouveau devis", desc: "Créer et envoyer un devis", color: PRIMARY, action: () => setPage("nouveau-devis") },
                    { label: "📄 Nouvelle facture", desc: "Créer une facture professionnelle", color: "#6495ED", action: () => setPage("nouvelle-facture") },
                    { label: "👥 Mes clients", desc: "Voir et contacter vos clients", color: "#4CAF50", action: () => setModeSimpleView("clients") },
                  ].map(btn => (
                    <button
                      key={btn.label}
                      onClick={btn.action}
                      style={{
                        background: `${btn.color}18`,
                        border: `2px solid ${btn.color}55`,
                        color: btn.color,
                        borderRadius: "20px",
                        padding: "28px 24px",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${btn.color}28`; e.currentTarget.style.transform = "scale(1.01)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${btn.color}18`; e.currentTarget.style.transform = "scale(1)"; }}
                    >
                      <div style={{ fontSize: "26px", fontWeight: "900", marginBottom: "6px" }}>{btn.label}</div>
                      <div style={{ fontSize: "14px", opacity: 0.75, fontWeight: "500" }}>{btn.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Accès rapide aux devis récents */}
                {devis.length > 0 && (
                  <div style={{ marginTop: "28px" }}>
                    <div style={{ color: "#8899aa", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                      Devis récents
                    </div>
                    {devis.slice(0, 3).map(d => (
                      <div key={d.id} style={{
                        background: CARD, borderRadius: "12px", padding: "14px 16px",
                        border: "1px solid rgba(255,255,255,0.05)", marginBottom: "8px",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <div>
                          <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>{d.clients?.nom || "—"}</div>
                          <div style={{ color: "#8899aa", fontSize: "12px" }}>{d.numero}</div>
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ color: PRIMARY, fontWeight: "700", fontSize: "14px" }}>{d.total_ttc?.toFixed(0)} €</span>
                          <button
                            onClick={() => envoyerPourSignature(d)}
                            style={{
                              background: "rgba(255,140,0,0.12)", border: "1px solid rgba(255,140,0,0.3)",
                              color: PRIMARY, borderRadius: "8px", padding: "6px 12px",
                              cursor: "pointer", fontSize: "12px", fontWeight: "700",
                            }}
                          >✍️ Signer</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ONGLETS */}
        {page !== "parametres" && !modeSimple && <>

        {/* GARDE ACCÈS RÔLE ÉQUIPE */}
        {!canAccess(activeTab) && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "40vh", textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>🔒</div>
            <h2 style={{ color: "white", fontSize: "22px", marginBottom: "10px" }}>Accès non autorisé</h2>
            <p style={{ color: "#8899aa", fontSize: "15px", maxWidth: "320px", lineHeight: "1.6", margin: "0 0 20px" }}>
              Cette section n'est pas accessible avec votre rôle <strong style={{ color: PRIMARY }}>{teamRole}</strong>.<br />Contactez votre patron pour modifier vos droits.
            </p>
          </div>
        )}

        {/* ACCUEIL */}
        {activeTab === "accueil" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
              <h2 style={{ color: "white", fontSize: "24px", margin: 0, flex: 1 }}>
                {profil?.nom
                  ? <>Bonjour, <span style={{ color: PRIMARY }}>{profil.nom.split(" ")[0]}</span> 👋</>
                  : <>Bonjour 👋 Bienvenue sur Artisan<span style={{ color: PRIMARY }}>+</span></>
                }
              </h2>
              {profil?.verification_statut === "verifie" && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  background: "rgba(255,140,0,0.12)", border: "1.5px solid rgba(255,140,0,0.4)",
                  borderRadius: "30px", padding: "6px 16px",
                  color: PRIMARY, fontWeight: "800", fontSize: "12px",
                  flexShrink: 0,
                }}>
                  ✓ Artisan Vérifié
                </div>
              )}
              {profil?.verification_statut === "en_attente" && (
                <div
                  title="Votre demande de vérification est en cours d'examen"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    background: "rgba(255,140,0,0.06)", border: "1px solid rgba(255,140,0,0.2)",
                    borderRadius: "30px", padding: "5px 14px",
                    color: "#8899aa", fontWeight: "700", fontSize: "12px",
                    flexShrink: 0, cursor: "default",
                  }}>
                  ⏳ Vérification en cours
                </div>
              )}
            </div>
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

            {/* ── Invite à activer les notifications (si pas encore demandé) ── */}
            {"Notification" in window && notifPermission === "default" && (
              <div style={{
                background: "rgba(100,149,237,0.08)", border: "1px solid rgba(100,149,237,0.3)",
                borderRadius: "12px", padding: "14px 16px", marginBottom: "24px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                gap: "12px", flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "22px" }}>🔔</span>
                  <div>
                    <div style={{ color: "white", fontSize: "14px", fontWeight: "700" }}>
                      Activer les notifications
                    </div>
                    <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "2px" }}>
                      Recevez des alertes pour vos devis en attente et factures impayées
                    </div>
                  </div>
                </div>
                <button
                  onClick={requestNotifPermission}
                  style={{
                    background: "#6495ED", color: "white", border: "none",
                    borderRadius: "8px", padding: "9px 18px",
                    cursor: "pointer", fontSize: "13px", fontWeight: "700",
                    flexShrink: 0,
                  }}
                >
                  Activer
                </button>
              </div>
            )}
            {/* ══════════════════════════════════════════════════
                  STATS VISUELLES — 4 indicateurs clés
            ══════════════════════════════════════════════════ */}
            {(() => {
              const caPaye       = factures.filter(f => f.statut === "payee").reduce((s, f) => s + (f.total_ttc || 0), 0);
              const impayees     = factures.filter(f => f.statut !== "payee" && f.statut !== "annulee");
              const mtImpaye     = impayees.reduce((s, f) => s + (f.total_ttc || 0), 0);
              const devisAtt     = devis.filter(d => d.statut === "envoye" || d.statut === "en_attente");
              const chantiersEC  = chantiers.filter(c => c.statut === "en_cours");
              const fmt = (v) => v >= 1000
                ? (v / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " k€"
                : v.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";

              const cards = [
                {
                  label: "CA encaissé",
                  value: fmt(caPaye),
                  sub: `${factures.filter(f => f.statut === "payee").length} facture${factures.filter(f => f.statut === "payee").length !== 1 ? "s" : ""} payée${factures.filter(f => f.statut === "payee").length !== 1 ? "s" : ""}`,
                  icon: "💰",
                  color: PRIMARY,
                  accent: "rgba(255,140,0,0.15)",
                  border: "rgba(255,140,0,0.25)",
                  action: () => { setActiveTab("documents"); setDocSub("factures"); },
                },
                {
                  label: "À encaisser",
                  value: mtImpaye > 0 ? fmt(mtImpaye) : "À jour ✓",
                  sub: mtImpaye > 0 ? `${impayees.length} facture${impayees.length > 1 ? "s" : ""} impayée${impayees.length > 1 ? "s" : ""}` : "Aucune impayée",
                  icon: "⏰",
                  color: mtImpaye > 0 ? "#ff6b6b" : "#4CAF50",
                  accent: mtImpaye > 0 ? "rgba(255,107,107,0.12)" : "rgba(76,175,80,0.10)",
                  border: mtImpaye > 0 ? "rgba(255,107,107,0.28)" : "rgba(76,175,80,0.25)",
                  action: () => { setActiveTab("documents"); setDocSub("factures"); },
                },
                {
                  label: "Devis en attente",
                  value: devisAtt.length.toString(),
                  sub: devisAtt.length > 0 ? "En attente de signature" : "Aucun en attente",
                  icon: "✍️",
                  color: "#7ec8e3",
                  accent: "rgba(126,200,227,0.10)",
                  border: "rgba(126,200,227,0.22)",
                  action: () => { setActiveTab("documents"); setDocSub("devis"); },
                },
                {
                  label: "Chantiers actifs",
                  value: chantiersEC.length.toString(),
                  sub: chantiersEC.length > 0 ? "En cours" : "Aucun en cours",
                  icon: "🏗️",
                  color: "#ffb347",
                  accent: "rgba(255,179,71,0.10)",
                  border: "rgba(255,179,71,0.22)",
                  action: () => setActiveTab("chantiers"),
                },
              ];

              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                  {cards.map((c, i) => (
                    <div
                      key={i}
                      onClick={c.action}
                      style={{
                        background: c.accent, borderRadius: "16px", padding: "18px 16px",
                        border: `1px solid ${c.border}`, cursor: "pointer",
                        transition: "transform 0.15s, box-shadow 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${c.border}`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
                        <span style={{ fontSize: "16px" }}>{c.icon}</span>
                        <span style={{ color: "#8899aa", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.6px" }}>{c.label}</span>
                      </div>
                      <div style={{ color: c.color, fontSize: "22px", fontWeight: "800", marginBottom: "4px", letterSpacing: "-0.5px" }}>{c.value}</div>
                      <div style={{ color: "#445566", fontSize: "11px" }}>{c.sub}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* ══════════════════════════════════════════════════
                  GRAPHIQUE CA — 6 DERNIERS MOIS (SVG pur)
            ══════════════════════════════════════════════════ */}
            {(() => {
              const now = new Date();
              const moisData = Array.from({ length: 6 }, (_, i) => {
                const d     = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
                const label = d.toLocaleDateString("fr-FR", { month: "short" });
                const y = d.getFullYear(), m = d.getMonth();
                const ca = factures
                  .filter(f => { const fd = new Date(f.created_at); return fd.getFullYear() === y && fd.getMonth() === m && f.statut === "payee"; })
                  .reduce((s, f) => s + (f.total_ttc || 0), 0);
                const total = factures
                  .filter(f => { const fd = new Date(f.created_at); return fd.getFullYear() === y && fd.getMonth() === m; })
                  .reduce((s, f) => s + (f.total_ttc || 0), 0);
                return { label, ca, total };
              });
              const maxV  = Math.max(...moisData.map(m => m.total), 1);
              const W = 600, H = 130, PL = 8, PR = 8, barW = 72, gap = 12;
              const slotW = (W - PL - PR) / 6;

              return (
                <div style={{ background: CARD, borderRadius: "16px", padding: "20px 20px 16px", border: "1px solid rgba(255,140,0,0.15)", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "8px" }}>
                    <h3 style={{ color: "white", fontSize: "15px", fontWeight: "800", margin: 0 }}>📈 Chiffre d'affaires — 6 derniers mois</h3>
                    <div style={{ display: "flex", gap: "14px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#8899aa", fontSize: "11px" }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: PRIMARY, display: "inline-block" }} />Payé
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#8899aa", fontSize: "11px" }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "rgba(255,140,0,0.25)", display: "inline-block" }} />Total facturé
                      </span>
                    </div>
                  </div>
                  <div style={{ overflowX: "auto", marginLeft: "-4px" }}>
                    <svg viewBox={`0 0 ${W} ${H + 36}`} style={{ width: "100%", minWidth: "280px", display: "block" }} preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <linearGradient id="gPaye" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF8C00" />
                          <stop offset="100%" stopColor="rgba(255,140,0,0.25)" />
                        </linearGradient>
                        <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(255,140,0,0.28)" />
                          <stop offset="100%" stopColor="rgba(255,140,0,0.06)" />
                        </linearGradient>
                      </defs>
                      {/* Lignes de grille */}
                      {[0.25, 0.5, 0.75, 1].map(p => (
                        <line key={p} x1={PL} y1={H * (1 - p)} x2={W - PR} y2={H * (1 - p)}
                          stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
                      ))}
                      {/* Barres */}
                      {moisData.map(({ label, ca, total }, i) => {
                        const x = PL + i * slotW + (slotW - barW) / 2;
                        const hTotal = Math.max((total / maxV) * H, total > 0 ? 3 : 0);
                        const hCa    = Math.max((ca    / maxV) * H, ca    > 0 ? 3 : 0);
                        const isCurMonth = i === 5;
                        return (
                          <g key={i}>
                            {/* Barre total (fond) */}
                            <rect x={x} y={H - hTotal} width={barW} height={hTotal} rx={6} fill="url(#gTotal)" />
                            {/* Barre payé (avant) */}
                            <rect x={x} y={H - hCa} width={barW} height={hCa} rx={6} fill="url(#gPaye)" />
                            {/* Halo mois courant */}
                            {isCurMonth && <rect x={x - 3} y={0} width={barW + 6} height={H} rx={8} fill="rgba(255,140,0,0.04)" />}
                            {/* Label mois */}
                            <text x={x + barW / 2} y={H + 18} textAnchor="middle"
                              fill={isCurMonth ? PRIMARY : "#6677aa"} fontSize="11.5"
                              fontFamily="system-ui,sans-serif" fontWeight={isCurMonth ? "700" : "400"}>
                              {label}
                            </text>
                            {/* Valeur payée */}
                            {ca > 0 && (
                              <text x={x + barW / 2} y={H - hCa - 5} textAnchor="middle"
                                fill="#ffcc88" fontSize="9.5" fontFamily="system-ui,sans-serif" fontWeight="700">
                                {ca >= 1000 ? (ca / 1000).toFixed(1) + "k" : Math.round(ca)}€
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              );
            })()}

            {/* ══════════════════════════════════════════════════
                  CALCULATEUR DE RENTABILITÉ
            ══════════════════════════════════════════════════ */}
            {(() => {
              const th  = parseFloat(calc.tauxHoraire) || 0;
              const h   = parseFloat(calc.heuresMois)  || 0;
              const charges = (parseFloat(calc.carburant)  || 0)
                            + (parseFloat(calc.materiel)   || 0)
                            + (parseFloat(calc.assurance)  || 0)
                            + (parseFloat(calc.autres)     || 0);
              const ca       = th * h;
              const benefice = ca - charges;
              const seuilH   = th > 0 ? charges / th : 0;
              const tauxRent = ca > 0 ? Math.min((benefice / ca) * 100, 100) : 0;
              const hasResult = th > 0 && charges > 0;

              const cInp = {
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "9px", padding: "10px 12px", color: "white",
                fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box",
                fontFamily: "inherit",
              };

              return (
                <div style={{ background: CARD, borderRadius: "16px", padding: "20px 20px", border: "1px solid rgba(255,140,0,0.15)", marginBottom: "16px" }}>
                  <h3 style={{ color: "white", fontSize: "15px", fontWeight: "800", margin: "0 0 18px" }}>🧮 Calculateur de rentabilité</h3>

                  {/* Grille inputs */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginBottom: "18px" }}>
                    {[
                      { key: "tauxHoraire", label: "Taux horaire",  unit: "€/h",  placeholder: "ex: 45" },
                      { key: "heuresMois",  label: "Heures/mois",   unit: "h",    placeholder: "ex: 140" },
                      { key: "carburant",   label: "Carburant",     unit: "€/mois", placeholder: "ex: 200" },
                      { key: "materiel",    label: "Matériel/outillage", unit: "€/mois", placeholder: "ex: 300" },
                      { key: "assurance",   label: "Assurance",     unit: "€/mois", placeholder: "ex: 150" },
                      { key: "autres",      label: "Autres charges", unit: "€/mois", placeholder: "ex: 100" },
                    ].map(({ key, label, unit, placeholder }) => (
                      <div key={key}>
                        <div style={{ color: "#7788aa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                          {label} <span style={{ color: "#445566", fontWeight: "400", textTransform: "none" }}>({unit})</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          placeholder={placeholder}
                          value={calc[key]}
                          onChange={e => setCalc(p => ({ ...p, [key]: e.target.value }))}
                          style={cInp}
                          onFocus={e => e.target.style.borderColor = "rgba(255,140,0,0.5)"}
                          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Résultats — visibles dès qu'on a au moins le taux + une charge */}
                  {hasResult ? (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "18px" }}>
                      <div style={{ color: "#7788aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "14px" }}>
                        ⚡ Résultats
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginBottom: "16px" }}>
                        {[
                          { label: "Total charges", value: charges.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €/mois", color: "#ff6b6b", sub: "À couvrir chaque mois" },
                          { label: "CA brut",        value: ca > 0 ? ca.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €/mois" : "—", color: "#7ec8e3", sub: h > 0 ? `${h}h × ${th}€` : "Renseignez les heures" },
                          { label: "Bénéfice net",   value: ca > 0 ? (benefice >= 0 ? "+" : "") + benefice.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €/mois" : "—", color: benefice >= 0 ? "#4CAF50" : "#ff6b6b", sub: ca > 0 ? (benefice >= 0 ? "Vous êtes rentable ✓" : "En dessous du seuil ⚠️") : "" },
                          { label: "Seuil de rentabilité", value: seuilH > 0 ? Math.ceil(seuilH) + " h/mois" : "—", color: PRIMARY, sub: "Heures min. pour couvrir les charges" },
                        ].map(({ label, value, color, sub }) => (
                          <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px 14px", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ color: "#7788aa", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{label}</div>
                            <div style={{ color, fontSize: "18px", fontWeight: "800", marginBottom: "3px" }}>{value}</div>
                            <div style={{ color: "#445566", fontSize: "11px" }}>{sub}</div>
                          </div>
                        ))}
                      </div>
                      {/* Barre de rentabilité */}
                      {ca > 0 && (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                            <span style={{ color: "#7788aa", fontSize: "11px" }}>Taux de marge nette</span>
                            <span style={{ color: tauxRent >= 0 ? "#4CAF50" : "#ff6b6b", fontSize: "12px", fontWeight: "700" }}>
                              {benefice >= 0 ? "+" : ""}{tauxRent.toFixed(1)}%
                            </span>
                          </div>
                          <div style={{ height: "7px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{
                              height: "100%", borderRadius: "4px",
                              width: `${Math.max(0, Math.min(tauxRent, 100))}%`,
                              background: tauxRent > 25 ? "linear-gradient(90deg, #4CAF50, #81C784)" : tauxRent > 0 ? `linear-gradient(90deg, ${PRIMARY}, #ffb347)` : "#ff6b6b",
                              transition: "width 0.5s ease",
                            }} />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px", color: "#445566", fontSize: "13px", textAlign: "center" }}>
                      Renseignez votre taux horaire et vos charges pour voir vos résultats
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ══════════════════════════════════════════════════
                  CHECKLIST DE DÉMARRAGE
            ══════════════════════════════════════════════════ */}
            {(() => {
              const etapes = [
                {
                  done: !!(profil?.nom && profil?.siret),
                  label: "Remplir mon profil (nom & SIRET)",
                  action: () => { setParametresSection("profil"); setPage("parametres"); },
                },
                {
                  done: clients.length > 0,
                  label: "Ajouter mon premier client",
                  action: () => setActiveTab("clients"),
                },
                {
                  done: devis.length > 0,
                  label: "Créer mon premier devis",
                  action: () => { setActiveTab("documents"); setDocSub("devis"); },
                },
                {
                  done: chantiers.length > 0,
                  label: "Créer mon premier chantier",
                  action: () => setActiveTab("chantiers"),
                },
              ];
              const nbFait = etapes.filter(e => e.done).length;
              const pct    = Math.round((nbFait / etapes.length) * 100);
              const tout   = nbFait === etapes.length;

              return (
                <div style={{
                  background: CARD, borderRadius: "16px", padding: "20px 22px",
                  border: "1px solid rgba(255,140,0,0.15)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ color: "white", fontSize: "15px", fontWeight: "800", margin: 0 }}>
                      {tout ? "🎉 Vous êtes prêt !" : "⚡ Pour bien démarrer"}
                    </h3>
                    <span style={{ color: tout ? "#4CAF50" : PRIMARY, fontSize: "13px", fontWeight: "700" }}>
                      {nbFait}/{etapes.length}
                    </span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", marginBottom: "16px" }}>
                    <div style={{
                      height: "100%", borderRadius: "3px", transition: "width 0.6s ease",
                      width: `${pct}%`,
                      background: tout ? "linear-gradient(90deg, #4CAF50, #81C784)" : `linear-gradient(90deg, ${PRIMARY}, #ffb347)`,
                    }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {etapes.map(({ done, label, action }) => (
                      <div
                        key={label}
                        onClick={done ? undefined : action}
                        style={{
                          display: "flex", alignItems: "center", gap: "12px",
                          padding: "10px 12px", borderRadius: "10px",
                          cursor: done ? "default" : "pointer",
                          background: done ? "rgba(76,175,80,0.06)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${done ? "rgba(76,175,80,0.18)" : "rgba(255,255,255,0.05)"}`,
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={e => { if (!done) e.currentTarget.style.background = "rgba(255,140,0,0.06)"; }}
                        onMouseLeave={e => { if (!done) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                      >
                        <div style={{
                          width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                          background: done ? "rgba(76,175,80,0.2)" : "transparent",
                          border: `2px solid ${done ? "#4CAF50" : "rgba(255,255,255,0.2)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "11px", color: "#4CAF50", fontWeight: "900",
                        }}>
                          {done ? "✓" : ""}
                        </div>
                        <span style={{
                          color: done ? "#4CAF50" : "white", fontSize: "14px", fontWeight: "500",
                          textDecoration: done ? "line-through" : "none", opacity: done ? 0.65 : 1, flex: 1,
                        }}>{label}</span>
                        {!done && <span style={{ color: PRIMARY, fontSize: "14px", flexShrink: 0 }}>→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ══════════════════════════════════════════════════
                  ASSISTANT COMPTABLE
            ══════════════════════════════════════════════════ */}
            {(() => {
              const now   = new Date();
              const annee = now.getFullYear();
              const mois  = now.getMonth(); // 0-based
              // Trimestre actuel (0=Q1, 1=Q2, 2=Q3, 3=Q4)
              const q       = Math.floor(mois / 3);
              const qStart  = new Date(annee, q * 3, 1);
              const qEnd    = new Date(annee, q * 3 + 3, 0, 23, 59, 59);
              const yrStart = new Date(annee, 0, 1);

              // Factures payées ce trimestre
              const facturesPayeesQ = factures.filter(f => {
                if (f.statut !== "payee") return false;
                const d = new Date(f.created_at);
                return d >= qStart && d <= qEnd;
              });
              const caHtQ  = facturesPayeesQ.reduce((s, f) => s + (f.total_ht  || 0), 0);
              const tvaTauxQ = facturesPayeesQ.reduce((s, f) => s + (f.tva || 20) * (f.total_ht || 0), 0) / (facturesPayeesQ.reduce((s, f) => s + (f.total_ht || 0), 0) || 1) / 100;
              const tvaQ   = facturesPayeesQ.reduce((s, f) => s + ((f.total_ttc || 0) - (f.total_ht || 0)), 0);

              // CA annuel HT
              const caHtAn = factures.filter(f => f.statut === "payee" && new Date(f.created_at) >= yrStart)
                              .reduce((s, f) => s + (f.total_ht || 0), 0);
              const SEUIL_AE = 77700;
              const caRestant = Math.max(0, SEUIL_AE - caHtAn);
              const pctUtilise = Math.min(100, (caHtAn / SEUIL_AE) * 100);

              // URSSAF (artisan BTP, régime auto-entrepreneur : 21.2%)
              const urssafQ = caHtQ * 0.212;

              // Trésorerie prévisionnelle 3 mois (factures en attente)
              const impayees = factures.filter(f => f.statut !== "payee" && f.statut !== "annulee");
              const mois1Start = new Date(now); mois1Start.setHours(0,0,0,0);
              const mois1End   = new Date(now); mois1End.setDate(mois1End.getDate() + 30);
              const mois2End   = new Date(now); mois2End.setDate(mois2End.getDate() + 60);
              const mois3End   = new Date(now); mois3End.setDate(mois3End.getDate() + 90);
              const estimDate  = (f) => { const d = new Date(f.created_at); d.setDate(d.getDate() + 30); return d; };
              const trM1 = impayees.filter(f => { const d = estimDate(f); return d >= mois1Start && d <= mois1End; }).reduce((s,f) => s + (f.total_ttc || 0), 0);
              const trM2 = impayees.filter(f => { const d = estimDate(f); return d > mois1End && d <= mois2End; }).reduce((s,f) => s + (f.total_ttc || 0), 0);
              const trM3 = impayees.filter(f => { const d = estimDate(f); return d > mois2End && d <= mois3End; }).reduce((s,f) => s + (f.total_ttc || 0), 0);

              const fmt   = (v) => v.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
              const nomQ  = ["1er", "2e", "3e", "4e"][q] + " trimestre " + annee;
              const alerteSeuil = caRestant < 10000 && caRestant >= 0;
              const alerteCreux = trM1 < 500 || trM2 < 500 || trM3 < 500;

              return (
                <div style={{ marginTop: "24px" }}>
                  {/* Toggle */}
                  <button onClick={() => setShowComptable(v => !v)} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                    background: CARD, border: "1px solid rgba(255,140,0,0.2)", borderRadius: "16px",
                    padding: "16px 20px", cursor: "pointer", color: "white",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "22px" }}>💶</span>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: "700", fontSize: "15px" }}>Assistant Comptable</div>
                        <div style={{ color: "#8899aa", fontSize: "12px" }}>TVA, URSSAF, trésorerie prévisionnelle</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {(alerteSeuil || alerteCreux) && <span style={{ background: "#ff6b6b", color: "white", borderRadius: "20px", padding: "2px 8px", fontSize: "11px", fontWeight: "700" }}>⚠️</span>}
                      <span style={{ color: PRIMARY, fontSize: "18px", transition: "transform 0.2s", transform: showComptable ? "rotate(180deg)" : "none" }}>▾</span>
                    </div>
                  </button>

                  {showComptable && (
                    <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "10px" }}>

                      {/* TVA + URSSAF */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div style={{ background: CARD, borderRadius: "14px", padding: "16px", border: "1px solid rgba(255,140,0,0.15)" }}>
                          <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>TVA à reverser</div>
                          <div style={{ color: "#ff6b6b", fontSize: "22px", fontWeight: "900" }}>{fmt(tvaQ)}</div>
                          <div style={{ color: "#8899aa", fontSize: "11px", marginTop: "4px" }}>{nomQ}</div>
                        </div>
                        <div style={{ background: CARD, borderRadius: "14px", padding: "16px", border: "1px solid rgba(255,140,0,0.15)" }}>
                          <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>URSSAF estimé</div>
                          <div style={{ color: "#FFA500", fontSize: "22px", fontWeight: "900" }}>{fmt(urssafQ)}</div>
                          <div style={{ color: "#8899aa", fontSize: "11px", marginTop: "4px" }}>21,2% · {nomQ}</div>
                        </div>
                      </div>

                      {/* Seuil auto-entrepreneur */}
                      <div style={{ background: CARD, borderRadius: "14px", padding: "16px", border: alerteSeuil ? "1px solid rgba(255,107,107,0.4)" : "1px solid rgba(255,140,0,0.15)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>CA Auto-Entrepreneur {annee}</div>
                          <div style={{ color: alerteSeuil ? "#ff6b6b" : "white", fontWeight: "700", fontSize: "13px" }}>{fmt(caHtAn)} / {fmt(SEUIL_AE)}</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "6px", height: "10px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pctUtilise}%`, background: alerteSeuil ? "linear-gradient(90deg, #ff6b6b, #ff4444)" : `linear-gradient(90deg, ${PRIMARY}, #ffb347)`, borderRadius: "6px", transition: "width 0.5s" }} />
                        </div>
                        <div style={{ marginTop: "6px", display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#8899aa", fontSize: "11px" }}>{pctUtilise.toFixed(0)}% utilisé</span>
                          <span style={{ color: alerteSeuil ? "#ff6b6b" : "#4CAF50", fontWeight: "700", fontSize: "12px" }}>
                            {alerteSeuil ? `⚠️ Plus que ${fmt(caRestant)} restant !` : `${fmt(caRestant)} restant`}
                          </span>
                        </div>
                        {alerteSeuil && (
                          <div style={{ marginTop: "8px", padding: "8px 10px", background: "rgba(255,107,107,0.1)", borderRadius: "8px", color: "#ff6b6b", fontSize: "12px" }}>
                            ⚠️ Vous approchez du seuil auto-entrepreneur. Consultez votre comptable pour envisager un changement de régime.
                          </div>
                        )}
                      </div>

                      {/* Trésorerie prévisionnelle */}
                      <div style={{ background: CARD, borderRadius: "14px", padding: "16px", border: alerteCreux ? "1px solid rgba(255,107,107,0.3)" : "1px solid rgba(255,140,0,0.15)" }}>
                        <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                          📈 Trésorerie prévisionnelle (factures en attente)
                        </div>
                        {[
                          { label: "30 prochains jours", val: trM1 },
                          { label: "31–60 jours",        val: trM2 },
                          { label: "61–90 jours",        val: trM3 },
                        ].map((m, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                            <span style={{ color: "#aabbcc", fontSize: "13px" }}>{m.label}</span>
                            <span style={{ color: m.val < 500 ? "#ff6b6b" : m.val > 2000 ? "#4CAF50" : PRIMARY, fontWeight: "700", fontSize: "15px" }}>
                              {m.val < 500 ? "⚠️ " : ""}{fmt(m.val)}
                            </span>
                          </div>
                        ))}
                        {alerteCreux && (
                          <div style={{ marginTop: "10px", padding: "8px 10px", background: "rgba(255,107,107,0.1)", borderRadius: "8px", color: "#ff6b6b", fontSize: "12px" }}>
                            ⚠️ Creux de trésorerie détecté. Relancez vos factures impayées ou créez de nouveaux devis.
                          </div>
                        )}
                        <div style={{ marginTop: "10px", color: "#556677", fontSize: "11px" }}>
                          * Estimation basée sur les factures émises non encore payées (délai moyen 30 j)
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* DOCUMENTS — sous-onglets */}
        {activeTab === "documents" && (
          <div style={{
            display: "flex", gap: "8px", marginBottom: "20px",
            background: CARD, borderRadius: "14px", padding: "6px",
            border: "1px solid rgba(255,140,0,0.15)",
            overflowX: "auto",
          }}>
            {[
              { id: "factures",  icon: "📄", label: "Factures"  },
              { id: "devis",     icon: "📝", label: "Devis"     },
              { id: "catalogue", icon: "📦", label: "Catalogue" },
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setDocSub(sub.id)}
                style={{
                  flex: 1, background: docSub === sub.id ? "rgba(255,140,0,0.15)" : "transparent",
                  border: `1.5px solid ${docSub === sub.id ? "rgba(255,140,0,0.4)" : "transparent"}`,
                  color: docSub === sub.id ? PRIMARY : "#8899aa",
                  borderRadius: "10px", padding: "9px 12px",
                  cursor: "pointer", fontSize: "14px", fontWeight: "700",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                <span>{sub.icon}</span>
                <span>{sub.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* FACTURES */}
        {activeTab === "documents" && docSub === "factures" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "12px", flexWrap: "wrap" }}>
              <h2 style={{ color: "white", fontSize: "22px", margin: 0 }}>📄 Mes Factures</h2>
              <button
                onClick={() => {
                  if (!isPro && factures.length >= 3) {
                    ouvrirUpgrade("factures");
                  } else {
                    setPage("nouvelle-facture");
                  }
                }}
                style={{
                  background: PRIMARY, color: "white", border: "none",
                  borderRadius: "10px", padding: "11px 18px",
                  fontSize: "14px", fontWeight: "700", cursor: "pointer", flexShrink: 0
                }}
              >+ Nouvelle facture</button>
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
                    background: CARD, borderRadius: "16px", padding: "16px",
                    border: "1px solid rgba(255,140,0,0.15)"
                  }}>
                    {/* Ligne 1 : numéro + montant */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>{f.numero}</div>
                        <div style={{ color: "#8899aa", fontSize: "13px", marginTop: "3px" }}>
                          {f.clients?.nom} — {new Date(f.created_at).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                      <span style={{ color: PRIMARY, fontWeight: "800", fontSize: "18px", flexShrink: 0, marginLeft: "12px" }}>
                        {f.total_ttc?.toFixed(2)} €
                      </span>
                    </div>
                    {/* Ligne 2 : statut + actions */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <span style={{ color: statutColor(f.statut), fontSize: "13px", fontWeight: "600" }}>
                        {statutLabel(f.statut)}
                      </span>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => changerStatutFacture(f)}
                          style={{
                            background: f.statut === "payee" ? "rgba(136,153,170,0.1)" : "rgba(76,175,80,0.1)",
                            border: `1px solid ${f.statut === "payee" ? "rgba(136,153,170,0.3)" : "rgba(76,175,80,0.3)"}`,
                            color: f.statut === "payee" ? "#8899aa" : "#4CAF50",
                            borderRadius: "8px", padding: "7px 10px",
                            cursor: "pointer", fontSize: "12px", fontWeight: "600",
                          }}
                        >
                          {f.statut === "payee" ? "↩️ Non payée" : "✅ Payée"}
                        </button>
                        <button onClick={() => telechargerPDF(f)} style={{
                          background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)",
                          color: PRIMARY, borderRadius: "8px", padding: "7px 10px",
                          cursor: "pointer", fontSize: "12px", fontWeight: "600"
                        }}>📄 PDF</button>
                        <button onClick={() => supprimerFacture(f.id)} style={{
                          background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.3)",
                          color: "#ff6b6b", borderRadius: "8px", padding: "7px 10px",
                          cursor: "pointer", fontSize: "13px"
                        }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DEVIS */}
        {activeTab === "documents" && docSub === "devis" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "12px", flexWrap: "wrap" }}>
              <h2 style={{ color: "white", fontSize: "22px", margin: 0 }}>📝 Mes Devis</h2>
              <button
                onClick={() => {
                  if (!isPro && devis.length >= 3) {
                    ouvrirUpgrade("devis");
                  } else {
                    setPage("nouveau-devis");
                  }
                }}
                style={{
                  background: PRIMARY, color: "white", border: "none",
                  borderRadius: "10px", padding: "11px 18px",
                  fontSize: "14px", fontWeight: "700", cursor: "pointer", flexShrink: 0
                }}
              >+ Nouveau devis</button>
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
                    background: CARD, borderRadius: "16px", padding: "16px",
                    border: "1px solid rgba(255,140,0,0.15)"
                  }}>
                    {/* Ligne 1 : numéro + montant */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>{d.numero}</div>
                        <div style={{ color: "#8899aa", fontSize: "13px", marginTop: "3px" }}>
                          {d.clients?.nom} — {new Date(d.created_at).toLocaleDateString("fr-FR")}
                          {d.date_validite && ` — Valide jusqu'au ${new Date(d.date_validite).toLocaleDateString("fr-FR")}`}
                        </div>
                      </div>
                      <span style={{ color: PRIMARY, fontWeight: "800", fontSize: "18px", flexShrink: 0, marginLeft: "12px" }}>
                        {d.total_ttc?.toFixed(2)} €
                      </span>
                    </div>
                    {/* Ligne 2 : statut */}
                    <div style={{ marginBottom: "10px" }}>
                      <span style={{ color: statutColor(d.statut), fontSize: "13px", fontWeight: "600" }}>
                        {statutLabel(d.statut)}
                      </span>
                    </div>
                    {/* Ligne 3 : boutons actions */}
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button onClick={() => telechargerDevisPDF(d)} style={{
                        background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)",
                        color: PRIMARY, borderRadius: "8px", padding: "8px 12px",
                        cursor: "pointer", fontSize: "13px", fontWeight: "600"
                      }}>📄 PDF</button>
                      <button onClick={() => envoyerPourSignature(d)} style={{
                        background: "rgba(100,149,237,0.1)", border: "1px solid rgba(100,149,237,0.3)",
                        color: "#6495ED", borderRadius: "8px", padding: "8px 12px",
                        cursor: "pointer", fontSize: "13px", fontWeight: "600"
                      }}>🔗 Envoyer</button>
                      <button onClick={() => ouvrirQRModal(d)} style={{
                        background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)",
                        color: "#a855f7", borderRadius: "8px", padding: "8px 12px",
                        cursor: "pointer", fontSize: "13px", fontWeight: "600"
                      }}>📱 QR Code</button>
                      <button onClick={() => convertirEnFacture(d)} style={{
                        background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.3)",
                        color: "#4CAF50", borderRadius: "8px", padding: "8px 12px",
                        cursor: "pointer", fontSize: "13px", fontWeight: "600"
                      }}>✅ Facturer</button>
                      {(d.statut === "accepte" || d.statut === "signe") && (
                        <button onClick={() => { setAcompteModal(d); setAcomptePct(30); setAcompteCustom(""); }} style={{
                          background: "rgba(255,140,0,0.12)", border: "1.5px solid rgba(255,140,0,0.5)",
                          color: PRIMARY, borderRadius: "8px", padding: "8px 12px",
                          cursor: "pointer", fontSize: "13px", fontWeight: "700"
                        }}>💰 Acompte</button>
                      )}
                      <button onClick={() => supprimerDevis(d.id)} style={{
                        background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.3)",
                        color: "#ff6b6b", borderRadius: "8px", padding: "8px 12px",
                        cursor: "pointer", fontSize: "13px"
                      }}>🗑️</button>
                    </div>
                    {lienCopie === d.id && (
                      <div style={{
                        background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.3)",
                        borderRadius: "8px", padding: "10px 14px", marginTop: "10px",
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

        {/* CATALOGUE */}
        {activeTab === "documents" && docSub === "catalogue" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px", flexWrap: "wrap" }}>
              <h2 style={{ color: "white", fontSize: "22px", margin: 0 }}>📦 Catalogue de prestations</h2>
              <button
                onClick={() => setShowCatalogueModal(true)}
                style={{
                  background: PRIMARY, color: "white", border: "none",
                  borderRadius: "10px", padding: "11px 18px",
                  fontSize: "14px", fontWeight: "700", cursor: "pointer", flexShrink: 0,
                }}
              >✏️ Gérer le catalogue</button>
            </div>
            <div style={{
              background: CARD, borderRadius: "16px", padding: "40px 32px",
              border: "1px solid rgba(255,140,0,0.15)", textAlign: "center",
            }}>
              <div style={{ fontSize: "52px", marginBottom: "16px" }}>📦</div>
              <div style={{ color: "white", fontWeight: "700", fontSize: "17px", marginBottom: "8px" }}>
                Vos prestations habituelles
              </div>
              <div style={{ color: "#8899aa", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px", maxWidth: "360px", margin: "0 auto 24px" }}>
                Enregistrez vos articles, fournitures et prestations avec leurs prix unitaires.
                Insérez-les ensuite en 1 clic dans vos devis et factures.
              </div>
              <button
                onClick={() => setShowCatalogueModal(true)}
                style={{
                  background: "rgba(255,140,0,0.12)", color: PRIMARY,
                  border: "1.5px solid rgba(255,140,0,0.35)",
                  borderRadius: "12px", padding: "13px 28px",
                  fontSize: "15px", fontWeight: "700", cursor: "pointer",
                }}
              >📋 Ouvrir le catalogue</button>
            </div>
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
                          padding: "14px 16px", display: "flex",
                          alignItems: "flex-start", gap: "12px", cursor: "pointer"
                        }} onClick={() => setClientDetailId(isOpen ? null : c.id)}>

                          {/* Avatar */}
                          <div style={{
                            width: "42px", height: "42px", borderRadius: "50%",
                            background: "rgba(255,140,0,0.15)", display: "flex",
                            alignItems: "center", justifyContent: "center",
                            fontSize: "17px", fontWeight: "700", color: PRIMARY, flexShrink: 0
                          }}>
                            {c.nom?.charAt(0)?.toUpperCase() || "?"}
                          </div>

                          {/* Contenu central */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Nom + appréc + garantie */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <span style={{ color: "white", fontWeight: "700", fontSize: "15px" }}>{c.nom}</span>
                              {c.appreciation && (
                                <span style={{ fontSize: "14px" }} title={c.appreciation}>{
                                  c.appreciation === "Excellent" ? "⭐" :
                                  c.appreciation === "Bien" ? "👍" :
                                  c.appreciation === "Moyen" ? "😐" : "👎"
                                }</span>
                              )}
                              {garantieStatut === "expire" && (
                                <span style={{ background: "rgba(255,100,100,0.15)", color: "#ff6b6b", fontSize: "10px", fontWeight: "700", borderRadius: "5px", padding: "2px 6px" }}>🛡️ Expirée</span>
                              )}
                              {garantieStatut === "alerte" && (
                                <span style={{ background: "rgba(255,140,0,0.15)", color: PRIMARY, fontSize: "10px", fontWeight: "700", borderRadius: "5px", padding: "2px 6px" }}>🛡️ &lt; 3 mois</span>
                              )}
                            </div>
                            {/* Tags + contact */}
                            <div style={{ display: "flex", gap: "5px", marginTop: "4px", flexWrap: "wrap", alignItems: "center" }}>
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
                              {(c.email || c.telephone) && (
                                <span style={{ color: "#8899aa", fontSize: "12px" }}>
                                  {[c.telephone, c.email].filter(Boolean).join(" · ")}
                                </span>
                              )}
                            </div>
                            {/* Stats compactes */}
                            <div style={{ display: "flex", gap: "12px", marginTop: "7px", flexWrap: "wrap" }}>
                              <span style={{ color: PRIMARY, fontSize: "12px", fontWeight: "700" }}>📄 {nbFactures} facture{nbFactures !== 1 ? "s" : ""}</span>
                              <span style={{ color: "#6495ED", fontSize: "12px", fontWeight: "700" }}>📝 {nbDevis} devis</span>
                              <span style={{ color: "#4CAF50", fontSize: "12px", fontWeight: "700" }}>💰 {caTotal.toFixed(0)} €</span>
                            </div>
                          </div>

                          {/* Droite : boutons + chevron */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                            <div style={{ display: "flex", gap: "6px" }} onClick={e => e.stopPropagation()}>
                              <button onClick={() => ouvrirModalEdition(c)} style={{
                                background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)",
                                color: PRIMARY, borderRadius: "8px", padding: "7px 10px",
                                cursor: "pointer", fontSize: "13px"
                              }}>✏️</button>
                              <button onClick={() => supprimerClient(c.id)} style={{
                                background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.3)",
                                color: "#ff6b6b", borderRadius: "8px", padding: "7px 10px",
                                cursor: "pointer", fontSize: "13px"
                              }}>🗑️</button>
                            </div>
                            <span style={{ color: "#8899aa", fontSize: "16px", transition: "transform 0.2s", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
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
                          <div style={{ borderTop: "1px solid rgba(255,140,0,0.1)", padding: "12px 16px 16px" }}>
                            <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Historique</div>
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

                        {/* ── Chantiers liés ──────────────────────────────── */}
                        {isOpen && (() => {
                          const chantiersClient = chantiers.filter(ch => ch.client_id === c.id);
                          return (
                            <div style={{ borderTop: "1px solid rgba(255,140,0,0.1)", padding: "12px 16px 16px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                  🏗️ Chantiers ({chantiersClient.length})
                                </div>
                                <button
                                  onClick={e => { e.stopPropagation(); setClientChantierPreselect(c.id); setActiveTab("chantiers"); }}
                                  style={{
                                    background: "rgba(255,140,0,0.12)", border: "1px solid rgba(255,140,0,0.3)",
                                    color: PRIMARY, borderRadius: "7px", padding: "5px 12px",
                                    fontSize: "12px", fontWeight: "700", cursor: "pointer"
                                  }}
                                >＋ Nouveau chantier</button>
                              </div>
                              {chantiersClient.length === 0 ? (
                                <div style={{ color: "#555", fontSize: "12px", fontStyle: "italic" }}>Aucun chantier lié à ce client</div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                  {chantiersClient.map(ch => {
                                    const st = STATUT_CHANTIER[ch.statut] || { label: ch.statut, color: "#8899aa", bg: "rgba(136,153,170,0.15)" };
                                    return (
                                      <div key={ch.id} style={{
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        background: "rgba(255,140,0,0.04)", borderRadius: "8px", padding: "9px 12px",
                                        border: "1px solid rgba(255,140,0,0.1)"
                                      }}>
                                        <span style={{ color: "white", fontSize: "13px", fontWeight: "600", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{ch.nom}</span>
                                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0, marginLeft: "8px" }}>
                                          <span style={{ background: st.bg, color: st.color, fontSize: "11px", fontWeight: "700", borderRadius: "5px", padding: "2px 7px", whiteSpace: "nowrap" }}>
                                            {st.label}
                                          </span>
                                          {(ch.prix_chantier || 0) > 0 && (
                                            <span style={{ color: PRIMARY, fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap" }}>
                                              {(ch.prix_chantier || 0).toFixed(0)} €
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}
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
                  background: CARD, borderRadius: "20px", padding: "20px",
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
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
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
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
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
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
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
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
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
          <Chantiers
            user={user}
            isPro={isPro}
            onUpgrade={() => ouvrirUpgrade("chantiers")}
            clientInitialId={clientChantierPreselect}
            onClientInitialIdHandled={() => setClientChantierPreselect(null)}
            onCreerDevis={(clientId) => {
              setClientPreSelectionne(clientId || null);
              setPage("nouveau-devis");
            }}
            onCreerFacture={(clientId) => {
              setClientPreSelectionne(clientId || null);
              setPage("nouvelle-facture");
            }}
          />
        )}

        {/* AGENDA */}
        {activeTab === "agenda" && (
          <Agenda
            user={user}
            profil={profil}
            clients={clients}
            chantiers={chantiers}
          />
        )}

        {/* OUTILS */}
        {activeTab === "outils" && (
          <Outils user={user} profil={profil} />
        )}
        </>}
      </div>

      {/* ── CATALOGUE PRESTATIONS (modal) ───────────────────────── */}
      {showCatalogueModal && (
        <CataloguePrestations
          user={user}
          onSelectArticle={() => {}}
          onClose={() => setShowCatalogueModal(false)}
        />
      )}

      {/* ── RÉCAP MENSUEL (overlay plein écran) ─────────────────── */}
      {showRecap && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 600,
          background: "#0a1628", overflowY: "auto",
        }}>
          <RecapMensuel user={user} profil={profil} onClose={() => setShowRecap(false)} />
        </div>
      )}

      {/* ── BOTTOM NAV mobile : 5 onglets ───────────────────────── */}
      {!isDesktop && <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
        background: CARD,
        borderTop: "1px solid rgba(255,140,0,0.18)",
        display: "flex",
        height: "64px",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        {[
          { id: "accueil",   icon: "🏠",  label: "Accueil"   },
          { id: "documents", icon: "📄",  label: "Docs"      },
          { id: "clients",   icon: "👥",  label: "Clients"   },
          { id: "chantiers", icon: "🏗️", label: "Chantiers" },
          { id: "outils",    icon: "🔧",  label: "Outils"    },
        ].filter(tab => canAccess(tab.id)).map(tab => {
          const isActive = activeTab === tab.id && page !== "parametres";
          return (
            <button
              key={tab.id}
              onClick={() => { setPage("dashboard"); setActiveTab(tab.id); }}
              style={{
                flex: 1, background: "transparent", border: "none",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: "2px", cursor: "pointer",
                color: isActive ? PRIMARY : "#8899aa",
                transition: "color 0.15s",
                position: "relative",
                minWidth: 0, padding: "4px 2px",
              }}
            >
              <span style={{ fontSize: "20px", lineHeight: 1 }}>{tab.icon}</span>
              <span style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
                {tab.label}
              </span>
              {isActive && (
                <div style={{
                  position: "absolute", bottom: 0, width: "28px", height: "2px",
                  background: PRIMARY, borderRadius: "1px",
                }} />
              )}
            </button>
          );
        })}
      </nav>}

      {/* ── MENU HAMBURGER (panneau latéral droit) ───────────────── */}
      {hamburgerOpen && (
        <>
          {/* Overlay fond */}
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 998,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(3px)",
            }}
            onClick={() => setHamburgerOpen(false)}
          />

          {/* Panneau */}
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 999,
            width: "min(300px, 88vw)",
            background: CARD,
            borderLeft: "1px solid rgba(255,140,0,0.2)",
            display: "flex", flexDirection: "column",
            animation: "slideInRight 0.22s ease",
            boxShadow: "-8px 0 48px rgba(0,0,0,0.5)",
            overflowY: "auto",
          }}>

            {/* En-tête utilisateur */}
            <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ fontSize: "20px", fontWeight: "900", color: "white" }}>
                  Artisan<span style={{ color: PRIMARY }}>+</span>
                </div>
                <button
                  onClick={() => setHamburgerOpen(false)}
                  style={{
                    background: "rgba(255,255,255,0.06)", border: "none",
                    color: "#8899aa", cursor: "pointer", fontSize: "15px",
                    borderRadius: "50%", width: "32px", height: "32px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >✕</button>
              </div>

              {/* Avatar + nom + email */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{
                  width: "44px", height: "44px", borderRadius: "50%",
                  background: "rgba(255,140,0,0.15)", border: "2px solid rgba(255,140,0,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: PRIMARY, fontSize: "18px", fontWeight: "800", flexShrink: 0,
                }}>
                  {profil?.nom ? profil.nom.charAt(0).toUpperCase() : "👤"}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "white", fontWeight: "700", fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {profil?.nom || "Mon compte"}
                  </div>
                  <div style={{ color: "#8899aa", fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user?.email}
                  </div>
                </div>
              </div>

              {/* Badge plan */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: isPro ? "rgba(255,140,0,0.1)" : "rgba(136,153,170,0.08)",
                border: `1px solid ${isPro ? "rgba(255,140,0,0.25)" : "rgba(136,153,170,0.2)"}`,
                borderRadius: "8px", padding: "5px 12px",
                color: isPro ? PRIMARY : "#8899aa",
                fontSize: "12px", fontWeight: "700",
              }}>
                {isPro ? "💎 Plan Pro" : "Plan Gratuit"}
              </div>
            </div>

            {/* Items de navigation */}
            <div style={{ flex: 1 }}>
              {[
                { icon: "📅", label: "Agenda",         action: () => { setPage("dashboard"); setActiveTab("agenda"); setHamburgerOpen(false); } },
                { icon: "👥", label: "Mon équipe",     action: () => { setParametresSection("equipe"); setPage("parametres"); setHamburgerOpen(false); } },
                { icon: "🌐", label: "Mon site web",   action: () => { setParametresSection("minisite"); setPage("parametres"); setHamburgerOpen(false); } },
                { icon: "👤", label: "Mon profil",     action: () => { setPage("profil");      setHamburgerOpen(false); } },
                { icon: "💎", label: "Mon abonnement", action: () => { setParametresSection("abonnement"); setPage("parametres"); setHamburgerOpen(false); } },
                { icon: "⚙️", label: "Paramètres",     action: () => { setParametresSection("profil");     setPage("parametres"); setHamburgerOpen(false); } },
                { icon: "❓", label: "Centre d'aide",  action: () => { setParametresSection("aide");        setPage("parametres"); setHamburgerOpen(false); } },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  style={{
                    width: "100%", background: "transparent", border: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    color: "white", textAlign: "left",
                    padding: "15px 20px", fontSize: "15px", fontWeight: "600",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "14px",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ fontSize: "20px", width: "26px", textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span style={{ color: "#8899aa", fontSize: "16px" }}>›</span>
                </button>
              ))}
            </div>

            {/* Déconnexion */}
            <div style={{ padding: "20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={() => { handleLogout(); setHamburgerOpen(false); }}
                style={{
                  width: "100%",
                  background: "rgba(255,100,100,0.08)",
                  border: "1.5px solid rgba(255,100,100,0.2)",
                  color: "#ff6b6b", borderRadius: "12px", padding: "13px",
                  fontSize: "14px", fontWeight: "700", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,100,100,0.15)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,100,100,0.08)"}
              >
                🚪 Déconnexion
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── BOUTON "?" relance de la visite ──────────────────────── */}
      {onboardingPhase === null && (
        <button
          onClick={relancerVisite}
          title="Relancer la visite guidée"
          style={{
            position: "fixed",
            bottom: isDesktop ? "24px" : "88px",
            right: "16px",
            zIndex: 900,
            width: "44px", height: "44px",
            borderRadius: "50%",
            background: "rgba(255,140,0,0.15)",
            border: "1.5px solid rgba(255,140,0,0.45)",
            color: PRIMARY,
            fontSize: "20px", fontWeight: "900",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(255,140,0,0.2)",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,140,0,0.25)"; e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,140,0,0.15)"; e.currentTarget.style.transform = "scale(1)"; }}
        >
          ?
        </button>
      )}

      {/* ── WELCOME SCREEN (première connexion) ──────────────────── */}
      {onboardingPhase === "welcome" && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 2000,
          background: "rgba(10,22,40,0.97)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          fontFamily: "'Segoe UI', sans-serif",
          padding: "24px",
          animation: "splashFadeUp 0.4s ease both",
        }}>
          <img
            src="/logo.png"
            alt="Artisan+"
            style={{
              width: "clamp(100px, 25vw, 140px)",
              height: "clamp(100px, 25vw, 140px)",
              borderRadius: "24%",
              marginBottom: "28px",
              animation: "splashLogoIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
          />
          <h1 style={{
            color: "white", fontSize: "clamp(24px, 6vw, 32px)",
            fontWeight: "900", margin: "0 0 12px", textAlign: "center",
          }}>
            Bienvenue sur Artisan<span style={{ color: PRIMARY }}>+</span> 👋
          </h1>
          <p style={{
            color: "#8899aa", fontSize: "clamp(14px, 3.5vw, 16px)",
            textAlign: "center", maxWidth: "360px",
            lineHeight: "1.6", margin: "0 0 36px",
          }}>
            Votre assistant pour gérer factures, devis, clients et chantiers en quelques clics.
          </p>

          {/* Aperçu des fonctions */}
          <div style={{
            display: "flex", gap: "8px", flexWrap: "wrap",
            justifyContent: "center", marginBottom: "36px",
            maxWidth: "420px",
          }}>
            {["📄 Factures PDF", "✍️ Signature digitale", "👥 Clients", "🏗️ Chantiers", "⛅ Météo", "📦 Catalogue", "✅ Badge Vérifié", "💎 Plan Pro"].map(f => (
              <span key={f} style={{
                background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.25)",
                color: PRIMARY, borderRadius: "20px",
                padding: "5px 12px", fontSize: "12px", fontWeight: "600",
              }}>{f}</span>
            ))}
          </div>

          <button
            onClick={demarrerVisite}
            style={{
              background: PRIMARY, color: "white", border: "none",
              borderRadius: "14px", padding: "16px 40px",
              fontSize: "16px", fontWeight: "800",
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(255,140,0,0.35)",
              marginBottom: "16px",
              transition: "transform 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            🚀 Commencer la visite guidée
          </button>
          <button
            onClick={terminerTour}
            style={{
              background: "transparent", border: "none",
              color: "#4a5568", fontSize: "13px",
              cursor: "pointer", padding: "8px",
            }}
          >
            Passer — je connais déjà
          </button>
        </div>
      )}

      {/* ── TOUR GUIDÉ ───────────────────────────────────────────── */}
      {onboardingPhase === "tour" && (() => {
        const step  = TOUR_STEPS[tourStep];
        const total = TOUR_STEPS.length;
        return (
          <>
            {/* Backdrop semi-transparent — clic = pas de fermeture accidentelle */}
            <div
              style={{
                position: "fixed", inset: 0, zIndex: 1050,
                background: "rgba(5,12,25,0.55)",
                backdropFilter: "blur(2px)",
              }}
            />

            {/* Bulle */}
            <div style={{
              position: "fixed",
              bottom: isDesktop ? "32px" : "82px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(460px, 93vw)",
              background: CARD,
              borderRadius: "22px",
              padding: "24px 22px 20px",
              border: "1.5px solid rgba(255,140,0,0.35)",
              boxShadow: "0 16px 60px rgba(0,0,0,0.7)",
              zIndex: 1100,
              animation: "popIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both",
            }}>
              {/* Dots de progression */}
              <div style={{ display: "flex", gap: "5px", justifyContent: "center", marginBottom: "18px" }}>
                {TOUR_STEPS.map((_, i) => (
                  <div key={i} style={{
                    height: "5px", borderRadius: "3px", transition: "all 0.3s",
                    width: i === tourStep ? "22px" : "5px",
                    background: i === tourStep ? PRIMARY : "rgba(255,255,255,0.15)",
                  }} />
                ))}
              </div>

              {/* Compteur */}
              <div style={{ textAlign: "center", color: "#556070", fontSize: "11px", fontWeight: "700", letterSpacing: "0.5px", marginBottom: "12px" }}>
                ÉTAPE {tourStep + 1} / {total}
              </div>

              {/* Emoji + titre */}
              <div style={{ textAlign: "center", marginBottom: "14px" }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>{step.emoji}</div>
                <div style={{ color: "white", fontWeight: "900", fontSize: "18px" }}>{step.title}</div>
                {step.note && (
                  <div style={{
                    display: "inline-block", marginTop: "6px",
                    background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.25)",
                    color: PRIMARY, borderRadius: "10px",
                    padding: "3px 10px", fontSize: "11px", fontWeight: "600",
                  }}>{step.note}</div>
                )}
              </div>

              {/* Description */}
              <p style={{
                color: "#c5d0dd", fontSize: "14px",
                lineHeight: "1.75", textAlign: "center",
                margin: "0 0 22px",
              }}>
                {step.desc}
              </p>

              {/* Boutons */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {tourStep > 0 && (
                  <button
                    onClick={reculerTour}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#8899aa", borderRadius: "10px",
                      padding: "11px 14px", cursor: "pointer",
                      fontSize: "13px", fontWeight: "600",
                      flexShrink: 0,
                    }}
                  >‹ Retour</button>
                )}
                <button
                  onClick={avancerTour}
                  style={{
                    flex: 1, background: PRIMARY, color: "white",
                    border: "none", borderRadius: "12px",
                    padding: "13px", cursor: "pointer",
                    fontSize: "15px", fontWeight: "800",
                    boxShadow: "0 4px 18px rgba(255,140,0,0.3)",
                  }}
                >
                  {tourStep < total - 1 ? "Suivant →" : "🎉 Terminer la visite !"}
                </button>
                <button
                  onClick={terminerTour}
                  style={{
                    background: "transparent", border: "none",
                    color: "#3a4555", fontSize: "12px",
                    cursor: "pointer", padding: "8px 4px",
                    flexShrink: 0,
                  }}
                >Passer</button>
              </div>
            </div>
          </>
        );
      })()}

      {/* ── QR CODE MODAL ─────────────────────────────────────── */}
      {qrModal.open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setQrModal({ open: false, url: "", numero: "", loading: false })}
            style={{
              position: "fixed", inset: 0, zIndex: 998,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(4px)",
            }}
          />
          {/* Panel */}
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 999,
            background: CARD,
            borderRadius: "24px",
            padding: "32px 28px",
            width: "min(360px, 92vw)",
            border: "1px solid rgba(168,85,247,0.3)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            textAlign: "center",
            animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
          }}>
            {/* Fermer */}
            <button
              onClick={() => setQrModal({ open: false, url: "", numero: "", loading: false })}
              style={{
                position: "absolute", top: "14px", right: "14px",
                background: "rgba(255,255,255,0.08)", border: "none",
                color: "#8899aa", width: "32px", height: "32px",
                borderRadius: "50%", cursor: "pointer", fontSize: "16px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >✕</button>

            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📱</div>
            <div style={{ color: "white", fontWeight: "800", fontSize: "18px", marginBottom: "4px" }}>
              QR Code — {qrModal.numero}
            </div>
            <div style={{ color: "#8899aa", fontSize: "13px", marginBottom: "24px" }}>
              Le client scanne pour consulter et signer
            </div>

            {/* QR Code */}
            <div style={{
              display: "inline-flex",
              alignItems: "center", justifyContent: "center",
              background: "white",
              borderRadius: "16px",
              padding: "16px",
              marginBottom: "24px",
              boxShadow: "0 4px 32px rgba(0,0,0,0.35)",
              minWidth: "232px", minHeight: "232px",
            }}>
              {qrModal.loading ? (
                <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ color: "#8899aa", fontSize: "14px" }}>Génération…</div>
                </div>
              ) : (
                <QRCodeCanvas
                  id="qr-canvas"
                  value={qrModal.url}
                  size={200}
                  level="H"
                  fgColor="#0a1628"
                  bgColor="#ffffff"
                />
              )}
            </div>

            {/* Boutons */}
            {!qrModal.loading && (
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={handleDownloadQR} style={{
                  flex: 1,
                  background: "rgba(255,140,0,0.12)",
                  border: "1.5px solid rgba(255,140,0,0.35)",
                  color: PRIMARY, borderRadius: "12px",
                  padding: "13px 10px", cursor: "pointer",
                  fontSize: "14px", fontWeight: "700",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                }}>
                  ⬇️ Télécharger
                </button>
                <button onClick={handleShareQR} style={{
                  flex: 1,
                  background: "rgba(168,85,247,0.12)",
                  border: "1.5px solid rgba(168,85,247,0.35)",
                  color: "#a855f7", borderRadius: "12px",
                  padding: "13px 10px", cursor: "pointer",
                  fontSize: "14px", fontWeight: "700",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                }}>
                  📤 Partager
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MODAL ACOMPTE ─────────────────────────────────────── */}
      {acompteModal && (
        <>
          <div onClick={() => setAcompteModal(null)} style={{ position: "fixed", inset: 0, zIndex: 998, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            zIndex: 999, background: CARD, borderRadius: "24px", padding: "28px",
            width: "min(380px, 94vw)", border: "1px solid rgba(255,140,0,0.3)",
            animation: "popIn 0.25s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <h2 style={{ color: "white", fontSize: "18px", margin: 0 }}>💰 Créer un acompte</h2>
              <button onClick={() => setAcompteModal(null)} style={{ background: "none", border: "none", color: "#8899aa", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ color: "#8899aa", fontSize: "13px", marginBottom: "20px" }}>
              Devis {acompteModal.numero} — {acompteModal.total_ttc?.toFixed(2)} € TTC
            </div>

            {/* Sélecteur de pourcentage */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "16px" }}>
              {[10, 20, 30, 50].map(pct => (
                <button key={pct} onClick={() => { setAcomptePct(pct); setAcompteCustom(""); }} style={{
                  padding: "12px 6px", borderRadius: "10px", border: "2px solid",
                  borderColor: acomptePct === pct && acomptePct !== "custom" ? PRIMARY : "rgba(255,255,255,0.1)",
                  background: acomptePct === pct && acomptePct !== "custom" ? "rgba(255,140,0,0.15)" : "transparent",
                  color: acomptePct === pct && acomptePct !== "custom" ? PRIMARY : "white",
                  fontWeight: "700", fontSize: "16px", cursor: "pointer",
                }}>
                  {pct}%
                </button>
              ))}
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: "#8899aa", fontSize: "12px", display: "block", marginBottom: "6px" }}>Ou entrez un pourcentage personnalisé :</label>
              <input type="number" min="1" max="99" placeholder="Ex: 40" value={acompteCustom}
                onChange={e => { setAcompteCustom(e.target.value); setAcomptePct("custom"); }}
                style={{ background: DARK, border: "1px solid rgba(255,140,0,0.25)", borderRadius: "10px", padding: "11px 14px", color: "white", fontSize: "15px", width: "100%", boxSizing: "border-box", outline: "none" }} />
            </div>

            {/* Montant calculé */}
            {(() => {
              const pct = acomptePct === "custom" ? parseFloat(acompteCustom) : acomptePct;
              const ttc = pct > 0 && pct <= 100 ? ((acompteModal.total_ttc || 0) * pct / 100) : 0;
              const ht  = pct > 0 && pct <= 100 ? ((acompteModal.total_ht  || 0) * pct / 100) : 0;
              return ttc > 0 ? (
                <div style={{ background: "rgba(255,140,0,0.08)", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#8899aa", fontSize: "13px", marginBottom: "4px" }}>
                    <span>Montant HT</span><span>{ht.toFixed(2)} €</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "white", fontWeight: "800", fontSize: "20px" }}>
                    <span>Acompte TTC</span><span style={{ color: PRIMARY }}>{ttc.toFixed(2)} €</span>
                  </div>
                </div>
              ) : null;
            })()}

            <button onClick={creerAcompte} disabled={acompteLoading} style={{
              width: "100%", background: acompteLoading ? "#555" : PRIMARY,
              color: "white", border: "none", borderRadius: "12px",
              padding: "14px", fontSize: "16px", fontWeight: "700",
              cursor: acompteLoading ? "not-allowed" : "pointer",
            }}>
              {acompteLoading ? "⏳ Création…" : "✅ Créer la facture d'acompte"}
            </button>
          </div>
        </>
      )}

      {/* ── BANDEAU RÔLE ÉQUIPE ────────────────────────────────── */}
      {teamInfo && (
        <div style={{
          position: "fixed", bottom: isDesktop ? "16px" : "74px", left: "50%",
          transform: "translateX(-50%)", zIndex: 500,
          background: CARD, border: "1px solid rgba(255,140,0,0.3)",
          borderRadius: "24px", padding: "8px 16px",
          display: "flex", alignItems: "center", gap: "8px",
          fontSize: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          whiteSpace: "nowrap",
        }}>
          <span style={{ fontSize: "16px" }}>👥</span>
          <span style={{ color: "#8899aa" }}>Connecté en tant que</span>
          <span style={{ color: PRIMARY, fontWeight: "700", textTransform: "capitalize" }}>{teamInfo.role}</span>
        </div>
      )}

      {/* ── UPGRADE MODAL ─────────────────────────────────────── */}
      {upgradeModal.open && (
        <UpgradeModal
          limitType={upgradeModal.type}
          onClose={() => setUpgradeModal({ open: false, type: "factures" })}
          onUpgrade={() => {
            setUpgradeModal({ open: false, type: "factures" });
            setPage("parametres");
          }}
        />
      )}

      {/* ── MODAL INVITÉ : créer un compte pour passer au Pro ─── */}
      {guestModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={e => { if (e.target === e.currentTarget) setGuestModal(false); }}
        >
          <div style={{ background: CARD, borderRadius: "20px", padding: "36px 28px", maxWidth: "400px", width: "100%", border: "1px solid rgba(255,140,0,0.25)", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔓</div>
            <div style={{ color: "white", fontWeight: "800", fontSize: "20px", marginBottom: "10px" }}>
              Passez au Pro
            </div>
            <div style={{ color: "#8899aa", fontSize: "14px", lineHeight: "1.6", marginBottom: "28px" }}>
              Vous utilisez actuellement un compte invité.<br />
              Pour débloquer les fonctionnalités Pro illimitées, créez un compte gratuit — ça prend 30 secondes.
            </div>
            <button
              onClick={async () => {
                setGuestModal(false);
                await supabase.auth.signOut();
              }}
              style={{
                width: "100%", background: PRIMARY, color: "white", border: "none",
                borderRadius: "12px", padding: "14px", fontSize: "15px",
                fontWeight: "700", cursor: "pointer", marginBottom: "10px",
              }}
            >
              🚀 Créer mon compte gratuitement
            </button>
            <button
              onClick={() => setGuestModal(false)}
              style={{
                width: "100%", background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)", color: "#8899aa",
                borderRadius: "12px", padding: "12px", fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Continuer en mode invité
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
