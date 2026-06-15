import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const PRIMARY = "#FF8C00";
const DARK = "#0a1628";
const CARD = "#111e35";

const inputStyle = {
  background: "#0a1628",
  border: "1px solid rgba(255,140,0,0.2)",
  borderRadius: "10px",
  padding: "12px 16px",
  color: "white",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box"
};

export default function Profil({ user, onBack }) {
  const [profil, setProfil] = useState({
    nom: "",
    siret: "",
    adresse: "",
    telephone: "",
    email: user.email,
    tva_numero: "",
    iban: "",
    logo_url: "",
  });
  const [loading, setLoading]         = useState(false);
  const [message, setMessage]         = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoHover, setLogoHover]     = useState(false);
  const fileInputRef                  = useRef(null);

  useEffect(() => { chargerProfil(); }, []);

  const chargerProfil = async () => {
    const { data } = await supabase
      .from("profils")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (data) setProfil(prev => ({ ...prev, ...data }));
  };

  const sauvegarder = async () => {
    setLoading(true);
    setMessage("");
    const { error } = await supabase
      .from("profils")
      .upsert({ ...profil, user_id: user.id });
    if (error) setMessage("❌ Erreur: " + error.message);
    else setMessage("✅ Profil sauvegardé !");
    setLoading(false);
  };

  const uploadLogo = async (fichier) => {
    if (!fichier) return;
    const maxMo = 5;
    if (fichier.size > maxMo * 1024 * 1024) {
      setMessage(`❌ Image trop lourde (max ${maxMo} Mo)`);
      return;
    }
    setLogoUploading(true);
    setMessage("");
    try {
      const ext  = fichier.name.split(".").pop().toLowerCase();
      const path = `${user.id}/logo.${ext}`;
      const { error: errUp } = await supabase.storage
        .from("logos")
        .upload(path, fichier, { cacheControl: "3600", upsert: true });
      if (errUp) throw errUp;

      const { data: { publicUrl } } = supabase.storage
        .from("logos")
        .getPublicUrl(path);

      const urlAvecCache = publicUrl + "?t=" + Date.now();

      // Sauvegarder immédiatement en DB
      await supabase
        .from("profils")
        .upsert({ ...profil, user_id: user.id, logo_url: urlAvecCache });

      setProfil(prev => ({ ...prev, logo_url: urlAvecCache }));
      setMessage("✅ Logo mis à jour !");
    } catch (e) {
      setMessage("❌ Erreur upload : " + e.message);
    }
    setLogoUploading(false);
  };

  const supprimerLogo = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Supprimer le logo ?")) return;
    setLogoUploading(true);
    await supabase.from("profils").upsert({ ...profil, user_id: user.id, logo_url: null });
    setProfil(prev => ({ ...prev, logo_url: "" }));
    setMessage("✅ Logo supprimé.");
    setLogoUploading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: DARK, fontFamily: "'Segoe UI', sans-serif" }}>

      {/* HEADER STICKY */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: DARK, borderBottom: "1px solid rgba(255,140,0,0.12)" }}>
        <div style={{ height: "env(safe-area-inset-top, 0px)", background: DARK }} />
        <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 20px" }}>
          <button onClick={onBack} style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)", color: PRIMARY, borderRadius: "8px", padding: "9px 16px", cursor: "pointer", fontSize: "14px", fontWeight: "700", flexShrink: 0 }}>← Retour</button>
          <h1 style={{ color: "white", margin: 0, fontSize: "20px", fontWeight: "800" }}>Mon Profil</h1>
        </div>
      </div>

      <div style={{ padding: "24px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* LOGO */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", paddingTop: "8px" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: "none" }}
            onChange={e => uploadLogo(e.target.files?.[0])}
          />

          {/* Zone cliquable */}
          <div
            onClick={() => !logoUploading && fileInputRef.current?.click()}
            onMouseEnter={() => setLogoHover(true)}
            onMouseLeave={() => setLogoHover(false)}
            style={{
              position: "relative",
              width: "100px", height: "100px",
              borderRadius: "50%",
              cursor: logoUploading ? "not-allowed" : "pointer",
              flexShrink: 0,
              border: `2.5px solid ${logoHover && !logoUploading ? PRIMARY : "rgba(255,140,0,0.35)"}`,
              boxShadow: logoHover && !logoUploading ? "0 0 0 4px rgba(255,140,0,0.15)" : "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
              overflow: "hidden",
              background: CARD,
            }}
          >
            {/* Image ou placeholder */}
            {profil.logo_url ? (
              <img
                src={profil.logo_url}
                alt="Logo"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "38px",
              }}>
                👤
              </div>
            )}

            {/* Overlay au hover */}
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "4px",
              opacity: (logoHover || logoUploading) ? 1 : 0,
              transition: "opacity 0.2s",
            }}>
              {logoUploading ? (
                <span style={{ color: "white", fontSize: "11px", fontWeight: "700" }}>⏳</span>
              ) : (
                <>
                  <span style={{ fontSize: "20px" }}>📷</span>
                  <span style={{ color: "white", fontSize: "10px", fontWeight: "700", textAlign: "center", lineHeight: "1.3" }}>
                    Modifier
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Texte aide + supprimer */}
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#8899aa", fontSize: "12px" }}>
              Cliquez sur le logo pour le modifier
            </div>
            <div style={{ color: "#556677", fontSize: "11px", marginTop: "2px" }}>
              JPG, PNG ou WebP — max 5 Mo
            </div>
            {profil.logo_url && (
              <button
                onClick={supprimerLogo}
                disabled={logoUploading}
                style={{
                  marginTop: "6px",
                  background: "none", border: "none",
                  color: "#ff6b6b", fontSize: "11px",
                  cursor: "pointer", textDecoration: "underline",
                  padding: 0,
                }}
              >
                Supprimer le logo
              </button>
            )}
          </div>
        </div>

        {/* INFOS PERSONNELLES */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h3 style={{ color: "white", marginTop: 0 }}>👤 Informations personnelles</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ color: "#8899aa", fontSize: "12px", marginBottom: "6px", display: "block" }}>Nom complet *</label>
              <input placeholder="Ex: Jean Dupont" value={profil.nom || ""}
                onChange={e => setProfil({ ...profil, nom: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: "#8899aa", fontSize: "12px", marginBottom: "6px", display: "block" }}>Email</label>
              <input value={profil.email || ""} disabled
                style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }} />
            </div>
            <div>
              <label style={{ color: "#8899aa", fontSize: "12px", marginBottom: "6px", display: "block" }}>Téléphone</label>
              <input placeholder="Ex: 06 12 34 56 78" value={profil.telephone || ""}
                onChange={e => setProfil({ ...profil, telephone: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: "#8899aa", fontSize: "12px", marginBottom: "6px", display: "block" }}>Adresse complète</label>
              <input placeholder="Ex: 12 rue de la Paix, 75001 Paris" value={profil.adresse || ""}
                onChange={e => setProfil({ ...profil, adresse: e.target.value })} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* INFOS PROFESSIONNELLES */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h3 style={{ color: "white", marginTop: 0 }}>🏢 Informations professionnelles</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ color: "#8899aa", fontSize: "12px", marginBottom: "6px", display: "block" }}>SIRET *</label>
              <input placeholder="Ex: 123 456 789 00012" value={profil.siret || ""}
                onChange={e => setProfil({ ...profil, siret: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: "#8899aa", fontSize: "12px", marginBottom: "6px", display: "block" }}>Numéro TVA (si applicable)</label>
              <input placeholder="Ex: FR12345678901" value={profil.tva_numero || ""}
                onChange={e => setProfil({ ...profil, tva_numero: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: "#8899aa", fontSize: "12px", marginBottom: "6px", display: "block" }}>IBAN (pour les factures)</label>
              <input placeholder="Ex: FR76 1234 5678 9012 3456 7890 123" value={profil.iban || ""}
                onChange={e => setProfil({ ...profil, iban: e.target.value })} style={inputStyle} />
            </div>
          </div>
        </div>

        {message && (
          <div style={{
            color: message.includes("✅") ? "#4CAF50" : "#ff6b6b",
            textAlign: "center", fontSize: "15px", fontWeight: "600"
          }}>
            {message}
          </div>
        )}

        <button onClick={sauvegarder} disabled={loading} style={{
          background: loading ? "#888" : PRIMARY,
          color: "white", border: "none", borderRadius: "12px",
          padding: "16px", fontSize: "17px", fontWeight: "700",
          cursor: loading ? "not-allowed" : "pointer", marginBottom: "32px"
        }}>
          {loading ? "Sauvegarde..." : "💾 Sauvegarder mon profil"}
        </button>

      </div>
      </div>
    </div>
  );
}
