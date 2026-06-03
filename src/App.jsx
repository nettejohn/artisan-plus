import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Dashboard from "./Dashboard";
import SignatureDevis from "./SignatureDevis";
import SuiviChantier from "./SuiviChantier";
import MiniSite from "./MiniSite";
import OuvrierChantier from "./OuvrierChantier";
import { usePWA } from "./usePWA";

const PRIMARY = "#FF8C00";
const DARK = "#0a1628";
const CARD = "#111e35";

const SPLASH_PHRASES = [
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
  const [subscriptionStatus, setSubscriptionStatus] = useState(null); // 'success' | 'canceled' | null
  const [teamInfo,           setTeamInfo]           = useState(null); // { role, patronId } si membre d'une équipe
  const [loginMode,          setLoginMode]          = useState("normal"); // "normal" | "join-team"
  const [inviteCode,         setInviteCode]         = useState("");
  const [joinMsg,            setJoinMsg]            = useState("");

  // ── Splash screen ─────────────────────────────────────────────
  const isSplashPage = !window.location.pathname.startsWith("/signer/");
  const [showSplash, setShowSplash] = useState(isSplashPage);
  const [splashOut,  setSplashOut]  = useState(false);
  const [phrase] = useState(
    () => SPLASH_PHRASES[Math.floor(Math.random() * SPLASH_PHRASES.length)]
  );

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
      supabase.from("profils")
        .upsert({ user_id: userId, referred_by: code }, { onConflict: "user_id" })
        .then(({ error }) => {
          if (!error) localStorage.removeItem("artisan_pending_referral");
        });
    } catch { localStorage.removeItem("artisan_pending_referral"); }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Logo transparent : supprime le fond #0a1628 via canvas ────
  // Traitement pixel par pixel au montage → dataURL sans fond
  const [logoSrc, setLogoSrc] = useState("/logo.png");
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
    // Vérifier si c'est un lien de signature ou de suivi
    const path = window.location.pathname;
    if (path.startsWith("/signer/")) {
      const token = path.replace("/signer/", "");
      setSignatureToken(token);
      return;
    }
    if (path.startsWith("/suivi/")) return; // géré plus bas

    // Détecter le retour depuis Stripe Checkout + code parrainage dans l'URL
    const params = new URLSearchParams(window.location.search);
    const sub = params.get("subscription");
    if (sub === "success" || sub === "canceled") {
      setSubscriptionStatus(sub);
      window.history.replaceState({}, "", window.location.pathname);
    }
    // Pré-remplir le code de parrainage si présent dans l'URL (?ref=CODE)
    const refCode = params.get("ref");
    if (refCode) {
      setReferralInput(refCode.toUpperCase());
      setPage("register");
      window.history.replaceState({}, "", window.location.pathname);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) chargerEquipe(u.id);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) chargerEquipe(u.id);
    });
  }, []);

  // Vérifier si l'utilisateur est membre d'une équipe
  const chargerEquipe = async (userId) => {
    const { data } = await supabase
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
    if (!code) { setJoinMsg("❌ Entrez un code d'invitation"); setLoading(false); return; }

    // 1. Vérifier le code
    const { data: invite, error } = await supabase
      .from("equipe_membres")
      .select("id, email_invite, statut")
      .eq("code_invitation", code)
      .single();

    if (error || !invite) { setJoinMsg("❌ Code invalide ou expiré"); setLoading(false); return; }
    if (invite.statut === "actif") { setJoinMsg("⚠️ Ce code a déjà été utilisé"); setLoading(false); return; }

    // 2. Connexion / inscription
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
    if (loginErr) {
      // Essai inscription
      const { data: signData, error: signErr } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: nom || email.split("@")[0] } }
      });
      if (signErr) { setJoinMsg("❌ " + signErr.message); setLoading(false); return; }
      if (!signData.session) {
        setJoinMsg("✅ Compte créé ! Vérifiez votre email puis revenez rejoindre l'équipe.");
        setLoading(false);
        return;
      }
    }

    // 3. Récupérer l'utilisateur connecté et lier
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setJoinMsg("❌ Connexion échouée"); setLoading(false); return; }

    await supabase.from("equipe_membres")
      .update({ membre_id: session.user.id, statut: "actif" })
      .eq("code_invitation", code);

    setJoinMsg("✅ Bienvenue dans l'équipe !");
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage("❌ " + error.message);
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true);
    setMessage("");
    const trimmedCode = referralInput.trim().toUpperCase();

    // ── 1. Valider le code de parrainage avant de créer le compte ──
    if (trimmedCode) {
      const { data: parrain, error: errCheck } = await supabase
        .from("profils")
        .select("user_id, referral_used")
        .eq("referral_code", trimmedCode)
        .single();
      if (errCheck || !parrain) {
        setMessage("❌ Code de parrainage invalide");
        setLoading(false);
        return;
      }
      if (parrain.referral_used) {
        setMessage("❌ Ce code a déjà été utilisé");
        setLoading(false);
        return;
      }
    }

    // ── 1b. Validation côté client ────────────────────────────────
    if (password !== passwordConfirm) {
      setMessage("❌ Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setMessage("❌ Le mot de passe doit faire au moins 6 caractères");
      setLoading(false);
      return;
    }

    // ── 2. Créer le compte ─────────────────────────────────────────
    const { data, error } = await supabase.auth.signUp({
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
    //   • Si session disponible (email confirmation désactivée) → upsert direct
    //   • Sinon → localStorage, appliqué au prochain login via useEffect
    const userId = data.user?.id;
    if (userId && trimmedCode) {
      if (data.session) {
        await supabase.from("profils").upsert(
          { user_id: userId, referred_by: trimmedCode },
          { onConflict: "user_id" }
        );
      }
      // Backup localStorage (couvre le cas confirmation email)
      localStorage.setItem("artisan_pending_referral", JSON.stringify({ userId, code: trimmedCode }));
      setMessage("✅ Compte créé ! 🎁 Parrainage activé — vous gagnez 1 mois Pro gratuit lors de votre abonnement.");
    } else {
      setMessage("✅ Compte créé ! Vous pouvez vous connecter.");
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

    // 1) L'appareil a déjà un compte invité → connexion directe
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: guestEmail, password: guestPass,
    });
    if (!loginErr) {
      localStorage.setItem("artisan_guest_fp", fp);
      setLoading(false);
      return;
    }

    // 2) Premier accès → création du compte invité
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: guestEmail, password: guestPass,
      options: { data: { full_name: "Invité", is_guest: true } },
    });
    if (signUpErr) {
      setMessage("❌ " + signUpErr.message);
      setLoading(false);
      return;
    }

    // Si email confirmation désactivée, Supabase renvoie une session directement
    if (signUpData?.session) {
      localStorage.setItem("artisan_guest_fp", fp);
      setLoading(false);
      return;
    }

    // Sinon on tente la connexion (confirmation auto activée côté Supabase)
    const { error: login2Err } = await supabase.auth.signInWithPassword({
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
  if (signatureToken) return <SignatureDevis token={signatureToken} />;

  // Page de suivi chantier — publique, pas d'auth
  const suiviPath = window.location.pathname;
  if (suiviPath.startsWith("/suivi/")) {
    const suiviToken = suiviPath.replace("/suivi/", "").split("?")[0];
    if (suiviToken) return <SuiviChantier token={suiviToken} />;
  }

  // Mini-site artisan public — /artisan/:slug
  if (suiviPath.startsWith("/artisan/")) {
    const artisanSlug = suiviPath.replace("/artisan/", "").split("?")[0];
    if (artisanSlug) return <MiniSite slug={artisanSlug} />;
  }

  // Accès ouvrier — /ouvrier/:token
  if (suiviPath.startsWith("/ouvrier/")) {
    const ouvrierToken = suiviPath.replace("/ouvrier/", "").split("?")[0];
    if (ouvrierToken) return <OuvrierChantier token={ouvrierToken} />;
  }

  // Détection compte invité : email déterministe généré par handleGuestLogin
  const isGuest = user?.email?.endsWith("@artisan-plus.app") === true
    || user?.user_metadata?.is_guest === true;

  if (user) return (
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
      />
    </>
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
            Gérez votre activité simplement
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
              📲 Installer l'app
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
              {tab === "login" ? "Connexion" : tab === "register" ? "Inscription" : "👥 Rejoindre"}
            </button>
          ))}
        </div>

        {/* ── Mode rejoindre une équipe ──────────────────────── */}
        {loginMode === "join-team" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "rgba(255,140,0,0.06)", border: "1px solid rgba(255,140,0,0.2)", borderRadius: "12px", padding: "14px 16px" }}>
              <div style={{ color: PRIMARY, fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>👥 Rejoindre l'équipe d'un artisan</div>
              <div style={{ color: "#8899aa", fontSize: "12px" }}>Entrez le code d'invitation reçu par email, puis connectez-vous ou créez votre compte.</div>
            </div>
            <input placeholder="Code d'invitation (ex: EQUIP-ABC123)" value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())} style={{ ...inputStyle, textAlign: "center", fontWeight: "700", fontSize: "16px", letterSpacing: "2px" }} />
            <input placeholder="Votre nom complet" value={nom}
              onChange={e => setNom(e.target.value)} style={inputStyle} />
            <input placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <input placeholder="Mot de passe" type="password" value={password}
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
              {loading ? "Connexion…" : "🚀 Rejoindre l'équipe"}
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {page === "register" && (
                <input placeholder="Nom complet" value={nom}
                  onChange={e => setNom(e.target.value)} style={inputStyle} />
              )}
              <input placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && (page === "login" ? handleLogin() : handleRegister())}
                style={inputStyle} />
              <input placeholder="Mot de passe" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && page === "login" && handleLogin()}
                style={inputStyle} />
              {page === "register" && (
                <>
                  <input
                    placeholder="Confirmer le mot de passe"
                    type="password"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !loading && handleRegister()}
                    style={inputStyle}
                  />
                  <div style={{ position: "relative" }}>
                    <input
                      placeholder="Code de parrainage (optionnel)"
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
                {loading ? "Chargement..." : page === "login" ? "Se connecter" : "Créer mon compte artisan"}
              </button>
            </div>

            {page === "login" && (
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <span style={{ color: "#8899aa", fontSize: "13px" }}>Pas encore de compte ? </span>
                <span onClick={() => setPage("register")} style={{
                  color: PRIMARY, fontSize: "13px", cursor: "pointer", fontWeight: "600"
                }}>
                  S'inscrire gratuitement
                </span>
              </div>
            )}
          </>
        )}

        {/* ── Séparateur + bouton invité ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0 4px" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
          <span style={{ color: "#556677", fontSize: "12px", whiteSpace: "nowrap" }}>ou</span>
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
            👤 Essayer sans compte
          </span>
          <span style={{ color: "#556677", fontSize: "11px" }}>
            Accès gratuit limité · Aucune inscription
          </span>
        </button>
      </div>
    </div>
    </>
  );
}

const inputStyle = {
  background: "#0a1628", border: "1px solid rgba(255,140,0,0.2)",
  borderRadius: "10px", padding: "13px 16px", color: "white",
  fontSize: "15px", outline: "none", width: "100%", boxSizing: "border-box"
};