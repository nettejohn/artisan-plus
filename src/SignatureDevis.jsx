import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import { genererFacturePDF, genererPDFBase64, chargerLogoBase64 } from "./GenerateurPDF";

const PRIMARY = "#FF8C00";
const DARK = "#0a1628";
const CARD = "#111e35";

export default function SignatureDevis({ token }) {
  const [isFacture, setIsFacture] = useState(false);
  const [devis, setDevis] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [artisan, setArtisan] = useState(null);
  const [nom, setNom] = useState("");
  const [accepte, setAccepte] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signe, setSigne] = useState(false);
  const [erreur, setErreur] = useState("");
  const [signatureId, setSignatureId] = useState(null);
  const [emailStatut, setEmailStatut] = useState(null); // null | "envoi" | "ok" | "partiel" | "erreur"
  const [emailDetail, setEmailDetail] = useState({ artisan: false, client: false });
  const canvasRef = useRef(null);
  const signatureDataRef = useRef(null); // stocke la signature après validation pour le PDF signé
  const [dessin, setDessin] = useState(false);
  const [aDessiné, setADessiné] = useState(false);
  const [voirDetailDevis, setVoirDetailDevis] = useState(false);
  const [logoBase64, setLogoBase64] = useState(null);
  const [couleurPdf, setCouleurPdf] = useState(null);
  const [couleursPdf, setCouleursPdf] = useState(null);
  const [afficherBadgePdf, setAfficherBadgePdf] = useState(true);

  useEffect(() => {
    chargerDevis();
  }, [token]);

  const chargerDevis = async () => {
    try {
      const resp = await fetch(`/api/get-devis-public?token=${encodeURIComponent(token)}`);
      const json = await resp.json();

      if (!resp.ok) {
        setErreur(json.error || "Lien invalide ou expiré.");
        setLoading(false);
        return;
      }

      const { signature: sigData, devis: devisData, lignes: lignesData, artisan: artisanData, couleur_pdf, isFacture: isFact } = json;

      if (sigData.signe_le) {
        setSigne(true);
        setLoading(false);
        return;
      }

      setIsFacture(!!isFact);
      setSignatureId(sigData.id);
      setDevis(devisData);
      setLignes(lignesData || []);
      setArtisan(artisanData);
      if (couleur_pdf) setCouleurPdf(couleur_pdf);
      if (json.couleurs_pdf) setCouleursPdf(json.couleurs_pdf);
      if (json.afficher_badge_verifie !== null && json.afficher_badge_verifie !== undefined) {
        setAfficherBadgePdf(json.afficher_badge_verifie);
      }

      if (artisanData?.logo_url) {
        chargerLogoBase64(artisanData.logo_url).then(setLogoBase64);
      }

      setLoading(false);

    } catch (e) {
      setErreur("Une erreur est survenue.");
      setLoading(false);
    }
  };

  // ── Dessin de signature ──────────────────────────────────────────────────────

  const startDraw = (e) => {
    if (!canvasRef.current) return;
    setDessin(true);
    setADessiné(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * scaleX;
    const y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * scaleY;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!dessin || !canvasRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * scaleX;
    const y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * scaleY;
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#FF8C00";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDraw = () => setDessin(false);

  const effacerSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setADessiné(false);
  };

  // ── Génération PDF ───────────────────────────────────────────────────────────

  /** Convertit un data URI PDF en blob URL et l'ouvre dans un nouvel onglet. */
  const ouvrirPDF = (dataUri) => {
    const base64 = dataUri.split(",")[1];
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: "application/pdf" });
    window.open(URL.createObjectURL(blob), "_blank");
  };

  const voirDevis = () => setVoirDetailDevis(true);

  const telechargerDevis = () => {
    if (!devis || !artisan) return;
    try {
      genererFacturePDF(devis, devis.clients, lignes, artisan, true, { logoBase64, couleurPdf, couleursPdf, artisanVerifie: artisan?.verification_statut === "verifie", afficherBadgeVerifie: afficherBadgePdf });
    } catch (_) {}
  };

  const voirDevisSigne = () => {
    if (!devis || !artisan) return;
    try {
      ouvrirPDF(genererPDFBase64(devis, devis.clients, lignes, artisan, true, {
        signatureImage: signatureDataRef.current,
        nomSignataire: nom,
        logoBase64,
        couleurPdf,
        couleursPdf,
        artisanVerifie: artisan?.verification_statut === "verifie",
        afficherBadgeVerifie: afficherBadgePdf,
      }));
    } catch (_) {}
  };

  const telechargerDevisSigne = () => {
    if (!devis || !artisan) return;
    try {
      genererFacturePDF(devis, devis.clients, lignes, artisan, true, {
        signatureImage: signatureDataRef.current,
        nomSignataire: nom,
        logoBase64,
        couleurPdf,
        couleursPdf,
        artisanVerifie: artisan?.verification_statut === "verifie",
        afficherBadgeVerifie: afficherBadgePdf,
      });
    } catch (_) {}
  };

  // ── Signature et envoi email ─────────────────────────────────────────────────

  const signer = async () => {
    if (!nom.trim()) { alert("Veuillez entrer votre nom complet"); return; }
    if (!accepte) { alert("Veuillez cocher la case d'acceptation"); return; }
    if (!aDessiné) { alert("Veuillez signer dans la zone de signature"); return; }

    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL();
    signatureDataRef.current = signatureData; // conserver pour les boutons post-signature

    // 1. Enregistrer la signature en base — C6 : vérifier le succès avant de continuer
    const { error: sigErr } = await supabase
      .from("signatures")
      .update({
        signature_data: signatureData,
        nom_signataire: nom,
        signe_le: new Date().toISOString()
      })
      .eq("id", signatureId);

    if (sigErr) {
      alert("Erreur lors de l'enregistrement de la signature. Veuillez réessayer.");
      return;
    }

    // 2. Mettre à jour le statut du document (devis ou facture)
    if (isFacture) {
      await supabase.from("factures").update({ statut: "signee" }).eq("id", devis.id);
    } else {
      await supabase.from("devis").update({ statut: "accepte" }).eq("id", devis.id);
    }
    // On continue même si la mise à jour échoue — la signature est enregistrée

    // 3. Afficher l'écran de succès
    setSigne(true);

    // 4. Générer le PDF signé pour pièce jointe email
    let pdfBase64 = null;
    try {
      const dataUri = genererPDFBase64(devis, devis.clients, lignes, artisan, true, {
        signatureImage: signatureData,
        nomSignataire: nom,
        logoBase64,
        couleurPdf,
        couleursPdf,
        artisanVerifie: artisan?.verification_statut === "verifie",
        afficherBadgeVerifie: afficherBadgePdf,
      });
      pdfBase64 = dataUri.split(",")[1]; // strip "data:application/pdf;base64,"
    } catch (_) {}

    // 5. Envoyer les emails via la fonction serverless Vercel
    setEmailStatut("envoi");
    try {
      const payload = isFacture
        ? {
            numeroFacture: devis.numero,
            emailClient: devis.clients?.email || null,
            emailArtisan: artisan?.email || null,
            nomArtisan: artisan?.nom || null,
            nomClient: nom,
            montantTTC: devis.total_ttc ?? null,
            pdfBase64,
          }
        : {
            emailArtisan: artisan?.email || null,
            emailClient: devis.clients?.email || null,
            nomClient: nom,
            nomArtisan: artisan?.nom || null,
            numeroDevis: devis.numero,
            montantTTC: devis.total_ttc ?? null,
            pdfBase64,
          };

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Lire le corps même si la réponse n'est pas ok
      let resultat = {};
      try {
        resultat = await response.json();
      } catch (_) {
        setEmailStatut("erreur");
        return;
      }

      if (!response.ok && !resultat.artisanEnvoye && !resultat.clientEnvoye) {
        setEmailStatut("erreur");
        return;
      }

      setEmailDetail({
        artisan: resultat.artisanEnvoye ?? false,
        client: resultat.clientEnvoye ?? false,
      });

      if (resultat.success) {
        setEmailStatut("ok");
      } else if (resultat.artisanEnvoye || resultat.clientEnvoye) {
        setEmailStatut("partiel");
      } else {
        setEmailStatut("erreur");
      }
    } catch (_) {
      setEmailStatut("erreur");
    }
  };

  // ── Rendus conditionnels ─────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "white", fontSize: "18px" }}>Chargement...</div>
    </div>
  );

  if (erreur) return (
    <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: CARD, borderRadius: "16px", padding: "40px", textAlign: "center", maxWidth: "400px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
        <div style={{ color: "white", fontSize: "18px", fontWeight: "700" }}>{erreur}</div>
      </div>
    </div>
  );

  if (signe) return (
    <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: CARD, borderRadius: "20px", padding: "40px", textAlign: "center", maxWidth: "420px", width: "100%", border: "1px solid rgba(76,175,80,0.3)", boxShadow: "0 0 40px rgba(76,175,80,0.1)" }}>
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
        <div style={{ color: "white", fontSize: "22px", fontWeight: "800", marginBottom: "8px" }}>{isFacture ? "Facture signée !" : "Devis signé !"}</div>
        <div style={{ color: "#8899aa", fontSize: "14px", marginBottom: "28px" }}>
          Votre accord a bien été enregistré.
        </div>

        {/* Statut des emails */}
        {emailStatut === "envoi" && (
          <div style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.25)", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "18px", height: "18px", border: "2px solid " + PRIMARY, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
            <span style={{ color: PRIMARY, fontSize: "13px", fontWeight: "600" }}>Envoi des confirmations par email…</span>
          </div>
        )}

        {emailStatut === "ok" && (
          <div style={{ background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.3)", borderRadius: "12px", padding: "16px" }}>
            <div style={{ color: "#4CAF50", fontSize: "14px", fontWeight: "700", marginBottom: "10px" }}>📧 Emails envoyés</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {emailDetail.artisan && (
                <div style={{ color: "#ccc", fontSize: "13px" }}>✔ Artisan notifié</div>
              )}
              {emailDetail.client && (
                <div style={{ color: "#ccc", fontSize: "13px" }}>✔ Confirmation envoyée au client</div>
              )}
            </div>
          </div>
        )}

        {emailStatut === "partiel" && (
          <div style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)", borderRadius: "12px", padding: "16px" }}>
            <div style={{ color: PRIMARY, fontSize: "14px", fontWeight: "700", marginBottom: "10px" }}>📧 Envoi partiel</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ color: "#ccc", fontSize: "13px" }}>{emailDetail.artisan ? "✔ Artisan notifié" : "✗ Email artisan non envoyé"}</div>
              <div style={{ color: "#ccc", fontSize: "13px" }}>{emailDetail.client ? "✔ Client notifié" : "✗ Email client non envoyé (email non renseigné ?)"}</div>
            </div>
          </div>
        )}

        {emailStatut === "erreur" && (
          <div style={{ background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.25)", borderRadius: "12px", padding: "14px" }}>
            <div style={{ color: "#ff6b6b", fontSize: "13px" }}>⚠️ Emails non envoyés — votre signature est bien enregistrée.</div>
          </div>
        )}

        {/* Boutons PDF signé */}
        {devis && artisan && (
          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button
              onClick={voirDevisSigne}
              style={{
                flex: 1, background: "transparent",
                border: "1px solid rgba(255,140,0,0.45)",
                color: PRIMARY, borderRadius: "10px", padding: "11px 8px",
                fontSize: "13px", fontWeight: "600", cursor: "pointer",
                transition: "background 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,140,0,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              📄 Lire le {isFacture ? "document" : "devis"} signé
            </button>
            <button
              onClick={telechargerDevisSigne}
              style={{
                flex: 1, background: "transparent",
                border: "1px solid rgba(255,140,0,0.45)",
                color: PRIMARY, borderRadius: "10px", padding: "11px 8px",
                fontSize: "13px", fontWeight: "600", cursor: "pointer",
                transition: "background 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,140,0,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              ⬇️ Télécharger le {isFacture ? "document" : "devis"} signé
            </button>
          </div>
        )}
      </div>

      {/* Animation rotation pour le spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Écran principal (avant signature) ────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: DARK, fontFamily: "'Segoe UI', sans-serif", padding: "20px" }}>

      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{ fontSize: "28px", fontWeight: "900", color: "white" }}>
          Artisan<span style={{ color: PRIMARY }}>+</span>
        </div>
        <div style={{ color: "#8899aa", fontSize: "13px", marginTop: "4px" }}>Signature de devis</div>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* RÉSUMÉ */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <div style={{ color: PRIMARY, fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>DEVIS</div>
              <div style={{ color: "white", fontSize: "20px", fontWeight: "800" }}>{devis?.numero}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#8899aa", fontSize: "12px" }}>Total</div>
              <div style={{ color: PRIMARY, fontSize: "24px", fontWeight: "800" }}>{devis?.total_ttc?.toFixed(2)} €</div>
            </div>
          </div>

          {artisan && (
            <div style={{ marginBottom: "12px", padding: "12px", background: "#0a1628", borderRadius: "10px" }}>
              <div style={{ color: "#8899aa", fontSize: "11px", marginBottom: "4px" }}>ARTISAN</div>
              <div style={{ color: "white", fontWeight: "600" }}>{artisan.nom}</div>
              {artisan.telephone && <div style={{ color: "#8899aa", fontSize: "12px" }}>{artisan.telephone}</div>}
            </div>
          )}

          <div style={{ borderTop: "1px solid rgba(255,140,0,0.1)", paddingTop: "16px" }}>
            <div style={{ color: "#8899aa", fontSize: "11px", fontWeight: "700", marginBottom: "8px" }}>PRESTATIONS</div>
            {lignes.map((l, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "white", fontSize: "14px" }}>{l.description}</span>
                <span style={{ color: PRIMARY, fontSize: "14px", fontWeight: "600" }}>{(l.quantite * l.prix_unitaire).toFixed(2)} €</span>
              </div>
            ))}
          </div>

          {devis?.tva > 0 && (
            <div style={{ borderTop: "1px solid rgba(255,140,0,0.1)", paddingTop: "12px", marginTop: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#8899aa" }}>Total HT</span>
                <span style={{ color: "white" }}>{devis?.total_ht?.toFixed(2)} €</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                <span style={{ color: "#8899aa" }}>TVA ({devis?.tva}%)</span>
                <span style={{ color: "white" }}>{(devis?.total_ttc - devis?.total_ht).toFixed(2)} €</span>
              </div>
            </div>
          )}

          {devis?.tva === 0 && (
            <div style={{ marginTop: "8px", color: "#8899aa", fontSize: "11px", fontStyle: "italic" }}>
              TVA non applicable, art. 293 B du CGI
            </div>
          )}
        </div>

        {/* BOUTONS DEVIS (avant signature) */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={voirDevis}
            style={{
              flex: 1, background: "transparent",
              border: "1px solid rgba(255,140,0,0.35)",
              color: PRIMARY, borderRadius: "10px", padding: "12px 8px",
              fontSize: "14px", fontWeight: "600", cursor: "pointer",
              transition: "background 0.15s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,140,0,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            📄 Voir le devis
          </button>
          <button
            onClick={telechargerDevis}
            style={{
              flex: 1, background: "transparent",
              border: "1px solid rgba(255,140,0,0.35)",
              color: PRIMARY, borderRadius: "10px", padding: "12px 8px",
              fontSize: "14px", fontWeight: "600", cursor: "pointer",
              transition: "background 0.15s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,140,0,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            ⬇️ Télécharger le devis
          </button>
        </div>

        {/* ACCEPTATION */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h3 style={{ color: "white", marginTop: 0 }}>✅ Acceptation</h3>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px", background: "#0a1628", borderRadius: "10px" }}>
            <input type="checkbox" id="accepte" checked={accepte}
              onChange={e => setAccepte(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: PRIMARY, marginTop: "2px", flexShrink: 0 }} />
            <label htmlFor="accepte" style={{ color: "white", fontSize: "14px", cursor: "pointer", lineHeight: "1.5" }}>
              J'accepte le devis <strong>{devis?.numero}</strong> d'un montant de <strong style={{ color: PRIMARY }}>{devis?.total_ttc?.toFixed(2)} €</strong> et autorise l'artisan à commencer les travaux.
            </label>
          </div>
        </div>

        {/* NOM */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <h3 style={{ color: "white", marginTop: 0 }}>👤 Votre nom complet</h3>
          <input placeholder="Ex: Jean Dupont" value={nom}
            onChange={e => setNom(e.target.value)}
            style={{
              background: "#0a1628", border: "1px solid rgba(255,140,0,0.2)",
              borderRadius: "10px", padding: "12px 16px", color: "white",
              fontSize: "16px", outline: "none", width: "100%", boxSizing: "border-box"
            }} />
        </div>

        {/* SIGNATURE */}
        <div style={{ background: CARD, borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,140,0,0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ color: "white", margin: 0 }}>🖊️ Votre signature</h3>
            <button onClick={effacerSignature} style={{
              background: "transparent", border: "1px solid rgba(255,100,100,0.3)",
              color: "#ff6b6b", borderRadius: "8px", padding: "6px 12px",
              cursor: "pointer", fontSize: "12px"
            }}>Effacer</button>
          </div>
          <div style={{ color: "#8899aa", fontSize: "12px", marginBottom: "12px" }}>
            Signez avec votre doigt ou votre souris
          </div>
          <canvas
            ref={canvasRef}
            width={560}
            height={180}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
            style={{
              background: "#0a1628",
              border: `2px solid ${aDessiné ? PRIMARY : "rgba(255,140,0,0.2)"}`,
              borderRadius: "10px",
              width: "100%",
              /* C9 — hauteur responsive : min 140px, 30vw sur tablette/desktop */
              height: "clamp(140px, 30vw, 200px)",
              touchAction: "none",
              cursor: "crosshair",
              display: "block",
            }}
          />
        </div>

        <button onClick={signer} style={{
          background: PRIMARY, color: "white", border: "none",
          borderRadius: "12px", padding: "18px",
          fontSize: "18px", fontWeight: "800", cursor: "pointer",
          marginBottom: "32px"
        }}>
          ✅ Signer et accepter le devis
        </button>
      </div>

      {/* ── MODAL DÉTAIL DEVIS ─────────────────────────────────────────────── */}
      {voirDetailDevis && (() => {
        const totalHT = lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);
        const tva = devis?.tva || 0;
        const montantTVA = totalHT * (tva / 100);
        const totalTTC = totalHT + montantTVA;
        return (
          <div
            onClick={() => setVoirDetailDevis(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.75)", zIndex: 1000,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "20px"
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: CARD, borderRadius: "18px",
                padding: "28px", maxWidth: "540px", width: "100%",
                maxHeight: "85vh", overflowY: "auto",
                border: "1px solid rgba(255,140,0,0.2)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.5)"
              }}
            >
              {/* En-tête */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px" }}>
                <div>
                  <div style={{ color: PRIMARY, fontSize: "11px", fontWeight: "700", letterSpacing: "0.8px", marginBottom: "4px" }}>DEVIS</div>
                  <div style={{ color: "white", fontSize: "22px", fontWeight: "800" }}>{devis?.numero}</div>
                  {artisan && <div style={{ color: "#8899aa", fontSize: "13px", marginTop: "2px" }}>{artisan.nom}</div>}
                </div>
                <button
                  onClick={() => setVoirDetailDevis(false)}
                  style={{
                    background: "rgba(255,255,255,0.06)", border: "none",
                    color: "#8899aa", width: "32px", height: "32px",
                    borderRadius: "8px", cursor: "pointer", fontSize: "18px",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                >✕</button>
              </div>

              {/* Tableau des lignes */}
              <div style={{ borderRadius: "10px", overflow: "hidden", marginBottom: "16px" }}>
                {/* Ligne d'en-tête du tableau */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 48px 80px 80px",
                  gap: "8px", padding: "9px 14px", background: DARK
                }}>
                  {["DESCRIPTION", "QTÉ", "PU HT", "TOTAL HT"].map((h, i) => (
                    <span key={i} style={{
                      color: "#8899aa", fontSize: "10px", fontWeight: "700",
                      letterSpacing: "0.6px",
                      textAlign: i >= 2 ? "right" : i === 1 ? "center" : "left"
                    }}>{h}</span>
                  ))}
                </div>
                {/* Lignes de prestation */}
                {lignes.map((l, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "1fr 48px 80px 80px",
                    gap: "8px", padding: "10px 14px",
                    background: i % 2 === 0 ? "#0d1b31" : "#0a1628"
                  }}>
                    <span style={{ color: "white", fontSize: "13px", lineHeight: "1.4" }}>{l.description}</span>
                    <span style={{ color: "#ccc", fontSize: "13px", textAlign: "center" }}>{l.quantite}</span>
                    <span style={{ color: "#ccc", fontSize: "13px", textAlign: "right" }}>{l.prix_unitaire.toFixed(2)} €</span>
                    <span style={{ color: PRIMARY, fontSize: "13px", fontWeight: "600", textAlign: "right" }}>
                      {(l.quantite * l.prix_unitaire).toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>

              {/* Bloc totaux */}
              <div style={{ background: DARK, borderRadius: "10px", padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#8899aa", fontSize: "13px" }}>Total HT</span>
                  <span style={{ color: "white", fontSize: "13px", fontWeight: "600" }}>{totalHT.toFixed(2)} €</span>
                </div>
                {tva > 0 ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <span style={{ color: "#8899aa", fontSize: "13px" }}>TVA ({tva}%)</span>
                      <span style={{ color: "white", fontSize: "13px" }}>{montantTVA.toFixed(2)} €</span>
                    </div>
                    <div style={{ borderTop: "1px solid rgba(255,140,0,0.2)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "white", fontSize: "15px", fontWeight: "700" }}>Total TTC</span>
                      <span style={{ color: PRIMARY, fontSize: "22px", fontWeight: "800" }}>{totalTTC.toFixed(2)} €</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ borderTop: "1px solid rgba(255,140,0,0.2)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "white", fontSize: "15px", fontWeight: "700" }}>Total</span>
                      <span style={{ color: PRIMARY, fontSize: "22px", fontWeight: "800" }}>{totalTTC.toFixed(2)} €</span>
                    </div>
                    <div style={{ color: "#8899aa", fontSize: "11px", fontStyle: "italic", marginTop: "8px" }}>
                      TVA non applicable, art. 293 B du CGI
                    </div>
                  </>
                )}
              </div>

              {/* Bouton fermer */}
              <button
                onClick={() => setVoirDetailDevis(false)}
                style={{
                  marginTop: "20px", width: "100%", background: "rgba(255,140,0,0.12)",
                  border: "1px solid rgba(255,140,0,0.3)", color: PRIMARY,
                  borderRadius: "10px", padding: "12px",
                  fontSize: "14px", fontWeight: "600", cursor: "pointer"
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
