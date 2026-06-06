const RESEND_API = "https://api.resend.com/emails";
const FROM = "Artisan+ <contact@artisan-plus.fr>";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Configuration serveur manquante" });

  let body = {};
  try {
    if (!req.body) {
      const raw = await new Promise((resolve, reject) => {
        let d = ""; req.on("data", c => { d += c.toString(); }); req.on("end", () => resolve(d)); req.on("error", reject);
      });
      body = raw ? JSON.parse(raw) : {};
    } else if (typeof req.body === "string") {
      body = JSON.parse(req.body);
    } else {
      body = req.body;
    }
  } catch (e) {
    return res.status(400).json({ error: "Corps de requête invalide" });
  }

  const { emailClient, emailArtisan, nomArtisan, nomClient, numeroFacture, montantTTC, pdfBase64 } = body;
  if (!numeroFacture) return res.status(400).json({ error: "Paramètre manquant : numeroFacture" });

  const montantFormate = montantTTC != null
    ? (typeof montantTTC === "number" ? montantTTC.toFixed(2) : String(montantTTC))
    : "—";

  const attachments = pdfBase64
    ? [{ filename: `${numeroFacture}.pdf`, content: pdfBase64 }]
    : [];

  const resultats = { clientEnvoye: false, artisanEnvoye: false, erreurs: [] };

  // ── Email client ──────────────────────────────────────────────────────────
  if (emailClient) {
    try {
      await appelResend(apiKey, {
        from: FROM,
        to: [emailClient],
        subject: `Votre facture ${numeroFacture} — ${montantFormate} €`,
        html: htmlClient({ nomArtisan, nomClient, numeroFacture, montantFormate }),
        ...(attachments.length > 0 ? { attachments } : {}),
      });
      resultats.clientEnvoye = true;
    } catch (err) {
      resultats.erreurs.push(`Client : ${err.message}`);
    }
  }

  // ── Copie artisan ─────────────────────────────────────────────────────────
  if (emailArtisan) {
    try {
      await appelResend(apiKey, {
        from: FROM,
        to: [emailArtisan],
        subject: `✅ Facture ${numeroFacture} envoyée — ${nomClient || "client"}`,
        html: htmlArtisan({ nomArtisan, nomClient, numeroFacture, montantFormate }),
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

async function appelResend(apiKey, payload) {
  const r = await fetch(RESEND_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || err.name || `HTTP ${r.status}`);
  }
  return r.json();
}

function htmlClient({ nomArtisan, nomClient, numeroFacture, montantFormate }) {
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

function htmlArtisan({ nomArtisan, nomClient, numeroFacture, montantFormate }) {
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
      <p style="margin:0;color:#777;font-size:13px;">La facture PDF est jointe à cet email pour vos archives. Retrouvez-la aussi dans votre espace Artisan+.</p>
    </div>
    <div style="background:#0a1628;padding:18px 36px;text-align:center;">
      <span style="color:#8899aa;font-size:12px;">Artisan+ — artisan-plus.fr</span>
    </div>
  </div>
</body>
</html>`;
}
