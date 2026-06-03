/**
 * POST /api/identify-material
 * Identifie un matériau de construction à partir d'une photo.
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
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
          {
            type: "text",
            text: `Tu es un expert en matériaux de construction et en BTP. Analyse cette photo et identifie précisément le ou les matériaux visibles.
Réponds UNIQUEMENT avec ce JSON valide (sans markdown ni explication) :
{
  "materiaux": [{
    "nom": "string",
    "type": "string",
    "sous_type": "string",
    "caracteristiques": ["string"],
    "usage_courant": "string",
    "prix_moyen": "string",
    "avantages": ["string"],
    "inconvenients": ["string"],
    "conseils_pose": "string",
    "entretien": "string"
  }],
  "etat_general": "neuf|bon|usé|dégradé|inconnu",
  "age_estime": "string",
  "recommandations": "string",
  "confiance": "faible|moyenne|élevée"
}
Sois précis sur les marques, normes (NF, CE), et caractéristiques techniques si visibles.`
          }
        ]
      }]
    });

    const raw = (msg.content[0]?.text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.json({ ok: false, error: "Format inattendu", raw: raw.slice(0, 200) });
    return res.json({ ok: true, data: JSON.parse(match[0]) });
  } catch (e) {
    console.error("[identify-material]", e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
