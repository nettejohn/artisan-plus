import crypto from "node:crypto";

const RESEND_API = "https://api.resend.com/emails";
const FROM = "Artisan+ <contact@artisan-plus.fr>";
const ADMIN_EMAIL = "contact@artisan-plus.fr";
const BASE_URL = "https://www.artisan-plus.fr";

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
  if (body.type === "verification") {
    return handleVerification(apiKey, body, res);
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

  const SUPPORT_EMAIL = "contact@artisan-plus.fr";
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
// Notification badge vérifié — email admin avec boutons Approuver / Refuser
// ─────────────────────────────────────────────────────────────────────────────

async function handleVerification(apiKey, body, res) {
  const { userId, nomArtisan, emailArtisan, siret, docUrl } = body;
  if (!userId) return res.status(400).json({ error: "userId manquant" });

  const date = new Date().toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" });

  // Génère les tokens HMAC pour les liens approve/reject
  const secret = (process.env.VERIFY_SECRET || "").trim() || apiKey;
  const tokenApprove = crypto.createHmac("sha256", secret).update(`${userId}:approve`).digest("hex");
  const tokenReject  = crypto.createHmac("sha256", secret).update(`${userId}:reject`).digest("hex");

  const urlApprove = `${BASE_URL}/api/verify-artisan?userId=${encodeURIComponent(userId)}&action=approve&token=${tokenApprove}`;
  const urlReject  = `${BASE_URL}/api/verify-artisan?userId=${encodeURIComponent(userId)}&action=reject&token=${tokenReject}`;

  // ── Télécharge le justificatif pour le joindre en pièce jointe ─────────────
  let attachments = [];
  if (docUrl) {
    try {
      const resp = await fetch(docUrl);
      if (resp.ok) {
        const buffer = await resp.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const rawUrl  = docUrl.split("?")[0];
        const ext     = rawUrl.split(".").pop().toLowerCase() || "pdf";
        const safeSiret = (siret || "kbis").replace(/\s/g, "");
        attachments = [{ filename: `justificatif-${safeSiret}.${ext}`, content: base64 }];
      } else {
        console.warn("[verification] Document inaccessible :", resp.status, docUrl);
      }
    } catch (e) {
      console.warn("[verification] Impossible de télécharger le justificatif :", e.message);
    }
  }

  const hasAttachment = attachments.length > 0;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:#0a1628;padding:24px 32px;text-align:center;">
      <span style="font-size:26px;font-weight:900;color:#fff;">Artisan<span style="color:#FF8C00">+</span></span>
      <div style="color:#8899aa;font-size:12px;margin-top:4px;">Nouvelle demande de badge Artisan Vérifié</div>
    </div>
    <div style="background:#FF8C00;padding:16px 32px;">
      <div style="color:#fff;font-size:16px;font-weight:700;">🏅 Dossier de vérification à traiter</div>
    </div>
    <div style="padding:32px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
        <tr><td style="color:#999;font-size:11px;padding:7px 0;text-transform:uppercase;letter-spacing:0.8px;width:130px;">Artisan</td><td style="color:#1a1a2e;font-size:14px;font-weight:700;">${(nomArtisan || "—").replace(/</g,"&lt;")}</td></tr>
        <tr><td style="color:#999;font-size:11px;padding:7px 0;text-transform:uppercase;letter-spacing:0.8px;">Email</td><td style="color:#1a1a2e;font-size:14px;"><a href="mailto:${emailArtisan || ""}" style="color:#FF8C00;">${(emailArtisan || "—").replace(/</g,"&lt;")}</a></td></tr>
        <tr><td style="color:#999;font-size:11px;padding:7px 0;text-transform:uppercase;letter-spacing:0.8px;">SIRET</td><td style="color:#1a1a2e;font-size:14px;font-weight:600;">${(siret || "—").replace(/</g,"&lt;")}</td></tr>
        <tr><td style="color:#999;font-size:11px;padding:7px 0;text-transform:uppercase;letter-spacing:0.8px;">Date</td><td style="color:#1a1a2e;font-size:14px;">${date}</td></tr>
        <tr><td style="color:#999;font-size:11px;padding:7px 0;text-transform:uppercase;letter-spacing:0.8px;">ID</td><td style="color:#8899aa;font-size:11px;font-family:monospace;">${userId}</td></tr>
      </table>

      ${hasAttachment
        ? `<div style="margin-bottom:28px;background:#f0fdf4;border-radius:10px;padding:14px 20px;border-left:4px solid #4CAF50;">
        <div style="color:#2e7d32;font-size:13px;font-weight:700;">📎 Justificatif joint à cet email</div>
        <div style="color:#555;font-size:12px;margin-top:4px;">Le document est en pièce jointe de cet email.</div>
      </div>`
        : docUrl
          ? `<div style="margin-bottom:28px;background:#f8f9fb;border-radius:10px;padding:16px 20px;border-left:4px solid #FF8C00;">
        <div style="color:#666;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">Justificatif (Kbis / carte pro / URSSAF)</div>
        <a href="${docUrl}" target="_blank" style="display:inline-block;background:#FF8C00;color:#fff;font-weight:700;font-size:13px;padding:10px 18px;border-radius:8px;text-decoration:none;">📄 Voir le document →</a>
      </div>`
          : ""}

      <div style="font-size:13px;color:#666;margin-bottom:20px;font-weight:600;">Action à effectuer :</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding-right:8px;">
            <a href="${urlApprove}" target="_blank" style="display:block;background:#4CAF50;color:#fff;font-weight:800;font-size:15px;padding:16px 12px;border-radius:12px;text-decoration:none;text-align:center;">
              ✅ Approuver le badge
            </a>
          </td>
          <td style="padding-left:8px;">
            <a href="${urlReject}" target="_blank" style="display:block;background:#ff6b6b;color:#fff;font-weight:800;font-size:15px;padding:16px 12px;border-radius:12px;text-decoration:none;text-align:center;">
              ❌ Refuser
            </a>
          </td>
        </tr>
      </table>
      <div style="margin-top:16px;color:#999;font-size:11px;text-align:center;">
        Ces liens sont sécurisés par HMAC — un seul clic suffit, l'action est immédiate et irréversible.
      </div>
    </div>
    <div style="background:#0a1628;padding:16px 32px;text-align:center;">
      <span style="color:#8899aa;font-size:12px;">Artisan+ — artisan-plus.fr · Administration</span>
    </div>
  </div>
</body>
</html>`;

  try {
    await appelResend(apiKey, {
      from: FROM,
      to: [ADMIN_EMAIL],
      reply_to: emailArtisan || undefined,
      subject: `[Badge Vérifié] Nouvelle demande — ${nomArtisan || "Artisan"} (SIRET : ${siret || "—"})`,
      html,
      ...(attachments.length > 0 ? { attachments } : {}),
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[send-email/verification] Erreur :", err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Traductions emails
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_LABELS = {
  fr: {
    invoice: {
      yourInvoice: "Votre facture",
      invoiceSent: "Facture envoyée !",
      greeting: "Bonjour",
      clientBody1: "Veuillez trouver ci-joint votre facture",
      clientBody2: "établie le",
      clientBody3: "par",
      reference: "Référence",
      craftsman: "Artisan",
      amountTTC: "Montant TTC",
      date: "Date",
      sentOn: "Envoyée le",
      number: "Numéro",
      client: "Client",
      pdfAttached: "La facture est jointe à cet email en PDF. Pour toute question, contactez directement votre artisan.",
      pdfArchive: "La facture PDF est jointe à cet email pour vos archives.",
      sentTo: "a été envoyée à",
      on: "le",
    },
    quote: {
      signed: "Devis signé !",
      quoteConfirmation: "Confirmation de votre accord",
      greeting: "Bonjour",
      artisanBody1: "Votre client",
      artisanBody2: "a signé et accepté le devis",
      artisanBody3: "le",
      clientBody1: "Nous confirmons la bonne réception de votre signature pour le devis",
      clientBody2: "en date du",
      reference: "Numéro",
      craftsman: "Artisan",
      amountTTC: "Montant TTC",
      signedOn: "Signé le",
      quoteSignedAttached: "Le devis signé est joint à cet email. Retrouvez-le également dans votre espace Artisan+.",
      clientConfirmation: "Le devis signé est joint à cet email. L'artisan vous contactera prochainement pour organiser les travaux.",
    },
  },
  en: {
    invoice: {
      yourInvoice: "Your invoice",
      invoiceSent: "Invoice sent!",
      greeting: "Hello",
      clientBody1: "Please find attached your invoice",
      clientBody2: "dated",
      clientBody3: "by",
      reference: "Reference",
      craftsman: "Craftsman",
      amountTTC: "Total amount",
      date: "Date",
      sentOn: "Sent on",
      number: "Number",
      client: "Client",
      pdfAttached: "The invoice is attached to this email as a PDF. For any questions, contact your craftsman directly.",
      pdfArchive: "The PDF invoice is attached to this email for your records.",
      sentTo: "has been sent to",
      on: "on",
    },
    quote: {
      signed: "Quote signed!",
      quoteConfirmation: "Confirmation of your agreement",
      greeting: "Hello",
      artisanBody1: "Your client",
      artisanBody2: "has signed and accepted quote",
      artisanBody3: "on",
      clientBody1: "We confirm receipt of your signature for quote",
      clientBody2: "dated",
      reference: "Reference",
      craftsman: "Craftsman",
      amountTTC: "Total amount",
      signedOn: "Signed on",
      quoteSignedAttached: "The signed quote is attached to this email. You can also find it in your Artisan+ account.",
      clientConfirmation: "The signed quote is attached to this email. The craftsman will contact you shortly to schedule the work.",
    },
  },
};

function getEmailLabels(lang) {
  return EMAIL_LABELS[lang === "en" ? "en" : "fr"];
}

// ─────────────────────────────────────────────────────────────────────────────
// Envoi facture
// ─────────────────────────────────────────────────────────────────────────────

async function handleFacture(apiKey, body, res) {
  const { emailClient, emailArtisan, nomArtisan, nomClient, numeroFacture, montantTTC, pdfBase64, lang } = body;
  if (!numeroFacture) return res.status(400).json({ error: "Paramètre manquant : numeroFacture" });

  const montantFormate = montantTTC != null
    ? (typeof montantTTC === "number" ? montantTTC.toFixed(2) : String(montantTTC))
    : "—";

  const attachments = pdfBase64
    ? [{ filename: `${numeroFacture}.pdf`, content: pdfBase64 }]
    : [];

  const lbl = getEmailLabels(lang);
  const resultats = { clientEnvoye: false, artisanEnvoye: false, erreurs: [] };

  if (emailClient) {
    try {
      await appelResend(apiKey, {
        from: FROM,
        to: [emailClient],
        subject: `${lbl.invoice.yourInvoice} ${numeroFacture} — ${montantFormate} €`,
        html: htmlFactureClient({ nomArtisan, nomClient, numeroFacture, montantFormate, lbl: lbl.invoice }),
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
        subject: `✅ ${lbl.invoice.yourInvoice} ${numeroFacture} ${lbl.invoice.sentTo} ${nomClient || "client"}`,
        html: htmlFactureArtisan({ nomArtisan, nomClient, numeroFacture, montantFormate, lbl: lbl.invoice }),
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
  const { emailArtisan, emailClient, nomClient, nomArtisan, numeroDevis, montantTTC, pdfBase64, lang } = body;

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

  const lbl = getEmailLabels(lang);
  const resultats = { artisanEnvoye: false, clientEnvoye: false, erreurs: [] };

  if (emailArtisan) {
    try {
      await appelResend(apiKey, {
        from: FROM,
        to: [emailArtisan],
        subject: `✅ ${lbl.quote.signed.replace("!", "")} ${numeroDevis} — ${nomClient || (lang === "en" ? "your client" : "votre client")}`,
        html: htmlDevisArtisan({ nomArtisan, nomClient, numeroDevis, montantFormate, lbl: lbl.quote }),
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
        subject: `${lbl.quote.quoteConfirmation} — ${lang === "en" ? "Quote" : "Devis"} ${numeroDevis}`,
        html: htmlDevisClient({ nomArtisan, nomClient, numeroDevis, montantFormate, lbl: lbl.quote }),
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

function htmlFactureClient({ nomArtisan, nomClient, numeroFacture, montantFormate, lbl }) {
  const isEn = lbl && lbl.greeting === "Hello";
  const locale = isEn ? "en-GB" : "fr-FR";
  const date = new Date().toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const t = lbl || EMAIL_LABELS.fr.invoice;
  return `<!DOCTYPE html>
<html lang="${isEn ? "en" : "fr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:#0a1628;padding:28px 36px;text-align:center;">
      <span style="font-size:30px;font-weight:900;color:#fff;">Artisan<span style="color:#FF8C00">+</span></span>
    </div>
    <div style="background:#FF8C00;padding:22px 36px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">🧾</div>
      <div style="color:#fff;font-size:20px;font-weight:700;">${t.yourInvoice}</div>
    </div>
    <div style="padding:36px;">
      <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">${t.greeting} <strong>${nomClient || (isEn ? "Client" : "Client")}</strong>,</p>
      <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.7;">
        ${t.clientBody1} <strong>${numeroFacture}</strong> ${t.clientBody2} <strong>${date}</strong> ${t.clientBody3} <strong>${nomArtisan || (isEn ? "your craftsman" : "votre artisan")}</strong>.
      </p>
      <div style="background:#f8f9fb;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #FF8C00;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">${t.reference}</td><td style="color:#1a1a2e;font-size:14px;font-weight:700;text-align:right;">${numeroFacture}</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">${t.craftsman}</td><td style="color:#1a1a2e;font-size:14px;text-align:right;">${nomArtisan || "—"}</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">${t.amountTTC}</td><td style="color:#FF8C00;font-size:20px;font-weight:800;text-align:right;">${montantFormate} €</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">${t.date}</td><td style="color:#1a1a2e;font-size:14px;text-align:right;">${date}</td></tr>
        </table>
      </div>
      <p style="margin:0;color:#777;font-size:13px;">${t.pdfAttached}</p>
    </div>
    <div style="background:#0a1628;padding:18px 36px;text-align:center;">
      <span style="color:#8899aa;font-size:12px;">Artisan+ — artisan-plus.fr</span>
    </div>
  </div>
</body>
</html>`;
}

function htmlFactureArtisan({ nomArtisan, nomClient, numeroFacture, montantFormate, lbl }) {
  const isEn = lbl && lbl.greeting === "Hello";
  const locale = isEn ? "en-GB" : "fr-FR";
  const date = new Date().toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const t = lbl || EMAIL_LABELS.fr.invoice;
  return `<!DOCTYPE html>
<html lang="${isEn ? "en" : "fr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:#0a1628;padding:28px 36px;text-align:center;">
      <span style="font-size:30px;font-weight:900;color:#fff;">Artisan<span style="color:#FF8C00">+</span></span>
    </div>
    <div style="background:#FF8C00;padding:22px 36px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">✅</div>
      <div style="color:#fff;font-size:20px;font-weight:700;">${t.invoiceSent}</div>
    </div>
    <div style="padding:36px;">
      <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">${t.greeting} <strong>${nomArtisan || (isEn ? "Craftsman" : "Artisan")}</strong>,</p>
      <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.7;">
        ${isEn ? `Invoice <strong>${numeroFacture}</strong> ${t.sentTo} <strong>${nomClient || "your client"}</strong> ${t.on} <strong>${date}</strong>.`
                : `La facture <strong>${numeroFacture}</strong> a été envoyée à <strong>${nomClient || "votre client"}</strong> le <strong>${date}</strong>.`}
      </p>
      <div style="background:#f8f9fb;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #FF8C00;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">${t.number}</td><td style="color:#1a1a2e;font-size:14px;font-weight:700;text-align:right;">${numeroFacture}</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">${t.client}</td><td style="color:#1a1a2e;font-size:14px;text-align:right;">${nomClient || "—"}</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">${t.amountTTC}</td><td style="color:#FF8C00;font-size:20px;font-weight:800;text-align:right;">${montantFormate} €</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">${t.sentOn}</td><td style="color:#1a1a2e;font-size:14px;text-align:right;">${date}</td></tr>
        </table>
      </div>
      <p style="margin:0;color:#777;font-size:13px;">${t.pdfArchive}</p>
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

function htmlDevisArtisan({ nomArtisan, nomClient, numeroDevis, montantFormate, lbl }) {
  const isEn = lbl && lbl.greeting === "Hello";
  const locale = isEn ? "en-GB" : "fr-FR";
  const date = new Date().toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const t = lbl || EMAIL_LABELS.fr.quote;
  return `<!DOCTYPE html>
<html lang="${isEn ? "en" : "fr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:#0a1628;padding:28px 36px;text-align:center;">
      <span style="font-size:30px;font-weight:900;color:#fff;">Artisan<span style="color:#FF8C00">+</span></span>
    </div>
    <div style="background:#FF8C00;padding:22px 36px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">✅</div>
      <div style="color:#fff;font-size:20px;font-weight:700;">${t.signed}</div>
    </div>
    <div style="padding:36px;">
      <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">${t.greeting} <strong>${nomArtisan || (isEn ? "Craftsman" : "Artisan")}</strong>,</p>
      <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.7;">
        ${t.artisanBody1} <strong>${nomClient || (isEn ? "your client" : "votre client")}</strong> ${t.artisanBody2} <strong>${numeroDevis}</strong> ${t.artisanBody3} <strong>${date}</strong>.
      </p>
      <div style="background:#f8f9fb;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #FF8C00;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">${t.reference}</td><td style="color:#1a1a2e;font-size:14px;font-weight:700;text-align:right;">${numeroDevis}</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">${t.craftsman}</td><td style="color:#1a1a2e;font-size:14px;text-align:right;">${nomArtisan || "—"}</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">${t.amountTTC}</td><td style="color:#FF8C00;font-size:20px;font-weight:800;text-align:right;">${montantFormate} €</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">${t.signedOn}</td><td style="color:#1a1a2e;font-size:14px;text-align:right;">${date}</td></tr>
        </table>
      </div>
      <p style="margin:0;color:#777;font-size:13px;">${t.quoteSignedAttached}</p>
    </div>
    <div style="background:#0a1628;padding:18px 36px;text-align:center;">
      <span style="color:#8899aa;font-size:12px;">Artisan+ — artisan-plus.fr</span>
    </div>
  </div>
</body>
</html>`;
}

function htmlDevisClient({ nomArtisan, nomClient, numeroDevis, montantFormate, lbl }) {
  const isEn = lbl && lbl.greeting === "Hello";
  const locale = isEn ? "en-GB" : "fr-FR";
  const date = new Date().toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const t = lbl || EMAIL_LABELS.fr.quote;
  return `<!DOCTYPE html>
<html lang="${isEn ? "en" : "fr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:#0a1628;padding:28px 36px;text-align:center;">
      <span style="font-size:30px;font-weight:900;color:#fff;">Artisan<span style="color:#FF8C00">+</span></span>
    </div>
    <div style="background:#FF8C00;padding:22px 36px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">📋</div>
      <div style="color:#fff;font-size:20px;font-weight:700;">${t.quoteConfirmation}</div>
    </div>
    <div style="padding:36px;">
      <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">${t.greeting} <strong>${nomClient || "Client"}</strong>,</p>
      <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.7;">
        ${t.clientBody1} <strong>${numeroDevis}</strong> ${t.clientBody2} <strong>${date}</strong>.
      </p>
      <div style="background:#f8f9fb;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #FF8C00;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">${t.reference}</td><td style="color:#1a1a2e;font-size:14px;font-weight:700;text-align:right;">${numeroDevis}</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">${t.craftsman}</td><td style="color:#1a1a2e;font-size:14px;text-align:right;">${nomArtisan || "—"}</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">${t.amountTTC}</td><td style="color:#FF8C00;font-size:20px;font-weight:800;text-align:right;">${montantFormate} €</td></tr>
          <tr><td style="color:#999;font-size:11px;padding:5px 0;text-transform:uppercase;letter-spacing:0.8px;">${t.signedOn}</td><td style="color:#1a1a2e;font-size:14px;text-align:right;">${date}</td></tr>
        </table>
      </div>
      <p style="margin:0;color:#777;font-size:13px;">${t.clientConfirmation}</p>
    </div>
    <div style="background:#0a1628;padding:18px 36px;text-align:center;">
      <span style="color:#8899aa;font-size:12px;">Artisan+ — artisan-plus.fr</span>
    </div>
  </div>
</body>
</html>`;
}
