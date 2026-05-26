import { useState, useEffect } from "react";
import { supabase } from "./supabase";

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

const SECTIONS = [
  { id: "profil",        label: "Mon profil",    emoji: "👤" },
  { id: "apparence",     label: "Apparence",     emoji: "🎨" },
  { id: "factures",      label: "Facturation",   emoji: "📄" },
  { id: "notifications", label: "Notifs",        emoji: "🔔" },
  { id: "abonnement",    label: "Abonnement",    emoji: "💎" },
  { id: "securite",      label: "Sécurité",      emoji: "🔒" },
  { id: "danger",        label: "Danger",        emoji: "⚠️" },
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

export default function Parametres({ user, onBack }) {
  const [activeSection, setActiveSection] = useState("profil");
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

  // ── Paramètres ──────────────────────────────────────
  const [params, setParams] = useState({
    theme_pdf: "moderne",
    couleur_pdf: "#FF8C00",
    format_numerotation: "FAC-{YYYY}-{NNN}",
    tva_defaut: "20",
    mention_legale: "",
    conditions_paiement: "Paiement à réception de facture",
    penalites_retard: "1,5% par mois",
    numero_assurance: "",
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

  // ── Chargement ───────────────────────────────────────
  useEffect(() => { charger(); }, []);

  const charger = async () => {
    setLoading(true);
    const [{ data: p }, { data: pm }] = await Promise.all([
      supabase.from("profils").select("*").eq("user_id", user.id).single(),
      supabase.from("parametres").select("*").eq("user_id", user.id).single(),
    ]);
    if (p) setProfil({
      nom:       p.nom       || "",
      adresse:   p.adresse   || "",
      siret:     p.siret     || "",
      telephone: p.telephone || "",
      iban:      p.iban      || "",
      logo_url:  p.logo_url  || "",
    });
    if (pm) setParams({
      theme_pdf:             pm.theme_pdf             || "moderne",
      couleur_pdf:           pm.couleur_pdf           || "#FF8C00",
      format_numerotation:   pm.format_numerotation   || "FAC-{YYYY}-{NNN}",
      tva_defaut:            String(pm.tva_defaut      ?? "20"),
      mention_legale:        pm.mention_legale        || "",
      conditions_paiement:   pm.conditions_paiement   || "Paiement à réception de facture",
      penalites_retard:      pm.penalites_retard      || "1,5% par mois",
      numero_assurance:      pm.numero_assurance      || "",
      notif_emails:          pm.notif_emails          || false,
      notif_rappels_devis:   pm.notif_rappels_devis   || false,
      notif_rappels_factures: pm.notif_rappels_factures || false,
    });
    setLoading(false);
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
    setSavingParams(false);
    if (error) setMsgParams("❌ " + error.message);
    else       setMsgParams("✅ Paramètres sauvegardés !");
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

  // ── Supprimer compte ─────────────────────────────────
  const supprimerCompte = async () => {
    alert("Pour supprimer définitivement votre compte, contactez le support à support@artisan-plus.fr\nVos données seront effacées dans les 48h.");
    setDeleteStep(0); setDeleteConfirmText("");
  };

  // ────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#8899aa" }}>
      <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚙️</div>
      Chargement des paramètres…
    </div>
  );

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", paddingBottom: "20px" }}>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button onClick={onBack} style={{
          background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
          color: "white", borderRadius: "8px", padding: "8px 16px",
          cursor: "pointer", fontSize: "14px", fontWeight: "600"
        }}>← Retour</button>
        <h2 style={{ color: "white", margin: 0, fontSize: "22px", fontWeight: "800" }}>⚙️ Paramètres</h2>
      </div>

      {/* ── Nav sections ──────────────────────────────── */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "22px", overflowX: "auto", paddingBottom: "4px" }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            background: activeSection === s.id ? "rgba(255,140,0,0.15)" : "rgba(255,255,255,0.04)",
            border: `1.5px solid ${activeSection === s.id ? PRIMARY : "rgba(255,255,255,0.08)"}`,
            color: activeSection === s.id ? PRIMARY : "#8899aa",
            borderRadius: "10px", padding: "8px 14px", fontSize: "12px", fontWeight: "700",
            cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s", flexShrink: 0,
          }}>
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

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

          <SCard titre="📧 Compte">
            <label style={lbl}>Adresse email</label>
            <div style={{ ...inp, color: "#8899aa", cursor: "not-allowed", userSelect: "none" }}>{user.email}</div>
            <div style={{ color: "#555", fontSize: "11px", marginTop: "6px" }}>Pour changer d'adresse email, contactez le support.</div>
          </SCard>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          APPARENCE
      ══════════════════════════════════════════════════ */}
      {activeSection === "apparence" && (
        <SCard titre="🎨 Apparence des PDF">
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Thème */}
            <div>
              <label style={{ ...lbl, marginBottom: "10px" }}>Thème PDF par défaut</label>
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

            {/* Couleur */}
            <div>
              <label style={lbl}>🎨 Couleur d'accentuation personnalisée</label>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <input type="color" value={params.couleur_pdf}
                  onChange={e => setParams(prev => ({ ...prev, couleur_pdf: e.target.value }))}
                  style={{ width: "52px", height: "52px", border: "2px solid rgba(255,140,0,0.2)", background: "none", cursor: "pointer", borderRadius: "10px", padding: "3px" }} />
                <div>
                  <input value={params.couleur_pdf}
                    onChange={e => setParams(prev => ({ ...prev, couleur_pdf: e.target.value }))}
                    style={{ ...inp, width: "140px" }} placeholder="#FF8C00" />
                  <div style={{ color: "#555", fontSize: "11px", marginTop: "4px" }}>Appliquée sur titres et lignes des PDF</div>
                </div>
                <div style={{ width: "52px", height: "52px", borderRadius: "10px", background: params.couleur_pdf, border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
            </div>
          </div>

          {msgParams && <div style={{ marginTop: "12px", fontSize: "13px", fontWeight: "600", color: msgParams.includes("✅") ? "#4CAF50" : "#ff6b6b" }}>{msgParams}</div>}
          <SaveBtn onClick={sauvegarderParams} saving={savingParams} label="Sauvegarder l'apparence" />
        </SCard>
      )}

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
              <label style={lbl}>🛡️ Numéro d'assurance décennale</label>
              <input value={params.numero_assurance}
                onChange={e => setParams(prev => ({ ...prev, numero_assurance: e.target.value }))}
                style={inp} placeholder="N° Police : 123456789 — Assureur XYZ" />
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
          ABONNEMENT
      ══════════════════════════════════════════════════ */}
      {activeSection === "abonnement" && (
        <div>
          {/* Plan actuel */}
          <SCard titre="💎 Mon abonnement">
            <div style={{ background: DARK, borderRadius: "12px", padding: "18px", border: "1px solid rgba(255,140,0,0.15)", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Plan actuel</div>
                <div style={{ color: "white", fontSize: "26px", fontWeight: "800" }}>Gratuit</div>
                <div style={{ color: "#8899aa", fontSize: "12px", marginTop: "3px" }}>Accès aux fonctions de base</div>
              </div>
              <div style={{ background: "rgba(136,153,170,0.15)", border: "1px solid rgba(136,153,170,0.25)", borderRadius: "10px", padding: "8px 16px" }}>
                <span style={{ color: "#8899aa", fontWeight: "800", fontSize: "13px", letterSpacing: "1px" }}>FREE</span>
              </div>
            </div>

            {/* Offre Pro */}
            <div style={{ background: "linear-gradient(135deg, rgba(255,140,0,0.13) 0%, rgba(255,140,0,0.04) 100%)", borderRadius: "16px", padding: "20px", border: "1.5px solid rgba(255,140,0,0.35)", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <div style={{ color: PRIMARY, fontSize: "20px", fontWeight: "800" }}>✨ Plan Pro</div>
                  <div style={{ color: "#8899aa", fontSize: "13px", marginTop: "2px" }}>Tout illimité, fonctions avancées</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "white", fontSize: "26px", fontWeight: "800", lineHeight: 1 }}>9,90 €</div>
                  <div style={{ color: "#8899aa", fontSize: "12px" }}>/mois TTC</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "6px", marginBottom: "18px" }}>
                {[
                  "✅ Clients, factures, devis illimités",
                  "✅ Chantiers illimités avec photos HD",
                  "✅ Relances automatiques par email",
                  "✅ Logo sur toutes les factures",
                  "✅ Export comptable (CSV, PDF)",
                  "✅ Support prioritaire 7j/7",
                ].map((f, i) => (
                  <div key={i} style={{ color: "#ccc", fontSize: "13px" }}>{f}</div>
                ))}
              </div>

              <button style={{ background: PRIMARY, color: "white", border: "none", borderRadius: "12px", padding: "14px", fontSize: "15px", fontWeight: "800", cursor: "pointer", width: "100%", letterSpacing: "0.3px" }}>
                🚀 Passer au Pro — 9,90 €/mois
              </button>
            </div>

            <div style={{ color: "#555", fontSize: "12px", textAlign: "center" }}>
              Paiement sécurisé par Stripe · Sans engagement · Résiliable à tout moment
            </div>
          </SCard>

          {/* Historique */}
          <SCard titre="📊 Historique des paiements">
            <div style={{ textAlign: "center", padding: "28px 20px", color: "#555" }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>📭</div>
              <div style={{ fontSize: "13px", fontStyle: "italic" }}>Aucun paiement enregistré — vous êtes sur le plan gratuit</div>
            </div>
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
            <pre style={{ color: "#8899aa", fontSize: "11px", margin: 0, overflowX: "auto", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{`ALTER TABLE profils
  ADD COLUMN IF NOT EXISTS iban TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

CREATE TABLE IF NOT EXISTS parametres (
  user_id UUID PRIMARY KEY,
  theme_pdf TEXT DEFAULT 'moderne',
  couleur_pdf TEXT DEFAULT '#FF8C00',
  format_numerotation TEXT DEFAULT 'FAC-{YYYY}-{NNN}',
  tva_defaut NUMERIC DEFAULT 20,
  mention_legale TEXT,
  conditions_paiement TEXT,
  penalites_retard TEXT,
  numero_assurance TEXT,
  notif_emails BOOLEAN DEFAULT false,
  notif_rappels_devis BOOLEAN DEFAULT false,
  notif_rappels_factures BOOLEAN DEFAULT false
);
ALTER TABLE parametres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON parametres USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());`}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
