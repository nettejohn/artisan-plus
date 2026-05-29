/**
 * GET /api/debug-stripe — Diagnostic Stripe (temporaire, à supprimer après debug)
 */
import Stripe from "stripe";

export default async function handler(req, res) {
  const key = process.env.STRIPE_SECRET_KEY;

  // 1. Vérifier que la clé existe
  if (!key) {
    return res.status(200).json({ step: "key_missing", error: "STRIPE_SECRET_KEY non définie" });
  }

  // 2. Vérifier le format de la clé
  const keyPrefix = key.slice(0, 8);
  const keyLength = key.length;
  const hasNewline = key.includes("\n") || key.includes("\r");
  const hasSpace   = key.startsWith(" ") || key.endsWith(" ");

  if (!key.startsWith("sk_")) {
    return res.status(200).json({
      step: "key_format_invalid",
      prefix: keyPrefix,
      length: keyLength,
      hasNewline,
      hasSpace,
      error: "La clé ne commence pas par sk_",
    });
  }

  // 3. Initialiser Stripe
  let stripe;
  try {
    stripe = new Stripe(key.trim(), { apiVersion: "2024-04-10", timeout: 15000 });
  } catch (initErr) {
    return res.status(200).json({ step: "init_failed", error: initErr.message });
  }

  // 4. Tester la connexion avec un appel minimal
  try {
    const customers = await stripe.customers.list({ limit: 1 });
    return res.status(200).json({
      step: "success",
      keyPrefix,
      keyLength,
      keyMode: key.startsWith("sk_live_") ? "live" : "test",
      customersCount: customers.data.length,
    });
  } catch (err) {
    return res.status(200).json({
      step: "api_call_failed",
      keyPrefix,
      keyLength,
      keyMode: key.startsWith("sk_live_") ? "live" : "test",
      errorType: err.type,
      errorCode: err.code,
      errorMessage: err.message,
      errorStatus: err.statusCode,
    });
  }
}
