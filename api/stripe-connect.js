/**
 * POST /api/stripe-connect
 * Point d'entrée unifié pour la gestion du compte Stripe Connect.
 *
 * Body : { action, userId, ...params }
 *  action = "onboard"  → crée/récupère le compte Express + retourne l'URL d'onboarding
 *  action = "status"   → vérifie la complétion et met à jour stripe_connect_onboarded
 *  action = "disconnect" → déconnecte le compte (efface les colonnes)
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const cleanKey = (k) => (k || "")
  .replace(/^﻿/, "").trim()
  .replace(/^sk_1ive_/, "sk_live_")
  .replace(/^rk_1ive_/, "rk_live_");

const stripe  = new Stripe(cleanKey(process.env.STRIPE_SECRET_KEY), { apiVersion: "2024-04-10" });
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

  const { action, userId } = body;
  if (!action) return res.status(400).json({ error: "action requise (onboard | status | disconnect)" });
  if (!userId) return res.status(400).json({ error: "userId requis" });

  // ── ACTION : onboard ───────────────────────────────────────────────────
  if (action === "onboard") {
    try {
      const { data: profil } = await supabase
        .from("profils")
        .select("stripe_connect_account_id, stripe_connect_onboarded, email, nom")
        .eq("user_id", userId)
        .single();

      let accountId = profil?.stripe_connect_account_id;

      if (!accountId) {
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

        await supabase.from("profils").upsert(
          { user_id: userId, stripe_connect_account_id: accountId, stripe_connect_onboarded: false },
          { onConflict: "user_id" }
        );
        console.log(`[connect] Compte Express créé : ${accountId}`);
      }

      const accountLink = await stripe.accountLinks.create({
        account:     accountId,
        refresh_url: `${APP_URL}/?stripe_connect=refresh`,
        return_url:  `${APP_URL}/?stripe_connect=success`,
        type:        "account_onboarding",
      });

      return res.status(200).json({ accountId, onboardingUrl: accountLink.url });
    } catch (err) {
      console.error("[connect/onboard]", err.message);
      if (err.code === "permission_error" || err.message?.includes("permission")) {
        return res.status(403).json({ error: "Clé API sans permissions Connect. Vérifiez les droits de la clé restreinte dans le Dashboard Stripe." });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  // ── ACTION : status ────────────────────────────────────────────────────
  if (action === "status") {
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
      const onboarded = account.details_submitted === true && account.charges_enabled === true;

      if (onboarded !== profil?.stripe_connect_onboarded) {
        await supabase.from("profils").upsert(
          { user_id: userId, stripe_connect_onboarded: onboarded },
          { onConflict: "user_id" }
        );
      }

      return res.status(200).json({
        accountId,
        onboarded,
        chargesEnabled:   account.charges_enabled  || false,
        payoutsEnabled:   account.payouts_enabled  || false,
        detailsSubmitted: account.details_submitted || false,
      });
    } catch (err) {
      console.error("[connect/status]", err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── ACTION : disconnect ────────────────────────────────────────────────
  if (action === "disconnect") {
    await supabase.from("profils").upsert(
      { user_id: userId, stripe_connect_account_id: null, stripe_connect_onboarded: false },
      { onConflict: "user_id" }
    );
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: `Action inconnue : ${action}` });
}
