import { useState, useEffect, useRef, lazy, Suspense } from "react";
import CookieBanner from "./CookieBanner";

// Singleton lazy : Supabase est chargé uniquement après le premier rendu,
// pas dans le bundle initial → ne bloque pas le LCP de la vitrine
let _sbPromise = null;
function getSupa() {
  if (!_sbPromise) _sbPromise = import('./supabase').then(m => m.supabase);
  return _sbPromise;
}
import { usePWA } from "./usePWA";
import { useLanguage, useLocale } from "./i18n";

// Lazy-load tout : vitrine, app, pages publiques spéciales
// → réduit le bundle initial chargé sur la vitrine marketing
const Vitrine        = lazy(() => import("./Vitrine"));
const Blog           = lazy(() => import("./Blog"));
const Dashboard      = lazy(() => import("./Dashboard"));
const SignatureDevis = lazy(() => import("./SignatureDevis"));
const SuiviChantier  = lazy(() => import("./SuiviChantier"));
const MiniSite       = lazy(() => import("./MiniSite"));
const OuvrierChantier = lazy(() => import("./OuvrierChantier"));

// Fallback minimaliste pendant le chargement des pages publiques
function PublicFallback() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a1628", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#FF8C00", fontWeight: "900", fontSize: "22px" }}>Artisan<span style={{ color: "white" }}>+</span></div>
    </div>
  );
}

// Préfixes de routes de la vitrine marketing (hors /login)
const VITRINE_PREFIXES = [
  "/devis-facture-", "/artisan-", "/alternative-",
  "/cgu", "/politique-confidentialite", "/fonctionnalites", "/tarifs",
  "/blog",
  "/facturation-electronique-", "/facture-electronique-",
  "/logiciel-facturation-electronique-",
  "/facture-en-ligne-", "/devis-en-ligne-", "/application-devis-facture-",
  "/logiciel-devis-facture-", "/faire-une-facture-", "/faire-un-devis-",
  "/application-facturation-", "/facture-auto-entrepreneur-",
];

// Retourne true si le chemin est une page publique connue (vitrine, CGU, etc.)
// → permet d'initialiser sessionLoading=false pour ces routes et d'éviter
//   le remplacement du HTML pré-rendu par PublicFallback
function isVitrineRoute(path) {
  return path === "/" || VITRINE_PREFIXES.some(pfx => path.startsWith(pfx));
}

const PRIMARY = "#FF8C00";
const DARK = "#0a1628";
const CARD = "#111e35";

const SPLASH_PHRASES_FR = [
  "Calcul du bénéfice... croisons les doigts 🤞",
  "Préparation de l'app... le café c'est pour vous ☕",
  "Vos clients attendent... enfin presque 😄",
  "Vos factures se préparent... elles arrivent plus vite que vos clients 😏",
  "Chargement... le temps que vous finissiez votre café ☕",
  "Préparation de l'app... promis c'est plus rapide qu'un devis papier 📝",
  "On charge vos chantiers... et on espère qu'il fait beau 🌤️",
  "Artisan+ se réveille... comme vous le matin 😴",
  "Chargement... pendant ce temps vos concurrents font encore des devis à la main 😄",
  "Artisan+ démarre... le chantier peut attendre 2 secondes 🏗️",
  "On organise vos affaires... vous n'avez plus qu'à travailler 🔨",
  "Artisan+ charge... bientôt vous allez épater vos clients 🚀",
];

export default function App() {
  const { lang, setLang, t } = useLanguage();
  const locale = useLocale();
  const [page, setPage] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [signatureToken, setSignatureToken] = useState(null);
  const [subscriptionStatus,  setSubscriptionStatus]  = useState(null); // 'success' | 'canceled' | null
  const [stripeConnectStatus, setStripeConnectStatus] = useState(null); // 'success' | 'refresh' | null
  const [paymentStatus,       setPaymentStatus]       = useState(null); // { status: 'success'|'canceled', factureId } | null
  const [teamInfo,            setTeamInfo]            = useState(null); // { role, patronId } si membre d'une équipe
  const [loginMode,          setLoginMode]          = useState("normal"); // "normal" | "join-team"
  const [inviteCode,         setInviteCode]         = useState("");
  const [joinMsg,            setJoinMsg]            = useState("");
  const [cguAccepted,        setCguAccepted]        = useState(false);

  // ── Routing réactif : écoute les navigations internes de la vitrine ─────────
  const [routePath, setRoutePath] = useState(window.location.pathname);
  // ── Session loading : false dès le départ pour les routes vitrine connues.
  // → le HTML pré-rendu est préservé (pas de flash PublicFallback).
  // Pour les autres routes, on attend la vérification Supabase avant de router.
  const [sessionLoading, setSessionLoading] = useState(
    () => !isVitrineRoute(window.location.pathname)
  );
  // Ref pour désabonner l'auth listener au démontage du composant
  const authSubRef = useRef(null);

  // ── Splash screen ─────────────────────────────────────────────
  // Pas de splash sur les pages publiques (vitrine, signature, suivi, mini-sites)
  const _initPath = window.location.pathname;
  const isSplashPage = !_initPath.startsWith("/signer/") &&
    !_initPath.startsWith("/suivi/") &&
    !_initPath.startsWith("/artisan/") &&
    !_initPath.startsWith("/site/") &&
    !_initPath.startsWith("/ouvrier/") &&
    !VITRINE_PREFIXES.some(pfx => _initPath.startsWith(pfx)) &&
    _initPath !== "/connexion" && _initPath !== "/inscription";
  const [showSplash, setShowSplash] = useState(isSplashPage);
  const [splashOut,  setSplashOut]  = useState(false);
  const splashPhrases = locale?.splash?.phrases ?? SPLASH_PHRASES_FR;
  const [phraseIndex] = useState(() => Math.floor(Math.random() * 12));
  const phrase = splashPhrases[phraseIndex % splashPhrases.length];

  // ── Parrainage en attente : appliqué au premier login ────────
  // Cas : inscription avec code + confirmation email → pas de session immédiate
  // → stored en localStorage → appliqué ici quand la session arrive
  useEffect(() => {
    if (!user) return;
    const raw = localStorage.getItem("artisan_pending_referral");
    if (!raw) return;
    try {
      const { userId, code } = JSON.parse(raw);
      if (userId !== user.id || !code) return;
      getSupa().then(supa =>
        supa.from("profils")
          .upsert({ user_id: userId, referred_by: code }, { onConflict: "user_id" })
          .then(({ error }) => {
            if (!error) localStorage.removeItem("artisan_pending_referral");
          })
      );
    } catch { localStorage.removeItem("artisan_pending_referral"); }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Logo transparent : supprime le fond #0a1628 via canvas ────
  // Traitement pixel par pixel au montage → dataURL sans fond
  const [logoSrc, setLogoSrc] = useState("/logo.webp");
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        // Fond cible : #0a1628 = (10, 22, 40)
        const [bgR, bgG, bgB] = [10, 22, 40];
        const TOLERANCE = 45; // rayon de suppression (Euclidien RGB)
        for (let i = 0; i < d.length; i += 4) {
          const dist = Math.sqrt(
            (d[i]   - bgR) ** 2 +
            (d[i+1] - bgG) ** 2 +
            (d[i+2] - bgB) ** 2
          );
          if (dist < TOLERANCE) {
            // Fondu progressif : complètement transparent au centre,
            // opacité restaurée progressivement vers les bords de l'élément
            d[i+3] = Math.round((dist / TOLERANCE) * d[i+3]);
          }
        }
        ctx.putImageData(imageData, 0, 0);
        setLogoSrc(canvas.toDataURL("image/png"));
      } catch {
        // CORS ou erreur → on garde /logo.png d'origine
      }
    };
    img.src = "/logo.png";
  }, []);

  useEffect(() => {
    if (!showSplash) return;
    const t1 = setTimeout(() => setSplashOut(true),  2300); // début du fondu-sortie
    const t2 = setTimeout(() => setShowSplash(false), 2800); // suppression du DOM
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // PWA — toutes les capabilities
  const {
    isOnline, canInstall, handleInstall, showSyncToast,
    updateAvailable, handleUpdate,
    notifPermission, requestNotifPermission, checkAndNotify,
  } = usePWA();

  useEffect(() => {
    // ── Écoute des navigations internes (vitrine → login, etc.) ──────────────
    const onPop = () => setRoutePath(window.location.pathname);
    window.addEventListener("popstate", onPop);

    // Vérifier si c'est un lien de signature ou de suivi (chemins publics sans auth)
    const path = window.location.pathname;
    if (path.startsWith("/signer/")) {
      const token = path.replace("/signer/", "");
      setSignatureToken(token);
      setSessionLoading(false);
      return () => window.removeEventListener("popstate", onPop);
    }
    if (path.startsWith("/suivi/") || path.startsWith("/artisan/") || path.startsWith("/ouvrier/")) {
      setSessionLoading(false);
      return () => window.removeEventListener("popstate", onPop);
    }

    // Détecter le retour depuis Stripe Checkout + code parrainage dans l'URL
    const params = new URLSearchParams(window.location.search);
    const sub = params.get("subscription");
    if (sub === "success" || sub === "canceled") {
      setSubscriptionStatus(sub);
      window.history.replaceState({}, "", window.location.pathname);
    }
    // Retour depuis Stripe Connect onboarding
    const connectParam = params.get("stripe_connect");
    if (connectParam === "success" || connectParam === "refresh") {
      setStripeConnectStatus(connectParam);
      window.history.replaceState({}, "", window.location.pathname);
    }
    // Retour depuis un paiement de facture
    const paymentParam = params.get("payment");
    const factureIdParam = params.get("facture_id");
    if (paymentParam === "success" || paymentParam === "canceled") {
      setPaymentStatus({ status: paymentParam, factureId: factureIdParam || null });
      window.history.replaceState({}, "", window.location.pathname);
    }
    // Pré-remplir le code de parrainage si présent dans l'URL (?ref=CODE)
    const refCode = params.get("ref");
    if (refCode) {
      setReferralInput(refCode.toUpperCase());
      setPage("register");
      window.history.replaceState({}, "", window.location.pathname);
    }

    getSupa().then(supa => {
      supa.auth.getSession().then(({ data: { session } }) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) chargerEquipe(u.id);
        setSessionLoading(false);
      });
      const { data: authData } = supa.auth.onAuthStateChange((_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) chargerEquipe(u.id);
      });
      authSubRef.current = authData?.subscription;
    });

    return () => {
      window.removeEventListener("popstate", onPop);
      authSubRef.current?.unsubscribe();
    };
  }, []);

  // Vérifier si l'utilisateur est membre d'une équipe
  const chargerEquipe = async (userId) => {
    const supa = await getSupa();
    const { data } = await supa
      .from("equipe_membres")
      .select("role, patron_id")
      .eq("membre_id", userId)
      .eq("statut", "actif")
      .single();
    if (data) setTeamInfo({ role: data.role, patronId: data.patron_id });
    else setTeamInfo(null);
  };

  // Rejoindre une équipe avec un code d'invitation
  const handleJoinTeam = async () => {
    setLoading(true);
    setJoinMsg("");
    const code = inviteCode.trim().toUpperCase();
    if (!code) { setJoinMsg(t("auth.inviteRequired")); setLoading(false); return; }

    const supa = await getSupa();

    // 1. Vérifier le code
    const { data: invite, error } = await supa
      .from("equipe_membres")
      .select("id, email_invite, statut")
      .eq("code_invitation", code)
      .single();

    if (error || !invite) { setJoinMsg(t("auth.invalidInvite")); setLoading(false); return; }
    if (invite.statut === "actif") { setJoinMsg(t("auth.usedInvite")); setLoading(false); return; }

    // 2. Connexion / inscription
    const { error: loginErr } = await supa.auth.signInWithPassword({ email, password });
    if (loginErr) {
      const { data: signData, error: signErr } = await supa.auth.signUp({
        email, password,
        options: { data: { full_name: nom || email.split("@")[0] } }
      });
      if (signErr) { setJoinMsg("❌ " + signErr.message); setLoading(false); return; }
      if (!signData.session) {
        setJoinMsg(t("auth.accountCreatedCheckEmail"));
        setLoading(false);
        return;
      }
    }

    // 3. Récupérer l'utilisateur connecté et lier
    const { data: { session } } = await supa.auth.getSession();
    if (!session) { setJoinMsg(t("auth.loginFailed")); setLoading(false); return; }

    await supa.from("equipe_membres")
      .update({ membre_id: session.user.id, statut: "actif" })
      .eq("code_invitation", code);

    setJoinMsg(t("auth.welcomeTeam"));
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");
    const supa = await getSupa();
    const { error } = await supa.auth.signInWithPassword({ email, password });
    if (error) setMessage("❌ " + error.message);
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true);
    setMessage("");
    const trimmedCode = referralInput.trim().toUpperCase();
    const supa = await getSupa();

    // ── 1. Valider le code de parrainage avant de créer le compte ──
    if (trimmedCode) {
      const { data: parrain, error: errCheck } = await supa
        .from("profils")
        .select("user_id, referral_used")
        .eq("referral_code", trimmedCode)
        .single();
      if (errCheck || !parrain) {
        setMessage(t("auth.invalidReferral"));
        setLoading(false);
        return;
      }
      if (parrain.referral_used) {
        setMessage(t("auth.usedReferral"));
        setLoading(false);
        return;
      }
    }

    // ── 1b. Validation côté client ────────────────────────────────
    if (!cguAccepted) {
      setMessage(t("auth.acceptCgu"));
      setLoading(false);
      return;
    }
    if (password !== passwordConfirm) {
      setMessage(t("auth.passwordMismatch"));
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setMessage(t("auth.passwordTooShort"));
      setLoading(false);
      return;
    }

    // ── 2. Créer le compte ─────────────────────────────────────────
    const { data, error } = await supa.auth.signUp({
      email, password,
      options: {
        data: {
          full_name: nom,
          referred_by: trimmedCode || null,
        }
      }
    });
    if (error) { setMessage("❌ " + error.message); setLoading(false); return; }

    // ── 3. Écrire referred_by dans profils immédiatement ──────────
    const userId = data.user?.id;
    if (userId && trimmedCode) {
      if (data.session) {
        await supa.from("profils").upsert(
          { user_id: userId, referred_by: trimmedCode },
          { onConflict: "user_id" }
        );
      }
      // Backup localStorage (couvre le cas confirmation email)
      localStorage.setItem("artisan_pending_referral", JSON.stringify({ userId, code: trimmedCode }));
      setMessage(t("auth.accountCreatedReferral"));
    } else {
      setMessage(t("auth.accountCreated"));
    }
    setLoading(false);
  };

  // ── Compte invité ─────────────────────────────────────────────
  // Fingerprint FNV-1a basé sur user-agent, résolution, langue, timezone
  // → identifiant déterministe par appareil, stocké dans localStorage
  const getDeviceFingerprint = () => {
    const raw = [
      navigator.userAgent.slice(0, 120),
      `${screen.width}x${screen.height}x${screen.colorDepth}`,
      navigator.language,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 2,
    ].join("|");
    let h = 0x811c9dc5;
    for (let i = 0; i < raw.length; i++) {
      h ^= raw.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(36);
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setMessage("");
    const fp         = getDeviceFingerprint();
    const guestEmail = `guest_${fp}@artisan-plus.app`;
    const guestPass  = `Ap_${fp}_G!`;
    const supa = await getSupa();

    // 1) L'appareil a déjà un compte invité → connexion directe
    const { error: loginErr } = await supa.auth.signInWithPassword({
      email: guestEmail, password: guestPass,
    });
    if (!loginErr) {
      localStorage.setItem("artisan_guest_fp", fp);
      setLoading(false);
      return;
    }

    // 2) Premier accès → création du compte invité
    const { data: signUpData, error: signUpErr } = await supa.auth.signUp({
      email: guestEmail, password: guestPass,
      options: { data: { full_name: "Invité", is_guest: true } },
    });
    if (signUpErr) {
      setMessage("❌ " + signUpErr.message);
      setLoading(false);
      return;
    }

    if (signUpData?.session) {
      localStorage.setItem("artisan_guest_fp", fp);
      setLoading(false);
      return;
    }

    const { error: login2Err } = await supa.auth.signInWithPassword({
      email: guestEmail, password: guestPass,
    });
    if (login2Err) {
      setMessage("⚠️ Activez « Disable email confirmations » dans Supabase → Auth → Settings pour les comptes invités.");
    } else {
      localStorage.setItem("artisan_guest_fp", fp);
    }
    setLoading(false);
  };

  // ── Splash screen JSX (overlay fixe, zIndex 9999) ─────────────
  const splashEl = showSplash && (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: DARK,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
      opacity: splashOut ? 0 : 1,
      transition: "opacity 0.5s ease",
      pointerEvents: splashOut ? "none" : "all",
    }}>
      {/* Logo — fond #0a1628 rendu transparent par canvas (voir useEffect) */}
      <img
        src={logoSrc}
        alt="Artisan+"
        width="286"
        height="88"
        loading="eager"
        decoding="async"
        style={{
          width: "clamp(195px, 46vw, 286px)",
          height: "auto",
          marginBottom: "24px",
          animation: "splashLogoIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      />

      {/* Phrase humoristique */}
      <div style={{
        color: "#8899aa",
        fontSize: "clamp(13px, 3.5vw, 15px)",
        fontStyle: "italic",
        textAlign: "center",
        maxWidth: "min(340px, 85vw)",
        lineHeight: "1.6",
        padding: "0 20px",
        animation: "splashFadeUp 0.5s ease 0.3s both",
      }}>
        {phrase}
      </div>

      {/* Barre de progression */}
      <div style={{
        marginTop: "52px",
        width: "min(150px, 40vw)", height: "3px",
        background: "rgba(255,140,0,0.12)",
        borderRadius: "2px", overflow: "hidden",
        animation: "splashFadeUp 0.4s ease 0.4s both",
      }}>
        <div style={{
          height: "100%",
          background: `linear-gradient(90deg, ${PRIMARY}, #ffb347)`,
          borderRadius: "2px",
          transformOrigin: "left",
          animation: "splashBar 2.3s ease forwards",
        }} />
      </div>
    </div>
  );

  // Page de signature — pas de splash
  if (signatureToken) return <Suspense fallback={<PublicFallback />}><SignatureDevis token={signatureToken} /></Suspense>;

  // ── Sous-domaine automatique — [slug].artisan-plus.fr ────────────────────
  const hostname = window.location.hostname;
  const subMatch = hostname.match(/^([a-z0-9-]+)\.artisan-plus\.fr$/);
  if (subMatch && subMatch[1] !== "www") return <Suspense fallback={<PublicFallback />}><MiniSite slug={subMatch[1]} /></Suspense>;

  // Page de suivi chantier — publique, pas d'auth
  const suiviPath = window.location.pathname;
  if (suiviPath.startsWith("/suivi/")) {
    const suiviToken = suiviPath.replace("/suivi/", "").split("?")[0];
    if (suiviToken) return <Suspense fallback={<PublicFallback />}><SuiviChantier token={suiviToken} /></Suspense>;
  }

  // Mini-site artisan public — /site/:slug (primary) ou /artisan/:slug (legacy)
  if (suiviPath.startsWith("/site/")) {
    const artisanSlug = suiviPath.replace("/site/", "").split("?")[0];
    if (artisanSlug) return <Suspense fallback={<PublicFallback />}><MiniSite slug={artisanSlug} /></Suspense>;
  }
  if (suiviPath.startsWith("/artisan/")) {
    const artisanSlug = suiviPath.replace("/artisan/", "").split("?")[0];
    if (artisanSlug) return <Suspense fallback={<PublicFallback />}><MiniSite slug={artisanSlug} /></Suspense>;
  }

  // Accès ouvrier — /ouvrier/:token
  if (suiviPath.startsWith("/ouvrier/")) {
    const ouvrierToken = suiviPath.replace("/ouvrier/", "").split("?")[0];
    if (ouvrierToken) return <Suspense fallback={<PublicFallback />}><OuvrierChantier token={ouvrierToken} /></Suspense>;
  }

  // Détection compte invité : email déterministe généré par handleGuestLogin
  const isGuest = user?.email?.endsWith("@artisan-plus.app") === true
    || user?.user_metadata?.is_guest === true;

  // ── Vitrine marketing (utilisateurs non connectés) ─────────────────────────
  // La page /login affiche le formulaire de connexion (ci-dessous).
  // Toutes les autres routes sans session → vitrine
  if (!user) {
    // Pendant la vérification de session : spinner pour éviter le flash vitrine
    // (ne s'applique pas aux pages publiques qui ont déjà fait return plus haut)
    if (sessionLoading) return <PublicFallback />;
    const isLoginPath = routePath === "/login" || routePath === "/connexion" || routePath === "/inscription";
    if (!isLoginPath) {
      if (routePath === "/blog" || routePath.startsWith("/blog/")) return <><Suspense fallback={<PublicFallback />}><Blog /></Suspense><CookieBanner /></>;
      return <><Suspense fallback={<PublicFallback />}><Vitrine /></Suspense><CookieBanner /></>;
    }
  }

  if (user) return (
    <Suspense fallback={<PublicFallback />}>
      <>
        {splashEl}
        <Dashboard
          user={user}
          isGuest={isGuest}
          teamInfo={teamInfo}
          onLogout={() => setUser(null)}
          isOnline={isOnline}
          canInstall={canInstall}
          handleInstall={handleInstall}
          showSyncToast={showSyncToast}
          updateAvailable={updateAvailable}
          handleUpdate={handleUpdate}
          notifPermission={notifPermission}
          requestNotifPermission={requestNotifPermission}
          checkAndNotify={checkAndNotify}
          subscriptionStatus={subscriptionStatus}
          onSubscriptionStatusCleared={() => setSubscriptionStatus(null)}
          stripeConnectStatus={stripeConnectStatus}
          onStripeConnectStatusCleared={() => setStripeConnectStatus(null)}
          paymentStatus={paymentStatus}
          onPaymentStatusCleared={() => setPaymentStatus(null)}
        />
      </>
    </Suspense>
  );

  return (
    <>
      {splashEl}
    <div style={{
      minHeight: "100vh", background: DARK, display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif", padding: "20px"
    }}>
      <div style={{
        background: CARD, borderRadius: "20px", padding: "40px",
        width: "100%", maxWidth: "420px",
        boxShadow: "0 0 60px rgba(255,140,0,0.1)",
        border: "1px solid rgba(255,140,0,0.2)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "48px", fontWeight: "900", color: "white" }}>
            Artisan<span style={{ color: PRIMARY }}>+</span>
          </div>
          <div style={{ color: "#8899aa", fontSize: "14px", marginTop: "4px" }}>
            {t("auth.subtitle")}
          </div>

          {/* Sélecteur de langue */}
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "12px" }}>
            {[{ code: "fr", label: "🇫🇷 FR" }, { code: "en", label: "🇬🇧 EN" }].map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                style={{
                  background: lang === code ? "rgba(255,140,0,0.18)" : "transparent",
                  border: lang === code ? "1.5px solid rgba(255,140,0,0.6)" : "1.5px solid rgba(255,255,255,0.12)",
                  color: lang === code ? PRIMARY : "#556677",
                  borderRadius: "8px", padding: "5px 12px", cursor: "pointer",
                  fontSize: "12px", fontWeight: "700", transition: "all 0.2s"
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Bouton d'installation PWA */}
          {canInstall && (
            <button
              onClick={handleInstall}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                marginTop: "16px", background: "rgba(255,140,0,0.12)",
                border: "1.5px solid rgba(255,140,0,0.4)",
                color: PRIMARY, borderRadius: "12px",
                padding: "10px 20px", cursor: "pointer",
                fontSize: "14px", fontWeight: "700",
                transition: "all 0.2s"
              }}
            >
              {t("auth.installApp")}
            </button>
          )}
        </div>

        {/* ── Onglets mode connexion ─────────────────────────── */}
        <div style={{ display: "flex", marginBottom: "28px", background: "#0a1628", borderRadius: "10px", padding: "4px", gap: "2px" }}>
          {["login", "register", "join-team"].map(tab => (
            <button key={tab} onClick={() => { setPage(tab === "join-team" ? "login" : tab); setLoginMode(tab === "join-team" ? "join-team" : "normal"); setMessage(""); setJoinMsg(""); setPasswordConfirm(""); }} style={{
              flex: 1, padding: "9px 4px", border: "none", borderRadius: "8px", cursor: "pointer",
              background: (tab === "join-team" ? loginMode === "join-team" : (tab === page && loginMode === "normal")) ? PRIMARY : "transparent",
              color: (tab === "join-team" ? loginMode === "join-team" : (tab === page && loginMode === "normal")) ? "white" : "#8899aa",
              fontWeight: "600", fontSize: "12px", transition: "all 0.2s", lineHeight: "1.2"
            }}>
              {tab === "login" ? t("auth.login") : tab === "register" ? t("auth.register") : t("auth.joinTeam")}
            </button>
          ))}
        </div>

        {/* ── Mode rejoindre une équipe ──────────────────────── */}
        {loginMode === "join-team" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "rgba(255,140,0,0.06)", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "12px", padding: "14px 16px" }}>
              <div style={{ color: PRIMARY, fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>{t("auth.joinTeamTitle")}</div>
              <div style={{ color: "#8899aa", fontSize: "12px" }}>{t("auth.joinTeamDesc")}</div>
            </div>
            <input placeholder={t("auth.inviteCodePlaceholder")} value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())} style={{ ...inputStyle, textAlign: "center", fontWeight: "700", fontSize: "16px", letterSpacing: "2px" }} />
            <input placeholder={t("auth.fullName")} value={nom}
              onChange={e => setNom(e.target.value)} style={inputStyle} />
            <input placeholder={t("auth.email")} value={email}
              onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <input placeholder={t("auth.password")} type="password" value={password}
              onChange={e => setPassword(e.target.value)} style={inputStyle} />
            {joinMsg && (
              <div style={{ color: joinMsg.includes("✅") ? "#4CAF50" : joinMsg.includes("⚠️") ? PRIMARY : "#ff6b6b", fontSize: "13px", textAlign: "center" }}>
                {joinMsg}
              </div>
            )}
            <button onClick={handleJoinTeam} disabled={loading} style={{
              background: loading ? "#888" : PRIMARY, color: "white", border: "none",
              borderRadius: "10px", padding: "14px", fontSize: "16px", fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer"
            }}>
              {loading ? t("auth.joining") : t("auth.joinTeamBtn")}
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {page === "register" && (
                <input placeholder={t("auth.fullName")} value={nom}
                  onChange={e => setNom(e.target.value)} style={inputStyle} />
              )}
              <input placeholder={t("auth.email")} value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && (page === "login" ? handleLogin() : handleRegister())}
                style={inputStyle} />
              <input placeholder={t("auth.password")} type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && page === "login" && handleLogin()}
                style={inputStyle} />
              {page === "register" && (
                <>
                  <input
                    placeholder={t("auth.confirmPassword")}
                    type="password"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !loading && handleRegister()}
                    style={inputStyle}
                  />
                  <div style={{ position: "relative" }}>
                    <input
                      placeholder={t("auth.referralCode")}
                      value={referralInput}
                      onChange={e => setReferralInput(e.target.value.toUpperCase())}
                      style={{
                        ...inputStyle,
                        border: referralInput
                          ? "1px solid rgba(255,140,0,0.5)"
                          : "1px solid rgba(255,255,255,0.08)",
                        paddingLeft: referralInput ? "36px" : "16px",
                      }}
                    />
                    {referralInput && (
                      <span style={{
                        position: "absolute", left: "12px", top: "50%",
                        transform: "translateY(-50%)", fontSize: "15px",
                      }}>🎁</span>
                    )}
                  </div>
                  {/* ── Case CGU ── */}
                  <label style={{
                    display: "flex", alignItems: "flex-start", gap: "10px",
                    cursor: "pointer", paddingTop: "4px",
                  }}>
                    <input
                      type="checkbox"
                      checked={cguAccepted}
                      onChange={e => setCguAccepted(e.target.checked)}
                      style={{ marginTop: "3px", accentColor: PRIMARY, width: "17px", height: "17px", flexShrink: 0 }}
                    />
                    <span style={{ color: "#8899aa", fontSize: "12px", lineHeight: "1.6" }}>
                      {t("auth.cguAccept")}{" "}
                      <a href="/cgu" target="_blank" rel="noopener noreferrer"
                        style={{ color: PRIMARY, textDecoration: "underline" }}>{t("auth.cguLink")}</a>
                      {" "}{t("auth.and")}{" "}
                      <a href="/politique-confidentialite" target="_blank" rel="noopener noreferrer"
                        style={{ color: PRIMARY, textDecoration: "underline" }}>{t("auth.privacyLink")}</a>
                      {" "}*
                    </span>
                  </label>
                </>
              )}

              {message && (
                <div style={{ color: message.includes("✅") ? "#4CAF50" : "#ff6b6b",
                  fontSize: "13px", textAlign: "center" }}>
                  {message}
                </div>
              )}

              <button onClick={page === "login" ? handleLogin : handleRegister}
                disabled={loading} style={{
                  background: loading ? "#888" : PRIMARY, color: "white",
                  border: "none", borderRadius: "10px", padding: "14px",
                  fontSize: "16px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
                  marginTop: "8px"
                }}>
                {loading ? t("auth.loading") : page === "login" ? t("auth.signIn") : t("auth.createAccount")}
              </button>
            </div>

            {page === "login" && (
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <span style={{ color: "#8899aa", fontSize: "13px" }}>{t("auth.noAccount")} </span>
                <span onClick={() => setPage("register")} style={{
                  color: PRIMARY, fontSize: "13px", cursor: "pointer", fontWeight: "600"
                }}>
                  {t("auth.signUpFree")}
                </span>
              </div>
            )}
          </>
        )}

        {/* ── Séparateur + bouton invité ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0 4px" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
          <span style={{ color: "#556677", fontSize: "12px", whiteSpace: "nowrap" }}>{t("auth.or")}</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
        </div>

        <button
          onClick={handleGuestLogin}
          disabled={loading}
          style={{
            width: "100%", background: "transparent",
            border: "1.5px solid rgba(255,255,255,0.10)",
            borderRadius: "10px", padding: "12px 16px",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,140,0,0.35)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)"}
        >
          <span style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>
            {t("auth.tryWithoutAccount")}
          </span>
          <span style={{ color: "#556677", fontSize: "11px" }}>
            {t("auth.limitedFreeAccess")}
          </span>
        </button>
      </div>
    </div>
    <CookieBanner />
    </>
  );
}

const inputStyle = {
  background: "#0a1628", border: "1px solid rgba(255,140,0,0.2)",
  borderRadius: "10px", padding: "13px 16px", color: "white",
  fontSize: "15px", outline: "none", width: "100%", boxSizing: "border-box"
};