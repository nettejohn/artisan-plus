/**
 * POST /api/vision-assist
 * Endpoint unifié pour TOUTES les analyses vision IA.
 * Champ `type` : "devis-photo" | "facture-fournisseur" | "photo-measure" |
 *                "plan-chantier" | "identify-material" | "compte-rendu"
 * Modèle : claude-opus-4-7 (vision)
 */
import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://artisan-plus.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  let body = {};
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); }
  catch { return res.status(400).json({ ok: false, error: "Corps invalide" }); }

  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ ok: false, error: "Clé API manquante" });

  const { type, imageBase64, imagesBase64, mimeType = "image/jpeg" } = body;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Helper : construire un bloc image unique
  const imgBlock = (b64, mime = mimeType) => ({
    type: "image",
    source: { type: "base64", media_type: mime, data: b64 }
  });

  try {

    // ── DEVIS PHOTO ────────────────────────────────────────────────
    if (type === "devis-photo") {
      if (!imageBase64) return res.status(400).json({ ok: false, error: "imageBase64 requis" });
      const msg = await client.messages.create({
        model: "claude-opus-4-7", max_tokens: 1024,
        messages: [{ role: "user", content: [
          imgBlock(imageBase64),
          { type: "text", text: `Tu es un assistant expert en lecture de devis artisanaux français.
Analyse cette image et extrais les informations. Réponds UNIQUEMENT avec ce JSON valide :
{"client_nom":"","client_telephone":"","client_adresse":"","lignes":[{"description":"","quantite":1,"prix_unitaire":0}],"tva":20,"appliquer_tva":true,"notes":""}
Règles : prix = nombres avec point décimal, TVA = 10 ou 20, champs vides si absent.` }
        ]}]
      });
      const text = msg.content[0].text.trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return res.json({ ok: false, raw: text.slice(0,200) });
      return res.json({ ok: true, data: JSON.parse(match[0]) });
    }

    // ── FACTURE FOURNISSEUR ────────────────────────────────────────
    if (type === "facture-fournisseur") {
      if (!imageBase64) return res.status(400).json({ ok: false, error: "imageBase64 requis" });
      const msg = await client.messages.create({
        model: "claude-opus-4-7", max_tokens: 2000,
        messages: [{ role: "user", content: [
          imgBlock(imageBase64),
          { type: "text", text: `Tu es un expert comptable BTP. Analyse cette facture fournisseur et extrais TOUS les articles.
Réponds UNIQUEMENT avec ce JSON valide :
{"fournisseur":"","date":null,"numero_facture":null,"articles":[{"nom":"","quantite":1,"unite":"u","prix_unitaire":0,"prix_total_ht":0}],"total_ht":0,"tva":20,"total_ttc":0,"lisible":true,"observations":null}
Règles : prix HT, noms courts 2-5 mots, regroupe les doublons, lisible=false si illisible.` }
        ]}]
      });
      const raw = msg.content[0].text.trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return res.json({ ok: false, error: "Format inattendu", raw: raw.slice(0,200) });
      return res.json({ ok: true, data: JSON.parse(match[0]) });
    }

    // ── MESURE PHOTO ───────────────────────────────────────────────
    if (type === "photo-measure") {
      if (!imageBase64) return res.status(400).json({ ok: false, error: "imageBase64 requis" });
      const { objet_reference = "" } = body;
      const msg = await client.messages.create({
        model: "claude-opus-4-7", max_tokens: 1500,
        messages: [{ role: "user", content: [
          imgBlock(imageBase64),
          { type: "text", text: `Tu es un expert en métrés bâtiment. Analyse cette photo et estime surfaces, dimensions et longueurs.
${objet_reference ? `Objet de référence pour calibrer l'échelle : ${objet_reference}` : ""}
Réponds UNIQUEMENT avec ce JSON valide :
{"surfaces":[{"nom":"","surface_m2":0,"longueur_m":0,"largeur_m":0}],"lineaires":[{"nom":"","longueur_ml":0}],"volumes":[{"nom":"","volume_m3":0}],"total_m2":0,"precision":"faible|moyenne|bonne","notes":"","conseils":""}` }
        ]}]
      });
      const raw = msg.content[0].text.trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return res.json({ ok: false, error: "Format inattendu", raw: raw.slice(0,200) });
      return res.json({ ok: true, data: JSON.parse(match[0]) });
    }

    // ── PLAN CHANTIER ──────────────────────────────────────────────
    if (type === "plan-chantier") {
      if (!imageBase64) return res.status(400).json({ ok: false, error: "imageBase64 requis" });
      const msg = await client.messages.create({
        model: "claude-opus-4-7", max_tokens: 2000,
        messages: [{ role: "user", content: [
          imgBlock(imageBase64),
          { type: "text", text: `Tu es un architecte expert en plans de construction français. Analyse ce plan et extrais toutes les informations.
Réponds UNIQUEMENT avec ce JSON valide :
{"pieces":[{"nom":"","surface_m2":0,"longueur_m":0,"largeur_m":0,"hauteur_m":0}],"surface_habitable_m2":0,"surface_totale_m2":0,"echelle_detectee":null,"orientation":"inconnu","type_batiment":"inconnu","nb_niveaux":1,"elements_detectes":[],"dimensions_ext":{"longueur_m":0,"largeur_m":0},"observations":"","qualite_plan":"faible","suggestions_travaux":[]}` }
        ]}]
      });
      const raw = msg.content[0].text.trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return res.json({ ok: false, error: "Format inattendu", raw: raw.slice(0,200) });
      return res.json({ ok: true, data: JSON.parse(match[0]) });
    }

    // ── IDENTIFIER MATÉRIAU ────────────────────────────────────────
    if (type === "identify-material") {
      if (!imageBase64) return res.status(400).json({ ok: false, error: "imageBase64 requis" });
      const msg = await client.messages.create({
        model: "claude-opus-4-7", max_tokens: 1500,
        messages: [{ role: "user", content: [
          imgBlock(imageBase64),
          { type: "text", text: `Tu es un expert en matériaux de construction BTP. Identifie précisément le(s) matériau(x) visible(s).
Réponds UNIQUEMENT avec ce JSON valide :
{"materiaux":[{"nom":"","type":"","sous_type":"","caracteristiques":[],"usage_courant":"","prix_moyen":"","avantages":[],"inconvenients":[],"conseils_pose":"","entretien":""}],"etat_general":"inconnu","age_estime":"","recommandations":"","confiance":"faible"}` }
        ]}]
      });
      const raw = msg.content[0].text.trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return res.json({ ok: false, error: "Format inattendu", raw: raw.slice(0,200) });
      return res.json({ ok: true, data: JSON.parse(match[0]) });
    }

    // ── COMPTE-RENDU ───────────────────────────────────────────────
    if (type === "compte-rendu") {
      const { nom_chantier = "Chantier", avancement = 0, date = new Date().toLocaleDateString("fr-FR"), notes = "", statut = "" } = body;
      const photos = imagesBase64 || (imageBase64 ? [imageBase64] : []);
      if (photos.length === 0) return res.status(400).json({ ok: false, error: "Au moins une photo requise" });

      // Construire les blocs image (max 8 photos pour Claude)
      const photoBlocks = photos.slice(0, 8).map(b64 => imgBlock(b64));

      const msg = await client.messages.create({
        model: "claude-opus-4-7", max_tokens: 2000,
        messages: [{ role: "user", content: [
          ...photoBlocks,
          { type: "text", text: `Tu es un expert en rédaction de comptes-rendus de chantier pour artisans français.
Chantier : "${nom_chantier}"
Date : ${date}
Avancement : ${avancement}%
Statut : ${statut || "en cours"}
Notes de l'artisan : ${notes || "Aucune"}

En analysant les ${photos.length} photo(s) ci-dessus et les informations fournies, rédige un compte-rendu professionnel complet.
Le document doit inclure :
1. En-tête avec date et nom du chantier
2. Résumé des travaux réalisés (basé sur les photos)
3. État d'avancement détaillé
4. Observations techniques sur la qualité des travaux visibles
5. Prochaines étapes recommandées
6. Éventuels points d'attention signalés

Style : professionnel, concis, en français. Utilise des paragraphes structurés avec titres en gras.
Format : texte brut avec mise en forme Markdown (## pour titres, **gras**, listes avec -).` }
        ]}]
      });

      const texte = (msg.content[0]?.text || "").trim();
      return res.json({ ok: true, texte });
    }

    return res.status(400).json({ ok: false, error: `Type inconnu : ${type}` });

  } catch (e) {
    console.error(`[vision-assist/${type}]`, e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
