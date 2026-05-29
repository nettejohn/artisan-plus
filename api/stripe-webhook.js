/**
 * POST /api/stripe-webhook
 * Écoute les événements Stripe et met à jour le plan dans Supabase.
 *
 * Événements traités :
 *  • checkout.session.completed          → plan = 'pro'
 *  • customer.subscription.deleted       → plan = 'free'
 *  • customer.subscription.updated       → plan = 'free' si statut inactif
 *  • invoice.payment_failed              → (log, pas de changement immédiat)
 *
 * Configurer dans Stripe Dashboard → Webhooks → Ajouter un endpoint :
 *   URL : https://artisan-plus.vercel.app/api/stripe-webhook
 *   Événements : checkout.session.completed, customer.subscription.deleted,
 *                customer.subscription.updated, invoice.payment_failed
 * Puis copier le "Signing secret" (whsec_...) dans Vercel → STRIPE_WEBHOOK_SECRET
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const cleanKey = (k) => (k || "").replace(/^﻿/, "").trim();
const stripe = new Stripe(cleanKey(process.env.STRIPE_SECRET_KEY), { apiVersion: "2024-04-10" });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Désactiver le body parsing automatique pour lire le raw body ───────────
export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// ── Helpers Supabase ──────────────────────────────────────────────────────

async function setPlan(userId, plan, extra = {}) {
  const { error } = await supabase.from("profils").upsert(
    { user_id: userId, plan, ...extra },
    { onConflict: "user_id" }
  );
  if (error) console.error("[webhook] Erreur upsert plan :", error.message);
  else console.log(`[webhook] user ${userId} → plan=${plan}`);
}

async function getUserIdByCustomer(customerId) {
  const { data } = await supabase
    .from("profils")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();
  return data?.user_id ?? null;
}

// ── Handler principal ─────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const rawBody = await readRawBody(req);
  const sig     = req.headers["stripe-signature"];
  let event;

  // ── Vérification de signature (si STRIPE_WEBHOOK_SECRET est configuré) ──
  if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("[webhook] Signature invalide :", err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
  } else {
    // Fallback sans vérification (configuration initiale)
    try {
      event = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return res.status(400).json({ error: "Body invalide" });
    }
  }

  console.log(`[webhook] Événement reçu : ${event.type}`);

  try {
    switch (event.type) {

      // ── Paiement réussi → passage en Pro ──────────────────────────────
      case "checkout.session.completed": {
        const session      = event.data.object;
        const userId       = session.metadata?.user_id;
        const customerId   = session.customer;
        const subscriptionId = session.subscription;

        if (!userId) {
          console.error("[webhook] user_id manquant dans metadata");
          break;
        }

        await setPlan(userId, "pro", {
          stripe_customer_id:     customerId,
          stripe_subscription_id: subscriptionId,
        });
        break;
      }

      // ── Abonnement annulé → retour en Free ────────────────────────────
      case "customer.subscription.deleted": {
        const sub      = event.data.object;
        const userId   = sub.metadata?.user_id
          ?? await getUserIdByCustomer(sub.customer);

        if (userId) await setPlan(userId, "free", { stripe_subscription_id: null });
        break;
      }

      // ── Abonnement mis à jour (statut inactif → Free) ─────────────────
      case "customer.subscription.updated": {
        const sub    = event.data.object;
        const userId = sub.metadata?.user_id
          ?? await getUserIdByCustomer(sub.customer);

        const statutsInactifs = ["canceled", "unpaid", "past_due", "incomplete_expired"];
        if (userId && statutsInactifs.includes(sub.status)) {
          await setPlan(userId, "free", { stripe_subscription_id: null });
        }
        break;
      }

      // ── Paiement échoué (log uniquement) ─────────────────────────────
      case "invoice.payment_failed": {
        const inv = event.data.object;
        console.warn(`[webhook] Paiement échoué pour customer ${inv.customer}`);
        break;
      }

      default:
        console.log(`[webhook] Événement ignoré : ${event.type}`);
    }
  } catch (err) {
    console.error("[webhook] Erreur traitement :", err.message);
    return res.status(500).json({ error: err.message });
  }

  return res.status(200).json({ received: true });
}
