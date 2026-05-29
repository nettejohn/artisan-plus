/**
 * GET /api/debug-stripe — Diagnostic Stripe (temporaire)
 */
import Stripe from "stripe";

const cleanKey = (k) => (k || "").replace(/^﻿/, "").trim();

export default async function handler(req, res) {
  const rawKey = process.env.STRIPE_SECRET_KEY || "";
  const key    = cleanKey(rawKey);

  // Infos sur la clé
  const info = {
    presente:      rawKey.length > 0,
    longueur:      rawKey.length,
    longueurClean: key.length,
    prefixe8chars: key.slice(0, 8),
    prefixe12chars: key.slice(0, 12),
    mode:          key.startsWith("sk_live_") ? "LIVE" : key.startsWith("sk_test_") ? "TEST" : "INCONNU",
    premierCharCode: rawKey.charCodeAt(0).toString(16).toUpperCase(),
  };

  if (!key || !key.startsWith("sk_")) {
    return res.status(200).json({ etape: "cle_invalide", info });
  }

  // Test API Stripe
  const stripe = new Stripe(key, { apiVersion: "2024-04-10", timeout: 10000 });
  try {
    await stripe.customers.list({ limit: 1 });
    return res.status(200).json({ etape: "ok", info });
  } catch (err) {
    return res.status(200).json({
      etape: "erreur_stripe",
      info,
      erreurType:    err.type,
      erreurCode:    err.code,
      erreurStatut:  err.statusCode,
      erreurMessage: err.message,
    });
  }
}
