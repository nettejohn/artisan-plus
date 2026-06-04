/**
 * POST /api/create-invoice-checkout
 * Crée une session Stripe Checkout pour le paiement en ligne d'une facture.
 * Utilise Stripe Connect : les fonds sont transférés directement au compte
 * Express de l'artisan.
 *
 * Body : { factureId, userId }
 * Retourne : { checkoutUrl }
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

  const { factureId, userId } = body;
  if (!factureId || !userId) {
    return res.status(400).json({ error: "factureId et userId sont requis" });
  }

  try {
    // Récupérer la facture + le profil artisan
    const [{ data: facture }, { data: profil }] = await Promise.all([
      supabase.from("factures")
        .select("*, clients(*)")
        .eq("id", factureId)
        .eq("user_id", userId)
        .single(),
      supabase.from("profils")
        .select("stripe_connect_account_id, stripe_connect_onboarded, nom")
        .eq("user_id", userId)
        .single(),
    ]);

    if (!facture) return res.status(404).json({ error: "Facture introuvable" });
    if (facture.statut === "payee") return res.status(400).json({ error: "Cette facture est déjà payée" });

    const accountId = profil?.stripe_connect_account_id;
    if (!accountId) {
      return res.status(400).json({ error: "Compte Stripe non connecté. Allez dans Paramètres > Paiements en ligne." });
    }

    // Si un lien existe déjà, le retourner directement
    if (facture.stripe_connect_checkout_url) {
      return res.status(200).json({ checkoutUrl: facture.stripe_connect_checkout_url });
    }

    const montantCentimes = Math.round((facture.total_ttc || 0) * 100);
    if (montantCentimes < 50) {
      return res.status(400).json({ error: "Le montant minimum est 0,50 €" });
    }

    const nomArtisan = profil?.nom || "Votre artisan";
    const nomClient  = facture.clients?.nom || "Client";
    const description = `Facture ${facture.numero} — ${nomArtisan}`;

    // Créer la session Checkout avec destination charge (fonds → compte artisan)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency:     "eur",
          product_data: {
            name:        description,
            description: `Client : ${nomClient} · Total TTC : ${facture.total_ttc?.toFixed(2)} €`,
          },
          unit_amount: montantCentimes,
        },
        quantity: 1,
      }],
      success_url: `${APP_URL}/?payment=success&facture_id=${factureId}`,
      cancel_url:  `${APP_URL}/?payment=canceled`,
      payment_intent_data: {
        transfer_data: {
          destination: accountId,
        },
        description,
        metadata: {
          facture_id: factureId,
          user_id:    userId,
        },
      },
      metadata: {
        facture_id: factureId,
        user_id:    userId,
        type:       "invoice_payment",
      },
      locale: "fr",
    });

    // Sauvegarder l'URL et la session ID dans la facture
    await supabase.from("factures").update({
      stripe_connect_checkout_url: session.url,
      stripe_connect_session_id:   session.id,
    }).eq("id", factureId);

    return res.status(200).json({ checkoutUrl: session.url });
  } catch (err) {
    console.error("[create-invoice-checkout] Erreur :", err.message);
    return res.status(500).json({ error: err.message });
  }
}
