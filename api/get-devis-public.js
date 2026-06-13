import { createClient } from "@supabase/supabase-js";

function cleanKey(k) { return (k || "").trim().replace(/[\r\n\s]/g, ""); }

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode non autorisée" });

  const { token } = req.query || {};
  if (!token) return res.status(400).json({ error: "Token manquant" });

  const supabaseUrl = cleanKey(process.env.SUPABASE_URL);
  const serviceKey  = cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!supabaseUrl || !serviceKey)
    return res.status(500).json({ error: "Configuration serveur manquante" });

  const supa = createClient(supabaseUrl, serviceKey);

  // 1. Trouver la signature par token
  const { data: sig, error: sigErr } = await supa
    .from("signatures")
    .select("*")
    .eq("token", token)
    .single();

  if (sigErr || !sig)
    return res.status(404).json({ error: "Lien invalide ou expiré" });

  // 2. Trouver le devis avec le client
  const { data: devis, error: devisErr } = await supa
    .from("devis")
    .select("*, clients(*)")
    .eq("id", sig.devis_id)
    .single();

  if (devisErr || !devis)
    return res.status(404).json({ error: "Devis introuvable" });

  // 3. Trouver les lignes du devis
  const { data: lignes } = await supa
    .from("lignes_devis")
    .select("*")
    .eq("devis_id", devis.id)
    .order("ordre", { ascending: true });

  // 4. Trouver le profil artisan
  const { data: artisan } = await supa
    .from("profils")
    .select("*")
    .eq("user_id", devis.user_id)
    .single();

  // 5. Trouver la couleur PDF depuis les paramètres
  const { data: params } = await supa
    .from("parametres")
    .select("couleur_pdf")
    .eq("user_id", devis.user_id)
    .single();

  return res.status(200).json({
    signature: sig,
    devis,
    lignes: lignes || [],
    artisan: artisan || null,
    couleur_pdf: params?.couleur_pdf || null,
  });
}
