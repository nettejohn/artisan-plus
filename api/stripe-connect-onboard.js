/**
 * POST /api/stripe-connect-onboard
 * Crée un compte Express Stripe pour l'artisan et retourne l'URL d'onboarding.
 *
 * Body : { userId, returnUrl, refreshUrl }
 * Retourne : { accountId, onboardingUrl }
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const cleanKey = (k) => (k || "")
  .replace(/^﻿/, "").trim()
  .replace(/^sk_1ive_/, "sk_live_")
  .replace(/^rk_1ive_/, "rk_live_");

const stripe = new Stripe(cleanKey(process.env.STRIPE_SECRET_KEY), { apiVersion: "2024-04-10" });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APP_URL = "https://www.artisan-plus.fr";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", APP_URL);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ error: "Corps invalide" });
  }

  const { userId } = body;
  if (!userId) return res.status(400).json({ error: "userId requis" });

  try {
    // Vérifier si un compte existe déjà
    const { data: profil } = await supabase
      .from("profils")
      .select("stripe_connect_account_id, stripe_connect_onboarded, email, nom")
      .eq("user_id", userId)
      .single();

    let accountId = profil?.stripe_connect_account_id;

    if (!accountId) {
      // Créer un compte Express
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        default_currency: "eur",
        email: profil?.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers:     { requested: true },
        },
        business_type: "individual",
        metadata: { user_id: userId },
      });
      accountId = account.id;

      // Sauvegarder dans Supabase
      await supabase.from("profils").upsert(
        { user_id: userId, stripe_connect_account_id: accountId, stripe_connect_onboarded: false },
        { onConflict: "user_id" }
      );
    }

    // Créer un lien d'onboarding (même si le compte existe déjà — le lien expire)
    const accountLink = await stripe.accountLinks.create({
      account:     accountId,
      refresh_url: `${APP_URL}/?stripe_connect=refresh`,
      return_url:  `${APP_URL}/?stripe_connect=success`,
      type:        "account_onboarding",
    });

    return res.status(200).json({ accountId, onboardingUrl: accountLink.url });
  } catch (err) {
    console.error("[stripe-connect-onboard] Erreur :", err.message);
    // Message clair si la clé restreinte n'a pas les permissions Connect
    if (err.message?.includes("permission") || err.code === "permission_error") {
      return res.status(403).json({
        error: "La clé API Stripe ne dispose pas des permissions Connect. Activez Stripe Connect dans le Dashboard Stripe et accordez les permissions 'accounts' à la clé restreinte.",
      });
    }
    return res.status(500).json({ error: err.message });
  }
}
