const RESEND_API = "https://api.resend.com/emails";
const FROM = "Artisan+ <contact@artisan-plus.fr>";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[send-email] RESEND_API_KEY manquante");
    return res.status(500).json({ error: "Configuration serveur manquante" });
  }

  // ── Parse du body (Vercel peut envoyer string ou objet selon le runtime/ESM) ──
  let body = {};
  try {
    if (!req.body) {
      const raw = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => { data += chunk.toString(); });
        req.on("end", () => resolve(data));
        req.on("error", reject);
      });
      body = raw ? JSON.parse(raw) : {};
    } else if (typeof req.body === "string") {
      body = JSON.parse(req.body);
    } else {
      body = req.body;
    }
  } catch (e) {
    console.error("[send-email] Erreur parsing body :", e.message);
    return res.status(400).json({ error: "Corps de requête invalide" });
  }

  // ── Routage ─────────────────────────────────────────────────────────────────
  if (body.type === "support") {
    return handleSupport(apiKey, body, res);
  }
  if (body.numeroFacture) {
    return handleFacture(apiKey, body, res);
  }
  return handleDevis(apiKey, body, res);
}

// ─────────────────────────────────────────────────────────────────────────────
// Support — Centre d'aide
// ─────────────────────────────────────────────────────────────────────────────

async function handleSupport(apiKey, body, res) {
  const { sujet, message, emailUtilisateur, nomUtilisateur } = body;
  if (!message?.trim()) return res.status(400).json({ error: "Message vide" });

  const SUPPORT_EMAIL = "cassou101514@gmail.com";
  const date = new Date().toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" });

  try {
    await appelResend(apiKey, {
      from: FROM,
      to: [SUPPORT_EMAIL],
      reply_to: emailUtilisateur || undefined,
      subject: `[Artisan+ Support] ${sujet || "Message de l'app"}`,
      html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:#0a1628;padding:24px 32px;text-align:center;">
      <span style="font-size:26px;font-weight:900;color:#fff;">Artisan<span style="color:#FF8C00">+</span></span>
      <div style="color:#8899aa;font-size:12px;margin-top:4px;">Centre d'aide — nouveau message</div>
    </div>
    <div style="background:#FF8C00;padding:16px 32px;">
      <div style="color:#fff;font-size:16px;font-weight:700;">📬 ${sujet || "Message support"}</div>
    </div>
    <div style="padding:32px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="color:#999;font-size:11px;padding:6px 0;text-transform:uppercase;letter-spacing:0.8px;width:120px;">De</td><td style="color:#1a1a2e;font-size:14px;font-weight:600;">${nomUtilisateur || "Utilisateur"}</td></tr>
        <tr><td style="color:#999;font-size:11px;padding:6px 0;text-transform:uppercase;letter-spacing:0.8px;">Email</td><td style="color:#1a1a2e;font-size:14px;"><a href="mailto:${emailUtilisateur}" style="color:#FF8C00;">${emailUtilisateur || "—"}</a></td></tr>
        <tr><td style="color:#999;font-size:11px;padding:6px 0;text-transform:uppercase;letter-spacing:0.8px;">Sujet</td><td style="color:#1a1a2e;font-size:14px;">${sujet || "—"}</td></tr>
        <tr><td style="color:#999;font-size:11px;padding:6px 0;text-transform:uppercase;letter-spacing:0.8px;">Date</td><td style="color:#1a1a2e;font-size:14px;">${date}</td></tr>
      </table>
      <div style="background:#f8f9fb;border-radius:10px;padding:20px 24px;border-left:4px solid #FF8C00;">
        <div style="color:#666;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">Message</div>
        <div style="color:#1a1a2e;font-size:14px;line-height:1.8;white-space:pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
      </div>
    </div>
    <div style="background:#0a1628;padding:16px 32px;text-align:center;">
      <span style="color:#8899aa;font-size:12px;">Artisan+ — artisan-plus.fr · Répondre directement à cet email</span>
    </div>
  </div>
</body>
</html>`,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[send-email/support] Erreur :", err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Envoi facture
// ─────────────────────────────────────────────────────────────────────────────

async function handleFacture(apiKey, body, res) {
  const { emailClient, emailArtisan, nomArtisan, nomClient, numeroFacture, montantTTC, pdfBase64 } = body;
  if (!numeroFacture) return res.status(400).json({ error: "Paramètre manquant : numeroFacture" });

  const montantFormate = montantTTC != null
    ? (typeof montantTTC === "number" ? montantTTC.toFixed(2) : String(montantTTC))
    : "—";

  const attachments = pdfBase64
    ? [{ filename: `${numeroFacture}.pdf`, content: pdfBase64 }]
    : [];

  const resultats = { clientEnvoye: false, artisanEnvoye: false, erreurs: [] };

  if (emailClient) {
    try {
      await appelResend(apiKey, {
        from: FROM,
        to: [emailClient],
        subject: `Votre facture ${numeroFacture} — ${montantFormate} €`,
        html: htmlFactureClient({ nomArtisan, nomClient, numeroFacture, montantFormate }),
        ...(attachments.length > 0 ? { attachments } : {}),
      });
      resultats.clientEnvoye = true;
    } catch (err) {
      resultats.erreurs.push(`Client : ${err.message}`);
    }
  }

  if (emailArtisan) {
    try {
      await appelResend(apiKey, {
        from: FROM,
        to: [emailArtisan],
        subject: `✅ Facture ${numeroFacture} envoyée — ${nomClient || "client"}`,
        html: htmlFactureArtisan({ nomArtisan, nomClient, numeroFacture, montantFormate }),
        ...(attachments.length > 0 ? { attachments } : {}),
      });
      resultats.artisanEnvoye = true;
    } catch (err) {
      resultats.erreurs.push(`Artisan : ${err.message}`);
    }
  }

  const success = resultats.erreurs.length === 0 && (resultats.clientEnvoye || resultats.artisanEnvoye);
  const status = success ? 200 : (resultats.clientEnvoye || resultats.artisanEnvoye) ? 207 : 500;
  return res.status(status).json({ success, ...resultats });
}

// ─────────────────────────────────────────────────────────────────────────────
// Envoi devis signé (flux existant — inchangé)
// ─────────────────────────────────────────────────────────────────────────────

async function handleDevis(apiKey, body, res) {
  const { emailArtisan, emailClient, nomClient, nomArtisan, numeroDevis, montantTTC, pdfBase64 } = body;

  if (!numeroDevis) {
    console.error("[send-email] Champ manquant : numeroDevis. Body reçu :", JSON.stringify(body));
    return res.status(400).json({ error: "Paramètre manquant : numeroDevis" });
  }

  const montantFormate =
    montantTTC != null
      ? (typeof montantTTC === "number" ? montantTTC.toFixed(2) : String(montantTTC))
      : "—";

  const attachments = pdfBase64
    ? [{ filename: `devis-${numeroDevis}-signe.pdf`, content: pdfBase64 }]
    : [];

  if (attachments.length > 0) {
    console.log(`[send-email] PDF signé inclus en pièce jointe (${Math.round(pdfBase64.length * 0.75 / 1024)} Ko)`);
  }

  const resultats = { artisanEnvoye: false, clientEnvoye: false, erreurs: [] };

  if (emailArtisan) {
    try {
      await appelResend(apiKey, {
        from: FROM,
        to: [emailArtisan],
        subject: `✅ Devis ${numeroDevis} signé — ${nomClient || "votre client"}`,
        html: htmlDevisArtisan({ nomArtisan, nomClient, numeroDevis, montantFormate }),
        ...(attachments.length > 0 ? { attachments } : {}),
      });
      resultats.artisanEnvoye = true;
      console.log(`[send-email] ✓ Email artisan envoyé à ${emailArtisan}`);
    } catch (err) {
      console.error("[send-email] ✗ Email artisan échoué :", err.message);
      resultats.erreurs.push(`Artisan : ${err.message}`);
    }
  }

  if (emailClient) {
    try {
      await appelResend(apiKey, {
        from: FROM,
        to: [emailClient],
        subject: `Confirmation — Devis ${numeroDevis} signé`,
        html: htmlDevisClient({ nomArtisan, nomClient, numeroDevis, montantFormate }),
        ...(attachments.length > 0 ? { attachments } : {}),
      });
      resultats.clientEnvoye = true;
      console.log(`[send-email] ✓ Email client envoyé à ${emailClient}`);
    } catch (err) {
      console.error("[send-email] ✗ Email client échoué :", err.message);
      resultats.erreurs.push(`Client : ${err.message}`);
    }
  }

  const success = resultats.erreurs.length === 0;
  const statusCode = success ? 200 : (resultats.artisanEnvoye || resultats.clientEnvoye) ? 207 : 500;
  return res.status(statusCode).json({ success, ...resultats });
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
    const msg = err.message || err.name || `HTTP ${response.status}`;
    throw new Error(msg);
  }

  return response.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Templates HTML — Facture
// ─────────────────────────────────────────────────────────────────────────────

function htmlFactureClient({ nomArtisan, nomClient, numeroFacture, montantFormate }) {
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:#0a1628;padding:28px 36px;text-align:center;">
      <span style="font-size:30px;font-weight:900;color:#fff;">Artisan<span style="color:#FF8C00">+</span></span>
    </div>
    <div style="background:#FF8C00;padding:22px 36px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">🧾</div>
      <div style="color:#fff;font-size:20px;font-weight:700;">Votre facture</div>
    </div>
    <div style="padding:36px;">
      <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">Bonjour <strong>${nomClient || "Client"}</strong>,</p>
      <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.7;">
        Veuillez trouver ci-joint votre facture <strong>${numeroFacture}</strong> établie le <strong>${date}</strong> par <strong>${nomArtisan || "votre artisan"}</strong>.
      </p>
      <div style="background:#f8f9fb;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #FF8C00;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Référence</td><td style="color:#1a1a2e;font-size:14px;font-weight:700;text-align:right;">${numeroFacture}</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Artisan</td><td style="color:#1a1a2e;font-size:14px;text-align:right;">${nomArtisan || "—"}</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Montant TTC</td><td style="color:#FF8C00;font-size:20px;font-weight:800;text-align:right;">${montantFormate} €</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Date</td><td style="color:#1a1a2e;font-size:14px;text-align:right;">${date}</td></tr>
        </table>
      </div>
      <p style="margin:0;color:#777;font-size:13px;">La facture est jointe à cet email en PDF. Pour toute question, contactez directement votre artisan.</p>
    </div>
    <div style="background:#0a1628;padding:18px 36px;text-align:center;">
      <span style="color:#8899aa;font-size:12px;">Artisan+ — artisan-plus.fr</span>
    </div>
  </div>
</body>
</html>`;
}

function htmlFactureArtisan({ nomArtisan, nomClient, numeroFacture, montantFormate }) {
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:#0a1628;padding:28px 36px;text-align:center;">
      <span style="font-size:30px;font-weight:900;color:#fff;">Artisan<span style="color:#FF8C00">+</span></span>
    </div>
    <div style="background:#FF8C00;padding:22px 36px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">✅</div>
      <div style="color:#fff;font-size:20px;font-weight:700;">Facture envoyée !</div>
    </div>
    <div style="padding:36px;">
      <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">Bonjour <strong>${nomArtisan || "Artisan"}</strong>,</p>
      <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.7;">
        La facture <strong>${numeroFacture}</strong> a été envoyée à <strong>${nomClient || "votre client"}</strong> le <strong>${date}</strong>.
      </p>
      <div style="background:#f8f9fb;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #FF8C00;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Numéro</td><td style="color:#1a1a2e;font-size:14px;font-weight:700;text-align:right;">${numeroFacture}</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Client</td><td style="color:#1a1a2e;font-size:14px;text-align:right;">${nomClient || "—"}</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Montant TTC</td><td style="color:#FF8C00;font-size:20px;font-weight:800;text-align:right;">${montantFormate} €</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Envoyée le</td><td style="color:#1a1a2e;font-size:14px;text-align:right;">${date}</td></tr>
        </table>
      </div>
      <p style="margin:0;color:#777;font-size:13px;">La facture PDF est jointe à cet email pour vos archives.</p>
    </div>
    <div style="background:#0a1628;padding:18px 36px;text-align:center;">
      <span style="color:#8899aa;font-size:12px;">Artisan+ — artisan-plus.fr</span>
    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Templates HTML — Devis (inchangés)
// ─────────────────────────────────────────────────────────────────────────────

function htmlDevisArtisan({ nomArtisan, nomClient, numeroDevis, montantFormate }) {
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:#0a1628;padding:28px 36px;text-align:center;">
      <span style="font-size:30px;font-weight:900;color:#fff;">Artisan<span style="color:#FF8C00">+</span></span>
    </div>
    <div style="background:#FF8C00;padding:22px 36px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">✅</div>
      <div style="color:#fff;font-size:20px;font-weight:700;">Devis signé !</div>
    </div>
    <div style="padding:36px;">
      <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">Bonjour <strong>${nomArtisan || "Artisan"}</strong>,</p>
      <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.7;">
        Votre client <strong>${nomClient || "votre client"}</strong> a signé et accepté le devis <strong>${numeroDevis}</strong> le <strong>${date}</strong>.
      </p>
      <div style="background:#f8f9fb;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #FF8C00;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Numéro</td><td style="color:#1a1a2e;font-size:14px;font-weight:700;text-align:right;">${numeroDevis}</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Client</td><td style="color:#1a1a2e;font-size:14px;text-align:right;">${nomClient || "—"}</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Montant TTC</td><td style="color:#FF8C00;font-size:20px;font-weight:800;text-align:right;">${montantFormate} €</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Signé le</td><td style="color:#1a1a2e;font-size:14px;text-align:right;">${date}</td></tr>
        </table>
      </div>
      <p style="margin:0;color:#777;font-size:13px;">Le devis signé est joint à cet email. Retrouvez-le également dans votre espace Artisan+.</p>
    </div>
    <div style="background:#0a1628;padding:18px 36px;text-align:center;">
      <span style="color:#8899aa;font-size:12px;">Artisan+ — artisan-plus.fr</span>
    </div>
  </div>
</body>
</html>`;
}

function htmlDevisClient({ nomArtisan, nomClient, numeroDevis, montantFormate }) {
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:#0a1628;padding:28px 36px;text-align:center;">
      <span style="font-size:30px;font-weight:900;color:#fff;">Artisan<span style="color:#FF8C00">+</span></span>
    </div>
    <div style="background:#FF8C00;padding:22px 36px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">📋</div>
      <div style="color:#fff;font-size:20px;font-weight:700;">Confirmation de votre accord</div>
    </div>
    <div style="padding:36px;">
      <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">Bonjour <strong>${nomClient || "Client"}</strong>,</p>
      <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.7;">
        Nous confirmons la bonne réception de votre signature pour le devis <strong>${numeroDevis}</strong> en date du <strong>${date}</strong>.
      </p>
      <div style="background:#f8f9fb;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #FF8C00;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Référence</td><td style="color:#1a1a2e;font-size:14px;font-weight:700;text-align:right;">${numeroDevis}</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Artisan</td><td style="color:#1a1a2e;font-size:14px;text-align:right;">${nomArtisan || "—"}</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Montant TTC</td><td style="color:#FF8C00;font-size:20px;font-weight:800;text-align:right;">${montantFormate} €</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">Date de signature</td><td style="color:#1a1a2e;font-size:14px;text-align:right;">${date}</td></tr>
        </table>
      </div>
      <p style="margin:0;color:#777;font-size:13px;">Le devis signé est joint à cet email. L'artisan vous contactera prochainement pour organiser les travaux.</p>
    </div>
    <div style="background:#0a1628;padding:18px 36px;text-align:center;">
      <span style="color:#8899aa;font-size:12px;">Artisan+ — artisan-plus.fr</span>
    </div>
  </div>
</body>
</html>`;
}
