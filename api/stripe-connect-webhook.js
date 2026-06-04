/**
 * POST /api/stripe-connect-webhook
 * Endpoint dédié aux événements Stripe Connect.
 * Utilise STRIPE_CONNECT_WEBHOOK_SECRET pour la vérification.
 *
 * Événements traités :
 *  • checkout.session.completed  (metadata.type="invoice_payment") → facture payée
 *  • account.updated             → met à jour stripe_connect_onboarded
 *  • payment_intent.succeeded    (metadata.facture_id) → fallback paiement facture
 *
 * URL à configurer dans Stripe Dashboard → Webhooks :
 *   https://www.artisan-plus.fr/api/stripe-connect-webhook
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const cleanKey = (k) => (k || "")
  .replace(/^﻿/, "").trim()
  .replace(/^sk_1ive_/, "sk_live_")
  .replace(/^rk_1ive_/, "rk_live_");

const stripe  = new Stripe(cleanKey(process.env.STRIPE_SECRET_KEY), { apiVersion: "2024-04-10" });
const supabase = createClient(
  cleanKey(process.env.SUPABASE_URL),
  cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY)
);

export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function marquerFacturePayee(factureId, sessionId) {
  const { data, error } = await supabase
    .from("factures")
    .update({
      statut:                    "payee",
      stripe_connect_session_id: sessionId || null,
    })
    .eq("id", factureId)
    .select("id, numero, user_id")
    .single();

  if (error) {
    console.error(`[connect-webhook] ❌ Erreur mise à jour facture ${factureId} :`, error.message);
  } else {
    console.log(`[connect-webhook] ✅ Facture ${data?.numero || factureId} (user=${data?.user_id}) → payée`);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const rawBody = await readRawBody(req);
  const sig     = req.headers["stripe-signature"];
  let event;

  // ── Vérification de signature ───────────────────────────────────────────
  const connectSecret = cleanKey(process.env.STRIPE_CONNECT_WEBHOOK_SECRET);
  const fallbackSecret = cleanKey(process.env.STRIPE_WEBHOOK_SECRET);

  if (sig) {
    let verified = false;
    for (const [label, secret] of [
      ["STRIPE_CONNECT_WEBHOOK_SECRET", connectSecret],
      ["STRIPE_WEBHOOK_SECRET",         fallbackSecret],
    ]) {
      if (!secret) continue;
      try {
        event = stripe.webhooks.constructEvent(rawBody, sig, secret);
        console.log(`[connect-webhook] ✅ Signature vérifiée avec ${label}`);
        verified = true;
        break;
      } catch (err) {
        console.log(`[connect-webhook] ⚠️ Échec avec ${label}: ${err.message}`);
      }
    }
    if (!verified) {
      console.error("[connect-webhook] ❌ Signature invalide");
      return res.status(400).json({ error: "Signature invalide" });
    }
  } else {
    console.warn("[connect-webhook] ⚠️ Pas de stripe-signature — requête rejetée");
    return res.status(400).json({ error: "stripe-signature manquant" });
  }

  console.log(`[connect-webhook] Événement reçu : ${event.type}${event.account ? ` (compte=${event.account})` : ""}`);

  try {
    switch (event.type) {

      // ── Paiement de facture ────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object;

        if (session.metadata?.type === "invoice_payment" && session.metadata?.facture_id) {
          await marquerFacturePayee(session.metadata.facture_id, session.id);
        } else if (session.metadata?.facture_id) {
          // Sans metadata.type, on tente quand même si facture_id présent
          await marquerFacturePayee(session.metadata.facture_id, session.id);
        } else {
          console.log(`[connect-webhook] checkout.session.completed sans facture_id — ignoré (session=${session.id})`);
        }
        break;
      }

      // ── Fallback : payment_intent directement ─────────────────────────
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const factureId = pi.metadata?.facture_id;
        if (factureId) {
          await marquerFacturePayee(factureId, pi.id);
        }
        break;
      }

      // ── Mise à jour du compte Connect (fin d'onboarding) ──────────────
      case "account.updated": {
        const account   = event.data.object;
        const accountId = account.id || event.account;
        if (!accountId) break;

        const { data: profilData } = await supabase
          .from("profils")
          .select("user_id, stripe_connect_onboarded")
          .eq("stripe_connect_account_id", accountId)
          .single();

        if (!profilData) {
          console.log(`[connect-webhook] account.updated : ${accountId} introuvable`);
          break;
        }

        const onboarded = account.details_submitted === true && account.charges_enabled === true;
        if (onboarded !== profilData.stripe_connect_onboarded) {
          await supabase.from("profils")
            .update({ stripe_connect_onboarded: onboarded })
            .eq("user_id", profilData.user_id);
          console.log(`[connect-webhook] ✅ ${accountId} → onboarded=${onboarded}`);
        }
        break;
      }

      default:
        console.log(`[connect-webhook] Événement ignoré : ${event.type}`);
    }
  } catch (err) {
    console.error("[connect-webhook] Erreur traitement :", err.message);
    return res.status(500).json({ error: err.message });
  }

  return res.status(200).json({ received: true });
}
