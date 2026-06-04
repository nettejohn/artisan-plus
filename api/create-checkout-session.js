/**
 * POST /api/create-checkout-session
 * Crée une session Stripe Checkout pour l'abonnement Pro (7,99 €/mois).
 *
 * Body : { userId, email }
 * Retourne : { url } — URL de redirection vers Stripe Checkout
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Nettoyage défensif : supprime BOM, espaces et corrige 1 → l dans le préfixe Stripe
const cleanKey = (k) => (k || "")
  .replace(/^﻿/, "")          // BOM U+FEFF
  .trim()
  .replace(/^sk_1ive_/, "sk_live_"); // police : '1' confondu avec 'l'

const stripe = new Stripe(cleanKey(process.env.STRIPE_SECRET_KEY), { apiVersion: "2024-04-10" });

const supabase = createClient(
  cleanKey(process.env.SUPABASE_URL),
  cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY)
);

const PRICE_ID       = "price_1TbnJbRDTXEk04jfpt4wZYX1"; // 7,99 €/mois
const APP_URL        = "https://artisan-plus.vercel.app";
const SUCCESS_URL    = `${APP_URL}/?subscription=success`;
const CANCEL_URL     = `${APP_URL}/?subscription=canceled`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", APP_URL);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  // ── Parse du body ──────────────────────────────────────────────────────────
  let body = {};
  try {
    if (!req.body)                   body = {};
    else if (typeof req.body === "string") body = JSON.parse(req.body);
    else                             body = req.body;
  } catch {
    return res.status(400).json({ error: "Corps de requête invalide" });
  }

  const { userId, email } = body;
  if (!userId || !email) {
    return res.status(400).json({ error: "userId et email sont requis" });
  }

  try {
    // ── Récupérer ou créer le customer Stripe ───────────────────────────────
    const { data: profil } = await supabase
      .from("profils")
      .select("stripe_customer_id, plan")
      .eq("user_id", userId)
      .single();

    let customerId = profil?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { user_id: userId },
      });
      customerId = customer.id;
      // Sauvegarder le customer_id immédiatement
      await supabase.from("profils").upsert(
        { user_id: userId, stripe_customer_id: customerId },
        { onConflict: "user_id" }
      );
    }

    // ── Créer la session Checkout ───────────────────────────────────────────
    // user_id transmis sur 3 vecteurs (triple redondance) :
    //  1. session.metadata.user_id         → lu dans checkout.session.completed
    //  2. session.client_reference_id      → champ dédié Stripe, toujours présent
    //  3. subscription_data.metadata       → propagé sur l'abonnement et ses invoices
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: SUCCESS_URL,
      cancel_url:  CANCEL_URL,
      allow_promotion_codes: true,
      client_reference_id: userId,           // ← champ dédié Stripe (le plus fiable)
      metadata: { user_id: userId },
      subscription_data: {
        metadata: { user_id: userId },
      },
      locale: "fr",
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("[checkout] Erreur Stripe :", err.message);
    return res.status(500).json({ error: err.message });
  }
}
