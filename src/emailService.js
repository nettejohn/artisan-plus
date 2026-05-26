import { genererPDFBase64 } from "./GenerateurPDF";

const RESEND_API = "https://api.resend.com/emails";
const FROM = "Artisan+ <contact@artisan-plus.fr>";

/**
 * Envoie les emails de confirmation après signature d'un devis.
 * - Un email à l'artisan (si profil.email renseigné)
 * - Un email au client (si client.email renseigné)
 * Chaque email contient le PDF du devis signé en pièce jointe.
 *
 * @param {object} params
 * @param {object} params.devis          – données du devis
 * @param {object} params.client         – données du client
 * @param {Array}  params.lignes         – lignes du devis
 * @param {object} params.artisan        – profil de l'artisan
 * @param {string} params.nomSignataire  – nom saisi par le signataire
 * @param {string} params.signatureImage – data URI du canvas de signature
 *
 * @returns {{ success: boolean, artisanEnvoye: boolean, clientEnvoye: boolean, erreurs: string[] }}
 */
export async function envoyerEmailsSignature({
  devis,
  client,
  lignes,
  artisan,
  nomSignataire,
  signatureImage,
}) {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  if (!apiKey) {
    console.error("[emailService] VITE_RESEND_API_KEY manquante");
    return { success: false, artisanEnvoye: false, clientEnvoye: false, erreurs: ["Clé API manquante"] };
  }

  // Générer le PDF signé en base64
  let pdfBase64 = "";
  try {
    const dataUri = genererPDFBase64(devis, client, lignes, artisan, true, {
      signatureImage,
      nomSignataire,
    });
    pdfBase64 = dataUri.split(",")[1]; // extraire la partie base64 pure
  } catch (err) {
    console.error("[emailService] Erreur génération PDF :", err);
    return { success: false, artisanEnvoye: false, clientEnvoye: false, erreurs: ["Erreur génération PDF"] };
  }

  const pdfNom = `${devis.numero}-signe.pdf`;
  const promesses = [];
  const roles = []; // pour savoir quel résultat correspond à quel envoi

  // ── Email artisan ──────────────────────────────────────────────────────────
  const emailArtisan = artisan?.email;
  if (emailArtisan) {
    roles.push("artisan");
    promesses.push(
      appelResend(apiKey, {
        from: FROM,
        to: [emailArtisan],
        subject: `✅ Devis ${devis.numero} signé — ${nomSignataire}`,
        html: templateArtisan({ devis, client, artisan, nomSignataire }),
        attachments: [{ filename: pdfNom, content: pdfBase64 }],
      })
    );
  }

  // ── Email client ───────────────────────────────────────────────────────────
  const emailClient = client?.email;
  if (emailClient) {
    roles.push("client");
    promesses.push(
      appelResend(apiKey, {
        from: FROM,
        to: [emailClient],
        subject: `Confirmation — Devis ${devis.numero} signé`,
        html: templateClient({ devis, client, artisan, nomSignataire }),
        attachments: [{ filename: pdfNom, content: pdfBase64 }],
      })
    );
  }

  if (promesses.length === 0) {
    return { success: true, artisanEnvoye: false, clientEnvoye: false, erreurs: [] };
  }

  const resultats = await Promise.allSettled(promesses);
  const erreurs = resultats
    .filter((r) => r.status === "rejected")
    .map((r) => r.reason?.message || "Erreur inconnue");

  const artisanIdx = roles.indexOf("artisan");
  const clientIdx = roles.indexOf("client");

  return {
    success: erreurs.length === 0,
    artisanEnvoye: artisanIdx >= 0 && resultats[artisanIdx]?.status === "fulfilled",
    clientEnvoye: clientIdx >= 0 && resultats[clientIdx]?.status === "fulfilled",
    erreurs,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Appel API Resend
// ─────────────────────────────────────────────────────────────────────────────

async function appelResend(apiKey, payload) {
  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Templates HTML emails
// ─────────────────────────────────────────────────────────────────────────────

function templateArtisan({ devis, client, artisan, nomSignataire }) {
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

    <!-- Header -->
    <div style="background:#0a1628;padding:28px 36px;text-align:center;">
      <span style="font-size:30px;font-weight:900;color:#ffffff;letter-spacing:-1px;">
        Artisan<span style="color:#FF8C00">+</span>
      </span>
    </div>

    <!-- Bandeau succès -->
    <div style="background:#FF8C00;padding:22px 36px;text-align:center;">
      <div style="font-size:36px;line-height:1;margin-bottom:8px;">✅</div>
      <div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Devis signé !</div>
    </div>

    <!-- Corps -->
    <div style="padding:36px;">
      <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">
        Bonjour <strong>${artisan?.nom || "Artisan"}</strong>,
      </p>
      <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.7;">
        Votre client <strong>${nomSignataire}</strong> a signé et accepté le devis
        <strong>${devis.numero}</strong> le <strong>${date}</strong>.
        Vous pouvez dès à présent procéder aux travaux.
      </p>

      <!-- Récap -->
      <div style="background:#f8f9fb;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #FF8C00;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Numéro</td>
            <td style="color:#1a1a2e;font-size:14px;font-weight:700;text-align:right;">${devis.numero}</td>
          </tr>
          <tr>
            <td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Client</td>
            <td style="color:#1a1a2e;font-size:14px;text-align:right;">${client?.nom || nomSignataire}</td>
          </tr>
          ${client?.email ? `<tr>
            <td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Email client</td>
            <td style="color:#1a1a2e;font-size:14px;text-align:right;">${client.email}</td>
          </tr>` : ""}
          ${client?.telephone ? `<tr>
            <td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Tél client</td>
            <td style="color:#1a1a2e;font-size:14px;text-align:right;">${client.telephone}</td>
          </tr>` : ""}
          <tr>
            <td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Montant TTC</td>
            <td style="color:#FF8C00;font-size:20px;font-weight:800;text-align:right;">${devis.total_ttc?.toFixed(2)} €</td>
          </tr>
          <tr>
            <td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Signé le</td>
            <td style="color:#1a1a2e;font-size:14px;text-align:right;">${date}</td>
          </tr>
        </table>
      </div>

      <p style="margin:0;color:#777;font-size:13px;line-height:1.6;">
        📎 Le devis signé (avec la signature du client) est joint à cet email en PDF.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#0a1628;padding:18px 36px;text-align:center;">
      <span style="color:#8899aa;font-size:12px;">Artisan+ — artisan-plus.vercel.app</span>
    </div>
  </div>
</body>
</html>`;
}

function templateClient({ devis, client, artisan, nomSignataire }) {
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

    <!-- Header -->
    <div style="background:#0a1628;padding:28px 36px;text-align:center;">
      <span style="font-size:30px;font-weight:900;color:#ffffff;letter-spacing:-1px;">
        Artisan<span style="color:#FF8C00">+</span>
      </span>
    </div>

    <!-- Bandeau confirmation -->
    <div style="background:#FF8C00;padding:22px 36px;text-align:center;">
      <div style="font-size:36px;line-height:1;margin-bottom:8px;">📋</div>
      <div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Confirmation de votre accord</div>
    </div>

    <!-- Corps -->
    <div style="padding:36px;">
      <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">
        Bonjour <strong>${nomSignataire}</strong>,
      </p>
      <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.7;">
        Nous confirmons la bonne réception de votre signature pour le devis
        <strong>${devis.numero}</strong> en date du <strong>${date}</strong>.
        Votre document signé est joint à cet email, conservez-le pour vos dossiers.
      </p>

      <!-- Récap -->
      <div style="background:#f8f9fb;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #FF8C00;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Référence</td>
            <td style="color:#1a1a2e;font-size:14px;font-weight:700;text-align:right;">${devis.numero}</td>
          </tr>
          <tr>
            <td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Artisan</td>
            <td style="color:#1a1a2e;font-size:14px;text-align:right;">${artisan?.nom || ""}</td>
          </tr>
          ${artisan?.telephone ? `<tr>
            <td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Contact</td>
            <td style="color:#1a1a2e;font-size:14px;text-align:right;">${artisan.telephone}</td>
          </tr>` : ""}
          <tr>
            <td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Montant TTC</td>
            <td style="color:#FF8C00;font-size:20px;font-weight:800;text-align:right;">${devis.total_ttc?.toFixed(2)} €</td>
          </tr>
          <tr>
            <td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Date de signature</td>
            <td style="color:#1a1a2e;font-size:14px;text-align:right;">${date}</td>
          </tr>
        </table>
      </div>

      <p style="margin:0 0 8px;color:#777;font-size:13px;line-height:1.6;">
        📎 Votre devis signé est joint à cet email en PDF.
      </p>
      <p style="margin:0;color:#777;font-size:13px;line-height:1.6;">
        L'artisan vous contactera prochainement pour organiser les travaux.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#0a1628;padding:18px 36px;text-align:center;">
      <span style="color:#8899aa;font-size:12px;">Artisan+ — artisan-plus.vercel.app</span>
    </div>
  </div>
</body>
</html>`;
}
