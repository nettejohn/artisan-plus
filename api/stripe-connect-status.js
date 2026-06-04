/**
 * POST /api/stripe-connect-status
 * Vérifie le statut d'onboarding du compte Express de l'artisan.
 *
 * Body : { userId }
 * Retourne : { accountId, onboarded, chargesEnabled, payoutsEnabled }
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

  const { data: profil } = await supabase
    .from("profils")
    .select("stripe_connect_account_id, stripe_connect_onboarded")
    .eq("user_id", userId)
    .single();

  const accountId = profil?.stripe_connect_account_id;
  if (!accountId) {
    return res.status(200).json({ accountId: null, onboarded: false, chargesEnabled: false, payoutsEnabled: false });
  }

  try {
    const account = await stripe.accounts.retrieve(accountId);
    const onboarded = account.details_submitted === true;

    // Mettre à jour en base si le statut a changé
    if (onboarded !== profil?.stripe_connect_onboarded) {
      await supabase.from("profils").upsert(
        { user_id: userId, stripe_connect_onboarded: onboarded },
        { onConflict: "user_id" }
      );
    }

    return res.status(200).json({
      accountId,
      onboarded,
      chargesEnabled:  account.charges_enabled  || false,
      payoutsEnabled:  account.payouts_enabled  || false,
      detailsSubmitted: account.details_submitted || false,
    });
  } catch (err) {
    console.error("[stripe-connect-status] Erreur :", err.message);
    return res.status(500).json({ error: err.message });
  }
}
