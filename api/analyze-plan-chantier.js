/**
 * POST /api/analyze-plan-chantier
 * Analyse un plan de chantier photographié et extrait pièces, dimensions, surfaces.
 * Modèle : claude-opus-4-5 (vision)
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

  const { imageBase64, mimeType = "image/jpeg" } = body;
  if (!imageBase64) return res.status(400).json({ ok: false, error: "imageBase64 requis" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ ok: false, error: "Clé API manquante" });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const msg = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
          {
            type: "text",
            text: `Tu es un architecte et expert en lecture de plans de construction français. Analyse ce plan de chantier ou de bâtiment et extrais toutes les informations disponibles.
Réponds UNIQUEMENT avec ce JSON valide (sans markdown ni explication) :
{
  "pieces": [{"nom": "string", "surface_m2": number, "longueur_m": number, "largeur_m": number, "hauteur_m": number}],
  "surface_habitable_m2": number,
  "surface_totale_m2": number,
  "echelle_detectee": "string ou null",
  "orientation": "N-S|E-O|variable|inconnu",
  "type_batiment": "maison|appartement|commerce|industriel|autre|inconnu",
  "nb_niveaux": number,
  "elements_detectes": ["portes", "fenêtres", "escaliers", "etc"],
  "dimensions_ext": {"longueur_m": number, "largeur_m": number},
  "observations": "string",
  "qualite_plan": "illisible|faible|moyenne|bonne",
  "suggestions_travaux": ["string"]
}
Si le plan est illisible ou incomplet, mets qualite_plan=faible et indique-le dans observations.`
          }
        ]
      }]
    });

    const raw = (msg.content[0]?.text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.json({ ok: false, error: "Format inattendu", raw: raw.slice(0, 200) });
    return res.json({ ok: true, data: JSON.parse(match[0]) });
  } catch (e) {
    console.error("[analyze-plan-chantier]", e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
