import { createClient } from "@supabase/supabase-js";

function cleanKey(k) { return (k || "").trim().replace(/[\r\n\s]/g, ""); }

// Rate-limit léger en mémoire (par IP, max 30 req/min)
const rateLimitMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const window = 60_000;
  const max = 30;
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > window) { rateLimitMap.set(ip, { count: 1, start: now }); return false; }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count > max;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode non autorisée" });

  // C4 — Rate limiting par IP
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(ip)) return res.status(429).json({ error: "Trop de requêtes, réessayez dans une minute" });

  const { token } = req.query || {};
  if (!token) return res.status(400).json({ error: "Token manquant" });

  // C4 — Validation format du token (UUID ou hex 64 chars)
  if (typeof token !== "string" || token.length < 8 || token.length > 256 || !/^[a-zA-Z0-9_\-]+$/.test(token))
    return res.status(400).json({ error: "Format de token invalide" });

  const supabaseUrl = cleanKey(process.env.SUPABASE_URL);
  const serviceKey  = cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!supabaseUrl || !serviceKey)
    return res.status(500).json({ error: "Configuration serveur manquante" });

  const supa = createClient(supabaseUrl, serviceKey);

  // 1. Trouver la signature par token
  const { data: sig, error: sigErr } = await supa
    .from("signatures")
    .select("id, devis_id, token, signe_le, nom_signataire")
    .eq("token", token)
    .single();

  if (sigErr || !sig)
    return res.status(404).json({ error: "Lien invalide ou expiré" });

  // 2. Trouver le devis avec le client — C1 : select limité aux champs nécessaires
  const { data: devis, error: devisErr } = await supa
    .from("devis")
    .select("id, user_id, numero, created_at, date_validite, tva, notes, style, statut, total_ht, total_ttc, clients(id, nom, adresse, email, telephone)")
    .eq("id", sig.devis_id)
    .single();

  if (devisErr || !devis)
    return res.status(404).json({ error: "Devis introuvable" });

  // 3. Trouver les lignes du devis
  const { data: lignes } = await supa
    .from("lignes_devis")
    .select("id, description, quantite, prix_unitaire, total, ordre")
    .eq("devis_id", devis.id)
    .order("ordre", { ascending: true });

  // 4. Trouver le profil artisan — C1 : select limité aux champs nécessaires
  const { data: artisan } = await supa
    .from("profils")
    .select("nom, adresse, telephone, siret, email, logo_url, verification_statut")
    .eq("user_id", devis.user_id)
    .single();

  // 5. Trouver les paramètres de couleur PDF
  const { data: params } = await supa
    .from("parametres")
    .select("couleur_pdf, couleurs_pdf, afficher_badge_verifie")
    .eq("user_id", devis.user_id)
    .single();

  return res.status(200).json({
    signature: sig,
    devis,
    lignes: lignes || [],
    artisan: artisan || null,
    couleur_pdf: params?.couleur_pdf || null,
    couleurs_pdf: params?.couleurs_pdf || null,
    afficher_badge_verifie: params?.afficher_badge_verifie !== undefined ? params.afficher_badge_verifie : true,
  });
}
