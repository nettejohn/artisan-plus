/**
 * POST /api/debug-webhook — Test complet : Supabase + simulation checkout.session.completed
 * À SUPPRIMER après debug
 */
import { createClient } from "@supabase/supabase-js";

const cleanKey = (k) => (k || "").replace(/^﻿/, "").trim();

export default async function handler(req, res) {
  const url    = cleanKey(process.env.SUPABASE_URL);
  const srvKey = cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY);

  // 1. Vérifier les vars
  const vars = {
    SUPABASE_URL_present:              !!url,
    SUPABASE_URL_length:               url.length,
    SUPABASE_URL_prefix:               url.slice(0, 30),
    SERVICE_KEY_present:               !!srvKey,
    SERVICE_KEY_length:                srvKey.length,
    SERVICE_KEY_prefix:                srvKey.slice(0, 20),
  };

  if (!url || !srvKey) {
    return res.status(200).json({ etape: "vars_manquantes", vars });
  }

  // 2. Tester la connexion Supabase
  const supabase = createClient(url, srvKey);

  // Lire quelques lignes de profils
  const { data: profils, error: errLecture } = await supabase
    .from("profils")
    .select("user_id, plan, nom")
    .limit(3);

  if (errLecture) {
    return res.status(200).json({
      etape: "lecture_echouee",
      vars,
      erreur: errLecture.message,
      code:   errLecture.code,
    });
  }

  // 3. Si un user_id est passé en query, tester l'upsert plan=pro
  const testUserId = req.query?.userId;
  let upsertResult = null;

  if (testUserId) {
    const { error: errUpsert } = await supabase
      .from("profils")
      .upsert({ user_id: testUserId, plan: "pro" }, { onConflict: "user_id" });

    upsertResult = errUpsert
      ? { ok: false, erreur: errUpsert.message, code: errUpsert.code }
      : { ok: true, message: `plan=pro appliqué sur ${testUserId}` };
  }

  return res.status(200).json({
    etape: "ok",
    vars,
    profils_lus: profils?.length ?? 0,
    profils,
    upsert: upsertResult,
  });
}
