/**
 * POST /api/stripe-connect
 * Point d'entrée unifié pour la gestion du compte Stripe Connect.
 *
 * Body : { action, userId }
 *  action = "onboard"    → crée/récupère le compte Express + retourne l'URL d'onboarding
 *  action = "status"     → vérifie la complétion et met à jour stripe_connect_onboarded
 *  action = "disconnect" → efface les colonnes connect
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const cleanKey = (k) => (k || "")
  .replace(/^﻿/, "").trim()
  .replace(/^sk_1ive_/, "sk_live_")
  .replace(/^rk_1ive_/, "rk_live_");

const stripe   = new Stripe(cleanKey(process.env.STRIPE_SECRET_KEY), { apiVersion: "2024-04-10" });
const supabase = createClient(
  cleanKey(process.env.SUPABASE_URL),
  cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY)
);

const APP_URL = "https://www.artisan-plus.fr";

// ── Helper : sauvegarde fiable du stripe_connect_account_id ────────────────
// Utilise .update() (pas upsert) car la ligne profils existe toujours.
// Vérifie avec .select() que la ligne a bien été modifiée.
async function saveAccountId(userId, accountId) {
  const { data, error } = await supabase
    .from("profils")
    .update({
      stripe_connect_account_id: accountId,
      stripe_connect_onboarded:  false,
    })
    .eq("user_id", userId)
    .select("stripe_connect_account_id")
    .single();

  if (error) {
    console.error(`[connect/save] ❌ Erreur Supabase update :`, error.message, "| code:", error.code, "| details:", error.details);
    return { saved: false, error };
  }

  if (!data?.stripe_connect_account_id) {
    console.error(`[connect/save] ❌ Update retourne 0 lignes — user_id introuvable : ${userId}`);
    return { saved: false, error: new Error("Aucune ligne modifiée — profil introuvable") };
  }

  console.log(`[connect/save] ✅ stripe_connect_account_id sauvegardé : ${data.stripe_connect_account_id} pour user ${userId}`);
  return { saved: true, error: null };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", APP_URL);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).json({ error: "Méthode non autorisée" });

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ error: "Corps invalide" });
  }

  const { action, userId } = body;
  if (!action) return res.status(400).json({ error: "action requise (onboard | status | disconnect)" });
  if (!userId) return res.status(400).json({ error: "userId requis" });

  // ══════════════════════════════════════════════════════════════════════
  // ACTION : onboard
  // ══════════════════════════════════════════════════════════════════════
  if (action === "onboard") {
    try {
      // 1. Lire le profil existant
      const { data: profil, error: profilErr } = await supabase
        .from("profils")
        .select("stripe_connect_account_id, email, nom")
        .eq("user_id", userId)
        .single();

      if (profilErr) {
        console.error("[connect/onboard] Erreur lecture profil :", profilErr.message);
        return res.status(500).json({ error: "Impossible de lire le profil : " + profilErr.message });
      }

      let accountId = profil?.stripe_connect_account_id;

      // 2. Créer un compte Express si absent
      if (!accountId) {
        console.log(`[connect/onboard] Création compte Express pour user ${userId}`);
        const account = await stripe.accounts.create({
          type:             "express",
          country:          "FR",
          default_currency: "eur",
          email:            profil?.email || undefined,
          capabilities: {
            card_payments: { requested: true },
            transfers:     { requested: true },
          },
          business_type: "individual",
          metadata:      { user_id: userId },
        });
        accountId = account.id;
        console.log(`[connect/onboard] Compte Stripe Express créé : ${accountId}`);

        // 3. Sauvegarder AVANT de générer le lien d'onboarding
        const { saved, error: saveError } = await saveAccountId(userId, accountId);
        if (!saved) {
          // On ne redirige PAS si la sauvegarde échoue
          return res.status(500).json({
            error: "Compte Stripe créé mais impossible de sauvegarder l'identifiant. Réessayez. (" + (saveError?.message || "erreur inconnue") + ")",
          });
        }
      } else {
        console.log(`[connect/onboard] Compte Express existant : ${accountId}`);
      }

      // 4. Générer le lien d'onboarding (ou de ré-onboarding si déjà créé)
      const accountLink = await stripe.accountLinks.create({
        account:     accountId,
        refresh_url: `${APP_URL}/?stripe_connect=refresh`,
        return_url:  `${APP_URL}/?stripe_connect=success`,
        type:        "account_onboarding",
      });

      console.log(`[connect/onboard] Lien d'onboarding généré pour ${accountId}`);
      return res.status(200).json({ accountId, onboardingUrl: accountLink.url });

    } catch (err) {
      console.error("[connect/onboard] Exception :", err.message);
      if (err.type === "StripePermissionError" || err.message?.toLowerCase().includes("permission")) {
        return res.status(403).json({
          error: "La clé API Stripe ne dispose pas des permissions Connect. Activez Stripe Connect et accordez 'accounts' write à la clé restreinte dans le Dashboard Stripe.",
        });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // ACTION : status
  // ══════════════════════════════════════════════════════════════════════
  if (action === "status") {
    const { data: profil, error: profilErr } = await supabase
      .from("profils")
      .select("stripe_connect_account_id, stripe_connect_onboarded")
      .eq("user_id", userId)
      .single();

    if (profilErr) {
      console.error("[connect/status] Erreur lecture profil :", profilErr.message);
      return res.status(200).json({ accountId: null, onboarded: false, chargesEnabled: false, payoutsEnabled: false });
    }

    const accountId = profil?.stripe_connect_account_id;
    if (!accountId) {
      console.log(`[connect/status] Pas de stripe_connect_account_id pour user ${userId}`);
      return res.status(200).json({ accountId: null, onboarded: false, chargesEnabled: false, payoutsEnabled: false });
    }

    try {
      const account   = await stripe.accounts.retrieve(accountId);
      const onboarded = account.details_submitted === true && account.charges_enabled === true;

      // Mettre à jour uniquement stripe_connect_onboarded (pas l'account_id)
      if (onboarded !== profil?.stripe_connect_onboarded) {
        const { error: updErr } = await supabase
          .from("profils")
          .update({ stripe_connect_onboarded: onboarded })
          .eq("user_id", userId);

        if (updErr) {
          console.error("[connect/status] Erreur update onboarded :", updErr.message);
        } else {
          console.log(`[connect/status] ✅ stripe_connect_onboarded → ${onboarded} pour user ${userId}`);
        }
      }

      return res.status(200).json({
        accountId,
        onboarded,
        chargesEnabled:   account.charges_enabled   || false,
        payoutsEnabled:   account.payouts_enabled   || false,
        detailsSubmitted: account.details_submitted || false,
      });
    } catch (err) {
      console.error("[connect/status] Exception :", err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // ACTION : disconnect
  // ══════════════════════════════════════════════════════════════════════
  if (action === "disconnect") {
    const { error: disconnErr } = await supabase
      .from("profils")
      .update({ stripe_connect_account_id: null, stripe_connect_onboarded: false })
      .eq("user_id", userId);

    if (disconnErr) {
      console.error("[connect/disconnect] Erreur :", disconnErr.message);
      return res.status(500).json({ error: disconnErr.message });
    }
    console.log(`[connect/disconnect] Compte Connect déconnecté pour user ${userId}`);
    return res.status(200).json({ ok: true });
  }

  // ══════════════════════════════════════════════════════════════════════
  // ACTION : recover
  // Recherche le compte Express dans Stripe si l'account_id n'est pas
  // sauvegardé en base (cas où la sauvegarde initiale a échoué).
  // ══════════════════════════════════════════════════════════════════════
  if (action === "recover") {
    try {
      // Chercher parmi les comptes Connect existants celui avec user_id dans metadata
      const accounts = await stripe.accounts.list({ limit: 100 });
      const match = accounts.data.find(a => a.metadata?.user_id === userId);

      if (!match) {
        console.log(`[connect/recover] Aucun compte Express trouvé pour user ${userId}`);
        return res.status(200).json({ recovered: false, accountId: null });
      }

      const accountId = match.id;
      console.log(`[connect/recover] Compte trouvé : ${accountId} pour user ${userId}`);

      // Sauvegarder l'account_id
      const { saved, error: saveError } = await saveAccountId(userId, accountId);
      if (!saved) {
        return res.status(500).json({ error: "Récupération trouvée mais sauvegarde impossible : " + (saveError?.message || "erreur inconnue") });
      }

      const onboarded = match.details_submitted === true && match.charges_enabled === true;
      if (onboarded) {
        await supabase.from("profils")
          .update({ stripe_connect_onboarded: true })
          .eq("user_id", userId);
      }

      return res.status(200).json({ recovered: true, accountId, onboarded });
    } catch (err) {
      console.error("[connect/recover] Exception :", err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: `Action inconnue : ${action}` });
}
