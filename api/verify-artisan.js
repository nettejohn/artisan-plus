import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function cleanKey(k) { return (k || "").trim().replace(/[\r\n\s]/g, ""); }

const RESEND_API = "https://api.resend.com/emails";
const FROM       = "Artisan+ <contact@artisan-plus.fr>";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { userId, action, token } = req.query || {};

  if (!userId || !action || !token)
    return res.status(400).send(page("❌ Lien invalide", "Les paramètres sont manquants.", "#ff6b6b"));

  if (!["approve", "reject"].includes(action))
    return res.status(400).send(page("❌ Action invalide", "L'action doit être 'approve' ou 'reject'.", "#ff6b6b"));

  // ── Validation du token HMAC ─────────────────────────────────────────────
  const secret = cleanKey(process.env.VERIFY_SECRET) || cleanKey(process.env.RESEND_API_KEY);
  if (!secret)
    return res.status(500).send(page("❌ Configuration", "VERIFY_SECRET non configuré.", "#ff6b6b"));

  const expected = crypto.createHmac("sha256", secret).update(`${userId}:${action}`).digest("hex");
  if (expected !== token)
    return res.status(403).send(page("❌ Token invalide", "Ce lien n'est pas valide ou a déjà été utilisé.", "#ff6b6b"));

  // ── Supabase service role ────────────────────────────────────────────────
  const supabaseUrl = cleanKey(process.env.SUPABASE_URL);
  const serviceKey  = cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!supabaseUrl || !serviceKey)
    return res.status(500).send(page("❌ Configuration", "Supabase service key manquante.", "#ff6b6b"));

  const supa = createClient(supabaseUrl, serviceKey);

  // Lire le profil avant modification
  const { data: profil } = await supa
    .from("profils")
    .select("nom, siret, verification_statut")
    .eq("user_id", userId)
    .single();

  if (!profil)
    return res.status(404).send(page("❌ Artisan introuvable", `Aucun profil trouvé pour userId : ${userId}`, "#ff6b6b"));

  if (profil.verification_statut === (action === "approve" ? "verifie" : "rejete"))
    return res.status(200).send(page("⚠️ Déjà traité", "Cette demande a déjà été traitée.", "#FF8C00"));

  // ── Mise à jour du statut ────────────────────────────────────────────────
  const newStatut = action === "approve" ? "verifie" : "rejete";
  const { error } = await supa.from("profils").update({
    verification_statut:    newStatut,
    verification_traite_at: new Date().toISOString(),
  }).eq("user_id", userId);

  if (error)
    return res.status(500).send(page("❌ Erreur base de données", error.message, "#ff6b6b"));

  // ── Email de confirmation à l'artisan ───────────────────────────────────
  const artisanNom = profil.nom || "Artisan";
  try {
    const { data: authData } = await supa.auth.admin.getUserById(userId);
    const artisanEmail = authData?.user?.email;
    const apiKey = cleanKey(process.env.RESEND_API_KEY);

    if (artisanEmail && apiKey) {
      await fetch(RESEND_API, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM,
          to: [artisanEmail],
          subject: action === "approve"
            ? "🎉 Votre badge Artisan Vérifié a été accordé !"
            : "Votre demande de badge Artisan Vérifié",
          html: action === "approve"
            ? htmlApprouve(artisanNom)
            : htmlRejete(artisanNom),
        }),
      }).catch(() => {}); // silent — l'action admin réussit quand même
    }
  } catch (_) {
    // silent
  }

  // ── Page de confirmation admin ───────────────────────────────────────────
  if (action === "approve") {
    return res.status(200).send(page(
      "✅ Badge accordé",
      `Le badge <strong>Artisan Vérifié</strong> a été accordé à <strong>${esc(artisanNom)}</strong> (SIRET : ${esc(profil.siret || "—")}).<br><br>L'artisan a reçu un email de confirmation.`,
      "#4CAF50"
    ));
  }
  return res.status(200).send(page(
    "❌ Demande refusée",
    `La demande de badge de <strong>${esc(artisanNom)}</strong> a été refusée.<br><br>L'artisan a reçu un email de notification.`,
    "#FF8C00"
  ));
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML pages de réponse (vues par l'admin après clic)
// ─────────────────────────────────────────────────────────────────────────────

function esc(s) { return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

function page(titre, message, couleur = "#FF8C00") {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(titre)} — Artisan+</title>
</head>
<body style="margin:0;padding:40px 20px;background:#0a1628;font-family:'Segoe UI',Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;box-sizing:border-box;">
  <div style="max-width:520px;width:100%;background:#111e35;border-radius:20px;padding:48px 40px;text-align:center;box-shadow:0 8px 48px rgba(0,0,0,0.5);">
    <div style="font-size:32px;font-weight:900;color:#fff;margin-bottom:32px;">
      Artisan<span style="color:#FF8C00">+</span>
    </div>
    <div style="font-size:52px;margin-bottom:20px;">${titre.split(" ")[0]}</div>
    <h1 style="color:${couleur};font-size:22px;font-weight:800;margin:0 0 16px;">${esc(titre.slice(titre.indexOf(" ")+1))}</h1>
    <p style="color:#8899aa;font-size:15px;line-height:1.7;margin:0;">${message}</p>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Emails artisan (approbation / refus)
// ─────────────────────────────────────────────────────────────────────────────

function htmlApprouve(nom) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:#0a1628;padding:28px 36px;text-align:center;">
      <span style="font-size:30px;font-weight:900;color:#fff;">Artisan<span style="color:#FF8C00">+</span></span>
    </div>
    <div style="background:linear-gradient(135deg,#4CAF50,#2e7d32);padding:28px 36px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">🏅</div>
      <div style="color:#fff;font-size:22px;font-weight:800;">Badge Artisan Vérifié accordé !</div>
    </div>
    <div style="padding:36px;">
      <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">Bonjour <strong>${esc(nom)}</strong>,</p>
      <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.7;">
        Félicitations ! Notre équipe a examiné votre dossier et vous avez obtenu le badge <strong>✓ Artisan Vérifié</strong>.
      </p>
      <div style="background:#f0fdf4;border-radius:12px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #4CAF50;">
        <div style="color:#2e7d32;font-weight:700;font-size:14px;margin-bottom:10px;">Ce que ça change pour vous :</div>
        <div style="color:#555;font-size:13px;line-height:1.8;">
          ✅ Badge <strong>✓ Artisan Vérifié</strong> affiché sur votre profil<br>
          ✅ Mention sur tous vos devis et factures PDF<br>
          ✅ Confiance accrue auprès de vos clients
        </div>
      </div>
      <p style="margin:0;color:#777;font-size:13px;">Ouvrez votre application Artisan+ pour voir votre badge actif.</p>
    </div>
    <div style="background:#0a1628;padding:18px 36px;text-align:center;">
      <span style="color:#8899aa;font-size:12px;">Artisan+ — artisan-plus.fr</span>
    </div>
  </div>
</body>
</html>`;
}

function htmlRejete(nom) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:#0a1628;padding:28px 36px;text-align:center;">
      <span style="font-size:30px;font-weight:900;color:#fff;">Artisan<span style="color:#FF8C00">+</span></span>
    </div>
    <div style="background:#FF8C00;padding:28px 36px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">📋</div>
      <div style="color:#fff;font-size:20px;font-weight:700;">Votre demande de badge</div>
    </div>
    <div style="padding:36px;">
      <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">Bonjour <strong>${esc(nom)}</strong>,</p>
      <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.7;">
        Nous avons examiné votre dossier de vérification, mais il n'a pas pu être validé en l'état.
      </p>
      <div style="background:#fff8f0;border-radius:12px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #FF8C00;">
        <div style="color:#e65100;font-weight:700;font-size:14px;margin-bottom:10px;">Prochaines étapes :</div>
        <div style="color:#555;font-size:13px;line-height:1.8;">
          1. Vérifiez que le document joint est bien lisible (Kbis, carte pro artisanale ou attestation URSSAF)<br>
          2. Assurez-vous que votre SIRET dans Mon profil est correct<br>
          3. Soumettez à nouveau votre dossier depuis Paramètres → Vérification
        </div>
      </div>
      <p style="margin:0;color:#777;font-size:13px;">
        Des questions ? Répondez à cet email ou contactez-nous sur <a href="https://www.artisan-plus.fr" style="color:#FF8C00;">artisan-plus.fr</a>.
      </p>
    </div>
    <div style="background:#0a1628;padding:18px 36px;text-align:center;">
      <span style="color:#8899aa;font-size:12px;">Artisan+ — artisan-plus.fr</span>
    </div>
  </div>
</body>
</html>`;
}
