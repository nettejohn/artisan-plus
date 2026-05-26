const RESEND_API = "https://api.resend.com/emails";
const FROM = "Artisan+ <contact@artisan-plus.fr>";

export default async function handler(req, res) {
  // CORS – autorise les appels depuis n'importe quelle origine (dev + prod)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[send-email] RESEND_API_KEY manquante");
    return res.status(500).json({ error: "Configuration serveur manquante" });
  }

  const { emailArtisan, emailClient, nomClient, nomArtisan, numeroDevis, montantTTC } =
    req.body || {};

  if (!numeroDevis || !montantTTC) {
    return res.status(400).json({ error: "Paramètres manquants : numeroDevis, montantTTC" });
  }

  const resultats = { artisanEnvoye: false, clientEnvoye: false, erreurs: [] };
  const montantFormate =
    typeof montantTTC === "number" ? montantTTC.toFixed(2) : String(montantTTC);

  // ── Email artisan ──────────────────────────────────────────────────────────
  if (emailArtisan) {
    try {
      await appelResend(apiKey, {
        from: FROM,
        to: [emailArtisan],
        subject: `✅ Devis ${numeroDevis} signé — ${nomClient || "votre client"}`,
        html: htmlArtisan({ nomArtisan, nomClient, numeroDevis, montantFormate }),
      });
      resultats.artisanEnvoye = true;
    } catch (err) {
      console.error("[send-email] Artisan :", err.message);
      resultats.erreurs.push(`Artisan : ${err.message}`);
    }
  }

  // ── Email client ───────────────────────────────────────────────────────────
  if (emailClient) {
    try {
      await appelResend(apiKey, {
        from: FROM,
        to: [emailClient],
        subject: `Confirmation — Devis ${numeroDevis} signé`,
        html: htmlClient({ nomArtisan, nomClient, numeroDevis, montantFormate }),
      });
      resultats.clientEnvoye = true;
    } catch (err) {
      console.error("[send-email] Client :", err.message);
      resultats.erreurs.push(`Client : ${err.message}`);
    }
  }

  const statusCode =
    resultats.erreurs.length === 0
      ? 200
      : resultats.artisanEnvoye || resultats.clientEnvoye
      ? 207 // Multi-Status : envoi partiel
      : 500;

  return res.status(statusCode).json({
    success: resultats.erreurs.length === 0,
    ...resultats,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Appel API Resend
// ─────────────────────────────────────────────────────────────────────────────

async function appelResend(apiKey, payload) {
  const response = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Templates HTML
// ─────────────────────────────────────────────────────────────────────────────

function htmlArtisan({ nomArtisan, nomClient, numeroDevis, montantFormate }) {
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

    <div style="background:#0a1628;padding:28px 36px;text-align:center;">
      <span style="font-size:30px;font-weight:900;color:#ffffff;letter-spacing:-1px;">
        Artisan<span style="color:#FF8C00">+</span>
      </span>
    </div>

    <div style="background:#FF8C00;padding:22px 36px;text-align:center;">
      <div style="font-size:36px;line-height:1;margin-bottom:8px;">✅</div>
      <div style="color:#ffffff;font-size:20px;font-weight:700;">Devis signé !</div>
    </div>

    <div style="padding:36px;">
      <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">
        Bonjour <strong>${nomArtisan || "Artisan"}</strong>,
      </p>
      <p style="margin:0 0 24px;color:#555555;font-size:14px;line-height:1.7;">
        Votre client <strong>${nomClient || "votre client"}</strong> a signé et accepté
        le devis <strong>${numeroDevis}</strong> le <strong>${date}</strong>.
        Vous pouvez dès à présent procéder aux travaux.
      </p>

      <div style="background:#f8f9fb;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #FF8C00;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#999999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Numéro</td>
            <td style="color:#1a1a2e;font-size:14px;font-weight:700;text-align:right;">${numeroDevis}</td>
          </tr>
          <tr>
            <td style="color:#999999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Client</td>
            <td style="color:#1a1a2e;font-size:14px;text-align:right;">${nomClient || "—"}</td>
          </tr>
          <tr>
            <td style="color:#999999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Montant TTC</td>
            <td style="color:#FF8C00;font-size:20px;font-weight:800;text-align:right;">${montantFormate} €</td>
          </tr>
          <tr>
            <td style="color:#999999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Signé le</td>
            <td style="color:#1a1a2e;font-size:14px;text-align:right;">${date}</td>
          </tr>
        </table>
      </div>

      <p style="margin:0;color:#777777;font-size:13px;line-height:1.6;">
        Retrouvez le devis signé dans votre espace Artisan+.
      </p>
    </div>

    <div style="background:#0a1628;padding:18px 36px;text-align:center;">
      <span style="color:#8899aa;font-size:12px;">Artisan+ — artisan-plus.vercel.app</span>
    </div>

  </div>
</body>
</html>`;
}

function htmlClient({ nomArtisan, nomClient, numeroDevis, montantFormate }) {
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

    <div style="background:#0a1628;padding:28px 36px;text-align:center;">
      <span style="font-size:30px;font-weight:900;color:#ffffff;letter-spacing:-1px;">
        Artisan<span style="color:#FF8C00">+</span>
      </span>
    </div>

    <div style="background:#FF8C00;padding:22px 36px;text-align:center;">
      <div style="font-size:36px;line-height:1;margin-bottom:8px;">📋</div>
      <div style="color:#ffffff;font-size:20px;font-weight:700;">Confirmation de votre accord</div>
    </div>

    <div style="padding:36px;">
      <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">
        Bonjour <strong>${nomClient || "Client"}</strong>,
      </p>
      <p style="margin:0 0 24px;color:#555555;font-size:14px;line-height:1.7;">
        Nous confirmons la bonne réception de votre signature pour le devis
        <strong>${numeroDevis}</strong> en date du <strong>${date}</strong>.
      </p>

      <div style="background:#f8f9fb;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #FF8C00;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#999999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Référence</td>
            <td style="color:#1a1a2e;font-size:14px;font-weight:700;text-align:right;">${numeroDevis}</td>
          </tr>
          <tr>
            <td style="color:#999999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Artisan</td>
            <td style="color:#1a1a2e;font-size:14px;text-align:right;">${nomArtisan || "—"}</td>
          </tr>
          <tr>
            <td style="color:#999999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Montant TTC</td>
            <td style="color:#FF8C00;font-size:20px;font-weight:800;text-align:right;">${montantFormate} €</td>
          </tr>
          <tr>
            <td style="color:#999999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Date de signature</td>
            <td style="color:#1a1a2e;font-size:14px;text-align:right;">${date}</td>
          </tr>
        </table>
      </div>

      <p style="margin:0;color:#777777;font-size:13px;line-height:1.6;">
        L'artisan vous contactera prochainement pour organiser les travaux.
      </p>
    </div>

    <div style="background:#0a1628;padding:18px 36px;text-align:center;">
      <span style="color:#8899aa;font-size:12px;">Artisan+ — artisan-plus.vercel.app</span>
    </div>

  </div>
</body>
</html>`;
}
