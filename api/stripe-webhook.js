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

const cleanKey = (k) => (k || "")
  .replace(/^﻿/, "")
  .trim()
  .replace(/^sk_1ive_/, "sk_live_");
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
  else        console.log(`[webhook] ✅ user ${userId} → plan=${plan}`);
}

async function getUserIdByCustomer(customerId) {
  const { data } = await supabase
    .from("profils")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();
  return data?.user_id ?? null;
}

// Triple fallback pour résoudre le user_id depuis un événement Stripe
// Ordre : metadata.user_id → client_reference_id → lookup par stripe_customer_id
async function resolveUserId(obj, customerId) {
  const fromMeta = obj?.metadata?.user_id || null;
  if (fromMeta) {
    console.log(`[webhook] user_id résolu via metadata : ${fromMeta}`);
    return fromMeta;
  }
  const fromRef = obj?.client_reference_id || null;
  if (fromRef) {
    console.log(`[webhook] user_id résolu via client_reference_id : ${fromRef}`);
    return fromRef;
  }
  if (customerId) {
    const fromDb = await getUserIdByCustomer(customerId);
    if (fromDb) {
      console.log(`[webhook] user_id résolu via stripe_customer_id (${customerId}) : ${fromDb}`);
      return fromDb;
    }
  }
  console.error("[webhook] ❌ Impossible de résoudre user_id", { meta: obj?.metadata, ref: obj?.client_reference_id, customerId });
  return null;
}

// ── Handler principal ─────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const rawBody = await readRawBody(req);
  const sig     = req.headers["stripe-signature"];
  let event;

  // ── Vérification de signature ─────────────────────────────────────────
  const webhookSecret = cleanKey(process.env.STRIPE_WEBHOOK_SECRET); // nettoyage BOM/espaces
  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      console.log("[webhook] Signature vérifiée ✅");
    } catch (err) {
      console.error("[webhook] ❌ Signature invalide :", err.message,
        "| secret length:", webhookSecret.length,
        "| secret prefix:", webhookSecret.slice(0, 6));
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
  } else {
    console.warn("[webhook] ⚠️ Pas de STRIPE_WEBHOOK_SECRET ou pas de signature — fallback JSON");
    try {
      event = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return res.status(400).json({ error: "Body invalide" });
    }
  }

  console.log(`[webhook] Événement reçu : ${event.type}`);

  try {
    switch (event.type) {

      // ── Checkout réussi → passage en Pro + récompense parrainage ────
      case "checkout.session.completed": {
        const session        = event.data.object;
        const customerId     = session.customer;
        const subscriptionId = session.subscription;

        // Triple fallback pour résoudre le user_id
        const userId = await resolveUserId(session, customerId);
        if (!userId) break;

        // Sauvegarder le customer_id si nouveau
        if (customerId) {
          await supabase.from("profils").upsert(
            { user_id: userId, stripe_customer_id: customerId },
            { onConflict: "user_id" }
          );
        }

        // 1. Passer le filleul en Pro
        await setPlan(userId, "pro", {
          stripe_customer_id:     customerId,
          stripe_subscription_id: subscriptionId,
        });

        // 2. Résoudre le code de parrainage du filleul
        //    Fallback triple : profils.referred_by → user_metadata.referred_by → absent
        const { data: filleulProfil } = await supabase
          .from("profils")
          .select("referred_by")
          .eq("user_id", userId)
          .single();

        let referredBy = filleulProfil?.referred_by || null;

        if (!referredBy) {
          // Fallback : lire les métadonnées auth (service role requis)
          const { data: authData } = await supabase.auth.admin.getUserById(userId);
          referredBy = authData?.user?.user_metadata?.referred_by || null;
          if (referredBy) {
            // Persister pour les prochaines requêtes
            await supabase.from("profils").upsert(
              { user_id: userId, referred_by: referredBy },
              { onConflict: "user_id" }
            );
            console.log(`[webhook] referred_by récupéré depuis user_metadata : ${referredBy}`);
          }
        }

        if (referredBy) {
          // 3. Trouver le parrain via son code
          const { data: parrain } = await supabase
            .from("profils")
            .select("user_id, referral_used, plan, referral_pro_until")
            .eq("referral_code", referredBy)
            .single();

          if (parrain && !parrain.referral_used) {
            const now = new Date();

            // 4a. Récompense parrain : +30 jours Pro (cumulable si déjà une date future)
            const baseParrain = (parrain.referral_pro_until && new Date(parrain.referral_pro_until) > now)
              ? new Date(parrain.referral_pro_until)
              : new Date(now);
            baseParrain.setDate(baseParrain.getDate() + 30);

            const { error: errParrain } = await supabase
              .from("profils")
              .update({
                referral_used:      true,
                referral_pro_until: baseParrain.toISOString(),
                ...(parrain.plan !== "pro" ? { plan: "pro" } : {}),
              })
              .eq("user_id", parrain.user_id);

            // 4b. Récompense filleul : +30 jours Pro (bonus sur l'abonnement payant)
            const filleulUntil = new Date(now);
            filleulUntil.setDate(filleulUntil.getDate() + 30);
            await supabase
              .from("profils")
              .update({ referral_pro_until: filleulUntil.toISOString() })
              .eq("user_id", userId);

            if (errParrain) {
              console.error("[webhook] Erreur récompense parrain :", errParrain.message);
            } else {
              console.log(`[webhook] ✅ Parrainage récompensé : parrain=${parrain.user_id} (+30j), filleul=${userId} (+30j)`);
            }
          } else if (parrain?.referral_used) {
            console.log(`[webhook] Parrainage déjà utilisé pour le code ${referredBy}`);
          }
        }
        break;
      }

      // ── Renouvellement d'abonnement payé → maintenir Pro ─────────────
      case "invoice.paid": {
        const inv    = event.data.object;
        const userId = await resolveUserId(inv, inv.customer);
        if (userId) {
          await setPlan(userId, "pro", {
            stripe_customer_id:     inv.customer,
            stripe_subscription_id: inv.subscription,
          });
        }
        break;
      }

      // ── Abonnement annulé → retour en Free ────────────────────────────
      case "customer.subscription.deleted": {
        const sub    = event.data.object;
        const userId = await resolveUserId(sub, sub.customer);
        if (userId) await setPlan(userId, "free", { stripe_subscription_id: null });
        break;
      }

      // ── Abonnement mis à jour (statut inactif → Free) ─────────────────
      case "customer.subscription.updated": {
        const sub    = event.data.object;
        const userId = await resolveUserId(sub, sub.customer);

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
