/**
 * POST /api/create-portal-session
 * Crée une session Stripe Customer Portal pour gérer ou annuler l'abonnement.
 *
 * Body : { userId }
 * Retourne : { url }
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const cleanKey = (k) => (k || "")
  .replace(/^﻿/, "")
  .trim()
  .replace(/^sk_1ive_/, "sk_live_");
const stripe = new Stripe(cleanKey(process.env.STRIPE_SECRET_KEY), { apiVersion: "2024-04-10" });

const supabase = createClient(
  cleanKey(process.env.SUPABASE_URL),
  cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY)
);

const APP_URL = "https://artisan-plus.vercel.app";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", APP_URL);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  let body = {};
  try {
    if (!req.body)                   body = {};
    else if (typeof req.body === "string") body = JSON.parse(req.body);
    else                             body = req.body;
  } catch {
    return res.status(400).json({ error: "Corps invalide" });
  }

  const { userId } = body;
  if (!userId) return res.status(400).json({ error: "userId requis" });

  const { data: profil } = await supabase
    .from("profils")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (!profil?.stripe_customer_id) {
    return res.status(404).json({ error: "Aucun abonnement Stripe trouvé" });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profil.stripe_customer_id,
      return_url: APP_URL,
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("[portal] Erreur Stripe :", err.message);
    return res.status(500).json({ error: err.message });
  }
}
