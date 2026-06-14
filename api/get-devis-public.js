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

  // C4 — Validation format du token
  if (typeof token !== "string" || token.length < 8 || token.length > 256 || !/^[a-zA-Z0-9_\-]+$/.test(token))
    return res.status(400).json({ error: "Format de token invalide" });

  const supabaseUrl = cleanKey(process.env.SUPABASE_URL);
  const serviceKey  = cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!supabaseUrl || !serviceKey)
    return res.status(500).json({ error: "Configuration serveur manquante" });

  const supa = createClient(supabaseUrl, serviceKey);

  // 1. Trouver la signature par token — inclut facture_id si disponible
  const { data: sig, error: sigErr } = await supa
    .from("signatures")
    .select("id, devis_id, facture_id, token, signe_le, nom_signataire, signature_data")
    .eq("token", token)
    .single();

  if (sigErr || !sig)
    return res.status(404).json({ error: "Lien invalide ou expiré" });

  // ── Branche FACTURE ────────────────────────────────────────────────────────
  if (sig.facture_id && !sig.devis_id) {
    const { data: facture, error: factureErr } = await supa
      .from("factures")
      .select("id, user_id, numero, created_at, tva, notes, style, statut, total_ht, total_ttc, clients(id, nom, adresse, email, telephone)")
      .eq("id", sig.facture_id)
      .single();

    if (factureErr || !facture)
      return res.status(404).json({ error: "Facture introuvable" });

    const { data: lignes } = await supa
      .from("lignes_facture")
      .select("id, description, quantite, prix_unitaire, total, ordre")
      .eq("facture_id", facture.id)
      .order("ordre", { ascending: true });

    const { data: artisan } = await supa
      .from("profils")
      .select("nom, adresse, telephone, siret, email, logo_url, verification_statut")
      .eq("user_id", facture.user_id)
      .single();

    // Récupérer l'email depuis auth.users si absent dans profils
    let artisanEmail = artisan?.email || null;
    if (!artisanEmail) {
      const { data: authData } = await supa.auth.admin.getUserById(facture.user_id);
      artisanEmail = authData?.user?.email || null;
    }

    const { data: params } = await supa
      .from("parametres")
      .select("couleur_pdf, couleurs_pdf, afficher_badge_verifie")
      .eq("user_id", facture.user_id)
      .single();

    return res.status(200).json({
      signature: sig,
      isFacture: true,
      devis: { ...facture, date_validite: null },
      lignes: lignes || [],
      artisan: artisan ? { ...artisan, email: artisanEmail } : { email: artisanEmail },
      couleur_pdf: params?.couleur_pdf || null,
      couleurs_pdf: params?.couleurs_pdf || null,
      afficher_badge_verifie: params?.afficher_badge_verifie !== undefined ? params.afficher_badge_verifie : true,
    });
  }

  // ── Branche DEVIS (flux existant) ─────────────────────────────────────────
  const { data: devis, error: devisErr } = await supa
    .from("devis")
    .select("id, user_id, numero, created_at, date_validite, tva, notes, style, statut, total_ht, total_ttc, clients(id, nom, adresse, email, telephone)")
    .eq("id", sig.devis_id)
    .single();

  if (devisErr || !devis)
    return res.status(404).json({ error: "Devis introuvable" });

  const { data: lignes } = await supa
    .from("lignes_devis")
    .select("id, description, quantite, prix_unitaire, total, ordre")
    .eq("devis_id", devis.id)
    .order("ordre", { ascending: true });

  const { data: artisan } = await supa
    .from("profils")
    .select("nom, adresse, telephone, siret, email, logo_url, verification_statut")
    .eq("user_id", devis.user_id)
    .single();

  // Fix 3 — email artisan depuis auth.users si absent dans profils
  let artisanEmail = artisan?.email || null;
  if (!artisanEmail) {
    const { data: authData } = await supa.auth.admin.getUserById(devis.user_id);
    artisanEmail = authData?.user?.email || null;
  }

  const { data: params } = await supa
    .from("parametres")
    .select("couleur_pdf, couleurs_pdf, afficher_badge_verifie")
    .eq("user_id", devis.user_id)
    .single();

  return res.status(200).json({
    signature: sig,
    isFacture: false,
    devis,
    lignes: lignes || [],
    artisan: artisan ? { ...artisan, email: artisanEmail } : { email: artisanEmail },
    couleur_pdf: params?.couleur_pdf || null,
    couleurs_pdf: params?.couleurs_pdf || null,
    afficher_badge_verifie: params?.afficher_badge_verifie !== undefined ? params.afficher_badge_verifie : true,
  });
}
